"""
Hunt Orchestrator - Coordinates the tiered waterfall job search logic
TIER 1 (GREEN): Adzuna API → Exit if >15 jobs
TIER 2 (YELLOW): Tavily + HiringCafe → Exit if >20 total jobs
TIER 3 (RED): Reserved for future JobSpy integration (high risk)
"""

import os
import json
import pika
import time
import re
from typing import List, Dict, Callable, Optional, Set
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Import tier clients
from tier1_adzuna import AdzunaClient
from tier2_tavily import TavilyJobSearch
from tier2_hiringcafe import HiringCafeClient
from url_validator import URLValidator

class LogPublisher:
    """Publishes logs to RabbitMQ for real-time streaming"""
    
    def __init__(self, channel, session_id: str, user_id: str):
        self.channel = channel
        self.session_id = session_id
        self.user_id = user_id
        self.log_queue = "job_hunt_logs_queue"
        
        # Ensure queue exists
        if channel:
            channel.queue_declare(queue=self.log_queue, durable=True)
    
    def emit(self, level: str, message: str):
        """
        Emit a log message to RabbitMQ
        
        Args:
            level: Log level (info, success, warning, error)
            message: Log message
        """
        if not self.channel:
            print(f"[{level.upper()}] {message}")
            return
        
        log_entry = {
            "sessionId": self.session_id,
            "userId": self.user_id,
            "level": level,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            self.channel.basic_publish(
                exchange='',
                routing_key=self.log_queue,
                body=json.dumps(log_entry),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                )
            )
        except Exception as e:
            print(f"[ERROR] Failed to publish log: {e}")


