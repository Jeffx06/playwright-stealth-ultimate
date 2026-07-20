# models/__init__.py
"""
Modèles de données du framework
"""

from .plan import InjectionPlan
from .snapshot import SnapshotNode
from .config import (
    HardwareConfig,
    BrowserConfig,
    ModulesConfig,
    PolicyConfig,
    ProfileConfig,
)
from .diff import (
    ChangeType,
    ChangeSeverity,
    Change,
    DiffReport,
)
from .diagnosis import (
    Recommendation,
    Diagnosis,
)

__all__ = [
    # Plan
    "InjectionPlan",
    # Snapshot
    "SnapshotNode",
    # Config
    "HardwareConfig",
    "BrowserConfig",
    "ModulesConfig",
    "PolicyConfig",
    "ProfileConfig",
    # Diff
    "ChangeType",
    "ChangeSeverity",
    "Change",
    "DiffReport",
    # Diagnosis
    "Recommendation",
    "Diagnosis",
]
