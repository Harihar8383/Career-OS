# backend/ai-worker/action_card_tools.py
"""
AI Mentor v3.0 - Action Card Tools
Tools that return Action Card payloads for generative UI navigation
"""

import json
from langchain.tools import tool


@tool
def query_leetcode_questions(company: str = None, tag: str = None, limit: int = 3) -> str:
    """
    Query LeetCode interview questions from the database.
    Use this when user asks for interview prep, coding questions, or company-specific questions.
    
    Args:
        company: Company name (e.g., "Google", "Amazon")
        tag: Question tag/category (e.g., "Arrays", "Dynamic Programming", "Leadership Principles")
        limit: Number of questions to return (default: 3)
    
    Returns:
        JSON string of interview questions
    """
    try:
        from pymongo import MongoClient
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        mongo_client = MongoClient(os.getenv("MONGODB_URI") or os.getenv("MONGO_URI"))
        db = mongo_client['career_os']
        
        print(f"   [tool:query_leetcode_questions] Called with company='{company}', tag='{tag}', limit={limit}")
        
        # Build query filter
        query_filter = {}
        if company:
            query_filter["company"] = {"$regex": company, "$options": "i"}
        if tag:
            query_filter["tags"] = {"$regex": tag, "$options": "i"}
        
        # Query database
        questions = list(db['leetcode_questions'].find(
            query_filter,
            {"question": 1, "difficulty": 1, "tags": 1, "company": 1}
        ).limit(limit))
        
        if not questions:
            return json.dumps({
                "message": f"No questions found for company='{company}', tag='{tag}'. Try using internet_search instead.",
                "questions": []
            })
        
        print(f"   [tool:query_leetcode_questions] Returning {len(questions)} questions")
        return json.dumps({"questions": questions}, default=str)
        
    except Exception as e:
        print(f"   [tool:query_leetcode_questions] Error: {str(e)}")
        return json.dumps({"error": str(e)})


@tool
def open_job_hunter(role: str, location: str = None, minSalary: int = None) -> str:
    """
    Return an Action Card to open Job Hunter with pre-filled criteria.
    Use this when user asks to find/search jobs, NOT when checking application status.
    
    Args:
        role: Job role/title (e.g., "React Developer", "Senior SWE")
        location: Location (e.g., "London", "Remote", "Delhi or Gurgaon")
        minSalary: Minimum salary in INR (e.g., 1000000 for 10 LPA)
    
    Returns:
        JSON Action Card payload
    """
    # Parse multiple locations from natural language
    locations = []
    if location:
        # Split by common separators: "or", "and", ","
        import re
        location_parts = re.split(r'\s+(?:or|and|,)\s+|\s*,\s*', location, flags=re.IGNORECASE)
        locations = [loc.strip().title() for loc in location_parts if loc.strip()]
    
    # Parse salary - handle "10+ lpa" style inputs
    # If minSalary is provided in LPA format, convert to proper range
    salary_range = None
    if minSalary:
        # Assume minSalary is already in INR (e.g., 1000000 for 10 LPA)
        # Set max to 50 LPA (5000000) for "X+ lpa" queries
        salary_range = [minSalary, max(minSalary * 2, 5000000)]
    
    print(f"   [tool:open_job_hunter] Creating Action Card for role='{role}', locations={locations}, minSalary={minSalary}")
    
    action_card = {
        "action": "OPEN_JOB_HUNTER",
        "label": f"🔍 Search {role} jobs" + (f" in {', '.join(locations[:2])}" if locations else ""),
        "payload": {
            "role": role,
            "locations": locations if locations else [],  # Array of locations
            "salaryRange": salary_range  # [min, max] range
        }
    }
    
    return json.dumps({"action_card": action_card})


@tool
def open_jd_matcher(url: str, mode: str = "FULL_ANALYSIS") -> str:
    """
    Return an Action Card to open JD Matcher with a job URL.
    Use this when user asks to analyze a job posting, check ATS compatibility, or get fit score.
    
    Args:
        url: Job posting URL (e.g., "https://linkedin.com/jobs/123")
        mode: Analysis mode - "FULL_ANALYSIS" or "ATS_CHECK" (default: "FULL_ANALYSIS")
    
    Returns:
        JSON Action Card payload
    """
    print(f"   [tool:open_jd_matcher] Creating Action Card for url='{url}', mode='{mode}'")
    
    action_card = {
        "action": "OPEN_JD_MATCHER",
        "label": "📊 Analyze this job posting",
        "payload": {
            "url": url,
            "mode": mode
        }
    }
    
    return json.dumps({"action_card": action_card})
