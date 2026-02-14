# backend/ai-worker/test_mentor_v3.py
"""
Test script for AI Mentor v3.0
Tests the mentor graph and API endpoint
"""

import asyncio
import json
from mentor_graph_v3 import invoke_mentor_v3

async def test_mentor_streaming():
    """Test the mentor streaming functionality"""
    print("=" * 60)
    print("Testing AI Mentor v3.0 Streaming")
    print("=" * 60)
    
    test_cases = [
        {
            "name": "Action Card - Job Hunter",
            "message": "Find me React jobs in London",
            "expected_type": "action_card"
        },
        {
            "name": "Action Card - JD Matcher",
            "message": "Is this job good for me? https://linkedin.com/jobs/123",
            "expected_type": "action_card"
        },
        {
            "name": "Application Status Check",
            "message": "What's happening with my Google application?",
            "expected_type": "thought"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{'=' * 60}")
        print(f"Test Case {i}: {test_case['name']}")
        print(f"Message: '{test_case['message']}'")
        print(f"{'=' * 60}\n")
        
        events_received = []
        
        try:
            async for event in invoke_mentor_v3(
                user_id="test_user_123",
                thread_id=f"test_thread_{i}",
                message=test_case['message']
            ):
                event_type = event.get("type")
                content = event.get("content", "")
                
                events_received.append(event_type)
                
                if event_type == "thought":
                    print(f"💭 Thought: {content}")
                elif event_type == "token":
                    print(content, end="", flush=True)
                elif event_type == "action_card":
                    print(f"\n[CARD] Action Card: {json.dumps(content, indent=2)}")
                elif event_type == "done":
                    print("\n[DONE] Done")
                elif event_type == "error":
                    print(f"\n[ERR] Error: {content}")
            
            print(f"\n\nEvents received: {events_received}")
            
            # Verify expected event type was received
            if test_case['expected_type'] in events_received:
                print(f"[PASS] Test PASSED: Expected '{test_case['expected_type']}' event received")
            else:
                print(f"[WARN] Test WARNING: Expected '{test_case['expected_type']}' event not received")
        
        except Exception as e:
            print(f"\n[FAIL] Test FAILED: {str(e)}")
            import traceback
            traceback.print_exc()
        
        print(f"\n{'=' * 60}\n")
        await asyncio.sleep(1)  # Small delay between tests
    
    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_mentor_streaming())
