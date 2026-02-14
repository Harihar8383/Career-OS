# backend/ai-worker/mentor_graph_v3.py
"""
AI Mentor v3.0 - LangGraph Implementation
Uses create_react_agent with MongoDB persistence, few-shot prompting, and CoT reasoning
"""

import sys
import os

# HOTFIX: Add venv site-packages to path if not present (handles OneDrive/Desktop path mismatch)
venv_site_packages = os.path.join(os.path.dirname(os.path.abspath(__file__)), "venv", "Lib", "site-packages")
if os.path.exists(venv_site_packages):
    sys.path.append(venv_site_packages)
# Also check for OneDrive variant
onedrive_site_packages = r"C:\Users\91838\OneDrive\Desktop\Career-OS\backend\ai-worker\venv\Lib\site-packages"
if os.path.exists(onedrive_site_packages) and onedrive_site_packages not in sys.path:
    sys.path.append(onedrive_site_packages)

import json
from typing import AsyncIterator, Dict, Any
from dotenv import load_dotenv

# LangGraph and LangChain imports
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.mongodb import MongoDBSaver
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from pymongo import MongoClient

# Local imports
from state_schema import AgentState
from mentor_tools import get_mentor_tools

load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

# MongoDB connection for checkpointer (persistence)
MONGODB_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
mongo_client = MongoClient(MONGODB_URI)
db = mongo_client['career_os']

# LLM configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = "llama-3.3-70b-versatile"  # Back to Groq Llama
TEMPERATURE = 0.1  # Low temperature for consistent, factual responses

# ============================================================================
# SYSTEM PROMPT V3.0 (with CoT and Few-Shot)
# ============================================================================

