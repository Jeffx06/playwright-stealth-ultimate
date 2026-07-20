# cache/__init__.py
"""
Cache module - Protocole et implémentations
"""

from .protocol import CacheProtocol
from .memory import LRUMemoryCache

__all__ = [
    "CacheProtocol",
    "LRUMemoryCache",
]
