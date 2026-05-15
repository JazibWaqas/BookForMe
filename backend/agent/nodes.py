"""
LangGraph Agent Nodes - Industry Standard Workflow
Refactored with single-responsibility nodes and conditional routing
Uses Pydantic models for type safety
"""

import logging
import re
import asyncio
import difflib
import random
import time as _time
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from agent.state import AgentState
from app.firestore import firestore_db
from agent.tools import (
    check_availability,
    clear_availability_cache,
    get_pricing,
    get_vendor_info,
    warm_common_availability,
)
from agent.duration import parse_duration
from agent.models import (
    AvailableSlot, SelectedSlot, PendingBooking, BookingResult,
    find_matching_slot, slot_from_query_result
)
from nlu.agent import NLUAgent
from app.config import settings
from better_profanity import profanity
from datetime import datetime as _dt
import pytz as _pytz
from database.schema import SLOT_GENERATION_DAYS

logger = logging.getLogger(__name__)

nlu_agent = NLUAgent()

BOOKING_WINDOW_DAYS = SLOT_GENERATION_DAYS
STANDARD_OPEN_MINUTES = 7 * 60
LATE_NIGHT_CLOSE_MINUTES = 2 * 60

_CONCIERGE_SYSTEM = (
    "You are BookForMe, a booking assistant for sports courts in Karachi "
    "(padel, futsal, cricket, pickleball). "
    "Talk like a casual, helpful local friend. Keep replies short, natural, and human. "
    "Match the user's language exactly: English for English, Roman Urdu for Roman Urdu, mix if they mix. "
    "Stay strictly within sports court booking, availability, pricing, payment, and booking changes. "
    "Coverage: padel only at Ace Padel Club and Golden Court in DHA, plus Smash Padel in Clifton; "
    "futsal at Elite Futsal in Clifton, Goal Zone in Gulshan, Urban Futsal in Bahria; "
    "cricket at Clifton Cricket Nets in Clifton and Pitch Perfect in DHA; "
    "pickleball at The Pickle Pod in DHA, Dink Masters in Clifton, Rally Point in Gulshan. "
    "Do not invent other venues, cities, or areas. "
    "Politely refuse unrelated questions, math, jokes, romantic requests, or inappropriate banter. "
    "Never sound like a form or template. Keep it brief like a WhatsApp message. "
    "Do not use em dashes (—) or en dashes (–). Use commas, periods, or short sentences instead. "
    "Never suggest calling any phone number."
)


_CONVERSE_CACHE: dict = {}  # task/message hash -> (response, timestamp)


async def _llm_converse(task: str, messages: list, fallback: str) -> str:
    """Generate a natural conversational response via DeepSeek. Returns fallback on any error."""
    last_text = ""
    if messages:
        last = messages[-1]
        last_text = last.get("content", "") if isinstance(last, dict) else str(last)
    cache_basis = f"{task}\nLAST:{last_text}"
    cache_key = f"{'ur' if _is_urdu(last_text) else 'en'}:{abs(hash(cache_basis))}"
    cached = _CONVERSE_CACHE.get(cache_key)
    if cached and (_time.time() - cached[1]) < 300:
        return cached[0]
    try:
        history = [{"role": "system", "content": _CONCIERGE_SYSTEM}]
        for m in messages[-4:-1]:
            role = m.get("role", "user") if isinstance(m, dict) else "user"
            content = m.get("content", "") if isinstance(m, dict) else str(m)
            if role in ("user", "assistant") and content:
                history.append({"role": role, "content": content})
        history.append({"role": "user", "content": task})

        start_time = _time.perf_counter()
        resp = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: nlu_agent.client.chat.completions.create(
                model=settings.DEEPSEEK_MODEL,
                messages=history,
                temperature=0.7,
                max_tokens=240,
            ),
        )
        logger.info(f"_llm_converse DeepSeek call took {_time.perf_counter() - start_time:.3f}s")
        result = resp.choices[0].message.content.strip()
        result = re.sub(r"<think>.*?</think>", "", result, flags=re.DOTALL).strip()
        result = result if result else fallback
        _CONVERSE_CACHE[cache_key] = (result, _time.time())
        return result
    except Exception as exc:
        logger.warning(f"_llm_converse failed, using fallback: {exc}")
        return fallback


# ── Instant response helpers (no API call) ────────────────────────────────────

_ASK_DATE_EN = [
    "Sure, what date for {sport}?",
    "Got it. What day works?",
    "When would you like to play?",
    "What date were you thinking?",
    "Cool, which day for {sport}?",
]
_ASK_DATE_UR = [
    "{sport} ke liye kaunsi date?",
    "Theek hai, {sport} kab chahiye?",
    "Got it. Kaunsa din?",
    "{sport} ke liye kaunsa din chahiye?",
    "Sure, {sport} kab khelna hai?",
]
_ASK_TIME_EN = [
    "What time works for you?",
    "Any preferred time?",
    "What time were you thinking?",
    "Sure, what time?",
    "Got it. What time works?",
]
_ASK_TIME_UR = [
    "Kaunsa time chahiye?",
    "Kab ka slot? Subah ya shaam?",
    "Time bataiye?",
    "Theek hai, kaunsa time?",
    "Got it. Kab ka slot?",
]
_ASK_SPORT_EN = [
    "Which sport: padel, futsal, cricket, or pickleball?",
    "Sure, which sport should I check?",
    "What are you looking to book: padel, futsal, cricket, or pickleball?",
]
_ASK_SPORT_UR = [
    "Kaunsi sport chahiye? Padel, futsal, cricket, ya pickleball?",
    "Sure, kis sport ka slot dekhun?",
    "Padel, futsal, cricket, ya pickleball, kis ki booking chahiye?",
]
_GREETING_EN = [
    "Hi! I'm BookForMe, your booking agent. I can book padel, futsal, cricket, or pickleball for you. What would you like to book?",
    "Hello! I'm BookForMe, here to help you book sports slots. Padel, futsal, cricket, or pickleball, what can I get for you?",
    "Hi there! I'm BookForMe, your booking assistant for padel, futsal, cricket, and pickleball. What can I book for you?",
    "Hey! I'm BookForMe. I handle bookings for padel, futsal, cricket, and pickleball. What would you like to book today?",
    "Welcome! I'm BookForMe, your booking agent. Just tell me the sport (padel, futsal, cricket, or pickleball) and I'll get you booked.",
]
_GREETING_UR = [
    "Aoa! Mein BookForMe hoon, aap ka booking agent. Padel, futsal, cricket ya pickleball book kar sakta hoon. Kya book karna hai?",
    "Salam! Mein BookForMe hoon, sports slots book karne mein madad karta hoon. Padel, futsal, cricket, ya pickleball, kis ki booking chahiye?",
    "Aoa! Mein BookForMe hoon, aap ka booking assistant. Bataiye kya book karun, padel, futsal, cricket, ya pickleball?",
    "Salam! Mein BookForMe hoon. Padel, futsal, cricket aur pickleball ki booking karwata hoon. Aaj kya book karna hai?",
    "Aoa! Mein BookForMe hoon, aap ka booking agent. Sport bataiye (padel, futsal, cricket, ya pickleball) aur mein slot book kar dunga.",
]

_URDU_MARKERS = {
    "karna", "chahiye", "hai", "hei", "aaj", "kal", "baje", "shaam",
    "subah", "raat", "haan", "han", "ji", "mujhe", "meri", "mera",
    "kaun", "kab", "kahan", "kya", "aur", "bhi", "nahi", "theek",
}


def _is_urdu(msg: str) -> bool:
    return any(w in msg.lower().split() for w in _URDU_MARKERS)


def _instant_ask_date(sport: str, last_msg: str) -> str:
    pool = _ASK_DATE_UR if _is_urdu(last_msg) else _ASK_DATE_EN
    return random.choice(pool).format(sport=sport)


def _instant_ask_time(sport: str, last_msg: str) -> str:
    pool = _ASK_TIME_UR if _is_urdu(last_msg) else _ASK_TIME_EN
    return random.choice(pool).format(sport=sport)


def _instant_ask_sport(last_msg: str) -> str:
    pool = _ASK_SPORT_UR if _is_urdu(last_msg) else _ASK_SPORT_EN
    return random.choice(pool)


def _instant_greeting(last_msg: str) -> str:
    pool = _GREETING_UR if _is_urdu(last_msg) or last_msg.lower().strip() in {"aoa", "salam", "salaam"} else _GREETING_EN
    return random.choice(pool)


def _extract_fast_sport(message: str) -> Optional[str]:
    msg = message.lower()
    sport_aliases = {
        "padel": ("padel", "padle", "paddle", "padell", "padl", "paddel"),
        "futsal": ("futsal", "futsall", "futsl", "futssal", "futbal", "futbol"),
        "cricket": ("cricket", "criket", "crickt", "kricket", "kricet"),
        "pickleball": ("pickleball", "pickle ball", "pickel ball", "pickelball", "pickle"),
    }
    for sport, aliases in sport_aliases.items():
        if any(re.search(rf"\b{re.escape(alias)}\b", msg) for alias in aliases):
            return sport
    return None


_TIME_RANGE_RE = re.compile(
    r"\b(?:between|from)?\s*"
    r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*"
    r"(?:-|to|and)\s*"
    r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b",
    re.IGNORECASE,
)

_FLEXIBLE_TIME_RE = re.compile(
    r"^\s*any\s*$|"
    r"\b(anytime|any\s+time|any\s+works?|anything\s+works?|whatever|"
    r"whichever|koi\s+bhi|jo\s+(?:bhi\s+)?available|jo\s+bhi|"
    r"any\s+slot|any\s+court)\b",
    re.IGNORECASE,
)

_SLOT_LIST_INFO_RE = re.compile(
    r"\b(cheapest|cheap|sasta|sasti|lowest|min|price|rate|kitna|"
    r"kitne|kitni|cost|charges|kharcha)\b",
    re.IGNORECASE,
)


def _looks_like_flexible_time(message: str) -> bool:
    return bool(_FLEXIBLE_TIME_RE.search((message or "").strip().lower()))


def _is_slot_list_info_request(message: str) -> bool:
    return bool(_SLOT_LIST_INFO_RE.search((message or "").strip().lower()))


_SLOT_SELECTION_PHRASE_RE = re.compile(
    r"\b(?:book|select|choose|pick|reserve|confirm)\s+"
    r"(?:slot\s+|option\s+|number\s+|num\s+|no\.?\s*|#)?(\d{1,2})\b|"
    r"\b(?:slot|option|number|num|no)\.?\s*#?\s*(\d{1,2})\b",
    re.IGNORECASE,
)
_SLOT_SELECTION_SHORT_RE = re.compile(
    r"^\s*(?:#|no\.?\s*|number\s+|num\s+|option\s+|slot\s+)?"
    r"(\d{1,2})"
    r"(?:\s*(?:yes|ok|confirm|book|han|haan|ji|done|sure|wala|wali))?\s*$",
    re.IGNORECASE,
)


def _extract_slot_selection_number(message: str) -> Optional[int]:
    """Resolve flexible slot picks like 'book no.7' without treating times as slots."""
    msg = (message or "").strip()
    if not msg:
        return None

    short_match = _SLOT_SELECTION_SHORT_RE.match(msg)
    if short_match:
        return int(short_match.group(1))

    phrase_match = _SLOT_SELECTION_PHRASE_RE.search(msg)
    if phrase_match:
        raw = phrase_match.group(1) or phrase_match.group(2)
        return int(raw) if raw else None

    return None


def _extract_fast_date_text(message: str) -> Optional[str]:
    msg = message.lower()
    if "day after tomorrow" in msg:
        return "day after tomorrow"
    relative_match = re.search(
        r"\b(?:(?:in|after)\s+)?\d+\s+(?:weeks?|days?)\s*(?:from\s+now|later|hence|baad|se)?\b|"
        r"\bnext\s+week\b|\bnext\s+month\b|\bagle\s+hafte\b|\bagle\s+mahine\b",
        msg,
    )
    if relative_match:
        return relative_match.group(0).strip()
    typo_dates = {
        "tommorow": "tomorrow",
        "tommorrow": "tomorrow",
        "tomorow": "tomorrow",
        "tomoro": "tomorrow",
        "tomrw": "tomorrow",
        "tmrw": "tomorrow",
        "yestarday": "yesterday",
        "yesturday": "yesterday",
    }
    for typo, normalized in typo_dates.items():
        if re.search(rf"\b{typo}\b", msg):
            return normalized
    # tonight/tonite/this evening/this afternoon/this morning all imply today
    if re.search(r'\btonite?\b|\btonight\b|\bthis\s+(evening|afternoon|morning|night)\b', msg):
        return "today"
    for phrase in ("parson", "parso", "tomorrow", "today", "yesterday", "kal", "aaj"):
        if re.search(rf"\b{phrase}\b", msg):
            return "parson" if phrase == "parso" else phrase

    day_match = re.search(
        r"\b(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
        msg,
    )
    if day_match:
        return day_match.group(0)

    date_match = re.search(
        r"\b\d{1,2}(?:st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|"
        r"january|february|march|april|june|july|august|september|october|november|december)\b",
        msg,
    )
    if date_match:
        return date_match.group(0)

    month_day_match = re.search(
        r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|"
        r"january|february|march|april|june|july|august|september|october|november|december)"
        r"\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?\b",
        msg,
    )
    if month_day_match:
        return month_day_match.group(0)

    iso_match = re.search(r"\b\d{4}-\d{2}-\d{2}\b", msg)
    if iso_match:
        return iso_match.group(0)
    return None


def _extract_fast_time_text(message: str) -> Optional[str]:
    msg = message.lower()
    range_match = _TIME_RANGE_RE.search(msg)
    if range_match:
        return range_match.group(0)

    # Open-ended modifiers come BEFORE plain clock match so "after 6pm" wins over "6pm"
    open_match = re.search(
        r"\bafter\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b|"
        r"\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:ke\s*baad|onwards|baad)\b|"
        r"\bbefore\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b|"
        r"\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:se\s*pehle|tak|pehle)\b",
        msg,
    )
    if open_match:
        return open_match.group(0).strip()

    if _looks_like_flexible_time(msg):
        return "anytime"

    clock_match = re.search(r"\b\d{1,2}(:\d{2})?\s*(am|pm)\b", msg)
    if clock_match:
        return clock_match.group(0)

    bajay_match = re.search(r"\b\d{1,2}\s*baj(?:ay|e|ey|a)\b", msg)
    if bajay_match:
        return bajay_match.group(0)

    # tonight/tonite imply evening time bucket; "this <bucket>" maps to that bucket
    if re.search(r'\btonite?\b|\btonight\b', msg):
        return "evening"
    this_match = re.search(r'\bthis\s+(evening|afternoon|morning|night)\b', msg)
    if this_match:
        return this_match.group(1)

    for bucket in ("shaam", "evening", "evenin", "evning", "eve", "subah", "morning", "mrning", "dopahar", "afternoon", "raat", "night", "nite"):
        if re.search(rf"\b{bucket}\b", msg):
            if bucket in ("evenin", "evning", "eve"):
                return "evening"
            if bucket == "mrning":
                return "morning"
            if bucket == "nite":
                return "night"
            return bucket
    return None


def _extract_fast_area(message: str) -> Optional[str]:
    msg = message.lower()
    if re.search(r"\bd\.?h\.?a\b|\bdefen[cs]e\b", msg):
        return "DHA"
    for area in ("clifton", "gulshan", "gulberg", "bahria"):
        if re.search(rf"\b{area}\b", msg):
            return area.title()
    return None


