"""
LangGraph-based Job Hunter Agent.
Implements the guide.md strategy with AI query generation, parallel fetching,
soft killswitch, AI cleanup, JD scoring, and link validation.
"""

from typing import TypedDict, List, Annotated
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
import os
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


# ============================================================
# STATE DEFINITION
# ============================================================

class JobHuntState(TypedDict):
    """State for the job hunting workflow"""
    # Input
    criteria: dict
    user_id: str
    session_id: str
    resume_text: str
    log_callback: object  # Function to publish logs to RabbitMQ
    
    # NEW: Optimization fields
    user_skills: List[str]  # Skills from partial_profile
    negative_keywords: List[str]  # AI-generated negative keywords
    positive_synonyms: dict  # AI-generated synonyms for matching
    resume_fingerprint: dict  # PHASE 1: Enhanced resume fingerprint
    
    # Processing
    broad_keywords: List[str]
    adzuna_queries: List[dict]
    raw_jobs: List[dict]
    filtered_jobs: List[dict]
    auto_passed_jobs: List[dict]  # TIERED FILTERING: Top jobs that skip AI
    ai_cleaned_jobs: List[dict]
    scored_jobs: List[dict]
    validated_jobs: List[dict]
    
    # Output
    final_results: List[dict]
    tier_used: List[str]
    error: str




# ============================================================
# NODE FUNCTIONS
# ============================================================

