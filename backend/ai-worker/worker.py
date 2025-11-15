import pika
import os
import sys
import time
import json
import requests
import pdfplumber
import docx
import io
import re
from dotenv import load_dotenv
import google.generativeai as genai
from pymongo import MongoClient
from pymongo.server_api import ServerApi

# --- CONFIGURATION (Unchanged) ---
load_dotenv()
MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
RABBITMQ_URI = os.getenv("RABBITMQ_URI")
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
RESUME_QUEUE_NAME = "resume_processing_queue"
JD_QUEUE_NAME = "jd_analysis_queue"

# --- PROMPT TEMPLATES (Resume - Updated) ---
VERIFICATION_PROMPT = """
You are an assistant that inspects a document and determines whether it is a professional resume/CV.
Return only a single JSON object in a ```json ... ``` code block.
{{"is_resume": true/false, "confidence": 0-1, "reasons": ["list of short reasons"]}}

Document text:
\"\"\"
{document_text}
\"\"\"
"""

EXTRACTION_PROMPT = """
You are an expert resume parsing agent. Your sole task is to extract structured information from the resume text provided.
Your output MUST be only a single valid JSON object in a ```json ... ``` code block. Do not add any explanatory text.

**Required JSON Schema (Adhere strictly):**
{{
  "personal_info": {{
    "full_name": "string | null", "phone": "string | null", "email": "string | null", "location": "string | null",
    "linkedin_url": "string | null", "github_url": "string | null", "portfolio_url": "string | null"
  }},
  "education": [ {{"institution_name": "string | null", "degree": "string | null", "branch": "string | null", "start_date": "string | null", "end_date": "string | null", "gpa": "string | null", "relevant_coursework": ["string", ...] }} ],
  "skills": {{ "programming_languages": ["string", ...], "frameworks_libraries": ["string", ...], "databases": ["string", ...], "developer_tools_platforms": ["string", ...], "other_tech": ["string", ...] }},
  "projects": [ {{"title": "string | null", "description": "string | null", "bullet_points": ["string", ...], "tech_stack": ["string", ...], "github_link": "string | null", "live_demo_link": "string | null" }} ],
  "experience": [ {{"role": "string | null", "company": "string | null", "location": "string | null", "start_date": "string | null", "end_date": "string | null", "description_points": ["string", ...] }} ],
  "achievements": [ {{"title": "string | null", "issuer": "string | null", "date": "string | null", "description": "string | null" }} ],
  "positions_of_responsibility": [ {{"role": "string | null", "organization": "string | null", "start_date": "string | null", "end_date": "string | null", "description_points": ["string", ...] }} ],
  "certifications": [ {{"name": "string | null", "issuer": "string | null", "issue_date": "string | null", "credential_url": "string | null" }} ],
  "publications": [ {{"title": "string | null", "conference_journal": "string | null", "status": "string | null", "link": "string | null" }} ]
}}
**Critical Extraction Rules:**
1.  **Strict Schema:** Adhere strictly to the JSON schema provided above.
2.  **Null vs. Empty:** Use `null` for missing optional string fields. Use an empty array `[]` for missing array fields.
3.  **Distinguish Experience vs. Projects:** `experience` is for professional jobs. `projects` is for personal or academic projects.
Return only the JSON in a ```json ... ``` code block.
Document:
\"\"\"
{document_text}
\"\"\"
"""

# --- NEW PROMPT TEMPLATES (JD Matcher - Updated) ---

VERIFY_JD_PROMPT = """
You are an AI assistant. Your task is to determine if the following text is a job description.
Respond only with a single, valid JSON object in a ```json ... ``` code block.
{{"is_jd": true/false, "reason": "A brief explanation for your decision."}}

Text:
\"\"\"
{document_text}
\"\"\"
"""

PARSE_JD_PROMPT = """
You are an expert parsing agent. Extract key information from this job description.
Respond only with a single, valid JSON object in a ```json ... ``` code block.
{{
  "job_title": "string | null",
  "company": "string | null",
  "experience_level": "string | null (e.g., 'Senior', '5+ years', 'Entry-level')",
  "hard_skills": ["list", "of", "key", "technical", "skills", "and", "keywords"],
  "soft_skills": ["list", "of", "soft", "skills", "e.g.", "communication"],
  "qualifications": ["list", "of", "degrees", "or", "certifications", "e.g.", "MBA", "PMP"]
}}

Text:
\"\"\"
{document_text}
\"\"\"
"""