class HuntOrchestrator:
    """
    Orchestrates the tiered waterfall job search
    """
    
    # Exit thresholds
    TIER1_EXIT_THRESHOLD = 15  # Stop after Tier 1 if >15 jobs
    TIER2_EXIT_THRESHOLD = 20  # Stop after Tier 2 if >20 total jobs
    
    def __init__(self, rabbitmq_channel=None, llm_client=None):
        """
        Initialize orchestrator
        
        Args:
            rabbitmq_channel: RabbitMQ channel for log publishing (optional)
            llm_client: LangChain/Groq object for AI query generation (optional)
        """
        self.rabbitmq_channel = rabbitmq_channel
        self.llm_client = llm_client
        
        # Initialize tier clients
        self.tier1_adzuna = AdzunaClient()
        self.tier2_tavily = TavilyJobSearch()
        self.tier2_hiringcafe = HiringCafeClient()
        self.validator = URLValidator()
        
    def _generate_smart_queries(self, criteria: Dict, log: Callable) -> Dict:
        """
        Generate AI-optimized search queries using Groq
        """
        if not self.llm_client:
            return {}
            
        try:
            log("info", "🧠 AI AGENT: crafting optimized search queries...")
            
            prompt = f"""
            You are an expert Recruitment Search Engineer.
            Create HIGHLY OPTIMIZED boolean search strings for finding this job.
            
            User Criteria:
            {json.dumps(criteria, indent=2)}
            
            Task:
            1. Analyze the Role and Location.
            2. specific keywords to find DIRECT job postings (avoid aggregators).
            3. For Tavily, creating a Google-dork style query restricting to ATS sites.
            4. For Adzuna, generate a list of 3-5 BROAD synonyms/variations to maximize recall (e.g. if 'MERN Stack', use ['MERN', 'Full Stack', 'Node.js', 'React']).
            
            Output strictly valid JSON:
            {{
                "tavily_query": "Role Location jobs (site:lever.co OR ...)",
                "adzuna_titles": ["term1", "term2", "term3"]
            }}
            """
            
            response = self.llm_client.invoke(prompt)
            content = response.content
            
            # extract json
            import re
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return {}
            
        except Exception as e:
            log("warning", f"⚠️ AI Query Gen failed: {e}. Using templates.")
            return {}

    def _get_user_resume(self, user_id: str) -> str:
        """
        Retrieve user's raw resume text from MongoDB for JD matching.
        Uses the same logic as JD matcher worker.
        
        Args:
            user_id: Clerk User ID
            
        Returns:
            Raw resume text or empty string if not found
        """
        try:
            from pymongo import MongoClient
            
            mongo_uri = os.getenv("MONGODB_URI")
            if not mongo_uri:
                return ""
            
            client = MongoClient(mongo_uri)
            db = client["career_os"]
            users = db["users"]
            
            # Query by clerkId (same as JD matcher)
            user_profile_doc = users.find_one({"clerkId": user_id})
            
            if not user_profile_doc or 'profile' not in user_profile_doc:
                print(f"[Resume] No user profile found for clerkId: {user_id}")
                return ""
            
            # Get raw resume text from profile.raw_resume_text (same as JD matcher)
            user_raw_resume = user_profile_doc.get('profile', {}).get('raw_resume_text', "")
            
            if not user_raw_resume:
                print(f"[Resume] No raw resume text found for user: {user_id}")
                return ""
            
            print(f"[Resume] Found raw resume text: {len(user_raw_resume)} chars")
            return user_raw_resume
            
        except Exception as e:
            print(f"[Resume] Error fetching resume: {e}")
            import traceback
            traceback.print_exc()
            return ""
    
    def execute_hunt(
        self,
        session_id: str,
        user_id: str,
        criteria: Dict
    ) -> Dict:
        """
        Execute the job hunt using LangGraph workflow.
        
        Args:
            session_id: Unique session identifier
            user_id: User ID
            criteria: Search criteria dict
            
        Returns:
            Dict with success, totalJobs, jobs, tierUsed
        """
        # Initialize logging
        log_publisher = LogPublisher(self.rabbitmq_channel, session_id, user_id)
        
        def log(level: str, message: str):
            """Helper to emit logs"""
            log_publisher.emit(level, message)
        
        log("info", "")
        log("info", "="*60)
        log("info", "🚀 JOB HUNTER AGENT: Starting LangGraph workflow...")
        log("info", "="*60)
        
        try:
            # Import and create graph
            from agent.job_hunter_graph import create_job_hunt_graph
            
            print(f"\n{'='*80}")
            print(f"[HUNT] Creating LangGraph workflow...")
            graph = create_job_hunt_graph()
            print(f"[HUNT] Graph created successfully")
            
            # Get user's resume for JD matching
            log("info", "📄 Fetching user resume for JD matching...")
            print(f"[HUNT] Fetching resume for user: {user_id}")
            resume_text = self._get_user_resume(user_id)
            
            if resume_text:
                log("success", f"✅ Resume loaded ({len(resume_text)} characters)")
                print(f"[HUNT] Resume loaded: {len(resume_text)} chars")
            else:
                log("warning", "⚠️ No resume found - match scores will be basic")
                print(f"[HUNT] WARNING: No resume found")
            
            # Initialize state
            print(f"[HUNT] Initializing graph state...")
            print(f"[HUNT] Criteria: {json.dumps(criteria, indent=2)}")
            
            initial_state = {
                "criteria": criteria,
                "user_id": user_id,
                "session_id": session_id,
                "resume_text": resume_text,
                "log_callback": log,  # Pass log function to graph nodes
                # NEW: Optimization fields (will be populated by Node 0)
                "user_skills": [],
                "negative_keywords": [],
                "positive_synonyms": {},
                # Processing fields
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
            
            # Execute graph
            log("info", "🔄 Executing LangGraph workflow...")
            print(f"[HUNT] Starting graph execution...")
            print(f"[HUNT] Initial state keys: {list(initial_state.keys())}")
            
            final_state = graph.invoke(initial_state)
            
            print(f"[HUNT] Graph execution completed")
            print(f"[HUNT] Final state keys: {list(final_state.keys())}")
            
            # Extract results
            final_results = final_state.get("final_results", [])
            tier_used = final_state.get("tier_used", [])
            
            print(f"[HUNT] Final results count: {len(final_results)}")
            print(f"[HUNT] Tiers used: {tier_used}")
            print(f"[HUNT] Raw jobs: {len(final_state.get('raw_jobs', []))}")
            print(f"[HUNT] Filtered jobs: {len(final_state.get('filtered_jobs', []))}")
            print(f"[HUNT] AI cleaned jobs: {len(final_state.get('ai_cleaned_jobs', []))}")
            print(f"[HUNT] Scored jobs: {len(final_state.get('scored_jobs', []))}")
            print(f"[HUNT] Validated jobs: {len(final_state.get('validated_jobs', []))}")
            
            log("success", "")
            log("success", "="*60)
            log("success", "🎉 HUNT COMPLETE!")
            log("success", f"   Total jobs found: {len(final_results)}")
            log("success", f"   Tiers used: {', '.join(tier_used)}")
            
            if len(final_results) == 0:
                log("warning", "   No jobs found matching your criteria")
            else:
                log("success", f"   Top match score: {final_results[0].get('matchScore', 0)}%")
            
            log("success", "="*60)
            
            return {
                "success": True,
                "totalJobs": len(final_results),
                "jobs": final_results,
                "tierUsed": tier_used
            }
            
        except Exception as e:
            log("error", f"❌ Hunt failed: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "totalJobs": 0,
                "jobs": [],
                "tierUsed": [],
                "error": str(e)
            }
    
    def _finalize_results(
        self,
        all_jobs: List[Dict],
        tier_used: List[str],
        session_id: str,
        user_id: str,
        log: Callable
    ) -> Dict:
        """Finalize results: validate URLs, calculate scores, deduplicate"""
        
        log("info", "")
        log("info", "="*60)
        log("info", "🔍 VALIDATION PHASE: Checking job URLs...")
        
        # Remove duplicates based on applyLink
        unique_jobs = []
        seen_urls = set()
        
        for job in all_jobs:
            url = job.get("applyLink", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_jobs.append(job)
        
        log("info", f"   Removed {len(all_jobs) - len(unique_jobs)} duplicate jobs")
        
        # Validate URLs (limit to 30 to avoid excessive requests)
        validated_jobs = self.validator.batch_validate(
            unique_jobs,
            log_callback=log,
            max_to_validate=30
        )
        
        # Calculate match scores (simple keyword matching)
        scored_jobs = self._calculate_match_scores(validated_jobs, log)
        
        # Sort by match score (highest first)
        scored_jobs.sort(key=lambda x: x.get("matchScore", 0), reverse=True)
        
        log("info", "")
        log("success", "="*60)
        log("success", f"🎉 HUNT COMPLETE!")
        log("success", f"   Total jobs found: {len(scored_jobs)}")
        log("success", f"   Tiers used: {', '.join(tier_used)}")
        log("success", f"   Top match score: {scored_jobs[0].get('matchScore', 0)}%" if scored_jobs else "   No jobs found")
        log("info", "")
        log("info", "💾 Saving results to database...")
        
        return {
            "success": True,
            "totalJobs": len(scored_jobs),
            "jobs": scored_jobs,
            "tierUsed": tier_used,
            "sessionId": session_id
        }
    
    def _calculate_match_scores(self, jobs: List[Dict], log: Callable) -> List[Dict]:
        """Calculate simple match scores for jobs (0-100)"""
        log("info", "")
        log("info", "="*60)
        log("info", "🧠 ANALYST AGENT: analyzing job descriptions...")
        log("info", "   ⚙️ Model: Rule-Based Efficiency Scoring (Phase 1)")
        log("info", "   📊 Criteria: Description quality, Salary presence, Location precision, Company reputation")
        
        for job in jobs:
            # Simple scoring: base score of 50, add points for completeness
            score = 50
            
            if job.get("description"):
                score += 10
            if job.get("salary") and job["salary"] != "Not disclosed":
                score += 10
            if job.get("location") and job["location"] not in ["See job posting", "Not specified"]:
                score += 10
            if job.get("company") not in ["Unknown Company", "See job posting"]:
                score += 10
            if job.get("postedDate"):
                score += 10
            
            job["matchScore"] = min(score, 100)
        
        return jobs

    def _soft_cleanup_jobs(self, jobs: List[Dict], criteria: Dict, log: Callable) -> List[Dict]:
        """
        Clean up jobs using Soft Killswitch logic:
        1. Remove negative titles (sales, bpo)
        2. Deduplicate URLs
        3. Check salary floor (if data exists)
        """
        cleaned = []
        seen_urls = set()
        
        log("info", f">>> DEBUG CLAENUP: Input jobs count: {len(jobs)}")
        
        negative_keywords = ["sales", "marketing", "recruiter", "hr executive", "counselor", "bpo", "technician", "customer support"]
        
        for job in jobs:
            title = job.get('title', '').lower()
            url = job.get('applyLink')
            
            # Deduplicate
            if url in seen_urls:
                # log("info", f">>> DROP DUP: {title}")
                continue
            seen_urls.add(url)
            
            # Title Check
            if any(neg in title for neg in negative_keywords):
                log("info", f">>> DROP NEGATIVE: {title}")
                continue
            
            cleaned.append(job)
            
        log("info", f">>> DEBUG CLEANUP: Output jobs count: {len(cleaned)}")
        return cleaned



# Test function
if __name__ == "__main__":
    orchestrator = HuntOrchestrator(rabbitmq_channel=None)
    
    test_criteria = {
        "role": "Python Developer",
        "location": "Bangalore",
        "salaryMin": 1000000,  # 10L
        "salaryMax": 2500000   # 25L
    }
    
    result = orchestrator.execute_hunt(
        session_id="test-session-123",
        user_id="test-user",
        criteria=test_criteria
    )
    
    print(f"\n{'='*80}")
    print(f"Hunt Result Summary:")
    print(f"  Success: {result['success']}")
    print(f"  Total Jobs: {result['totalJobs']}")
    print(f"  Tiers Used: {result['tierUsed']}")
    
    if result['jobs']:
        print(f"\nTop 3 Jobs:")
        for i, job in enumerate(result['jobs'][:3], 1):
            print(f"\n{i}. {job['title']} at {job['company']}")
            print(f"   Score: {job['matchScore']}% | Source: {job['source']}")
            print(f"   {job['applyLink'][:70]}...")
