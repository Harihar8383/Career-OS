"""
Tavily Web Search Integration for Job Hunter Agent
Uses Tavily API to search for jobs on ATS platforms (Greenhouse, Lever, etc.)
"""

import os
from tavily import TavilyClient
from typing import List, Dict


def search_with_tavily(role: str, location: str = "", limit: int = 10) -> List[Dict]:
    """
    Search for jobs using Tavily web search API with ATS-specific dorks
    
    Args:
        role: Job role/title to search for
        location: Location to filter (optional)
        limit: Maximum number of results to fetch (default 10)
    
    Returns:
        List of job dictionaries with standardized fields
    """
    api_key = os.getenv("TAVILY_API_KEY")
    
    if not api_key:
        print("   [tavily] ⚠️ Warning: TAVILY_API_KEY not found in .env")
        return []
    
    try:
        client = TavilyClient(api_key=api_key)
        
        # ATS platforms to target
        ats_platforms = [
            "greenhouse.io",
            "lever.co",
            "workday.com",
            "myworkdayjobs.com",
            "smartrecruiters.com"
        ]
        
        all_jobs = []
        
        # Search each ATS platform
        for platform in ats_platforms[:2]:  # Limit to 2 platforms to avoid excessive API calls
            # Construct search query with site operator
            if location:
                query = f'site:{platform} "{role}" "{location}"'
            else:
                query = f'site:{platform} "{role}"'
            
            print(f"   [tavily] Searching {platform} for '{role}'...")
            
            try:
                # Perform search
                response = client.search(
                    query=query,
                    max_results=min(limit // 2, 5),  # Distribute results across platforms
                    search_depth="basic"
                )
                
                results = response.get("results", [])
                print(f"   [tavily] Found {len(results)} results from {platform}")
                
                # Standardize results
                for result in results:
                    job = {
                        "title": result.get("title", "N/A"),
                        "company": extract_company_from_url(result.get("url", "")),
                        "location": location or "N/A",
                        "url": result.get("url", ""),
                        "source": f"tavily_{platform.split('.')[0]}",
                        "description": result.get("content", "")
                    }
                    all_jobs.append(job)
                    
                    if len(all_jobs) >= limit:
                        break
                        
            except Exception as e:
                print(f"   [tavily] Error searching {platform}: {e}")
                continue
            
            if len(all_jobs) >= limit:
                break
        
        print(f"   [tavily] Total jobs found: {len(all_jobs)}")
        return all_jobs
        
    except Exception as e:
        print(f"   [tavily] ❌ Error with Tavily search: {e}")
        return []


def extract_company_from_url(url: str) -> str:
    """
    Extract company name from ATS URL
    e.g., https://boards.greenhouse.io/company/jobs/123 -> company
    """
    try:
        if "greenhouse.io" in url:
            parts = url.split("greenhouse.io/")
            if len(parts) > 1:
                company = parts[1].split("/")[0]
                return company.replace("-", " ").title()
        elif "lever.co" in url:
            parts = url.split("jobs.lever.co/")
            if len(parts) > 1:
                company = parts[1].split("/")[0]
                return company.replace("-", " ").title()
        elif "myworkdayjobs.com" in url:
            parts = url.split("//")
            if len(parts) > 1:
                company = parts[1].split(".")[0]
                return company.replace("-", " ").title()
        
        return "N/A"
    except:
        return "N/A"
