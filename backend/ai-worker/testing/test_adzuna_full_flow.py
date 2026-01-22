
import os
import requests
import json
import time
import re
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")

# --- CONFIGURATION (User Request) ---
USER_CONFIG = {
    "jobTitles": ["Fullstack Engineer", "MERN Engineer", "Fullstack Developer", "Software Engineer", "Software Developer"],
    "locationTypes": ["onsite", "hybrid"],
    "locations": ["Bengaluru", "Delhi", "Mumbai", "Gurugram"],
    "salaryRange": [500000, 5000000] # 5LPA+
}

# --- STAGE 1: QUERY GENERATION ---
def generate_queries(config):
    queries = []
    # Strategy: Broad search for each Role in each Location
    # We prioritize "Any Salary" to get max recall, then filter later
    for role in config['jobTitles']:
        for loc in config['locations']:
            queries.append({
                "what": role,
                "where": loc,
                "results_per_page": 5, # Fetch top 5 per combo to keep test fast but diverse
                "sort_by": "date",
                "max_days_old": 45
            })
    return queries

# --- STAGE 2: FETCHING ---
def fetch_jobs(queries):
    all_jobs = []
    seen_urls = set()
    
    print(f"📡 API: Firing {len(queries)} queries concurrently...")
    
    def fetch_single(params):
        if not ADZUNA_APP_ID: return []
        p = params.copy()
        p.update({
            "app_id": ADZUNA_APP_ID, 
            "app_key": ADZUNA_APP_KEY, 
            "content-type": "application/json"
        })
        try:
            r = requests.get("https://api.adzuna.com/v1/api/jobs/in/search/1", params=p)
            return r.json().get('results', [])
        except:
            return []

    # Use ThreadPool to speed up 20+ requests
    with ThreadPoolExecutor(max_workers=5) as executor:
        results_list = executor.map(fetch_single, queries)
        
    for batch in results_list:
        for job in batch:
            url = job.get('redirect_url')
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_jobs.append(job)
                
    print(f"✅ API: Retrieved {len(all_jobs)} unique raw jobs.")
    return all_jobs

# --- STAGE 3: CLEANUP (KILLSWITCH) ---
def clean_jobs(jobs, config):
    cleaned = []
    print("🧹 CLEANUP: Running Soft Killswitch & Deduplication...")
    
    # Define negative keywords (irrelevant roles)
    negative_keywords = ["sales", "marketing", "recruiter", "hr executive", "counselor", "bpo", "technician"]
    
    for job in jobs:
        title = job.get('title', '').lower()
        desc = job.get('description', '').lower()
        company = job.get('company', {}).get('display_name', '')
        
        # 1. Title Safety Check
        if any(neg in title for neg in negative_keywords):
            continue
            
        # 2. Re-verify Salary (if present)
        min_sal = config['salaryRange'][0]
        job_min = job.get('salary_min')
        if job_min and job_min < min_sal:
            # Skip if explicitly too low (allow None)
            continue
            
        cleaned.append(job)
        
    print(f"✅ CLEANUP: {len(cleaned)} jobs remained after filtering.")
    return cleaned

# --- STAGE 4: DEAD LINK CHECKER ---
def check_links(jobs):
    # Only check top candidates to save time, but here we simulate checking a batch
    print(f"🔗 LINKS: Verifying availability for {len(jobs)} jobs (Head Request)...")
    valid_jobs = []
    
    def is_alive(job):
        url = job.get('redirect_url')
        try:
            # Adzuna links are redirects. Valid if status < 400
            # Set timeout to 3s to be fast
            r = requests.head(url, timeout=3, allow_redirects=True)
            if r.status_code < 400:
                return job
        except:
            pass # Treat as dead on timeout/error
        return None

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(is_alive, jobs)
        
    valid_jobs = [j for j in results if j]
    print(f"✅ LINKS: {len(valid_jobs)} jobs are active.")
    return valid_jobs

# --- STAGE 5: JD MATCHER (SCORING) ---
def score_jobs(jobs, config):
    print("🧠 MATCHER: Scoring jobs based on keywords...")
    
    target_tokens = set()
    for t in config['jobTitles']:
        target_tokens.update(t.lower().split())
    # Remove generic tokens
    target_tokens.discard("engineer")
    target_tokens.discard("developer")
    
    scored = []
    
    for job in jobs:
        score = 50 # Base Score
        text = (job.get('title', '') + " " + job.get('description', '')).lower()
        
        # Keyword Match
        matches = sum(1 for token in target_tokens if token in text)
        score += matches * 10
        
        # Freshness Bonus
        # (Assuming we have date, simplistic check)
        
        # Salary Bonus
        if job.get('salary_min'):
            score += 15
            
        # Cap at 100
        job['matchScore'] = min(score, 100)
        scored.append(job)
        
    # Sort
    scored.sort(key=lambda x: x['matchScore'], reverse=True)
    return scored

# --- MAIN FLOW ---
def run_full_flow():
    log_file = os.path.join(os.path.dirname(__file__), "full_simulation_log.txt")
    with open(log_file, "w", encoding="utf-8") as f:
        def log(msg):
            print(msg)
            f.write(msg + "\n")
            
        queries = generate_queries(USER_CONFIG)
        
        log(f"📡 API: Firing {len(queries)} queries concurrently...")
        raw_jobs = fetch_jobs(queries)
        log(f"✅ API: Retrieved {len(raw_jobs)} unique raw jobs.")
        
        if not raw_jobs:
            log("❌ No jobs found.")
            return

        log("🧹 CLEANUP: Running Soft Killswitch & Deduplication...")
        clean_pool = clean_jobs(raw_jobs, USER_CONFIG)
        log(f"✅ CLEANUP: {len(clean_pool)} jobs remained after filtering.")
        
        log("🧠 MATCHER: Scoring jobs based on keywords...")
        scored_pool = score_jobs(clean_pool, USER_CONFIG)
        
        top_candidates = scored_pool[:20]
        log(f"🔗 LINKS: Verifying availability for {len(top_candidates)} jobs (Head Request)...")
        verified_jobs = check_links(top_candidates)
        log(f"✅ LINKS: {len(verified_jobs)} jobs are active.")
        
        final_top_10 = verified_jobs[:10]
        
        log(f"\n🏆 FINAL TOP 10 RECOMMENDATIONS:")
        for i, job in enumerate(final_top_10, 1):
            log(f"\n{i}. {job['title']} ({job['matchScore']}%)")
            log(f"   🏢 {job.get('company', {}).get('display_name')}")
            log(f"   📍 {job.get('location', {}).get('display_name')}")
            log(f"   💰 {job.get('salary_min') or 'Not Disclosed'}")
            log(f"   🔗 {job.get('redirect_url')}")
            
    print(f"\n✨ Log saved to {log_file}")

if __name__ == "__main__":
    run_full_flow()
