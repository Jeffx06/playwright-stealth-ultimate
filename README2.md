# 📄 FICHIER : `README.md`

```markdown
# 🛡️ Playwright Stealth

**Framework d'évasion anti-bot pour Playwright et Selenium**

[![Python Version](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Playwright](https://img.shields.io/badge/playwright-1.40+-green.svg)](https://playwright.dev/python/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-100%25-success.svg)](tests/)

---

## 📋 Table des matières

- [🛡️ Playwright Stealth](#-playwright-stealth)
  - [📋 Table des matières](#-table-des-matières)
  - [📖 Présentation](#-présentation)
  - [✨ Fonctionnalités](#-fonctionnalités)
  - [📦 Installation](#-installation)
  - [🚀 Quick Start](#-quick-start)
  - [🎯 Utilisation avancée](#-utilisation-avancée)
    - [Profil personnalisé](#profil-personnalisé)
    - [Modules d'évasion personnalisés](#modules-dévasion-personnalisés)
    - [Configuration complète](#configuration-complète)
    - [Scraping multi-pages](#scraping-multi-pages)
  - [🔧 API](#-api)
  - [🧪 Tests](#-tests)
  - [📊 Benchmarks](#-benchmarks)
  - [🤝 Contribution](#-contribution)
  - [📝 License](#-license)

---

## 📖 Présentation

**Playwright Stealth** est un framework Python conçu pour éviter la détection par les systèmes anti-bot (Cloudflare, DataDome, Akamai, etc.) lors de l'automatisation de navigateurs avec **Playwright** ou **Selenium**.

Le framework modifie les APIs natives du navigateur pour masquer les signaux d'automatisation les plus courants :

- `navigator.webdriver`
- `window.chrome.runtime`
- Fingerprinting Canvas / Audio / WebGL
- Plugins et MIME types
- Dimensions de l'écran
- Polices système
- WebRTC / Géolocalisation
- Et bien plus...

---

## ✨ Fonctionnalités

| Catégorie | Évasions |
|-----------|----------|
| **Navigateur** | `navigator.webdriver`, `navigator.plugins`, `navigator.mimeTypes` |
| **Chrome** | `window.chrome.runtime`, `window.chrome.app`, `window.chrome.csi` |
| **Fingerprinting** | Canvas, AudioContext, WebGL, Fonts |
| **Réseau** | WebRTC, IP locale, Permissions |
| **Matériel** | `navigator.hardwareConcurrency`, `navigator.deviceMemory` |
| **OS** | `navigator.platform`, `navigator.userAgent`, `navigator.languages` |
| **Affichage** | `window.outerWidth`, `window.outerHeight`, `screen` |
| **Comportement** | Mouvement de souris, frappe clavier, scrolling |

---

## 📦 Installation

### Prérequis

- Python 3.10 ou supérieur
- Playwright ou Selenium

### Installation standard

```bash
# Installer le package
pip install playwright-stealth

# Installer les navigateurs Playwright
playwright install
```

### Installation pour le développement

```bash
# Cloner le dépôt
git clone https://github.com/yourusername/playwright-stealth.git
cd playwright-stealth

# Installer en mode editable
pip install -e .[dev]

# Installer les navigateurs
playwright install
```

---

## 🚀 Quick Start

### Exemple basique avec Playwright

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    # ✅ Une seule ligne pour activer le stealth
    stealth_sync(page)
    
    # Naviguer vers un site
    page.goto("https://example.com")
    
    # Vérifier que le stealth est actif
    result = page.evaluate("() => navigator.webdriver")
    print(f"webdriver: {result}")  # ✅ undefined
    
    browser.close()
```

### Exemple avec Selenium

```python
from selenium import webdriver
from playwright_stealth.adapters.selenium import stealth_selenium

driver = webdriver.Chrome()

# ✅ Activer le stealth
stealth_selenium(driver)

driver.get("https://example.com")
print(driver.execute_script("return navigator.webdriver"))  # ✅ undefined

driver.quit()
```

---

## 🎯 Utilisation avancée

### Profil personnalisé

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
from playwright_stealth.core.types import HardwareTier, OSType, BrowserVendor

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    
    # ✅ Profil personnalisé (MacBook Pro)
    stealth_sync(
        page,
        hardware_tier=HardwareTier.PREMIUM,
        os_type=OSType.MACOS,
        browser_vendor=BrowserVendor.CHROME,
        custom_seed="a1b2c3d4e5f67890"  # Seed pour la reproductibilité
    )
    
    page.goto("https://example.com")
    browser.close()
```

### Modules d'évasion personnalisés

```python
from playwright.sync_api import sync_playwright
from playwright_stealth.core.engine import FingerprintEngine
from playwright_stealth.core.types import EvasionModule

