"""
Helper functions for fetching user skills from MongoDB.
"""

from pymongo import MongoClient
import os


def get_user_skills(user_id: str) -> list:
    """
    Fetch user's skills from partial_profile collection in MongoDB.
    
    Args:
        user_id: Clerk user ID
        
    Returns:
        List of skill strings
    """
    try:
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            print("[Skills] No MongoDB URI found")
            return []
        
        client = MongoClient(mongo_uri)
        db = client["career_os"]
        
        # Get user's profile from users collection
        users = db["users"]
        user_doc = users.find_one({"clerkId": user_id})
        
        if not user_doc or 'profile' not in user_doc:
            print(f"[Skills] No profile found for user: {user_id}")
            return []
        
        profile = user_doc.get('profile', {})
        skills_obj = profile.get('skills', {})
        
        # Combine all skill categories
        all_skills = []
        all_skills.extend(skills_obj.get('programming_languages', []))
        all_skills.extend(skills_obj.get('frameworks_libraries', []))
        all_skills.extend(skills_obj.get('databases', []))
        all_skills.extend(skills_obj.get('developer_tools_platforms', []))
        all_skills.extend(skills_obj.get('other_tech', []))
        
        # Remove duplicates and empty strings
        all_skills = list(set([s.strip() for s in all_skills if s and s.strip()]))
        
        print(f"[Skills] Found {len(all_skills)} skills for user: {user_id}")
        return all_skills
        
    except Exception as e:
        print(f"[Skills] Error fetching skills: {e}")
        return []
