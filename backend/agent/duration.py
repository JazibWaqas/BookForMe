"""
Duration parsing and calculation utilities
"""

import re
from typing import Dict, Optional


def parse_duration(duration_text: str) -> Optional[Dict[str, float]]:
    """
    Parse duration from text (e.g., "30 mins", "1 hour", "1.5 hrs", "2 hours")
    
    Returns:
        Dict with "hours" and "minutes" keys, or None if can't parse
    """
    if not duration_text:
        return None
    
    duration_lower = duration_text.lower().strip()
    
    # Remove common words
    duration_lower = duration_lower.replace("for", "").replace("about", "").strip()
    
    # Pattern for "X hour(s)" or "X hr(s)"
    hour_pattern = r"(\d+(?:\.\d+)?)\s*(?:hour|hr|hours|hrs)"
    hour_match = re.search(hour_pattern, duration_lower)
    
    # Pattern for "X minute(s)" or "X min(s)"
    minute_pattern = r"(\d+)\s*(?:minute|min|minutes|mins)"
    minute_match = re.search(minute_pattern, duration_lower)
    
    # Pattern for "X.5 hour" or "X and a half"
    half_pattern = r"(\d+)\s*(?:and\s+)?half"
    half_match = re.search(half_pattern, duration_lower)
    
    total_hours = 0.0
    total_minutes = 0.0
    
    if hour_match:
        total_hours = float(hour_match.group(1))
    
    if minute_match:
        total_minutes = float(minute_match.group(1))
    
    if half_match:
        hours = float(half_match.group(1))
        total_hours = hours + 0.5
    
    # Handle just numbers (assume hours)
    if not hour_match and not minute_match and not half_match:
        number_match = re.search(r"(\d+(?:\.\d+)?)", duration_lower)
        if number_match:
            value = float(number_match.group(1))
            # If less than 3, likely hours. Otherwise might be minutes
            if value < 3:
                total_hours = value
            else:
                # Could be minutes (30, 45, 60, etc.)
                if value <= 120:
                    total_minutes = value
                    total_hours = value / 60.0
    
    # Convert minutes to hours
    if total_minutes > 0:
        total_hours += total_minutes / 60.0
    
    if total_hours > 0:
        return {
            "hours": total_hours,
            "minutes": total_hours * 60
        }
    
    return None


def calculate_price_for_duration(price_per_hour: float, duration_hours: float, discount_percent: float = 20) -> Dict[str, float]:
    """
    Calculate price for a given duration
    
    Args:
        price_per_hour: Base price per hour
        duration_hours: Duration in hours (can be 0.5, 1, 1.5, 2, etc.)
        discount_percent: Discount percentage (default 20%)
    
    Returns:
        Dict with base_price and discounted_price
    """
    base_price = price_per_hour * duration_hours
    discounted_price = base_price * (1 - discount_percent / 100)
    
    return {
        "base_price": round(base_price, 2),
        "discounted_price": round(discounted_price, 2),
        "duration_hours": duration_hours,
        "duration_minutes": duration_hours * 60
    }


def format_duration(hours: float) -> str:
    """
    Format duration for display (e.g., "1 hour", "1.5 hours", "30 mins")
    """
    if hours < 1:
        minutes = int(hours * 60)
        return f"{minutes} mins"
    elif hours == 1:
        return "1 hour"
    elif hours == int(hours):
        return f"{int(hours)} hours"
    else:
        # Handle 1.5, 2.5, etc.
        whole_hours = int(hours)
        minutes = int((hours - whole_hours) * 60)
        if minutes == 30:
            return f"{whole_hours} and a half hours" if whole_hours > 0 else "30 mins"
        elif minutes == 0:
            return f"{whole_hours} hours"
        else:
            return f"{hours} hours"