def fetch_user_context_node(state: JobHuntState) -> dict:
    """
    Node 0: Fetch user skills and generate AI-powered filtering keywords.
    PHASE 1 OPTIMIZATION: Added enhanced resume fingerprint extraction.
    """
    print(f"\n[NODE 0] fetch_user_context_node - START")
    log = state.get("log_callback")
    if log:
        log("info", "🔍 Fetching user context and generating keywords...")
    
    user_id = state["user_id"]
    criteria = state["criteria"]
    resume_text = state.get("resume_text", "")
    
    # 1. Fetch user skills from MongoDB
    from utils.user_skills import get_user_skills
    user_skills = get_user_skills(user_id)
    print(f"[NODE 0] Fetched {len(user_skills)} skills from user profile")
    
    # ===== COMPREHENSIVE CACHING SYSTEM =====
    job_titles = criteria.get('jobTitles', [])
    role = job_titles[0] if job_titles else criteria.get('role', 'Developer')
    
    cache = None
    resume_hash = None
    cached_config = None
    
    try:
        from utils.user_config_cache import UserConfigCache
        
        cache = UserConfigCache()
        resume_hash = cache.calculate_resume_hash(resume_text)
        
        print(f"[NODE 0] 🔍 Checking cache for role='{role}', resume_hash={resume_hash[:8]}...")
        cached_config = cache.get_config(user_id, role, resume_hash)
        
        if cached_config:
            # Cache hit! Return cached data
            print(f"[NODE 0] ✅ Cache HIT! Using cached config (0 tokens, 0ms)")
            
            # Extract cached data
            resume_fingerprint = cached_config.get("resume_fingerprint", {})
            negative_keywords = cached_config.get("negative_keywords", [])
            positive_synonyms = cached_config.get("positive_synonyms", {})
            
            # Enhanced logging
            fp_role = resume_fingerprint.get("role", "Unknown")
            fp_yoe = resume_fingerprint.get("yoe", 0)
            fp_expert = resume_fingerprint.get("expert_skills", [])
            fp_poison = resume_fingerprint.get("poison_keywords", [])
            
            print(f"[NODE 0] 📋 Cached Fingerprint: {fp_role}, {fp_yoe}y exp")
            print(f"[NODE 0] 💎 Expert skills ({len(fp_expert)}): {fp_expert[:5]}")
            print(f"[NODE 0] ⚠️  Poison keywords ({len(fp_poison)}): {fp_poison[:8]}...")
            
            if log:
                log("info", f"✅ Cache HIT - {fp_role}, {fp_yoe}y exp, {len(fp_expert)} expert skills")
            
            return {
                "user_skills": user_skills,
                "negative_keywords": negative_keywords,
                "positive_synonyms": positive_synonyms,
                "resume_fingerprint": resume_fingerprint
            }
        else:
            print(f"[NODE 0] ❌ Cache MISS - generating fresh config")
            if log:
                log("info", "Generating fresh fingerprint + keywords...")
    
    except Exception as e:
        print(f"[NODE 0] Cache error (proceeding without cache): {e}")
        cache = None
        resume_hash = None
    
    # ===== END CACHE CHECK =====
    
    # 2. Generate negative keywords using AI (cache miss)
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",  # Production-ready, high rate limits
        temperature=0.1,
        api_key=os.getenv("GROQ_API_KEY")
    )
    
    # ===== PHASE 1: ENHANCED RESUME FINGERPRINT EXTRACTION =====
    resume_fingerprint = {}
    
    print(f"[NODE 0] Resume: {len(resume_text) if resume_text else 0} chars")
    
    if resume_text:
        if log:
            log("info", "🧬 Extracting enhanced resume fingerprint...")
        
        fingerprint_prompt = f"""Analyze this resume and extract a DETAILED JSON fingerprint for job matching.

RESUME:
{resume_text[:3500]}

Extract the following with HIGH PRECISION:

1. **Role & Seniority** (CRITICAL - Must Extract Accurately)
   - primary_role: Exact role from resume (e.g., "Backend Engineer", "Full Stack Developer")
   - seniority_level: "Junior" | "Mid-Level" | "Senior" | "Lead" | "Principal"
   - yoe: **CRITICAL** - Integer years of TOTAL professional experience
     * Count from first professional role to present
     * If resume shows "2020-present", calculate: {datetime.now().year} - 2020 = {datetime.now().year - 2020} years
     * If multiple roles, sum all durations
     * If internship/fresher, set to 0
     * NEVER leave as null - always provide a number

2. **Technical Skills (Categorized & Normalized)**
   - expert_skills: Top 5-7 technologies (mentioned 3+ times or in multiple projects)
     * Normalize: "React.js" → "React", "Node.js" → "Node", "MongoDB" → "MongoDB"
     * Lowercase for consistency
   - proficient_skills: 5-10 technologies they're proficient in (normalized, lowercase)
   - familiar_skills: Technologies mentioned once (normalized, lowercase)

3. **Tech Stack Ecosystem**
   - primary_stack: Main ecosystem (e.g., "MERN", "Java Spring", "Python Django", "React Native")
   - languages: Programming languages (e.g., ["JavaScript", "Python", "Java"])
   - frameworks: Frameworks/libraries (e.g., ["React", "Express", "Django"])
   - tools: DevOps/tools (e.g., ["Docker", "AWS", "Git"])

4. **Anti-Pattern Detection (CRITICAL - Generate 15-20 Keywords)**
   - poison_keywords: Technologies they DON'T work with (infer from tech stack)
     * **IMPORTANT**: Generate 15-20 poison keywords minimum
     * If MERN stack → poison: ["spring boot", "django", "laravel", ".net", "php", "angular", "vue", "ember", "backbone", "jquery", "java", "c#", "ruby", "rails", "flask"]
     * If React → poison: ["angular", "vue", "ember", "backbone", "jquery", "svelte"]
     * If Python → poison: ["java", "c#", "php", ".net", "spring boot"]
     * If Backend (Node/Python) → poison: ["angular", "vue", "react native", "flutter", "swift", "kotlin"]
     * **If yoe < 1**: Add ["senior", "lead", "principal", "architect", "staff", "director"]
     * Always include: ["sales", "marketing", "bpo", "telecaller", "support"]
   - dealbreakers: Explicit constraints (e.g., ["No BPO", "No Support Roles"])

5. **Domain & Preferences**
   - domains: Industries worked in (e.g., ["Fintech", "E-commerce", "SaaS"])
   - work_preferences: Inferred preferences (e.g., ["Remote-first", "Startup", "Product-based"])
   - company_size_preference: "Startup" | "Mid-size" | "Enterprise" | "Any"

6. **Salary & Location**
   - current_salary: Estimated from resume (if mentioned)
   - expected_salary_min: Inferred minimum expectation
   - preferred_locations: Cities mentioned (e.g., ["Bangalore", "Remote"])

Return ONLY this JSON (no markdown, no explanation):
{{
  "role": "Backend Engineer",
  "seniority_level": "Mid-Level",
  "yoe": 3,
  "expert_skills": ["node", "react", "mongodb", "aws", "docker"],
  "proficient_skills": ["express", "postgresql", "redis", "kubernetes", "typescript"],
  "familiar_skills": ["graphql", "terraform", "python"],
  "primary_stack": "MERN",
  "languages": ["JavaScript", "TypeScript"],
  "frameworks": ["React", "Express", "Node.js"],
  "tools": ["Docker", "AWS", "Git", "Jenkins"],
  "poison_keywords": ["spring boot", "django", "laravel", ".net", "php", "angular", "vue", "ember", "backbone", "jquery", "java", "c#", "ruby", "rails", "flask", "sales", "marketing", "bpo"],
  "dealbreakers": ["No Support Roles", "No BPO"],
  "domains": ["E-commerce", "SaaS"],
  "work_preferences": ["Remote-first", "Startup"],
  "company_size_preference": "Startup",
  "expected_salary_min": 1200000,
  "preferred_locations": ["Bangalore", "Remote"]
}}
"""
        
        try:
            print(f"[NODE 0] Extracting resume fingerprint...")
            response = llm.invoke(fingerprint_prompt)
            content = response.content.strip()
            
            # Extract JSON
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                resume_fingerprint = json.loads(json_match.group(0))
                
                # Validate and fill missing required fields
                required_defaults = {
                    "role": "Developer",
                    "yoe": 2,
                    "expert_skills": [],
                    "proficient_skills": [],
                    "familiar_skills": [],
                    "primary_stack": "General",
                    "poison_keywords": [],
                    "languages": [],
                    "frameworks": [],
                    "tools": [],
                    "dealbreakers": [],
                    "domains": [],
                    "work_preferences": [],
                    "company_size_preference": "Any",
                    "seniority_level": "Mid-Level",
                    "expected_salary_min": 0,
                    "preferred_locations": []
                }
                
                # Check which fields are missing
                missing_fields = [k for k in ["role", "yoe", "expert_skills", "primary_stack", "poison_keywords"] if k not in resume_fingerprint]
                
                if missing_fields:
                    print(f"[NODE 0] ⚠️ Missing fields: {missing_fields}, filling with defaults")
                    if log:
                        log("warning", f"   Partial fingerprint extracted, missing: {', '.join(missing_fields)}")
                
                # Fill in missing fields with defaults
                for key, default_value in required_defaults.items():
                    if key not in resume_fingerprint:
                        resume_fingerprint[key] = default_value
                
                # Validate we have at least some useful data
                if resume_fingerprint.get("expert_skills") or resume_fingerprint.get("role") != "Developer":
                    fp_role = resume_fingerprint['role']
                    fp_yoe = resume_fingerprint['yoe']
                    fp_expert = resume_fingerprint.get('expert_skills', [])
                    fp_poison = resume_fingerprint.get('poison_keywords', [])
                    
                    print(f"[NODE 0] ✅ Fingerprint: {fp_role}, {fp_yoe}y exp")
                    print(f"[NODE 0] 💎 Expert skills ({len(fp_expert)}): {fp_expert}")
                    print(f"[NODE 0] ⚠️  Poison keywords ({len(fp_poison)}): {fp_poison[:10]}...")
                    
                    if log:
                        log("info", f"✅ Fingerprint: {fp_role}, {fp_yoe}y exp, {len(fp_expert)} expert skills")
                else:
                    print(f"[NODE 0] ⚠️ Fingerprint has no useful data, discarding")
                    resume_fingerprint = {}
            else:
                print(f"[NODE 0] ❌ No JSON found in fingerprint response")
                print(f"[NODE 0] Response preview: {content[:200]}")
                resume_fingerprint = {}
                
        except Exception as e:
            print(f"[NODE 0] ❌ Fingerprint extraction failed: {e}")
            import traceback
            traceback.print_exc()
            resume_fingerprint = {}
    else:
        print(f"[NODE 0] No resume text available, skipping fingerprint extraction")

    
    # ===== END FINGERPRINT EXTRACTION =====
    
    # Generate negative keywords
    neg_prompt = f"""Generate 25 negative keywords for filtering irrelevant jobs.

Target Roles: {', '.join(job_titles) if job_titles else 'Software Developer'}

Include:
- Different job types: sales, marketing, HR, support, BPO, telecaller
- Unrelated domains: insurance, loan, credit, collection
- Wrong seniority: intern, principal (if not applicable)

Return ONLY this JSON structure:
{{"negative_keywords": ["sales", "marketing", "hr", "support", "bpo", "telecaller", "insurance", "loan", "credit", "collection", "customer service", "call center", "data entry", "field", "driver", "delivery", "warehouse", "retail", "cashier", "receptionist", "clerk", "assistant", "coordinator", "admin", "secretary"]}}

No text before or after the JSON.
"""
    
    try:
        response = llm.invoke(neg_prompt)
        content = response.content.strip()
        
        import re
        json_match = re.search(r'\{.*?\}', content, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group(0))
            negative_keywords = result.get("negative_keywords", [])
            print(f"[NODE 0] Generated {len(negative_keywords)} negative keywords")
        else:
            print(f"[NODE 0] No JSON found in response: {content[:200]}")
            raise ValueError("No JSON in response")
    except Exception as e:
        print(f"[NODE 0] Error generating negative keywords: {e}")
        
        # Retry with simpler prompt
        try:
            simple_prompt = f"""List 25 job types to avoid for: {', '.join(job_titles) if job_titles else 'Software Developer'}

Return ONLY this JSON: {{"negative_keywords": ["sales", "marketing", ...]}}"""
            
            response = llm.invoke(simple_prompt)
            content = response.content.strip()
            json_match = re.search(r'\{.*?\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(0))
                negative_keywords = result.get("negative_keywords", [])
                print(f"[NODE 0] Retry successful: {len(negative_keywords)} negative keywords")
            else:
                raise ValueError("Retry failed")
        except Exception as retry_error:
            print(f"[NODE 0] Retry also failed: {retry_error}")
            # Fallback to default keywords
            negative_keywords = [
                "sales", "marketing", "telecaller", "bpo", "call center",
                "customer support", "hr", "recruiter", "account manager",
                "business development", "insurance", "loan", "credit"
            ]
            print(f"[NODE 0] Using default negative keywords")
    
    # 3. Generate positive synonyms using AI
    syn_prompt = f"""Generate synonyms for job search matching.

Target Roles: {', '.join(job_titles) if job_titles else 'Software Developer'}
User Skills: {', '.join(user_skills[:15]) if user_skills else 'Not specified'}

For each role and key skill, provide 3-5 alternative terms.

Return ONLY this JSON structure:
{{
  "backend_developer": ["backend engineer", "server-side developer", "api developer"],
  "full_stack": ["fullstack", "full-stack engineer", "mern stack"],
  "python": ["python3", "django", "flask", "fastapi"]
}}

Use lowercase keys with underscores. No text before or after JSON.
"""
    
    try:
        response = llm.invoke(syn_prompt)
        content = response.content.strip()
        
        json_match = re.search(r'\{.*?\}', content, re.DOTALL)
        if json_match:
            positive_synonyms = json.loads(json_match.group(0))
            print(f"[NODE 0] Generated synonyms for {len(positive_synonyms)} terms")
        else:
            positive_synonyms = {}
            print(f"[NODE 0] No synonyms generated")
    except Exception as e:
        print(f"[NODE 0] Error generating synonyms: {e}")
        positive_synonyms = {}
    
    if log:
        log("info", f"✅ Context loaded: {len(user_skills)} skills, {len(negative_keywords)} negative keywords")
    
    # ===== SAVE TO CACHE =====
    if cache and resume_hash:
        try:
            cache.save_config(
                user_id=user_id,
                role=role,
                resume_hash=resume_hash,
                negative_keywords=negative_keywords,
                positive_synonyms=positive_synonyms,
                resume_fingerprint=resume_fingerprint
            )
            print(f"[NODE 0] ✅ Saved to cache for future runs")
        except Exception as e:
            print(f"[NODE 0] Cache save error (non-fatal): {e}")
    # ===== END CACHE SAVE =====
    
    return {
        "user_skills": user_skills,
        "negative_keywords": negative_keywords,
        "positive_synonyms": positive_synonyms,
        "resume_fingerprint": resume_fingerprint  # PHASE 1: Added fingerprint
    }





def generate_keywords_node(state: JobHuntState) -> dict:
    """
    Node 1: Generate broad search keywords following guide.md strategy.
    PHASE 1: Dictionary-first approach with AI fallback.
    COMPREHENSIVE UPDATE: Fingerprint-aware + caching.
    """
    print(f"\n[NODE 1] generate_keywords_node - START")
    
    log = state.get("log_callback")
    if log:
        log("info", "🧠 Generating personalized keywords...")
    
    criteria = state["criteria"]
    user_id = state["user_id"]
    resume_text = state.get("resume_text", "")
    fingerprint = state.get("resume_fingerprint", {})
    role = criteria.get("role", "")
    job_titles = criteria.get("jobTitles", [])
    
    # Extract fingerprint for personalized generation
    expert_skills = fingerprint.get("expert_skills", [])
    primary_stack = fingerprint.get("primary_stack", "")
    user_yoe = fingerprint.get("yoe", 0)
    
    print(f"[NODE 1] Job titles: {job_titles}")
    print(f"[NODE 1] 🧬 Using fingerprint: {primary_stack}, {user_yoe}y exp, {len(expert_skills)} expert skills")
    
    # ===== PHASE 1: STATIC KEYWORD MAP (Dictionary-First) =====
    STATIC_KEYWORD_MAP = {
        "mern": ["MERN", "React", "Node.js", "MongoDB", "Express", "Full Stack", "Fullstack", "JavaScript"],
        "mean": ["MEAN", "Angular", "Node.js", "MongoDB", "Express", "Full Stack", "JavaScript"],
        "java full stack": ["Java", "Spring Boot", "Hibernate", "Microservices", "Full Stack", "Backend"],
        "java": ["Java", "Spring", "Spring Boot", "Backend", "Developer", "Engineer"],
        "python": ["Python", "Django", "Flask", "FastAPI", "Python Developer", "Backend"],
        "frontend": ["React", "Vue", "Angular", "JavaScript", "TypeScript", "Frontend", "UI Developer"],
        "backend": ["Backend", "API", "Server", "Microservices", "Node.js", "Python", "Java"],
        "data scientist": ["Data Science", "Machine Learning", "Python", "SQL", "Pandas", "ML Engineer"],
        "devops": ["DevOps", "Kubernetes", "Docker", "CI/CD", "AWS", "Azure", "Cloud"],
        "react": ["React", "React.js", "ReactJS", "Frontend", "JavaScript", "TypeScript"],
        "node": ["Node.js", "Node", "Backend", "JavaScript", "Express", "API"],
        "angular": ["Angular", "Frontend", "TypeScript", "JavaScript", "UI Developer"],
        "vue": ["Vue", "Vue.js", "Frontend", "JavaScript", "UI Developer"],
        "full stack": ["Full Stack", "Fullstack", "Developer", "Engineer"],  # Generic - no specific stack
        "django": ["Django", "Python", "Backend", "Web Developer"],
        "flask": ["Flask", "Python", "Backend", "API Developer"],
        "spring boot": ["Spring Boot", "Java", "Backend", "Microservices"],
        ".net": [".NET", "C#", "Backend", "ASP.NET", "Developer"],
        "golang": ["Go", "Golang", "Backend", "Microservices", "Developer"],
        "rust": ["Rust", "Systems", "Backend", "Developer"],
        "mobile": ["React Native", "Flutter", "iOS", "Android", "Mobile Developer"],
        "ios": ["iOS", "Swift", "Mobile", "Developer"],
        "android": ["Android", "Kotlin", "Java", "Mobile", "Developer"],
    }
    
    # Combine role and job titles for processing
    roles_to_process = job_titles if job_titles else ([role] if role else [])
    
    if not roles_to_process:
        print(f"[NODE 1] No roles to process, returning empty")
        return {"broad_keywords": []}
    
    # Try static map first
    final_keywords = set()
    needs_ai = False
    stack_keywords = set()  # Track stack-specific keywords (MERN, MEAN, etc.)
    
    for title in roles_to_process:
        # Normalize (remove "senior", "junior", etc.)
        import re
        normalized = re.sub(r'\b(senior|junior|lead|principal|staff|mid-level|sr|jr)\b', '', title.lower()).strip()
        normalized = re.sub(r'\s+', ' ', normalized)  # Remove extra spaces
        
        print(f"[NODE 1] Checking static map for: '{normalized}'")
        
        # PRIORITY 1: Check for exact stack matches (MERN, MEAN, etc.)
        if normalized in ['mern', 'mean', 'java full stack', 'python']:
            keywords = STATIC_KEYWORD_MAP[normalized]
            stack_keywords.update(keywords)
            print(f"[NODE 1] ✅ Found STACK in static map: {keywords}")
            if log:
                log("info", f"   ✅ Used stack keywords for '{title}'")
            continue
        
        # PRIORITY 2: Check if normalized title is in static map
        if normalized in STATIC_KEYWORD_MAP:
            keywords = STATIC_KEYWORD_MAP[normalized]
            final_keywords.update(keywords)
            print(f"[NODE 1] ✅ Found in static map: {keywords}")
            if log:
                log("info", f"   ✅ Used cached keywords for '{title}'")
        else:
            # PRIORITY 3: Check if any part of the title matches
            matched = False
            for key in STATIC_KEYWORD_MAP:
                if key in normalized:
                    keywords = STATIC_KEYWORD_MAP[key]
                    final_keywords.update(keywords)
                    print(f"[NODE 1] ✅ Partial match '{key}' in '{normalized}': {keywords}")
                    if log:
                        log("info", f"   ✅ Used cached keywords for '{key}'")
                    matched = True
                    break
            
            if not matched:
                needs_ai = True
                print(f"[NODE 1] ⚠️  No static match for '{normalized}', will use AI")
    
    # If we have stack keywords, prioritize them and filter out conflicting tech
    if stack_keywords:
        print(f"[NODE 1] 🎯 Prioritizing stack keywords: {stack_keywords}")
        final_keywords = stack_keywords
        
        # Filter out conflicting technologies based on user's expert skills
        user_skills_lower = [s.lower() for s in expert_skills]
        
        # Remove conflicting backend languages if user has a primary stack
        if any(skill in user_skills_lower for skill in ['react', 'node', 'mongodb', 'express']):
            # User is MERN - remove Python, Java, .NET, PHP
            final_keywords = {kw for kw in final_keywords if kw.lower() not in ['python', 'java', '.net', 'php', 'django', 'flask', 'spring', 'spring boot']}
        elif any(skill in user_skills_lower for skill in ['angular', 'node', 'mongodb']):
            # User is MEAN - remove Python, Java, .NET, PHP, React
            final_keywords = {kw for kw in final_keywords if kw.lower() not in ['python', 'java', '.net', 'php', 'django', 'flask', 'spring', 'spring boot', 'react', 'vue']}
    
    # Only call AI for unknown roles
    if needs_ai:
        if log:
            log("info", "🧠 Generating keywords for custom roles...")
        
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",  # Best for reasoning tasks
            temperature=0.1,
            api_key=os.getenv("GROQ_API_KEY")
        )
        
        prompt = f"""Generate optimal job search keywords by combining the candidate's expertise with their target roles.

**Candidate's Expertise (Resume):**
- Expert Skills: {', '.join(expert_skills[:7]) if expert_skills else 'Not specified'}
- Primary Stack: {primary_stack or 'Not specified'}
- Years of Experience: {user_yoe}

**Target Roles (What They're Seeking):**
{', '.join(roles_to_process)}

**Strategy:**
1. **Start with target roles** - Extract core keywords from job titles (e.g., "Full Stack Developer" → "Full Stack", "Developer")
2. **Add candidate's expertise** - Include their expert skills that are relevant to target roles
3. **Include stack variations** - If they know MERN, add "React", "Node.js", "MongoDB"
4. **Add role synonyms** - "Developer", "Engineer", "SDE" for broader reach
5. **Limit to 6-8 keywords** - Most relevant ones only

**Balance Rule:**
- If job title is "Backend Developer" but expert_skills = ["react", "vue"] → Still include "Backend" (what they want) + "React" (what they know)
- If job title is "Python Developer" but primary_stack = "MERN" → Include both "Python" (target) and "JavaScript"/"React" (expertise)

**Examples:**

Target: ["Full Stack Developer"]
Expert Skills: ["react", "node", "mongodb"]
Output: ["Full Stack", "React", "Node.js", "MongoDB", "JavaScript", "Developer"]

Target: ["Backend Engineer", "Python Developer"]  
Expert Skills: ["django", "postgresql", "redis"]
Output: ["Backend", "Python", "Django", "PostgreSQL", "Engineer", "Developer"]

Target: ["Software Engineer"]
Expert Skills: ["java", "spring boot", "microservices"]
Output: ["Software", "Java", "Spring Boot", "Backend", "Engineer", "Developer"]

Return ONLY a JSON array: ["keyword1", "keyword2", ...]
"""
        
        try:
            print(f"[NODE 1] Calling AI to generate broad keywords...")
            response = llm.invoke(prompt)
            content = response.content.strip()
            print(f"[NODE 1] AI response: {content}")
            
            # Extract JSON array
            if content.startswith("["):
                ai_keywords = json.loads(content)
            else:
                # Try to find JSON in response
                import re
                match = re.search(r'\[.*?\]', content, re.DOTALL)
                if match:
                    ai_keywords = json.loads(match.group(0))
                else:
                    # Fallback: use first role
                    ai_keywords = [roles_to_process[0]]
            
            final_keywords.update(ai_keywords)
            print(f"[NODE 1] Added AI keywords: {ai_keywords}")
            
        except Exception as e:
            print(f"[NODE 1] AI Error: {e}")
            # Add first role as fallback
            final_keywords.add(roles_to_process[0])
    
    # Convert to list and limit to 8 keywords
    keywords = list(final_keywords)[:8]
    
    # Enhanced logging
    print(f"\n[NODE 1] 📊 Keyword Generation Summary:")
    print(f"  - Final keywords ({len(keywords)}): {keywords}\n")
    
    if log:
        log("info", f"✅ Generated {len(keywords)} keywords: {', '.join(keywords[:5])}...")
    
    return {"broad_keywords": keywords}



