from datetime import datetime, timedelta
import pytz

KARACHI_TZ = pytz.timezone('Asia/Karachi')

def get_now_karachi():
    """Returns current datetime in Karachi timezone."""
    return datetime.now(KARACHI_TZ)

def get_today_karachi():
    """Returns today's date string (YYYY-MM-DD) in Karachi timezone."""
    return get_now_karachi().strftime('%Y-%m-%d')

def get_tomorrow_karachi():
    """Returns tomorrow's date string (YYYY-MM-DD) in Karachi timezone."""
    return (get_now_karachi() + timedelta(days=1)).strftime('%Y-%m-%d')

def get_parson_karachi():
    """Returns day after tomorrow's date string (YYYY-MM-DD) in Karachi timezone."""
    return (get_now_karachi() + timedelta(days=2)).strftime('%Y-%m-%d')

def resolve_date_token(token):
    """Resolves relative date tokens to YYYY-MM-DD strings in Karachi time."""
    token = token.lower()
    if token in ['today', 'aaj', 'tonight']:
        return get_today_karachi()
    elif token in ['tomorrow', 'kal']:
        return get_tomorrow_karachi()
    elif token in ['parson', 'day after tomorrow']:
        return get_parson_karachi()
    return None
