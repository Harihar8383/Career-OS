from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    user_id: str
    thread_id: str
    message: str

@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-worker"}

@app.post("/mentor/stream")
async def stream_mentor_chat(request: ChatRequest):
    """
    Stream AI Mentor responses using SSE.
    """
    async def event_generator():
        try:
            from mentor_graph import build_mentor_graph
            
            # Build graph
            print(f"[mentor] Building graph for user: {request.user_id}")
            graph = build_mentor_graph()
            
            # Initial state
            initial_state = {
                "messages": [{"role": "user", "content": request.message}],
                "user_id": request.user_id,
                "thread_id": request.thread_id,
                "user_context": "",
                "tool_calls": [],
                "final_response": "",
                "stream_events": []
            }
            
            # Stream events
            print(f"[mentor] Invoking graph...")
            
            # Invoke graph
            result = graph.invoke(initial_state)
            
            # Stream events from result
            if "stream_events" in result:
                for event in result["stream_events"]:
                    yield f"data: {json.dumps(event)}\n\n"
                    await asyncio.sleep(0.01)  # Small delay for smooth streaming
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            print(f"[mentor] Stream complete")
            
        except Exception as e:
            print(f"[mentor] Error: {e}")
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
