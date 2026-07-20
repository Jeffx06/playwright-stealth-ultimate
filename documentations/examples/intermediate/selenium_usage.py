#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
from pathlib import Path

# Ajouter le chemin du projet avant toute importation locale
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

"""
Exemple intermédiaire : Utilisation avec Selenium

Ce script démontre l'utilisation du framework Playwright Stealth
avec Selenium WebDriver.

Niveau : Intermédiaire
Temps estimé : 10-15 minutes

Fonctionnalités :
- Configuration Selenium (Chrome, Firefox, Edge)
- Injection stealth via Selenium avec stealth_selenium()
- Extraction de données avec Selenium
- Gestion des options du navigateur (headless, user-agent, etc.)
- Comparaison Playwright vs Selenium
- Gestion des erreurs et retries

Compatibilité : Python 3.10+, Selenium 4.0+
"""

import time
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List, Union
from dataclasses import dataclass, asdict

# =============================================================================
# 0. LOGGING
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


# =============================================================================
# 1. VÉRIFICATION DES DÉPENDANCES
# =============================================================================

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    from selenium.webdriver.firefox.options import Options as FirefoxOptions
    from selenium.webdriver.edge.options import Options as EdgeOptions
    from selenium.common.exceptions import TimeoutException, WebDriverException
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    logger.warning("⚠️ Selenium non installé. Installez-le avec: pip install selenium webdriver-manager")


# =============================================================================
# 2. CONFIGURATION
# =============================================================================

@dataclass
class SeleniumConfig:
    """Configuration pour Selenium"""
    browser: str = "chrome"  # chrome, firefox, edge
    headless: bool = False
    user_agent: Optional[str] = None
    window_size: tuple = (1920, 1080)
    timeout: int = 10
    implicit_wait: int = 3
    use_cdp: bool = True  # Utiliser CDP pour Chrome/Edge
    custom_seed: Optional[str] = None


# =============================================================================
# 3. FABRIQUE DE DRIVERS
# =============================================================================

class SeleniumDriverFactory:
    """
    Fabrique de drivers Selenium avec configuration avancée.
    """

    @staticmethod
    def create_driver(config: SeleniumConfig = SeleniumConfig()) -> webdriver.Remote:
        """
        Crée un driver Selenium configuré.

        Args:
            config: Configuration Selenium

        Returns:
            webdriver.Remote: Driver Selenium
        """
        if not SELENIUM_AVAILABLE:
            raise ImportError("Selenium n'est pas installé")

        browser = config.browser.lower()

        if browser == "chrome":
            return SeleniumDriverFactory._create_chrome_driver(config)
        elif browser == "firefox":
            return SeleniumDriverFactory._create_firefox_driver(config)
        elif browser == "edge":
            return SeleniumDriverFactory._create_edge_driver(config)
        else:
            raise ValueError(f"Navigateur non supporté: {browser}")

    @staticmethod
    def _create_chrome_driver(config: SeleniumConfig) -> webdriver.Chrome:
        """Crée un driver Chrome."""
        options = ChromeOptions()

        # Options de base
        options.add_argument(f"--window-size={config.window_size[0]},{config.window_size[1]}")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        # User-Agent personnalisé
        if config.user_agent:
            options.add_argument(f"--user-agent={config.user_agent}")

        # Mode headless
        if config.headless:
            options.add_argument("--headless=new")

        # Désactiver les notifications
        options.add_experimental_option("prefs", {
            "profile.default_content_setting_values.notifications": 2
        })

        # Désactiver l'extension d'automatisation
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)

        return webdriver.Chrome(options=options)

    @staticmethod
    def _create_firefox_driver(config: SeleniumConfig) -> webdriver.Firefox:
        """Crée un driver Firefox."""
        options = FirefoxOptions()

        # Options de base
        options.add_argument("--width={}".format(config.window_size[0]))
        options.add_argument("--height={}".format(config.window_size[1]))

        # User-Agent personnalisé
        if config.user_agent:
            options.set_preference("general.useragent.override", config.user_agent)

        # Mode headless
        if config.headless:
            options.add_argument("--headless")

        return webdriver.Firefox(options=options)

    @staticmethod
    def _create_edge_driver(config: SeleniumConfig) -> webdriver.Edge:
        """Crée un driver Edge."""
        options = EdgeOptions()

        # Options de base
        options.add_argument(f"--window-size={config.window_size[0]},{config.window_size[1]}")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        # User-Agent personnalisé
        if config.user_agent:
            options.add_argument(f"--user-agent={config.user_agent}")

        # Mode headless
        if config.headless:
            options.add_argument("--headless=new")

        return webdriver.Edge(options=options)


