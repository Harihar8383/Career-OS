"""
Job URL Validator for Job Hunter Agent
Validates job URLs by checking if they're active and not closed
"""

import requests
from typing import Optional
from bs4 import BeautifulSoup


def validate_job_url(url: str) -> bool:
    """
    Validate a job URL by performing a GET request
    
    Args:
        url: Job posting URL to validate
    
    Returns:
        True if the job is active (status 200 and no "closed" indicators)
        False if the job is closed, dead link, or unreachable
    """
    if not url or url == "N/A":
        return False
    
    # Keywords that indicate a job is closed
    closed_indicators = [
        "job closed",
        "position filled",
        "no longer accepting",
        "application closed",
        "expired",
        "not available",
        "404",
        "page not found"
    ]
    
    try:
        # Perform GET request with timeout
        response = requests.get(url, timeout=5, allow_redirects=True)
        
        # Check if status code is 200
        if response.status_code != 200:
            print(f"   [validator] ❌ Invalid URL (Status {response.status_code}): {url[:60]}...")
            return False
        
        # Parse HTML content
        soup = BeautifulSoup(response.content, 'html.parser')
        page_text = soup.get_text().lower()
        
        # Check for closed indicators in page content
        for indicator in closed_indicators:
            if indicator in page_text:
                print(f"   [validator] ❌ Job closed (found '{indicator}'): {url[:60]}...")
                return False
        
        # If we got here, the job appears to be active
        print(f"   [validator] ✅ Valid job URL: {url[:60]}...")
        return True
        
    except requests.exceptions.Timeout:
        print(f"   [validator] ⏱️ Timeout validating URL: {url[:60]}...")
        return False
    except requests.exceptions.RequestException as e:
        print(f"   [validator] ❌ Error validating URL: {url[:60]}... | {e}")
        return False
    except Exception as e:
        print(f"   [validator] ❌ Unexpected error: {url[:60]}... | {e}")
        return False


def validate_jobs_batch(jobs: list) -> list:
    """
    Validate a batch of jobs and return only the valid ones
    
    Args:
        jobs: List of job dictionaries with 'url' field
    
    Returns:
        List of valid job dictionaries
    """
    valid_jobs = []
    
    print(f"   [validator] Validating {len(jobs)} job URLs...")
    
    for job in jobs:
        url = job.get("url", "")
        if validate_job_url(url):
            valid_jobs.append(job)
    
    print(f"   [validator] ✅ {len(valid_jobs)}/{len(jobs)} jobs are valid")
    
    return valid_jobs