def normalize_area(area_text: str) -> str:
    area_lower = (area_text or "").strip().lower()
    if re.search(r"\bd\.?h\.?a\b|\bdefen[cs]e\b", area_lower):
        return "DHA"
    for area in ("clifton", "gulshan", "gulberg", "bahria"):
        if area in area_lower:
            return area.title()
    return area_text.strip()


def _extract_fast_vendor(message: str) -> Optional[str]:
    msg = message.lower()
    vendor_aliases = {
        "Ace Padel Club": ("ace", "ace padel"),
        "Smash Padel": ("smash", "smash padel"),
        "Golden Court": ("golden", "golden court"),
        "Pickle Pod": ("pickle pod",),
        "Dink Masters": ("dink", "dink masters"),
        "Pitch Perfect": ("pitch perfect",),
        "Rally Point": ("rally", "rally point"),
        "Elite Futsal": ("elite", "elite futsal"),
        "Goal Zone": ("goal zone",),
        "Urban Futsal": ("urban", "urban futsal"),
        "Clifton Cricket Nets": ("clifton cricket", "cricket nets"),
    }
    for vendor, aliases in vendor_aliases.items():
        if any(re.search(rf"\b{re.escape(alias)}\b", msg) for alias in aliases):
            return vendor
    return None


def _try_fast_inquiry_entities(message: str) -> Optional[Dict[str, str]]:
    """Extract common demo booking phrases without an LLM call."""
    msg = message.lower().strip()
    if any(word in msg for word in ("price", "charges", "rate", "kitna", "cost")):
        return None

    sport = _extract_fast_sport(message)
    date_text = _extract_fast_date_text(message)
    time_text = _extract_fast_time_text(message)
    area = _extract_fast_area(message)
    vendor = _extract_fast_vendor(message)
    has_slot_language = any(w in msg for w in ("slot", "book", "booking", "available", "availability", "chahiye", "karna", "khelna", "court"))
    is_sport_only = bool(sport and msg in {sport, "padel", "padle", "paddle", "futsal", "cricket", "pickleball", "pickle ball"})

    if not sport and not (date_text or time_text or area or vendor):
        return None

    if not (date_text or time_text or area or vendor or has_slot_language or is_sport_only):
        return None

    # If sport is missing, only short-circuit when the message is clearly about
    # booking/availability. This preserves context like "aaj shaam koi slot hai?"
    # without turning every stray place name into a booking flow.
    if not sport and not has_slot_language:
        return None

    entities: Dict[str, str] = {}
    if sport:
        entities["service_type"] = sport
    if date_text:
        entities["date"] = date_text
    if time_text:
        entities["time"] = time_text
    if area:
        entities["area"] = area
    if vendor:
        entities["vendor_name"] = vendor
    return entities


# ── Fast-path date/time detection (skips NLU) ─────────────────────────────────

_DATE_FAST_WORDS = {
    "kal", "aaj", "parson", "today", "tomorrow", "day after tomorrow",
    "tommorow", "tommorrow", "tomorow", "tomoro", "tomrw", "tmrw",
    "yesterday", "yestarday", "yesturday", "next week", "next month",
    "agle hafte", "agle mahine",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "somwar", "somvar", "mangal", "budh", "jumeraat", "juma", "jumma", "hafta", "itwar",
}
_TIME_FAST_WORDS = {
    "subah", "morning", "dopahar", "afternoon", "shaam", "evening", "raat", "night",
    "evenin", "evning", "eve", "mrning", "nite",
}


