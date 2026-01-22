"""
Link Validator using BeautifulSoup for content-based validation.
Checks if job links are active and not showing "job closed" messages.
"""

import requests
from bs4 import BeautifulSoup
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def validate_job_link(url: str, timeout: int = 5) -> bool:
    """
    Validate a job link using BeautifulSoup content analysis.
    
    Args:
        url: The job posting URL to validate
        timeout: Request timeout in seconds
        
    Returns:
        True if link is valid and job is still active, False otherwise
    """
    try:
        # First check HTTP status
        response = requests.get(url, timeout=timeout, allow_redirects=True)
        
        if response.status_code >= 400:
            logger.debug(f"Link validation failed: HTTP {response.status_code} for {url}")
            return False
        
        # Parse HTML content
        soup = BeautifulSoup(response.text, "html.parser")
        page_text = soup.get_text().lower()
        
        # Check for "job closed" kill phrases
        kill_phrases = [
            "job no longer available",
            "closed",
            "position closed",
            "this job has expired",
            "no longer accepting applications",
            "position filled"
        ]
        
        for phrase in kill_phrases:
            if phrase in page_text:
                logger.debug(f"Link validation failed: Found '{phrase}' in {url}")
                return False
        
        return True
        
    except requests.Timeout:
        logger.debug(f"Link validation failed: Timeout for {url}")
        return False
    except Exception as e:
        logger.debug(f"Link validation failed: {str(e)} for {url}")
        return False


def validate_job_links_batch(jobs: list, max_workers: int = 10) -> list:
    """
    Validate multiple job links in parallel.
    
    Args:
        jobs: List of job dicts with 'applyLink' field
        max_workers: Number of parallel workers
        
    Returns:
        List of jobs with valid links only
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    valid_jobs = []
    
    def check_job(job):
        url = job.get("applyLink")
        if not url:
            return None
        
        if validate_job_link(url):
            return job
        return None
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(check_job, job): job for job in jobs}
        
        for future in as_completed(futures):
            result = future.result()
            if result:
                valid_jobs.append(result)
    
    logger.info(f"Link validation: {len(valid_jobs)}/{len(jobs)} jobs have valid links")
    return valid_jobs
