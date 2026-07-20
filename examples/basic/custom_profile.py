#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Exemple basique : Profil personnalisé

Ce script démontre la création et l'utilisation d'un profil personnalisé
avec le framework Playwright Stealth.
"""

import sys
from pathlib import Path

# ✅ Ajouter le chemin du projet
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import time
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync, dump_configuration
from playwright_stealth.core.types import HardwareTier, OSType, BrowserVendor
from playwright_stealth.core.profile import FingerprintProfile


def compare_profiles():
    """Compare différents profils."""
    print("\n" + "=" * 60)
    print("📊 Comparaison de profils")
    print("=" * 60)

    # ✅ Utiliser des seeds hexadécimales valides
    profiles = [
        {
            "name": "Windows Desktop",
            "hardware": HardwareTier.HIGH,
            "os": OSType.WINDOWS,
            "browser": BrowserVendor.CHROME,
            "seed": "a1b2c3d4e5f67890"
        },
        {
            "name": "MacBook Pro",
            "hardware": HardwareTier.PREMIUM,
            "os": OSType.MACOS,
            "browser": BrowserVendor.CHROME,
            "seed": "1234567890abcdef"
        },
        {
            "name": "Linux Server",
            "hardware": HardwareTier.MEDIUM,
            "os": OSType.LINUX,
            "browser": BrowserVendor.CHROME,
            "seed": "fedcba0987654321"
        },
        {
            "name": "Low End",
            "hardware": HardwareTier.LOW,
            "os": OSType.WINDOWS,
            "browser": BrowserVendor.EDGE,
            "seed": "0a1b2c3d4e5f6789"
        }
    ]

    for profile in profiles:
        print(f"\n📌 {profile['name']}")
        print(f"   Hardware: {profile['hardware'].value}")
        print(f"   OS: {profile['os'].value}")
        print(f"   Browser: {profile['browser'].value}")
        print(f"   Seed: {profile['seed']}")

        fp = FingerprintProfile.generate(
            hardware_tier=profile['hardware'],
            os_type=profile['os'],
            browser_vendor=profile['browser'],
            custom_seed=profile['seed']
        )
        print(f"   Profil ID: {fp.id[:8]}...")


def main():
    """Point d'entrée principal."""
    print("=" * 70)
    print("🎯 Profil personnalisé - Playwright Stealth")
    print("=" * 70)
    print()

    # 1. Afficher la configuration par défaut
    print("📌 Configuration par défaut")
    dump_configuration()

    # 2. Comparer les profils
    compare_profiles()

    print("\n" + "=" * 70)
    print("✅ Démonstration terminée")
    print("=" * 70)


if __name__ == "__main__":
    main()