def _try_fast_date(message: str) -> Optional[str]:
    """Return raw date text if message contains a clear date marker.
    Used when user already has sport context (we know they're booking)."""
    msg = message.strip().lower()
    relative_match = re.search(
        r"\b(?:(?:in|after)\s+)?\d+\s+(?:weeks?|days?)\s*(?:from\s+now|later|hence|baad|se)?\b|"
        r"\bnext\s+week\b|\bnext\s+month\b|\bagle\s+hafte\b|\bagle\s+mahine\b",
        msg,
    )
    if relative_match:
        return relative_match.group(0).strip()
    # Word-boundary search — handles "kal subah ka slot", "tomorrow morning"
    for word in _DATE_FAST_WORDS:
        if re.search(rf"\b{re.escape(word)}\b", msg):
            if word in {"tommorow", "tommorrow", "tomorow", "tomoro", "tomrw", "tmrw"}:
                return "tomorrow"
            if word in {"yestarday", "yesturday"}:
                return "yesterday"
            return word
    if re.search(r'\b\d{1,2}(?:st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b', msg):
        return msg
    if re.search(r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?\b', msg):
        return msg
    if re.search(r'\b(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b', msg):
        return msg
    return None


def _try_fast_time(message: str) -> Optional[str]:
    """Return raw time text if message contains a clear time marker.
    Used when user already has sport context."""
    msg = message.strip().lower()
    range_match = _TIME_RANGE_RE.search(msg)
    if range_match:
        return range_match.group(0)
    # Open-ended modifier wins ("after 6pm", "6 ke baad", "before 8")
    open_match = re.search(
        r"\bafter\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b|"
        r"\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:ke\s*baad|se|onwards|baad)\b|"
        r"\bbefore\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b|"
        r"\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:se\s*pehle|tak|pehle)\b",
        msg,
    )
    if open_match:
        return open_match.group(0).strip()
    if _looks_like_flexible_time(msg):
        return "anytime"
    # Word-boundary search for bucket words — handles "shaam mei koi bhi"
    for word in _TIME_FAST_WORDS:
        if re.search(rf"\b{re.escape(word)}\b", msg):
            if word in {"evenin", "evning", "eve"}:
                return "evening"
            if word == "mrning":
                return "morning"
            if word == "nite":
                return "night"
            return word
    if re.search(r'\b\d{1,2}(:\d{2})?\s*(am|pm)\b', msg):
        clock = re.search(r'\b\d{1,2}(:\d{2})?\s*(am|pm)\b', msg)
        return clock.group(0) if clock else None
    if re.search(r'\b\d{1,2}\s*baj(e|ay|a)\b', msg):
        bajay = re.search(r'\b\d{1,2}\s*baj(?:e|ay|a)\b', msg)
        return bajay.group(0) if bajay else None
    return None


def _short_booking_ref(slot_id: str) -> str:
    """Generate a short booking reference from slot_id.
    
    Input: 20260302_18_goal_zone_gulshan_goal_zone_pitch
    Output: GZG-1803 (vendor initials + time + unique)
    
    Format: {VENDOR_CODE}-{TIME}{UNIQUE}
    """
    if not slot_id or "_" not in slot_id:
        return "REF-0000"
    
    import hashlib
    
    parts = slot_id.split("_")
    if len(parts) < 3:
        return "REF-0000"
    
    date_part = parts[0]  # 20260302
    time_part = parts[1]  # 18
    
    # Extract vendor name parts (usually parts[2], parts[3], parts[4])
    # Example: goal_zone_gulshan -> GZG
    vendor_parts = parts[2:5] if len(parts) >= 5 else parts[2:]
    vendor_code = "".join([p[0].upper() for p in vendor_parts if p])[:3]
    
    # If vendor code is too short, use first 3 letters of first vendor part
    if len(vendor_code) < 2:
        vendor_code = parts[2][:3].upper() if parts[2] else "UNK"
    
    # Add some uniqueness from hash
    hash_obj = hashlib.md5(slot_id.encode())
    hash_short = hash_obj.hexdigest()[:2].upper()
    
    return f"{vendor_code}-{time_part}{hash_short}"

profanity.load_censor_words()

_EXTRA_PROFANITY_WORDS = {
    "bc", "bhenchod", "behnchod", "behnchode", "madarchod", "maderchod",
    "bhosri", "bhosdike", "chutiya", "chutya", "gandu", "harami",
}
try:
    profanity.add_censor_words(list(_EXTRA_PROFANITY_WORDS))
except Exception:
    pass

_CUSTOM_PROFANITY_RE = re.compile(
    r"\b(?:bc|bhenchod|behnchod|behnchode|madarchod|maderchod|"
    r"bhosri|bhosdike|chutiya|chutya|gandu|harami)\b",
    re.IGNORECASE,
)

BOOKING_KEYWORDS = {
    "padel", "futsal", "cricket", "court", "slot", "book", "booking", "available",
    "availability", "price", "cancel", "time", "date", "tomorrow", "today", "morning",
    "evening", "afternoon", "night", "kal", "aaj", "shaam", "subah", "raat", "dopahar",
    "reserve", "confirm", "yes", "no", "ok", "done", "schedule", "payment", "pay",
    "transfer", "screenshot", "receipt", "sports", "venue", "dha", "clifton",
    "gulshan", "defense", "karachi", "pitch", "net", "smash", "ace", "golden",
    "match", "game", "play", "ground", "field", "hour", "ghanta", "minute",
    "discount", "charges", "rate", "kitna", "price", "cost", "rupee", "rs",
    "haan", "han", "ji", "theek", "bilkul", "chahiye", "karna", "hai", "hei",
    "slot", "slots", "show", "list", "change", "modify", "different", "other",
    "feb", "march", "april", "may", "june", "july", "monday", "tuesday", "wednesday",
    "thursday", "friday", "saturday", "sunday", "week", "parso", "next",
    "pm", "am", "bajay", "baje", "around", "after", "before",
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
    "hi", "hello", "hey", "aoa", "salam", "assalamualaikum", "walaikum",
    "okay", "sure", "proceed", "nahi", "nope", "stop", "ruko", "mat",
    "want", "need", "mujhe", "pickleball", "bahria",
    "ideally", "prefer", "preferred", "suitable",
}

_WEAK_BOOKING_KEYWORDS = {
    *(str(i) for i in range(1, 13)),
    "yes", "no", "ok", "okay", "done", "sure", "proceed", "haan", "han",
    "ji", "theek", "bilkul", "nahi", "nope", "stop", "ruko", "mat",
    "want", "need", "mujhe", "chahiye", "karna", "hai", "hei",
    "match", "game", "play", "show", "list", "change", "modify",
    "different", "other", "ideally", "prefer", "preferred", "suitable",
    "around", "after", "before",
}
_STRONG_BOOKING_KEYWORDS = BOOKING_KEYWORDS - _WEAK_BOOKING_KEYWORDS

_STANDALONE_CONTEXT_REPLY_RE = re.compile(
    r"^\s*(?:"
    r"\d{1,2}|yes|yep|yup|ok|okay|k|done|sure|confirm|book|proceed|"
    r"no|nope|nah|nahi|cancel|stop|ruko|mat|"
    r"han|haan|ji|theek|bilkul|"
    r"hi|hello|hey|aoa|salam|salaam|assalamualaikum|walaikum"
    r")\s*$",
    re.IGNORECASE,
)
_CONVERSATION_REPAIR_RE = re.compile(
    r"^\s*(?:(?:excuse me|sorry|what|huh|hmm|repeat|again|"
    r"what do you mean|samajh nahi aya|samajh nahin aya|kya matlab|"
    r"thanks?|thank you|shukriya)[\?!.]*|\?+)\s*$",
    re.IGNORECASE,
)
_MATH_QUERY_RE = re.compile(
    r"\d+\s*(?:\+|\-|\*|/|x|times|plus|minus|divided\s+by|multiplied\s+by)\s*\d+|"
    r"\b(?:solve|calculate)\b.*\b\d+\b|"
    r"\bwhat(?:'s|\s+is)?\s+\d+\s*(?:\+|\-|\*|/|x|times|plus|minus)\s*\d+\b",
    re.IGNORECASE,
)
_CLEAR_OFF_TOPIC_RE = re.compile(
    r"\b(?:tell\s+me\s+(?:a\s+)?joke|joke\s+suna|make\s+me\s+laugh|"
    r"weather|recipe|movie|song\s+lyrics|sing\s+(?:me\s+)?(?:a\s+)?song|"
    r"write\s+(?:me\s+)?(?:a\s+)?(?:python\s+)?(?:script|code|essay)|"
    r"python\s+script|president|prime\s+minister|meaning\s+of\s+life|"
    r"how\s+old\s+are\s+you|your\s+age|virtual\s+kiss|kiss\s+me|"
    r"give\s+me\s+(?:a\s+)?kiss|i\s+love\s+you|love\s+you|marry\s+me|"
    r"date\s+me|flirt|romantic|girlfriend|boyfriend)\b",
    re.IGNORECASE,
)
_UNSUPPORTED_ACTION_RE = re.compile(
    r"\b(?:call|phone|contact|message|whatsapp|dm|text)\s+(?:them|venue|vendor|court|club|him|her)|"
    r"\b(?:give|share|send)\s+(?:me\s+)?(?:their\s+)?(?:phone|number|contact)\b",
    re.IGNORECASE,
)
_UNSUPPORTED_SERVICE_RE = re.compile(
    r"\b(?:salon|spa|haircut|restaurant|hotel|cinema|movie\s+ticket|"
    r"tennis|badminton|basketball|football|swimming|gym|snooker|bowling)\b",
    re.IGNORECASE,
)
_UNSUPPORTED_LOCATION_RE = re.compile(
    r"\b(?:hyderabad|lahore|islamabad|rawalpindi|multan|quetta|peshawar|"
    r"north\s+nazimabad|nazimabad|saddar|malir|korangi|jauhar|gulistan\s+e\s+jauhar|"
    r"pechs|bahadurabad|tariq\s+road|north\s+karachi|new\s+karachi|scheme\s+33)\b",
    re.IGNORECASE,
)
_SPORT_VENUE_SUMMARY = {
    "padel": "Ace Padel Club and Golden Court in DHA, plus Smash Padel in Clifton",
    "futsal": "Elite Futsal in Clifton, Goal Zone in Gulshan, and Urban Futsal in Bahria",
    "cricket": "Clifton Cricket Nets in Clifton and Pitch Perfect in DHA",
    "pickleball": "The Pickle Pod in DHA, Dink Masters in Clifton, and Rally Point in Gulshan",
}
_SPORT_AREA_SUMMARY = {
    "padel": "DHA or Clifton",
    "futsal": "Clifton, Gulshan, or Bahria",
    "cricket": "Clifton or DHA",
    "pickleball": "DHA, Clifton, or Gulshan",
}
_SUPPORTED_AREA_ALIASES = {
    "dha": "DHA",
    "d.h.a": "DHA",
    "defence": "DHA",
    "defense": "DHA",
    "clifton": "Clifton",
    "gulshan": "Gulshan",
    "gulberg": "Gulberg",
    "bahria": "Bahria",
}
_SPORT_AREAS = {
    "padel": {"DHA", "Clifton"},
    "futsal": {"Clifton", "Gulshan", "Bahria"},
    "cricket": {"DHA", "Clifton"},
    "pickleball": {"DHA", "Clifton", "Gulshan"},
}
_KNOWN_VENDOR_ALIASES = {
    "ace", "ace padel", "ace padel club",
    "smash", "smash padel",
    "golden", "golden court",
    "pickle pod", "the pickle pod",
    "dink", "dink masters",
    "pitch perfect",
    "rally", "rally point",
    "elite", "elite futsal", "elite futsal arena",
    "goal zone",
    "urban", "urban futsal",
    "clifton cricket", "clifton cricket nets", "cricket nets",
}
_NON_VENDOR_WORDS = {
    "book", "reserve", "check", "want", "need", "please", "pls", "slot",
    "play", "playing", "try", "practice", "game", "match",
    "slots", "court", "courts", "available", "availability", "at", "in",
    "for", "to", "a", "an", "the", "me", "my", "i", "can", "you",
    "do", "have", "is", "there", "tomorrow", "today", "kal", "aaj",
    "morning", "evening", "shaam", "night", "raat", "ko",
    "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep",
    "oct", "nov", "dec", "january", "february", "march", "april",
    "june", "july", "august", "september", "october", "november", "december",
}
_BOOKING_ADJACENT_UNCLEAR_RE = re.compile(
    r"\b(?:too\s+late|too\s+early|late\s+hai|bohat\s+late|earlier|later|"
    r"early|late|not\s+that|not\s+this|that\s+doesn'?t\s+work|"
    r"doesn'?t\s+work|no\s+slots?|nothing\s+else|anything\s+else|"
    r"any\s+other|other\s+options?|different\s+one|another\s+one|"
    r"same\s+time|too\s+expensive|expensive|mehnga|sasta|cheaper|"
    r"aur\s+(?:dikhao|hai|slot)|koi\s+aur|pehle|baad\s+mein|"
    r"samajh\s+nahi|samajh\s+nahin|confused)\b",
    re.IGNORECASE,
)


def _fuzzy_has_keyword(words: set, keywords: Optional[set] = None) -> bool:
    keyword_list = list(keywords or BOOKING_KEYWORDS)
    for word in words:
        if len(word) < 3:
            continue
        if difflib.get_close_matches(word, keyword_list, n=1, cutoff=0.80):
            return True
    return False


def _has_booking_signal(msg_lower: str, words: set) -> bool:
    if words.intersection(_STRONG_BOOKING_KEYWORDS):
        return True
    if _extract_slot_selection_number(msg_lower) is not None:
        return True
    if any([
        _extract_fast_sport(msg_lower),
        _extract_fast_date_text(msg_lower),
        _extract_fast_time_text(msg_lower),
        _extract_fast_area(msg_lower),
        _extract_fast_vendor(msg_lower),
    ]):
        return True
    return _fuzzy_has_keyword(words, _STRONG_BOOKING_KEYWORDS)


def _is_contextual_booking_reply(msg_lower: str, words: set) -> bool:
    if _CONVERSATION_REPAIR_RE.match(msg_lower):
        return True
    if _STANDALONE_CONTEXT_REPLY_RE.match(msg_lower):
        return True
    if _extract_slot_selection_number(msg_lower) is not None:
        return True
    return _has_booking_signal(msg_lower, words)


def _is_clear_off_topic_request(msg_lower: str) -> bool:
    if _MATH_QUERY_RE.search(msg_lower):
        looks_like_booking_time = bool(
            _TIME_RANGE_RE.search(msg_lower)
            and re.search(
                r"\b(slot|slots|book|booking|available|availability|court|"
                r"padel|futsal|cricket|pickleball|am|pm|baje|bajay)\b",
                msg_lower,
            )
        )
        if not looks_like_booking_time:
            return True
    return bool(_CLEAR_OFF_TOPIC_RE.search(msg_lower))


def _is_booking_adjacent_unclear(msg_lower: str) -> bool:
    return bool(_BOOKING_ADJACENT_UNCLEAR_RE.search(msg_lower))


def _unsupported_service_name(msg_lower: str) -> Optional[str]:
    match = _UNSUPPORTED_SERVICE_RE.search(msg_lower)
    return match.group(0) if match else None


def _requested_location_name(msg_lower: str) -> Optional[str]:
    match = _UNSUPPORTED_LOCATION_RE.search(msg_lower)
    if match:
        return " ".join(match.group(0).split()).title()
    for alias, display in _SUPPORTED_AREA_ALIASES.items():
        if re.search(rf"\b{re.escape(alias)}\b", msg_lower):
            return display
    return None


def _coverage_issue(msg_lower: str) -> Optional[Dict[str, str]]:
    sport = _extract_fast_sport(msg_lower)
    location = _requested_location_name(msg_lower)
    if not location:
        return None

    if location not in {"DHA", "Clifton", "Gulshan", "Gulberg", "Bahria"}:
        return {"reason": "unsupported_location", "sport": sport or "", "location": location}

    if sport and location not in _SPORT_AREAS.get(sport, set()):
        return {"reason": "unsupported_sport_area", "sport": sport, "location": location}

    return None


def _unknown_vendor_name(msg_lower: str) -> Optional[str]:
    if any(re.search(rf"\b{re.escape(alias)}\b", msg_lower) for alias in _KNOWN_VENDOR_ALIASES):
        return None

    if "padel" not in msg_lower:
        return None

    candidates = []
    for match in re.finditer(r"\b([a-z][a-z0-9]*(?:\s+[a-z][a-z0-9]*){0,2})\s+padel\b", msg_lower):
        candidates.append(match.group(1))
    for match in re.finditer(r"\bpadel\s+(?:at|in)\s+([a-z][a-z0-9]*(?:\s+[a-z][a-z0-9]*){0,2})\b", msg_lower):
        candidates.append(match.group(1))

    for candidate in candidates:
        words = [w for w in re.findall(r"[a-z0-9]+", candidate) if not w.isdigit() and w not in _NON_VENDOR_WORDS]
        words = [w for w in words if w not in {"dha", "defence", "defense", "clifton", "karachi"}]
        if words:
            name = " ".join(words).title()
            return name if "padel" in name.lower() else f"{name} Padel"

    return None


def _guardrail_response(block_reason: str, message: str, state: AgentState) -> str:
    msg = (message or "").strip()
    msg_lower = msg.lower()
    in_slot_pick = bool(state.get("awaiting_slot_selection") or state.get("slot_options"))
    awaiting_confirm = bool(state.get("awaiting_confirmation"))
    awaiting_payment = bool(state.get("awaiting_payment"))
    sport = state.get("selected_sport_type") or state.get("entities", {}).get("service_type") or "slots"

    if block_reason == "vulgar":
        if in_slot_pick or awaiting_confirm or awaiting_payment or state.get("booking_in_progress"):
            return "I get the frustration, but please keep it respectful. I can still help you find or manage the booking."
        return "Please keep it respectful. I can help with sports court availability and bookings."

    if block_reason == "booking_clarify":
        if awaiting_payment:
            return "I can help with this booking. Send the payment screenshot here, or say cancel if you want to stop."
        if awaiting_confirm:
            return "I may have missed that. Reply yes to hold this slot, no to cancel, or tell me what you want to change."
        if in_slot_pick:
            if re.search(r"\bno\s+slots?\b", msg_lower):
                return "The slots above are available. Pick a number, or tell me a different time/date to check."
            if re.search(r"\b(anything\s+else|any\s+other|other\s+options?|different\s+one|another\s+one|koi\s+aur)\b", msg_lower):
                return "Sure. Tell me another time, date, or area, and I'll check again."
            if re.search(r"\bsame\s+time\b", msg_lower):
                return "Which time do you mean? Pick a number from the list, or type the exact time like 7pm."
            if re.search(r"\b(earlier|too\s+late|late\s+hai|pehle)\b", msg_lower):
                return "Got it, that time may be late. Tell me an earlier time, or pick another number from the list."
            if re.search(r"\b(later|too\s+early|baad)\b", msg_lower):
                return "No problem. Tell me a later time, or pick another number from the list."
            if re.search(r"\b(expensive|mehnga|cheaper|sasta)\b", msg_lower):
                return "Want a cheaper option? Ask for the cheapest one, or pick another number from the list."
            return "I didn't catch which slot you meant. Pick a number from the list, or tell me another time."
        return f"I may have missed that. Tell me the sport, date, and time you want, and I'll check {sport}."

    if block_reason == "unsupported_service":
        service = _unsupported_service_name(msg_lower) or "that"
        if service in {"football"}:
            return "For football-style bookings I can check futsal slots. Tell me the date and time."
        return f"I don't handle {service} bookings here. I can help with padel, futsal, cricket, or pickleball slots."

    if block_reason in {"unsupported_location", "unsupported_sport_area"}:
        issue = _coverage_issue(msg_lower) or {}
        service = issue.get("sport") or _extract_fast_sport(msg_lower)
        location = issue.get("location") or _requested_location_name(msg_lower) or "that area"
        if service:
            venues = _SPORT_VENUE_SUMMARY.get(service, "our Karachi partner venues")
            areas = _SPORT_AREA_SUMMARY.get(service, "Karachi")
            if block_reason == "unsupported_location":
                return f"We're Karachi-based, so I don't have {service} slots in {location}. For {service}, I can book {venues}. Want {areas}?"
            return f"I don't have {service} slots in {location}. For {service}, I can book {venues}. Want {areas}?"
        return "We're Karachi-based. I can help with padel, futsal, cricket, or pickleball slots in our Karachi partner venues."

    if block_reason == "unknown_vendor":
        vendor = _unknown_vendor_name(msg_lower) or "that venue"
        return f"I don't have {vendor} on BookForMe. For padel, I can book Ace Padel Club and Golden Court in DHA, or Smash Padel in Clifton."

    if _UNSUPPORTED_ACTION_RE.search(msg_lower):
        return "I can't call or contact venues, but I can check slots and help reserve one here."

    if _MATH_QUERY_RE.search(msg_lower):
        return "I have to stay on bookings here. Tell me the sport, date, and time, and I'll check slots."

    if re.search(r"\b(kiss|love|marry|date\s+me|flirt|romantic|girlfriend|boyfriend)\b", msg_lower):
        return "Haha, I have to keep it to bookings. Want me to check padel, futsal, cricket, or pickleball slots?"

    if re.search(r"\b(joke|make\s+me\s+laugh)\b", msg_lower):
        return "I have to stay focused on bookings. Want me to check a sports slot instead?"

    if awaiting_confirm:
        return "I can help with this booking. Reply yes to hold it, no to cancel, or tell me what to change."
    if awaiting_payment:
        return "I can help with the payment step. Send the screenshot here, or say cancel if you want to stop."
    if in_slot_pick:
        return "I can help with the slots shown here. Pick a number from the list, or tell me a different time."

    return "I can help with sports bookings here. Tell me padel, futsal, cricket, or pickleball, plus the date and time."


async def _guardrail_response_dynamic(block_reason: str, message: str, state: AgentState) -> str:
    """Use deterministic guardrail classification, but let the LLM phrase guidance."""
    fallback = _guardrail_response(block_reason, message, state)
    if block_reason == "vulgar":
        return fallback

    messages = state.get("messages", [])
    entities = state.get("entities", {}) or {}
    sport = entities.get("service_type") or state.get("selected_sport_type")
    area = entities.get("area") or state.get("selected_area")
    date = entities.get("date") or state.get("selected_date")
    time_range = entities.get("time_range") or state.get("selected_time_range")
    slot_count = len(state.get("slot_options") or [])

    task = (
        "The latest user message needs a booking-focused recovery response. "
        f"Reason: {block_reason}. User said: {message!r}. "
        f"Current context: sport={sport or 'unknown'}, area={area or 'unknown'}, "
        f"date={date or 'unknown'}, time_range={time_range or 'unknown'}, "
        f"awaiting_slot_selection={bool(state.get('awaiting_slot_selection'))}, "
        f"awaiting_confirmation={bool(state.get('awaiting_confirmation'))}, "
        f"awaiting_payment={bool(state.get('awaiting_payment'))}, shown_slot_count={slot_count}. "
        "Write one short WhatsApp-style reply. Be specific to what the user said. "
        "Do not answer unrelated questions, math, jokes, or romantic requests. "
        "If they are mid-slot-list, guide them to pick a number or give a new time/date/area. "
        "For a 'no slots?' style message when slots are already shown, gently say the listed slots are available, "
        "then ask them to pick a number or share a different time/date. Do not scold them or say 'check again'. "
        "For 'too late' or 'too early', ask what time works better and mention they can also pick another shown number. "
        "If they mention an unsupported venue/location/service, say what is unsupported and offer only supported BookForMe options. "
        "If the message is unclear, ask for the exact missing booking detail. "
        "Do not invent venues, areas, phone numbers, or policies."
    )
    return await _llm_converse(task, messages, fallback)


def check_guardrails(message: str, in_booking_context: bool = False) -> Optional[str]:
    msg = message.strip()
    if not msg:
        return None

    msg_lower = msg.lower()

    if profanity.contains_profanity(msg) or _CUSTOM_PROFANITY_RE.search(msg_lower):
        return "vulgar"

    # Hard-block clear off-topic requests even mid-flow. Letting them through
    # can make the intent model misread them as booking modifications.
    if _is_clear_off_topic_request(msg_lower):
        return "off_topic"

    words = set(re.findall(r"[a-z0-9]+", msg_lower))
    coverage_issue = _coverage_issue(msg_lower)
    if coverage_issue:
        return coverage_issue["reason"]
    if _unknown_vendor_name(msg_lower):
        return "unknown_vendor"
    if _unsupported_service_name(msg_lower) and not words.intersection({"padel", "futsal", "cricket", "pickleball"}):
        return "unsupported_service"

    if in_booking_context:
        if _is_booking_adjacent_unclear(msg_lower):
            return "booking_clarify"
        # Let the LLM handle anything else in booking context gracefully.
        # The system prompt enforces topic discipline so there's no need for
        # an aggressive catch-all that blocks valid contextual follow-ups.
        return None

    # Outside booking context: only block if there's no booking signal at all.
    if _STANDALONE_CONTEXT_REPLY_RE.match(msg_lower):
        return None

    if words and not _has_booking_signal(msg_lower, words):
        if len(msg) > 2 and not is_greeting(msg_lower):
            return "off_topic"

    return None


def route_after_guardrails(state: AgentState) -> str:
    if state.get("guardrail_block"):
        return "generate_response"
    return "classify_intent"


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def guardrails_node(state: AgentState) -> AgentState:
    try:
        messages = state.get("messages", [])
        if not messages:
            return state

        last_message = messages[-1].get("content", "")
        in_booking_ctx = any([
            state.get("awaiting_slot_selection"),
            state.get("awaiting_confirmation"),
            state.get("awaiting_payment"),
            state.get("booking_in_progress"),
            state.get("locked_slot_id"),
            state.get("selected_sport_type"),
            state.get("selected_date"),
            state.get("selected_time_range"),
        ])
        block_reason = check_guardrails(last_message, in_booking_context=in_booking_ctx)

        if block_reason:
            state["guardrail_block"] = block_reason
            state["response"] = await _guardrail_response_dynamic(block_reason, last_message, state)
            logger.info(f"Guardrail triggered: {block_reason} for message: '{last_message[:50]}'")
        else:
            state["guardrail_block"] = None

        return state

    except Exception as e:
        logger.error(f"Guardrails check failed: {e}")
        state["guardrail_block"] = None
        return state


def normalize_date(date_text: str) -> str:
    """
    Normalize date text to YYYY-MM-DD format (Karachi timezone).
    Handles: "tomorrow", "today", "kal", "aaj", "Friday", "jumeraat", "weekend",
    "2025-12-17", "15 jan", "4 feb", etc.
    """
    PKT = _pytz.timezone("Asia/Karachi")
    today = _dt.now(PKT).replace(tzinfo=None)
    current_year = today.year
    date_lower = date_text.lower().strip()

    date_pattern = r'(\d{4}-\d{2}-\d{2})'
    match = re.search(date_pattern, date_text)
    if match:
        extracted_date = match.group(1)
        try:
            datetime.strptime(extracted_date, "%Y-%m-%d")
            return extracted_date
        except:
            pass

    if date_lower in ["yesterday", "yestarday", "yesturday", "kal guzra", "guzra kal"]:
        return (today - timedelta(days=1)).strftime("%Y-%m-%d")
    if date_lower in ["today", "aaj"]:
        return today.strftime("%Y-%m-%d")
    elif date_lower in ["tomorrow", "kal", "tommorow", "tommorrow", "tomorow", "tomoro", "tomrw", "tmrw"]:
        return (today + timedelta(days=1)).strftime("%Y-%m-%d")
    elif "day after tomorrow" in date_lower or "parson" in date_lower or "parso" in date_lower:
        return (today + timedelta(days=2)).strftime("%Y-%m-%d")

    if "weekend" in date_lower:
        # Saturday is weekday() == 5
        days_ahead = 5 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        return (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

    # ── Relative expressions ─────────────────────────────────────────────────────
    rel_weeks = re.search(
        r'\b(?:in|after)?\s*(\d+)\s+weeks?\s*(?:from\s+now|later|hence|baad|se)?\b',
        date_lower,
    )
    if rel_weeks:
        return (today + timedelta(weeks=int(rel_weeks.group(1)))).strftime("%Y-%m-%d")
    rel_days = re.search(
        r'\b(?:in|after)?\s*(\d+)\s+days?\s*(?:from\s+now|later|hence|baad|se)?\b',
        date_lower,
    )
    if rel_days:
        return (today + timedelta(days=int(rel_days.group(1)))).strftime("%Y-%m-%d")
    if re.search(r'\bnext\s+week\b|\bagle\s+hafte\b', date_lower):
        return (today + timedelta(weeks=1)).strftime("%Y-%m-%d")
    if re.search(r'\bnext\s+month\b|\bagle\s+mahine\b', date_lower):
        return (today + timedelta(days=30)).strftime("%Y-%m-%d")

    # ── Strip ordinal suffixes so "11th May", "1st June", "23rd Dec" parse correctly
    date_lower_clean = re.sub(r'(\d+)(?:st|nd|rd|th)\b', r'\1', date_lower)
    date_text_clean = re.sub(r'(\d+)(?:st|nd|rd|th)\b', r'\1', date_text, flags=re.IGNORECASE)

    month_names = {
        "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
        "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6,
        "jul": 7, "july": 7, "aug": 8, "august": 8, "sep": 9, "september": 9,
        "oct": 10, "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12
    }

    day_month_pattern = r'(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)(?:\s+(\d{4}))?'
    day_month_match = re.search(day_month_pattern, date_lower_clean)
    if day_month_match:
        day = int(day_month_match.group(1))
        month_name = day_month_match.group(2)
        year = int(day_month_match.group(3)) if day_month_match.group(3) else current_year
        month = month_names.get(month_name)
        if month:
            try:
                parsed = datetime(year, month, day)
                # Do NOT auto-bump past dates to next year.
                # _booking_policy_error will catch them and return a clear
                # "that date has passed" message instead of "too far in future".
                return parsed.strftime("%Y-%m-%d")
            except ValueError:
                pass

    month_day_pattern = r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+(\d{1,2})(?:\s+(\d{4}))?'
    month_day_match = re.search(month_day_pattern, date_lower_clean)
    if month_day_match:
        month_name = month_day_match.group(1)
        day = int(month_day_match.group(2))
        year = int(month_day_match.group(3)) if month_day_match.group(3) else current_year
        month = month_names.get(month_name)
        if month:
            try:
                parsed = datetime(year, month, day)
                return parsed.strftime("%Y-%m-%d")
            except ValueError:
                pass

    date_formats = ['%B %d, %Y', '%d %B %Y', '%B %d %Y', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d']
    for fmt in date_formats:
        try:
            parsed = datetime.strptime(date_text_clean, fmt)
            # Do NOT auto-bump. Return as-is; _booking_policy_error handles past dates.
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            continue

    day_names = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6,
        "somwar": 0, "somvar": 0,
        "mangal": 1,
        "budh": 2,
        "jumeraat": 3,
        "juma": 4, "jumma": 4,
        "hafta": 5,
        "itwar": 6, "etwar": 6,
    }
    for day_name, day_num in day_names.items():
        if re.search(rf"\b{day_name}\b", date_lower):
            days_ahead = day_num - today.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            return (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

    logger.warning(f"Could not parse date '{date_text}', defaulting to today")
    return today.strftime("%Y-%m-%d")


def normalize_time(time_text: str) -> Optional[Dict[str, str]]:
    """
    Normalize time text to time range dict.
    Prioritizes explicit clock times over vague buckets so that
    "evening 4 pm" resolves to 16:00, not the evening bucket (17:00-19:00).
    """
    time_lower = time_text.lower().strip()

    range_match = _TIME_RANGE_RE.search(time_lower)
    if range_match:
        start_hour = int(range_match.group(1))
        start_minute = int(range_match.group(2) or 0)
        start_meridiem = range_match.group(3)
        end_hour = int(range_match.group(4))
        end_minute = int(range_match.group(5) or 0)
        end_meridiem = range_match.group(6)

        # "6-11pm" means both endpoints are PM. Same for "6pm to 11".
        if end_meridiem and not start_meridiem:
            start_meridiem = end_meridiem
        if start_meridiem and not end_meridiem:
            end_meridiem = start_meridiem

        default_pm = (
            not start_meridiem
            and not end_meridiem
            and "am" not in time_lower
            and 1 <= start_hour <= 12
            and 1 <= end_hour <= 12
        )

        def _to_minutes(hour: int, minute: int, meridiem: Optional[str]) -> int:
            if meridiem == "pm" and hour < 12:
                hour += 12
            elif meridiem == "am" and hour == 12:
                hour = 0
            elif default_pm and 1 <= hour <= 11:
                hour += 12
            return hour * 60 + minute

        start_total = _to_minutes(start_hour, start_minute, start_meridiem)
        end_total = _to_minutes(end_hour, end_minute, end_meridiem)

        if end_total <= start_total:
            if end_total + 12 * 60 > start_total:
                end_total += 12 * 60
            else:
                end_total += 24 * 60
        end_total = min(end_total, 24 * 60)

        def _fmt(total: int) -> str:
            if total >= 24 * 60:
                return "24:00"
            return f"{total // 60:02d}:{total % 60:02d}"

        return {"start": _fmt(start_total), "end": _fmt(end_total)}

    hhmm_match = re.match(r'^(\d{1,2}):(\d{2})$', time_lower)
    if hhmm_match:
        hour = int(hhmm_match.group(1))
        minute = int(hhmm_match.group(2))
        # PM heuristic: bare hour 1-11 with no AM/morning marker → assume PM (booking context)
        if 1 <= hour <= 11 and "am" not in time_lower and "subah" not in time_lower and "morning" not in time_lower:
            hour += 12
        return {"start": f"{hour:02d}:{minute:02d}", "end": f"{(hour+1) % 24:02d}:{minute:02d}"}

    # Open-ended: "after 5", "5 ke baad", "5 se", "5 onwards"
    # This must run before plain pm/am parsing so "anytime after 6pm" is
    # understood as 18:00 onward, not as either "anytime" or exactly 6-7pm.
    open_start_match = re.search(
        r"(?:after\s+(\d{1,2})|(\d{1,2})\s*(?:ke\s*baad|se|onwards|baad))",
        time_lower,
    )
    if open_start_match:
        hour_str = open_start_match.group(1) or open_start_match.group(2)
        hour = int(hour_str)
        # PM heuristic: 1-11 with no AM marker → assume PM (booking context)
        if 1 <= hour <= 11 and "am" not in time_lower and "subah" not in time_lower and "morning" not in time_lower:
            hour += 12
        return {"start": f"{hour:02d}:00", "end": "24:00"}

    # Open-ended end: "before 8", "8 se pehle", "before 8 pm", "8 tak"
    open_end_match = re.search(
        r"(?:before\s+(\d{1,2})|(\d{1,2})\s*(?:se\s*pehle|tak|pehle))",
        time_lower,
    )
    if open_end_match:
        hour_str = open_end_match.group(1) or open_end_match.group(2)
        hour = int(hour_str)
        if 1 <= hour <= 11 and "am" not in time_lower and "subah" not in time_lower and "morning" not in time_lower:
            hour += 12
        return {"start": "06:00", "end": f"{hour:02d}:00"}

    if _looks_like_flexible_time(time_lower):
        return {"start": "06:00", "end": "24:00"}

    pm_match = re.search(r"(\d{1,2})\s*pm", time_lower)
    am_match = re.search(r"(\d{1,2})\s*am", time_lower)
    if pm_match:
        hour = int(pm_match.group(1))
        if hour < 12:
            hour += 12
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1) % 24:02d}:00"}
    if am_match:
        hour = int(am_match.group(1))
        if hour == 12:
            hour = 0
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1):02d}:00"}

    bajay_match = re.search(r"(\d+)\s*baj(?:ay|e|ey)(?:\s+kei?\s+around)?", time_lower)
    if bajay_match:
        hour = int(bajay_match.group(1))
        if hour <= 11 and "subah" not in time_lower and "morning" not in time_lower:
            hour += 12
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1) % 24:02d}:00"}

    around_match = re.search(r"around\s+(\d+)", time_lower)
    if around_match:
        hour = int(around_match.group(1))
        if hour <= 11:
            hour += 12
        return {"start": f"{hour:02d}:00", "end": f"{(hour+1) % 24:02d}:00"}

    if "evening" in time_lower or "evenin" in time_lower or "evning" in time_lower or re.search(r"\beve\b", time_lower) or "shaam" in time_lower:
        return {"start": "17:00", "end": "19:00"}
    elif "morning" in time_lower or "mrning" in time_lower or "subah" in time_lower:
        return {"start": "07:00", "end": "12:00"}
    elif "afternoon" in time_lower or "dopahar" in time_lower:
        return {"start": "12:00", "end": "17:00"}
    elif "night" in time_lower or "nite" in time_lower or "raat" in time_lower:
        return {"start": "20:00", "end": "23:00"}

    return None


