"""
Helper utilities for the BookForMe backend
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import re


def format_phone_number(phone: str) -> str:
    """
    Format phone number for WhatsApp
    
    Args:
        phone: Raw phone number
        
    Returns:
        Formatted phone number with country code
    """
    # Remove any non-digit characters
    digits = ''.join(filter(str.isdigit, phone))
    
    # Add country code if missing (assume Pakistan +92)
    if not digits.startswith('92') and len(digits) == 10:
        digits = '92' + digits
    elif not digits.startswith('92') and len(digits) == 11 and digits.startswith('0'):
        digits = '92' + digits[1:]
    
    return f"+{digits}"


def parse_date_string(date_str: str) -> str:
    """
    Parse date string to YYYY-MM-DD format
    
    Args:
        date_str: Date string (tomorrow, next Friday, 15th January, etc.)
        
    Returns:
        Date in YYYY-MM-DD format
    """
    date_str = date_str.strip().lower()
    
    # Handle relative dates
    if 'tomorrow' in date_str:
        tomorrow = datetime.now() + timedelta(days=1)
        return tomorrow.strftime('%Y-%m-%d')
    elif 'today' in date_str:
        return datetime.now().strftime('%Y-%m-%d')
    elif 'day after tomorrow' in date_str:
        day_after = datetime.now() + timedelta(days=2)
        return day_after.strftime('%Y-%m-%d')
    
    # Handle specific dates (basic parsing)
    # This is a simplified version - you might want to use a more robust date parser
    try:
        # Try to parse as YYYY-MM-DD
        datetime.strptime(date_str, '%Y-%m-%d')
        return date_str
    except ValueError:
        pass
    
    # Default to today if parsing fails
    return datetime.now().strftime('%Y-%m-%d')


def parse_time_string(time_str: str) -> str:
    """
    Parse time string to HH:MM format
    
    Args:
        time_str: Time string (5pm, 2:30pm, evening, etc.)
        
    Returns:
        Time in HH:MM format
    """
    time_str = time_str.strip().lower()
    
    # Handle common time expressions
    if 'morning' in time_str:
        return '09:00'
    elif 'afternoon' in time_str:
        return '14:00'
    elif 'evening' in time_str:
        return '18:00'
    elif 'night' in time_str:
        return '20:00'
    
    # Handle 12-hour format (5pm, 2:30pm)
    if 'pm' in time_str or 'am' in time_str:
        try:
            time_obj = datetime.strptime(time_str, '%I:%M %p')
            return time_obj.strftime('%H:%M')
        except ValueError:
            pass
    
    # Handle 24-hour format (14:30)
    try:
        time_obj = datetime.strptime(time_str, '%H:%M')
        return time_obj.strftime('%H:%M')
    except ValueError:
        pass
    
    # Default to current time if parsing fails
    return datetime.now().strftime('%H:%M')


def format_booking_confirmation(booking_data: Dict[str, Any]) -> str:
    """
    Format booking confirmation message
    
    Args:
        booking_data: Booking information
        
    Returns:
        Formatted confirmation message
    """
    return f"""
🎉 *Booking Confirmed!*

Booking ID: {booking_data.get('booking_id', 'N/A')}
Service: {booking_data.get('service', 'N/A')}
Date: {booking_data.get('date', 'N/A')}
Time: {booking_data.get('time', 'N/A')}
Customer: {booking_data.get('customer_name', 'N/A')}

Thank you for using BookForMe! 

For any queries, contact us at +92-XXX-XXXXXXX
    """.strip()


def format_availability_message(available_slots: list) -> str:
    """
    Format availability message
    
    Args:
        available_slots: List of available slots
        
    Returns:
        Formatted availability message
    """
    if not available_slots:
        return "Sorry, no slots are available for the selected date. Please try another date."
    
    message = "📅 *Available Time Slots:*\n\n"
    for i, slot in enumerate(available_slots[:5], 1):  # Show max 5 slots
        message += f"{i}. {slot.get('time', 'N/A')} - Rs. {slot.get('price', 'N/A')}\n"
    
    message += "\nPlease select a time by typing the number or time."
    return message


def is_valid_phone_number(phone: str) -> bool:
    """
    Check if phone number is valid
    
    Args:
        phone: Phone number to validate
        
    Returns:
        True if valid, False otherwise
    """
    # Remove non-digit characters
    digits = ''.join(filter(str.isdigit, phone))
    
    # Check if it's a reasonable length (10-15 digits)
    return 10 <= len(digits) <= 15


def extract_customer_name(message: str) -> Optional[str]:
    """
    Extract customer name from message
    
    Args:
        message: User message
        
    Returns:
        Extracted name or None
    """
    # Look for patterns like "my name is Ahmed", "I am Ahmed", "this is Ahmed"
    patterns = [
        r"my name is (\w+)",
        r"i am (\w+)",
        r"this is (\w+)",
        r"i'm (\w+)",
        r"name is (\w+)"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, message.lower())
        if match:
            return match.group(1).title()
    
    return None