# =============================================================================
# 4. CLIENT SELENIUM AVEC STEALTH
# =============================================================================

class SeleniumStealthClient:
    """
    Client Selenium avec intégration du framework Playwright Stealth.
    """

    def __init__(self, config: SeleniumConfig = SeleniumConfig()):
        self.config = config
        self._driver: Optional[webdriver.Remote] = None
        self._stealth_available = False

        # Importer l'adaptateur Selenium si disponible
        try:
            from adapters.selenium import stealth_selenium
            self._stealth_available = True
            self._stealth_func = stealth_selenium
        except ImportError:
            logger.warning("⚠️ L'adaptateur Selenium n'est pas disponible")

    def start(self) -> webdriver.Remote:
        """
        Démarre le driver Selenium avec stealth.

        Returns:
            webdriver.Remote: Driver configuré
        """
        self._driver = SeleniumDriverFactory.create_driver(self.config)
        self._driver.implicitly_wait(self.config.implicit_wait)

        # Appliquer le stealth
        if self._stealth_available:
            try:
                success = self._stealth_func(
                    self._driver,
                    use_cdp=self.config.use_cdp,
                    custom_seed=self.config.custom_seed
                )
                if success:
                    logger.info("🛡️ Stealth activé avec succès")
                else:
                    logger.warning("⚠️ Échec de l'activation du stealth")
            except Exception as e:
                logger.error(f"❌ Erreur lors de l'activation du stealth: {e}")
        else:
            logger.warning("⚠️ Le stealth n'est pas disponible")

        return self._driver

    def stop(self) -> None:
        """Ferme le driver."""
        if self._driver:
            self._driver.quit()
            self._driver = None
            logger.info("🧹 Driver fermé")

    def get(self, url: str, wait_for: Optional[str] = None) -> None:
        """
        Navigue vers une URL avec attente optionnelle.

        Args:
            url: URL à visiter
            wait_for: Sélecteur CSS à attendre
        """
        if not self._driver:
            raise RuntimeError("Driver non initialisé. Appelez start() d'abord.")

        logger.info(f"🌐 Navigation vers {url}")
        self._driver.get(url)

        if wait_for:
            try:
                WebDriverWait(self._driver, self.config.timeout).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, wait_for))
                )
                logger.info(f"✅ Sélecteur '{wait_for}' trouvé")
            except TimeoutException:
                logger.warning(f"⏰ Timeout pour le sélecteur '{wait_for}'")

    def extract_text(self, selector: str) -> Optional[str]:
        """
        Extrait le texte d'un élément.

        Args:
            selector: Sélecteur CSS

        Returns:
            Optional[str]: Texte extrait ou None
        """
        if not self._driver:
            return None

        try:
            element = WebDriverWait(self._driver, self.config.timeout).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            return element.text
        except TimeoutException:
            return None

    def extract_all(self, selector: str) -> List[str]:
        """
        Extrait les textes de tous les éléments correspondants.

        Args:
            selector: Sélecteur CSS

        Returns:
            List[str]: Liste des textes extraits
        """
        if not self._driver:
            return []

        try:
            elements = WebDriverWait(self._driver, self.config.timeout).until(
                EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector))
            )
            return [e.text for e in elements if e.text]
        except TimeoutException:
            return []

    def extract_page_data(self) -> Dict[str, Any]:
        """
        Extrait les données de la page actuelle.

        Returns:
            Dict[str, Any]: Données extraites
        """
        if not self._driver:
            return {}

        data = {
            "title": self._driver.title,
            "url": self._driver.current_url,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "page_source_length": len(self._driver.page_source)
        }

        # Extraire les métadonnées
        try:
            meta_desc = self._driver.find_element(By.CSS_SELECTOR, 'meta[name="description"]')
            data["description"] = meta_desc.get_attribute("content") or ""
        except:
            data["description"] = ""

        # Extraire les h1
        try:
            h1 = self._driver.find_element(By.CSS_SELECTOR, 'h1')
            data["h1"] = h1.text or ""
        except:
            data["h1"] = ""

        # Compter les liens
        try:
            links = self._driver.find_elements(By.CSS_SELECTOR, 'a')
            data["links_count"] = len(links)
        except:
            data["links_count"] = 0

        return data


# =============================================================================
# 5. EXEMPLE D'UTILISATION
# =============================================================================

