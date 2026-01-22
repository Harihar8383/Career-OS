"""
Comprehensive test for Job Hunter tools
"""
import sys
sys.path.append('.')

from tools.adzuna import fetch_adzuna_jobs
from tools.validator import validate_job_url
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("JOB HUNTER TOOLS - VERIFICATION TEST")
print("=" * 60)

# Test 1: Adzuna API with different locations  
print("\n[TEST 1] Adzuna API - Software Engineer in New York, NY")
print("-" * 60)
jobs = fetch_adzuna_jobs("Software Engineer", "New York, NY", limit=3)
print(f"Result: Found {len(jobs)} jobs\n")

if len(jobs) > 0:
    for i, job in enumerate(jobs, 1):
        print(f"{i}. {job['title']} at {job['company']}")
        print(f"   Location: {job['location']}")
        print(f"   URL: {job['url'][:70]}...")
else:
    print("⚠️ No jobs found. Trying with different location...")
    jobs = fetch_adzuna_jobs("Python Developer", "San Francisco, CA", limit=3)
    print(f"Result: Found {len(jobs)} jobs")
    for i, job in enumerate(jobs, 1):
        print(f"{i}. {job['title']} at {job['company']}")

print("\n" + "=" * 60)
print("[TEST 2] URL Validator")
print("-" * 60)

test_urls = [
    ("https://www.google.com", True, "Valid website"),
    ("https://fake-nonexistent-url-12345.com/job", False, "Fake URL"),
]

for url, expected, desc in test_urls:
    result = validate_job_url(url)
    status = "✅ PASS" if result == expected else "❌ FAIL"
    print(f"{status}: {desc}")
    print(f"   URL: {url}")
    print(f"   Expected: {expected}, Got: {result}\n")

print("=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)
