"""
Test script for Adzuna API integration
"""
from tools.adzuna import fetch_adzuna_jobs
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 50)
print("Testing Adzuna API Integration")
print("=" * 50)

# Test 1: Basic search
print("\n[TEST 1] Fetching Software Engineer jobs in Remote...")
jobs = fetch_adzuna_jobs("Software Engineer", "Remote", limit=5)

print(f"\n✅ Found {len(jobs)} jobs")
print("\nJob Details:")
for i, job in enumerate(jobs, 1):
    print(f"\n{i}. {job['title']}")
    print(f"   Company: {job['company']}")
    print(f"   Location: {job['location']}")
    print(f"   URL: {job['url'][:80]}...")
    if job.get('salary'):
        print(f"   Salary: {job['salary']}")

if len(jobs) > 0:
    print("\n" + "=" * 50)
    print("✅ Adzuna API Integration Test PASSED")
    print("=" * 50)
else:
    print("\n" + "=" * 50)
    print("⚠️ No jobs found - Check API credentials or search parameters")
    print("=" * 50)
