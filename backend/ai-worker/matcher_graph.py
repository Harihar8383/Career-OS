import os
import json
import operator
from typing import TypedDict, List, Dict, Any, Optional, Annotated
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# --- STATE DEFINITION ---
class MatcherState(TypedDict):
    resume_text: str
    jd_text: str
    parsed_jd: Dict[str, Any]
    section_scores: Dict[str, Any]
    keyword_gaps: Dict[str, Any]
    actionable_todos: Dict[str, Any]
    bullet_feedback: List[Dict[str, Any]]
    final_result: Dict[str, Any]
    errors: Annotated[List[str], operator.add]

# --- LLM SETUP ---
def get_llm(temperature=0.1):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in environment variables")
    return ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=api_key, temperature=temperature)

# --- PROMPTS ---

PARSE_JD_PROMPT = """
You are an expert technical recruiter. Extract structured information from this job description.
Output strictly JSON.

Job Description:
{jd_text}

JSON Structure:
{{
  "job_title": "string",
  "company": "string",
  "experience_level": "string",
  "mandatory_skills": ["skill1", "skill2"],
  "optional_skills": ["skill1", "skill2"],
  "core_values": ["value1", "value2"],
  "min_experience_years": integer
}}
"""

SECTION_ANALYSIS_PROMPT = """
Analyze the resume against the JD for the following sections. 
Rate each section 0-100 and provide a status (Strong, Average, Weak).
Be strict but fair.

Resume:
{resume_text}

JD Data:
{parsed_jd}

Required Sections to Analyze:
1. Keywords & Skills Match
2. Experience Relevance
3. Skill Evidence Strength
4. Impact & Metrics
5. ATS Compatibility (Focus on formatting risks, unreadable sections)
6. Role & Seniority Fit
7. Language & Clarity

Output JSON:
{{
  "sections": [
    {{
      "name": "Keywords & Skills Match",
      "score": 0-100,
      "status": "Strong/Average/Weak",
      "what_worked": ["point 1", "point 2"],
      "what_is_missing": ["point 1", "point 2"],
      "impact": "Explanation of how this affects screening"
    }},
    ... (repeat for all 7 sections)
  ]
}}
"""

GAP_ANALYSIS_PROMPT = """
Identify skill gaps between the resume and JD.
Classify them as:
1. Matched (Present in resume)
2. Missing (Critical for JD, absent in resume)
3. Weak (Present but lacks depth/evidence)

Resume:
{resume_text}

JD Data:
{parsed_jd}

Output JSON:
{{
  "matched": ["skill1", "skill2"],
  "missing": ["skill1", "skill2"],
  "weak": ["skill1", "skill2"]
}}
"""

ACTIONS_PROMPT = """
Generate a high-impact "Actionable To-Do List" to improve this resume for the specific JD.
Focus on "Quick Wins" and "High Impact" changes.

Resume:
{resume_text}

JD Data:
{parsed_jd}

Output JSON:
{{
  "top_improvements": [
    {{
      "priority": "High",
      "action": "Short action title",
      "why_it_matters": "Explanation",
      "where_to_apply": "Experience/Projects/Summary"
    }}
  ],
  "skill_evidence_validator": [
    {{
      "skill": "Skill Name",
      "status": "Proven/Weak/Missing",
      "location": "Startups Project / Experience",
      "evidence_strength": "Explanation"
    }}
  ],
  "experience_optimizer": [
    {{
      "original_text": "Original snippet from resume or summary description of what they have",
      "optimized_text": "Rewritten version using strong action verbs and metrics. Must be truthful to the original intent but better phrased."
    }}
  ],
  "missing_section_alerts": [
    {{
      "section_name": "Project/Certification",
      "message": "You are missing X. If you have done it, add this...",
      "suggestion_template": {{ "title": "...", "description": "..." }}
    }}
  ]
}}
"""

FEEDBACK_PROMPT = """
Review user's experience bullet points. Provide specific, constructive feedback.
Do NOT suggest lying. Suggest quantifying impact or clarifying vague terms.
Select top 3-5 weak bullets to critique.

Resume:
{resume_text}

Output JSON:
[
  {{
    "original_bullet": "The exact bullet text",
    "feedback_tag": "Too vague / Missing Outcome / Skill not explicit",
    "explanation": "Why this is weak",
    "improvement_example": "A better version of the same bullet"
  }}
]
"""

HEADER_PROMPT = """
Based on the analysis, generate the header summary.
Total Score: {score}
Verdict: {verdict}

Output JSON:
{{
  "one_line_summary": "Your resume matches ~X% of this job's screening expectations.",
  "emotional_line": "Encouraging but realistic text. E.g. 'You're close! A few updates to...'"
}}
"""

# --- HELPERS ---

import re

def clean_json(text):
    """
    Robust JSON extraction that handles markdown blocks, raw JSON, and preamble text.
    It attempts to find the largest valid JSON object or array.
    """
    text = text.strip()
    
    # 1. Try finding markdown JSON block
    match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
    if match:
        text = match.group(1).strip()
        
    # 2. Try generic code block if no json block
    if not match:
        match = re.search(r'```\s*(.*?)\s*```', text, re.DOTALL)
        if match:
            text = match.group(1).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # 3. Fallback: Find the first occurrence of '{' or '['
        start_brace = text.find('{')
        start_bracket = text.find('[')
        
        start_index = -1
        is_object = False
        
        if start_brace != -1 and (start_bracket == -1 or start_brace < start_bracket):
            start_index = start_brace
            is_object = True
        elif start_bracket != -1:
            start_index = start_bracket
            is_object = False
            
        if start_index == -1:
             print(f"   [graph] ❌ JSON Parsing Failed (No JSON found). Raw text: {text[:200]}...")
             raise ValueError("No JSON object or array found in response.")

        # Try to parse from start_index to the end, then progressively shrink from the end
        # This is inefficient but robust for "Extra data" issues
        for end_index in range(len(text), start_index, -1):
            try:
                candidate = text[start_index:end_index]
                return json.loads(candidate)
            except json.JSONDecodeError:
                continue
        
        print(f"   [graph] ❌ JSON Parsing Failed (Structure invalid). Raw text: {text[:200]}...")
        raise ValueError("Could not extract valid JSON from text.")

