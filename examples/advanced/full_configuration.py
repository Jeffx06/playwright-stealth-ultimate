#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Exemple avancé : Configuration complète du framework

Ce script démontre la configuration complète du framework Playwright Stealth
avec tous les services, politiques et options personnalisées.
"""

import sys
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict, field

# ✅ Ajouter le chemin du projet
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# ✅ Imports absolus
from playwright_stealth.adapters.playwright import PlaywrightAdapter
from playwright_stealth import stealth_sync, dump_configuration
from playwright_stealth.core.profile import FingerprintProfile, HardwareTier, OSType, BrowserVendor
from playwright_stealth.core.engine import FingerprintEngine
from playwright_stealth.core.types import EvasionModule
from playwright_stealth.services.builder import BuilderService
from playwright_stealth.services.injector import InjectorService
from playwright_stealth.services.validator import ProfileValidator
from playwright_stealth.services.capability import CapabilityResolver, CapabilityRegistry
from playwright_stealth.services.optimizer import PlanOptimizer
from playwright_stealth.services.behavior import BehaviorService
from playwright_stealth.services.telemetry import TelemetryService, TelemetryConfig
from playwright_stealth.services.observability import ObservabilityService
from playwright_stealth.cache.memory import LRUMemoryCache
from playwright_stealth.config.loader import ConfigLoader
from playwright.sync_api import sync_playwright


# =============================================================================
# 1. CONFIGURATION STRUCTURÉE
# =============================================================================

@dataclass
class FullConfig:
    """Configuration complète du framework"""
    hardware_tier: HardwareTier = HardwareTier.HIGH
    os_type: OSType = OSType.WINDOWS
    browser_vendor: BrowserVendor = BrowserVendor.CHROME
    custom_seed: Optional[str] = None
    
    enabled_modules: List[str] = field(default_factory=lambda: [
        "webdriver",
        "chrome_runtime",
        "canvas",
        "audio",
        "intl",
        "webgl",
        "permissions",
        "user_agent_data",
        "pdf_viewer"
    ])
    
    consistency: str = "strict"
    performance: str = "balanced"
    cache_size: int = 1000
    telemetry_enabled: bool = True
    telemetry_sampling_rate: float = 1.0
    debug: bool = False
    browser_version: Optional[str] = None
    optimize_plan: bool = True
    verify_checksum: bool = True
    behavior_enabled: bool = True
    behavior_seed: Optional[int] = None
    observability_enabled: bool = True
    snapshot_on_injection: bool = False


def main():
    """Point d'entrée principal."""
    print("=" * 70)
    print("🎯 Configuration complète - Playwright Stealth")
    print("=" * 70)
    print()

    # Configuration personnalisée
    config = FullConfig(
        hardware_tier=HardwareTier.PREMIUM,
        os_type=OSType.MACOS,
        browser_vendor=BrowserVendor.CHROME,
        enabled_modules=["webdriver", "canvas", "audio", "intl"],
        consistency="balanced",
        performance="high",
        cache_size=2000,
        debug=True,
        behavior_enabled=True,
        observability_enabled=True,
        custom_seed="abcdef1234567890"  # ✅ Hexadécimal
    )

    print(f"📌 Configuration:")
    print(f"   Hardware: {config.hardware_tier.value}")
    print(f"   OS: {config.os_type.value}")
    print(f"   Modules: {len(config.enabled_modules)}")
    print()

    # Afficher la configuration
    dump_configuration(
        hardware_tier=config.hardware_tier,
        os_type=config.os_type,
        browser_vendor=config.browser_vendor
    )

    print("\n" + "=" * 70)
    print("✅ Démonstration terminée")
    print("=" * 70)


if __name__ == "__main__":
    main()