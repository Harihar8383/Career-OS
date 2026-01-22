"""
Tier 2 - Tavily Web Search Integration (YELLOW LANE)
Uses Tavily API for intelligent web search to find job postings.
More targeted than generic Google search, designed for AI agents.
"""

import os
import requests
import time
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class TavilyJobSearch:
    """Client for Tavily API to search for job postings across the web"""
    
    def __init__(self):
        self.api_key = os.getenv("TAVILY_API_KEY")
        
        if not self.api_key or self.api_key == "YOUR_TAVILY_API_KEY_HERE":
            print("⚠️ WARNING: TAVILY_API_KEY not configured. Tier 2 search will be skipped.")
            self.api_key = None
        
        self.base_url = "https://api.tavily.com/search"
        
        # Rate limiting: Conservative approach - 1 request per 2 seconds
        self.request_delay = 2.0
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
        role: str,
        location: Optional[str] = None,
        max_results: int = 20,
        log_callback=None,
        custom_query: Optional[str] = None
    ) -> List[Dict]:
        """
        Search for jobs using Tavily's AI-powered web search
        
        Args:
            role: Job title/role to search for
            location: Location filter (optional)
            max_results: Maximum number of results (default 20)
            log_callback: Function for logging
        
        Returns:
            List of job dictionaries in normalized format
        """
        if not self.api_key:
            if log_callback:
                log_callback("warning", "🟡 TIER 2 (Tavily): Skipped - API key not configured")
            return []
        
        if log_callback:
            log_callback("info", f"🟡 TIER 2 (Tavily): Searching web for '{role}' jobs...")
        
        self._rate_limit()
        
        # Build search query with job board targeting
        location_str = f" in {location}" if location and location.lower() != "anywhere" else ""
        
        # Use custom AI query if provided, else build default
        if custom_query:
            query = custom_query
            if log_callback:
                log_callback("info", f"🧠 Using AI-Optimized Query: '{query}'")
        else:
            # Target job boards and ATS systems
            query = (
                f"{role}{location_str} jobs "
                f"(site:linkedin.com OR site:naukri.com OR site:indeed.com OR "
                f"site:greenhouse.io OR site:lever.co OR site:workday.com OR "
                f"site:myworkdayjobs.com OR site:breezy.hr)"
            )

            if log_callback:
                log_callback("info", "🧠 Generating Search Query...")
                log_callback("info", f"   🔍 Query: '{query}'")
        
        try:
            payload = {
                "api_key": self.api_key,
                "query": query,
                "search_depth": "advanced",  # Deep search for better results
                "max_results": max_results,
                "include_domains": [
                    "linkedin.com",
                    "naukri.com", 
                    "indeed.com",
                    "greenhouse.io",
                    "lever.co",
                    "workday.com",
                    "myworkdayjobs.com",
                    "breezy.hr",
                    "careers.google.com",
                    "jobs.apple.com"
                ],
                "include_answer": False,  # We just want raw results
                "include_raw_content": False  # Don't need full page content
            }
            
            if log_callback:
                log_callback("info", f"   Querying Tavily with: '{query[:60]}...'")
            
            response = requests.post(
                self.base_url,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            results = data.get("results", [])
            
            if log_callback:
                log_callback("success", f"   ✓ Tavily returned {len(results)} web results")
            
            # Normalize Tavily results
            jobs = []
            for result in results:
                normalized_job = self._normalize_result(result, role)
                if normalized_job:
                    jobs.append(normalized_job)
            
            if log_callback:
                log_callback("success", f"🟡 TIER 2 (Tavily) Complete: Extracted {len(jobs)} job postings")
            
            return jobs
            
        except requests.exceptions.RequestException as e:
            if log_callback:
                log_callback("error", f"   ✗ Tavily API error: {str(e)}")
            return []
        except Exception as e:
            if log_callback:
                log_callback("error", f"   ✗ Unexpected Tavily error: {str(e)}")
            return []
    
    def _normalize_result(self, result: Dict, role: str) -> Optional[Dict]:
        """
        Normalize Tavily search result to job schema
        
        Args:
            result: Raw result from Tavily API
            role: Job role being searched (for title fallback)
        
        Returns:
            Normalized job dict or None if not a valid job posting
        """
        try:
            url = result.get("url", "")
            title = result.get("title", "")
            content = result.get("content", "")
            
            # Skip if missing critical data
            if not url or not title:
                return None
            
            # --- ULTRA-AGGRESSIVE FILTERING ---
            title_lower = title.lower()
            desc_lower = (result.get("content", "") or "").lower()
            
            # 1. Reject generic "Category Jobs" titles
            # Real: "Software Engineer" | Bad: "Software Engineer Jobs"
            if title_lower.endswith(" jobs") or title_lower.endswith(" vacancies") or title_lower.endswith(" careers"):
                return None

            # 2. Reject titles starting with numbers (e.g. "74881 Software Jobs") or "Apply to"
            if title[0].isdigit() or title_lower.startswith("apply to"):
                return None
                
            # 3. Scan DESCRIPTION for aggregator signals
            # "Apply To 103475 Software Engineer Jobs", "Browse X jobs"
            aggregator_content_patterns = [
                "apply to", "listed on", "available on", "browse", "view all",
                "jobs available", "job vacancies", "search results", 
                "matching jobs", "jobs in"
            ]
            
            # If description starts with "Apply to X jobs", it's definitely bad
            if any(desc_lower.startswith(p) for p in aggregator_content_patterns):
                return None
                
            # If description contains large numbers near "jobs" (e.g. "149 in IBM")
            # Heuristic: If it talks about multiple companies in the first few words
            if " in " in desc_lower[:50] and "," in desc_lower[:50]:
                return None


            seo_patterns = [
                "jobs in ", "vacancies in ", "openings in ", 
                "hiring now in ", "salary in ", "career in ",
                "recruitment in ", "employment in ", "job vacancies"
            ]
            if any(p in title_lower for p in seo_patterns):
                # Exception: "Software Engineer - Jobs in Bangalore" is bad, but "Head of Jobs in AI" (rare) might be okay.
                # Usually "Jobs in" is a strong signal of an aggregator page.
                return None

            # 4. Exclude explicit aggregator phrases
            aggregator_phrases = [
                "apply to", "register for", "login to", "upload resume",
                "create alert", "similar jobs", "recommended jobs",
                "current job openings", "view all", "browse jobs",
                "job search", "found 3 jobs"
            ]
            if any(p in title_lower for p in aggregator_phrases):
                return None

            # 5. Filter out search result parameters in URL
            url_lower = url.lower()
            bad_url_patterns = [
                "search?", "q=", "query=", "keywords=", "sort=", 
                "filter=", "page=", "jobs-in-", "jobs_in_",
                "/directory/", "/browse/", "/categories/"
            ]
            if any(p in url_lower for p in bad_url_patterns):
                return None
            
            # Try to infer if this is actually a job posting
            # Must have strong indicators in URL or Title
            job_indicators = ["job", "career", "position", "role", "hiring", "apply", "opening", "vacancy", "develop", "engin"]
            if not any(indicator in title_lower or indicator in url_lower for indicator in job_indicators):
                return None
            
            # Extract company from URL or title
            company = self._extract_company(url, title)
            
            # Build normalized job
            normalized = {
                "title": self._clean_title(title, role),
                "company": company,
                "location": "See job posting",  # Tavily doesn't provide structured location
                "applyLink": url,
                "description": content[:500] if content else "",
                "salary": "Not disclosed",
                "source": "tavily_web_search",
                "tier": "tier2_yellow",
                "postedDate": "",
                "jobType": "Full-time",
                "category": role,
            }
            
            return normalized
            
        except Exception as e:
            print(f"   [Tavily] Error normalizing result: {e}")
            return None
    
    def _extract_company(self, url: str, title: str) -> str:
        """Extract company name from URL or title"""
        # Try to extract from URL domain
        if "linkedin.com" in url:
            return "LinkedIn Job Posting"
        elif "naukri.com" in url:
            return "Naukri.com Posting"
        elif "indeed.com" in url:
            return "Indeed Posting"
        elif "greenhouse.io" in url:
            # Extract company from greenhouse subdomain
            if url.startswith("https://"):
                parts = url.split("//")[1].split(".")
                if len(parts) > 0:
                    return parts[0].replace("-", " ").title()
        elif "lever.co" in url:
            # Extract from lever URL pattern
            if "/lever.co/" in url:
                parts = url.split("/")
                for i, part in enumerate(parts):
                    if part == "lever.co" and i > 0:
                        return parts[i-1].replace("-", " ").title()
        
        # Fallback: try to extract from title
        if " at " in title:
            return title.split(" at ")[-1].strip()
        elif " - " in title:
            parts = title.split(" - ")
            if len(parts) > 1:
                return parts[-1].strip()
        
        return "See job posting"
    
    def _clean_title(self, title: str, role: str) -> str:
        """Clean job title by removing company name suffixes"""
        # Remove common patterns
        for pattern in [" - ", " | ", " at "]:
            if pattern in title:
                title = title.split(pattern)[0]
                break
        
        # If title is too generic, use role
        if len(title.strip()) < 3:
            return role
        
        return title.strip()


# Test function
if __name__ == "__main__":
    def test_log(level, message):
        print(f"[{level.upper()}] {message}")
    
    client = TavilyJobSearch()
    jobs = client.search_jobs(
        role="Data Scientist",
        location="Bangalore",
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
            print(f"   Link: {job['applyLink'][:60]}...")