def build_queries_node(state: JobHuntState) -> dict:
    """
    Node 2: Build query permutations (Keywords × Locations).
    Smart location handling to avoid duplicate queries.
    """
    print(f"\n[NODE 2] build_queries_node - START")
    log = state.get("log_callback")
    if log:
        log("info", "🔧 Building Adzuna query permutations...")
    
    keywords = state["broad_keywords"]
    criteria = state["criteria"]
    
    # Get locations (only actual cities, not "remote")
    locations = criteria.get("locations", [])
    if not locations:
        locations = ["India"]  # Default
    
    # Location aliases - use ONLY the alias, not both
    # Adzuna prefers these spellings
    location_mapping = {
        "Gurugram": "Gurgaon",  # Use Gurgaon instead
        "Bengaluru": "Bangalore",  # Use Bangalore instead
    }
    
    # Apply mapping
    final_locations = []
    for loc in locations:
        # Use alias if available, otherwise use original
        mapped_loc = location_mapping.get(loc, loc)
        if mapped_loc not in final_locations:
            final_locations.append(mapped_loc)
    
    print(f"[NODE 2] Original locations: {locations}")
    print(f"[NODE 2] Mapped locations: {final_locations}")
    
    # Build permutations
    queries = []
    for keyword in keywords:
        for location in final_locations:
            # Capitalize location properly (bangalore -> Bangalore)
            location_formatted = location.title() if location else location
            queries.append({
                "what": keyword,
                "where": location_formatted,
                "sort_by": "date",
                "max_days_old": 21,  # PHASE 1: Changed from 45 to 21 (fresher jobs)
                "results_per_page": 20
            })
    
    print(f"[NODE 2] Generated {len(queries)} query permutations")
    print(f"[NODE 2] Queries: {queries}")
    if log:
        log("info", f"✅ Generated {len(queries)} queries ({len(keywords)} keywords × {len(final_locations)} locations)")
    return {"adzuna_queries": queries}


