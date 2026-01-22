"""
Batch job scoring using simplified matcher.
PHASE 1 OPTIMIZATION: Uses resume fingerprint instead of full text.
Processes jobs in batches of 5 for efficiency.
"""

from langchain_groq import ChatGroq
import os
import json
import re


def score_jobs_in_batch(resume_fingerprint: dict, jobs: list, batch_size: int = 5) -> list:
    """
    Score multiple jobs in batches using AI with resume fingerprint.
    PHASE 1: Uses fingerprint instead of full resume text (saves ~1500 tokens/batch).
    
    Args:
        resume_fingerprint: Compact resume fingerprint from Node 0
        jobs: List of job dicts
        batch_size: Number of jobs per batch (default 5)
        
    Returns:
        List of jobs with matchScore added
    """
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",  # Keep quality for scoring
        temperature=0.1,
        api_key=os.getenv("GROQ_API_KEY")
    )
    
    scored_jobs = []
    total_jobs = len(jobs)
    
    for i in range(0, total_jobs, batch_size):
        batch = jobs[i:i+batch_size]
        
        # Prepare batch prompt
        job_summaries = []
        for idx, job in enumerate(batch):
            job_summaries.append(f"""
{idx+1}. Title: {job.get('title', 'N/A')}
   Company: {job.get('company', {}).get('display_name', 'N/A') if isinstance(job.get('company'), dict) else job.get('company', 'N/A')}
   Description: {job.get('description', '')[:300]}...
""")
        
        # PHASE 1: Use fingerprint instead of full resume
        prompt = f"""Score these {len(batch)} jobs against the candidate profile (0-100).

**Candidate Profile (Fingerprint):**
{json.dumps(resume_fingerprint, indent=2)}

**Jobs to Score:**
{''.join(job_summaries)}

**Scoring Criteria:**
- Expert Skills Match (30%): How many expert_skills match the job?
- Proficient Skills Match (20%): How many proficient_skills match?
- Stack Alignment (20%): Does job match primary_stack?
- YoE Fit (15%): Does job YoE requirement match candidate's yoe?
- Domain Relevance (10%): Does job domain match candidate's domains?
- No Poison Keywords (5%): Job should NOT mention poison_keywords

**Output Format:**
Return ONLY a JSON array of scores: {{"scores": [85, 72, 91, ...]}}

Be strict but fair. Return ONLY the JSON, no explanations.
"""
        
        try:
            response = llm.invoke(prompt)
            content = response.content.strip()
            
            # Extract JSON
            json_match = re.search(r'\{.*?\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(0))
                scores = result.get("scores", [])
                
                # Assign scores to jobs
                for idx, job in enumerate(batch):
                    if idx < len(scores):
                        # Use AI score
                        job["matchScore"] = scores[idx]
                    else:
                        # AI didn't return enough scores - use fallback
                        print(f"[BatchScoring] Warning: AI returned {len(scores)} scores for {len(batch)} jobs, using fallback for job {idx+1}")
                        job["matchScore"] = 50  # Fallback score
                    scored_jobs.append(job)
            else:
                # Fallback: assign default scores
                print(f"[BatchScoring] Warning: No JSON found in AI response, using fallback scores")
                for job in batch:
                    job["matchScore"] = 50
                    scored_jobs.append(job)
                    
        except Exception as e:
            print(f"[BatchScoring] Error scoring batch: {e}")
            # Fallback: assign default scores
            for job in batch:
                job["matchScore"] = 50
                scored_jobs.append(job)
    
    return scored_jobs