def _karachi_today_date():
    return _dt.now(_pytz.timezone("Asia/Karachi")).date()


def _parse_iso_date(date_text: Optional[str]):
    if not date_text:
        return None
    try:
        return datetime.strptime(str(date_text), "%Y-%m-%d").date()
    except ValueError:
        return None


def _time_to_minutes(value: Optional[str]) -> Optional[int]:
    if not value or ":" not in str(value):
        return None
    try:
        hour_s, minute_s = str(value)[:5].split(":")
        hour = int(hour_s)
        minute = int(minute_s)
        if hour == 24 and minute == 0:
            return 24 * 60
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return hour * 60 + minute
    except (TypeError, ValueError):
        return None
    return None


def _booking_policy_error(date_text: Optional[str], time_range: Optional[Dict[str, str]]) -> Optional[Dict[str, Any]]:
    """Return a user-facing policy error before querying impossible slots."""
    parsed_date = _parse_iso_date(date_text)
    today = _karachi_today_date()

    if parsed_date:
        if parsed_date < today:
            return {
                "type": "past_date",
                "date": parsed_date.strftime("%Y-%m-%d"),
                "max_date": (today + timedelta(days=BOOKING_WINDOW_DAYS)).strftime("%Y-%m-%d"),
            }
        max_date = today + timedelta(days=BOOKING_WINDOW_DAYS)
        if parsed_date > max_date:
            return {
                "type": "too_far",
                "date": parsed_date.strftime("%Y-%m-%d"),
                "max_date": max_date.strftime("%Y-%m-%d"),
            }

    if time_range:
        start_m = _time_to_minutes(time_range.get("start"))
        end_m = _time_to_minutes(time_range.get("end"))
        if start_m is not None and end_m is not None:
            # 00:00-02:00 can exist for some weekend venues. 02:00-07:00 does not.
            entirely_before_open = end_m <= STANDARD_OPEN_MINUTES and not (
                start_m < LATE_NIGHT_CLOSE_MINUTES and end_m <= LATE_NIGHT_CLOSE_MINUTES
            )
            if entirely_before_open:
                return {
                    "type": "outside_hours",
                    "start": time_range.get("start"),
                    "end": time_range.get("end"),
                }

    return None


def _booking_policy_response(policy_error: Dict[str, Any], state: AgentState) -> str:
    messages = state.get("messages", [])
    last_msg = messages[-1].get("content", "") if messages else ""
    urdu = _is_urdu(last_msg)
    sport = (
        state.get("entities", {}).get("service_type")
        or state.get("selected_sport_type")
        or "sports"
    )
    max_date = policy_error.get("max_date")

    if policy_error.get("type") == "past_date":
        if urdu:
            return f"Past date book nahi ho sakti. Aaj ya next {BOOKING_WINDOW_DAYS} days mein koi date bata dein."
        return f"I can't book past dates. Send today or a future date up to {max_date}."

    if policy_error.get("type") == "too_far":
        if urdu:
            return f"Main abhi next {BOOKING_WINDOW_DAYS} days tak ke slots check kar sakta hoon. {max_date} tak ki date bata dein."
        return f"I can only check slots for the next {BOOKING_WINDOW_DAYS} days, up to {max_date}. Which date in that range?"

    if policy_error.get("type") == "outside_hours":
        start = policy_error.get("start")
        end = policy_error.get("end")
        if urdu:
            return f"{start}-{end} ke liye slots nahi hotay. Usually {sport} slots 07:00 se midnight tak hotay hain, kuch venues weekend par 02:00 tak. Is range mein time bata dein."
        return f"I don't have {sport} slots for {start}-{end}. Slots usually run 07:00 to midnight, with some weekend venues up to 02:00. Tell me a time in that range."

    return "That date or time won't work. Tell me a supported date and time and I'll check slots."


BOOKING_SIGNALS = {
    "padel", "futsal", "cricket", "pickleball", "book", "booking", "slot", "available",
    "availability", "price", "time", "date", "tomorrow", "today", "morning",
    "evening", "afternoon", "night", "kal", "aaj", "shaam", "subah", "raat",
    "pm", "am", "bajay", "baje", "court", "pitch", "reserve", "want",
    "chahiye", "karna", "ace", "golden", "smash",
}


def is_greeting(message: str) -> bool:
    """Check if message is a PURE greeting with no booking content"""
    greetings = ["hi", "hello", "hey", "aoa", "salam", "salaam", "assalam", "assalamu", "assalamu alaikum"]
    msg_lower = message.lower().strip()
    if msg_lower in greetings:
        return True
    words = set(re.findall(r"[a-z]+", msg_lower))
    if words.intersection(BOOKING_SIGNALS):
        return False
    return any(msg_lower.startswith(g + " ") for g in greetings) and not words.intersection(BOOKING_SIGNALS)


def extract_slot_from_time_data(time_data: Any) -> Optional[Dict[str, str]]:
    """Extract slot from time data (dict or string)"""
    if isinstance(time_data, dict):
        slot_time = time_data.get("start")
        if slot_time:
            return {"slot_time": slot_time, "end_time": time_data.get("end", "")}
    elif isinstance(time_data, str):
        normalized = normalize_time(time_data)
        if normalized:
            return {"slot_time": normalized.get("start", ""), "end_time": normalized.get("end", "")}
    return None


