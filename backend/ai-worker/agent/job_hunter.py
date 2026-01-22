"""
Job Hunter Agent - Tiered Waterfall Dispatcher
Implements risk-aware job search strategy across multiple tiers
"""

import os
import time
from typing import Dict, List
from pymongo import MongoClient
from pymongo.server_api import ServerApi

# Import tools
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from tools.adzuna import fetch_adzuna_jobs
from tools.tavily_search import search_with_tavily
from tools.validator import validate_jobs_batch


def push_log_to_session(session_id: str, message: str, db):
    """
    Push a log message to the HunterSession in MongoDB in real-time
    
    Args:
        session_id: The session ID
        message: Log message to push
        db: MongoDB database instance
    """
    try:
        timestamp = time.time()
        db['huntersessions'].update_one(
            {"_id": session_id},
            {
                "$push": {
                    "logs": {
                        "timestamp": timestamp,
                        "message": message
                    }
                }
            }
        )
        print(f"   [logger] 📝 {message}")
    except Exception as e:
        print(f"   [logger] ⚠️ Failed to log to MongoDB: {e}")


def hunt_jobs(session_id: str, role: str, location: str, max_results: int = 20) -> Dict:
    """
    Main dispatcher for job hunting with tiered waterfall logic
    
    Strategy:
    1. Tier 1: Adzuna API (Safe, free tier available)
    2. Tier 2: Tavily Search with ATS dorks (Medium cost)
    3. Tier 3: JobSpy scraper (High risk - IP ban possible)
    
    Args:
        session_id: Unique session ID from MongoDB
        role: Job role/title to search for
        location: Location to search in
        max_results: Target number of valid jobs to find
    
    Returns:
        Dictionary with search results and metadata
    """
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
    if not mongo_uri:
        raise Exception("MONGODB_URI not found in environment variables")
    
    mongo_client = MongoClient(mongo_uri, server_api=ServerApi('1'))
    db = mongo_client['career_os']
    
    # Initialize result tracking
    all_valid_jobs = []
    tiers_used = []
    
    push_log_to_session(session_id, f"🎯 Starting job hunt: '{role}' in '{location}'", db)
    push_log_to_session(session_id, f"Target: {max_results} valid jobs", db)
    
    # ==================== TIER 1: ADZUNA API ====================
    try:
        push_log_to_session(session_id, "📡 Tier 1: Querying Adzuna API...", db)
        
        adzuna_jobs = fetch_adzuna_jobs(role, location, limit=max_results)
        push_log_to_session(session_id, f"Found {len(adzuna_jobs)} jobs from Adzuna", db)
        
        if adzuna_jobs:
            push_log_to_session(session_id, "🔍 Validating Adzuna URLs...", db)
            valid_adzuna = validate_jobs_batch(adzuna_jobs)
            all_valid_jobs.extend(valid_adzuna)
            tiers_used.append("adzuna")
            
            push_log_to_session(
                session_id, 
                f"✅ Tier 1 complete: {len(valid_adzuna)} valid jobs", 
                db
            )
        
        # Check if we have enough jobs
        if len(all_valid_jobs) >= max_results:
            push_log_to_session(
                session_id, 
                f"🎉 Target reached! Found {len(all_valid_jobs)} valid jobs from Tier 1", 
                db
            )
            return finalize_results(session_id, all_valid_jobs[:max_results], tiers_used, db)
    
    except Exception as e:
        push_log_to_session(session_id, f"⚠️ Tier 1 error: {str(e)}", db)
    
    # ==================== TIER 2: TAVILY SEARCH ====================
    try:
        remaining_needed = max_results - len(all_valid_jobs)
        push_log_to_session(
            session_id, 
            f"📊 Tier 1 insufficient. Need {remaining_needed} more jobs.", 
            db
        )
        push_log_to_session(session_id, "🌐 Tier 2: Searching with Tavily (ATS platforms)...", db)
        
        tavily_jobs = search_with_tavily(role, location, limit=remaining_needed * 2)
        push_log_to_session(session_id, f"Found {len(tavily_jobs)} jobs from Tavily", db)
        
        if tavily_jobs:
            push_log_to_session(session_id, "🔍 Validating Tavily URLs...", db)
            valid_tavily = validate_jobs_batch(tavily_jobs)
            all_valid_jobs.extend(valid_tavily)
            tiers_used.append("tavily")
            
            push_log_to_session(
                session_id, 
                f"✅ Tier 2 complete: {len(valid_tavily)} valid jobs", 
                db
            )
        
        # Check if we have enough jobs now
        if len(all_valid_jobs) >= max_results:
            push_log_to_session(
                session_id, 
                f"🎉 Target reached! Found {len(all_valid_jobs)} valid jobs (Tier 1 + 2)", 
                db
            )
            return finalize_results(session_id, all_valid_jobs[:max_results], tiers_used, db)
    
    except Exception as e:
        push_log_to_session(session_id, f"⚠️ Tier 2 error: {str(e)}", db)
    
    # ==================== TIER 3: JOBSPY SCRAPER ====================
    try:
        remaining_needed = max_results - len(all_valid_jobs)
        push_log_to_session(
            session_id, 
            f"📊 Tier 2 insufficient. Need {remaining_needed} more jobs.", 
            db
        )
        push_log_to_session(
            session_id, 
            "⚠️ Tier 3: Activating JobSpy scraper (RISK: Potential IP ban)", 
            db
        )
        
        from jobspy import scrape_jobs
        
        # Use JobSpy to scrape LinkedIn and Indeed
        push_log_to_session(session_id, "🔧 Scraping LinkedIn and Indeed...", db)
        
        jobspy_results = scrape_jobs(
            site_name=["linkedin", "indeed"],
            search_term=role,
            location=location,
            results_wanted=remaining_needed,
            hours_old=72,  # Last 3 days
            country_indeed="USA"
        )
        
        if jobspy_results is not None and len(jobspy_results) > 0:
            # Convert to our standard format
            jobspy_jobs = []
            for _, row in jobspy_results.iterrows():
                job = {
                    "title": str(row.get("title", "N/A")),
                    "company": str(row.get("company", "N/A")),
                    "location": str(row.get("location", location)),
                    "url": str(row.get("job_url", "")),
                    "source": f"jobspy_{row.get('site', 'unknown')}",
                    "description": str(row.get("description", ""))
                }
                jobspy_jobs.append(job)
            
            push_log_to_session(session_id, f"Found {len(jobspy_jobs)} jobs from JobSpy", db)
            
            push_log_to_session(session_id, "🔍 Validating JobSpy URLs...", db)
            valid_jobspy = validate_jobs_batch(jobspy_jobs)
            all_valid_jobs.extend(valid_jobspy)
            tiers_used.append("jobspy")
            
            push_log_to_session(
                session_id, 
                f"✅ Tier 3 complete: {len(valid_jobspy)} valid jobs", 
                db
            )
        
    except ImportError:
        push_log_to_session(session_id, "⚠️ JobSpy not available, skipping Tier 3", db)
    except Exception as e:
        push_log_to_session(session_id, f"⚠️ Tier 3 error: {str(e)}", db)
    
    # ==================== FINALIZE RESULTS ====================
    final_count = len(all_valid_jobs)
    
    if final_count == 0:
        push_log_to_session(
            session_id, 
            "❌ No valid jobs found across all tiers", 
            db
        )
    elif final_count < max_results:
        push_log_to_session(
            session_id, 
            f"⚠️ Only found {final_count}/{max_results} valid jobs (all tiers exhausted)", 
            db
        )
    else:
        push_log_to_session(
            session_id, 
            f"🎉 Hunt complete! Found {final_count} valid jobs", 
            db
        )
    
    return finalize_results(session_id, all_valid_jobs[:max_results], tiers_used, db)


def finalize_results(session_id: str, valid_jobs: List[Dict], tiers_used: List[str], db) -> Dict:
    """
    Finalize and return hunt results
    """
    result = {
        "session_id": session_id,
        "total_found": len(valid_jobs),
        "valid_jobs": valid_jobs,
        "tiers_used": tiers_used,
        "status": "complete"
    }
    
    push_log_to_session(
        session_id, 
        f"✅ Hunt finished. Tiers used: {', '.join(tiers_used)}", 
        db
    )
    
    return result
