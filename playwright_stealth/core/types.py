# core/types.py
"""
Types communs et énumérations du framework
"""

from enum import Enum, IntEnum
from typing import Optional, Dict, Any, List, Tuple, Protocol, runtime_checkable
from dataclasses import dataclass


# =============================================================================
# Énumérations
# =============================================================================

class HardwareTier(Enum):
    """Niveaux de performance matérielle"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    PREMIUM = "premium"


class OSType(Enum):
    """Types de systèmes d'exploitation"""
    WINDOWS = "windows"
    MACOS = "macos"
    LINUX = "linux"


class BrowserVendor(Enum):
    """Fournisseurs de navigateurs"""
    CHROME = "chrome"
    EDGE = "edge"
    BRAVE = "brave"
    OPERA = "opera"


class NodeType(Enum):
    """Types de noeuds dans un snapshot"""
    PROPERTY = "property"
    METHOD = "method"
    GETTER = "getter"
    SETTER = "setter"
    OBJECT = "object"
    ARRAY = "array"
    SYMBOL = "symbol"


class ChangeSeverity(Enum):
    """Sévérité des changements détectés"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ChangeType(Enum):
    """Type de changement dans un diff"""
    ADDED = "added"
    REMOVED = "removed"
    CHANGED = "changed"
    SAME = "same"


class SchemaVersion(IntEnum):
    """Versions du schéma de profil"""
    V1_0 = 100
    V1_1 = 101
    V2_0 = 200


# =============================================================================
# Protocoles
# =============================================================================

@runtime_checkable
class CacheProtocol(Protocol):
    """Protocole de cache"""
    
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


@runtime_checkable
class EvasionModule(Protocol):
    """Protocole pour un module d'évasion"""
    name: str
    priority: int
    dependencies: Tuple[str, ...]
    conflicts: Tuple[str, ...]
    
    def build(self, context: 'InjectionContext') -> str:
        """Génère le JavaScript du module"""
        ...
    
    def validate(self, profile: 'FingerprintProfile') -> List[str]:
        """Valide le module pour un profil donné"""
        ...


# =============================================================================
# Dataclasses de base
# =============================================================================

@dataclass(slots=True)
class FeatureCapability:
    """Capabilité d'une fonctionnalité"""
    name: str
    supported: bool
    since_version: Optional[str] = None
    deprecated_in: Optional[str] = None
    experimental: bool = False


@dataclass(slots=True)
class APICapability:
    """Capabilité d'une API"""
    name: str
    status: str  # 'stable', 'experimental', 'deprecated'
    since_version: Optional[str] = None
    removed_in: Optional[str] = None


# =============================================================================
# Exports
# =============================================================================

__all__ = [
    # Énumérations
    "HardwareTier",
    "OSType",
    "BrowserVendor",
    "NodeType",
    "ChangeSeverity",
    "ChangeType",
    "SchemaVersion",
    # Protocoles
    "CacheProtocol",
    "EvasionModule",
    # Dataclasses
    "FeatureCapability",
    "APICapability",
]