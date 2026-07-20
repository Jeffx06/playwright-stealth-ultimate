# tests/integration/test_injection.py
"""
Tests d'intégration pour l'injection avec Playwright
"""

import sys
from pathlib import Path

# Ajouter le chemin du projet
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import pytest
from playwright.sync_api import sync_playwright

from playwright_stealth.adapters.playwright import PlaywrightAdapter, dump_configuration
from playwright_stealth.core.profile import HardwareTier, OSType, BrowserVendor
from playwright_stealth.js.modules import get_all_modules


@pytest.mark.integration
@pytest.mark.playwright
class TestInjection:
    """Tests d'intégration pour l'injection"""

    @pytest.fixture
    def browser(self):
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            yield browser
            browser.close()

    @pytest.fixture
    def page(self, browser):
        page = browser.new_page()
        yield page
        page.close()

    def test_stealth_injection(self, page):
        """Test d'injection du stealth"""
        adapter = PlaywrightAdapter()
        modules = get_all_modules()
        adapter.create_engine(modules=modules)
        
        result = adapter.apply_to_page(page)
        assert result is True

        page.goto("https://example.com")
        page.wait_for_load_state("networkidle")

        webdriver = page.evaluate("() => navigator.webdriver")
        assert webdriver is None or webdriver == "undefined" or webdriver is False

    def test_stealth_with_custom_config(self, page):
        """Test d'injection avec configuration personnalisée"""
        adapter = PlaywrightAdapter()
        modules = get_all_modules()
        
        adapter.create_engine(
            hardware_tier=HardwareTier.HIGH,
            os_type=OSType.MACOS,
            browser_vendor=BrowserVendor.CHROME,
            modules=modules
        )
        
        result = adapter.apply_to_page(page)
        assert result is True

        page.goto("https://example.com")
        page.wait_for_load_state("networkidle")

        webdriver = page.evaluate("() => navigator.webdriver")
        assert webdriver is None or webdriver == "undefined" or webdriver is False
        
        plugins_length = page.evaluate("() => navigator.plugins.length")
        assert plugins_length >= 0

    def test_dump_configuration(self, capsys):
        dump_configuration()
        captured = capsys.readouterr()
        assert "🛡️ STEALTH CONFIGURATION" in captured.out
        assert "HARDWARE" in captured.out
        assert "BROWSER" in captured.out

    def test_dump_configuration_with_params(self, capsys):
        dump_configuration(
            hardware_tier=HardwareTier.HIGH,
            os_type=OSType.MACOS,
            browser_vendor=BrowserVendor.CHROME
        )
        captured = capsys.readouterr()
        assert "OS: macos" in captured.out
        assert "Platform: MacIntel" in captured.out
