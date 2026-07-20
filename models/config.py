# models/config.py
"""
Modèle de configuration pour les profils
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any


@dataclass(slots=True)
class HardwareConfig:
    """Configuration matérielle"""
    tier: str
    cpu: str
    cpu_cores: int
    ram: int
    gpu: str
    gpu_vendor: str
    gpu_renderer: str
    screen: List[int]
    dpi: float


@dataclass(slots=True)
class BrowserConfig:
    """Configuration navigateur"""
    os: str
    version: str
    chrome_version: str
    platform: str
    platform_version: str
    locale: str
    languages: List[str]
    timezone: str
    user_agent: str
    accept_language: str
    fonts: List[str]


@dataclass(slots=True)
class ModulesConfig:
    """Configuration des modules"""
    enabled: List[str]


@dataclass(slots=True)
class PolicyConfig:
    """Configuration des politiques"""
    consistency: str
    performance: str


@dataclass(slots=True)
class ProfileConfig:
    """Configuration complète d'un profil"""
    id: str
    hardware: HardwareConfig
    browser: BrowserConfig
    modules: ModulesConfig
    policies: PolicyConfig
    metadata: Dict[str, Any] = field(default_factory=dict)


__all__ = [
    "HardwareConfig",
    "BrowserConfig",
    "ModulesConfig",
    "PolicyConfig",
    "ProfileConfig",
]
