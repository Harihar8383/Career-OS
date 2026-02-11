# backend/ai-worker/mentor_tools.py
import os
import json
from langchain.tools import tool
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

mongo_client = MongoClient(os.getenv("MONGODB_URI") or os.getenv("MONGO_URI"))
db = mongo_client['career_os']

@tool
def vector_search_jobs(query: str, user_id: str) -> str:
    """
    Search user's tracked jobs using semantic search.
    Use this when user asks about application status, specific companies, or job types.
    
    Args:
        query: Search query (e.g., "Google", "Big Tech", "remote jobs")
        user_id: User's Clerk ID
    
    Returns:
        JSON string of matching jobs
    """
    try:
        print(f"   [tool:vector_search_jobs] Called with query='{query}', user_id='{user_id}'")  
        from utils.embeddings import generate_embedding
        
        # Generate query embedding
        print(f"   [tool:vector_search_jobs] Generating embedding for query...")
        query_embedding = generate_embedding(query)
        print(f"   [tool:vector_search_jobs] Embedding generated: {len(query_embedding) if query_embedding else 0} dimensions")
        
        if not query_embedding:
            return json.dumps({"error": "Could not generate search embedding"})
        
        # MongoDB Atlas Vector Search
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "trackedjobs_vector_index",
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": 50,
                    "limit": 50,
                    "filter": {"userId": user_id}
                }
            },
            {
                "$project": {
                    "title": 1,
                    "company": 1,
                    "stage": 1,
                    "applicationDate": 1,
                    "notes": 1,
                    "matchScore": 1,
                    "location": 1,
                    "salary": 1,
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ]
        
        print(f"   [tool:vector_search_jobs] Running vector search pipeline...")
        results = list(db['trackedjobs'].aggregate(pipeline))
        print(f"   [tool:vector_search_jobs] Vector search returned {len(results)} results")
        
        if not results:
            # Fallback to text search if no vector results
            print(f"   [tool:vector_search_jobs] No vector results, falling back to text search...")
            results = list(db['trackedjobs'].find(
                {
                    "userId": user_id,
                    "$or": [
                        {"company": {"$regex": query, "$options": "i"}},
                        {"title": {"$regex": query, "$options": "i"}}
                    ]
                },
                {
                    "title": 1,
                    "company": 1,
                    "stage": 1,
                    "applicationDate": 1,
                    "notes": 1,
                    "matchScore": 1,
                    "location": 1,
                    "salary": 1
                }
            ).limit(5))
        
        print(f"   [tool:vector_search_jobs] Text search returned {len(results)} results")
        
        if not results:
            # Final fallback: return ALL user's jobs (embeddings not yet populated)
            print(f"   [tool:vector_search_jobs] No search results, returning ALL jobs for user (embeddings may be missing)")
            results = list(db['trackedjobs'].find(
                {"userId": user_id},
                {
                    "title": 1,
                    "company": 1,
                    "stage": 1,
                    "applicationDate": 1,
                    "notes": 1,
                    "matchScore": 1,
                    "location": 1,
                    "salary": 1
                }
            ).limit(10))
            
            if not results:
                print(f"   [tool:vector_search_jobs] User has no tracked jobs at all")
                return json.dumps({
                    "message": "You have not tracked any jobs yet. To get started, you can search for jobs using the Job Hunter or manually add jobs to the tracker.",
                    "jobs": []
                })
        
        print(f"   [tool:vector_search_jobs] Returning {len(results)} jobs")
        return json.dumps({"jobs": results}, default=str)
        
    except Exception as e:
        print(f"[tool] Error in vector_search_jobs: {e}")
        return json.dumps({"error": str(e)})

@tool
def fetch_scan_history(query: str, user_id: str) -> str:
    """
    Search user's past JD match analyses (returns up to 20 most relevant analyses).
    Use this when user asks about missing skills, past analyses, improvement areas, or aggregate data like averages.
    
    Args:
        query: Search query (e.g., "React role", "missing skills", "average match score")
        user_id: User's Clerk ID
    
    Returns:
        JSON string of matching analyses with match scores, keyword gaps, and actionable todos
    """
    try:
        print(f"   [tool:fetch_scan_history] Called with query='{query}', user_id='{user_id}'")
        from utils.embeddings import generate_embedding
        
        # Determine what fields to return based on query
        query_lower = query.lower()
        
        # Check if this is an aggregate/summary query (needs minimal data)
        is_aggregate = any(keyword in query_lower for keyword in [
            'average', 'avg', 'total', 'count', 'how many', 'all', 'overall'
        ])
        
        # Check if asking specifically about skills/gaps (needs keyword data)
        is_skills_query = any(keyword in query_lower for keyword in [
            'skill', 'missing', 'gap', 'lacking', 'need to learn', 'weak'
        ])
        
        # Check if asking for detailed analysis (needs full data)
        is_detailed = any(keyword in query_lower for keyword in [
            'detail', 'full', 'complete', 'show me', 'actionable', 'todo', 'improve'
        ])
        
        print(f"   [tool:fetch_scan_history] Query type: aggregate={is_aggregate}, skills={is_skills_query}, detailed={is_detailed}")
        
        # Build projection based on query type
        if is_aggregate and not is_detailed:
            # Minimal data for aggregate queries (average, count, etc.)
            projection = {
                "analysisResults.match_score": 1,
                "jobTitle": 1,
                "company": 1,
                "createdAt": 1
            }
            print(f"   [tool:fetch_scan_history] Using MINIMAL projection (aggregate query)")
        elif is_skills_query and not is_detailed:
            # Skills-focused data
            projection = {
                "analysisResults.match_score": 1,
                "analysisResults.keyword_gap.missing": 1,
                "analysisResults.keyword_gap.weak": 1,
                "analysisResults.keyword_gap.matched": 1,
                "jobTitle": 1,
                "company": 1,
                "createdAt": 1
            }
            print(f"   [tool:fetch_scan_history] Using SKILLS projection")
        else:
            # Full data for detailed queries
            projection = {
                "analysisResults.jd_summary": 1,
                "analysisResults.match_score": 1,
                "analysisResults.keyword_gap": 1,
                "analysisResults.actionable_todos": 1,
                "jobTitle": 1,
                "company": 1,
                "createdAt": 1
            }
            print(f"   [tool:fetch_scan_history] Using FULL projection (detailed query)")
        
        print(f"   [tool:fetch_scan_history] Generating embedding for query...")
        query_embedding = generate_embedding(query)
        print(f"   [tool:fetch_scan_history] Embedding generated: {len(query_embedding) if query_embedding else 0} dimensions")
        
        if not query_embedding:
            return json.dumps({"error": "Could not generate search embedding"})
        
        # Add projection to vector search pipeline
        project_stage = projection.copy()
        project_stage["score"] = {"$meta": "vectorSearchScore"}
        
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "jd_analyses_vector_index",
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": 200,
                    "limit": 50,
                    "filter": {"clerkId": user_id}
                }
            },
            {
                "$project": project_stage
            }
        ]
        
        print(f"   [tool:fetch_scan_history] Running vector search pipeline...")
        results = list(db['jd_analyses'].aggregate(pipeline))
        print(f"   [tool:fetch_scan_history] Vector search returned {len(results)} results")
        
        if not results:
            # Fallback to recent analyses
            print(f"   [tool:fetch_scan_history] No vector results, falling back to recent analyses...")
            results = list(db['jd_analyses'].find(
                {"clerkId": user_id, "status": "complete"},
                projection
            ).sort("createdAt", -1).limit(50))
            print(f"   [tool:fetch_scan_history] Fallback returned {len(results)} results")
        
        if not results:
            print(f"   [tool:fetch_scan_history] No analyses found for user")
            return json.dumps({
                "message": "No past JD analyses found. Run the JD Matcher to analyze job descriptions.",
                "analyses": []
            })
        
        # Calculate aggregate statistics if this is an aggregate query
        response_data = {"analyses": results}
        
        if is_aggregate:
            # Extract match scores
            scores = []
            for analysis in results:
                score = analysis.get('analysisResults', {}).get('match_score')
                if score is not None:
                    scores.append(score)
            
            if scores:
                response_data["statistics"] = {
                    "average_score": round(sum(scores) / len(scores), 2),
                    "min_score": min(scores),
                    "max_score": max(scores),
                    "total_analyses": len(scores)
                }
                print(f"   [tool:fetch_scan_history] Calculated statistics: avg={response_data['statistics']['average_score']}, min={response_data['statistics']['min_score']}, max={response_data['statistics']['max_score']}")
        
        print(f"   [tool:fetch_scan_history] Returning {len(results)} analyses to agent")
        return json.dumps(response_data, default=str)
        
    except Exception as e:
        print(f"   [tool:fetch_scan_history] Error: {str(e)}")
        return json.dumps({"error": str(e)})