class CustomHeaderModule:
    """Module personnalisé pour ajouter des headers HTTP"""
    name = "custom_header"
    priority = 10
    dependencies = ()
    conflicts = ()
    
    def build(self, profile, loader):
        return """
        (function() {
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
                options = options || {};
                options.headers = options.headers || {};
                options.headers['X-Custom-Header'] = 'Stealth-Module';
                return originalFetch.call(this, url, options);
            };
            console.log('🛡️ Custom header module activé');
        })();
        """
    
    def validate(self, profile):
        return []

# Utilisation
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    
    # Créer l'engine avec le module personnalisé
    from playwright_stealth.core.profile import FingerprintProfile
    from playwright_stealth.services.builder import BuilderService
    from playwright_stealth.services.injector import InjectorService
    # ... (services)
    
    # Injecter
    engine.inject(page, enabled_modules=["custom_header"])
    page.goto("https://example.com")
    browser.close()
```

### Configuration complète

```python
from playwright_stealth import FullConfig, PlaywrightStealthClient

# ✅ Configuration complète
config = FullConfig(
    hardware_tier=HardwareTier.HIGH,
    os_type=OSType.WINDOWS,
    browser_vendor=BrowserVendor.CHROME,
    enabled_modules=["webdriver", "canvas", "audio", "intl"],
    consistency="strict",
    performance="balanced",
    cache_size=2000,
    telemetry_enabled=True,
    debug=True
)

client = PlaywrightStealthClient(config)
client.initialize()

# Appliquer à une page
client.apply_to_page(page)
```

### Scraping multi-pages

```python
from playwright_stealth import MultiPageScraper, PageConfig

# ✅ Configuration des pages
pages = [
    PageConfig(
        url="https://example.com",
        name="Example",
        selectors={"title": "h1", "description": "p"}
    ),
    PageConfig(
        url="https://www.wikipedia.org",
        name="Wikipedia",
        selectors={"title": "h1", "links": "a"}
    )
]

# ✅ Scraper
scraper = MultiPageScraper()
results = scraper.scrape_pages(pages, rotate_profiles=True)
scraper.export_results()
```

---

## 🔧 API

### Fonctions principales

| Fonction | Description |
|----------|-------------|
| `stealth_sync(page, ...)` | Applique le stealth à une page Playwright (sync) |
| `stealth_async(page, ...)` | Applique le stealth à une page Playwright (async) |
| `stealth_selenium(driver, ...)` | Applique le stealth à un driver Selenium |
| `dump_configuration()` | Affiche la configuration actuelle |

### Types disponibles

| Type | Description |
|------|-------------|
| `HardwareTier` | LOW, MEDIUM, HIGH, PREMIUM |
| `OSType` | WINDOWS, MACOS, LINUX |
| `BrowserVendor` | CHROME, EDGE, BRAVE, OPERA |
| `FingerprintProfile` | Profil complet d'empreinte |
| `EvasionModule` | Interface pour les modules d'évasion |

---

## 🧪 Tests

```bash
# Exécuter tous les tests
python run_all_tests.py

# Tests unitaires uniquement
pytest tests/unit/ -v

# Tests d'intégration Playwright
pytest tests/integration/test_injection.py -v -m playwright
```

---

## 📊 Benchmarks

```bash
# Benchmarks rapides (20 itérations)
python examples/advanced/benchmark_runner.py -i 20 -w 3

# Benchmarks complets (50 itérations)
python examples/advanced/benchmark_runner.py -i 50 -w 5
```

### Résultats typiques

| Benchmark | Mean (ms) | P95 (ms) |
|-----------|-----------|----------|
| Profile Generation | < 0.10 | < 0.50 |
| Plan Building (1 module) | < 0.02 | < 0.10 |
| Plan Building (5 modules) | < 0.02 | < 0.10 |
| Injection Playwright | < 100 | < 200 |

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. **Fork** le projet
2. **Créer** une branche (`git checkout -b feature/amazing`)
3. **Commit** (`git commit -m 'Add amazing feature'`)
4. **Push** (`git push origin feature/amazing`)
5. **Ouvrir** une Pull Request

### Guidelines

- ✅ Ajouter des tests pour les nouvelles fonctionnalités
- ✅ Mettre à jour la documentation
- ✅ Suivre le style PEP 8
- ✅ Utiliser des types hints

---

## 📝 License

MIT © Playwright Stealth Team

---

## ⭐ Support

Si ce projet vous est utile, n'oubliez pas de mettre une ⭐ sur GitHub !

---

**Fait avec ❤️ par l'équipe Playwright Stealth**
```

---

## 📋 RÉSUMÉ

| # | Section | Statut |
|---|---------|--------|
| 1 | Présentation | ✅ |
| 2 | Fonctionnalités | ✅ |
| 3 | Installation | ✅ |
| 4 | Quick Start | ✅ |
| 5 | Utilisation avancée | ✅ |
| 6 | API | ✅ |
| 7 | Tests | ✅ |
| 8 | Benchmarks | ✅ |
| 9 | Contribution | ✅ |
| 10 | License | ✅ |
