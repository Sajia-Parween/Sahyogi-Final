"""
TTL-based in-memory cache for CSV loads and computed results.
Eliminates redundant disk I/O on repeated requests.
"""
import time
from typing import Any, Optional, Callable
from functools import wraps

_cache: dict[str, dict] = {}

DEFAULT_CSV_TTL = 300       # 5 minutes for CSV data
DEFAULT_RESULT_TTL = 120    # 2 minutes for computed results


def get_cached(key: str) -> Optional[Any]:
    """Get a value from cache if it exists and hasn't expired."""
    entry = _cache.get(key)
    if entry is None:
        return None
    if time.time() > entry["expires_at"]:
        del _cache[key]
        return None
    return entry["value"]


def set_cached(key: str, value: Any, ttl: int = DEFAULT_RESULT_TTL) -> None:
    """Store a value in cache with TTL."""
    _cache[key] = {
        "value": value,
        "expires_at": time.time() + ttl
    }


def cached(ttl: int = DEFAULT_RESULT_TTL, key_prefix: str = ""):
    """Decorator for caching function results based on arguments."""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Build cache key from prefix + function name + args
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(sorted(kwargs.items()))}"
            result = get_cached(cache_key)
            if result is not None:
                return result
            result = func(*args, **kwargs)
            set_cached(cache_key, result, ttl)
            return result
        return wrapper
    return decorator


def invalidate_prefix(prefix: str) -> int:
    """Invalidate all cache entries matching a prefix. Returns count cleared."""
    keys_to_delete = [k for k in _cache if k.startswith(prefix)]
    for k in keys_to_delete:
        del _cache[k]
    return len(keys_to_delete)


def clear_cache() -> None:
    """Clear entire cache."""
    _cache.clear()
