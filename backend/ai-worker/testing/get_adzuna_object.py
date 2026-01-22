
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")

def get_job_details():
    # We know "Fullstack Engineer" + "MERN" yields 1 result. 
    # Let's fetch that to give the user the EXACT OBJECT FORMAT they requested.
    
    url = "https://api.adzuna.com/v1/api/jobs/in/search/1"
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "what": "Fullstack Engineer",
        "what_and": "MERN",
        "where": "India",
        "max_days_old": 45,
        "sort_by": "date",
        "results_per_page": 1,
        "content-type": "application/json"
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    print("## 1. Exact Parameters Used")
    print("```json")
    print(json.dumps({k:v for k,v in params.items() if 'app_' not in k}, indent=2))
    print("```")
    
    print("\n## 2. Jobs Found")
    print(f"**Total Found**: {data.get('count', 0)}")
    
    if data.get('results'):
        print("\n## 3. Object Format Received (Raw JSON)")
        print("```json")
        print(json.dumps(data['results'][0], indent=2))
        print("```")

if __name__ == "__main__":
    get_job_details()
