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
from langchain_groq import ChatGroq
from pymongo import MongoClient
from pymongo.server_api import ServerApi

# --- CONFIGURATION ---
load_dotenv()
MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
RABBITMQ_URI = os.getenv("RABBITMQ_URI")
RESUME_QUEUE_NAME = "resume_processing_queue"
JD_QUEUE_NAME = "jd_analysis_queue"
JOB_HUNTER_QUEUE_NAME = "job_hunter_queue"

# --- PROMPT TEMPLATES (Resume) ---
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

# --- GROQ AI SETUP ---
try:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        raise Exception("GROQ_API_KEY not found in .env file.")
    
    # Initialize Groq LLM (Llama 3.3) for general worker tasks (Resume Parsing)
    worker_llm = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=GROQ_API_KEY, temperature=0.1)
    
    print("✅ Groq AI Model configured (Llama 3.3).")
except Exception as e:
    print(f"❌ CRITICAL: Failed to configure Groq AI. Check GROQ_API_KEY. Error: {e}")
    sys.exit(1)

# --- MONGODB SETUP ---
try:
    if not MONGO_URI:
        raise Exception("MONGO_URI (or MONGODB_URI) not found in .env file.")
    mongo_client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
    mongo_client.admin.command('ping')
    mongo_db = mongo_client['career_os'] 
    partial_profiles_collection = mongo_db['partial_profiles']
    users_collection = mongo_db['users']
    jd_analysis_collection = mongo_db['jd_analyses']
    hunter_sessions_collection = mongo_db['huntersessions']
    job_results_collection = mongo_db['jobresults']
    print("✅ MongoDB connected and all collections accessed.")
except Exception as e:
    print(f"❌ CRITICAL: Failed to connect to MongoDB. Check your connection string. Error: {e}")
    sys.exit(1)


# --- HELPER: Clean JSON ---
def clean_json_response(text):
    try:
        match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if match: return match.group(1).strip()
        match = re.search(r'```\s*(.*?)\s*```', text, re.DOTALL)
        if match: return match.group(1).strip()
        start_match = re.search(r'\{', text)
        end_match = re.search(r'\}', text[::-1]) 
        if start_match and end_match:
            start_index = start_match.start()
            end_index = len(text) - end_match.start()
            return text[start_index:end_index].strip()
        print(f"   [ai] ⚠️ Warning: Could not find JSON block. Returning raw text.")
        return text.strip()
    except Exception as e:
        print(f"   [ai] Error cleaning JSON: {e}")
        return text

# --- LLM HELPER ---
def call_llm(prompt, task_name="Task"):
    """Calls the Groq LLM and returns the text response."""
    print(f"   [ai] Calling Groq Llama 3 for: {task_name}...")
    try:
        response = worker_llm.invoke(prompt)
        return response.content
    except Exception as e:
        print(f"   [ai] ❌ LLM call failed: {e}")
        raise

def call_llm_with_retry(prompt, task_name="Task", max_retries=2):
    """Calls LLM with retry logic."""
    for attempt in range(max_retries + 1):
        try:
            return call_llm(prompt, task_name)
        except Exception as e:
            print(f"   [ai] Attempt {attempt+1} failed for {task_name}: {e}")
            if attempt < max_retries:
                time.sleep(2)
            else:
                raise e

# --- PARSING FUNCTIONS ---
def extract_text_from_pdf(file_content):
    with io.BytesIO(file_content) as f:
        with pdfplumber.open(f) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or ""
            return text

def extract_text_from_docx(file_content):
    with io.BytesIO(file_content) as f:
        doc = docx.Document(f)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text

