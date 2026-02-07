"""
In-Memory Caching Layer with TTL Support
Provides fast caching for sessions, data, and function results
"""
from typing import Any, Optional, Callable
from datetime import datetime, timedelta
import threading
import functools

class InMemoryCache:
    """Thread-safe in-memory cache with TTL support"""
    
    def __init__(self):
        self._cache = {}
        self._lock = threading.Lock()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        with self._lock:
            if key in self._cache:
                value, expiry = self._cache[key]
                if expiry is None or datetime.now() < expiry:
                    return value
                else:
                    # Expired, remove it
                    del self._cache[key]
            return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Set value in cache with TTL"""
        with self._lock:
            expiry = datetime.now() + timedelta(seconds=ttl_seconds) if ttl_seconds else None
            self._cache[key] = (value, expiry)
    
    def delete(self, key: str):
        """Delete key from cache"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
    
    def clear(self):
        """Clear all cache"""
        with self._lock:
            self._cache.clear()
    
    def exists(self, key: str) -> bool:
        """Check if key exists and is not expired"""
        return self.get(key) is not None

# Global cache instance
cache = InMemoryCache()

def cached(ttl_seconds: int = 300, key_prefix: str = ""):
    """
    Decorator to cache function results
    
    Usage:
        @cached(ttl_seconds=600, key_prefix="user")
        def get_user(user_id):
            return expensive_operation(user_id)
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Call function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl_seconds)
            return result
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl_seconds)
            return result
        
        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

# Specialized cache helpers
class SessionCache:
    """Helper for caching user sessions"""
    
    @staticmethod
    async def get_user(user_id: str) -> Optional[dict]:
        """Get cached user session"""
        return cache.get(f"session:user:{user_id}")
    
    @staticmethod
    async def set_user(user_id: str, user_data: dict, ttl: int = 3600):
        """Cache user session (default 1 hour)"""
        cache.set(f"session:user:{user_id}", user_data, ttl)
    
    @staticmethod
    async def delete_user(user_id: str):
        """Delete user session from cache"""
        cache.delete(f"session:user:{user_id}")

class DataCache:
    """Helper for caching frequently accessed data"""
    
    @staticmethod
    async def get_vendors(sport_filter: Optional[str] = None) -> Optional[dict]:
        """Get cached vendors list"""
        key = f"vendors:{sport_filter or 'all'}"
        return cache.get(key)
    
    @staticmethod
    async def set_vendors(vendors_data: dict, sport_filter: Optional[str] = None, ttl: int = 300):
        """Cache vendors list (default 5 minutes)"""
        key = f"vendors:{sport_filter or 'all'}"
        cache.set(key, vendors_data, ttl)
    
    @staticmethod
    async def get_categories() -> Optional[list]:
        """Get cached categories"""
        return cache.get("categories:all")
    
    @staticmethod
    async def set_categories(categories_data: list, ttl: int = 600):
        """Cache categories (default 10 minutes)"""
        cache.set("categories:all", categories_data, ttl)
    
    @staticmethod
    def clear_all():
        """Clear all data cache"""
        cache.clear()
