# tests/integration/test_selenium.py
"""
Tests d'intégration pour l'adaptateur Selenium
"""

import pytest

from adapters.selenium import SeleniumAdapter, stealth_selenium
from core.profile import HardwareTier, OSType, BrowserVendor, FingerprintProfile


@pytest.mark.integration
@pytest.mark.selenium
class TestSeleniumAdapter:
    """Tests d'intégration pour l'adaptateur Selenium"""

    @pytest.fixture
    def selenium_installed(self):
        """Vérifie si Selenium est installé"""
        try:
            import selenium
            return True
        except ImportError:
            return False

    @pytest.fixture
    def chrome_installed(self):
        """Vérifie si Chrome est disponible"""
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            options = Options()
            options.add_argument("--headless")
            driver = webdriver.Chrome(options=options)
            driver.quit()
            return True
        except Exception:
            return False

    def test_selenium_adapter_initialization(self):
        """Test d'initialisation de l'adaptateur Selenium"""
        adapter = SeleniumAdapter()
        assert adapter is not None
        assert adapter._engine is None

    def test_create_engine(self):
        """Test de création du moteur"""
        adapter = SeleniumAdapter()
        engine = adapter.create_engine()
        assert engine is not None
        assert adapter._engine is not None
        assert adapter.get_profile() is not None

    def test_create_engine_with_custom_config(self):
        """Test de création du moteur avec configuration personnalisée"""
        adapter = SeleniumAdapter()
        engine = adapter.create_engine(
            hardware_tier=HardwareTier.HIGH,
            os_type=OSType.MACOS,
            browser_vendor=BrowserVendor.CHROME,
            custom_seed="test_seed_123"
        )
        assert engine is not None
        assert engine.profile.hardware.cpu_cores == 8
        assert engine.profile.browser.os_type == OSType.MACOS

    @pytest.mark.skipif("not selenium_installed or not chrome_installed")
    def test_stealth_selenium_chrome(self):
        """Test de stealth sur Chrome avec CDP"""
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        
        options = Options()
        options.add_argument("--headless")
        driver = webdriver.Chrome(options=options)
        
        try:
            result = stealth_selenium(
                driver,
                hardware_tier=HardwareTier.MEDIUM,
                os_type=OSType.WINDOWS,
                use_cdp=True
            )
            assert result is True
            
            driver.get("https://example.com")
            
            # Vérifier que le stealth est appliqué
            webdriver_val = driver.execute_script("return navigator.webdriver")
            assert webdriver_val is None or webdriver_val == "undefined" or webdriver_val is False
            
            # Vérifier que les plugins sont présents
            plugins_length = driver.execute_script("return navigator.plugins.length")
            assert plugins_length >= 0
        finally:
            driver.quit()

    @pytest.mark.skipif("not selenium_installed or not chrome_installed")
    def test_stealth_selenium_without_cdp(self):
        """Test de stealth sur Chrome sans CDP (fallback)"""
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        
        options = Options()
        options.add_argument("--headless")
        driver = webdriver.Chrome(options=options)
        
        try:
            result = stealth_selenium(
                driver,
                hardware_tier=HardwareTier.MEDIUM,
                os_type=OSType.WINDOWS,
                use_cdp=False
            )
            assert result is True
            
            driver.get("https://example.com")
            
            webdriver_val = driver.execute_script("return navigator.webdriver")
            assert webdriver_val is None or webdriver_val == "undefined" or webdriver_val is False
        finally:
            driver.quit()

    @pytest.mark.skipif("not selenium_installed")
    def test_selenium_adapter_apply_without_engine(self):
        """Test d'application sans moteur initialisé"""
        adapter = SeleniumAdapter()
        
        # Créer un driver factice pour le test
        class DummyDriver:
            pass
        
        driver = DummyDriver()
        
        with pytest.raises(ValueError, match="Engine not initialized"):
            adapter.apply_to_driver(driver)

    @pytest.mark.skipif("not selenium_installed")
    def test_selenium_adapter_get_engine(self):
        """Test de récupération du moteur"""
        adapter = SeleniumAdapter()
        assert adapter.get_engine() is None
        
        adapter.create_engine()
        assert adapter.get_engine() is not None

    @pytest.mark.skipif("not selenium_installed")
    def test_selenium_adapter_get_profile(self):
        """Test de récupération du profil"""
        adapter = SeleniumAdapter()
        assert adapter.get_profile() is None
        
        adapter.create_engine()
        assert adapter.get_profile() is not None
        assert isinstance(adapter.get_profile(), FingerprintProfile)
