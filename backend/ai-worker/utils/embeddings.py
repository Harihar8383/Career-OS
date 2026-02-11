# backend/ai-worker/utils/embeddings.py
import os
from google import genai
from google.genai import types

# Lazy-load client to ensure environment variables are loaded first
_client = None

def get_client():
    """Get or create the Gemini client instance."""
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        _client = genai.Client(api_key=api_key)
    return _client

def generate_embedding(text: str, output_dim=768) -> list:
    """
    Generate embedding for text using Google Gemini API (FREE).
    Returns 768-dimensional vector by default (recommended for storage efficiency).
    
    Note: gemini-embedding-001 supports 128-3072 dimensions.
    Recommended: 768, 1536, or 3072
    """
    try:
        if not text or len(text.strip()) == 0:
            print("   [embedding] Warning: Empty text provided")
            return []
        
        # Gemini has a limit of ~2048 tokens, truncate to be safe
        text = text[:8000]
        
        print(f"   [embedding] Generating {output_dim}-dim embedding for: '{text[:100]}...'")
        
        client = get_client()
        result = client.models.embed_content(
            model="gemini-embedding-001",
            contents=text,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT",
                output_dimensionality=output_dim
            )
        )
        
        # Extract embedding values
        embedding = result.embeddings[0].values
        
        print(f"   [embedding] Successfully generated {len(embedding)}-dim embedding")
        return list(embedding)
        
    except Exception as e:
        print(f"   [embedding] Error generating embedding: {e}")
        import traceback
        traceback.print_exc()
        return []

def generate_job_embedding(job_doc: dict) -> list:
    """
    Create embedding from job title + company + description + location.
    """
    # Build text from available fields
    parts = []
    
    if job_doc.get('title'):
        parts.append(f"Job: {job_doc['title']}")
    if job_doc.get('company'):
        parts.append(f"Company: {job_doc['company']}")
    if job_doc.get('description'):
        parts.append(f"Description: {job_doc['description']}")
    if job_doc.get('location'):
        parts.append(f"Location: {job_doc['location']}")
    if job_doc.get('stage'):
        parts.append(f"Stage: {job_doc['stage']}")
    
    text = " ".join(parts)
    
    if not text.strip():
        print(f"   [embedding] Warning: No text to embed for job {job_doc.get('_id')}")
        return []
    
    return generate_embedding(text)

def generate_jd_embedding(analysis_doc: dict) -> list:
    """
    Create embedding from JD analysis summary.
    """
    results = analysis_doc.get('analysisResults', {})
    jd_summary = results.get('jd_summary', {})
    keyword_gap = results.get('keyword_gap', {})
    
    parts = []
    if jd_summary.get('job_title'):
        parts.append(f"Job: {jd_summary['job_title']}")
    if jd_summary.get('company'):
        parts.append(f"Company: {jd_summary['company']}")
    if keyword_gap:
        parts.append(f"Keywords: {str(keyword_gap)}")
    
    text = " ".join(parts)
    
    if not text.strip():
        print(f"   [embedding] Warning: No text to embed for analysis {analysis_doc.get('_id')}")
        return []
    
    return generate_embedding(text)

def generate_chat_embedding(message: str) -> list:
    """
    Create embedding from chat message for semantic search.
    Uses RETRIEVAL_QUERY task type for queries.
    """
    try:
        if not message or len(message.strip()) == 0:
            return []
        
        client = get_client()
        result = client.models.embed_content(
            model="gemini-embedding-001",
            contents=message,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_QUERY",  # Use RETRIEVAL_QUERY for search queries
                output_dimensionality=768
            )
        )
        
        return list(result.embeddings[0].values)
    except Exception as e:
        print(f"   [embedding] Error generating chat embedding: {e}")
        return []
