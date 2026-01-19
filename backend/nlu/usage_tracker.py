"""
Token Usage Tracker for Groq API
Tracks daily API calls and token consumption
"""

import json
import os
from datetime import datetime, date
from typing import Dict, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class UsageTracker:
    """Track Groq API usage (calls and tokens)"""
    
    def __init__(self, data_file: str = "backend/nlu/usage_data.json"):
        """Initialize usage tracker"""
        self.data_file = Path(data_file)
        self.data_file.parent.mkdir(parents=True, exist_ok=True)
        self.usage_data = self._load_data()
    
    def _load_data(self) -> Dict[str, Any]:
        """Load usage data from file"""
        if self.data_file.exists():
            try:
                with open(self.data_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load usage data: {e}")
                return {}
        return {}
    
    def _save_data(self):
        """Save usage data to file"""
        try:
            with open(self.data_file, 'w') as f:
                json.dump(self.usage_data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save usage data: {e}")
    
    def _get_today_key(self) -> str:
        """Get today's date as string key"""
        return date.today().isoformat()
    
    def record_call(self, prompt_tokens: int, completion_tokens: int, total_tokens: int):
        """Record an API call with token usage"""
        today = self._get_today_key()
        
        if today not in self.usage_data:
            self.usage_data[today] = {
                "date": today,
                "calls": 0,
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
                "calls_history": []
            }
        
        self.usage_data[today]["calls"] += 1
        self.usage_data[today]["prompt_tokens"] += prompt_tokens
        self.usage_data[today]["completion_tokens"] += completion_tokens
        self.usage_data[today]["total_tokens"] += total_tokens
        
        # Record individual call
        self.usage_data[today]["calls_history"].append({
            "timestamp": datetime.now().isoformat(),
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens
        })
        
        # Keep only last 100 calls per day
        if len(self.usage_data[today]["calls_history"]) > 100:
            self.usage_data[today]["calls_history"] = self.usage_data[today]["calls_history"][-100:]
        
        self._save_data()
    
    def get_today_usage(self) -> Dict[str, Any]:
        """Get today's usage statistics"""
        today = self._get_today_key()
        if today in self.usage_data:
            return self.usage_data[today].copy()
        return {
            "date": today,
            "calls": 0,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "calls_history": []
        }
    
    def get_all_usage(self) -> Dict[str, Any]:
        """Get all usage data"""
        return self.usage_data.copy()
    
    def get_usage_summary(self, limit: int = 1000) -> Dict[str, Any]:
        """Get usage summary with limit checking"""
        today_usage = self.get_today_usage()
        total_tokens = today_usage["total_tokens"]
        calls = today_usage["calls"]
        
        remaining_tokens = max(0, limit - total_tokens)
        percentage_used = (total_tokens / limit * 100) if limit > 0 else 0
        
        return {
            "date": today_usage["date"],
            "calls": calls,
            "total_tokens": total_tokens,
            "prompt_tokens": today_usage["prompt_tokens"],
            "completion_tokens": today_usage["completion_tokens"],
            "limit": limit,
            "remaining_tokens": remaining_tokens,
            "percentage_used": round(percentage_used, 2),
            "status": "OK" if total_tokens < limit else "LIMIT_EXCEEDED"
        }
