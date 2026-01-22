"""
Company Tier Classification & Badge System for Job Hunter

Classifies companies into S/A+/A/B+/B tiers based on:
- Company prestige (Elite/Premier lists)
- Salary offered

Also provides badge assignment for UI display.
"""

from typing import List, Dict
from datetime import datetime

# Elite Companies (S-Tier by default)
ELITE_COMPANIES = {
    # FAANG + Tech Giants
    "google", "microsoft", "amazon", "meta", "facebook", "apple", "netflix",
    # Unicorns & High-Growth
    "uber", "airbnb", "stripe", "openai", "anthropic", "databricks",
    # Indian Unicorns (Elite Tier)
    "cred", "zepto", "razorpay", "swiggy", "zomato", "flipkart", "phonepe",
    # Enterprise Leaders
    "nvidia", "tesla", "spacex"
}

# Premier Companies (A+-Tier by default)
PREMIER_COMPANIES = {
    # Indian Unicorns (Premier)
    "paytm", "ola", "meesho", "sharechat", "dream11", "byju", "unacademy",
    "policybazaar", "oyo", "lenskart", "urban company", "nykaa",
    # Enterprise Software
    "salesforce", "adobe", "oracle", "sap", "atlassian", "servicenow",
    "workday", "snowflake", "databricks", "confluent",
    # Fintech
    "visa", "mastercard", "paypal", "square", "coinbase",
    # E-commerce & Delivery
    "instacart", "doordash", "shopify"
}


def classify_company_tier(company_name: str, salary: int) -> str:
    """
    Classify company into S/A+/A/B+/B tiers.
    
    Args:
        company_name: Company name (will be normalized)
        salary: Annual salary in INR
    
    Returns:
        Tier label: "S", "A+", "A", "B+", or "B"
    
    Tier Criteria:
        S-Tier: Elite companies OR salary > 30L
        A+-Tier: Premier companies OR salary > 20L
        A-Tier: Salary > 12L
        B+-Tier: Salary > 8L
        B-Tier: Everything else
    """
    # Normalize company name
    company_lower = company_name.lower().strip()
    
    # Remove common suffixes for better matching
    company_lower = company_lower.replace(" india", "").replace(" pvt ltd", "")
    company_lower = company_lower.replace(" private limited", "").replace(" ltd", "")
    company_lower = company_lower.strip()
    
    # S-Tier: Elite companies OR salary > 30L
    if salary > 3000000:
        return "S"
    
    # Check if company is in elite list (partial match)
    for elite in ELITE_COMPANIES:
        if elite in company_lower or company_lower in elite:
            return "S"
    
    # A+-Tier: Premier companies OR salary > 20L
    if salary > 2000000:
        return "A+"
    
    # Check if company is in premier list (partial match)
    for premier in PREMIER_COMPANIES:
        if premier in company_lower or company_lower in premier:
            return "A+"
    
    # A-Tier: Salary > 12L
    if salary > 1200000:
        return "A"
    
    # B+-Tier: Salary > 8L
    if salary > 800000:
        return "B+"
    
    # B-Tier: Everything else
    return "B"


def assign_badges(job: Dict, rank: int, company_tier: str) -> List[str]:
    """
    Assign UI badges to a job based on various criteria.
    
    Args:
        job: Job dictionary
        rank: Job's rank in results (1-based)
        company_tier: Company tier (S/A+/A/B+/B)
    
    Returns:
        List of badge strings with emojis
    """
    badges = []
    
    # Elite Company badge
    company_name = job.get("company", "")
    if isinstance(company_name, dict):
        company_name = company_name.get("display_name", "")
    company_lower = str(company_name).lower().strip()
    
    # Check for elite company
    for elite in ELITE_COMPANIES:
        if elite in company_lower:
            badges.append("🏆 Elite Company")
            break
    
    # Ranking badges
    if rank == 1:
        badges.append("⭐ Best Match")
    elif job.get("matchScore", 0) >= 90:
        badges.append("🔥 Top Pick")
    
    # Freshness badge
    try:
        created = job.get("created", "")
        if created:
            created_dt = datetime.strptime(created, "%Y-%m-%dT%H:%M:%SZ")
            days_old = (datetime.now() - created_dt).days
            if days_old < 2:
                badges.append("⚡ Recently Posted")
    except:
        pass
    
    # Tier badge (only for S and A+ tiers)
    if company_tier in ["S", "A+"]:
        badges.append(f"🎯 {company_tier}-Tier")
    
    # High salary badge
    salary_min = job.get("salary_min", 0)
    if salary_min > 2500000:
        badges.append("💰 High Salary")
    
    return badges


def generate_gap_analysis(job: Dict, fingerprint: Dict, match_score: int) -> str:
    """
    Generate gap analysis explaining why score < 100.
    
    Args:
        job: Job dictionary
        fingerprint: Resume fingerprint
        match_score: Match score (0-100)
    
    Returns:
        Gap analysis string
    """
    if match_score >= 95:
        return "Perfect match!"
    
    gaps = []
    
    # Get job description
    job_desc = job.get("description", "").lower()
    
    # Check for missing skills
    expert_skills = fingerprint.get("expert_skills", [])
    if expert_skills:
        missing_skills = []
        for skill in expert_skills[:5]:  # Check top 5 skills
            skill_lower = skill.lower()
            if skill_lower not in job_desc:
                missing_skills.append(skill)
        
        if missing_skills and len(missing_skills) <= 3:
            gaps.append(f"Missing: {', '.join(missing_skills[:2])}")
    
    # Check YoE mismatch
    user_yoe = fingerprint.get("yoe", 0)
    
    # Extract required YoE from job description
    import re
    patterns = [
        r'(\d+)\+?\s*(?:to\s+\d+\s*)?(?:years?|yrs?)\s+(?:of\s+)?experience',
        r'experience\s+of\s+(\d+)\+?\s*(?:to\s+\d+\s*)?(?:years?|yrs?)',
        r'minimum\s+(\d+)\+?\s*(?:years?|yrs?)',
    ]
    
    required_yoe = 0
    for pattern in patterns:
        matches = re.findall(pattern, job_desc.lower())
        if matches:
            required_yoe = int(matches[0]) if isinstance(matches[0], str) else int(matches[0][0])
            break
    
    if required_yoe > 0 and user_yoe < required_yoe:
        gap_years = required_yoe - user_yoe
        if gap_years >= 2:  # Only show significant gaps
            gaps.append(f"Requires {required_yoe}y exp (you have {user_yoe}y)")
    
    # Check salary expectation
    expected_min = fingerprint.get("expected_salary_min", 0)
    job_salary = job.get("salary_min", 0)
    if expected_min > 0 and job_salary > 0 and job_salary < expected_min * 0.8:
        gaps.append("Salary below expectation")
    
    return " | ".join(gaps) if gaps else "Good match"


def format_salary(salary_min: int, salary_max: int = None, currency: str = "INR") -> str:
    """
    Format salary for display.
    
    Args:
        salary_min: Minimum salary
        salary_max: Maximum salary (optional)
        currency: Currency code
    
    Returns:
        Formatted salary string (e.g., "₹12-18 LPA")
    """
    if not salary_min:
        return "Not disclosed"
    
    # Convert to lakhs
    min_lpa = salary_min / 100000
    
    if salary_max and salary_max > salary_min:
        max_lpa = salary_max / 100000
        return f"₹{min_lpa:.0f}-{max_lpa:.0f} LPA"
    else:
        return f"₹{min_lpa:.0f}+ LPA"