# --- NODES Implementation ---

def parse_jd_node(state: MatcherState):
    print("   [graph] Parsing JD...")
    try:
        llm = get_llm()
        result = llm.invoke(PARSE_JD_PROMPT.format(jd_text=state['jd_text']))
        parsed = clean_json(result.content)
        return {"parsed_jd": parsed}
    except Exception as e:
        print(f"   [graph] Error parsing JD: {e}")
        return {"errors": [str(e)]}

def analyze_sections_node(state: MatcherState):
    print("   [graph] Analyzing Sections...")
    try:
        llm = get_llm()
        result = llm.invoke(SECTION_ANALYSIS_PROMPT.format(
            resume_text=state['resume_text'][:10000], 
            parsed_jd=json.dumps(state['parsed_jd'])
        ))
        data = clean_json(result.content)
        return {"section_scores": data}
    except Exception as e:
         return {"errors": [str(e)]}

def analyze_gaps_node(state: MatcherState):
    print("   [graph] Analyzing Gaps...")
    try:
        llm = get_llm()
        result = llm.invoke(GAP_ANALYSIS_PROMPT.format(
            resume_text=state['resume_text'][:10000], 
            parsed_jd=json.dumps(state['parsed_jd'])
        ))
        data = clean_json(result.content)
        return {"keyword_gaps": data}
    except Exception as e:
         return {"errors": [str(e)]}

def generate_actions_node(state: MatcherState):
    print("   [graph] Generating Actions...")
    try:
        llm = get_llm()
        result = llm.invoke(ACTIONS_PROMPT.format(
            resume_text=state['resume_text'][:10000], 
            parsed_jd=json.dumps(state['parsed_jd'])
        ))
        data = clean_json(result.content)
        return {"actionable_todos": data}
    except Exception as e:
         return {"errors": [str(e)]}

def generate_feedback_node(state: MatcherState):
    print("   [graph] Generating Bulletin Feedback...")
    try:
        llm = get_llm()
        result = llm.invoke(FEEDBACK_PROMPT.format(resume_text=state['resume_text'][:10000]))
        data = clean_json(result.content)
        return {"bullet_feedback": data}
    except Exception as e:
         return {"errors": [str(e)]}

def aggregator_node(state: MatcherState):
    print("   [graph] Aggregating Results...")
    
    # Calculate overall match score from sections
    sections = state.get('section_scores', {}).get('sections', [])
    total = 0
    count = 0
    for s in sections:
        total += s.get('score', 0)
        count += 1
    
    avg_score = int(total / count) if count > 0 else 0
    
    # Determined Verdict
    verdict = "Likely Filtered Out"
    if avg_score >= 80: verdict = "Competitive Profile"
    elif avg_score >= 60: verdict = "Borderline Profile"

    # Generate Header Text (simple call)
    llm = get_llm()
    try:
        header_res = llm.invoke(HEADER_PROMPT.format(score=avg_score, verdict=verdict))
        header_data = clean_json(header_res.content)
    except:
        header_data = {
            "one_line_summary": f"Your resume matches ~{avg_score}% of this job's screening expectations.",
            "emotional_line": "Review the detailed breakdown below to improve your score."
        }
    
    parsed = state.get('parsed_jd', {})
    
    final_result = {
        "match_score": avg_score,
        "verdict": verdict,
        "header_summary": header_data.get("one_line_summary"),
        "emotional_line": header_data.get("emotional_line"),
        "jd_summary": {
            "job_title": parsed.get('job_title', 'Unknown Role'),
            "company": parsed.get('company', 'Unknown Company'),
            "experience_level": parsed.get('experience_level', 'N/A'),
            "top_skills": parsed.get('mandatory_skills', [])[:3]
        },
        "sections": sections,
        "ats_compatibility": next((s for s in sections if s["name"] == "ATS Compatibility"), {}),
        "keyword_gap": state.get("keyword_gaps", {}),
        "actionable_todos": state.get("actionable_todos", {}),
        "bullet_feedback": state.get("bullet_feedback", [])
    }
    
    return {"final_result": final_result}

# --- GRAPH BUILDER ---
def build_matcher_graph():
    workflow = StateGraph(MatcherState)

    workflow.add_node("parse_jd", parse_jd_node)
    workflow.add_node("analyze_sections", analyze_sections_node)
    workflow.add_node("analyze_gaps", analyze_gaps_node)
    workflow.add_node("generate_actions", generate_actions_node)
    workflow.add_node("generate_feedback", generate_feedback_node)
    workflow.add_node("aggregator", aggregator_node)

    workflow.set_entry_point("parse_jd")
    
    workflow.add_edge("parse_jd", "analyze_sections")
    workflow.add_edge("parse_jd", "analyze_gaps")
    workflow.add_edge("parse_jd", "generate_actions")
    workflow.add_edge("parse_jd", "generate_feedback")

    workflow.add_edge("analyze_sections", "aggregator")
    workflow.add_edge("analyze_gaps", "aggregator")
    workflow.add_edge("generate_actions", "aggregator")
    workflow.add_edge("generate_feedback", "aggregator")

    workflow.add_edge("aggregator", END)

    return workflow.compile()