def fetch_adzuna_node(state: JobHuntState) -> dict:
    """
    Node 3: Fetch jobs from Adzuna with rate limit handling.
    Processes queries in batches to avoid 429 errors.
    """
    print(f"\n[NODE 3] fetch_adzuna_node - START")
    log = state.get("log_callback")
    if log:
        log("info", "📡 Fetching jobs from Adzuna (async)...")
    
    from utils.async_adzuna import fetch_jobs_async
    import time
    
    queries = state["adzuna_queries"]
    print(f"[NODE 3] Number of queries: {len(queries)}")
    print(f"[NODE 3] Using async fetching with conservative rate limiting...")
    print(f"[NODE 3] Rate limit: 25 req/min | Strategy: 3 concurrent max, 2.5s pacing")
    
    # Start timer
    start_time = time.time()
    
    # Fetch all jobs asynchronously
    all_jobs = fetch_jobs_async(queries)
    
    # Calculate elapsed time
    elapsed = time.time() - start_time
    print(f"[NODE 3] ✅ Fetched {len(all_jobs)} jobs in {elapsed:.1f}s")
    if log:
        log("info", f"✅ Fetched {len(all_jobs)} jobs in {elapsed:.1f}s")
    
    # Improved deduplication: Check title+company FIRST, then URL/ID
    seen_combos = set()
    seen_urls = set()
    seen_ids = set()
    unique_jobs = []
    
    for job in all_jobs:
        # FIRST: Check title + company combination (most reliable)
        title = job.get("title", "").lower().strip()
        company = job.get("company", {})
        if isinstance(company, dict):
            company_name = company.get("display_name", "").lower().strip()
        else:
            company_name = str(company).lower().strip()
        
        combo = f"{title}|{company_name}"
        
        # Skip if we've seen this exact job before
        if combo and combo in seen_combos:
            continue
        
        # SECOND: Check redirect_url (secondary check)
        url = job.get("redirect_url", "")
        if url and url in seen_urls:
            continue
        
        # THIRD: Check job ID (tertiary check)
        job_id = job.get("id", "")
        if job_id and job_id in seen_ids:
            continue
        
        # This is a unique job - add it
        if combo:
            seen_combos.add(combo)
        if url:
            seen_urls.add(url)
        if job_id:
            seen_ids.add(job_id)
        
        unique_jobs.append(job)
    
    print(f"[NODE 3] Total jobs fetched: {len(all_jobs)}")
    print(f"[NODE 3] Total unique jobs after deduplication: {len(unique_jobs)}")
    if log:
        log("info", f"✅ Fetched {len(unique_jobs)} unique jobs from Adzuna")
    
    return {"raw_jobs": unique_jobs, "tier_used": ["tier1_adzuna"]}


