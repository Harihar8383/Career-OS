# backend/ai-worker/mentor_graph.py
import os
import json
from typing import TypedDict, List, Dict, Any, Annotated
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from pymongo import MongoClient
from dotenv import load_dotenv
import operator

load_dotenv()

# --- STATE DEFINITION ---
class MentorState(TypedDict):
    messages: Annotated[List[Dict], operator.add]  # Chat history
    user_id: str
    thread_id: str
    user_context: str  # Resume fingerprint
    final_response: str
    stream_events: Annotated[List[Dict], operator.add]  # For SSE

# --- DATABASE CONNECTION ---
mongo_client = MongoClient(os.getenv("MONGODB_URI") or os.getenv("MONGO_URI"))
db = mongo_client['career_os']

# --- SYSTEM PROMPT ---
SYSTEM_PROMPT = """You are the Career-OS AI Mentor, a smart concierge for job seekers.

**Your Capabilities:**
- Search user's tracked job applications using vector_search_jobs
- Retrieve past JD match analyses using fetch_scan_history (includes automatic statistics calculation)
- Fetch specific resume sections using get_profile_details
- Search the internet for career advice using internet_search

**User Context:**
User ID: {user_id}
{user_context}

**Critical Rules:**
1. NEVER hallucinate data. If you don't have information, use a tool or ask the user.
2. The User Context above is ONLY a summary. For specific historical data, you MUST use tools.
3. When asked about "last X analyses" or "missing skills", you MUST call fetch_scan_history - do NOT answer from context.
4. When asked about job status or applications, you MUST call vector_search_jobs - do NOT guess.
5. Be concise but helpful. Use bullet points when listing information.
6. For job searches, use semantic understanding (e.g., "Big Tech" = Google, Meta, Amazon).
7. NEVER mention tool names or internal processes in your responses. Speak naturally and professionally.
8. When fetch_scan_history returns statistics (average_score, min_score, max_score), use those exact values - they are pre-calculated for accuracy.
"""

# --- BUILD AGENT ---
def build_mentor_graph():
    """
    Build the AI Mentor agent using LangChain's create_agent (2024 API).
    """
    print("   [graph] Building mentor agent...")
    
    # Import tools and create_agent
    from mentor_tools import get_mentor_tools
    from langchain.agents import create_agent
    
    tools = get_mentor_tools()
    
    # Create LLM instance
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.1
    )
    
    # Create agent using modern API (built on LangGraph internally)
    agent = create_agent(
        model=llm,
        tools=tools,
        system_prompt=SYSTEM_PROMPT
    )
    
    return agent

async def invoke_mentor(user_id: str, thread_id: str, message: str):
    """
    Invoke the mentor agent and return streaming events with token-by-token output.
    """
    try:
        # Get user context
        user = db['users'].find_one({"clerkId": user_id})
        user_context = ""
        
        if user and 'profile' in user:
            fingerprint = user['profile'].get('resume_fingerprint', '')
            if fingerprint:
                user_context = f"User Profile: {fingerprint}"
            else:
                user_context = "No resume fingerprint available."
        
        # Build agent with user context injected into system prompt
        from mentor_tools import get_mentor_tools
        from langchain.agents import create_agent
        
        tools = get_mentor_tools()
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            groq_api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.1,
            streaming=True  # Enable streaming
        )
        
        # Inject user_context and user_id into system prompt
        contextualized_prompt = SYSTEM_PROMPT.format(user_context=user_context, user_id=user_id)
        
        print(f"   [agent] Creating agent with {len(tools)} tools")
        print(f"   [agent] Tools available: {[t.name for t in tools]}")
        
        agent = create_agent(
            model=llm,
            tools=tools,
            system_prompt=contextualized_prompt
        )
        
        print(f"   [agent] Agent created successfully")
        
        # Stream thinking event
        yield {"type": "thought", "content": "Analyzing your question..."}
        
        print(f"   [agent] Starting streaming for message: {message[:50]}...")
        
        # Stream tokens using astream_events
        token_buffer = ""
        async for event in agent.astream_events(
            {"messages": [{"role": "user", "content": message}]},
            version="v2"
        ):
            kind = event["event"]
            
            # Handle tool execution events
            if kind == "on_tool_start":
                tool_name = event.get("name", "unknown")
                print(f"   [agent] Tool started: {tool_name}")
                yield {"type": "tool_start", "content": f"Using {tool_name}..."}
            
            elif kind == "on_tool_end":
                tool_name = event.get("name", "unknown")
                print(f"   [agent] Tool completed: {tool_name}")
            
            # Handle LLM token streaming
            elif kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if hasattr(chunk, "content") and chunk.content:
                    token_buffer += chunk.content
                    # Send individual characters for visible typing effect
                    if len(token_buffer) >= 1:
                        yield {"type": "token", "content": token_buffer}
                        token_buffer = ""
            
            # Handle final completion
            elif kind == "on_chain_end":
                # Send any remaining tokens
                if token_buffer:
                    yield {"type": "token", "content": token_buffer}
                    token_buffer = ""
                print(f"   [agent] Streaming complete")
        
        # Send final event
        yield {"type": "done", "content": ""}
        
    except Exception as e:
        print(f"   [mentor] Error: {e}")
        import traceback
        traceback.print_exc()
        yield {"type": "error", "content": f"I encountered an error: {str(e)}"}

# Test function
if __name__ == "__main__":
    print("Testing Mentor Agent...")
    
    for event in invoke_mentor("test_user", "test_thread", "What jobs have I applied to?"):
        print(f"Event: {event}")
