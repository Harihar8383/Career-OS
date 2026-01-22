
import os
import requests
import json
import time
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")

def generate_queries(config):
    """
    Simulates the Agent's logic to explode a user config into multiple targeted API queries.
    """
    queries = []
    
    # 1. Handle Locations
    # Adzuna doesn't support array for 'where', so we must create separate queries for each city.
    target_locations = config.get('locations', [])
    if config.get('locationTypes') and 'remote' in config['locationTypes']:
        # Add "Remote" as an explicit location target for Adzuna
        # (Adzuna works better with where="Remote" than keyword "Remote")
        target_locations.append("Remote")
        # Also try "Work from Home" as a location concept or generic India search for remote
    
    # If no locations specified but not remote-only, default to "India"
    if not target_locations and 'remote' not in config.get('locationTypes', []):
        target_locations = ["India"]
        
    # 2. Handle Roles
    target_roles = config.get('jobTitles', [])
    
    # 3. Handle Salary (We learned to be lenient here)
    # We will produce TWO versions of queries for high salaries: 
    #   a) Strict Salary (High Precision, Low Recall)
    #   b) No Salary Filter (Low Precision, High Recall) - to catch "Not Disclosed"
    min_salary = config.get('salaryRange', [0])[0]
    
    # EXPLODE: Role x Location
    for role in target_roles:
        for loc in target_locations:
            
            # Base Query
            base_params = {
                "what": role,
                "where": loc,
                "results_per_page": 10, # Get top 10 for each
                "sort_by": "date",
                "max_days_old": 45,
                "content-type": "application/json"
            }
            
            # Tag the strategy
            queries.append({
                "strategy": f"Targeted: {role} in {loc} (Any Salary)",
                "params": base_params
            })
            
            # If user has a high salary expectation (>10L), try a strict query too
            if min_salary > 1000000: # 10 LPA
                strict_params = base_params.copy()
                strict_params['salary_min'] = min_salary
                queries.append({
                    "strategy": f"Strict Salary: {role} in {loc} (> {min_salary})",
                    "params": strict_params
                })
                
    return queries

def execute_agent_simulation(scenario_name, config):
    print(f"\n{'='*80}")
    print(f"🤖 AGENT SIMULATION: {scenario_name}")
    print(f"   User Config: {json.dumps(config, indent=2)}")
    
    generated_queries = generate_queries(config)
    print(f"\n   ⚡ Agent generated {len(generated_queries)} distinct queries to maximize coverage.")
    
    total_jobs_found = 0
    all_results = []
    
    for i, q in enumerate(generated_queries, 1):
        strategy = q['strategy']
        params = q['params']
        
        # Add Auth
        params['app_id'] = ADZUNA_APP_ID
        params['app_key'] = ADZUNA_APP_KEY
        
        print(f"\n   👉 Query #{i}: {strategy}")
        # print(f"      Params: {json.dumps({k:v for k,v in params.items() if 'app_' not in k})}")
        
        try:
            resp = requests.get("https://api.adzuna.com/v1/api/jobs/in/search/1", params=params)
            data = resp.json()
            count = data.get('count', 0)
            results = data.get('results', [])
            
            print(f"      ✅ Found: {count} jobs")
            
            if results:
                # Analyze top result for Correctness
                top = results[0]
                print(f"      📄 Top Result: {top.get('title')} @ {top.get('company', {}).get('display_name')}")
                print(f"         Loc: {top.get('location', {}).get('display_name')}")
                print(f"         Salary: {top.get('salary_min')} - {top.get('salary_max')}")
            
            all_results.extend(results)
            total_jobs_found += count
            
        except Exception as e:
            print(f"      ❌ Error: {e}")
            
        time.sleep(0.5) # Courtesy delay
        
    # Deduplicate Results based on ID or URL
    unique_map = {}
    for job in all_results:
        key = job.get('redirect_url')
        if key:
            unique_map[key] = job
            
    print(f"\n   📊 AGENT SUMMARY")
    print(f"   Total Raw Hits: {len(all_results)}")
    print(f"   Unique Jobs:    {len(unique_map)}")
    print(f"   Coverage Score: {'High' if len(unique_map) > 10 else 'Low'}")

if __name__ == "__main__":
    
    # Scenario: The "Mix" User
    # Wants: Fullstack Dev OR Backend Dev
    # Locations: Bangalore OR Pune OR Remote
    # Salary: > 15 LPA
    complex_config = {
        "jobTitles": ["Fullstack Developer", "Backend Developer"],
        "locations": ["Bangalore", "Pune"],
        "locationTypes": ["hybrid", "remote"], # implies we should check cities AND specifically "Remote"
        "salaryRange": [1500000, 3500000]
    }
    
    execute_agent_simulation("Complex Multi-City & Remote Search", complex_config)
