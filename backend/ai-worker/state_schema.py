# backend/ai-worker/state_schema.py
"""
AI Mentor v3.0 - State Schema Definition
Defines the AgentState TypedDict for LangGraph with proper reducers
"""

from typing import TypedDict, Annotated, List, Dict, Any, Union
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """
    State schema for AI Mentor v3.0 agent.
    
    This state is persisted across conversation turns via MongoDB checkpointer,
    enabling memory and stateful interactions.
    """
    
    # Message history with automatic message merging
    # The add_messages reducer appends new messages to the list
    messages: Annotated[List[BaseMessage], add_messages]
    
    # User identification
    user_id: str  # Clerk user ID for database queries
    
    # User context (resume fingerprint) injected into system prompt
    user_context: str
    
    # Active Action Card for generative UI
    # When set, frontend renders a clickable card instead of text
    active_action_card: Union[Dict[str, Any], None]
    
    # Self-correction loop counter for hallucination prevention
    # Prevents infinite retry loops (max 2 retries)
    retry_count: int
    
    # Hallucination check flag for Self-RAG verification
    # grade_verify_node sets this to True/False
    is_hallucination_check_passed: bool
    
    # Expanded entities for semantic search
    # e.g., "Big Tech" → ["Google", "Amazon", "Meta", "Apple", "Microsoft"]
    search_entities: List[str]
