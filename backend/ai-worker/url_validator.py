"""
URL Validator - Validates job URLs to filter out dead links
Checks for 404s, 410s, and "Job Closed" keywords
"""

import requests
import time
from typing import Dict, Optional, Tuple
from urllib.parse import urlparse

class URLValidator:
    """Validates job URLs to ensure they're still active"""
    
    def __init__(self):
        # Conservative rate limiting: 1 request per 2 seconds
        self.request_delay = 2.0
        self.last_request_time = 0
        
        # Headers to mimic browser
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9"
        }
        
        # Keywords that indicate a job is closed
        self.closed_keywords = [
            "job closed",
            "position filled",
            "no longer accepting",
            "application closed",
            "position is no longer available",
            "this job is no longer available",
            "expired",
            "removed",
            "404",
            "not found"
        ]
    
    def _rate_limit(self):
        """Ensure we don't exceed rate limits"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.request_delay:
            time.sleep(self.request_delay - time_since_last)
        
        self.last_request_time = time.time()
    
    def validate_url(self, url: str, timeout: int = 10) -> Tuple[bool, str]:
        """
        Validate a job URL
        
        Args:
            url: The URL to validate
            timeout: Request timeout in seconds
        
        Returns:
            (is_valid: bool, reason: str)
        """
        self._rate_limit()
        
        try:
            # First try HEAD request (faster, doesn't download full page)
            response = requests.head(
                url,
                headers=self.headers,
                timeout=timeout,
                allow_redirects=True
            )
            
            # Check status code
            if response.status_code == 404:
                return False, "404 Not Found"
            elif response.status_code == 410:
                return False, "410 Gone (Job Removed)"
            elif response.status_code >= 500:
                return False, f"Server Error ({response.status_code})"
            elif response.status_code in [403, 401]:
                # Some sites block HEAD requests, try GET
                return self._validate_with_get(url, timeout)
            
            # If HEAD succeeded, URL is likely valid
            if 200 <= response.status_code < 300:
                return True, "Valid"
            
            # For other status codes, try GET to be sure
            return self._validate_with_get(url, timeout)
            
        except requests.exceptions.Timeout:
            return False, "Timeout"
        except requests.exceptions.TooManyRedirects:
            return False, "Too many redirects"
        except requests.exceptions.RequestException as e:
            return False, f"Request error: {str(e)[:50]}"
        except Exception as e:
            return False, f"Unexpected error: {str(e)[:50]}"
    
    def _validate_with_get(self, url: str, timeout: int) -> Tuple[bool, str]:
        """Validate URL using GET request and check page content"""
        try:
            response = requests.get(
                url,
                headers=self.headers,
                timeout=timeout,
                allow_redirects=True
            )
            
            # Check status code
            if response.status_code == 404:
                return False, "404 Not Found"
            elif response.status_code == 410:
                return False, "410 Gone"
            elif response.status_code >= 500:
                return False, f"Server Error ({response.status_code})"
            elif response.status_code >= 400:
                return False, f"Client Error ({response.status_code})"
            
            # Check page content for "closed" keywords
            content = response.text.lower()
            for keyword in self.closed_keywords:
                if keyword in content:
                    return False, f"Job appears closed (contains '{keyword}')"
            
            return True, "Valid"
            
        except requests.exceptions.RequestException as e:
            return False, f"Request error: {str(e)[:50]}"
        except Exception as e:
            return False, f"Error: {str(e)[:50]}"
    
    def validate_job(self, job: Dict, log_callback=None) -> Optional[Dict]:
        """
        Validate a job dict and return it if valid, None otherwise
        
        Args:
            job: Job dictionary with 'applyLink' field
            log_callback: Optional logging function
        
        Returns:
            The job dict if valid, None if invalid
        """
        url = job.get("applyLink", "")
        
        if not url:
            if log_callback:
                log_callback("warning", f"   ⚠️ Skipping job (no URL): {job.get('title', 'Unknown')}")
            return None
        
        domain = urlparse(url).netloc
        if log_callback:
            # Shorten URL for display
            display_url = url if len(url) < 60 else f"{url[:57]}..."
            log_callback("info", f"   👻 Checking for Ghost Link: {domain}...")
        
        is_valid, reason = self.validate_url(url)
        
        if is_valid:
            if log_callback:
                log_callback("success", f"   ✓ Valid: {job.get('title', 'Unknown')[:50]}")
            return job
        else:
            if log_callback:
                log_callback("warning", f"   ✗ Invalid ({reason}): {job.get('title', 'Unknown')[:50]}")
            return None
    
    def batch_validate(self, jobs: list, log_callback=None, max_to_validate: int = 50) -> list:
        """
        Validate a batch of jobs
        
        Args:
            jobs: List of job dictionaries
            log_callback: Optional logging function
            max_to_validate: Maximum number of jobs to validate (to save time)
        
        Returns:
            List of valid jobs
        """
        if not jobs:
            return []
        
        if log_callback:
            log_callback("info", f"🔍 Validating URLs for {len(jobs)} jobs (max {max_to_validate})...")
        
        valid_jobs = []
        
        # Limit validation to avoid excessive requests
        jobs_to_check = jobs[:max_to_validate]
        
        for i, job in enumerate(jobs_to_check, 1):
            if log_callback and i % 5 == 0:
                log_callback("info", f"   Progress: {i}/{len(jobs_to_check)} validated...")
            
            validated_job = self.validate_job(job, log_callback)
            if validated_job:
                valid_jobs.append(validated_job)
        
        # Add remaining jobs without validation (assume valid)
        if len(jobs) > max_to_validate:
            remaining = jobs[max_to_validate:]
            valid_jobs.extend(remaining)
            if log_callback:
                log_callback("info", f"   Added {len(remaining)} jobs without validation (over limit)")
        
        if log_callback:
            log_callback("success", f"✓ Validation complete: {len(valid_jobs)} valid jobs out of {len(jobs)}")
        
        return valid_jobs


# Test function
if __name__ == "__main__":
    def test_log(level, message):
        print(f"[{level.upper()}] {message}")
    
    validator = URLValidator()
    
    # Test URLs
    test_jobs = [
        {"title": "Test Job 1", "applyLink": "https://www.google.com"},  # Valid
        {"title": "Test Job 2", "applyLink": "https://httpstat.us/404"},  # 404
        {"title": "Test Job 3", "applyLink": "https://httpstat.us/500"},  # Server error
    ]
    
    valid_jobs = validator.batch_validate(test_jobs, test_log, max_to_validate=10)
    
    print(f"\n{'='*60}")
    print(f"Valid jobs: {len(valid_jobs)} out of {len(test_jobs)}")