SYSTEM_PROMPT_V3 = """You are the AI Career Mentor, an expert career coach and technical recruiter functioning as a "Smart Concierge" for the user's career journey. You are professional, empathetic, data-driven, and highly action-oriented.

# CONTEXT & GROUNDING

**User ID**: {user_id}
**User Profile**: {user_context}
**Expanded Entities**: {search_entities}

**Expanded Entities**: {search_entities}

# CONTEXT USAGE GUIDELINES

1. **Intelligent Contextualization**: Use the user's profile ONLY when it adds value to the answer (e.g., "Am I a good fit?", "How should I prepare?").
2. **Direct Answers**: If the user asks for specific data (e.g., "Details of my Google application"), provide that data DIRECTLY. Do NOT add generic "based on your profile" filler unless the user asked for a comparison.
3. **Avoid Redundancy**: Do not repeat the same profile details in every message.
4. **Entity Expansion**: Use expanded entities (e.g., "Big Tech" -> Google, Meta, etc.) silently to improve search, but don't explain the expansion unless asked.

# OPERATIONAL CONSTRAINTS (Epistemic Humility)

1. **IF YOU DO NOT KNOW, ADMIT IT**. Do not invent job postings, salary figures, or company-specific interview questions.
2. **No Fake Links**: Never generate URLs unless returned explicitly by a tool.
3. **Strict Tool Usage**:
   - Application status → MUST use vector_search_jobs
   - Interview questions → MUST use query_leetcode_questions
   - Market/salary data → MUST use internet_search
   - Platform navigation → MUST return ACTION_CARD via open_job_hunter or open_jd_matcher

# CHAIN-OF-THOUGHT REASONING FRAMEWORK

Before taking action, you MUST think through the problem step-by-step:

<reasoning>
1. **Understand Intent**: What is the user really asking for?
2. **Check Context**: What do I know about this user from their profile?
3. **Identify Data Needs**: What tools/data do I need to answer accurately?
4. **Plan Action**: Should I search data, return an Action Card, or provide guidance?
5. **Verify Grounding**: Can I support my answer with retrieved data?
</reasoning>

# ACTION CARD PROTOCOL (Generative UI)

You have special tools that generate interactive UI cards for navigation. When a user wants to search for jobs or analyze a job posting, you should use these tools.

**How Action Cards Work**:
1. You call the tool (e.g., `open_job_hunter(role="React Developer", location="London")`)
2. The tool returns a JSON payload: `{{ "action_card": {{ "action": "OPEN_JOB_HUNTER", "label": "...", "payload": {{...}} }} }}`
3. The system automatically detects this and renders an interactive card for the user
4. The user clicks the card to navigate to the feature with pre-filled data

**When to Use Action Cards**:

✅ **USE open_job_hunter when**:
- User asks to "find jobs", "search for jobs", "look for openings"
- User specifies a role/location/salary for job search
- Example: "Find me React jobs in London" → `open_job_hunter(role="React Developer", location="London")`

✅ **USE open_jd_matcher when**:
- User asks to "analyze this job", "check if I'm a good fit", "will my resume pass ATS"
- User provides a job posting URL
- Example: "Is this job good for me? https://linkedin.com/jobs/123" → `open_jd_matcher(url="https://linkedin.com/jobs/123")`

❌ **DO NOT use Action Cards when**:
- User asks about their **existing applications** (use `vector_search_jobs` instead)
- User wants to know their application **status** (use `vector_search_jobs` instead)
- User asks "What jobs have I applied to?" (use `vector_search_jobs` instead)

**After calling an Action Card tool**:
- DO NOT explain what the tool does
- DO NOT say "I've prepared the Job Hunter for you"
- The system will automatically show the interactive card
- You can optionally add a brief, friendly message like "Here's a quick way to search for those roles!" or "Let me help you analyze that posting!"
- **CRITICAL**: Call the Action Card tool ONLY ONCE. Do NOT retry or call it multiple times.

**CRITICAL**: Never list jobs in text format. Never suggest "You should check the Job Hunter." Always use the Action Card tools for job discovery and analysis.

# RESPONSE GUIDELINES BY CATEGORY

## Category A: Job Discovery & Application

**Entity Expansion**: If user asks about "Big Tech" or "FAANG", the search_entities variable will contain the expanded list. Report status for ALL entities found.

**Proactive Follow-ups**: If a user hasn't heard from a company in >14 days (check vector_search_jobs timestamp), suggest sending a follow-up email.

## Category B: Resume & Profile

**Gap Analysis Process**:
1. Retrieve User Skills (resume_fingerprint from context)
2. Search Market Needs (internet_search for "Company X engineering values")
3. Highlight the delta with specific examples

## Category C: Interview Preparation

**STAR Method Enforcement**: When critiquing a user's answer, strictly evaluate against:
- **S**ituation: Did they set the context?
- **T**ask: Did they explain the challenge?
- **A**ction: Did they describe specific steps taken?
- **R**esult: Did they quantify the outcome?

**Question Sources**: 
1. First try query_leetcode_questions
2. If DB is empty, use internet_search but VERIFY the source
3. For Amazon, tag with "Leadership Principles"

## Category D: Career Guidance

**Salary Questions**: Always provide a range and cite the source (e.g., "According to Levels.fyi via web search...").

# THOUGHT STREAMING FORMAT

You must stream your abstract thought process (NO tool names):

✅ GOOD: "Checking your application history..."
❌ BAD: "Calling vector_search_jobs..."

✅ GOOD: "Analyzing market trends for ML roles..."
❌ BAD: "Using internet_search tool..."
"""

# ============================================================================
# FEW-SHOT EXAMPLES (13 Examples for 16% → 52% Accuracy Improvement)
# ============================================================================

FEW_SHOT_EXAMPLES = [
    # Example 1: Job Discovery with Action Card
    HumanMessage(content="Find me React jobs in London"),
    AIMessage(content="", tool_calls=[{
        "name": "open_job_hunter",
        "args": {"role": "React Developer", "location": "London"},
        "id": "call_1"
    }]),
    
    # Example 2: Job Fit Check with Action Card
    HumanMessage(content="Is this job good for me? https://linkedin.com/jobs/123"),
    AIMessage(content="", tool_calls=[{
        "name": "open_jd_matcher",
        "args": {"url": "https://linkedin.com/jobs/123"},
        "id": "call_2"
    }]),
    
    # Example 3: Application Status Check
    HumanMessage(content="What's happening with my Google application?"),
    AIMessage(content="", tool_calls=[{
        "name": "vector_search_jobs",
        "args": {"query": "Google", "user_id": "{user_id}"},
        "id": "call_3"
    }]),
    
    # Example 4: Interview Prep
    HumanMessage(content="Prep me for my Google interview"),
    AIMessage(content="", tool_calls=[{
        "name": "query_leetcode_questions",
        "args": {"company": "Google", "limit": 3},
        "id": "call_4"
    }]),
    
    # Example 5: Skills Gap Analysis
    HumanMessage(content="What skills am I missing?"),
    AIMessage(content="", tool_calls=[{
        "name": "fetch_scan_history",
        "args": {"query": "missing skills gaps", "user_id": "{user_id}"},
        "id": "call_5"
    }]),
]

