# Job Search Tool Analysis

This document tracks the analysis and testing of various job search tools to integrate into the Job Hunter Agent.

## 1. Adzuna API
**Status**: Testing...

### Findings
- **Integration Method**: REST API
- **Region Support**: Global (country code in URL must be changed, e.g., `/in/` for India, `/us/` for USA)
- **Data Quality**: Verified. Returns rich metadata including `title`, `company`, `location`, `salary_min/max`, and `redirect_url`.
- **Pros**:
    - Official API, reliable.
    - Fast response time.
    - High volume of jobs.
- **Cons**:
    - Salary often missing (None).
    - Descriptions are truncated.
- **Integration Strategy**: 
    - **Tier 1 (Safe/Fast)**.
    - Map fields: `title` -> `title`, `company.display_name` -> `company`, `location.display_name` -> `location`, `redirect_url` -> `applyLink`.
    - Handle null salaries gracefully.

## 2. HiringCafe Scraper
**Status**: Testing...
