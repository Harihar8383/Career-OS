"""
JD Matcher wrapper for Job Hunter Agent.
Provides a simple interface to calculate match scores.
"""

from matcher_graph import build_matcher_graph
import logging

logger = logging.getLogger(__name__)


def calculate_match_score(resume_text: str, job_description: str) -> int:
    """
    Calculate match score between resume and job description.
    
    Args:
        resume_text: User's resume text
        job_description: Job description text
        
    Returns:
        Match score (0-100)
    """
    try:
        # Build matcher graph
        graph = build_matcher_graph()
        
        # Initialize state
        state = {
            "resume_text": resume_text,
            "jd_text": job_description,
            "parsed_jd": {},
            "section_scores": {},
            "keyword_gaps": {},
            "actionable_todos": {},
            "bullet_feedback": [],
            "final_result": {},
            "errors": []
        }
        
        # Execute graph
        result = graph.invoke(state)
        
        # Extract match score
        final_result = result.get("final_result", {})
        match_score = final_result.get("match_score", 50)
        
        return match_score
        
    except Exception as e:
        logger.error(f"JD Matcher failed: {e}")
        # Return default score on error
        return 50