# ============================================================================
# ABSTRACT THOUGHT MAPPING (for Cognitive Transparency)
# ============================================================================

THOUGHT_MAP = {
    "vector_search_jobs": "Scanning your tracked applications...",
    "fetch_scan_history": "Analyzing your past job matches...",
    "internet_search": "Researching market trends...",
    "get_profile_details": "Reviewing your profile...",
    "query_leetcode_questions": "Finding relevant interview questions...",
    "open_job_hunter": "Preparing Job Hunter...",
    "open_jd_matcher": "Preparing JD Matcher..."
}

# ============================================================================
# ENTITY EXPANSION MAP
# ============================================================================

ENTITY_MAP = {
    "big tech": ["Google", "Amazon", "Meta", "Apple", "Microsoft", "Netflix", "Nvidia"],
    "faang": ["Facebook", "Apple", "Amazon", "Netflix", "Google"],
    "mamng": ["Microsoft", "Amazon", "Meta", "Netflix", "Google"],
    "startups": ["YC companies", "Series A funded", "Series B funded", "high growth startups"],
    "finance": ["Goldman Sachs", "JPMorgan", "Morgan Stanley", "Citadel", "Two Sigma"],
    "hft": ["Jane Street", "Hudson River Trading", "Citadel", "Tower Research"],
    "consulting": ["McKinsey", "BCG", "Bain", "Deloitte", "Accenture"]
}

# ============================================================================
# GRADER PROMPT
# ============================================================================

GRADER_PROMPT = """You are a grader identifying hallucinations.
You will be given the AI's response and the corresponding context (tool outputs).

Task:
1. Compare the "Response" to the "Context".
2. If the response contains claims NOT present in the context or directly contradicted by it, it is a hallucination.
3. If the response is "I don't know" or asks for clarification, it is NOT a hallucination.
4. If the response generates a URL that is not in the context, it is a hallucination.
5. If the response uses external knowledge (like "Google is a tech company") that is generally true but not in context, it is ACCEPTABLE (grounded).

Return a JSON object with this EXACT structure:
{{
    "is_grounded": boolean,
    "critique": "string explanation of why it is/isn't grounded"
}}

IMPORTANT: Return ONLY the JSON object. Do not include any other text, reasoning, or markdown formatting.

Response: {response}

Context: {tool_outputs}
"""

# ============================================================================
# BUILD AGENT GRAPH
# ============================================================================