@tool
def get_profile_details(section: str, user_id: str) -> str:
    """
    Fetch specific sections from user's resume.
    Use this when user asks to rewrite resume sections or needs detailed profile info.
    
    Args:
        section: Section name (e.g., "projects", "experience", "skills", "education")
        user_id: User's Clerk ID
    
    Returns:
        JSON string of requested section
    """
    try:
        user = db['users'].find_one({"clerkId": user_id})
        
        if not user or 'profile' not in user:
            return json.dumps({"error": "No profile data found. Please complete onboarding."})
        
        profile = user['profile']
        
        # Handle nested sections
        if section == "raw_resume_text":
            return json.dumps({"raw_resume_text": profile.get("raw_resume_text", "")})
        
        if section not in profile:
            available_sections = [k for k in profile.keys() if not k.startswith('_')]
            return json.dumps({
                "error": f"Section '{section}' not found in profile.",
                "available_sections": available_sections
            })
        
        return json.dumps({section: profile[section]}, default=str)
        
    except Exception as e:
        print(f"[tool] Error in get_profile_details: {e}")
        return json.dumps({"error": str(e)})

@tool
def internet_search(query: str) -> str:
    """
    Search the internet for career advice, salary data, company info, etc.
    Use this when user asks about market trends, salaries, or information not in the database.
    
    Args:
        query: Search query (e.g., "Senior SWE salary London 2026")
    
    Returns:
        Search results summary
    """
    # Placeholder - will be implemented with Tavily API
    return json.dumps({
        "message": f"Internet search for '{query}' would be performed here.",
        "note": "This feature will be implemented with Tavily API integration."
    })

@tool
def calculate(numbers: list, operation: str) -> str:
    """
    Perform simple arithmetic calculations.
    
    Args:
        numbers: List of numbers to calculate (e.g., [60, 57, 75, 59, 83, 82, 82, 81])
        operation: Operation to perform - "sum", "average", "min", or "max"
    
    Returns:
        Exact numerical result
    """
    try:
        print(f"   [tool:calculate] Operation: {operation} on {len(numbers)} numbers")
        
        if operation == "sum":
            result = sum(numbers)
        elif operation == "average":
            result = sum(numbers) / len(numbers) if numbers else 0
        elif operation == "min":
            result = min(numbers) if numbers else 0
        elif operation == "max":
            result = max(numbers) if numbers else 0
        else:
            return json.dumps({"error": f"Unknown operation: {operation}"})
        
        print(f"   [tool:calculate] Result: {result}")
        return json.dumps({"result": result})
        
    except Exception as e:
        print(f"   [tool:calculate] Error: {str(e)}")
        return json.dumps({"error": str(e)})

# --- GET ALL TOOLS ---
def get_mentor_tools():
    """
    Return all available tools for the mentor agent.
    """
    return [
        vector_search_jobs,
        fetch_scan_history,
        get_profile_details,
        internet_search
    ]
