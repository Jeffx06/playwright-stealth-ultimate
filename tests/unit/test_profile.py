# tests/unit/test_profile.py
"""
Tests unitaires pour FingerprintProfile
"""

import pytest
from core.profile import (
    FingerprintProfile,
    HardwareProfile,
    BrowserProfile,
    NetworkProfile,
    DisplayProfile,
    LocaleProfile,
    HardwareTier,
    OSType,
    BrowserVendor,
)


class TestHardwareProfile:
    """Tests pour HardwareProfile"""

    def test_from_tier_low(self):
        """Test de création d'un profil matériel LOW"""
        hw = HardwareProfile.from_tier(HardwareTier.LOW)
        assert hw.cpu_cores == 2
        assert hw.ram_gb == 4
        assert hw.device_memory == 4
        assert hw.screen_resolution == (1366, 768)

    def test_from_tier_medium(self):
        """Test de création d'un profil matériel MEDIUM"""
        hw = HardwareProfile.from_tier(HardwareTier.MEDIUM)
        assert hw.cpu_cores == 4
        assert hw.ram_gb == 8
        assert hw.device_memory == 8
        assert hw.screen_resolution == (1920, 1080)

    def test_from_tier_high(self):
        """Test de création d'un profil matériel HIGH"""
        hw = HardwareProfile.from_tier(HardwareTier.HIGH)
        assert hw.cpu_cores == 8
        assert hw.ram_gb == 16
        assert hw.device_memory == 16
        assert hw.screen_resolution == (2560, 1440)

    def test_from_tier_premium(self):
        """Test de création d'un profil matériel PREMIUM"""
        hw = HardwareProfile.from_tier(HardwareTier.PREMIUM)
        assert hw.cpu_cores == 16
        assert hw.ram_gb == 32
        assert hw.device_memory == 32
        assert hw.screen_resolution == (3840, 2160)


class TestBrowserProfile:
    """Tests pour BrowserProfile"""

    def test_from_os_windows(self):
        """Test de création d'un profil navigateur Windows"""
        browser = BrowserProfile.from_os(OSType.WINDOWS, BrowserVendor.CHROME)
        assert browser.os_type == OSType.WINDOWS
        assert browser.platform == "Win32"
        assert "Windows" in browser.user_agent

    def test_from_os_macos(self):
        """Test de création d'un profil navigateur macOS"""
        browser = BrowserProfile.from_os(OSType.MACOS, BrowserVendor.CHROME)
        assert browser.os_type == OSType.MACOS
        assert browser.platform == "MacIntel"
        assert "Macintosh" in browser.user_agent

    def test_from_os_linux(self):
        """Test de création d'un profil navigateur Linux"""
        browser = BrowserProfile.from_os(OSType.LINUX, BrowserVendor.CHROME)
        assert browser.os_type == OSType.LINUX
        assert browser.platform == "Linux x86_64"
        assert "Linux" in browser.user_agent


class TestFingerprintProfile:
    """Tests pour FingerprintProfile"""

    def test_generate_default(self):
        """Test de génération d'un profil par défaut"""
        profile = FingerprintProfile.generate()
        assert profile.id is not None
        assert len(profile.id) == 16
        assert profile.hardware is not None
        assert profile.browser is not None
        assert profile.network is not None
        assert profile.display is not None
        assert profile.locale is not None

    def test_generate_with_custom_seed(self):
        """Test de génération avec seed personnalisée (hexadécimale)"""
        seed = "abcdef1234567890"
        profile1 = FingerprintProfile.generate(custom_seed=seed)
        profile2 = FingerprintProfile.generate(custom_seed=seed)
        assert profile1.id == profile2.id
        assert profile1.seed == profile2.seed

    def test_generate_with_custom_seed_short(self):
        """Test de génération avec seed courte - l'ID est la seed elle-même"""
        seed = "a1b2c3d4"
        profile = FingerprintProfile.generate(custom_seed=seed)
        assert profile.id is not None
        # Avec une seed courte, l'ID est la seed elle-même
        assert profile.id == seed

    def test_generate_different_profiles(self):
        """Test de génération de profils différents"""
        profile1 = FingerprintProfile.generate(
            hardware_tier=HardwareTier.LOW,
            os_type=OSType.WINDOWS
        )
        profile2 = FingerprintProfile.generate(
            hardware_tier=HardwareTier.HIGH,
            os_type=OSType.MACOS
        )
        assert profile1.id != profile2.id
        assert profile1.hardware.cpu_cores != profile2.hardware.cpu_cores

    def test_get_noise(self):
        """Test de génération de bruit déterministe"""
        profile = FingerprintProfile.generate()
        noise1 = profile.get_noise("canvas")
        noise2 = profile.get_noise("canvas")
        assert noise1 == noise2  # Doit être déterministe

        noise3 = profile.get_noise("audio")
        assert noise1 != noise3  # Différent pour différents modules

    def test_hardware_consistency(self):
        """Test de cohérence du matériel"""
        profile = FingerprintProfile.generate()
        assert profile.hardware.ram_gb == profile.hardware.device_memory
        assert profile.hardware.screen_resolution[0] >= 1366
        assert profile.hardware.screen_resolution[1] >= 768

    def test_browser_consistency(self):
        """Test de cohérence du navigateur"""
        profile = FingerprintProfile.generate(
            os_type=OSType.WINDOWS,
            browser_vendor=BrowserVendor.CHROME
        )
        assert profile.browser.vendor == BrowserVendor.CHROME
        assert profile.browser.os_type == OSType.WINDOWS
        assert "Windows" in profile.browser.user_agent

    def test_network_profile(self):
        """Test du profil réseau"""
        profile = FingerprintProfile.generate()
        assert profile.network.rtt_ms > 0
        assert profile.network.downlink_mbps > 0
        assert profile.network.effective_type in ["4g", "3g", "2g"]

    def test_display_profile(self):
        """Test du profil d'affichage"""
        profile = FingerprintProfile.generate()
        assert profile.display.screen_width > 0
        assert profile.display.screen_height > 0
        assert profile.display.device_pixel_ratio > 0

    def test_locale_profile(self):
        """Test du profil linguistique"""
        profile = FingerprintProfile.generate()
        assert profile.locale.locale is not None
        assert len(profile.locale.languages) > 0
        assert profile.locale.timezone is not None
