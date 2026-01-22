"""
User Config Cache - Comprehensive Caching System

Caches AI-generated data to avoid redundant processing:
- Negative keywords
- Positive synonyms  
- Resume fingerprint (expensive to extract)
- Broad keywords (for job search)

Cache is invalidated when resume changes (detected via hash).
"""

from pymongo import MongoClient
import os
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, List


class UserConfigCache:
    """MongoDB cache for user-specific AI-generated configurations"""
    
    def __init__(self):
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            raise ValueError("MONGODB_URI environment variable not set")
        
        self.client = MongoClient(mongo_uri)
        self.db = self.client["career_os"]
        self.collection = self.db["user_configs"]
        
        # Create index for faster lookups
        try:
            self.collection.create_index([
                ("user_id", 1),
                ("role", 1),
                ("resume_hash", 1)
            ], unique=True)
        except:
            pass  # Index might already exist
    
    @staticmethod
    def calculate_resume_hash(resume_text: str) -> str:
        """Calculate MD5 hash of resume text for cache invalidation"""
        if not resume_text:
            return "empty"
        return hashlib.md5(resume_text.encode('utf-8')).hexdigest()
    
    def get_config(
        self, 
        user_id: str, 
        role: str, 
        resume_hash: str
    ) -> Optional[Dict]:
        """
        Get cached config for user+role+resume_hash.
        
        Returns None if:
        - No cache entry exists
        - Cache is stale (>30 days old)
        - Resume hash doesn't match (resume changed)
        """
        try:
            # Normalize role (lowercase, strip whitespace)
            role_normalized = role.lower().strip()
            
            doc = self.collection.find_one({
                "user_id": user_id,
                "role": role_normalized,
                "resume_hash": resume_hash
            })
            
            if not doc:
                print(f"[Cache] Miss for user={user_id[:12]}..., role={role_normalized}")
                return None
            
            # Check if stale (>30 days)
            created_at = doc.get("created_at")
            if created_at:
                age = datetime.now() - created_at
                if age > timedelta(days=30):
                    print(f"[Cache] Stale (age={age.days} days), invalidating")
                    return None
            
            print(f"[Cache] ✅ HIT for user={user_id[:12]}..., role={role_normalized}")
            
            return {
                "negative_keywords": doc.get("negative_keywords", []),
                "positive_synonyms": doc.get("positive_synonyms", {}),
                "resume_fingerprint": doc.get("resume_fingerprint", {}),
                "broad_keywords": doc.get("broad_keywords", [])  # NEW: Cache keywords
            }
            
        except Exception as e:
            print(f"[Cache] Error reading cache: {e}")
            return None
    
    def save_config(
        self,
        user_id: str,
        role: str,
        resume_hash: str,
        negative_keywords: List[str],
        positive_synonyms: Dict,
        resume_fingerprint: Dict,
        broad_keywords: List[str] = None  # NEW: Cache keywords
    ):
        """
        Save config to cache.
        
        Uses upsert to update existing entry or create new one.
        """
        try:
            # Normalize role
            role_normalized = role.lower().strip()
            
            update_data = {
                "negative_keywords": negative_keywords,
                "positive_synonyms": positive_synonyms,
                "resume_fingerprint": resume_fingerprint,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            # Add broad_keywords if provided
            if broad_keywords is not None:
                update_data["broad_keywords"] = broad_keywords
            
            self.collection.update_one(
                {
                    "user_id": user_id,
                    "role": role_normalized,
                    "resume_hash": resume_hash
                },
                {
                    "$set": update_data
                },
                upsert=True
            )
            
            print(f"[Cache] ✅ Saved for user={user_id[:12]}..., role={role_normalized}")
            
        except Exception as e:
            print(f"[Cache] Error saving cache: {e}")
            # Don't raise - caching is optional, continue without it
    
    def invalidate_user_cache(self, user_id: str):
        """
        Invalidate all cache entries for a user.
        
        Useful when user updates their resume.
        """
        try:
            result = self.collection.delete_many({"user_id": user_id})
            print(f"[Cache] Invalidated {result.deleted_count} entries for user={user_id[:12]}...")
        except Exception as e:
            print(f"[Cache] Error invalidating cache: {e}")