def scrape_with_selenium(
    url: str = "https://example.com",
    headless: bool = False,
    browser: str = "chrome"
) -> Optional[Dict[str, Any]]:
    """
    Scrape une page avec Selenium et stealth.

    Args:
        url: URL à scraper
        headless: Mode headless
        browser: Navigateur à utiliser

    Returns:
        Optional[Dict[str, Any]]: Données extraites ou None
    """
    if not SELENIUM_AVAILABLE:
        logger.error("❌ Selenium n'est pas installé")
        return None

    config = SeleniumConfig(
        browser=browser,
        headless=headless,
        timeout=10,
        use_cdp=True,
        custom_seed="selenium_demo_2024"
    )

    client = SeleniumStealthClient(config)

    try:
        # Démarrer le driver
        driver = client.start()

        # Naviguer
        client.get(url, wait_for="body")

        # Extraire les données
        data = client.extract_page_data()

        # Extraire des éléments spécifiques
        data["h1"] = client.extract_text("h1")
        data["paragraphs"] = client.extract_all("p")

        logger.info(f"📊 Données extraites: {data['title'][:50] if data['title'] else 'N/A'}...")

        # Sauvegarder une capture d'écran
        if driver:
            screenshot_path = Path("selenium_screenshot.png")
            driver.save_screenshot(str(screenshot_path))
            logger.info(f"📸 Screenshot sauvegardé: {screenshot_path}")

        return data

    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
        return None

    finally:
        client.stop()


def compare_playwright_selenium(url: str = "https://example.com") -> Dict[str, Any]:
    """
    Compare les résultats entre Playwright et Selenium.

    Args:
        url: URL à tester

    Returns:
        Dict[str, Any]: Résultats de la comparaison
    """
    results = {
        "url": url,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "playwright": {},
        "selenium": {}
    }

    # 1. Playwright
    try:
        from playwright.sync_api import sync_playwright
        from playwright_stealth import stealth_sync

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            stealth_sync(page)

            page.goto(url, wait_until="domcontentloaded")
            page.wait_for_load_state("networkidle")

            playwright_data = {
                "title": page.title(),
                "url": page.url,
                "h1": page.locator("h1").text_content(),
                "links": page.locator("a").count()
            }
            results["playwright"] = playwright_data
            browser.close()

    except Exception as e:
        results["playwright"]["error"] = str(e)

    # 2. Selenium
    try:
        selenium_data = scrape_with_selenium(url, headless=True)
        if selenium_data:
            results["selenium"] = {
                "title": selenium_data.get("title"),
                "url": selenium_data.get("url"),
                "h1": selenium_data.get("h1"),
                "links": selenium_data.get("links_count")
            }
    except Exception as e:
        results["selenium"]["error"] = str(e)

    return results


# =============================================================================
# 6. MAIN
# =============================================================================

def main():
    """Point d'entrée principal."""
    print("=" * 70)
    print("🖥️ Utilisation de Selenium - Playwright Stealth")
    print("=" * 70)
    print()

    if not SELENIUM_AVAILABLE:
        print("❌ Selenium n'est pas installé.")
        print("   Installez-le avec: pip install selenium webdriver-manager")
        return

    # 1. Scraping avec Selenium
    print("📌 1. Scraping avec Selenium")
    data = scrape_with_selenium(
        url="https://example.com",
        headless=False,
        browser="chrome"
    )

    if data:
        print(f"\n📊 Résultats:")
        print(f"   Titre: {data.get('title', 'N/A')}")
        print(f"   H1: {data.get('h1', 'N/A')}")
        print(f"   Liens: {data.get('links_count', 0)}")
        print(f"   Paragraphes: {len(data.get('paragraphs', []))}")

    print("\n" + "=" * 70)

    # 2. Comparaison Playwright vs Selenium
    print("\n📌 2. Comparaison Playwright vs Selenium")
    try:
        comparison = compare_playwright_selenium("https://example.com")
        print("\n📊 Résultats de la comparaison:")
        print(f"   Playwright - Titre: {comparison['playwright'].get('title', 'N/A')}")
        print(f"   Selenium   - Titre: {comparison['selenium'].get('title', 'N/A')}")
        print(f"   Playwright - Liens: {comparison['playwright'].get('links', 'N/A')}")
        print(f"   Selenium   - Liens: {comparison['selenium'].get('links', 'N/A')}")
    except Exception as e:
        print(f"⚠️ Erreur lors de la comparaison: {e}")

    print("\n" + "=" * 70)
    print("✅ Démonstration terminée")
    print("=" * 70)


if __name__ == "__main__":
    main()