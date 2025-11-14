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

# --- CONFIGURATION ---
load_dotenv()

# --- THIS IS THE FIX ---
# Look for 'MONGODB_URI' (like you have) first, then fall back to 'MONGO_URI'
MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") 
# ---------------------

RABBITMQ_URI = os.getenv("RABBITMQ_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
QUEUE_NAME = "resume_processing_queue"

# --- PROMPT TEMPLATES (Corrected) ---
VERIFICATION_PROMPT = """
You are an assistant that inspects a document and determines whether it is a professional resume/CV.
Return only JSON with fields: {{is_resume (true/false), confidence (0-1), reasons (list of short reasons)}}.
Document text:
\"\"\"
{document_text}
\"\"\"
"""

# --- RENOVATED EXTRACTION PROMPT ---
EXTRACTION_PROMPT = """
You are an expert resume parsing agent. Your sole task is to extract structured information from the resume text provided.
Your output MUST be only the valid JSON object and nothing else. Do not add any explanatory text, markdown formatting, or "Here is the JSON:" preamble.

**Required JSON Schema:**
{{
  "name": "string | null",
  "emails": ["string", ...],
  "phones": ["string", ...],
  "linkedin_url": "string | null",
  "github_url": "string | null",
  "headline": "string | null",
  "summary": "string | null",
  "skills": ["string", ...],
  "experience": [
    {{
      "company": "string | null",
      "role": "string | null",
      "start": "string | null",
      "end": "string | null",
      "description": "string | null"
    }},
    ...
  ],
  "education": [
    {{
      "institution": "string | null",
      "degree": "string | null",
      "start": "string | null",
      "end": "string | null"
    }},
    ...
  ]
}}

**Critical Extraction Rules:**
1.  **Strict Schema:** Adhere strictly to the JSON schema provided above.
2.  **Links:** Find `linkedin_url` and `github_url` if they are present. If not, use `null`.
3.  **Missing Fields:** If information for a top-level field (like `summary`) is not found, use `null`. If information for an array field (like `emails` or `skills`) is not found, use an empty array `[]`.
4.  **`experience` Array (Crucial):** This array MUST capture BOTH professional positions AND projects listed in the resume. Apply the following mapping:
    * **If it is a professional position/job:**
        * `company`: The name of the employer.
        * `role`: The job title (e.g., "Software Engineer Intern").
    * **If it is a project:**
        * `company`: The institution (if academic, e.g., "XYZ University") or "Personal Project" (if independent). If no affiliation, use `null`.
        * `role`: The name/title of the project (e.g., "Project: CareerOS" or "AI-Powered Job Agent").
5.  **`education` Array:** Accurately extract all educational entries.
6.  **Dates:** Extract `start` and `end` dates as strings, exactly as they appear.

Return only the JSON.

Document:
\"\"\"
{document_text}
\"\"\"
"""
# --- END OF RENOVATED PROMPT ---

# --- GEMINI AI SETUP ---
try:
    genai.configure(api_key=GEMINI_API_KEY)
    ai_model = genai.GenerativeModel('gemini-2.5-flash-lite')
    print("✅ Google Gemini AI Model configured.")
except Exception as e:
    print(f"❌ CRITICAL: Failed to configure Gemini AI. Check GEMINI_API_KEY. Error: {e}")
    sys.exit(1)

# --- MONGODB SETUP (with connection test) ---
try:
    if not MONGO_URI:
        raise Exception("MONGO_URI (or MONGODB_URI) not found in .env file.")
        
    mongo_client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
    
    # --- THIS IS THE NEW CONNECTION TEST ---
    mongo_client.admin.command('ping')
    # -------------------------------------
    
    mongo_db = mongo_client['career_os'] 
    partial_profiles_collection = mongo_db['partial_profiles']
    print("✅ MongoDB connected and pinged successfully.")
except Exception as e:
    print(f"❌ CRITICAL: Failed to connect to MongoDB. Check your connection string. Error: {e}")
    sys.exit(1)


def clean_json_response(text):
    """Cleans the non-JSON text from Gemini's response."""
    match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
    if match:
        return match.group(1)
    # Handle the case where the AI *only* returns JSON
    text = text.strip()
    if text.startswith('{') and text.endswith('}'):
        return text
    return text # Fallback, though the prompt strongly forbids this
    
def call_gemini(prompt, task_name="Task"):
    """Calls the Gemini API and returns the text response."""
    print(f"   [ai] Calling Gemini for: {task_name}...")
    try:
        response = ai_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"   [ai] ❌ Gemini API call failed: {e}")
        raise

# --- PARSING FUNCTIONS (Unchanged) ---
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

# --- MAIN PROCESSING LOGIC (Unchanged) ---
def process_resume(job_data):
    user_id = job_data.get('userId')
    file_url = job_data.get('fileUrl')
    file_name = job_data.get('fileName')

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

    # 3. AI Validation
    validation_prompt = VERIFICATION_PROMPT.format(document_text=raw_text[:4000])
    validation_response_text = call_gemini(validation_prompt, "Resume Validation")
    validation_json = json.loads(clean_json_response(validation_response_text))
    
    print(f"   [ai] Validation complete: {validation_json}")
    if not validation_json.get('is_resume'):
        raise Exception(f"Document is not a resume. Reason: {validation_json.get('reasons')}")

    # 4. AI Extraction
    extraction_prompt = EXTRACTION_PROMPT.format(document_text=raw_text)
    extraction_response_text = call_gemini(extraction_prompt, "Structured Extraction")
    extracted_data = json.loads(clean_json_response(extraction_response_text))
    print(f"   [ai] Extraction complete! Found name: {extracted_data.get('name')}")

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
    
    return True

# --- RABBITMQ WORKER (Unchanged) ---
def main():
    try:
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URI))
    except pika.exceptions.AMQPConnectionError as e:
        print(f"❌ Failed to connect to RabbitMQ: {e}\nRetrying in 5 seconds...")
        time.sleep(5)
        main()
        return

    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_NAME, durable=True)
    print("✅ Python Worker connected to RabbitMQ.")
    print("[*] Waiting for messages. To exit press CTRL_C")

    def callback(ch, method, properties, body):
        print("\n---------------------------------")
        print("✅ [worker] Received a new job!")
        job_data = {}
        try:
            job_data = json.loads(body.decode('utf-8'))
            print(f"   [data] User ID: {job_data.get('userId')}")
            print(f"   [data] File Name: {job_data.get('fileName')}")

            process_resume(job_data) 

            ch.basic_ack(delivery_tag=method.delivery_tag)
            print("✅ [worker] Job finished and acknowledged.")
            
        except Exception as e:
            print(f"❌ [worker] Error processing job: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)
    channel.start_consuming()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted. Shutting down worker.")
        sys.exit(0)