# --- CALLBACK 1: RESUME PROCESSING ---
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

        # 3. AI Validation (Use Groq)
        validation_prompt = VERIFICATION_PROMPT.format(document_text=raw_text[:4000])
        validation_response_text = call_llm_with_retry(validation_prompt, task_name="Resume Validation")
        validation_json = json.loads(clean_json_response(validation_response_text))
        
        print(f"   [ai] Validation complete: {validation_json.get('is_resume')}")
        if not validation_json.get('is_resume'):
            raise Exception(f"Document is not a resume. Reason: {validation_json.get('reasons')}")

        # 4. AI Extraction (Use Groq)
        extraction_prompt = EXTRACTION_PROMPT.format(document_text=raw_text)
        extraction_response_text = call_llm_with_retry(extraction_prompt, task_name="Structured Extraction")
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

        # --- CRITICAL UPDATE: Save RAW TEXT to Users Collection ---
        print(f"   [db] Saving RAW RESUME TEXT to Users collection for user: {user_id}")
        users_collection.update_one(
            {"clerkId": user_id}, 
            {"$set": {"profile.raw_resume_text": raw_text}},
            upsert=True 
        )

        print(f"   [db] ✅ Partial profile and Raw Text saved successfully.")
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print("✅ [worker] RESUME job finished and acknowledged.")
            
    except Exception as e:
        print(f"❌ [worker] Error processing RESUME job: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


# --- HELPER: Update JD Analysis Status ---
def update_analysis_status(run_id, status, error=None, results=None):
    print(f"   [db] Updating job {run_id} to status: {status}")
    update_doc = {"$set": {"status": status, "updatedAt": time.time()}}
    if error:
        update_doc["$set"]["errorMessage"] = str(error)
    if results:
        update_doc["$set"]["analysisResults"] = results
    jd_analysis_collection.update_one({"runId": run_id}, update_doc)

# --- IMPORTS for LangGraph ---
from matcher_graph import build_matcher_graph

# --- IMPORTS for Job Hunter ---
from hunt_orchestrator import HuntOrchestrator

# --- CALLBACK 2: JD ANALYSIS ---
def jd_analysis_callback(ch, method, properties, body):
    print("\n---------------------------------")
    print("✅ [worker] Received a new JD ANALYSIS job! (LangGraph Edition)")
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

        # 2. Fetch User's Raw Resume
        user_profile_doc = users_collection.find_one({"clerkId": clerk_id})
        if not user_profile_doc or 'profile' not in user_profile_doc:
            raise Exception(f"No full user profile found for clerkId: {clerk_id}")
        
        user_raw_resume = user_profile_doc.get('profile', {}).get('raw_resume_text', "")
        if not user_raw_resume:
             print("   [warn] No raw resume text found! Using blank string.")
             user_raw_resume = "No raw resume text available."

        # 3. Invoke LangGraph
        update_analysis_status(run_id, "analyzing_with_graph")
        print("   [worker] Invoking Matcher Graph...")
        
        matcher_app = build_matcher_graph()
        initial_state = {
            "resume_text": user_raw_resume,
            "jd_text": jd_text,
            "parsed_jd": {},
            "section_scores": {},
            "keyword_gaps": {},
            "actionable_todos": {},
            "bullet_feedback": [],
            "final_result": {},
            "errors": []
        }
        
        # Invoke the graph
        final_state = matcher_app.invoke(initial_state)
        
        # Check for errors
        if final_state.get("errors"):
            print(f"   [worker] ⚠️ Graph reported errors: {final_state['errors']}")

        final_result = final_state.get("final_result", {})
        
        print(f"   [ai] Graph execution complete. Match Score: {final_result.get('match_score')}%")

        # 4. Save final results to DB
        update_analysis_status(run_id, "complete", results=final_result)
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print("✅ [worker] JD ANALYSIS job finished and acknowledged.")

    except Exception as e:
        print(f"❌ [worker] Error processing JD ANALYSIS job: {e}")
        if run_id:
            update_analysis_status(run_id, "failed", error=str(e))
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

# --- CALLBACK 3: JOB HUNTER ---
def job_hunter_callback(ch, method, properties, body):
    print("\n---------------------------------")
    print("✅ [worker] Received a new JOB HUNTER job!")
    session_id = None
    user_id = None
    
    try:
        job_data = json.loads(body.decode('utf-8'))
        session_id = job_data.get('sessionId')
        user_id = job_data.get('userId')
        criteria = job_data.get('criteria', {})
        
        print(f"   [data] Session ID: {session_id} | User ID: {user_id}")
        print(f"   [criteria] {criteria}")
        
        if not session_id or not user_id:
            raise Exception("Missing sessionId or userId in job data")
        
        # 1. Update session status to "running"
        print(f"   [db] Updating session {session_id} to 'running'")
        hunter_sessions_collection.update_one(
            {"sessionId": session_id},
            {"$set": {"status": "running"}}
        )
        
        # 2. Execute the tiered hunt using HuntOrchestrator
        print(f"   [hunter] Initializing HuntOrchestrator...")
        # Pass worker_llm for AI query generation
        orchestrator = HuntOrchestrator(rabbitmq_channel=ch, llm_client=worker_llm)
        
        print(f"   [hunter] Starting tiered job hunt...")
        hunt_result = orchestrator.execute_hunt(
            session_id=session_id,
            user_id=user_id,
            criteria=criteria
        )
        
        # 3. Save valid jobs to JobResult collection
        valid_jobs = hunt_result.get("jobs", [])
        if valid_jobs:
            print(f"   [db] Saving {len(valid_jobs)} jobs to JobResult collection...")
            for job in valid_jobs:
                # Save complete enhanced job structure (Phase 4 fields included)
                job_result_doc = {
                    "userId": user_id,
                    "sessionId": session_id,
                    
                    # Basic fields
                    "title": job.get("title"),
                    "company": job.get("company"),
                    "location": job.get("location"),
                    "description": job.get("description", ""),
                    "applyLink": job.get("redirect_url") or job.get("applyLink"),  # Handle both field names
                    "created": job.get("created"),
                    
                    # Scoring
                    "matchScore": job.get("matchScore", 0),
                    "relevance_score": job.get("relevance_score", 0),
                    
                    # Phase 4: Enhanced fields
                    "tierLabel": job.get("tierLabel", "B-Tier"),
                    "tier": job.get("tier", "B"),
                    "badges": job.get("badges", []),
                    "gapAnalysis": job.get("gapAnalysis", ""),
                    "salary": job.get("salary", "Not disclosed"),
                    "salary_min": job.get("salary_min", 0),
                    "salary_max": job.get("salary_max", 0),
                    "rank": job.get("rank", 0),
                    
                    # Metadata
                    "source": job.get("source", "adzuna"),
                    "status": "new"
                }
                
                # Use update_one with upsert to handle duplicates (by applyLink only)
                # Don't include sessionId in filter - same job can appear in multiple sessions
                job_results_collection.update_one(
                    {"applyLink": job_result_doc["applyLink"]},
                    {"$set": job_result_doc},
                    upsert=True
                )
            print(f"   [db] ✅ All jobs saved to database")
        
        # 4. Update session status to "completed"
        hunter_sessions_collection.update_one(
            {"sessionId": session_id},
            {
                "$set": {
                    "status": "completed"
                },
                "$push": {
                    "logs": f"Hunt completed: {len(valid_jobs)} jobs found using tiers: {', '.join(hunt_result.get('tierUsed', []))}"
                }
            }
        )
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print("✅ [worker] JOB HUNTER job finished and acknowledged.")

    except Exception as e:
        print(f"❌ [worker] Error processing JOB HUNTER job: {e}")
        import traceback
        traceback.print_exc()
        
        if session_id:
            hunter_sessions_collection.update_one(
                {"sessionId": session_id},
                {
                    "$set": {"status": "failed"},
                    "$push": {"logs": f"Error: {str(e)}"}
                }
            )
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


# --- RABBITMQ WORKER ---
def main():
    print("🚀 [worker] Starting CareerCLI AI Worker...")
    
    while True:
        try:
            params = pika.URLParameters(RABBITMQ_URI)
            params.heartbeat = 600 
            params.blocked_connection_timeout = 600
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            channel.queue_declare(queue=RESUME_QUEUE_NAME, durable=True)
            channel.queue_declare(queue=JD_QUEUE_NAME, durable=True)
            channel.queue_declare(queue=JOB_HUNTER_QUEUE_NAME, durable=True)
            
            print("✅ Python Worker connected to RabbitMQ.")
            print(f"[*] Subscribed to queue: {RESUME_QUEUE_NAME}")
            print(f"[*] Subscribed to queue: {JD_QUEUE_NAME}")
            print(f"[*] Subscribed to queue: {JOB_HUNTER_QUEUE_NAME}")
            print("[*] Waiting for messages. To exit press CTRL+C")

            channel.basic_qos(prefetch_count=1) 
            channel.basic_consume(queue=RESUME_QUEUE_NAME, on_message_callback=resume_callback)
            channel.basic_consume(queue=JD_QUEUE_NAME, on_message_callback=jd_analysis_callback)
            channel.basic_consume(queue=JOB_HUNTER_QUEUE_NAME, on_message_callback=job_hunter_callback)
            channel.start_consuming()

        except pika.exceptions.AMQPConnectionError as e:
            print(f"❌ [worker] RabbitMQ Connection Error: {e}")
            print("   Retrying in 5 seconds...")
            time.sleep(5)
        except pika.exceptions.StreamLostError as e:
             print(f"⚠️ [worker] Stream Lost (likely timeout): {e}")
             print("   Restarting connection in 2 seconds...")
             time.sleep(2)
        except Exception as e:
            print(f"❌ [worker] Unexpected Error: {e}")
            print("   Retrying in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted. Shutting down worker.")
        sys.exit(0)