"""
Smart Search Cache Service
Pre-caches common queries for instant responses
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from database.firestore_v2 import FirestoreV2
from app.firestore import firestore_db

from utils.time import get_now_karachi, get_today_karachi, get_tomorrow_karachi, get_parson_karachi

logger = logging.getLogger(__name__)

class SmartSearchCache:
    """
    Pre-caches common search patterns for instant results
    """
    
    def __init__(self):
        self.db = FirestoreV2(firestore_db.db)
        self.cache: Dict[str, Any] = {}
        self.cache_timestamp: Optional[datetime] = None
        self.CACHE_DURATION = 300  # 5 minutes
        
    def _is_cache_valid(self) -> bool:
        """Check if cache is still valid"""
        if not self.cache_timestamp:
            return False
        return (get_now_karachi().replace(tzinfo=None) - self.cache_timestamp.replace(tzinfo=None)).seconds < self.CACHE_DURATION
    
    async def get_all_available_slots(self, date: str) -> List[Dict[str, Any]]:
        """Get all available slots for a given date across all vendors"""
        try:
            vendors = self.db.get_all_vendors()
            results = []
            
            for vendor in vendors:
                slots = self.db.get_available_slots(
                    vendor_id=vendor['id'],
                    date=date
                )
                
                if slots:
                    results.append({
                        'vendor': vendor,
                        'available_slots': slots
                    })
            
            return results
        except Exception as e:
            logger.error(f"Error getting all slots: {e}")
            return []
    
    async def search_by_pattern(self, 
                                sport_type: Optional[str] = None,
                                area: Optional[str] = None,
                                date: Optional[str] = None,
                                time_start: Optional[str] = None,
                                time_end: Optional[str] = None,
                                max_price: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Smart pattern-based search
        Uses pre-cached data when possible
        """
        
        # Default to today if no date specified
        if not date:
            date = get_today_karachi()
        
        # Get all vendors (filtered by sport if specified)
        if sport_type:
            vendors = self.db.get_vendors_by_service_type(sport_type)
        else:
            vendors = self.db.get_all_vendors()
        
        # Filter by area if specified
        if area:
            vendors = [v for v in vendors if v.get('area', '').lower() == area.lower()]
        
        results = []
        
        for vendor in vendors:
            # Get available slots for this vendor
            slots = self.db.get_available_slots(
                vendor_id=vendor['id'],
                date=date
            )
            
            # Filter by time range if specified
            if time_start and slots:
                slots = [s for s in slots if s.get('time', '') >= time_start]
            
            if time_end and slots:
                slots = [s for s in slots if s.get('time', '') <= time_end]
            
            # Filter by price if specified
            if max_price and max_price > 0 and slots:
                slots = [s for s in slots if s.get('price', 999999) <= max_price]
            
            # Add to results if has available slots
            if slots:
                results.append({
                    'vendor': vendor,
                    'available_slots': slots
                })
        
        return results
    
    def match_common_query(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Match against common query patterns for instant response.
        DATE RESOLUTION IS AUTHORITATIVE AND HAPPENS FIRST.
        """
        query_lower = query.lower().strip()
        print(f"DEBUG: match_common_query called with: '{query_lower}'")
        
        # 1. Authoritative Date Resolution (Deterministic)
        from utils.time import get_today_karachi, get_tomorrow_karachi, get_parson_karachi, get_now_karachi
        today = get_today_karachi()
        tomorrow = get_tomorrow_karachi()
        parson = get_parson_karachi()
        
        resolved_date = None
        if any(word in query_lower for word in ['tomorrow', 'kal']):
            resolved_date = tomorrow
        elif 'parson' in query_lower:
            resolved_date = parson
        elif any(word in query_lower for word in ['today', 'aaj', 'tonight']):
            resolved_date = today
            
        # 2. "Right Now / Free" Fast-Path
        if any(word in query_lower for word in ['right now', 'abhi', 'free']):
            print(f"DEBUG: Fast-path triggered for '{query_lower}'")
            now_karachi = get_now_karachi()
            return {
                'date': resolved_date or today,
                'time_range': {
                    'start': now_karachi.strftime('%H:00'),
                    'end': now_karachi.strftime('%H:59')
                },
                'is_availability_check': True
            }

        # 3. Search keywords check (to avoid non-search queries)
        search_keywords = [
            'slot', 'khali', 'available', 'book', 'court', 'chahiye', 'free',
            'padel', 'futsal', 'cricket', 'pickleball',
            'tonight', 'aaj', 'kal', 'tomorrow', 'today', 'right now', 'abhi',
            'cheap', 'sasta', 'price', 'cost'
        ]
        has_search_keyword = any(keyword in query_lower for keyword in search_keywords)
        if not has_search_keyword and not resolved_date:
            return None

        # 4. Pattern Matching for other fields
        patterns = {
            # Availability checks
            'koi slot hai': {'is_availability_check': True},
            'slot available': {'is_availability_check': True},
            'khali hai': {'is_availability_check': True},
            
            # Specific Times (7pm, 8pm, etc.)
            r'(\d+)\s*pm': lambda m: {'time_range': {'start': f"{int(m.group(1))+12:02}:00", 'end': f"{int(m.group(1))+12:02}:59"}},
            r'(\d+)\s*am': lambda m: {'time_range': {'start': f"{int(m.group(1)):02}:00", 'end': f"{int(m.group(1)):02}:59"}},

            # Time-based
            'aaj raat': {'time_range': {'start': '18:00', 'end': '23:59'}},
            'tonight': {'time_range': {'start': '18:00', 'end': '23:59'}},
            'kal sham': {'time_range': {'start': '17:00', 'end': '20:00'}},
            'tomorrow evening': {'time_range': {'start': '17:00', 'end': '20:00'}},
            'morning': {'time_range': {'start': '06:00', 'end': '12:00'}},
            'subah': {'time_range': {'start': '06:00', 'end': '12:00'}},
            
            # Sport types
            'padel': {'sport_type': 'padel'},
            'futsal': {'sport_type': 'futsal'},
            'cricket': {'sport_type': 'cricket'},
            'pickleball': {'sport_type': 'pickleball'},
            
            # Areas
            'dha': {'area': 'DHA'},
            'clifton': {'area': 'Clifton'},
            'gulberg': {'area': 'Gulberg'},
            'gulshan': {'area': 'Gulshan'},
            
            # Price-based
            'cheap': {'max_price': 2500},
            'sasta': {'max_price': 2500},
            'under 3000': {'max_price': 3000},
        }
        
        filters = {'date': resolved_date or today}
        import re
        
        # Match string patterns
        string_patterns = [(p, f) for p, f in patterns.items() if not callable(f)]
        for pattern, filter_data in sorted(string_patterns, key=lambda x: len(x[0]), reverse=True):
            if pattern in query_lower:
                for k, v in filter_data.items():
                    if k == 'time_range' and k in filters:
                        filters[k].update(v)
                    else:
                        filters[k] = v
        
        # Match regex patterns
        regex_patterns = [(p, f) for p, f in patterns.items() if callable(f)]
        for pattern, filter_data in regex_patterns:
            match = re.search(pattern, query_lower)
            if match:
                res = filter_data(match)
                for k, v in res.items():
                    if k == 'time_range' and k in filters:
                        filters[k].update(v)
                    else:
                        filters[k] = v
        
        return filters

# Global instance
smart_search = SmartSearchCache()