def soft_killswitch_node(state: JobHuntState) -> dict:
    """
    Node 4: Apply soft killswitch filtering.
    Remove jobs with negative keywords in title.
    """
    print(f"\n[NODE 4] soft_killswitch_node - START")
    log = state.get("log_callback")
    if log:
        log("info", "🧹 Applying soft killswitch filter...")
    
    jobs = state["raw_jobs"]
    criteria = state["criteria"]
    
    # Use AI-generated negative keywords from Node 0
    negative_keywords = state.get("negative_keywords", [])
    
    # Fallback if no AI keywords
    if not negative_keywords:
        negative_keywords = [
            "sales", "marketing", "recruiter", "hr executive",
            "counselor", "bpo", "technician", "customer support",
            "telecaller", "tele caller", "business development",
            "account manager", "relationship manager", "insurance",
            "loan", "credit", "collection", "field", "driver"
        ]
    
    filtered = []
    for job in jobs:
        title = job.get("title", "").lower()
        description = job.get("description", "").lower()
        
        # Smart negative keyword matching with word boundaries
        import re
        is_negative = False
        for neg in negative_keywords:
            # Check title with word boundaries
            if re.search(rf'\b{re.escape(neg)}\b', title):
                is_negative = True
                break
            # Check description snippet (first 500 chars)
            if len(neg) > 5 and neg in description[:500]:
                is_negative = True
                break
        
        if is_negative:
            continue
        
        # Smart salary filter
        salary_min = job.get("salary_min")
        user_min = criteria.get("salaryMin")
        
        if salary_min and user_min:
            # Only reject if explicitly too low
            if salary_min < user_min:
                continue
        
        filtered.append(job)
    
    print(f"[NODE 4] Soft killswitch: {len(filtered)}/{len(jobs)} jobs retained")
    if log:
        log("info", f"   ✅ Soft killswitch: {len(filtered)}/{len(jobs)} jobs retained")
    return {"filtered_jobs": filtered}


