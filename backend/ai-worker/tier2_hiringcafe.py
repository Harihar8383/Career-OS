"""
Tier 2 - HiringCafe API Integration (YELLOW LANE)
Uses hiring.cafe's job search API to find tech jobs.
Based on: https://github.com/umur957/hiring-cafe-job-scraper
"""

import os
import requests
import time
from typing import List, Dict, Optional
from bs4 import BeautifulSoup

class HiringCafeClient:
    """Client for HiringCafe job search API"""
    
    def __init__(self):
        self.base_url = "https://api.hiring.cafe"
        self.count_endpoint = f"{self.base_url}/api/fe/jobs/count"
        self.jobs_endpoint = f"{self.base_url}/api/fe/jobs"
        
        # Conservative rate limiting: 1 request per 3 seconds
        self.request_delay = 3.0
        self.last_request_time = 0
        
        # Headers to mimic browser requests (from HiringCafe scraper)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Origin": "https://hiring.cafe",
            "Referer": "https://hiring.cafe/"
        }
    
    def _rate_limit(self):
        """Ensure we don't exceed rate limits"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.request_delay:
            time.sleep(self.request_delay - time_since_last)
        
        self.last_request_time = time.time()
    
    def search_jobs(
        self,
        role: str,
        location: Optional[str] = None,
        max_results: int = 30,
        log_callback=None
    ) -> List[Dict]:
        """
        Search for jobs on HiringCafe
        
        Args:
            role: Job title/role to search for
            location: Location filter (optional, HiringCafe has limited location support)
            max_results: Maximum number of results (default 30)
            log_callback: Function for logging
        
        Returns:
            List of job dictionaries in normalized format
        """
        if log_callback:
            log_callback("info", f"🟡 TIER 2 (HiringCafe): Searching for '{role}' jobs...")
        
        # Build search state (from HiringCafe API structure)
        search_state = self._build_search_state(role, location)
        
        all_jobs = []
        page = 0
        page_size = 100  # HiringCafe supports up to 1000, but we'll be conservative
        
        try:
            # Get total count first
            self._rate_limit()
            count_payload = {"searchState": search_state}
            
            if log_callback:
                log_callback("info", f"   Querying HiringCafe API...")
            
            count_response = requests.post(
                self.count_endpoint,
                json=count_payload,
                headers=self.headers,
                timeout=30
            )
            
            total_jobs = 0
            if count_response.status_code == 200:
                try:
                    count_data = count_response.json()
                    total_jobs = count_data.get("total", 0)
                    if log_callback:
                        log_callback("info", f"   Found {total_jobs} total jobs on HiringCafe")
                except:
                    pass
            
            # Fetch jobs with pagination
            while len(all_jobs) < max_results:
                self._rate_limit()
                
                jobs_payload = {
                    "size": min(page_size, max_results - len(all_jobs)),
                    "page": page,
                    "searchState": search_state
                }
                
                if log_callback:
                    log_callback("info", f"   Fetching page {page}...")
                
                jobs_response = requests.post(
                    self.jobs_endpoint,
                    json=jobs_payload,
                    headers=self.headers,
                    timeout=30
                )
                
                if jobs_response.status_code != 200:
                    if log_callback:
                        log_callback("warning", f"   HiringCafe returned status {jobs_response.status_code}")
                    break
                
                jobs_data = jobs_response.json()
                
                # Extract jobs from response (handle various response formats)
                current_batch = self._extract_jobs_from_response(jobs_data)
                
                if not current_batch:
                    break
                
                # Normalize jobs
                for job in current_batch:
                    normalized_job = self._normalize_job(job)
                    if normalized_job:
                        all_jobs.append(normalized_job)
                
                if log_callback:
                    log_callback("success", f"   ✓ Page {page}: {len(current_batch)} jobs (Total: {len(all_jobs)})")
                
                # Check if we should continue
                if len(all_jobs) >= max_results or len(current_batch) < page_size:
                    break
                
                page += 1
            
            if log_callback:
                log_callback("success", f"🟡 TIER 2 (HiringCafe) Complete: Found {len(all_jobs)} jobs")
            
            return all_jobs
            
        except requests.exceptions.RequestException as e:
            if log_callback:
                log_callback("error", f"   ✗ HiringCafe API error: {str(e)}")
            return all_jobs
        except Exception as e:
            if log_callback:
                log_callback("error", f"   ✗ Unexpected HiringCafe error: {str(e)}")
            return all_jobs
    
    def _build_search_state(self, role: str, location: Optional[str]) -> Dict:
        """Build HiringCafe API search state object (matching official scraper)"""
        search_state = {
            "searchQuery": role,
            "sortBy": "default",
            "dateFetchedPastNDays": 61,
            "jobTypes": [
               "Full-time", 
               "Contract", 
               "Part-time", 
               "Internship"
            ],
            # Matches official scraper default of "Remote" + "Hybrid" + "Onsite" implicitly 
            "remoteOk": [
                "Remote only",
                "Remote", 
                "Hybrid"
            ]
        }
        
        # Add location if specified
        if location and location.lower() not in ["anywhere", "remote"]:
             # Official scraper puts location in 'locations' array
            search_state["locations"] = [location]
        
        return search_state
    
    def _extract_jobs_from_response(self, data: Dict) -> List[Dict]:
        """Extract job list from API response (handles multiple formats)"""
        if isinstance(data, list):
            return data
        
        if isinstance(data, dict):
            # Try various possible keys
            for key in ["results", "jobs", "data", "items", "content"]:
                if key in data and isinstance(data[key], list):
                    return data[key]
            
            # Handle Elasticsearch-style response
            if "hits" in data:
                hits = data["hits"]
                if isinstance(hits, dict) and "hits" in hits:
                    return [hit.get("_source", hit) for hit in hits["hits"]]
        
        return []
    
    def _normalize_job(self, job: Dict) -> Optional[Dict]:
        """Normalize HiringCafe job to our schema"""
        try:
            # HiringCafe fields (based on typical API structure)
            title = job.get("title", job.get("jobTitle", "")).strip()
            company = job.get("company", job.get("companyName", "Unknown Company")).strip()
            
            # Get apply link
            apply_link = job.get("url", job.get("jobUrl", job.get("applyLink", "")))
            if not apply_link:
                # Construct from job ID if available
                job_id = job.get("id", job.get("jobId", ""))
                if job_id:
                    apply_link = f"https://hiring.cafe/jobs/{job_id}"
            
            # Skip if missing critical fields
            if not title or not apply_link:
                return None
            
            # Clean HTML from description if present
            description = job.get("description", job.get("jobDescription", ""))
            if description:
                soup = BeautifulSoup(description, "html.parser")
                description = soup.get_text()[:500]
            
            # Build normalized job
            normalized = {
                "title": title,
                "company": company,
                "location": job.get("location", job.get("jobLocation", "Remote")),
                "applyLink": apply_link,
                "description": description,
                "salary": self._format_salary(job.get("salary"), job.get("salaryRange")),
                "source": "hiringcafe",
                "tier": "tier2_yellow",
                "postedDate": job.get("postedDate", job.get("datePosted", "")),
                "jobType": job.get("jobType", "Full-time"),
                "category": job.get("category", ""),
            }
            
            return normalized
            
        except Exception as e:
            print(f"   [HiringCafe] Error normalizing job: {e}")
            return None
    
    def _format_salary(self, salary: Optional[str], salary_range: Optional[Dict]) -> str:
        """Format salary information"""
        if isinstance(salary_range, dict):
            min_sal = salary_range.get("min", salary_range.get("minimum"))
            max_sal = salary_range.get("max", salary_range.get("maximum"))
            
            if min_sal and max_sal:
                return f"${min_sal:,} - ${max_sal:,}"
            elif min_sal:
                return f"${min_sal:,}+"
        
        if salary:
            return str(salary)
        
        return "Not disclosed"


# Test function
if __name__ == "__main__":
    def test_log(level, message):
        print(f"[{level.upper()}] {message}")
    
    client = HiringCafeClient()
    jobs = client.search_jobs(
        role="Frontend Engineer",
        max_results=10,
        log_callback=test_log
    )
    
    print(f"\n{'='*60}")
    print(f"Total jobs found: {len(jobs)}")
    if jobs:
        print(f"\nSample jobs:")
        for i, job in enumerate(jobs[:3], 1):
            print(f"\n{i}. {job['title']}")
            print(f"   Company: {job['company']}")
            print(f"   Location: {job['location']}")
            print(f"   Link: {job['applyLink'][:60]}...")
