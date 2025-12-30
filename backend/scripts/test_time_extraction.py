"""
Test time extraction from conversation history
"""
import re

# Simulate the agent's response
agent_response = "Hi Salman Khan! You're looking to book a Padel court at Golden Court, DHA for December 14, 2025, at 9:00 AM. Good news! We do have slots available at 9:00 AM for Rs 1800/hour. Would you like me to go ahead and confirm this booking for you?"

print("Testing time extraction:")
print(f"Message: {agent_response[:100]}...\n")

# Test the regex pattern
time_pattern = r'(\d{1,2}):(\d{2})\s*(am|pm)'
time_match = re.search(time_pattern, agent_response, re.IGNORECASE)

if time_match:
    print(f"Match found!")
    print(f"  Group 1 (hour): {time_match.group(1)}")
    print(f"  Group 2 (minute): {time_match.group(2)}")
    print(f"  Group 3 (period): {time_match.group(3)}")
    
    hour = int(time_match.group(1))
    minute = int(time_match.group(2))
    period = time_match.group(3).lower()
    
    print(f"\nBefore conversion: {hour}:{minute:02d} {period}")
    
    if period == 'pm' and hour < 12:
        hour += 12
    elif period == 'am' and hour == 12:
        hour = 0
    
    slot_time = f"{hour:02d}:{minute:02d}"
    print(f"After conversion: {slot_time}")
else:
    print("No match found!")



