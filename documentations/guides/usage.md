# 📄 FICHIER CORRIGÉ : `documentations/guides/usage.md`

```markdown
# Guide d'utilisation

Ce guide couvre les cas d'utilisation avancés du framework Playwright Stealth, des workflows complexes aux techniques de scraping professionnelles.

---

## 📋 Vue d'ensemble

Le framework peut être utilisé dans différents contextes :

| Cas d'usage | Description | Complexité |
|-------------|-------------|------------|
| **Scraping simple** | Extraction de données d'une page | Basique |
| **Scraping multi-pages** | Navigation et extraction de données sur plusieurs pages | Intermédiaire |
| **Scraping de sites protégés** | Sites avec Cloudflare, Akamai, etc. | Avancé |
| **Tests E2E** | Tests d'interface utilisateur avec navigation réaliste | Intermédiaire |
| **Automatisation workflow** | Automatisation de tâches complexes | Avancé |

---

## 🌐 Scraping simple

### Extraction des données d'une page

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

def scrape_product(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        stealth_sync(page)
        
        page.goto(url)
        page.wait_for_selector(".product-details", timeout=10000)
        
        # Extraction des données
        data = {
            "title": page.locator(".product-title").text_content(),
            "price": page.locator(".product-price").text_content(),
            "description": page.locator(".product-description").text_content(),
            "reviews": page.locator(".review-count").text_content() or "0"
        }
        
        browser.close()
        return data

# Utilisation
product_data = scrape_product("https://example.com/product/123")
print(product_data)
```

### Gestion des erreurs et des timeouts

```python
from playwright.sync_api import sync_playwright, TimeoutError, Error
from playwright_stealth import stealth_sync
import logging

logger = logging.getLogger(__name__)

def robust_scrape(url, max_retries=3):
    for attempt in range(max_retries):
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                stealth_sync(page)
                
                page.set_default_timeout(15000)
                page.goto(url)
                
                # Vérification de la présence des éléments
                page.wait_for_selector("body", state="attached")
                
                # Extraction
                result = {
                    "url": url,
                    "title": page.title(),
                    "status": "success"
                }
                
                browser.close()
                return result
                
        except TimeoutError as e:
            logger.warning(f"Timeout (tentative {attempt+1}) : {e}")
            continue
            
        except Error as e:
            logger.error(f"Erreur Playwright (tentative {attempt+1}) : {e}")
            continue
    
    return {"url": url, "status": "failed"}
```

---

## 📄 Scraping multi-pages

### Navigation et extraction sur plusieurs pages

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
from typing import List, Dict
import time

def scrape_category(category_url: str, max_pages: int = 5) -> List[Dict]:
    products = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        stealth_sync(page)
        
        for page_num in range(1, max_pages + 1):
            url = f"{category_url}?page={page_num}"
            print(f"📄 Scraping de la page {page_num}...")
            
            page.goto(url)
            page.wait_for_selector(".product-item", timeout=10000)
            
            # Extraction des produits de la page
            items = page.evaluate("""
                () => {
                    return Array.from(document.querySelectorAll('.product-item')).map(el => ({
                        name: el.querySelector('.product-name')?.textContent || '',
                        price: el.querySelector('.product-price')?.textContent || '',
                        link: el.querySelector('a')?.href || ''
                    }));
                }
            """)
            
            products.extend(items)
            print(f"✅ {len(items)} produits extraits")
            
            # Attente entre les pages
            time.sleep(1)
        
        browser.close()
        return products

