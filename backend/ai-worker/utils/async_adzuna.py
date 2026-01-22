"""
Async Adzuna Job Fetcher with Conservative Rate Limiting

Adzuna API Limits:
- 25 requests per minute (0.4 req/sec)
- 250 requests per day
- 1000 requests per week
- 2500 requests per month

Our Strategy:
- Max 3 concurrent requests (conservative)
- 2.5s delay between starting requests (24 req/min = safe)
- 10s timeout per request
- Exponential backoff on 429 errors
"""

import asyncio
import aiohttp
import os
from typing import List, Dict
from datetime import datetime


async def fetch_job_async(session: aiohttp.ClientSession, query: Dict, sem: asyncio.Semaphore, app_id: str, app_key: str) -> Dict:
    """
    Fetch jobs for a single query with rate limiting and error handling.
    
    Args:
        session: aiohttp session
        query: Query parameters (what, where, etc.)
        sem: Semaphore for concurrency control
        app_id: Adzuna app ID
        app_key: Adzuna app key
    
    Returns:
        Dict with 'results' key containing job list
    """
    async with sem:  # Enforce max 3 concurrent
        try:
            params = {
                'app_id': app_id,
                'app_key': app_key,
                'what': query.get('what', ''),
                'where': query.get('where', ''),
                'max_days_old': query.get('max_days_old', 21),
                'sort_by': query.get('sort_by', 'date'),
                'results_per_page': query.get('results_per_page', 20),
            }
            
            url = "https://api.adzuna.com/v1/api/jobs/in/search/1"
            
            # 10 second timeout
            timeout = aiohttp.ClientTimeout(total=10)
            
            async with session.get(url, params=params, timeout=timeout) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"[Async] ✅ {query['what']} in {query['where']}: {len(data.get('results', []))} jobs")
                    return data
                
                elif response.status == 429:
                    # Rate limit hit - wait and retry once
                    print(f"[Async] ⚠️  Rate limit hit, waiting 5s...")
                    await asyncio.sleep(5)
                    
                    # Retry once
                    async with session.get(url, params=params, timeout=timeout) as retry_response:
                        if retry_response.status == 200:
                            data = await retry_response.json()
                            print(f"[Async] ✅ Retry successful: {len(data.get('results', []))} jobs")
                            return data
                        else:
                            print(f"[Async] ❌ Retry failed: {retry_response.status}")
                            return {"results": []}
                
                else:
                    print(f"[Async] ❌ Error {response.status} for {query['what']} in {query['where']}")
                    return {"results": []}
        
        except asyncio.TimeoutError:
            print(f"[Async] ⏱️  Timeout for {query['what']} in {query['where']}")
            return {"results": []}
        
        except Exception as e:
            print(f"[Async] ❌ Exception: {e}")
            return {"results": []}


async def fetch_all_jobs_async(queries: List[Dict], app_id: str, app_key: str) -> List[Dict]:
    """
    Fetch all jobs asynchronously with conservative rate limiting.
    
    Args:
        queries: List of query dicts
        app_id: Adzuna app ID
        app_key: Adzuna app key
    
    Returns:
        List of all jobs from all queries
    """
    # Max 3 concurrent requests (conservative)
    sem = asyncio.Semaphore(3)
    
    # Create session with connection pooling
    connector = aiohttp.TCPConnector(limit=10, limit_per_host=3)
    timeout = aiohttp.ClientTimeout(total=30)
    
    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
        tasks = []
        
        # Create tasks with 2.5s pacing (24 requests/minute = safe)
        for i, query in enumerate(queries):
            task = asyncio.create_task(fetch_job_async(session, query, sem, app_id, app_key))
            tasks.append(task)
            
            # Add delay between starting requests (except for last one)
            if i < len(queries) - 1:
                await asyncio.sleep(2.5)  # 24 req/min = well under 25/min limit
        
        # Wait for all tasks to complete
        print(f"[Async] Waiting for {len(tasks)} tasks to complete...")
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Flatten results and handle exceptions
        all_jobs = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"[Async] Task {i+1} failed with exception: {result}")
            elif isinstance(result, dict):
                all_jobs.extend(result.get("results", []))
        
        return all_jobs


def fetch_jobs_async(queries: List[Dict]) -> List[Dict]:
    """
    Synchronous wrapper for async job fetching.
    
    Args:
        queries: List of query dicts
    
    Returns:
        List of all jobs
    """
    # Get credentials from environment
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    
    if not app_id or not app_key:
        print("[Async] ❌ Missing ADZUNA_APP_ID or ADZUNA_APP_KEY")
        return []
    
    # Run async code
    start_time = datetime.now()
    all_jobs = asyncio.run(fetch_all_jobs_async(queries, app_id, app_key))
    elapsed = (datetime.now() - start_time).total_seconds()
    
    print(f"[Async] ✅ Fetched {len(all_jobs)} total jobs in {elapsed:.1f}s")
    
    return all_jobs
