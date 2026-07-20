# 📄 FICHIER CORRIGÉ : `documentations/guides/quickstart.md`

```markdown
# Guide de démarrage rapide

Commençons par créer votre premier script anti-détection avec Playwright Stealth.

---

## 🎯 Objectif

À la fin de ce guide, vous aurez :

- ✅ Un script fonctionnel qui navigue sur un site web
- ✅ La couche stealth activée pour éviter la détection
- ✅ Une compréhension de base des profils

---

## 📝 Votre premier script

### 1. Créez un fichier `scraper.py`

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

def main():
    with sync_playwright() as p:
        # Lancement du navigateur
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # Application de la couche stealth (une seule ligne !)
        stealth_sync(page)
        
        # Navigation
        page.goto("https://example.com")
        print(f"✅ Titre : {page.title()}")
        
        # Attendre un peu pour voir le résultat
        page.wait_for_timeout(2000)
        
        browser.close()

if __name__ == "__main__":
    main()
```

### 2. Exécutez le script

```bash
python scraper.py
```

### 3. Résultat attendu

```text
✅ Titre : Example Domain
```

Le navigateur s'ouvre, affiche la page `example.com`, puis se ferme automatiquement.

---

## 🔄 Version asynchrone

Si vous préférez utiliser Playwright en mode asynchrone :

```python
import asyncio
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        # Version asynchrone
        await stealth_async(page)
        
        await page.goto("https://example.com")
        print(f"✅ Titre : {await page.title()}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 🎨 Utiliser un profil personnalisé

Pour simuler un utilisateur réaliste, vous pouvez définir un profil personnalisé :

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
from playwright_stealth.core.profile import FingerprintProfile
from playwright_stealth.core.types import HardwareTier, OSType

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # Création d'un profil Windows 11 - Chrome 139
        profile = FingerprintProfile.generate(
            hardware_tier=HardwareTier.HIGH,
            os_type=OSType.WINDOWS,
            custom_seed="my_seed_123"
        )
        
        stealth_sync(page, profile=profile)
        
        # Vérifier les détecteurs
        page.goto("https://example.com")
        print(f"✅ Titre : {page.title()}")
        
        browser.close()

if __name__ == "__main__":
    main()
```

### Profil macOS

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
from playwright_stealth.core.profile import FingerprintProfile
from playwright_stealth.core.types import HardwareTier, OSType

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # Création d'un profil macOS
        profile = FingerprintProfile.generate(
            hardware_tier=HardwareTier.HIGH,
            os_type=OSType.MACOS,
            custom_seed="mac_seed_456"
        )
        
        stealth_sync(page, profile=profile)
        
        page.goto("https://example.com")
        print(f"✅ Titre : {page.title()}")
        
        browser.close()

if __name__ == "__main__":
    main()
```

---

## 🧪 Tester l'efficacité du stealth

Pour vérifier que la couche stealth fonctionne, vous pouvez utiliser des sites de test.

### Site de test 1 : `https://bot.sannysoft.com/`

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    stealth_sync(page)
    
    # Site de test anti-détection
    page.goto("https://bot.sannysoft.com/")
    page.wait_for_timeout(5000)
    browser.close()
```

### Site de test 2 : `https://fingerprintjs.com/demo/`

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    stealth_sync(page)
    
    # Site de test FingerprintJS
    page.goto("https://fingerprintjs.com/demo/")
    page.wait_for_timeout(3000)
    
    # Visualiser les résultats
    result = page.evaluate(
        """
        () => {
            const visitorId = document.querySelector('.visitor-id');
            return visitorId ? visitorId.textContent : 'Non trouvé';
        }
        """
    )
    print(f"✅ Visitor ID : {result}")
    
    browser.close()
```

---

## 🚀 Avec Selenium (optionnel)

Si vous préférez Selenium :

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from playwright_stealth import stealth_selenium
from playwright_stealth.core.types import HardwareTier, OSType

def main():
    options = Options()
    options.add_argument("--start-maximized")
    
    driver = webdriver.Chrome(options=options)
    
    # Application de la couche stealth avec profil
    stealth_selenium(
        driver,
        hardware_tier=HardwareTier.HIGH,
        os_type=OSType.WINDOWS
    )
    
    # Navigation
    driver.get("https://example.com")
    print(f"✅ Titre : {driver.title}")
    
    driver.quit()

if __name__ == "__main__":
    main()
```

---

## 📊 Récapitulatif

| Cas d'usage           | Code                          | Fichier                                      |
|-----------------------|-------------------------------|----------------------------------------------|
| **Injection simple**  | `stealth_sync(page)`          | `examples/basic/simple_injection.py`         |
| **Profil personnalisé** | `stealth_sync(page, profile=...)` | `examples/basic/custom_profile.py`   |
| **Async**             | `await stealth_async(page)`   | `examples/intermediate/multi_page_scraping.py` |
| **Selenium**          | `stealth_selenium(driver)`    | `examples/intermediate/selenium_usage.py`    |

---

## 🎯 Prochaine étape

Vous savez maintenant utiliser le framework au quotidien ! Pour aller plus loin :

- 📖 [Guide de configuration](configuration.md) – Personnalisation avancée
- 📚 [API Reference](../api/index.md) – Documentation complète
- 🔬 [Techniques avancées de fingerprinting](../advanced/fingerprinting.md)

---

**Dernière mise à jour** : 2026-07-19  
**Version** : 5.0.0
```

---

## 📋 RÉSUMÉ DES CORRECTIONS APPLIQUÉES

| # | Correction | Statut |
|---|------------|--------|
| 1 | Remplacer `FingerprintProfile()` par `FingerprintProfile.generate()` | ✅ |
| 2 | Remplacer `HardwareProfile()` par `HardwareTier` | ✅ |
| 3 | Remplacer `BrowserProfile()` par `OSType` | ✅ |
| 4 | Suppression des imports inutiles (`HardwareProfile`, `BrowserProfile`) | ✅ |
| 5 | Ajout des imports `HardwareTier`, `OSType` | ✅ |
| 6 | Ajout d'un exemple de profil macOS | ✅ |
| 7 | Mise à jour de l'exemple Selenium avec `HardwareTier`, `OSType` | ✅ |
