"""
Check Groq API Usage Statistics
Shows daily token consumption and API call counts
"""

import sys
import os
from pathlib import Path

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nlu.usage_tracker import UsageTracker

def format_number(num: int) -> str:
    """Format number with commas"""
    return f"{num:,}"

def print_usage_report(limit: int = 1000):
    """Print detailed usage report"""
    tracker = UsageTracker()
    summary = tracker.get_usage_summary(limit)
    today_usage = tracker.get_today_usage()
    
    print("=" * 70)
    print("GROQ API USAGE REPORT")
    print("=" * 70)
    print()
    
    print(f"Date: {summary['date']}")
    print(f"Model: qwen/qwen3-32b")
    print()
    
    print("Daily Statistics:")
    print("-" * 70)
    print(f"  API Calls:        {format_number(summary['calls'])}")
    print(f"  Total Tokens:     {format_number(summary['total_tokens'])}")
    print(f"  Prompt Tokens:    {format_number(summary['prompt_tokens'])}")
    print(f"  Completion Tokens: {format_number(summary['completion_tokens'])}")
    print()
    
    print("Limit Information:")
    print("-" * 70)
    print(f"  Daily Limit:      {format_number(limit)} tokens")
    print(f"  Tokens Used:      {format_number(summary['total_tokens'])} tokens")
    print(f"  Tokens Remaining: {format_number(summary['remaining_tokens'])} tokens")
    print(f"  Usage:            {summary['percentage_used']:.1f}%")
    print()
    
    if summary['status'] == 'LIMIT_EXCEEDED':
        print("WARNING: Daily token limit exceeded!")
        print()
    elif summary['percentage_used'] > 80:
        print("WARNING: Approaching daily limit (80%+ used)")
        print()
    elif summary['percentage_used'] > 50:
        print("INFO: Over 50% of daily limit used")
        print()
    
    # Show recent calls if available
    if today_usage.get('calls_history'):
        recent_calls = today_usage['calls_history'][-10:]  # Last 10 calls
        print("Recent API Calls (Last 10):")
        print("-" * 70)
        for i, call in enumerate(recent_calls, 1):
            timestamp = call['timestamp'].split('T')[1].split('.')[0]  # Just time
            print(f"  {i}. {timestamp} - {call['total_tokens']} tokens "
                  f"(prompt: {call['prompt_tokens']}, completion: {call['completion_tokens']})")
        print()
    
    # Calculate average tokens per call
    if summary['calls'] > 0:
        avg_tokens = summary['total_tokens'] / summary['calls']
        print("Efficiency Metrics:")
        print("-" * 70)
        print(f"  Avg Tokens/Call:  {avg_tokens:.0f} tokens")
        print(f"  Estimated Calls Remaining: {int(summary['remaining_tokens'] / avg_tokens) if avg_tokens > 0 else 0}")
        print()
    
    print("=" * 70)
    
    return summary

def main():
    """Main function"""
    # Default limit - user can override via environment variable
    limit = int(os.environ.get('GROQ_DAILY_LIMIT', 1000))
    
    try:
        summary = print_usage_report(limit)
        
        # Exit with error code if limit exceeded
        if summary['status'] == 'LIMIT_EXCEEDED':
            sys.exit(1)
        elif summary['percentage_used'] > 90:
            sys.exit(2)  # Warning exit code
        
    except Exception as e:
        print(f"Error generating usage report: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