# Utilisation
products = scrape_category("https://example.com/category/electronics")
print(f"Total : {len(products)} produits")
```

### Gestion de la pagination dynamique

```python
def scrape_pagination_dynamic(start_url: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        stealth_sync(page)
        
        page.goto(start_url)
        
        all_items = []
        while True:
            # Extraire les éléments de la page courante
            items = page.evaluate("""
                () => {
                    return Array.from(document.querySelectorAll('.item')).map(el => ({
                        id: el.dataset.id,
                        title: el.querySelector('.title')?.textContent || ''
                    }));
                }
            """)
            all_items.extend(items)
            print(f"✅ {len(items)} éléments extraits (total: {len(all_items)})")
            
            # Trouver le bouton "Suivant"
            next_button = page.locator(".pagination .next:not(.disabled)")
            
            if not next_button.is_visible():
                break
            
            # Cliquer sur "Suivant" et attendre le chargement
            next_button.click()
            page.wait_for_load_state("networkidle")
            time.sleep(1)
        
        browser.close()
        return all_items
```

---

## 🛡️ Scraping de sites protégés

### Sites avec Cloudflare / Akamai

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
from playwright_stealth.core.types import HardwareTier, OSType
import time

def scrape_protected_site(url: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Mode headful pour Cloudflare
        page = browser.new_page()
        
        # Utiliser un profil strict
        from playwright_stealth.core.profile import FingerprintProfile
        
        profile = FingerprintProfile.generate(
            hardware_tier=HardwareTier.HIGH,
            os_type=OSType.WINDOWS,
            custom_seed="cloudflare_seed"
        )
        stealth_sync(page, profile=profile)
        
        # Navigation avec temps d'attente réaliste
        page.goto(url)
        
        # Attendre le chargement de Cloudflare
        page.wait_for_load_state("networkidle")
        
        # Si un challenge Cloudflare est présent, attendre
        if page.locator("#cf-challenge").is_visible():
            print("⏳ Challenge Cloudflare détecté, attente...")
            page.wait_for_selector("#cf-challenge", state="hidden", timeout=30000)
            print("✅ Challenge résolu")
        
        # Attente réaliste avant interaction
        time.sleep(2)
        
        # Maintenant la page est accessible
        content = page.content()
        browser.close()
        return content
```

### Rotation des profils

```python
import random
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
from playwright_stealth.core.profile import FingerprintProfile
from playwright_stealth.core.types import HardwareTier, OSType

def scrape_with_rotation(urls: list, seeds: list):
    results = []
    
    for url, seed in zip(urls, seeds):
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Utiliser un profil différent pour chaque requête
            profile = FingerprintProfile.generate(
                hardware_tier=HardwareTier.MEDIUM,
                os_type=OSType.WINDOWS,
                custom_seed=str(seed)
            )
            stealth_sync(page, profile=profile)
            
            page.goto(url)
            result = {
                "url": url,
                "title": page.title(),
                "profile_seed": seed
            }
            results.append(result)
            
            # Attendre entre les requêtes
            time.sleep(random.uniform(1, 3))
            
            browser.close()
    
    return results

# Utilisation
seeds = [42, 43, 44, 45, 46]
urls = ["https://example.com"] * 5
results = scrape_with_rotation(urls, seeds)
```

---

## 🧪 Tests E2E avec stealth

### Framework de tests complet

```python
import pytest
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

@pytest.fixture
def stealth_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        stealth_sync(page)
        yield page
        browser.close()

def test_login_page(stealth_page):
    """Test de la page de login"""
    stealth_page.goto("https://example.com/login")
    
    # Remplir le formulaire
    stealth_page.fill("#username", "test_user")
    stealth_page.fill("#password", "secure_password")
    stealth_page.click("#login-btn")
    
    # Vérifier la redirection
    stealth_page.wait_for_url("**/dashboard")
    assert "Dashboard" in stealth_page.title()

def test_checkout_process(stealth_page):
    """Test du processus de checkout"""
    stealth_page.goto("https://example.com/cart")
    
    # Vérifier le panier
    cart_items = stealth_page.locator(".cart-item").count()
    assert cart_items > 0
    
    # Procéder au checkout
    stealth_page.click("#checkout-btn")
    stealth_page.wait_for_selector("#payment-form", timeout=5000)
    
    # Remplir les informations de paiement
    stealth_page.fill("#card-number", "4111111111111111")
    stealth_page.fill("#expiry", "12/25")
    stealth_page.fill("#cvv", "123")
    
    stealth_page.click("#submit-payment")
    
    # Vérifier la confirmation
    stealth_page.wait_for_selector(".confirmation-message", timeout=10000)
    assert "Commande confirmée" in stealth_page.text_content(".confirmation-message")
```

---

## 🤖 Automatisation de workflows

### Tâche planifiée avec logs

```python
import schedule
import time
import logging
from datetime import datetime
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ScraperWorkflow:
    def __init__(self):
        self.results = []
    
    def run_scraping(self):
        logger.info(f"🔄 Début du scraping - {datetime.now()}")
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            stealth_sync(page)
            
            try:
                page.goto("https://example.com/data")
                
                # Extraire les données
                data = page.evaluate("""
                    () => {
                        return Array.from(document.querySelectorAll('.data-row')).map(row => ({
                            id: row.dataset.id,
                            value: row.querySelector('.value')?.textContent || ''
                        }));
                    }
                """)
                
                self.results.extend(data)
                logger.info(f"✅ {len(data)} éléments extraits")
                
                # Enregistrer les résultats
                self.save_results()
                
            except Exception as e:
                logger.error(f"❌ Erreur : {e}")
            
            finally:
                browser.close()
    
    def save_results(self):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"data/scrape_{timestamp}.json"
        
        import json
        with open(filename, "w") as f:
            json.dump(self.results, f, indent=2)
        
        logger.info(f"💾 Données sauvegardées dans {filename}")

# Planification
workflow = ScraperWorkflow()

# Exécution quotidienne à 6h et 18h
schedule.every().day.at("06:00").do(workflow.run_scraping)
schedule.every().day.at("18:00").do(workflow.run_scraping)

logger.info("⏳ En attente de la prochaine tâche...")
while True:
    schedule.run_pending()
    time.sleep(60)
```

---

## 🔄 Utilisation avancée avec cache

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
from playwright_stealth.cache.memory import LRUMemoryCache
from playwright_stealth.core.types import HardwareTier, OSType
import hashlib
import json

class CachedScraper:
    def __init__(self, cache_size=100):
        self.cache = LRUMemoryCache(maxsize=cache_size)
    
    def _cache_key(self, url: str, seed: int) -> str:
        data = f"{url}:{seed}"
        return hashlib.md5(data.encode()).hexdigest()
    
    def scrape(self, url: str, seed: int = 42):
        # Vérifier le cache
        key = self._cache_key(url, seed)
        cached = self.cache.get(key)
        
        if cached:
            print(f"✅ Récupéré depuis le cache : {url}")
            return json.loads(cached)
        
        # Scraper si pas dans le cache
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            stealth_sync(page)
            
            page.goto(url)
            data = {
                "title": page.title(),
                "content": page.content(),
                "timestamp": page.evaluate("Date.now()")
            }
            
            browser.close()
            
            # Mettre en cache
            self.cache.set(key, json.dumps(data))
            print(f"💾 Mis en cache : {url}")
            
            return data

# Utilisation
scraper = CachedScraper(cache_size=50)
data1 = scraper.scrape("https://example.com", seed=42)
data2 = scraper.scrape("https://example.com", seed=42)  # Depuis le cache
```

---

## ⚠️ Bonnes pratiques

### 1. Gestion des ressources avec context manager

```python
from contextlib import contextmanager
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

@contextmanager
def stealth_browser():
    """Context manager pour une utilisation sécurisée du browser."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        stealth_sync(page)
        yield page
        browser.close()

# Utilisation
with stealth_browser() as page:
    page.goto("https://example.com")
    print(page.title())
```

### 2. Logs structurés

```python
import structlog
import time

logger = structlog.get_logger()

def structured_scrape(url: str):
    logger.info(
        "start_scrape",
        url=url,
        timestamp=time.time()
    )
    
    try:
        with stealth_browser() as page:
            page.goto(url)
            title = page.title()
            
            logger.info(
                "scrape_success",
                url=url,
                title=title
            )
            return title
            
    except Exception as e:
        logger.error(
            "scrape_error",
            url=url,
            error=str(e)
        )
        raise
```

---

## 🚀 Prochaine étape

- 📖 [Guide de migration](migration.md) - Migrer depuis v4.x
- 🔬 [Techniques avancées de fingerprinting](../advanced/fingerprinting.md)
- ⚡ [Optimisation des performances](../advanced/performance.md)

---

**Dernière mise à jour** : 2026-07-19  
**Version** : 5.0.0
```

---

## 📋 RÉSUMÉ DES CORRECTIONS APPLIQUÉES

| # | Correction | Statut |
|---|------------|--------|
| 1 | Remplacer `FingerprintProfile.load()` par `FingerprintProfile.generate()` | ✅ |
| 2 | Ajouter les imports `HardwareTier`, `OSType` | ✅ |
| 3 | Corriger `scrape_protected_site()` avec `FingerprintProfile.generate()` | ✅ |
| 4 | Corriger `scrape_with_rotation()` avec `FingerprintProfile.generate()` | ✅ |
| 5 | Corriger `CachedScraper.scrape()` avec `stealth_sync()` direct | ✅ |
| 6 | Corriger `stealth_browser()` context manager avec import de `stealth_sync` | ✅ |
| 7 | Supprimer les références à `Profile` | ✅ |