def relevance_ranker_node(state: JobHuntState) -> dict:
    """
    Node 4.5: Deterministic Relevance Ranker (PHASE 2)
    
    Scores jobs mathematically using fingerprint data from Node 0.
    NO AI CALLS - Pure Python logic for instant execution.
    
    Formula: Score = (Title Match × 35) + (Skill Density × 25) + (Freshness × 10) 
                     - (Anti-Pattern × 50) - (Seniority Penalty)
    """
    print(f"\n[NODE 4.5] relevance_ranker_node - START")
    log = state.get("log_callback")
    if log:
        log("info", "🎯 Calculating deterministic relevance scores...")
    
    jobs = state["filtered_jobs"]
    fingerprint = state.get("resume_fingerprint", {})
    
    # Extract fingerprint data (all from Node 0)
    expert_skills = [s.lower() for s in fingerprint.get("expert_skills", [])]
    proficient_skills = [s.lower() for s in fingerprint.get("proficient_skills", [])]
    poison_keywords = [p.lower() for p in fingerprint.get("poison_keywords", [])]
    user_yoe = fingerprint.get("yoe", 0)
    seniority_level = fingerprint.get("seniority_level", "Mid-Level")
    
    print(f"[NODE 4.5] Scoring {len(jobs)} jobs using fingerprint")
    print(f"[NODE 4.5] Expert skills: {expert_skills[:5]}")  # Show first 5
    print(f"[NODE 4.5] Poison keywords: {poison_keywords[:5]}")  # Show first 5
    print(f"[NODE 4.5] User YoE: {user_yoe}, Seniority: {seniority_level}")
    
    import re
    from datetime import datetime
    
    for job in jobs:
        score = 0
        title = job.get("title", "").lower()
        desc = (job.get("description", "") + " " + title).lower()
        
        # Normalize skills for better matching (react.js → react, node.js → node)
        def normalize_skill(skill):
            return skill.replace('.js', '').replace('.', '').strip()
        
        normalized_expert = [normalize_skill(s) for s in expert_skills]
        normalized_proficient = [normalize_skill(s) for s in proficient_skills]
        
        # ===== 1. TITLE MATCH (45 points exact, 25 points partial) =====
        # Exact match: expert skill in title
        exact_match = False
        for skill in normalized_expert:
            if skill and skill in title:
                score += 45  # Increased from 35
                exact_match = True
                break
        
        # Partial match: any skill mentioned in title
        if not exact_match:
            for skill in normalized_expert + normalized_proficient:
                if skill and skill in title:
                    score += 25  # NEW: Partial title match
                    break
        
        # ===== 2. SKILL DENSITY (35 points max) =====
        # Expert skills worth more than proficient
        for skill in normalized_expert:
            if skill:
                count = len(re.findall(rf'\b{re.escape(skill)}\b', desc, re.IGNORECASE))
                if count > 0:
                    score += 10  # Increased from 7
                    score += min(count - 1, 5)  # Extra mentions (max 5, was 3)
        
        for skill in normalized_proficient:
            if skill:
                count = len(re.findall(rf'\b{re.escape(skill)}\b', desc, re.IGNORECASE))
                if count > 0:
                    score += 4  # Increased from 3
                    score += min(count - 1, 3)  # Extra mentions (max 3, was 2)
        
        # ===== 3. ANTI-PATTERN KILLER (-60 points) =====
        # Use poison keywords from fingerprint
        poison_detected = False
        for poison in poison_keywords:
            if poison:
                # Normalize poison keyword too
                poison_norm = normalize_skill(poison)
                # If poison keyword appears 2+ times, it's the core stack (bad!)
                count = desc.count(poison_norm)
                if count >= 2:
                    score -= 60  # Increased from 50
                    poison_detected = True
                    print(f"[NODE 4.5] ⚠️ Poison detected in '{title[:50]}': {poison} ({count}x)")
                    break
        
        # ===== 4. SENIORITY ALIGNMENT (-50 to +15 points) =====
        # Extract required YoE from job description
        required_yoe = extract_required_yoe_from_desc(desc)
        
        if required_yoe > 0 and user_yoe >= 0:
            delta = user_yoe - required_yoe
            
            if -1 <= delta <= 1:
                score += 15  # Perfect match bonus (increased from 10)
            elif delta > 2:
                score -= 15  # Overqualified (increased penalty from 10)
            elif delta < -1:
                score -= abs(delta) * 25  # Underqualified (CRITICAL, increased from 20)
                if abs(delta) >= 2:  # Only log significant mismatches
                    print(f"[NODE 4.5] ⚠️ YoE mismatch in '{title[:50]}': needs {required_yoe}y, user has {user_yoe}y")
        
        # ===== 5. FRESHNESS BOOST (+15 points) =====
        try:
            created = datetime.strptime(job.get("created", ""), "%Y-%m-%dT%H:%M:%SZ")
            days_old = (datetime.now() - created).days
            if days_old < 2:
                score += 15  # Increased from 10
            elif days_old < 7:
                score += 8  # Increased from 5
        except:
            pass
        
        # Store score (allow negative scores)
        job["relevance_score"] = score
    
    # Sort by relevance (highest first)
    jobs.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    
    # ===== DETAILED LOGGING: TOP 20 SCORES =====
    print(f"\n[NODE 4.5] 📊 Top 20 Job Scores:")
    for idx, job in enumerate(jobs[:20], 1):
        title = job.get("title", "Unknown")[:60]
        score = job.get("relevance_score", 0)
        print(f"  {idx:2d}. {title:60s} (Score: {score:3d})")
    print()
    
    # ===== TIERED FILTERING OPTIMIZATION =====
    # 1. Discard jobs with score < 20 (very poor matches)
    jobs_above_threshold = [j for j in jobs if j.get("relevance_score", 0) >= 10]
    discarded_count = len(jobs) - len(jobs_above_threshold)
    
    if discarded_count > 0:
        print(f"[NODE 4.5] ❌ Discarded {discarded_count} jobs with score < 0")
        if log:
            log("info", f"   Discarded {discarded_count} very low scoring jobs")
    
    # 2. Separate top 5 jobs for auto-pass (skip AI in Node 5)
    top_5_jobs = jobs_above_threshold[:5]
    remaining_jobs = jobs_above_threshold[5:]
    
    if jobs_above_threshold:
        top_score = jobs_above_threshold[0].get("relevance_score", 0)
        avg_score = sum(j.get("relevance_score", 0) for j in jobs_above_threshold) / len(jobs_above_threshold)
        print(f"[NODE 4.5] Ranked {len(jobs_above_threshold)} jobs (Top: {top_score}, Avg: {avg_score:.1f})")
        print(f"[NODE 4.5] ✅ Auto-passing top {len(top_5_jobs)} jobs directly to Node 6")
        print(f"[NODE 4.5] 🤖 Sending {len(remaining_jobs)} middle-scoring jobs to Node 5 for AI review")
        if log:
            log("info", f"✅ Ranked {len(jobs_above_threshold)} jobs (Top: {top_score}, Avg: {avg_score:.1f})")
            log("info", f"   Auto-passing top {len(top_5_jobs)} jobs, AI reviewing {len(remaining_jobs)} jobs")
    
    # Store both lists in state
    return {
        "filtered_jobs": remaining_jobs,  # Middle-scoring jobs go to Node 5
        "auto_passed_jobs": top_5_jobs     # Top 5 skip Node 5, go directly to Node 6
    }



def extract_required_yoe_from_desc(desc: str) -> int:
    """
    Extract required years of experience from job description.
    Returns minimum required YoE, or 0 if not found.
    """
    import re
    
    # Patterns: "3-5 years", "3+ years", "minimum 4 years", "at least 5 years"
    patterns = [
        r'(\d+)\+?\s*-?\s*(\d+)?\s*years?\s+(?:of\s+)?experience',
        r'minimum\s+(\d+)\s+years?',
        r'at\s+least\s+(\d+)\s+years?',
        r'(\d+)\s*\+\s*years?'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, desc.lower())
        if matches:
            # Extract first number (minimum requirement)
            if isinstance(matches[0], tuple):
                return int(matches[0][0]) if matches[0][0] else 0
            else:
                return int(matches[0])
    
    return 0  # No YoE requirement found



