"""
Simplified Job Matcher for Job Hunter Agent.
Calculates match score between resume and job description without ATS analysis.
"""

from langchain_groq import ChatGroq
import os
import json
import re

def calculate_job_match_score(resume_text: str, job_description: str) -> int:
    """
    Calculate simplified match score for job hunting.
    
    Scores based on:
    - Keywords & Skills Match
    - Experience Relevance  
    - Skill Evidence Strength
    - Impact & Metrics
    - Role & Seniority Fit
    - Language & Clarity
    
    Args:
        resume_text: User's raw resume text
        job_description: Job description text
        
    Returns:
        Match score (0-100)
    """
    try:
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            api_key=os.getenv("GROQ_API_KEY")
        )
        
        prompt = f"""You are an expert job matching system. Analyze how well this resume matches the job description.

**Resume:**
{resume_text[:3000]}  

**Job Description:**
{job_description[:2000]}

**Scoring Criteria (each out of 100):**

1. **Keywords & Skills Match (30% weight)**
   - How many required skills/technologies from JD appear in resume?
   - Are critical keywords present?

2. **Experience Relevance (25% weight)**
   - Does candidate's experience align with job requirements?
   - Relevant industry/domain experience?

3. **Skill Evidence Strength (20% weight)**
   - Are skills backed by concrete projects/achievements?
   - Depth of technical expertise demonstrated?

4. **Impact & Metrics (10% weight)**
   - Quantifiable achievements mentioned?
   - Results-oriented language?

5. **Role & Seniority Fit (10% weight)**
   - Does experience level match job seniority?
   - Appropriate career progression?

6. **Language & Clarity (5% weight)**
   - Professional communication?
   - Clear articulation of skills?

**Output Format (JSON only):**
```json
{{
  "keywords_skills_match": 85,
  "experience_relevance": 75,
  "skill_evidence_strength": 90,
  "impact_metrics": 60,
  "role_seniority_fit": 80,
  "language_clarity": 95,
  "overall_match_score": 82,
  "brief_reasoning": "Strong technical skills match with relevant experience in similar domain."
}}
```

Return ONLY the JSON, no other text.
"""
        
        response = llm.invoke(prompt)
        content = response.content.strip()
        
        # Extract JSON
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', content, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group(1))
        else:
            # Try parsing directly
            result = json.loads(content)
        
        # Calculate weighted average
        overall_score = result.get("overall_match_score", 50)
        
        # Ensure score is between 0-100
        overall_score = max(0, min(100, overall_score))
        
        return int(overall_score)
        
    except Exception as e:
        print(f"[JobMatcher] Error calculating match score: {e}")
        # Return default score on error
        return 50