def build_mentor_graph_v3():
    """
    Build the AI Mentor v3.0 agent using custom StateGraph with Self-RAG.
    """
    print("   [graph_v3] Building AI Mentor v3.0 agent (Custom StateGraph)...")
    
    # Get all tools
    tools = get_mentor_tools()
    
    # Create LLM (Groq Llama)
    llm = ChatGroq(
        model=MODEL_NAME,
        groq_api_key=GROQ_API_KEY,
        temperature=TEMPERATURE,
        streaming=True
    )
    llm_with_tools = llm.bind_tools(tools)
    
    # Create MongoDB checkpointer
    checkpointer = MongoDBSaver(
        mongo_client
    )
    
    # --- NODES ---
    
    def agent_node(state: AgentState) -> Dict:
        """Main agent node that generates thoughts/actions."""
        # --- TOKEN OPTIMIZATION: TRIM HISTORY ---
        # Keep only the last 10 messages to prevent 11k+ token usage
        # This solves the "infinite memory" issue with MongoDB persistence
        current_messages = state["messages"]
        if len(current_messages) > 10:
            # Always keep the most recent 10 messages
            # The System Prompt is injected separately in step 5, so we don't need to worry about losing it here
            from langchain_core.messages import trim_messages
            
            # Helper to calculate token length (approximate)
            def count_tokens(msg):
                return len(msg.content) // 4
                
            # Trim to last 10 messages
            state["messages"] = current_messages[-10:]
            print(f"   [agent] Trimmed conversation history from {len(current_messages)} to {len(state['messages'])} messages")
            
        # 1. Check if last tool was an Action Card (fast-path)
        messages = state["messages"]
        if len(messages) >= 2:
            # Check if the second-to-last message has Action Card tool calls
            second_last = messages[-2] if len(messages) >= 2 else None
            if second_last and hasattr(second_last, "tool_calls") and second_last.tool_calls:
                for tc in second_last.tool_calls:
                    if tc.get("name") in ["open_job_hunter", "open_jd_matcher"]:
                        print(f"   [agent] Fast-path: Skipping LLM for Action Card tool")
                        # Return minimal response immediately
                        return {
                            "messages": [AIMessage(content="Here's a quick way to search for those roles!")]
                        }
        
        # 2. Entity Expansion
        search_entities = state.get("search_entities", [])
        
        if not search_entities and messages:
            last_msg = messages[-1]
            if isinstance(last_msg, HumanMessage):
                content_lower = last_msg.content.lower()
                for key, values in ENTITY_MAP.items():
                    if key in content_lower:
                        search_entities.extend(values)
        search_entities = list(set(search_entities))
        
        # 3. Format Prompt
        formatted_prompt = SYSTEM_PROMPT_V3.format(
            user_id=state.get("user_id", "unknown"),
            user_context=state.get("user_context", "No profile data available"),
            search_entities=", ".join(search_entities)
        )
        
        # 4. Inject Few-Shot
        few_shot_with_user_id = []
        for msg in FEW_SHOT_EXAMPLES:
            if isinstance(msg, AIMessage) and msg.tool_calls:
                # Replace placeholders
                updated_tool_calls = []
                for tc in msg.tool_calls:
                    updated_args = {
                        k: v.replace("{user_id}", state.get("user_id", "unknown")) if isinstance(v, str) else v
                        for k, v in tc.get("args", {}).items()
                    }
                    updated_tool_calls.append({**tc, "args": updated_args})
                few_shot_with_user_id.append(AIMessage(content=msg.content, tool_calls=updated_tool_calls))
            else:
                few_shot_with_user_id.append(msg)
                
        # 5. Invoke LLM with error handling
        prompt_messages = [SystemMessage(content=formatted_prompt)] + few_shot_with_user_id + messages
        try:
            response = llm_with_tools.invoke(prompt_messages)
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "Rate limit" in error_msg:
                print(f"   [agent] Rate limit exceeded: {error_msg}")
                return {
                    "messages": [AIMessage(content="I'm currently experiencing high traffic and reached my rate limit. Please try again in a few moments.")]
                }
            else:
                print(f"   [agent] LLM Error: {error_msg}")
                return {
                    "messages": [AIMessage(content=f"I encountered a temporary error: {error_msg}. Please try again.")]
                }
        
        return {"messages": [response], "search_entities": search_entities}

    def grader_node(state: AgentState) -> Dict:
        """Verify the agent's response for hallucinations."""
        last_message = state["messages"][-1]
        
        # Skip grading if tool calls (intermediate step)
        if last_message.tool_calls:
            return {"is_hallucination_check_passed": True}
        
        # OPTIMIZATION: Skip grading for Action Card responses
        # Check if any recent tool was an Action Card tool
        for msg in reversed(state["messages"][-5:]):
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    if tc.get("name") in ["open_job_hunter", "open_jd_matcher"]:
                        print("   [grader] Skipping verification for Action Card response.")
                        return {"is_hallucination_check_passed": True}
        
        # Extract tool outputs from history for context
        tool_outputs = []
        for msg in reversed(state["messages"][:-1]):
            if hasattr(msg, "tool_call_id"): # ToolMessage
                tool_outputs.append(msg.content)
            if isinstance(msg, HumanMessage): # Stop at last user turn
                break
        
        # OPTIMIZATION: Skip grading if no tools were used (simple conversation)
        if not tool_outputs:
            print("   [grader] Skipping verification for conversational response (no tools used).")
            return {"is_hallucination_check_passed": True}
                
        context = "\n".join(tool_outputs)
            
        # If we've retried too much, FALLBACK to raw context
        if state.get("retry_count", 0) >= 1:  # Reduced from 2 to 1 for speed
            print("   [grader] Max retries reached. Falling back to tool context.")
            fallback_msg = f"Here is the data I found:\n\n{context}"
            return {
                "is_hallucination_check_passed": True,
                "messages": [AIMessage(content=fallback_msg)]
            }
        
        # Invoke Grader LLM (8b-instant for speed)
        grader_llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
        
        try:
            validation = grader_llm.invoke(GRADER_PROMPT.format(
                response=last_message.content,
                tool_outputs=context
            ), config={"tags": ["grader"]})
            
            # Clean up potential markdown code blocks from grader response
            content = validation.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            
            result = json.loads(content.strip())
            
            if result.get("is_grounded", True):
                return {"is_hallucination_check_passed": True}
            else:
                current_retry = state.get("retry_count", 0)
                return {
                    "is_hallucination_check_passed": False,
                    "retry_count": current_retry + 1,
                    "messages": [HumanMessage(content=f"[SYSTEM: Hallucination Detected] Your last response did not align with the tool data. Critique: {result.get('critique')}. Please correct your answer using ONLY the available context.")]
                }
        except Exception as e:
            # If grading fails, be permissible
            print(f"   [grader] Grading failed: {e}")
            return {"is_hallucination_check_passed": True}

    # --- GRAPH CONSTRUCTION ---
    
    workflow = StateGraph(AgentState)
    
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", ToolNode(tools))
    workflow.add_node("grader", grader_node)
    
    workflow.add_edge(START, "agent")
    
    def route_agent(state):
        last_msg = state["messages"][-1]
        if last_msg.tool_calls:
            return "tools"
        return "grader"
        
    workflow.add_conditional_edges("agent", route_agent)
    workflow.add_edge("tools", "agent")
    
    def route_grader(state):
        if state.get("is_hallucination_check_passed", True):
            return END
        return "agent" # Loop back for correction
        
    workflow.add_conditional_edges("grader", route_grader)
    
    print("   [graph_v3] Agent compiled successfully with MongoDB persistence and Self-RAG")
    return workflow.compile(checkpointer=checkpointer)

