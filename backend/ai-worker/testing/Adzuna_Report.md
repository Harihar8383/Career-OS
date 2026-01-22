# Adzuna API Analysis Report

**Status**: Verified & Optimized
**Date**: 2026-01-16

## 1. Executive Summary
Adzuna is a strong candidate for **Tier 1 (Safe/Initial)** search due to its high volume and freshness, but it requires specific parameter tuning to yield "desired results". The default relevance sorting often returns stale jobs, and precise multi-word queries (e.g., "Rust Engineer") can yield zero results compared to broader queries (e.g., "Rust").

## 2. Key Findings

### A. Freshness is Critical
- **Issue**: Default search returns mixed dates.
- **Fix**: Using `sort_by="date"` and `max_days_old=30` ensures we get jobs posted in the last month. The test successfully retrieved jobs posted **today** (2026-01-16).

### B. Keyword Sensitivity
- **Issue**: "Rust Engineer" returned **0 results**.
- **Fix**: "Rust" returned **395 results**, including "Rust Engineer" roles.
- **Strategy**: The AI Agent should simplify user criteria into broad keywords for Adzuna (e.g., if user asks for "Senior Rust Engineer", query "Rust" and filter in memory, or query "Rust Senior").

### C. Data Fields
- **Salaries**: Often `null` (None). `sort_by="salary"` helps but volume drops. We should not rely on Adzuna for salary data.
- **Title/Company**: Accurate.
- **Location**: Good granularity (City/State).

### D. Complex Query Handling
- **Test**: "Fullstack Engineer" (what) + "Applied AI MERN" (what_and).
- **Result**: **0 jobs**.
- **Adjusted Test**: "Fullstack Engineer" (what) + "MERN" (what_and).
- **Result**: **1 job** found (Title: "Fullstack Web Developer Intern").
- **Insight**: Combining too many specific tech stacks (MERN + Applied AI) excludes almost all results in Adzuna. Implicit AND logic works, but niche combinations require broader searches.

### E. User Scenario Performance
Tested 5 common user configurations:

1.  **Frontend Developer (Bengaluru)**: ✅ **334 jobs**. High volume.
2.  **Software Intern (Pune)**: ✅ **75 jobs**. "Intern" in title works well.
3.  **Contract DevOps**: ✅ **15 jobs**. `contract_type="contract"` filter works.
4.  **Java Developer (Jaipur)**: ✅ **30 jobs**. Good Tier 2 city coverage.
5.  **Data Scientist (Remote + High Salary)**: ⚠️ **0 jobs**.
    *   *Reason*: "Remote" location + strict non-zero salary filter is too restrictive for Adzuna's India index.
    *   *Fix*: Remove salary filter for Remote roles in Tier 1.

### F. Agent Query Strategy Analysis
To handle complex user configs (e.g., "Fullstack OR Backend" in "Bangalore OR Pune"), the agent MUST use a **permutational query strategy**.

**Test**: "Fullstack/Backend" in "Bangalore/Pune/Remote" (>15LPA)
- **Strategy**: Generated **12 distinct queries** (Role x Location x SalaryStrategy).
- **Results**:
    - **Total Raw Hits**: 198
    - **Unique Jobs**: 34
- **Correctness**: High. Titles matched intent (e.g., "Senior Full Stack Dev").
- **Key Insight**: "Strict Salary" queries (>15LPA) returned **0 results** mostly. "Any Salary" queries returned the bulk of relevant jobs.
- **Recommendation**: The Agent should **always** fire an "Any Salary" query parallel to a "Strict Salary" query to ensure recall, then filter in-memory.

- **Recommendation**: The Agent should **always** fire an "Any Salary" query parallel to a "Strict Salary" query to ensure recall, then filter in-memory.

### G. Full Flow Simulation (Correctness & Cleanup)
Tested the complete pipeline (Query -> Fetch -> Cleanup -> Score -> Link Check) for "Fullstack/MERN/Software Engineer" in 4 metros.

- **Input**: 5 Titles x 4 Locations.
- **Performance**:
    - **Raw Jobs**: 82 unique jobs retrieved.
    - **Soft Killswitch**: 100% pass rate (initial queries were accurate).
    - **Link Health**: 10/10 top candidates were active (Head request < 400).
    - **Scoring**: Effective. Top results were "Software Development Engineer" (100% Match) and "Fullstack Developer" (100% Match).
- **Conclusion**: The pipeline is robust. The "Soft Killswitch" is safe to deploy, and link checking adds ~3-4 seconds latency but ensures quality.

## 3. Optimization Configuration
To get "desired results", we will update `tier1_adzuna.py` to use:

```python
params = {
    "sort_by": "date",          # PRIORITY: Get fresh jobs
    "max_days_old": 60,         # Limit to recent history
    "what_and": "query terms",  # Use implicit AND for multiple terms if needed
    "results_per_page": 50      # Maximize batch size
}
```

## 4. Conclusion
Adzuna is working correctly. The "zero results" issue was due to over-specific query strings. By implementing **query broadening** and **freshness sorting**, it meets the requirements for a Tier 1 search tool.
