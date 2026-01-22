"""
Tier 1 - Adzuna API Integration (GREEN LANE)
Fast, safe, API-based job search with official Adzuna credentials.
Exit Condition: If >15 valid jobs found, stop waterfall.
"""

import os
import requests
import time
import json
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class AdzunaClient:
    """Client for Adzuna API job searches"""
    
    def __init__(self):
        self.app_id = os.getenv("ADZUNA_APP_ID")
        self.app_key = os.getenv("ADZUNA_APP_KEY")
        
        if not self.app_id or not self.app_key:
            raise ValueError("ADZUNA_APP_ID and ADZUNA_APP_KEY must be set in .env")
        
        # Base URL for Adzuna API (India)
        self.base_url = "https://api.adzuna.com/v1/api/jobs/in/search"
        
        # Rate limiting: Adzuna allows 1 request/second on free tier
        self.request_delay = 1.0
        self.last_request_time = 0
    
    def _rate_limit(self):
        """Ensure we don't exceed rate limits"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.request_delay:
            time.sleep(self.request_delay - time_since_last)
        
        self.last_request_time = time.time()
    
    def search_jobs(
        self, 
        what: str,
        where: str = "",
        salary_min: Optional[int] = None,
        salary_max: Optional[int] = None,
        max_results: int = 50,
        results_per_page: int = 20,  # NEW: Configurable results per page
        sort_by: str = "date",
        max_days_old: int = 45,  # Per guide.md: 45 days for freshness
        extra_params: Optional[Dict] = None,
        log_callback=None
    ) -> List[Dict]:
        """
        Search for jobs on Adzuna
        
        Args:
            what: Job title/role to search for (required)
            where: Location (city or "remote")
            salary_min: Minimum salary in INR per year
            salary_max: Maximum salary in INR per year
            max_results: Maximum number of results to fetch (default 50)
            results_per_page: Results per page (default 20, max 50)
            sort_by: Sort order (date, salary, relevance)
            max_days_old: Max age of job posting in days
            extra_params: Additional API parameters (e.g. what_and)
            log_callback: Function to call for logging (optional)
        
        Returns:
            List of job dictionaries in normalized format
        """
        all_jobs = []
        page = 1
        
        # Respect the results_per_page parameter (max 50 per Adzuna API)
        results_per_page = min(results_per_page, 50)
        
        if log_callback:
            log_callback("info", f"🟢 TIER 1: Searching Adzuna API for '{what}'...")
        
        while len(all_jobs) < max_results:
            self._rate_limit()
            
            # Build query parameters
            # NOTE: 'page' is NOT included here because it's in the URL path (/search/{page})
            params = {
                "app_id": self.app_id,
                "app_key": self.app_key,
                "results_per_page": results_per_page,  # Use parameter value
                "what": what,  # Changed from role to what
                "content-type": "application/json",
                "sort_by": sort_by,
                "max_days_old": max_days_old
            }
            
            # Add extra parameters if provided (e.g. what_and)
            if extra_params:
                params.update(extra_params)
            
            # Add optional parameters
            if where and where.lower() != "anywhere":
                params["where"] = where
            
            # Per guide.md: Do NOT send salary params to Adzuna
            # Filtering by salary at API level hides ~50% of jobs with "Not Disclosed" salaries
            # We filter by salary locally in the soft_killswitch stage instead
            # if salary_min:
            #     params["salary_min"] = salary_min
            # if salary_max:
            #     params["salary_max"] = salary_max
            
            try:
                url = f"{self.base_url}/{page}"
                
                # DETAILED LOGGING FOR DEBUGGING
                print(f"\n[ADZUNA API] Making request to: {url}")
                print(f"[ADZUNA API] what={params.get('what')}, where={params.get('where')}")
                print(f"[ADZUNA API] sort_by={params.get('sort_by')}, max_days_old={params.get('max_days_old')}")
                print(f"[ADZUNA API] App ID present: {bool(params.get('app_id'))}")
                print(f"[ADZUNA API] App Key present: {bool(params.get('app_key'))}")
                print(f"[ADZUNA API] App ID value: {params.get('app_id')[:8]}..." if params.get('app_id') else "[ADZUNA API] App ID: MISSING!")
                
                if log_callback:
                    log_callback("info", f"   Fetching page {page} from Adzuna...")
                    log_callback("info", f"   Query: what='{params.get('what')}', where='{params.get('where')}'")
                
                response = requests.get(url, params=params, timeout=15)
                
                print(f"[ADZUNA API] Response Status: {response.status_code}")
                print(f"[ADZUNA API] Response URL: {response.url}")
                
                response.raise_for_status()
                
                data = response.json()
                results = data.get("results", [])
                
                print(f"[ADZUNA API] Results count: {len(results)}")
                print(f"[ADZUNA API] Total count from API: {data.get('count', 0)}")
                
                total_count = data.get("count", 0)
                
                if log_callback:
                    log_callback("info", f"   Response: {len(results)} jobs (Total available: {total_count})")
                
                if not results:
                    if log_callback:
                        log_callback("info", f"   No more results on page {page}")
                    break
                
                # Normalize Adzuna results to our schema
                valid_count = 0
                for job in results:
                    normalized_job = self._normalize_job(job)
                    if normalized_job:
                        all_jobs.append(normalized_job)
                        valid_count += 1
                
                if log_callback:
                    log_callback("success", f"   ✓ Parsed {valid_count} valid jobs from page {page}")
                
                # Check if we have enough jobs
                if len(all_jobs) >= max_results:
                    break
                
                # Check if this is the last page
                if page * results_per_page >= total_count:
                    break
                
                page += 1
                
                page += 1
                
            except requests.exceptions.RequestException as e:
                if log_callback:
                    log_callback("error", f"   ✗ Adzuna API error on page {page}: {str(e)}")
                break
            except Exception as e:
                if log_callback:
                    log_callback("error", f"   ✗ Unexpected error: {str(e)}")
                break
        
        # RETRY LOGIC: If 0 jobs found and filters were strict, try relaxing them
        # (Only if we used salary constraints)
        if len(all_jobs) == 0 and (salary_min or salary_max):
             if log_callback:
                 log_callback("warning", "⚠️ Strict search returned 0 jobs. Retrying without salary constraints...")
             
             # Recursively call without salary params to broaden search
             return self.search_jobs(
                 role=role,
                 location=location,
                 salary_min=None,
                 salary_max=None,
                 max_results=max_results,
                 log_callback=log_callback
             )

        if log_callback:
            log_callback("success", f"🟢 TIER 1 Complete: Adzuna returned {len(all_jobs)} jobs")
        
        return all_jobs
    
    def _normalize_job(self, job: Dict) -> Optional[Dict]:
        """
        Normalize Adzuna job format to our internal schema
        
        Args:
            job: Raw job dict from Adzuna API
        
        Returns:
            Normalized job dict or None if invalid
        """
        try:
            # Extract required fields
            title = job.get("title", "").strip()
            company = job.get("company", {}).get("display_name", "Unknown Company").strip()
            apply_link = job.get("redirect_url", "")
            
            # Skip if missing critical fields
            if not title or not apply_link:
                return None
            
            # Build normalized job object
            normalized = {
                "title": title,
                "company": company,
                "location": job.get("location", {}).get("display_name", "Not specified"),
                "applyLink": apply_link,
                "description": job.get("description", "")[:500],  # First 500 chars
                "salary": self._format_salary(job.get("salary_min"), job.get("salary_max")),
                "source": "adzuna",
                "tier": "tier1_green",
                "postedDate": job.get("created", ""),
                "jobType": job.get("contract_type", "Full-time"),
                "category": job.get("category", {}).get("label", ""),
            }
            
            return normalized
            
        except Exception as e:
            print(f"   [Adzuna] Error normalizing job: {e}")
            return None
    
    def _format_salary(self, min_salary: Optional[float], max_salary: Optional[float]) -> str:
        """Format salary range in INR lakhs"""
        if not min_salary and not max_salary:
            return "Not disclosed"
        
        if min_salary and max_salary:
            min_lakh = min_salary / 100000
            max_lakh = max_salary / 100000
            return f"₹{min_lakh:.1f}L - ₹{max_lakh:.1f}L"
        elif min_salary:
            min_lakh = min_salary / 100000
            return f"₹{min_lakh:.1f}L+"
        else:
            max_lakh = max_salary / 100000
            return f"Up to ₹{max_lakh:.1f}L"


# Test function (for development only)
if __name__ == "__main__":
    def test_log(level, message):
        print(f"[{level.upper()}] {message}")
    
    client = AdzunaClient()
    jobs = client.search_jobs(
        role="Software Engineer",
        location="Bangalore",
        max_results=20,
        log_callback=test_log
    )
    
    print(f"\n{'='*60}")
    print(f"Total jobs found: {len(jobs)}")
    if jobs:
        print(f"\nSample job:")
        print(f"  Title: {jobs[0]['title']}")
        print(f"  Company: {jobs[0]['company']}")
        print(f"  Location: {jobs[0]['location']}")
        print(f"  Salary: {jobs[0]['salary']}")
        print(f"  Link: {jobs[0]['applyLink'][:60]}...")