GAP_ANALYSIS_PROMPT = """
You are "The Resume Tailoring Co-pilot," a world-class career coach.
Your task is to perform a deep gap analysis between a user's professional profile and a job description (JD).
Your output MUST be only a single valid JSON object in a ```json ... ``` code block. Do not add any explanatory text.

**User's Profile (JSON):**
{user_profile_json}

**Parsed Job Description (JSON):**
{parsed_jd_json}

**Required Output Schema (JSON only):**
{{
  "match_score_percent": "integer (0-100)",
  "jd_summary": {{
    "job_title": "string",
    "company": "string",
    "experience": "string",
    "top_3_must_have_skills": ["string", "string", "string"]
  }},
  "comparison_matrix": {{
    "matched_keywords": ["Skills and experiences present in both the JD and the user's profile."],
    "missing_keywords": ["Critical skills or qualifications required by the JD that are absent from the user's profile."],
    "needs_highlighting": ["Skills present in the user's profile but not emphasized, which are crucial for the JD."]
  }},
  "actionable_todo_list": [
    {{
      "type": "Keyword Gap | Highlight Opportunity | Quantify Achievement | Hard Gap Warning | AI Summary",
      "title": "Short title (e.g., 'Missing Skill: A/B Testing')",
      "suggestion": "A specific, actionable suggestion. E.g., 'Your resume doesn't mention A/B Testing, which the JD requires. If you have this experience, add a bullet point like: \"Conducted A/B tests on new features, leading to a 10% increase in user engagement.\"'",
      "ai_generated_summary": "string | null (Only for 'AI Summary' type. This should be a 2-3 sentence professional summary tailored for this job.)"
    }},
    ...
  ]
}}
(Rest of prompt is the same as before...)
"""

# --- GEMINI AI SETUP (Unchanged) ---
try:
    if not GEMINI_API_KEY:
        raise Exception("GOOGLE_API_KEY not found in .env file.")
    genai.configure(api_key=GEMINI_API_KEY)
    ai_model_lite = genai.GenerativeModel('gemini-2.5-flash-lite')
    ai_model_pro = genai.GenerativeModel('gemini-2.5-flash')
    print("✅ Google Gemini AI Models configured (Lite & Pro).")
except Exception as e:
    print(f"❌ CRITICAL: Failed to configure Gemini AI. Check GOOGLE_API_KEY. Error: {e}")
    sys.exit(1)

# --- MONGODB SETUP (Unchanged) ---
try:
    if not MONGO_URI:
        raise Exception("MONGO_URI (or MONGODB_URI) not found in .env file.")
    mongo_client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
    mongo_client.admin.command('ping')
    mongo_db = mongo_client['career_os'] 
    partial_profiles_collection = mongo_db['partial_profiles']
    users_collection = mongo_db['users']
    jd_analysis_collection = mongo_db['jd_analyses']
    print("✅ MongoDB connected and all collections accessed.")
except Exception as e:
    print(f"❌ CRITICAL: Failed to connect to MongoDB. Check your connection string. Error: {e}")
    sys.exit(1)


# --- *** UPDATED: clean_json_response *** ---
def clean_json_response(text):
    """
    Cleans the non-JSON text from Gemini's response.
    Prioritizes finding a ```json ... ``` block.
    """
    # 1. Prioritize finding the ```json code block
    match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
    if match:
        return match.group(1).strip()

    # 2. Fallback: find the first '{' and last '}'
    start_match = re.search(r'\{', text)
    end_match = re.search(r'\}', text[::-1]) 
    if start_match and end_match:
        start_index = start_match.start()
        end_index = len(text) - end_match.start()
        json_text = text[start_index:end_index].strip()
        return json_text
        
    print(f"   [ai] ⚠️ Warning: Could not find JSON block. Returning raw text: {text[:100]}...")
    return text.strip()
# --- END OF UPDATE ---
    