def ai_cleanup_node(state: JobHuntState) -> dict:
    """
    Node 5: Use AI to filter out irrelevant jobs.
    Validates against agent config (jobTitles, locations, salary).
    """
    print(f"\n[NODE 5] ai_cleanup_node - START")
    log = state.get("log_callback")
    if log:
        log("info", "🤖 AI filtering irrelevant jobs...")
    
    jobs = state["filtered_jobs"]
    criteria = state["criteria"]
    
    if len(jobs) == 0:
        return {"ai_cleaned_jobs": []}
    
    from langchain_groq import ChatGroq
    import os
    import json
    
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",  # More reliable JSON output
        temperature=0.1,
        api_key=os.getenv("GROQ_API_KEY")
    )
    
    # Process in batches for speed
    cleaned = []
    batch_size = 20  # Increased from 10
    max_jobs_to_process = min(len(jobs), 80)  # Reduced from 100
    
    print(f"[NODE 5] Processing {max_jobs_to_process} jobs in batches of {batch_size}")
    
    # Extract agent config criteria
    job_titles = criteria.get('jobTitles', [])
    locations = criteria.get('locations', [])
    salary_range = criteria.get('salaryRange', [])
    employment_types = criteria.get('employmentTypes', [])
    
    for i in range(0, max_jobs_to_process, batch_size):
        batch = jobs[i:i+batch_size]
        
        # Prepare job summaries
        job_summaries = []
        for idx, job in enumerate(batch):
            job_summaries.append({
                "id": idx,
                "title": job.get("title"),
                "company": job.get("company", {}).get("display_name") if isinstance(job.get("company"), dict) else job.get("company"),
                "location": job.get("location", {}).get("display_name") if isinstance(job.get("location"), dict) else job.get("location"),
                "salary_min": job.get("salary_min"),
                "description": job.get("description", "")[:400]
            })
        
        prompt = f"""You are a strict job relevance filter. Review these jobs against the user's search criteria and ONLY keep jobs that match.

**User's Search Criteria:**
- Desired Roles: {', '.join(job_titles) if job_titles else 'Any software role'}
- Target Locations: {', '.join(locations) if locations else 'Any location'}
- Salary Range: {salary_range[0]:,} - {salary_range[1]:,} INR/year (if disclosed)
- Employment Types: {', '.join(employment_types) if employment_types else 'Any type'}

**Jobs to Review:**
{json.dumps(job_summaries, indent=2)}

**STRICT FILTERING RULES:**
1. **Role Match**: Job title MUST relate to one of the desired roles
   - REJECT if it's a different field (sales, marketing, HR, support, BPO, telecaller)
   - REJECT if seniority is completely mismatched (e.g., "Principal" for junior search)

2. **Location Match**: Job location MUST match target locations (or be remote)
   - REJECT if location is not in the list and not remote

3. **Salary Check**: If salary is disclosed and below minimum, REJECT
   - If salary not disclosed, KEEP (benefit of doubt)

4. **Relevance**: Job description MUST align with desired roles
   - REJECT if description is clearly for a different domain

**Output Format:**
Return ONLY a JSON object with IDs of jobs that PASS all criteria.
{{"relevant_ids": [0, 2, 5]}}

Be VERY strict - when in doubt, REJECT.
"""
        
        try:
            response = llm.invoke(prompt)
            content = response.content.strip()
            
            # Extract JSON with better error handling
            import re
            
            # Try to find JSON object
            json_match = re.search(r'\{[^{}]*"relevant_ids"[^{}]*\}', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                
                # Clean up common JSON issues
                json_str = json_str.replace("'", '"')  # Single quotes to double
                json_str = re.sub(r'(\w+):', r'"\1":', json_str)  # Add quotes to keys
                json_str = re.sub(r'""(\w+)":', r'"\1":', json_str)  # Fix double quotes
                
                try:
                    result = json.loads(json_str)
                    relevant_ids = result.get("relevant_ids", [])
                    
                    # Add relevant jobs to cleaned list
                    for job_id in relevant_ids:
                        if 0 <= job_id < len(batch):
                            cleaned.append(batch[job_id])
                    
                    print(f"[NODE 5] Batch {i//batch_size + 1}: {len(relevant_ids)}/{len(batch)} jobs kept")
                except json.JSONDecodeError as je:
                    print(f"[NODE 5] JSON parse error: {je}, keeping all jobs in batch")
                    cleaned.extend(batch)
            else:
                # If no JSON found, try to extract just the array
                array_match = re.search(r'\[[\d,\s]+\]', content)
                if array_match:
                    try:
                        relevant_ids = json.loads(array_match.group(0))
                        for job_id in relevant_ids:
                            if 0 <= job_id < len(batch):
                                cleaned.append(batch[job_id])
                        print(f"[NODE 5] Batch {i//batch_size + 1}: {len(relevant_ids)}/{len(batch)} jobs kept")
                    except:
                        cleaned.extend(batch)
                else:
                    # If parsing fails, keep all (safe fallback)
                    cleaned.extend(batch)
                    print(f"[NODE 5] Batch {i//batch_size + 1}: JSON parse failed, keeping all")
                
        except Exception as e:
            print(f"[NODE 5] AI cleanup failed for batch: {e}")
            # Keep all jobs in this batch on error
            cleaned.extend(batch)
    
    print(f"[NODE 5] AI cleanup complete: {len(cleaned)}/{len(jobs)} jobs retained")
    if log:
        log("info", f"✅ AI cleanup: {len(cleaned)}/{len(jobs)} jobs retained")
    
    # ===== TIERED FILTERING: COMBINE AUTO-PASSED + AI-CLEANED =====
    auto_passed = state.get("auto_passed_jobs", [])
    
    # Combine: auto-passed jobs (top 5) + AI-cleaned jobs
    combined_jobs = auto_passed + cleaned
    
    print(f"[NODE 5] ✅ Combined: {len(auto_passed)} auto-passed + {len(cleaned)} AI-approved = {len(combined_jobs)} total")
    if log:
        log("info", f"   Combined: {len(auto_passed)} auto-passed + {len(cleaned)} AI-approved = {len(combined_jobs)} total")
    
    return {"ai_cleaned_jobs": combined_jobs}



def score_jobs_node(state: JobHuntState) -> dict:
    """
    Node 6: Calculate match scores using batch scoring (5 jobs/batch).
    PHASE 1 OPTIMIZATION: Uses resume fingerprint instead of full text.
    """
    print(f"\n[NODE 6] score_jobs_node - START")
    log = state.get("log_callback")
    if log:
        log("info", "📊 Calculating match scores in batches...")
    
    jobs = state["ai_cleaned_jobs"]
    resume_fingerprint = state.get("resume_fingerprint", {})
    resume_text = state.get("resume_text", "")
    
    # PHASE 1: Prefer fingerprint, fallback to resume_text
    use_fingerprint = bool(resume_fingerprint and resume_fingerprint.get("expert_skills"))
    
    if not use_fingerprint and not resume_text:
        if log:
            log("warning", "No resume data available, using basic scoring")
        print(f"[NODE 6] ⚠️ No resume fingerprint or text available")
        # Fallback: simple keyword matching
        for job in jobs:
            job["matchScore"] = 50  # Default score
        return {"scored_jobs": jobs}
    
    # Limit to top 30 jobs for scoring (save tokens)
    jobs_to_score = jobs[:30]
    
    # Use batch scoring (5 jobs per batch)
    try:
        if use_fingerprint:
            # PHASE 1: Use fingerprint (optimized)
            print(f"[NODE 6] ✅ Using fingerprint for scoring")
            print(f"[NODE 6] Fingerprint: {resume_fingerprint.get('role')}, {resume_fingerprint.get('yoe')}y exp, {len(resume_fingerprint.get('expert_skills', []))} expert skills")
            if log:
                log("info", f"   Using fingerprint: {resume_fingerprint.get('role')}, {resume_fingerprint.get('yoe')}y exp")
            
            from utils.batch_scorer import score_jobs_in_batch
            scored_jobs = score_jobs_in_batch(resume_fingerprint, jobs_to_score, batch_size=5)
        else:
            # Fallback: Use resume_text (old method)
            print(f"[NODE 6] ⚠️ Fingerprint not available, falling back to resume_text")
            print(f"[NODE 6] Resume text length: {len(resume_text)} chars")
            if log:
                log("warning", "   Fingerprint not available, using resume text")
            
            # Create a basic fingerprint from resume_text for compatibility
            basic_fingerprint = {
                "role": "Developer",
                "yoe": 2,
                "expert_skills": ["Programming"],
                "proficient_skills": [],
                "familiar_skills": [],
                "primary_stack": "General",
                "poison_keywords": [],
                "domains": [],
            }
            
            from utils.batch_scorer import score_jobs_in_batch
            scored_jobs = score_jobs_in_batch(basic_fingerprint, jobs_to_score, batch_size=5)
        
        # Sort by score (highest first)
        scored_jobs.sort(key=lambda x: x.get("matchScore", 0), reverse=True)
        
        top_score = scored_jobs[0].get("matchScore", 0) if scored_jobs else 0
        print(f"[NODE 6] Scoring complete. Top score: {top_score}")
        
        if log:
            log("info", f"✅ Scored {len(scored_jobs)} jobs (Top: {top_score})")
        
        return {"scored_jobs": scored_jobs}
        
    except Exception as e:
        print(f"[NODE 6] ❌ Batch scoring failed: {e}")
        import traceback
        traceback.print_exc()
        if log:
            log("error", f"Batch scoring failed: {e}")
        # Fallback scoring
        for job in jobs_to_score:
            job["matchScore"] = 50
        return {"scored_jobs": jobs_to_score}




def validate_links_node(state: JobHuntState) -> dict:
    """
    Node 7: Validate job links using BeautifulSoup (top 15 only).
    OPTIMIZATION: Skip this for speed - Adzuna links are usually valid.
    """
    print(f"\n[NODE 7] validate_links_node - START")
    log = state.get("log_callback")
    
    jobs = state["scored_jobs"]
    
    # OPTIMIZATION: Skip link validation for speed
    # Adzuna API returns fresh jobs (max_days_old=45) so links are usually valid
    # If needed, can enable this later with async processing
    
    print(f"[NODE 7] Skipping link validation for speed (returning top 15 jobs)")
    if log:
        log("info", "⚡ Skipping link validation for speed")
    
    # Return top 15 jobs directly
    validated_jobs = jobs[:15]
    
    return {"validated_jobs": validated_jobs}


def finalize_node(state: JobHuntState) -> dict:
    """
    Node 8: Finalize results with tier classification, badges, and gap analysis.
    PHASE 4: Professional UI/UX polish.
    """
    print(f"\n[NODE 8] finalize_node - START")
    log = state.get("log_callback")
    if log:
        log("info", "🏁 Finalizing results with tier classification...")
    
    from utils.company_tiers import (
        classify_company_tier,
        assign_badges,
        generate_gap_analysis,
        format_salary
    )
    
    jobs = state["validated_jobs"]
    fingerprint = state.get("resume_fingerprint", {})
    
    # Process top 15 jobs
    final_results = []
    
    for rank, job in enumerate(jobs[:15], 1):
        # Extract company name
        company = job.get("company", {})
        if isinstance(company, dict):
            company_name = company.get("display_name", "Unknown Company")
        else:
            company_name = str(company) if company else "Unknown Company"
        
        # Get salary
        salary_min = job.get("salary_min", 0)
        salary_max = job.get("salary_max", 0)
        
        # Classify company tier
        tier = classify_company_tier(company_name, salary_min)
        
        # Assign badges
        badges = assign_badges(job, rank, tier)
        
        # Generate gap analysis
        match_score = job.get("matchScore", 0)
        gap = generate_gap_analysis(job, fingerprint, match_score)
        
        # Format salary
        salary_formatted = format_salary(salary_min, salary_max)
        
        # Build enhanced result
        enhanced_job = {
            # Original fields
            "id": job.get("id"),
            "title": job.get("title"),
            "company": company_name,
            "location": job.get("location", {}).get("display_name", "Not specified"),
            "description": job.get("description", ""),
            "redirect_url": job.get("redirect_url", ""),
            "created": job.get("created", ""),
            
            # Scoring
            "matchScore": match_score,
            "relevance_score": job.get("relevance_score", 0),
            
            # PHASE 4: New fields
            "tierLabel": f"{tier}-Tier",
            "tier": tier,
            "badges": badges,
            "gapAnalysis": gap,
            "salary": salary_formatted,
            "salary_min": salary_min,
            "salary_max": salary_max,
            
            # Metadata
            "rank": rank
        }
        
        final_results.append(enhanced_job)
    
    # Log tier distribution
    tier_counts = {}
    for job in final_results:
        tier = job["tier"]
        tier_counts[tier] = tier_counts.get(tier, 0) + 1
    
    print(f"[NODE 8] Tier distribution: {tier_counts}")
    print(f"[NODE 8] Top 3 jobs:")
    for i, job in enumerate(final_results[:3], 1):
        print(f"  {i}. {job['company']} - {job['title']} ({job['tierLabel']}, Score: {job['matchScore']})")
        print(f"     Badges: {', '.join(job['badges']) if job['badges'] else 'None'}")
        print(f"     Gap: {job['gapAnalysis']}")
    
    if log:
        log("info", f"✅ Returning {len(final_results)} enhanced results")
        log("info", f"   Tier distribution: {tier_counts}")
    
    return {"final_results": final_results}


# ============================================================
# GRAPH CONSTRUCTION
# ============================================================

def create_job_hunt_graph():
    """Create and compile the LangGraph workflow"""
    
    workflow = StateGraph(JobHuntState)
    
    # Add nodes
    workflow.add_node("fetch_user_context", fetch_user_context_node)  # NEW: Node 0
    workflow.add_node("generate_keywords", generate_keywords_node)
    workflow.add_node("build_queries", build_queries_node)
    workflow.add_node("fetch_adzuna", fetch_adzuna_node)
    workflow.add_node("soft_killswitch", soft_killswitch_node)
    workflow.add_node("relevance_ranker", relevance_ranker_node)  # PHASE 2: Node 4.5
    workflow.add_node("ai_cleanup", ai_cleanup_node)
    workflow.add_node("score_jobs", score_jobs_node)
    workflow.add_node("validate_links", validate_links_node)
    workflow.add_node("finalize", finalize_node)
    
    # Define edges
    workflow.set_entry_point("fetch_user_context")  # Start with Node 0
    workflow.add_edge("fetch_user_context", "generate_keywords")
    workflow.add_edge("generate_keywords", "build_queries")
    workflow.add_edge("build_queries", "fetch_adzuna")
    workflow.add_edge("fetch_adzuna", "soft_killswitch")
    workflow.add_edge("soft_killswitch", "relevance_ranker")  # PHASE 2: Add Node 4.5
    workflow.add_edge("relevance_ranker", "ai_cleanup")  # PHASE 2: Node 4.5 → Node 5
    workflow.add_edge("ai_cleanup", "score_jobs")
    workflow.add_edge("score_jobs", "validate_links")
    workflow.add_edge("validate_links", "finalize")
    workflow.add_edge("finalize", END)
    
    return workflow.compile()