def extract_slot_from_message(message: str) -> Optional[Dict[str, str]]:
    """Extract slot directly from message text (including explicit slot IDs)"""
    msg = message.strip()
    msg_lower = msg.lower()
    slot_id_pattern = r"\b(\d{8}_\d{2,4}_[a-z0-9_]+)\b"
    slot_id_match = re.search(slot_id_pattern, msg_lower)
    if slot_id_match:
        raw_id = slot_id_match.group(1)
        parts = raw_id.split("_")
        if len(parts) >= 3:
            time_part = parts[1]
            hour = int(time_part[:2])
            minute = int(time_part[2:]) if len(time_part) > 2 else 0
            slot_time = f"{hour:02d}:{minute:02d}"
            end_hour = (hour + 1) % 24
            end_time = f"{end_hour:02d}:{minute:02d}"
            return {"slot_id": raw_id, "slot_time": slot_time, "end_time": end_time}
    am_pm_pattern = r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)"
    am_pm_match = re.search(am_pm_pattern, msg_lower)
    if am_pm_match:
        hour = int(am_pm_match.group(1))
        minute = int(am_pm_match.group(2)) if am_pm_match.group(2) else 0
        period = am_pm_match.group(3)
        
        if period == "pm" and hour < 12:
            hour += 12
        elif period == "am" and hour == 12:
            hour = 0
        
        slot_time = f"{hour:02d}:{minute:02d}"
        end_hour = (hour + 1) % 24
        return {"slot_time": slot_time, "end_time": f"{end_hour:02d}:{minute:02d}"}
    
    slot_pattern = r"(\d{1,2})[:\s-]+(\d{1,2})"
    slot_m = re.search(slot_pattern, message)
    if slot_m:
        try:
            start_hour = int(slot_m.group(1))
            end_hour = int(slot_m.group(2))
            if start_hour < 24 and end_hour < 24:
                return {"slot_time": f"{start_hour:02d}:00", "end_time": f"{end_hour:02d}:00"}
        except (ValueError, IndexError):
            pass
    
    return None


_ORDINAL_WORDS = {
    "first": 1, "1st": 1, "pehla": 1, "pehli": 1, "first one": 1, "pehla wala": 1, "pehli wali": 1,
    "second": 2, "2nd": 2, "doosra": 2, "doosri": 2, "dusra": 2, "second one": 2, "doosra wala": 2,
    "third": 3, "3rd": 3, "teesra": 3, "teesri": 3, "tesra": 3, "third one": 3, "teesra wala": 3,
    "fourth": 4, "4th": 4, "chautha": 4, "chauthi": 4, "fourth one": 4,
    "fifth": 5, "5th": 5, "paanchwa": 5, "fifth one": 5,
    "last": -1, "akhri": -1, "last one": -1, "akhri wala": -1,
}


def _resolve_ordinal_selection(message: str, n_options: int) -> Optional[int]:
    """Resolve 'first', 'pehla wala', 'last' etc. to a 1-based slot index."""
    msg = message.lower().strip()
    for phrase, idx in _ORDINAL_WORDS.items():
        if re.search(rf"\b{re.escape(phrase)}\b", msg):
            if idx == -1:
                return n_options
            if 1 <= idx <= n_options:
                return idx
    return None


def _resolve_time_selection(message: str, slot_options: List[Dict[str, Any]]) -> Optional[int]:
    """Resolve '6 PM wala' / '6 baje' / '18:00' to a slot index by matching slot_time."""
    msg = message.lower().strip()

    candidates: List[int] = []

    range_match = _TIME_RANGE_RE.search(msg)
    if range_match:
        wanted = normalize_time(range_match.group(0))
        if wanted and wanted.get("start"):
            for i, opt in enumerate(slot_options, start=1):
                if str(opt.get("slot_time", "")) == wanted["start"]:
                    if not wanted.get("end") or str(opt.get("end_time", "")) == wanted["end"]:
                        candidates.append(i)
            if candidates:
                return candidates[0]

    pm_match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*pm", msg)
    am_match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*am", msg)
    bajay_match = re.search(r"(\d{1,2})\s*baj(?:ay|e|ey|a)", msg)
    hhmm_match = re.search(r"\b(\d{1,2}):(\d{2})\b", msg)

    target_hour: Optional[int] = None
    if pm_match:
        target_hour = int(pm_match.group(1))
        if target_hour < 12:
            target_hour += 12
    elif am_match:
        target_hour = int(am_match.group(1))
        if target_hour == 12:
            target_hour = 0
    elif bajay_match:
        target_hour = int(bajay_match.group(1))
        if 1 <= target_hour <= 11 and "subah" not in msg and "morning" not in msg:
            target_hour += 12
    elif hhmm_match:
        target_hour = int(hhmm_match.group(1))

    if target_hour is None:
        return None

    target = f"{target_hour:02d}:"
    for i, opt in enumerate(slot_options, start=1):
        if str(opt.get("slot_time", "")).startswith(target):
            candidates.append(i)

    if candidates:
        return candidates[0]
    return None


CONFIRM_WORDS = {
    "yes", "yep", "yup", "ok", "okay", "sure", "confirm", "confirmed",
    "proceed", "done", "book", "book it", "reserve", "go ahead",
    "han", "haan", "ji", "theek", "bilkul", "ha", "k", "y",
}
CANCEL_WORDS = {
    "no", "nope", "cancel", "nahi", "na", "stop", "nevermind",
    "never mind", "dont", "don't", "nah",
}


def _fast_classify(message: str, state: dict) -> Optional[str]:
    msg = message.strip().lower()

    awaiting_confirm = state.get("awaiting_confirmation") or state.get("awaiting_slot_selection")
    awaiting_payment = state.get("awaiting_payment")
    has_slot_list = bool(state.get("slot_options"))

    # Bare digit only counts as a slot-pick when there's actually a slot list
    # or we're awaiting confirmation. Otherwise let it fall to NLU/normalize_time
    # so "6" can mean "6 PM" when the user is being asked for a time.
    selected_num = _extract_slot_selection_number(msg)
    if selected_num is not None:
        num = selected_num
        if 1 <= num <= 20 and (has_slot_list or awaiting_confirm or awaiting_payment):
            return "transaction"

    if has_slot_list and state.get("awaiting_slot_selection") and _looks_like_flexible_time(msg):
        return "transaction"

    if has_slot_list and state.get("awaiting_slot_selection") and _is_slot_list_info_request(msg):
        return "info_request"

    if awaiting_confirm or awaiting_payment:
        if msg in CONFIRM_WORDS:
            return "transaction"
        if msg in CANCEL_WORDS:
            return "transaction"

    return None


# =============================================================================
# NODE 1: CLASSIFY INTENT (Pure NLU)
# =============================================================================

async def classify_intent_node(state: AgentState) -> AgentState:
    """Pure NLU - classify intent and extract raw entities"""
    try:
        logger.info("🔵 Node: classify_intent")
        
        messages = state.get("messages", [])
        if not messages:
            state["current_intent"] = "greeting"
            state["entities"] = {}
            return state
        
        last_message = messages[-1]["content"]
        logger.info(f"Processing: '{last_message}'")
        
        if is_greeting(last_message):
            logger.info("Detected greeting via fallback")
            state["current_intent"] = "greeting"
            state["entities"] = {}
            # Clear stale booking context so a fresh search doesn't inherit a
            # previous query's date, sport, or vendor.
            state["selected_date"] = None
            state["selected_sport_type"] = None
            state["selected_area"] = None
            state["selected_time_range"] = None
            # Do NOT default vendor_id — that caused Ace to leak into all queries.
            return state

        fast_intent = _fast_classify(last_message, state)
        if fast_intent:
            logger.info(f"Fast-path classification: '{last_message}' -> {fast_intent}")
            state["current_intent"] = fast_intent
            if fast_intent == "transaction" and not state.get("entities"):
                state["entities"] = {}
            return state

        fast_entities = _try_fast_inquiry_entities(last_message)
        if fast_entities:
            # Confidence check: only short-circuit NLU when we have actionable info.
            # If only sport was extracted from a substantive message, defer to NLU —
            # the user may have used phrasing fast-path doesn't recognize ("tonite",
            # "this evening", etc.) that DeepSeek can still parse correctly.
            has_actionable = any(k in fast_entities for k in ("date", "time", "area", "vendor_name"))
            word_count = len(last_message.split())
            if has_actionable or word_count <= 3:
                logger.info(f"Fast-path inquiry entities (confident): {fast_entities}")
                state["current_intent"] = "inquiry"
                state["entities"] = {**state.get("entities", {}), **fast_entities}
                return state
            logger.info(
                f"Fast-path got only sport from {word_count}-word message — "
                f"deferring to NLU for richer extraction"
            )

        # Fast-path: unambiguous date/time inputs when sport context already known.
        # Skips the NLU round-trip entirely. Normalisation happens in normalize_entities_node.
        # Extract date AND time from the same message so we don't re-ask for context the
        # user already gave (e.g. "sunday 8 to 9 pm" must capture both, not just the date).
        if state.get("selected_sport_type"):
            date_val = _try_fast_date(last_message)
            time_val = _try_fast_time(last_message)
            if date_val or time_val:
                new_entities: Dict[str, str] = {}
                if date_val:
                    new_entities["date"] = date_val
                if time_val:
                    new_entities["time"] = time_val
                logger.info(f"Fast-path date/time: '{last_message}' -> {new_entities}")
                state["current_intent"] = "inquiry"
                state["entities"] = {**state.get("entities", {}), **new_entities}
                return state

        # Cap history to last 6 messages to prevent old sport/vendor context from
        # contaminating NLU entity extraction on new turns.
        conversation_history = [
            {"role": m.get("role"), "content": m.get("content")}
            for m in messages[:-1]
        ][-6:]

        nlu_result = await nlu_agent.extract_intent(last_message, conversation_history)
        raw_intent = nlu_result.get("intent", "unknown")
        intent_5 = {
            "booking_request": "inquiry",
            "availability_inquiry": "inquiry",
            "service_selection": "inquiry",
            "date_selection": "inquiry",
            "time_selection": "inquiry",
            "price_inquiry": "info_request",
            "information": "info_request",
            "payment_related": "info_request",
            "confirmation": "transaction",
            "cancellation": "transaction",
            "modification": "transaction",
            "greeting": "greeting",
            "name_provided": "unknown",
            "unknown": "unknown",
        }.get(raw_intent, "unknown" if raw_intent not in ("inquiry", "info_request", "transaction", "greeting") else raw_intent)
        state["current_intent"] = intent_5
        entities = nlu_result.get("entities", {})
        state["entities"] = {k: v for k, v in entities.items() if v is not None}
        
        logger.info(f"Intent: '{state['current_intent']}', Entities: {state['entities']}")
        return state
        
    except Exception as e:
        logger.error(f"Intent classification failed: {e}")
        state["current_intent"] = "unknown"
        state["entities"] = {}
        state["error"] = {"type": "classification_error", "message": str(e)}
        return state


# =============================================================================
# NODE 2: NORMALIZE ENTITIES
# =============================================================================

async def normalize_entities_node(state: AgentState) -> AgentState:
    """Normalize extracted entities to standard formats"""
    try:
        logger.info("🔵 Node: normalize_entities")
        
        entities = state.get("entities", {})
        messages = state.get("messages", [])
        last_message = messages[-1].get("content", "") if messages else ""
        
        date_value = entities.get("date")
        if date_value:
            try:
                date_text = date_value.get("text") if isinstance(date_value, dict) else str(date_value)
                if date_text:
                    previous_date = state.get("selected_date")
                    entities["date"] = normalize_date(date_text)
                    if previous_date and previous_date != entities["date"]:
                        state["previous_selected_date"] = previous_date
                    state["selected_date"] = entities["date"]
                    logger.info(f"Normalized date: {entities['date']}")
            except Exception as e:
                logger.warning(f"Date normalization failed: {e}")
        
        time_value = entities.get("time")
        if time_value:
            try:
                time_text = time_value.get("text") if isinstance(time_value, dict) else str(time_value)
                if time_text:
                    msg_lower = last_message.lower()
                    bucket_word = None
                    if "night" in msg_lower or "raat" in msg_lower:
                        bucket_word = "night"
                    elif "evening" in msg_lower or "shaam" in msg_lower:
                        bucket_word = "evening"
                    elif "morning" in msg_lower or "subah" in msg_lower:
                        bucket_word = "morning"
                    elif "afternoon" in msg_lower or "dopahar" in msg_lower:
                        bucket_word = "afternoon"
                    if bucket_word:
                        time_range = normalize_time(bucket_word)
                    else:
                        time_range = normalize_time(time_text)
                    if time_range:
                        previous_time_range = state.get("selected_time_range")
                        entities["time_range"] = time_range
                        if previous_time_range and previous_time_range != time_range:
                            state["previous_selected_time_range"] = previous_time_range
                        state["selected_time_range"] = time_range
                        logger.info(f"Normalized time: {time_range}")
            except Exception as e:
                logger.warning(f"Time normalization failed: {e}")

        # If we already have a persisted time_range from a previous turn and
        # the current turn didn't extract one, carry it forward.
        if not entities.get("time_range") and state.get("selected_time_range"):
            entities["time_range"] = state.get("selected_time_range")
            logger.info(f"Carried forward time_range from session: {entities['time_range']}")
        
        area_value = entities.get("area")
        if area_value:
            area_text = area_value.get("text") if isinstance(area_value, dict) else str(area_value)
            if area_text:
                entities["area"] = normalize_area(area_text)
                state["selected_area"] = entities["area"]
                logger.info(f"Persisted selected_area: {entities['area']}")

        if not entities.get("area") and state.get("selected_area"):
            entities["area"] = state.get("selected_area")
            logger.info(f"Carried forward area from session: {entities['area']}")

        duration_text = entities.get("duration")
        if not duration_text:
            msg_lower = last_message.lower()
            if any(word in msg_lower for word in ["ghanta", "hour", "minute", "min"]):
                duration_text = last_message

        if duration_text:
            try:
                duration_info = parse_duration(str(duration_text))
                if duration_info:
                    entities["duration_hours"] = duration_info["hours"]
                    state["selected_duration"] = duration_info["hours"]
                    logger.info(f"Parsed duration: {duration_info['hours']} hours")
            except Exception as e:
                logger.warning(f"Duration parsing failed: {e}")
        
        # Persist sport type into state so it survives multi-turn flows
        # (e.g. "padel" → "kal" → "night": sport must be remembered on turn 2 & 3)
        sport_type = entities.get("service_type") or entities.get("sport_type")
        if sport_type:
            state["selected_sport_type"] = sport_type
            logger.info(f"Persisted selected_sport_type: {sport_type}")

        state["entities"] = entities
        return state
        
    except Exception as e:
        logger.error(f"Entity normalization failed: {e}")
        state["error"] = {"type": "normalization_error", "message": str(e)}
        return state


# =============================================================================
# NODE 3: EXTRACT SLOT
# =============================================================================