def call_gemini(prompt, model, task_name="Task"):
    """Calls the specified Gemini API and returns the text response."""
    print(f"   [ai] Calling {model.model_name} for: {task_name}...")
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"   [ai] ❌ Gemini API call failed: {e}")
        raise

# --- PARSING FUNCTIONS (Unchanged) ---
def extract_text_from_pdf(file_content):
    # (code is the same)
    with io.BytesIO(file_content) as f:
        with pdfplumber.open(f) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or ""
            return text

def extract_text_from_docx(file_content):
    # (code is the same)
    with io.BytesIO(file_content) as f:
        doc = docx.Document(f)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text

# --- CALLBACK 1: RESUME PROCESSING (Unchanged) ---
def resume_callback(ch, method, properties, body):
    print("\n---------------------------------")
    print("✅ [worker] Received a new RESUME job!")
    job_data = {}
    try:
        job_data = json.loads(body.decode('utf-8'))
        user_id = job_data.get('userId')
        file_url = job_data.get('fileUrl')
        file_name = job_data.get('fileName')
        print(f"   [data] User ID: {user_id} | File: {file_name}")

        if not file_url:
            raise Exception("No fileUrl found in job data")

        # 1. Download
        print(f"   [task] Downloading file from: {file_url}")
        response = requests.get(file_url)
        response.raise_for_status()
        file_content = response.content
        print(f"   [task] File downloaded.")

        # 2. Extract Text
        raw_text = ""
        if file_name.endswith('.pdf'):
            raw_text = extract_text_from_pdf(file_content)
        elif file_name.endswith('.docx'):
            raw_text = extract_text_from_docx(file_content)
        else:
            raise Exception(f"Unsupported file type: {file_name}")

        if not raw_text or len(raw_text) < 50:
            raise Exception("Extracted text is too short or empty.")
        print(f"   [task] Text extracted successfully.")

        # 3. AI Validation (Use LITE model)
        validation_prompt = VERIFICATION_PROMPT.format(document_text=raw_text[:4000])
        validation_response_text = call_gemini(validation_prompt, model=ai_model_lite, task_name="Resume Validation")
        validation_json = json.loads(clean_json_response(validation_response_text))
        
        print(f"   [ai] Validation complete: {validation_json.get('is_resume')}")
        if not validation_json.get('is_resume'):
            raise Exception(f"Document is not a resume. Reason: {validation_json.get('reasons')}")

        # 4. AI Extraction (Use LITE model)
        extraction_prompt = EXTRACTION_PROMPT.format(document_text=raw_text)
        extraction_response_text = call_gemini(extraction_prompt, model=ai_model_lite, task_name="Structured Extraction")
        extracted_data = json.loads(clean_json_response(extraction_response_text))
        print(f"   [ai] Extraction complete! Found name: {extracted_data.get('personal_info', {}).get('full_name')}")

        # 5. Save to MongoDB
        print(f"   [db] Saving partial profile to MongoDB for user: {user_id}")
        partial_profile = {
            "user_id": user_id,
            "file_url": file_url,
            "file_name": file_name,
            "status": "validated", 
            "extracted_data": extracted_data,
            "created_at": time.time(),
        }
        partial_profiles_collection.update_one(
            {"user_id": user_id, "file_url": file_url},
            {"$set": partial_profile},
            upsert=True
        )
        print(f"   [db] ✅ Partial profile saved successfully.")
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print("✅ [worker] RESUME job finished and acknowledged.")
            
    except Exception as e:
        print(f"❌ [worker] Error processing RESUME job: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


# --- NEW HELPER: Update JD Analysis Status (Unchanged) ---
def update_analysis_status(run_id, status, error=None, results=None):
    # (code is the same)
    print(f"   [db] Updating job {run_id} to status: {status}")
    update_doc = {"$set": {"status": status, "updatedAt": time.time()}}
    if error:
        update_doc["$set"]["errorMessage"] = str(error)
    if results:
        update_doc["$set"]["analysisResults"] = results
    jd_analysis_collection.update_one({"runId": run_id}, update_doc)

# --- CALLBACK 2: JD ANALYSIS (Unchanged) ---
def jd_analysis_callback(ch, method, properties, body):
    print("\n---------------------------------")
    print("✅ [worker] Received a new JD ANALYSIS job!")
    job_data = {}
    run_id = None
    try:
        job_data = json.loads(body.decode('utf-8'))
        clerk_id = job_data.get('clerkId')
        run_id = job_data.get('runId')
        print(f"   [data] Clerk ID: {clerk_id} | Run ID: {run_id}")

        # 1. Get JD text
        analysis_doc = jd_analysis_collection.find_one({"runId": run_id, "clerkId": clerk_id})
        if not analysis_doc:
            raise Exception(f"No analysis document found for runId: {run_id}")
        jd_text = analysis_doc.get('jdText')
        if not jd_text:
             raise Exception(f"JD text is empty for runId: {run_id}")

        # 2. AI Validation (Use PRO model)
        update_analysis_status(run_id, "validating")
        verify_prompt = VERIFY_JD_PROMPT.format(document_text=jd_text[:4000])
        verify_response_text = call_gemini(verify_prompt, model=ai_model_pro, task_name="JD Validation")
        verify_json = json.loads(clean_json_response(verify_response_text))
        
        if not verify_json.get('is_jd'):
            raise Exception(f"Text is not a JD. Reason: {verify_json.get('reason')}")
        print(f"   [ai] JD Validation complete: {verify_json.get('is_jd')}")

        # 3. AI Parsing (Use PRO model)
        update_analysis_status(run_id, "parsing_jd")
        parse_prompt = PARSE_JD_PROMPT.format(document_text=jd_text)
        parse_response_text = call_gemini(parse_prompt, model=ai_model_pro, task_name="JD Parsing")
        parsed_jd = json.loads(clean_json_response(parse_response_text))
        print(f"   [ai] JD Parsing complete. Found title: {parsed_jd.get('job_title')}")

        # 4. Fetch User's Full Profile
        user_profile_doc = users_collection.find_one({"clerkId": clerk_id})
        if not user_profile_doc or 'profile' not in user_profile_doc:
            raise Exception(f"No full user profile found for clerkId: {clerk_id}")
        
        # --- Convert profile to JSON string (with default=str for safety) ---
        user_profile_json = json.dumps(user_profile_doc.get('profile', {}), default=str)
        print(f"   [db] Fetched full profile for user: {clerk_id}")

        # 5. AI Gap Analysis (Use PRO model)
        update_analysis_status(run_id, "analyzing")
        analysis_prompt = GAP_ANALYSIS_PROMPT.format(user_profile_json=user_profile_json, parsed_jd_json=json.dumps(parsed_jd, default=str))
        analysis_response_text = call_gemini(analysis_prompt, model=ai_model_pro, task_name="Gap Analysis")
        analysis_results = json.loads(clean_json_response(analysis_response_text))
        print(f"   [ai] Gap Analysis complete. Match Score: {analysis_results.get('match_score_percent')}%")

        # 6. Save final results to DB
        update_analysis_status(run_id, "complete", results=analysis_results)
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print("✅ [worker] JD ANALYSIS job finished and acknowledged.")

    except Exception as e:
        print(f"❌ [worker] Error processing JD ANALYSIS job: {e}")
        if run_id:
            update_analysis_status(run_id, "failed", error=str(e))
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

# --- RABBITMQ WORKER (Unchanged) ---
def main():
    # (code is the same)
    try:
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URI))
    except pika.exceptions.AMQPConnectionError as e:
        print(f"❌ Failed to connect to RabbitMQ: {e}\nRetrying in 5 seconds...")
        time.sleep(5)
        main()
        return

    channel = connection.channel()
    channel.queue_declare(queue=RESUME_QUEUE_NAME, durable=True)
    channel.queue_declare(queue=JD_QUEUE_NAME, durable=True)
    
    print("✅ Python Worker connected to RabbitMQ.")
    print(f"[*] Subscribed to queue: {RESUME_QUEUE_NAME}")
    print(f"[*] Subscribed to queue: {JD_QUEUE_NAME}")
    print("[*] Waiting for messages. To exit press CTRL+C")

    channel.basic_consume(queue=RESUME_QUEUE_NAME, on_message_callback=resume_callback)
    channel.basic_consume(queue=JD_QUEUE_NAME, on_message_callback=jd_analysis_callback)

    channel.start_consuming()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted. Shutting down worker.")
        sys.exit(0)