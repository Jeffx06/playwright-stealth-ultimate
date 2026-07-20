# models/diff.py
"""
Modèle de différences entre snapshots
"""

from dataclasses import dataclass, field
from typing import List, Optional, Any, Dict
from enum import Enum


class ChangeType(Enum):
    """Type de changement"""
    ADDED = "added"
    REMOVED = "removed"
    CHANGED = "changed"
    SAME = "same"


class ChangeSeverity(Enum):
    """Sévérité du changement"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


@dataclass(slots=True)
class Change:
    """Un changement individuel"""
    path: str
    type: ChangeType
    before: Optional[Any]
    after: Optional[Any]
    severity: Optional[ChangeSeverity] = None
    reason: Optional[str] = None
    suggestion: Optional[str] = None


@dataclass(slots=True)
class DiffReport:
    """Rapport de différences"""
    changes: List[Change] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def total_changes(self) -> int:
        return len(self.changes)
    
    @property
    def critical_count(self) -> int:
        return sum(1 for c in self.changes if c.severity == ChangeSeverity.CRITICAL)
    
    @property
    def high_count(self) -> int:
        return sum(1 for c in self.changes if c.severity == ChangeSeverity.HIGH)
    
    @property
    def medium_count(self) -> int:
        return sum(1 for c in self.changes if c.severity == ChangeSeverity.MEDIUM)
    
    @property
    def low_count(self) -> int:
        return sum(1 for c in self.changes if c.severity == ChangeSeverity.LOW)
    
    def to_dict(self) -> Dict:
        return {
            'total_changes': self.total_changes,
            'critical': self.critical_count,
            'high': self.high_count,
            'medium': self.medium_count,
            'low': self.low_count,
            'changes': [
                {
                    'path': c.path,
                    'type': c.type.value,
                    'before': c.before,
                    'after': c.after,
                    'severity': c.severity.value if c.severity else None,
                    'reason': c.reason,
                    'suggestion': c.suggestion,
                }
                for c in self.changes
            ],
            'metadata': self.metadata,
        }


__all__ = [
    "ChangeType",
    "ChangeSeverity",
    "Change",
    "DiffReport",
]
