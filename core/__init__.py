# core/__init__.py
"""Coeur du framework - Types et profils"""

from .types import (
    HardwareTier,
    OSType,
    BrowserVendor,
    NodeType,
    ChangeSeverity,
    ChangeType,
    SchemaVersion,
    CacheProtocol,
    EvasionModule,
    FeatureCapability,
    APICapability,
)

from .profile import (
    HardwareProfile,
    BrowserProfile,
    NetworkProfile,
    DisplayProfile,
    LocaleProfile,
    FingerprintProfile,
)

__all__ = [
    # Types
    "HardwareTier",
    "OSType",
    "BrowserVendor",
    "NodeType",
    "ChangeSeverity",
    "ChangeType",
    "SchemaVersion",
    "CacheProtocol",
    "EvasionModule",
    "FeatureCapability",
    "APICapability",
    # Profiles
    "HardwareProfile",
    "BrowserProfile",
    "NetworkProfile",
    "DisplayProfile",
    "LocaleProfile",
    "FingerprintProfile",
]
