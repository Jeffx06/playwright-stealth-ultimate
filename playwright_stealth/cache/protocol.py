# cache/protocol.py
"""
Protocole de cache - Interface pour les différents caches
"""

from typing import Protocol, Optional, Any, runtime_checkable


@runtime_checkable
class CacheProtocol(Protocol):
    """Protocole de cache pour le framework"""

    def get(self, key: str) -> Optional[Any]:
        """Récupère une valeur du cache"""
        ...

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Stocke une valeur dans le cache"""
        ...

    def invalidate(self, key: str) -> None:
        """Invalide une clé"""
        ...

    def clear(self) -> None:
        """Vide le cache"""
        ...


__all__ = [
    "CacheProtocol",
]
