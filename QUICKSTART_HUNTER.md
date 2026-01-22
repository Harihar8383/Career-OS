# Job Hunter Agent - Quick Start Guide

## Prerequisites
- ✅ Adzuna API credentials (already configured)
- ⚠️ Tavily API key (optional - add to `.env`)
- ✅ RabbitMQ running locally
- ✅ MongoDB connected

## Start Commands

### 1. Start Python AI Worker
```bash
cd backend/ai-worker
python worker.py
```

Expected output:
```
✅ MongoDB connected and all collections accessed.
✅ Groq AI Model configured (Llama 3.3).
🚀 [worker] Starting CareerCLI AI Worker...
✅ Python Worker connected to RabbitMQ.
[*] Subscribed to queue: resume_processing_queue
[*] Subscribed to queue: jd_analysis_queue
[*] Subscribed to queue: job_hunter_queue
[*] Waiting for messages. To exit press CTRL+C
```

### 2. Restart API Gateway (if already running)
API Gateway is already running. New code will be loaded on next request.

### 3. Test the System

#### Via Frontend:
1. Navigate to: `http://localhost:5173/dashboard/hunter`
2. Fill in the form:
   - Job Titles: "Software Engineer"
   - Location Types: Remote
   - Salary Range: 10L - 25L
3. Click "Start Hunt"
4. Watch logs stream in real-time!

#### Via API:
```bash
# Get your Clerk auth token from browser DevTools → Application → Cookies
curl -X POST http://localhost:8080/api/hunter/hunt \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Software Engineer",
    "location": "Bangalore",
    "salaryMin": 1000000,
    "salaryMax": 2500000
  }'
```

## What to Watch For

### Python Worker Console:
```
✅ [worker] Received a new JOB HUNTER job!
   [data] Session ID: abc-123 | User ID: user_xyz
   [hunter] Initializing HuntOrchestrator...
   [hunter] Starting tiered job hunt...
🟢 TIER 1: Searching Adzuna API for 'Software Engineer'...
   ✓ Found 15 jobs on page 1 (Total: 15)
✅ EXIT CONDITION MET: 15 jobs found (threshold: 15)
   [db] Saving 15 jobs to JobResult collection...
✅ [worker] JOB HUNTER job finished and acknowledged.
```

### Frontend Terminal UI:
Should show real-time logs color-coded by type:
- 🟢 Green: Success messages
- 🔵 Blue: Info messages  
- 🟡 Yellow: Warnings
- 🔴 Red: Errors

## Troubleshooting

### Worker Not Starting?
```bash
cd backend/ai-worker
pip install -r requirements.txt
python worker.py
```

### No Logs Appearing?
Check RabbitMQ connection in API Gateway console.

### No Jobs Found?
Verify Adzuna credentials in `backend/ai-worker/.env`

## Next: Add Tavily API Key

To enable Tier 2 Tavily search:
```bash
# Edit backend/ai-worker/.env
TAVILY_API_KEY='tvly-YOUR_KEY_HERE'
```

Restart the worker after adding the key.