async def extract_slot_node(state: AgentState) -> AgentState:
    try:
        logger.info("🔵 Node: extract_slot")
        entities = state.get("entities", {})
        messages = state.get("messages", [])
        last_message = (messages[-1].get("content", "") if messages else "").strip()
        slot_options = state.get("slot_options") or []
        selection_num = _extract_slot_selection_number(last_message)

        if slot_options and selection_num is not None:
            idx = selection_num
            if 1 <= idx <= len(slot_options):
                opt = slot_options[idx - 1]
                slot_match = {
                    "slot_id": opt.get("slot_id", ""),
                    "slot_time": opt.get("slot_time", ""),
                    "end_time": opt.get("end_time", ""),
                }
                state["selected_slot"] = slot_match
                state["booking_in_progress"] = True
                logger.info(f"Resolved numeric '{last_message}' to slot {slot_match.get('slot_id')}")
                return state
            else:
                logger.warning(f"Numeric '{last_message}' out of range (1-{len(slot_options)})")

        if slot_options and _looks_like_flexible_time(last_message):
            opt = slot_options[0]
            slot_match = {
                "slot_id": opt.get("slot_id", ""),
                "slot_time": opt.get("slot_time", ""),
                "end_time": opt.get("end_time", ""),
            }
            state["selected_slot"] = slot_match
            state["booking_in_progress"] = True
            logger.info(f"Resolved flexible selection '{last_message}' to first displayed slot {slot_match.get('slot_id')}")
            return state

        # Ordinal selection: "first one", "pehla wala", "doosra", etc.
        if slot_options:
            ordinal_idx = _resolve_ordinal_selection(last_message, len(slot_options))
            if ordinal_idx is not None:
                opt = slot_options[ordinal_idx - 1]
                slot_match = {
                    "slot_id": opt.get("slot_id", ""),
                    "slot_time": opt.get("slot_time", ""),
                    "end_time": opt.get("end_time", ""),
                }
                state["selected_slot"] = slot_match
                state["booking_in_progress"] = True
                logger.info(f"Resolved ordinal '{last_message}' to slot {slot_match.get('slot_id')}")
                return state

            # Time-based selection: "6 PM wala", "6 baje wala"
            time_idx = _resolve_time_selection(last_message, slot_options)
            if time_idx is not None:
                opt = slot_options[time_idx - 1]
                slot_match = {
                    "slot_id": opt.get("slot_id", ""),
                    "slot_time": opt.get("slot_time", ""),
                    "end_time": opt.get("end_time", ""),
                }
                state["selected_slot"] = slot_match
                state["booking_in_progress"] = True
                logger.info(f"Resolved time-based '{last_message}' to slot {slot_match.get('slot_id')}")
                return state

        slot_match = extract_slot_from_message(last_message)

        if slot_match and slot_match.get("slot_id"):
            state["selected_slot"] = slot_match
            state["booking_in_progress"] = True
            logger.info(f"Extracted slot by ID: {slot_match}")
        
        vendor_id = entities.get("vendor_id")
        vendor_name = entities.get("vendor_name") or entities.get("vendor")
        
        if vendor_name and not vendor_id:
            state["vendor_name"] = vendor_name
        
        state["vendor_id"] = vendor_id or state.get("vendor_id")
        
        return state
        
    except Exception as e:
        logger.error(f"Slot extraction failed: {e}")
        state["error"] = {"type": "slot_extraction_error", "message": str(e)}
        return state


# =============================================================================
# NODE 4: VALIDATE STATE
# =============================================================================

async def validate_state_node(state: AgentState) -> AgentState:
    """Validate state has required data for current intent"""
    try:
        logger.info("🔵 Node: validate_state")
        
        intent = state.get("current_intent", "")
        entities = state.get("entities", {})
        
        has_sport = bool(
            entities.get("service_type")
            or entities.get("sport_type")
            or state.get("selected_sport_type")
        )
        has_date = bool(entities.get("date") or state.get("selected_date"))
        # has_time: ONLY a successfully-normalized time_range counts.
        # Raw NLU tokens like 'chahiye', 'morning' (pre-parse) must NOT be treated as valid time.
        has_time = bool(entities.get("time_range"))

        # NOTE: the former 'auto-inject today when has_time but no date' block has been removed.
        # It caused silent datetime.now() queries for noisy tokens like 'chahiye'.
        # If date is missing, we always ask the user — no silent defaults.

        missing = []
        if intent == "inquiry":
            if not has_sport:
                missing.append("sport")
            if has_sport and not has_date:
                missing.append("date")
            if has_sport and has_date and not has_time:
                missing.append("time")

        state["policy_error"] = None
        if has_date:
            policy_error = _booking_policy_error(
                entities.get("date") or state.get("selected_date"),
                entities.get("time_range"),
            )
            if policy_error:
                state["policy_error"] = policy_error
                if policy_error.get("type") in {"past_date", "too_far"}:
                    previous_date = state.get("previous_selected_date")
                    if previous_date:
                        state["selected_date"] = previous_date
                    else:
                        state["selected_date"] = None
                    entities.pop("date", None)
                if policy_error.get("type") == "outside_hours":
                    previous_time_range = state.get("previous_selected_time_range")
                    if previous_time_range:
                        state["selected_time_range"] = previous_time_range
                    else:
                        state["selected_time_range"] = None
                    entities.pop("time_range", None)
                    entities.pop("time", None)
                missing = []
                logger.info(f"Booking policy blocked request: {policy_error}")

        state["missing_fields"] = missing if missing else None
        state["requires_clarification"] = bool(missing)
        
        if missing:
            logger.info(f"Missing fields for {intent}: {missing}")
        else:
            logger.info(f"Validation passed for {intent}")
        
        return state
        
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        state["error"] = {"type": "validation_error", "message": str(e)}
        return state


# =============================================================================
# NODE 5: QUERY AVAILABILITY
# =============================================================================

def date_from_slot_id(slot_id: str) -> Optional[str]:
    """Parse YYYY-MM-DD from slot ID like 20260208_0900_ace_3."""
    if not slot_id or "_" not in slot_id:
        return None
    parts = slot_id.strip().split("_")
    if len(parts) < 2:
        return None
    date_part = parts[0]
    if len(date_part) != 8 or not date_part.isdigit():
        return None
    try:
        y, m, d = int(date_part[:4]), int(date_part[4:6]), int(date_part[6:8])
        if 1 <= m <= 12 and 1 <= d <= 31:
            return f"{y:04d}-{m:02d}-{d:02d}"
    except (ValueError, IndexError):
        pass
    return None


def infer_sport_from_slot_id(slot_id: str) -> Optional[str]:
    slot_lower = (slot_id or "").lower()
    if "cricket" in slot_lower:
        return "cricket"
    if "padel" in slot_lower:
        return "padel"
    if "futsal" in slot_lower:
        return "futsal"
    return None


def find_slot_by_id(slot_id: str, vendors: List[Dict]) -> Optional[Dict]:
    """Find exact slot by slot_id in query results."""
    if not slot_id:
        return None
    slot_id_lower = slot_id.lower().strip()
    for vendor in vendors:
        for slot in vendor.get("slots", []):
            sid = (slot.get("slot_id") or slot.get("id") or "").lower()
            if sid == slot_id_lower:
                return {**slot, "vendor_id": vendor.get("vendor_id")}
    return None


def match_slot_from_results(user_slot_time: str, vendors: List[Dict]) -> Optional[Dict]:
    """
    Find a matching slot from query results based on user's selected time.
    Returns the full slot dict with slot_id and price.
    """
    user_time = user_slot_time.strip()
    user_hour = user_time.split(":")[0] if ":" in user_time else user_time

    for vendor in vendors:
        for slot in vendor.get("slots", []):
            db_time = slot.get("slot_time", "")
            db_hour = db_time.split(":")[0] if ":" in db_time else db_time

            if db_time == user_time:
                return {**slot, "vendor_id": vendor.get("vendor_id")}

            if db_hour == user_hour:
                return {**slot, "vendor_id": vendor.get("vendor_id")}

    return None


