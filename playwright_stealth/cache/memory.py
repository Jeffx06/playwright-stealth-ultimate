# cache/memory.py
"""
Cache LRU en mémoire
"""

from typing import Optional, Any, Dict
import time
from cachetools import LRUCache


class LRUMemoryCache:
    """
    Cache LRU en mémoire avec expiration.
    
    Utilise cachetools.LRUCache pour une implémentation efficace.
    """
    
    def __init__(self, maxsize: int = 1000):
        self._cache = LRUCache(maxsize=maxsize)
        self._expiry: Dict[str, float] = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Récupère une valeur du cache"""
        if key in self._cache:
            # Vérifier l'expiration
            if key in self._expiry and time.time() > self._expiry[key]:
                del self._cache[key]
                del self._expiry[key]
                return None
            return self._cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Stocke une valeur dans le cache"""
        self._cache[key] = value
        if ttl:
            self._expiry[key] = time.time() + ttl
        elif key in self._expiry:
            # Si pas de TTL, supprimer l'expiration
            del self._expiry[key]
    
    def invalidate(self, key: str) -> None:
        """Invalide une clé"""
        self._cache.pop(key, None)
        self._expiry.pop(key, None)
    
    def clear(self) -> None:
        """Vide le cache"""
        self._cache.clear()
        self._expiry.clear()


__all__ = [
    "LRUMemoryCache",
]
