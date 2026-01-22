"""
Adzuna API Integration for Job Hunter Agent
Fetches jobs from Adzuna API and returns standardized job dictionaries
"""

import os
import requests
from typing import List, Dict, Optional


def fetch_adzuna_jobs(role: str, location: str, limit: int = 20) -> List[Dict]:
    """
    Fetch jobs from Adzuna API
    
    Args:
        role: Job role/title to search for
        location: Location to search in (e.g., "Remote", "New York", "US")
        limit: Maximum number of results to fetch (default 20)
    
    Returns:
        List of job dictionaries with standardized fields:
        {
            'title': str,
            'company': str,
            'location': str,
            'url': str,
            'source': 'adzuna',
            'description': str (optional),
            'salary': str (optional)
        }
    """
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    
    if not app_id or not app_key:
        print("   [adzuna] ⚠️ Warning: ADZUNA_APP_ID or ADZUNA_APP_KEY not found in .env")
        return []
    
    # Adzuna API endpoint - using US as default country
    # Format: https://api.adzuna.com/v1/api/jobs/{country}/search/{page}
    country = "us"  # Can be made configurable
    page = 1
    
    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"
    
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": limit,
        "what": role,  # Job title/keywords
        "where": location,  # Location
        "content-type": "application/json"
    }
    
    try:
        print(f"   [adzuna] Searching for '{role}' in '{location}'...")
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        results = data.get("results", [])
        
        print(f"   [adzuna] Found {len(results)} jobs from Adzuna API")
        
        # Standardize job data
        standardized_jobs = []
        for job in results:
            standardized_job = {
                "title": job.get("title", "N/A"),
                "company": job.get("company", {}).get("display_name", "N/A"),
                "location": job.get("location", {}).get("display_name", location),
                "url": job.get("redirect_url", ""),
                "source": "adzuna",
                "description": job.get("description", ""),
                "salary": f"${job.get('salary_min', 0)}-${job.get('salary_max', 0)}" if job.get('salary_min') else None
            }
            standardized_jobs.append(standardized_job)
        
        return standardized_jobs
        
    except requests.exceptions.RequestException as e:
        print(f"   [adzuna] ❌ Error fetching from Adzuna API: {e}")
        return []
    except Exception as e:
        print(f"   [adzuna] ❌ Unexpected error: {e}")
        return []