async def query_availability_node(state: AgentState) -> AgentState:
    """Query slot availability from database and match user selection"""
    try:
        logger.info("🔵 Node: query_availability")
        
        entities = state.get("entities", {})
        messages = state.get("messages", [])
        last_message = messages[-1].get("content", "").lower() if messages else ""
        intent = state.get("current_intent", "")
        
        service_type = (
            entities.get("service_type")
            or entities.get("sport_type")
            or state.get("selected_sport_type")
        )
        area = entities.get("area") or state.get("selected_area")
        date = entities.get("date") or state.get("selected_date")
        if not date:
            # No date provided and none in session — this should have been caught by
            # validate_state_node. Log a warning and bail so we don't silently query
            # for today and confuse the user with spurious "no slots" messages.
            logger.warning("query_availability_node called with no date in entities or session — skipping query")
            state["query_result"] = {"success": False, "error": "no_date", "vendors": []}
            return state
        user_selected_for_date = state.get("selected_slot")
        if user_selected_for_date and (user_selected_for_date.get("slot_id") or user_selected_for_date.get("id")):
            parsed = date_from_slot_id(user_selected_for_date.get("slot_id") or user_selected_for_date.get("id") or "")
            if parsed:
                date = parsed
                state["selected_date"] = parsed
                logger.info(f"Using date from slot ID: {date}")
            if not service_type:
                service_type = infer_sport_from_slot_id(user_selected_for_date.get("slot_id") or user_selected_for_date.get("id") or "")
        if not service_type:
            logger.warning("query_availability_node called with no sport in entities or session — skipping query")
            state["query_result"] = {"success": False, "error": "no_sport", "vendors": []}
            return state
        time_range = entities.get("time_range")

        user_selected = state.get("selected_slot")
        explicit_slot_id = (user_selected or {}).get("slot_id") or (user_selected or {}).get("id")

        if explicit_slot_id:
            from database.firestore_v2 import FirestoreV2
            from database.schema import SlotStatus
            import pytz
            fs = FirestoreV2(firestore_db.db)
            direct_slot = await fs.get_slot(explicit_slot_id)
            if direct_slot and direct_slot.get("status") == SlotStatus.AVAILABLE.value:
                raw_start = direct_slot.get("start_time")
                if hasattr(raw_start, "astimezone"):
                    slot_start = raw_start.astimezone(pytz.timezone("Asia/Karachi")).strftime("%H:%M")
                elif raw_start:
                    slot_start = str(raw_start)[:5]
                else:
                    slot_start = (user_selected or {}).get("slot_time", "09:00")
                h = int(slot_start.split(":")[0]) if ":" in str(slot_start) else 9
                slot_end = f"{(h + 1) % 24:02d}:00"
                vendor_id = direct_slot.get("vendor_id", "")
                price = int(direct_slot.get("price", 0))
                slot_date = direct_slot.get("date", date)
                inferred_sport = infer_sport_from_slot_id(explicit_slot_id) or service_type

                full_slot = {
                    "slot_id": explicit_slot_id,
                    "slot_time": slot_start,
                    "end_time": slot_end,
                    "price": price,
                    "resource_id": direct_slot.get("resource_id", ""),
                    "vendor_id": vendor_id
                }
                vendor_name = ""
                try:
                    from database.firestore_v2 import FirestoreV2
                    v = await FirestoreV2(firestore_db.db).get_vendor(vendor_id)
                    vendor_name = v.get("name", "") if v else ""
                except Exception:
                    pass
                state["selected_slot"] = full_slot
                state["vendor_id"] = vendor_id
                state["awaiting_confirmation"] = True
                state["awaiting_slot_selection"] = False
                state["confirmation_type"] = "booking"
                state["pending_booking"] = {
                    "slot": full_slot,
                    "slot_id": explicit_slot_id,
                    "price": price,
                    "date": slot_date,
                    "vendor_id": vendor_id,
                    "vendor_name": vendor_name,
                    "service_type": inferred_sport,
                    "area": area or "Karachi"
                }
                state["query_result"] = {"success": True, "date": slot_date, "sport_type": inferred_sport, "area": area or "Karachi", "vendors": []}
                logger.info(f"Slot found directly by ID: {explicit_slot_id}, price={price}")
                return state

        # Vendor gating: stale vendor_id from a prior query must NOT bleed into fresh queries.
        # A vendor constraint is only valid when:
        #   a) user explicitly mentioned a vendor in THIS message (entities has vendor info), OR
        #   b) user is mid-booking for that vendor (awaiting_slot_selection or awaiting_confirmation)
        # Otherwise treat as an all-vendor search so the user sees every available court.
        user_mentioned_vendor = bool(
            entities.get("vendor_id")
            or entities.get("vendor_name")
            or entities.get("vendor")
        )
        in_active_booking = bool(
            state.get("awaiting_slot_selection")
            or state.get("awaiting_confirmation")
        )

        if user_mentioned_vendor:
            ent_vendor_name = entities.get("vendor_name") or entities.get("vendor")
            ent_vendor_id = entities.get("vendor_id")
        elif in_active_booking:
            # Mid-booking follow-up (e.g. "ace padel" → selecting a slot number)
            ent_vendor_name = state.get("vendor_name")
            ent_vendor_id = state.get("vendor_id")
        else:
            # Fresh inquiry — search all vendors, ignore any stale vendor from session
            ent_vendor_name = None
            ent_vendor_id = None

        logger.info(f"Checking availability: {service_type} in {area} on {date}, vendor_name={ent_vendor_name}, vendor_id={ent_vendor_id} (user_mentioned={user_mentioned_vendor}, in_active_booking={in_active_booking})")
        query_result = await check_availability(service_type, area, date, time_range, vendor_name=ent_vendor_name, vendor_id=ent_vendor_id)
        
        has_slots = query_result and query_result.get("success") and query_result.get("vendors") and len(query_result.get("vendors", [])) > 0
        
        user_gave_date = bool(entities.get("date"))
        should_search_alternatives = (
            not has_slots and (
                user_gave_date or
                "koi bhi date" in last_message or 
                "any date" in last_message or
                "konsey din" in last_message or
                "alternative" in last_message or
                "dosri date" in last_message
            )
        )
        
        if should_search_alternatives:
            logger.info("No vendors found, searching alternative dates in parallel...")
            base_date = datetime.strptime(date, "%Y-%m-%d")
            max_alt_date = _karachi_today_date() + timedelta(days=BOOKING_WINDOW_DAYS)
            future_dates = [
                candidate.strftime("%Y-%m-%d")
                for d in range(1, 8)
                if (candidate := (base_date + timedelta(days=d)).date()) <= max_alt_date
            ]
            alt_results = await asyncio.gather(*[
                check_availability(service_type, area, d, time_range, vendor_name=ent_vendor_name, vendor_id=ent_vendor_id)
                for d in future_dates
            ])
            next_available_date = None
            for check_date, alt_result in zip(future_dates, alt_results):
                if alt_result and alt_result.get("success") and alt_result.get("vendors") and len(alt_result.get("vendors", [])) > 0:
                    query_result = alt_result
                    query_result["requested_date"] = date
                    query_result["next_available_date"] = check_date
                    next_available_date = check_date
                    logger.info(f"✅ Found vendors on {check_date}")
                    break

            if not next_available_date:
                logger.info("No vendors found in next 7 days")
        
        state["query_result"] = query_result if query_result else {"success": False, "error": "Query returned None"}
        
        has_slots = query_result and query_result.get("success") and query_result.get("vendors") and len(query_result.get("vendors", [])) > 0
        user_selected = state.get("selected_slot")
        explicit_slot_id = (user_selected or {}).get("slot_id") or (user_selected or {}).get("id")

        if has_slots and explicit_slot_id:
            matched_slot = find_slot_by_id(explicit_slot_id, query_result["vendors"])
            if matched_slot:
                logger.info(f"Matched slot by ID: {explicit_slot_id}")
            else:
                user_slot_time = user_selected.get("slot_time", "")
                logger.info(f"No ID match, trying time: '{user_slot_time}'")
                matched_slot = match_slot_from_results(user_slot_time, query_result["vendors"])
            
            if matched_slot:
                slot_id = matched_slot.get("slot_id", "")
                price = matched_slot.get("price", 0)
                logger.info(f"Matched Slot: ID={slot_id}, Price={price}")
                vendor_id = matched_slot.get("vendor_id") or state.get("vendor_id")
                vendor_name = ""
                for v in query_result.get("vendors", []):
                    if v.get("vendor_id") == vendor_id:
                        vendor_name = v.get("vendor_name", "")
                        break
                full_selected_slot = {
                    "slot_id": slot_id,
                    "slot_time": matched_slot.get("slot_time", ""),
                    "end_time": matched_slot.get("end_time", ""),
                    "price": price,
                    "resource_id": matched_slot.get("resource_id", ""),
                    "vendor_id": vendor_id
                }
                state["selected_slot"] = full_selected_slot
                state["vendor_id"] = vendor_id
                state["awaiting_confirmation"] = True
                state["awaiting_slot_selection"] = False
                state["confirmation_type"] = "booking"
                state["pending_booking"] = {
                    "slot": full_selected_slot,
                    "slot_id": slot_id,
                    "price": price,
                    "date": query_result.get("next_available_date") or date,
                    "vendor_id": vendor_id,
                    "vendor_name": vendor_name,
                    "service_type": service_type,
                    "area": area
                }
                logger.info(f"Slot matched! slot_id={slot_id}, price={price}, vendor={vendor_id}")
            else:
                logger.warning(f"No matching slot found for: {explicit_slot_id}")
                state["selected_slot"] = None
        
        if has_slots and not state.get("awaiting_confirmation"):
            logger.info(f"Slots available, waiting for user selection. Vendors: {len(query_result.get('vendors', []))}")
            if query_result.get("next_available_date"):
                state["selected_date"] = query_result["next_available_date"]
            else:
                state["selected_date"] = date
        else:
            state["selected_date"] = date
        
        return state
        
    except Exception as e:
        logger.error(f"Availability query failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        state["query_result"] = {"success": False, "error": str(e)}
        return state


# =============================================================================
# NODE 6: QUERY INFO
# =============================================================================

async def query_info_node(state: AgentState) -> AgentState:
    """Query pricing or vendor info"""
    try:
        logger.info("🔵 Node: query_info")
        
        intent = state.get("current_intent", "")
        
        if intent == "info_request":
            state["query_result"] = get_pricing()
            logger.info("Retrieved pricing info")
        else:
            state["query_result"] = get_vendor_info()
            logger.info("Retrieved vendor info")
        
        return state
        
    except Exception as e:
        logger.error(f"Info query failed: {e}")
        state["query_result"] = {"success": False, "error": str(e)}
        return state


# =============================================================================
# NODE 7: CHECK CONFIRMATION
# =============================================================================

async def check_confirmation_node(state: AgentState) -> AgentState:
    """Check user's confirmation response using boundary-safe token matching"""
    try:
        logger.info("🔵 Node: check_confirmation")
        
        intent = state.get("current_intent", "")
        messages = state.get("messages", [])
        last_message = messages[-1].get("content", "").strip() if messages else ""

        tx = _detect_tx_input(last_message)

        if tx == "cancel" or _CANCEL_WORDS.search(last_message):
            state["user_confirmed"] = False
            state["confirmation_action"] = "cancel"
            state["awaiting_confirmation"] = False
            state["pending_booking"] = None
            state["selected_slot"] = None
            state["slot_options"] = []
            state["awaiting_slot_selection"] = False
            logger.info("User cancelled booking")
        elif tx == "modify" or _MODIFY_WORDS.search(last_message):
            state["user_confirmed"] = False
            state["confirmation_action"] = "modify"
            state["awaiting_confirmation"] = False
            state["pending_booking"] = None
            state["slot_options"] = []
            state["awaiting_slot_selection"] = False
            logger.info("User wants to modify")
        elif tx in ("confirm", "slot_select") or _CONFIRM_WORDS.search(last_message):
            state["user_confirmed"] = True
            state["confirmation_action"] = "proceed"
            logger.info("User confirmed booking")
        else:
            state["user_confirmed"] = None
            state["confirmation_action"] = "clarify"
            logger.info("Needs clarification")
        
        return state
        
    except Exception as e:
        logger.error(f"Confirmation check failed: {e}")
        state["confirmation_action"] = "clarify"
        return state


# =============================================================================
# NODE 8: EXECUTE BOOKING (with proper slot locking)
# =============================================================================

async def execute_booking_node(state: AgentState) -> AgentState:
    """
    Execute booking with proper slot locking flow:
    1. If no slot locked yet -> Lock the slot (10 min hold)
    2. If slot already locked -> Check if payment received -> Confirm booking
    
    This prevents double-booking by using Firestore transactions.
    """
    try:
        logger.info("🔵 Node: execute_booking")
        
        pending = state.get("pending_booking", {})
        
        if not pending:
            logger.error("No pending booking found")
            state["booking_result"] = {"success": False, "error": "No booking details found"}
            return state
        
        slot = pending.get("slot", {})
        user_phone = state.get("user_phone", "")
        
        booking_details = {
            "vendor_id": pending.get("vendor_id") or state.get("vendor_id"),
            "date": pending.get("date") or state.get("selected_date"),
            "time": slot.get("slot_time"),
            "end_time": slot.get("end_time"),
            "duration_hours": state.get("selected_duration") or 1.0,
            "service_type": pending.get("service_type") or "padel",
            "customer_info": {
                "phone": user_phone,
                "name": state.get("entities", {}).get("customer_name") or f"Customer {user_phone}",
                "booking_source": "whatsapp_ai"
            }
        }
        
        logger.info(f"Processing booking: vendor={booking_details['vendor_id']}, date={booking_details['date']}, time={booking_details['time']}")
        
        from app.firestore import firestore_db
        from database.slot_service import SlotService
        
        slot_service = SlotService(firestore_db.db)
        
        slot_id = pending.get("slot_id") or slot.get("id") or slot.get("slot_id")
        locked_slot_id = state.get("locked_slot_id")
        
        if locked_slot_id:
            logger.info(f"Slot already locked: {locked_slot_id}, confirming booking...")
            confirm_result = slot_service.confirm_booking(locked_slot_id, booking_details["vendor_id"])
            
            if confirm_result.get("success"):
                state["booking_result"] = {
                    "success": True,
                    "booking_id": locked_slot_id,
                    "slot_id": locked_slot_id,
                    "message": "Booking confirmed successfully!"
                }
                state["locked_slot_id"] = None
                logger.info(f"✅ Booking confirmed: {locked_slot_id}")
            else:
                state["booking_result"] = confirm_result
                logger.error(f"❌ Confirmation failed: {confirm_result.get('error')}")
        
        elif slot_id:
            logger.info(f"Locking slot: {slot_id}")
            lock_result = slot_service.lock_slot(slot_id, user_phone, booking_source="whatsapp_ai")
            
            if lock_result.get("success"):
                slot_price = slot.get("price") or pending.get("price") or lock_result.get("price") or 0
                clear_availability_cache()
                
                state["locked_slot_id"] = slot_id
                state["awaiting_payment"] = True
                state["payment_amount"] = slot_price
                state["booking_result"] = {
                    "success": True,
                    "booking_id": slot_id,
                    "slot_id": slot_id,
                    "status": "locked",
                    "amount": slot_price,
                    "hold_expires_in_minutes": lock_result.get("expires_in_minutes", 10),
                    "message": f"Slot locked! Please transfer Rs {slot_price} and send payment screenshot within 10 minutes."
                }
                logger.info(f"✅ Slot locked: {slot_id}, amount: {slot_price}")
            else:
                state["booking_result"] = lock_result
                logger.error(f"❌ Lock failed: {lock_result.get('error')}")
        
        else:
            logger.info("No slot_id found, using direct booking method...")
            from database.availability_service import AvailabilityService
            availability_service = AvailabilityService()
            
            result = await availability_service.check_and_book_slot(
                vendor_id=booking_details["vendor_id"],
                date=booking_details["date"],
                time=booking_details["time"],
                customer_info=booking_details["customer_info"]
            )
            
            state["booking_result"] = result
            
            if result and result.get("success"):
                logger.info(f"✅ Booking created: {result.get('booking_id')}")
            else:
                logger.error(f"❌ Booking failed: {result.get('error') if result else 'No result'}")
        
        state["awaiting_confirmation"] = False
        state["pending_booking"] = None
        state["booking_in_progress"] = False
        
        return state
        
    except Exception as e:
        logger.error(f"Booking execution failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        state["booking_result"] = {"success": False, "error": str(e)}
        return state


# =============================================================================
# NODE 9: GENERATE RESPONSE
# =============================================================================

async def generate_response_node(state: AgentState) -> AgentState:
    """Generate natural language response"""
    try:
        logger.info("🔵 Node: generate_response")
        
        if state.get("guardrail_block"):
            logger.info(f"Guardrail block active: {state['guardrail_block']}")
            return state

        if state.get("policy_error"):
            state["response"] = _booking_policy_response(state["policy_error"], state)
            return state
        
        intent = state.get("current_intent", "")
        entities = state.get("entities", {})
        query_result = state.get("query_result") or {}
        booking_result = state.get("booking_result")
        awaiting = state.get("awaiting_confirmation", False)
        confirmation_action = state.get("confirmation_action")
        messages = state.get("messages", [])
        last_msg = messages[-1].get("content", "") if messages else ""

        if confirmation_action == "cancel":
            state["response"] = await _llm_converse(
                "The user's booking has been cancelled. Confirm it briefly and offer to help with anything else.",
                messages,
                "Done, booking cancelled. Anything else I can help with?",
            )
            return state

        if confirmation_action == "modify":
            state["response"] = await _llm_converse(
                "The user wants to modify their booking. Ask what they'd like to change: date, time, or venue?",
                messages,
                "Sure, what would you like to change? Date, time, or venue?",
            )
            return state

        if confirmation_action == "clarify":
            response = await _llm_converse(
                "The user gave an unclear answer while confirming a selected slot. Ask them to reply yes to hold it, no to cancel, or tell what to change. Keep it brief and natural.",
                messages,
                "Just to confirm, reply yes to hold this slot, no to cancel, or tell me what to change.",
            )
            lower_response = response.lower()
            if "yes" not in lower_response or "no" not in lower_response:
                response = response.rstrip() + "\nReply yes to hold it, no to cancel, or tell me what to change."
            state["response"] = response
            return state

        if intent == "greeting":
            state["response"] = _instant_greeting(last_msg)
            try:
                from utils.time import get_tomorrow_karachi
                tomorrow = get_tomorrow_karachi()
                for sport in ("padel", "futsal", "cricket", "pickleball"):
                    asyncio.create_task(
                        warm_common_availability(sport, None, tomorrow, buckets=["evening"])
                    )
            except Exception as e:
                logger.debug(f"Greeting warm-up skipped: {e}")
            return state

        # ── Slot-selection reset: user typed something unrecognised during slot pick ──
        if state.get("slot_selection_reset"):
            state["slot_selection_reset"] = False  # consume the flag
            if _is_urdu(last_msg):
                state["response"] = (
                    "Slot list reset ho gayi. Dobara batayein sport, date, time "
                    "(e.g. 'padel kal shaam')."
                )
            else:
                state["response"] = (
                    "Slot list expired. Please share the sport, date, and time again "
                    "(e.g. 'padel tomorrow evening')."
                )
            return state

        # ── Slot locked: reinforce the 10-minute payment deadline ──
        if booking_result and booking_result.get("success") and booking_result.get("status") == "locked":
            slot_id = booking_result.get("slot_id", "")
            amount = booking_result.get("amount", 0)
            mins = booking_result.get("hold_expires_in_minutes", 10)
            short_ref = _short_booking_ref(slot_id)
            state["response"] = (
                f"Slot reserved.\n"
                f"Amount: Rs {amount}\n"
                f"Ref: {short_ref}\n"
                f"\n"
                f"Please transfer Rs {amount} and send the payment screenshot here. "
                f"Slot will release in {mins} min if not received."
            )
            return state

        if state.get("awaiting_confirmation") and state.get("pending_booking"):
            pending = state["pending_booking"]
            slot = pending.get("slot", {})
            time_disp = f"{slot.get('slot_time', '')}-{slot.get('end_time', '')}"
            price = pending.get("price", 0)
            vendor = pending.get("vendor_name") or pending.get("service_type", "venue")
            if _is_urdu(last_msg):
                state["response"] = f"{time_disp} at {vendor}, Rs {price}. Confirm karein? (yes for 10 min hold, no to cancel)"
            else:
                state["response"] = f"{time_disp} at {vendor}, Rs {price}. Confirm? (reply yes to hold for 10 min, no to cancel)"
            state["awaiting_slot_selection"] = False
            return state

        slot_options = state.get("slot_options") or []
        if last_msg.strip().isdigit() and not slot_options:
            state["response"] = "Slot list expired. Please share the sport, date, and time again (e.g. 'padel tomorrow evening')."
            return state
        if last_msg.strip().isdigit() and slot_options:
            num = int(last_msg.strip())
            if num < 1 or num > len(slot_options):
                state["response"] = f"{num} isn't on the list. Please pick between 1 and {len(slot_options)}."
                return state

        # ── Mid-flow: user asks about price / cheapest while picking a slot ────
        # Preserve slot_options + awaiting_slot_selection so they can still pick after.
        if state.get("awaiting_slot_selection") and slot_options:
            if _is_slot_list_info_request(last_msg):
                cheapest = min(slot_options, key=lambda x: x.get("price", 999999))
                vendor_disp = cheapest.get("vendor_name", "")
                vendor_part = f" at {vendor_disp}" if vendor_disp else ""
                time_disp = f"{cheapest.get('slot_time', '')}-{cheapest.get('end_time', '')}"
                if _is_urdu(last_msg):
                    state["response"] = (
                        f"Sab se sasta Rs {cheapest['price']} hai{vendor_part} ({time_disp}). "
                        f"Kaunsa lena hai? (1-{len(slot_options)})"
                    )
                else:
                    state["response"] = (
                        f"Cheapest is Rs {cheapest['price']}{vendor_part} ({time_disp}). "
                        f"Which one would you like? (1-{len(slot_options)})"
                    )
                return state

        missing = state.get("missing_fields") or []

        # ── Missing sport ──────────────────────────────────────────────────────
        if "sport" in missing and intent == "inquiry":
            state["response"] = _instant_ask_sport(last_msg)
            return state

        # ── Missing date ───────────────────────────────────────────────────────
        if "date" in missing and intent == "inquiry":
            sport = entities.get("service_type") or state.get("selected_sport_type") or "sport"
            state["response"] = _instant_ask_date(sport, last_msg)
            return state

        # ── Missing time ───────────────────────────────────────────────────────
        if "time" in missing and intent == "inquiry":
            sport = entities.get("service_type") or state.get("selected_sport_type") or ""
            date = entities.get("date") or state.get("selected_date")
            if sport and date:
                try:
                    asyncio.create_task(
                        warm_common_availability(
                            sport,
                            entities.get("area") or state.get("selected_area"),
                            date,
                            vendor_name=entities.get("vendor_name") or entities.get("vendor"),
                            vendor_id=entities.get("vendor_id"),
                        )
                    )
                except Exception as e:
                    logger.debug(f"Time prompt warm-up skipped: {e}")
            state["response"] = _instant_ask_time(sport, last_msg)
            return state

        # ── no_date query_result ───────────────────────────────────────────────
        if query_result and query_result.get("error") == "no_date":
            sport = entities.get("service_type") or state.get("selected_sport_type") or "sport"
            state["response"] = _instant_ask_date(sport, last_msg)
            return state

        if query_result and query_result.get("error") == "no_sport":
            state["response"] = _instant_ask_sport(last_msg)
            return state

        if not booking_result and query_result and query_result.get("success") and query_result.get("vendors"):
            slots_text, slot_opts = _format_availability_response(query_result)
            if slots_text:
                state["response"] = slots_text
                state["slot_options"] = slot_opts
                state["awaiting_slot_selection"] = True
                state["selected_sport_type"] = query_result.get("sport_type", "padel")
                raw_area = query_result.get("area")
                state["selected_area"] = raw_area if raw_area and raw_area.lower() not in ("all", "karachi", "") else None
                return state

        if not booking_result and query_result and not query_result.get("success") and query_result.get("error") == "database_unavailable":
            state["response"] = "System is waking up. Please try again in 10 seconds."
            return state

        if intent != "info_request" and not booking_result and query_result and (query_result.get("success") or query_result.get("error") == "no_vendors") and not query_result.get("vendors"):
            sport = query_result.get("sport_type", "padel")
            date = query_result.get("date", "")
            area = query_result.get("area")
            area_msg = query_result.get("message", "")

            if area and "No vendors found" in (area_msg or ""):
                logger.info("Branch hit: NO_VENDORS (area filter)")
                supported = _SPORT_AREA_SUMMARY.get(sport, "a supported Karachi area")
                state["response"] = await _llm_converse(
                    f"No {sport} courts found in {area}. Let the user know and suggest only supported {sport} areas: {supported}. Do not suggest unsupported areas.",
                    messages,
                    f"No {sport} venues found in {area}. Want to try {supported}?",
                )
            else:
                _pkt = _pytz.timezone("Asia/Karachi")
                _now_pkt = _dt.now(_pkt)
                _today_str = _now_pkt.strftime("%Y-%m-%d")
                _is_today = (date == _today_str)
                _is_late_night = (_now_pkt.hour > 23)
                missing = state.get("missing_fields") or []
                next_date = query_result.get("next_available_date")

                if "date" in missing or not entities.get("date"):
                    logger.info("Branch hit: NO_SLOTS_NO_DATE_GIVEN")
                    if _is_today and _is_late_night:
                        logger.info("Branch hit: NO_SLOTS_LATE_NIGHT_TODAY")
                        state["response"] = await _llm_converse(
                            f"It's late at night and there are no more {sport} slots today. Suggest checking tomorrow's slots.",
                            messages,
                            f"No more {sport} slots tonight. Want me to check tomorrow?",
                        )
                    else:
                        state["response"] = await _llm_converse(
                            f"No {sport} slots found. The user hasn't specified a date. Ask what date they'd like.",
                            messages,
                            f"No slots found. What date did you want for {sport}?",
                        )
                else:
                    logger.info("Branch hit: NO_SLOTS_DATE_GIVEN")
                    if _is_today and _is_late_night and not next_date:
                        logger.info("Branch hit: NO_SLOTS_DATE_GIVEN_LATE_NIGHT")
                        from datetime import timedelta as _td
                        tomorrow = (_now_pkt + _td(days=1)).strftime("%Y-%m-%d")
                        state["response"] = await _llm_converse(
                            f"No {sport} slots available tonight. Suggest tomorrow ({tomorrow}) as an alternative.",
                            messages,
                            f"No {sport} slots left tonight. Want to check tomorrow?",
                        )
                    elif next_date:
                        state["response"] = await _llm_converse(
                            f"No {sport} slots on {date}, but {next_date} has availability. Ask if the user wants to check that date instead.",
                            messages,
                            f"Nothing on {date}, but {next_date} has slots. Want me to check that?",
                        )
                    else:
                        state["response"] = await _llm_converse(
                            f"No {sport} slots available on {date} in {area or 'Karachi'}. Suggest trying a different date or area.",
                            messages,
                            f"No {sport} slots on {date}. Try a different date or area?",
                        )
            return state

        context = {
            "query_result": query_result,
            "booking_result": booking_result,
            "awaiting_confirmation": awaiting,
            "confirmation_action": confirmation_action,
            "pending_booking": state.get("pending_booking"),
            "conversation_history": messages[:-1] if messages else [],
            "current_message": last_msg,
            "phone_number": state.get("user_phone", ""),
            "selected_slot": state.get("selected_slot"),
            "selected_date": state.get("selected_date"),
            "vendor_id": state.get("vendor_id"),
            "missing_fields": state.get("missing_fields")
        }
        
        logger.info(f"Generating response for intent: {intent}")
        response = await nlu_agent.generate_response(intent, entities, context)
        
        if not response or not response.strip():
            response = generate_fallback_response(state)
        
        state["response"] = response
        logger.info(f"Response generated ({len(response)} chars)")
        
        return state
        
    except Exception as e:
        logger.error(f"Response generation failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        
        messages = state.get("messages", [])
        last_msg = messages[-1].get("content", "") if messages else ""

        if _is_urdu(last_msg):
            state["response"] = "Sorry, error aaya. Dobara try karein?"
        else:
            state["response"] = "Sorry, I encountered an error. Please try again."
        
        return state


def _format_availability_response(
    query_result: Dict[str, Any],
) -> Tuple[Optional[str], List[Dict[str, Any]]]:
    vendors = query_result.get("vendors") or []
    if not vendors:
        return None, []
    date = query_result.get("date", "")
    requested_date = query_result.get("requested_date", date)
    sport = query_result.get("sport_type", "padel")
    area = query_result.get("area") or "Karachi"
    slot_options = []

    time_exact_unavailable = query_result.get("time_exact_unavailable", False)
    requested_time = query_result.get("requested_time")
    
    if requested_date and date != requested_date:
        header = f"No slots available on {requested_date}. Available {sport} slots for next available date ({date}) in {area}:\n"
    elif time_exact_unavailable and requested_time:
        header = f"That exact {sport} slot ({requested_time}) isn't available, but here's what's nearby on {date}:\n"
    else:
        header = f"Available {sport} slots for {date} in {area}:\n"

    parts = [header]
    display_entries = []

    def _slot_minutes(slot: Dict[str, Any]) -> int:
        raw = str(slot.get("slot_time") or slot.get("time") or "").strip()[:5]
        try:
            hour, minute = raw.split(":")
            return int(hour) * 60 + int(minute)
        except Exception:
            return 99999

    def _vendor_first_minutes(vendor: Dict[str, Any]) -> int:
        slots = vendor.get("slots") or []
        return min((_slot_minutes(slot) for slot in slots), default=99999)

    requested_minutes = _time_to_minutes(requested_time) if requested_time else None

    display_vendors = sorted(
        vendors,
        key=lambda v: (_vendor_first_minutes(v), str(v.get("vendor_name", "")).lower()),
    )[:3]

    for v in display_vendors:
        name = v.get("vendor_name", "Vendor")
        seen_times = set()
        for slot in sorted(v.get("slots", []), key=lambda s: (_slot_minutes(s), int(s.get("price", 0) or 0))):
            sid = slot.get("slot_id", "")
            stime = slot.get("slot_time", "")
            if not sid or stime in seen_times:
                continue
            seen_times.add(stime)
            time_disp = slot.get("time_display") or f"{stime}-{slot.get('end_time', '')}"
            price = slot.get("price", 0)
            display_entries.append({
                "sort_time": _slot_minutes(slot),
                "slot_id": sid,
                "slot_time": stime,
                "end_time": slot.get("end_time", ""),
                "price": price,
                "vendor_name": name,
                "time_display": time_disp,
            })

    if time_exact_unavailable and requested_minutes is not None:
        display_entries.sort(
            key=lambda item: (
                abs(item["sort_time"] - requested_minutes),
                item["sort_time"],
                int(item.get("price", 0) or 0),
                item["vendor_name"].lower(),
            )
        )
        display_entries = display_entries[:12]
    else:
        display_entries.sort(key=lambda item: (item["sort_time"], int(item.get("price", 0) or 0), item["vendor_name"].lower()))

    for idx, item in enumerate(display_entries, start=1):
        slot_options.append({
            "index": idx,
            "slot_id": item["slot_id"],
            "slot_time": item["slot_time"],
            "end_time": item["end_time"],
            "price": item["price"],
            "vendor_name": item["vendor_name"],
        })
        parts.append(f"   {idx}. {item['time_display']} | {item['vendor_name']} | Rs {item['price']}")

    parts.append("Which one? Reply with the number.")
    return "\n".join(parts).strip(), slot_options


def generate_fallback_response(state: AgentState) -> str:
    """Generate fallback response based on state"""
    booking_result = state.get("booking_result")
    
    if booking_result and booking_result.get("success"):
        booking_id = booking_result.get('booking_id', '')
        short_ref = _short_booking_ref(booking_id)
        return (
            f"Booking Confirmed\n"
            f"Booking ID: {short_ref}\n"
            f"\n"
            f"Thank you for booking with us. See you soon."
        )
    elif booking_result and not booking_result.get("success"):
        return f"Sorry, booking failed: {booking_result.get('error', 'Unknown error')}. Please try again."
    elif state.get("awaiting_confirmation"):
        return "Would you like to confirm this booking? Reply 'yes' to confirm or 'no' to cancel."
    else:
        return "What would you like to book? Padel, futsal, cricket, or pickleball?"


# =============================================================================
# ROUTING FUNCTIONS
# =============================================================================

_CONFIRM_WORDS = re.compile(
    r'\b(yes|ok|okay|confirm|book|done|sure|proceed|han|haan|ji|theek|bilkul)\b', re.IGNORECASE
)
_CANCEL_WORDS = re.compile(
    r'\b(?:nahi|nope|cancel|stop|ruko|mat)\b|\bno\b(?!\s*[\.\#]?\s*\d)', re.IGNORECASE
)
_MODIFY_WORDS = re.compile(
    r'\b(change|modify|actually|instead|different|wait)\b', re.IGNORECASE
)
_SLOT_NUMBER = re.compile(r'^\s*(\d{1,2})\s*$')
_SLOT_NUMBER_PLUS = re.compile(r'^\s*(\d{1,2})\s*[,.]?\s*(yes|ok|confirm|book|han|haan|ji|done|sure)?\s*$', re.IGNORECASE)


def _detect_tx_input(msg: str) -> Optional[str]:
    """Detect transactional input type from raw message text.
    Returns: 'slot_select', 'confirm', 'cancel', 'modify', or None."""
    msg = msg.strip()
    if _extract_slot_selection_number(msg) is not None:
        return "slot_select"
    if _SLOT_NUMBER.match(msg):
        return "slot_select"
    if _SLOT_NUMBER_PLUS.match(msg):
        return "slot_select"
    if _CANCEL_WORDS.search(msg):
        return "cancel"
    if _MODIFY_WORDS.search(msg):
        return "modify"
    if _CONFIRM_WORDS.search(msg) and len(msg.split()) <= 4:
        return "confirm"
    return None


def route_by_intent(state: AgentState) -> str:
    intent = state.get("current_intent", "")
    awaiting = state.get("awaiting_confirmation", False)
    awaiting_slot_sel = state.get("awaiting_slot_selection", False)
    entities = state.get("entities", {})
    selected_slot = state.get("selected_slot") or {}
    has_slot_id = bool(selected_slot.get("slot_id"))
    has_time = bool(entities.get("time_range"))  # only a clean normalized range counts
    has_vendor = bool(entities.get("vendor_id") or entities.get("vendor_name") or state.get("vendor_id"))
    has_date = bool(entities.get("date") or state.get("selected_date"))
    messages = state.get("messages", [])
    last_msg = (messages[-1].get("content", "") if messages else "").strip()

    tx_type = _detect_tx_input(last_msg)

    if state.get("policy_error"):
        return "generate_response"

    if awaiting_slot_sel and has_slot_id:
        return "query_availability"

    if awaiting_slot_sel and tx_type == "slot_select":
        selected_num = _extract_slot_selection_number(last_msg.strip())
        if selected_num is not None:
            state["messages"][-1]["content"] = str(selected_num)
        return "query_availability"

    if awaiting_slot_sel and tx_type in ("confirm", "cancel", "modify"):
        logger.info(f"Transactional input '{tx_type}' during slot selection - routing to confirmation")
        state["awaiting_slot_selection"] = False
        return "check_confirmation"

    if awaiting_slot_sel and tx_type is None:
        if _is_slot_list_info_request(last_msg):
            return "generate_response"

        # Auto-map if user typed a time matching a slot instead of the list number
        extracted_start = entities.get("time_range", {}).get("start")
        slot_opts = state.get("slot_options") or []
        if extracted_start and slot_opts:
            matching_opts = [opt for opt in slot_opts if opt.get("slot_time") == extracted_start]
            
            # If multiple slots match the time, but the user also specified the vendor, filter by vendor
            ent_vendor = entities.get("vendor_name") or entities.get("vendor_id")
            if ent_vendor and len(matching_opts) > 1:
                ent_vendor_lower = ent_vendor.lower()
                vendor_matched = [
                    opt for opt in matching_opts 
                    if ent_vendor_lower in opt.get("vendor_name", "").lower() 
                    or ent_vendor_lower in opt.get("vendor_id", "").lower()
                ]
                if len(vendor_matched) == 1:
                    matching_opts = vendor_matched

            if len(matching_opts) == 1:
                opt = matching_opts[0]
                state["messages"][-1]["content"] = str(opt["index"])
                state["selected_slot"] = {
                    "slot_id": opt.get("slot_id", ""),
                    "slot_time": opt.get("slot_time", ""),
                    "end_time": opt.get("end_time", ""),
                }
                state["booking_in_progress"] = True
                logger.info(f"User typed time '{extracted_start}', auto-mapped to option {opt['index']}")
                return "query_availability"

        has_new_booking_entities = any([
            entities.get("service_type"),
            entities.get("date"),
            entities.get("time"),
            entities.get("vendor_name"),
        ])
        if has_new_booking_entities:
            state["awaiting_slot_selection"] = False
            state["slot_options"] = []
            state["selected_slot"] = None
            # Clear stale date/sport so the new inquiry starts clean.
            # The old date was valid for the previous slot list, not this new query.
            state["selected_date"] = None
            state["selected_sport_type"] = None
            state["selected_time_range"] = None
            logger.info("New booking entities during slot selection - cleared stale date/sport, starting fresh query")
        else:
            # Unrecognised free-text during slot selection.
            # Clear the list AND set a flag so generate_response_node can
            # give the user a helpful re-prompt instead of a confusing LLM reply.
            state["awaiting_slot_selection"] = False
            state["slot_options"] = []
            state["selected_slot"] = None
            state["slot_selection_reset"] = True
            logger.info("Unrecognized input during slot selection - clearing slot state, will prompt user")

    if awaiting and tx_type in ("confirm", "cancel", "modify", "slot_select"):
        return "check_confirmation"

    if awaiting and intent in ["transaction", "unknown"]:
        return "check_confirmation"

    if awaiting and intent == "inquiry":
        has_new_booking_entities = any([
            entities.get("service_type"),
            entities.get("date"),
            entities.get("time"),
            entities.get("vendor_name"),
        ])
        if has_new_booking_entities:
            state["awaiting_confirmation"] = False
            state["pending_booking"] = None
            state["selected_slot"] = None
            logger.info("New inquiry with booking entities while awaiting confirmation - starting fresh")
        else:
            return "check_confirmation"

    if has_slot_id:
        return "query_availability"

    # Respect the missing_fields verdict from validate_state_node.
    # If date is missing → ask the user for a date (generate_response).
    # If date is present but time is missing → ask for time (generate_response).
    # Only fire query_availability when both are present (or time is optional
    # because the user wants to see all slots for a given date).
    missing = state.get("missing_fields") or []

    if intent == "inquiry" and "sport" in missing:
        return "generate_response"   # will ask user for sport

    if intent == "inquiry" and "date" in missing:
        return "generate_response"   # will ask user for a date

    if intent == "inquiry" and has_date and not has_time:
        return "generate_response"   # will ask user for a time

    if intent == "inquiry":
        return "query_availability"  # date (and optionally time) are known — safe to query
    if intent == "transaction" and (has_time or has_vendor):
        return "query_availability"
    if intent == "transaction":
        return "check_confirmation"
    if intent == "info_request":
        return "query_info"
    if intent == "greeting":
        return "generate_response"
    return "generate_response"


def route_after_availability(state: AgentState) -> str:
    return "generate_response"


def route_after_confirmation(state: AgentState) -> str:
    """Route based on confirmation result"""
    action = state.get("confirmation_action", "")
    
    if action == "proceed":
        return "execute_booking"
    else:
        return "generate_response"
