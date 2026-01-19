"""
Groq Usage Optimization Analysis
Analyzes usage patterns and suggests optimizations
"""

import sys
import os
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nlu.usage_tracker import UsageTracker

def analyze_usage():
    """Analyze usage and provide optimization suggestions"""
    tracker = UsageTracker()
    today_usage = tracker.get_today_usage()
    summary = tracker.get_usage_summary(1000)
    
    print("=" * 70)
    print("GROQ USAGE OPTIMIZATION ANALYSIS")
    print("=" * 70)
    print()
    
    if summary['calls'] == 0:
        print("No API calls recorded yet today.")
        print("Tracking will start automatically on next API call.")
        print()
        return
    
    # Calculate metrics
    avg_tokens_per_call = summary['total_tokens'] / summary['calls'] if summary['calls'] > 0 else 0
    avg_prompt_tokens = summary['prompt_tokens'] / summary['calls'] if summary['calls'] > 0 else 0
    avg_completion_tokens = summary['completion_tokens'] / summary['calls'] if summary['calls'] > 0 else 0
    
    print("Current Usage Metrics:")
    print("-" * 70)
    print(f"  Total Calls:           {summary['calls']}")
    print(f"  Total Tokens:          {summary['total_tokens']:,}")
    print(f"  Avg Tokens/Call:       {avg_tokens_per_call:.0f}")
    print(f"  Avg Prompt Tokens:     {avg_prompt_tokens:.0f}")
    print(f"  Avg Completion Tokens: {avg_completion_tokens:.0f}")
    print()
    
    # Optimization suggestions
    suggestions = []
    
    if avg_tokens_per_call > 2000:
        suggestions.append({
            "issue": "High token usage per call",
            "severity": "HIGH",
            "suggestion": "Consider shortening prompts or using more specific queries"
        })
    
    if avg_prompt_tokens > 1500:
        suggestions.append({
            "issue": "Large prompt sizes",
            "severity": "MEDIUM",
            "suggestion": "Review prompt length - consider removing unnecessary context or examples"
        })
    
    if summary['percentage_used'] > 80:
        suggestions.append({
            "issue": "Approaching daily limit",
            "severity": "HIGH",
            "suggestion": "Consider caching responses or reducing API calls"
        })
    
    if summary['calls'] > 50:
        suggestions.append({
            "issue": "High number of API calls",
            "severity": "MEDIUM",
            "suggestion": "Consider implementing response caching for common queries"
        })
    
    # Check for duplicate patterns in recent calls
    if today_usage.get('calls_history'):
        recent_calls = today_usage['calls_history'][-20:]
        similar_calls = {}
        for call in recent_calls:
            token_range = f"{call['total_tokens'] // 100 * 100}-{(call['total_tokens'] // 100 + 1) * 100}"
            similar_calls[token_range] = similar_calls.get(token_range, 0) + 1
        
        if len(similar_calls) < 3 and summary['calls'] > 10:
            suggestions.append({
                "issue": "Repetitive call patterns detected",
                "severity": "LOW",
                "suggestion": "Consider implementing caching for repeated queries"
            })
    
    if suggestions:
        print("Optimization Suggestions:")
        print("-" * 70)
        for i, suggestion in enumerate(suggestions, 1):
            severity_icon = "!" if suggestion['severity'] == 'HIGH' else "-"
            print(f"  {i}. [{suggestion['severity']}] {suggestion['issue']}")
            print(f"     {suggestion['suggestion']}")
            print()
    else:
        print("Usage looks optimized!")
        print("No immediate optimization suggestions.")
        print()
    
    # Projection
    if summary['calls'] > 0:
        estimated_calls_remaining = int(summary['remaining_tokens'] / avg_tokens_per_call) if avg_tokens_per_call > 0 else 0
        print("Projections:")
        print("-" * 70)
        print(f"  Estimated calls remaining today: {estimated_calls_remaining}")
        print(f"  At current rate, limit will be reached after ~{summary['calls'] + estimated_calls_remaining} total calls")
        print()
    
    print("=" * 70)
    print()
    print("To check your Groq dashboard:")
    print("  Visit: https://console.groq.com/")
    print("  Go to Dashboard > Metrics")
    print("  View real-time usage and rate limits")
    print()

if __name__ == "__main__":
    analyze_usage()
