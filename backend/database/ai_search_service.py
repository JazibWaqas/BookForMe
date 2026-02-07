
import logging
import json
import re
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from openai import OpenAI
from app.config import settings
from database.firestore_v2 import FirestoreV2
from app.firestore import firestore_db
from database.smart_search import smart_search
from utils.time import get_today_karachi, get_tomorrow_karachi, get_parson_karachi

logger = logging.getLogger(__name__)

class AISearchService:
    def __init__(self):
        self.client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=settings.GROQ_API_KEY
        )
        self.fs = FirestoreV2(firestore_db.db)

    def _fetch_slots_sync(self, vendor_id: str, date: str) -> List[Dict[str, Any]]:
        """Sync function to fetch slots to run in separate thread"""
        try:
            # Direct usage of requests/sync client to prevent blocking event loop
            docs = self.fs.db.collection('slots') \
                .where('vendor_id', '==', vendor_id) \
                .where('date', '==', date) \
                .where('status', '==', 'available') \
                .stream()
            
            slots = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                
                # Add formatted time field for frontend match
                if 'start_time' in data:
                    try:
                        start_ts = data['start_time']
                        if hasattr(start_ts, 'strftime'):
                            data['time'] = start_ts.strftime('%H:%M')
                    except Exception:
                        pass
                
                slots.append(data)
            
            # Sort by time
            slots.sort(key=lambda x: x.get('time', '00:00'))
            return slots
        except Exception as e:
            logger.error(f"Error fetching slots sync for {vendor_id}: {e}")
            return []

    async def search(self, query: str, model: Optional[str] = None) -> Dict[str, Any]:
        """
        Main entry point for AI Search.
        Uses smart pattern matching first, falls back to LLM if needed.
        """
        logger.info(f"🚀 AI Search Query: {query}")
        
        selected_model = model or settings.GROQ_MODEL
        
        # 1. Try Smart Pattern Match First (INSTANT)
        from database.smart_search import SmartSearchCache
        temp_smart = SmartSearchCache()
        filters = temp_smart.match_common_query(query)
        
        if filters:
            logger.info(f"⚡ Smart Match Found: {filters}")
            # If smart match found, we still want to check if it's a complete search.
            # If it's missing sport or other key info, we can optionally let LLM refine
            # BUT we keep the date from smart match.
            if not filters.get("sport_type") and not filters.get("is_availability_check"):
                logger.info("🔄 Smart match partial - letting LLM refine non-date fields")
                llm_filters = await self._parse_query(query, selected_model, resolved_date=filters.get("date"))
                # Merge LLM results but PROTECT THE DATE
                if llm_filters:
                    for k, v in llm_filters.items():
                        if k != "date":
                            filters[k] = v
        else:
            # 2. Fall back to LLM Parsing (slower but handles complex queries)
            filters = await self._parse_query(query, selected_model, resolved_date=get_today_karachi())
            logger.info(f"🎯 LLM Parsed Filters (Model: {selected_model}): {filters}")
            # Ensure date is set even in fallback
            if not filters.get("date"):
                filters["date"] = get_today_karachi()
            
        # Check if this is a non-search query (greeting, conversation, etc.)
        if not filters.get("is_availability_check") and not any([
            filters.get("sport_type"),
            filters.get("area"),
            filters.get("date"),
            filters.get("time_range"),
            filters.get("max_price", 0) > 0
        ]):
            logger.info("💬 Non-search query detected - returning empty results")
            return {
                "results": [],
                "filters": None,
                "message": "This is a search-only chatbot. Please ask about court availability!"
            }

        # 3. Execute Search - Optimized Flow
        
        # A. Filter Vendors (DB Level where possible)
        target_sport = filters.get("sport_type")
        target_area = filters.get("area")
        max_price = filters.get("max_price")
        
        if target_sport:
             # normalized sport name (handle paddle/padel)
            sport_query = "padel" if "padd" in target_sport.lower() else target_sport.lower()
            logger.info(f"🔍 Fetching vendors for sport: {sport_query}")
            vendors = await self.fs.get_vendors_by_service(sport_query)
        else:
            logger.info("🔍 Fetching all vendors (no sport filter)")
            vendors = await self.fs.get_all_vendors()

        # B. Filter Vendors by Area (Python Level)
        if target_area:
            target_area_lower = target_area.lower()
            vendors = [
                v for v in vendors 
                if target_area_lower in v.get("area", "").lower() 
                or target_area_lower in v.get("name", "").lower()
                or target_area_lower in v.get("address", "").lower()
            ]

        # C. Parallel Slot Fetching
        target_date = filters.get("date") or get_today_karachi()
        time_range = filters.get("time_range", {})
        start_time_filter = time_range.get("start")
        end_time_filter = time_range.get("end")

        async def fetch_vendor_slots(vendor):
            try:
                # Get slots - Run in thread to avoid blocking loop
                # slots = await self.fs.get_available_slots(vendor["id"], target_date)
                slots = await asyncio.to_thread(self._fetch_slots_sync, vendor["id"], target_date)
                
                # Filter slots by time
                if slots:
                    if start_time_filter and end_time_filter:
                        # Filter within range
                        slots = [s for s in slots if start_time_filter <= (s.get("time") or s.get("slot_time") or "00:00") <= end_time_filter]
                    elif start_time_filter:
                        # STRICT: If user says "7pm", show only slots starting at 7pm (or within the hour)
                        # We'll allow a small buffer (e.g., 7:00 to 7:59) if they just say "7pm"
                        target_h = int(start_time_filter.split(":")[0])
                        target_m = int(start_time_filter.split(":")[1])
                        
                        def is_match(slot_time):
                            if not slot_time: return False
                            h, m = map(int, slot_time.split(":"))
                            # If they specified minutes (like 7:30), be exact. 
                            # If they just said 7pm (start_time_filter 19:00), show the whole hour.
                            if target_m == 0:
                                return h == target_h
                            else:
                                return h == target_h and m == target_m

                        slots = [s for s in slots if is_match(s.get("time") or s.get("slot_time") or "00:00")]
                
                # Filter by price if needed
                if max_price and max_price > 0 and slots:
                    slots = [s for s in slots if s.get('price', 999999) <= max_price]

                if slots:
                    return {
                        'vendor': vendor,
                        'available_slots': slots[:5],
                        'total_slots': len(slots),
                        'is_specific_search': bool(start_time_filter or target_date)
                    }
                return None
            except Exception as e:
                logger.error(f"Error fetching slots for vendor {vendor.get('id')}: {e}")
                return None

        # Execute all slot checks in parallel
        if vendors:
            logger.info(f"⚡ Checking availability for {len(vendors)} vendors in parallel...")
            tasks = [fetch_vendor_slots(v) for v in vendors]
            search_results = await asyncio.gather(*tasks)
            # Filter out None results
            results = [r for r in search_results if r is not None]
        else:
            results = []
        
        logger.info(f"✅ Found {len(results)} vendors with slots")
        
        return {
            "success": True,
            "query": query,
            "filters": filters,
            "model_used": selected_model,
            "results": results[:10]
        }

    async def _parse_query(self, query: str, model: str, resolved_date: Optional[str] = None) -> Dict[str, Any]:
        """Use LLM to extract search parameters with Roman Urdu support"""
        prompt = f"""
        Extract search filters from this user query for a sports booking app in Karachi.
        The query might be in English, Roman Urdu (e.g., "khali hai", "chahye", "kal sham", "parson", "scene on hai"), or messy mix.
        
        Query: "{query}"

        Instructions:
        1. Identify the sport (padel, futsal, cricket, tennis, pickleball).
        2. Identify the area (DHA, Gulberg, Bahria, North Nazimabad, KDA, PECHS, Clifton, Gulshan).
        3. DATE HANDLING:
           - The date has ALREADY been resolved to: {resolved_date or "today's date"}.
           - DO NOT infer a different date. 
           - DO NOT mention date words in your reasoning if they were used for this resolution.
        4. TIME HANDLING:
           - "tonight", "aaj raat" -> Start from 18:00 (6 PM) to 23:59.
           - "sham", "evening" -> Start from 17:00 (5 PM).
           - "subah", "morning" -> Start from 06:00 (6 AM) to 12:00 (12 PM).
           - SPECIFIC TIME: If user mentions a specific time like "7pm" or "19:00", 
             set time_range to that exact hour (e.g., {{"start": "19:00", "end": "19:59"}}).
             DO NOT return a broad range if a specific hour is mentioned.
        5. If asking "is anything free" or "khali slots", set is_availability_check to true.

        Respond ONLY with a JSON object following this schema:
        {{
            "sport_type": "string or null",
            "area": "string or null",
            "time_range": {{"start": "HH:MM", "end": "HH:MM"}}, 
            "max_price": 0,
            "is_availability_check": true,
            "reasoning": "string"
        }}
        """
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            content = response.choices[0].message.content
            # Try to extract JSON if there's surrounding text
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            return json.loads(content)
        except Exception as e:
            logger.error(f"LLM Parsing error with model {model}: {e}")
            # Fallback to default model if specified model fails
            if model != settings.GROQ_MODEL:
                return await self._parse_query(query, settings.GROQ_MODEL)
            return {}
