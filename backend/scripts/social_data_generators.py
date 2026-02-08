"""
Social Data Generators
Helper functions for generating realistic social content
"""
import random
from datetime import datetime, timedelta
from typing import List, Dict

# Sports options
SPORTS = ['padel', 'futsal', 'cricket', 'basketball', 'tennis', 'badminton']

# Post content templates
POST_TEMPLATES = {
    'general': [
        "Just finished an amazing {} session! 🏆",
        "Great game today! Looking forward to the next match 💪",
        "Anyone up for {} this weekend?",
        "The weather is perfect for {} today! ☀️",
        "Best {} game I've had in months!",
    ],
    'looking_for_players': [
        "Looking for 2 more players for {} tomorrow at 6 PM. Who's in?",
        "Need one more player for {} match. Anyone available?",
        "Organizing a {} game this Saturday. Join us!",
        "Who wants to play {} this evening? DM me!",
    ],
    'tip': [
        "Pro tip: Always warm up properly before {} to avoid injuries",
        "Here's a great {} technique I learned: [detailed tip]",
        "Want to improve your {} game? Try this drill...",
        "Best {} strategy: Focus on positioning and teamwork",
    ],
    'question': [
        "What's the best {} venue in the city?",
        "How do you improve your {} serve?",
        "Anyone know good {} coaches in the area?",
        "Best equipment for {}? Looking for recommendations",
    ],
}

# Comment templates
COMMENT_TEMPLATES = [
    "Great post! 👍",
    "I'm definitely interested!",
    "Count me in! When and where?",
    "This is so true! Had the same experience",
    "Thanks for sharing! Very helpful",
    "I'd love to join!",
    "Awesome! Let's do this 🔥",
    "Totally agree with this",
    "Can you share more details?",
    "This is exactly what I needed to hear",
]

# Chat message templates
CHAT_TEMPLATES = [
    "Hey! How are you?",
    "Are you free for a game tomorrow?",
    "Thanks for the match today!",
    "What time works best for you?",
    "Sure, I'm in!",
    "Let me check and get back to you",
    "Sounds good! See you there",
    "Do you have the venue details?",
    "I'll bring the equipment",
    "Can we reschedule to next week?",
]

# User data
SAMPLE_USERS = [
    {"name": "Ahmad Hassan", "sport": "padel", "level": "intermediate"},
    {"name": "Fatima Ali", "sport": "badminton", "level": "advanced"},
    {"name": "Zain Malik", "sport": "futsal", "level": "beginner"},
    {"name": "Sara Khan", "sport": "tennis", "level": "intermediate"},
    {"name": "Omar Abdullah", "sport": "cricket", "level": "advanced"},
    {"name": "Amina Sheikh", "sport": "basketball", "level": "intermediate"},
    {"name": "Bilal Raza", "sport": "padel", "level": "advanced"},
    {"name": "Noor Syed", "sport": "futsal", "level": "intermediate"},
    {"name": "Hamza Iqbal", "sport": "cricket", "level": "beginner"},
    {"name": "Layla Ahmed", "sport": "tennis", "level": "advanced"},
    {"name": "Tariq Hussain", "sport": "basketball", "level": "intermediate"},
    {"name": "Maryam Jamil", "sport": "badminton", "level": "advanced"},
    {"name": "Asad Malik", "sport": "padel", "level": "beginner"},
    {"name": "Hina Rasheed", "sport": "futsal", "level": "intermediate"},
    {"name": "Nasir Khan", "sport": "cricket", "level": "advanced"},
]

def generate_post_content(post_type: str, sport: str = None) -> str:
    """Generate realistic post content"""
    if sport is None:
        sport = random.choice(SPORTS)
    
    template = random.choice(POST_TEMPLATES.get(post_type, POST_TEMPLATES['general']))
    return template.format(sport)

def generate_comment() -> str:
    """Generate a random comment"""
    return random.choice(COMMENT_TEMPLATES)

def generate_chat_message() -> str:
    """Generate a random chat message"""
    return random.choice(CHAT_TEMPLATES)

def random_datetime_in_past(days: int = 30) -> datetime:
    """Generate a random datetime within the past N days"""
    now = datetime.now()
    random_days = random.randint(0, days)
    random_hours = random.randint(0, 23)
    random_minutes = random.randint(0, 59)
    return now - timedelta(days=random_days, hours=random_hours, minutes=random_minutes)

def random_future_datetime(days: int = 14) -> datetime:
    """Generate a random datetime within the next N days"""
    now = datetime.now()
    random_days = random.randint(1, days)
    random_hours = random.randint(0, 23)
    random_minutes = random.randint(0, 59)
    return now + timedelta(days=random_days, hours=random_hours, minutes=random_minutes)

def distribute_likes(num_posts: int, num_users: int, total_likes: int) -> Dict[int, List[int]]:
    """
    Distribute likes across posts realistically
    - Some posts very popular (many likes)
    - Some posts moderate
    - Some posts few/no likes
    """
    likes_distribution = {}
    
    # Create realistic distribution: 20% get most likes, 50% get moderate, 30% get few/none
    popular_posts = random.sample(range(num_posts), k=int(num_posts * 0.2))
    moderate_posts = random.sample([i for i in range(num_posts) if i not in popular_posts], 
                                    k=int(num_posts * 0.5))
    
    remaining_likes = total_likes
    
    # Distribute likes to popular posts (40-60% of total)
    for post_idx in popular_posts:
        num_likes = random.randint(10, min(20, num_users))
        likes_distribution[post_idx] = random.sample(range(num_users), k=min(num_likes, remaining_likes // len(popular_posts)))
        remaining_likes -= len(likes_distribution[post_idx])
    
    # Distribute to moderate posts
    for post_idx in moderate_posts:
        num_likes = random.randint(2, 8)
        likes_distribution[post_idx] = random.sample(range(num_users), k=min(num_likes, max(1, remaining_likes // len(moderate_posts))))
        remaining_likes -= len(likes_distribution[post_idx])
    
    # Rest get few or no likes
    for i in range(num_posts):
        if i not in likes_distribution:
            if random.random() < 0.5 and remaining_likes > 0:
                likes_distribution[i] = [random.randint(0, num_users - 1)]
                remaining_likes -= 1
            else:
                likes_distribution[i] = []
    
    return likes_distribution
