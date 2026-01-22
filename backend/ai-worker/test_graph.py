"""
Test the graph execution directly to see which nodes run
"""

from agent.job_hunter_graph import create_job_hunt_graph

print("Creating graph...")
graph = create_job_hunt_graph()

print("Initializing test state...")
test_state = {
    "criteria": {
        "jobTitles": ["Software Engineer"],
        "locations": ["Bangalore"],
        "salaryRange": [500000, 5000000]
    },
    "user_id": "test_user",
    "session_id": "test_session",
    "resume_text": "",
    "log_callback": lambda level, msg: print(f"[LOG {level.upper()}] {msg}"),
    "broad_keywords": [],
    "adzuna_queries": [],
    "raw_jobs": [],
    "filtered_jobs": [],
    "ai_cleaned_jobs": [],
    "scored_jobs": [],
    "validated_jobs": [],
    "final_results": [],
    "tier_used": [],
    "error": ""
}

print("\n" + "="*80)
print("Invoking graph...")
print("="*80)

result = graph.invoke(test_state)

print("\n" + "="*80)
print("Graph execution completed")
print("="*80)
print(f"Final results: {len(result.get('final_results', []))}")
print(f"Raw jobs: {len(result.get('raw_jobs', []))}")
print(f"Broad keywords: {result.get('broad_keywords', [])}")
print(f"Adzuna queries: {len(result.get('adzuna_queries', []))}")