# ============================================================================
# INVOKE MENTOR (Streaming)
# ============================================================================

async def invoke_mentor_v3(
    user_id: str,
    thread_id: str,
    message: str
) -> AsyncIterator[Dict[str, Any]]:
    """
    Invoke AI Mentor v3.0 with streaming support.
    
    Args:
        user_id: Clerk user ID
        thread_id: Conversation thread ID for persistence
        message: User's message
    
    Yields:
        Streaming events: {type: "thought"|"token"|"action_card"|"done", content: str}
    """
    try:
        print(f"\n   [mentor_v3] Starting conversation for user={user_id}, thread={thread_id}")
        
        # Get user context from database
        user = db['users'].find_one({"clerkId": user_id})
        user_context = ""
        
        if user and 'profile' in user:
            fingerprint = user['profile'].get('resume_fingerprint', '')
            if fingerprint:
                user_context = f"User Profile: {fingerprint}"
            else:
                user_context = "No resume fingerprint available."
        
        print(f"   [mentor_v3] User context loaded: {len(user_context)} chars")
        
        # Build agent graph
        graph = build_mentor_graph_v3()
        
        # Configuration for persistence
        # Configuration for persistence
        config = {
            "configurable": {
                "thread_id": thread_id
            },
            "recursion_limit": 20  # Reduced to save tokens and prevent deep loops
        }
        
        # Initial state
        # Truncate history if needed (not directly here, but graph handles it via checkpointer)
        
        initial_state = {
            "messages": [HumanMessage(content=message)],
            "user_id": user_id,
            "user_context": user_context, # Ensure this isn't too huge
            "active_action_card": None,
            "retry_count": 0,
            "is_hallucination_check_passed": False,
            "search_entities": []
        }
        
        print(f"   [mentor_v3] Starting streaming with message: '{message[:50]}...'")
        # Track processed events to prevent duplicates
        seen_run_ids = set()
        
        # Stream with "messages" mode for token-level streaming
        async for event in graph.astream_events(
            initial_state,
            config=config,
            version="v2"
        ):
            event_type = event.get("event")
            name = event.get("name", "")
            run_id = event.get("run_id")
            
            # --- NODE ENTRY EVENTS (Thoughts) ---
            if event_type == "on_chain_start":
                if name == "grader" and run_id not in seen_run_ids:
                    seen_run_ids.add(run_id)
                    yield {"type": "thought", "content": "Verifying response accuracy..."}
            
            # --- TOOL EXECUTION EVENTS (Thoughts) ---
            elif event_type == "on_tool_start":
                if run_id in seen_run_ids:
                    continue
                seen_run_ids.add(run_id)
                
                tool_name = name
                abstract_thought = THOUGHT_MAP.get(tool_name, f"Running {tool_name}...")
                print(f"   [mentor_v3] Tool started: {tool_name} → '{abstract_thought}'")
                yield {"type": "thought", "content": abstract_thought}
            
            # --- LLM TOKEN STREAMING (Immediate) ---
            elif event_type == "on_chat_model_stream":
                # Filter out grader tokens using tags
                tags = event.get("tags", [])
                if "grader" in tags:
                    continue
                    
                chunk = event.get("data", {}).get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    yield {"type": "token", "content": chunk.content}
            
            # --- TOOL END (Action Cards) ---
            elif event_type == "on_tool_end":
                tool_name = name
                output = event.get("data", {}).get("output", "")
                
                # Check for Action Cards in tool output
                if tool_name in ["open_job_hunter", "open_jd_matcher"]:
                    try:
                        # Extract content from ToolMessage object
                        if hasattr(output, "content"):
                            # It's a ToolMessage object
                            content_str = output.content
                        elif isinstance(output, str):
                            content_str = output
                        else:
                            content_str = str(output)
                        
                        # Parse JSON
                        card_data = json.loads(content_str)
                        
                        if isinstance(card_data, dict) and "action_card" in card_data:
                            print(f"   [mentor_v3] ✅ Action Card detected from {tool_name}")
                            yield {"type": "action_card", "content": card_data["action_card"]}
                        else:
                            print(f"   [DEBUG] No 'action_card' key in parsed data")
                    except Exception as e:
                        print(f"   [mentor_v3] ❌ Failed to parse Action Card: {e}")
                        import traceback
                        traceback.print_exc()
                
                yield {"type": "thought", "content": "Data retrieval complete."}
            
            # --- NODE COMPLETION EVENTS ---
            elif event_type == "on_chain_end":
                if name == "grader":
                    output = event.get("data", {}).get("output", {})
                    if output and output.get("is_hallucination_check_passed"):
                        yield {"type": "thought", "content": "Verification passed. Response is grounded."}
                    elif output and not output.get("is_hallucination_check_passed", True):
                        yield {"type": "thought", "content": "Verification failed. Retrying with correction..."}
        
        # Send completion event
        print("   [mentor_v3] Streaming complete")
        yield {"type": "done", "content": ""}
        
    except Exception as e:
        print(f"   [mentor_v3] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        yield {"type": "error", "content": f"I encountered an error: {str(e)}"}

# ============================================================================
# MAIN (for testing)
# ============================================================================

if __name__ == "__main__":
    import asyncio
    
    async def test():
        print("Testing AI Mentor v3.0...")
        async for event in invoke_mentor_v3(
            user_id="test_user",
            thread_id="test_thread_1",
            message="Find me React jobs in London"
        ):
            print(f"Event: {event}")
    
    asyncio.run(test())
