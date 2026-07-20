# 📄 FICHIER CORRIGÉ : `documentations/guides/troubleshooting.md`

```markdown
# Guide de dépannage

Ce guide vous aide à résoudre les problèmes les plus courants rencontrés avec le framework Playwright Stealth.

---

## 📋 Vue d'ensemble

| Catégorie | Problèmes |
|-----------|-----------|
| **Installation** | Erreurs d'installation, dépendances manquantes |
| **Navigateurs** | Playwright, Selenium, navigateurs manquants |
| **Injection** | Échec d'injection, erreurs JavaScript |
| **Profils** | Validation de profils, incohérences |
| **Performances** | Lenteur, timeout, fuites mémoire |
| **Sites protégés** | Cloudflare, détection, blocage |

---

## 🔧 Problèmes d'installation

### Erreur : `ModuleNotFoundError: No module named 'playwright_stealth'`

**Cause :** Le package n'est pas installé ou mal installé.

**Solution :**
```bash
# Réinstaller le package
pip uninstall playwright-stealth
pip install playwright-stealth

# Vérifier l'installation
pip list | findstr playwright-stealth  # Windows
pip list | grep playwright-stealth     # Linux/Mac
```

### Erreur : `ModuleNotFoundError: No module named 'cachetools'`

**Cause :** Dépendance manquante.

**Solution :**
```bash
pip install cachetools>=5.0.0
```

### Erreur : `ModuleNotFoundError: No module named 'yaml'`

**Cause :** PyYAML non installé.

**Solution :**
```bash
pip install pyyaml>=6.0
```

### Erreur : `ImportError: cannot import name 'resource_string'`

**Cause :** Problème de compatibilité Python 3.14 (l'ancienne API `pkg_resources` est dépréciée).

**Solution :**
```bash
# Solution 1 : Mettre à jour le framework
pip install --upgrade playwright-stealth

# Solution 2 : Exécuter le patch manuellement
python scripts/patch.py

# Solution 3 : Définir la variable d'environnement
export SETUPTOOLS_USE_DISTUTILS=stdlib
```

---

## 🌐 Problèmes de navigateurs

### Erreur : `playwright._impl._api_types.Error: Browser not found`

**Cause :** Le navigateur Playwright n'est pas installé.

**Solution :**
```bash
# Installer Chromium
playwright install chromium

# Ou installer tous les navigateurs
playwright install

# Vérifier les navigateurs installés
playwright install --help
```

### Erreur : `playwright._impl._api_types.Error: Browser closed`

**Cause :** Le navigateur s'est fermé prématurément.

**Solution :**
```python
# Assurez-vous que le navigateur reste ouvert pendant l'injection
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    stealth_sync(page)  # L'injection doit être faite avant de fermer
    # ... vos actions
    browser.close()  # Fermeture explicite
```

### Erreur : `WebDriverException: Message: 'chromedriver' executable needs to be in PATH`

**Cause :** ChromeDriver manquant pour Selenium.

**Solution :**
```bash
# Installation automatique
pip install webdriver-manager
python -c "from webdriver_manager.chrome import ChromeDriverManager; ChromeDriverManager().install()"

# Ou manuellement
# Téléchargez chromedriver depuis https://chromedriver.chromium.org/
# Ajoutez-le au PATH
```

---

## 💉 Problèmes d'injection

### Erreur : L'injection échoue (retourne `False`)

**Cause :** L'injection des scripts JavaScript a échoué.

**Solutions :**

```python
# Solution 1 : Vérifier que la page est chargée
page.goto("https://example.com")
page.wait_for_load_state("networkidle")
success = stealth_sync(page)

if not success:
    print("❌ Échec de l'injection")

# Solution 2 : Activer le debug pour voir les erreurs
page.on("pageerror", lambda err: print(f"❌ JS Error: {err}"))
page.on("console", lambda msg: print(f"📝 Console: {msg.text}"))
success = stealth_sync(page)

# Solution 3 : Vérifier le cache et les modules
from playwright_stealth.core.types import HardwareTier, OSType

profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.MEDIUM,
    os_type=OSType.WINDOWS
)
success = stealth_sync(page, profile=profile)
```

### Erreur : `TimeoutError: Injection timeout`

**Cause :** L'injection prend trop de temps.

**Solution :**
```python
# Augmenter le timeout n'est pas directement supporté
# Utiliser un profil "performance" pour réduire les modules
from playwright_stealth.core.types import HardwareTier, OSType

profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.LOW,
    os_type=OSType.WINDOWS
)
success = stealth_sync(page, profile=profile)
```

### Erreur JavaScript dans la console

**Cause :** Un script d'évasion a échoué.

**Solution :**
```python
# Activer la capture des erreurs JavaScript
page.on("pageerror", lambda err: print(f"❌ JS Error: {err}"))
page.on("console", lambda msg: print(f"📝 JS Log: {msg.text}"))

success = stealth_sync(page, debug=True)
```

---

## 👤 Problèmes de profils

### Erreur : `ValidationError: Profile validation failed`

**Cause :** Le profil contient des incohérences.

**Exemple d'erreur :**
```
⚠️ RAM_MISMATCH: RAM (32GB) vs Device Memory (4GB)
⚠️ UA_MISMATCH: User-Agent Linux vs OS Windows
⚠️ LOCALE_MISMATCH: Locale fr-FR vs Timezone America/New_York
```

**Solution :**
```python
from playwright_stealth.services.validator import ProfileValidator
from playwright_stealth.core.profile import FingerprintProfile
from playwright_stealth.core.types import HardwareTier, OSType

validator = ProfileValidator()

# Créer un profil valide
profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.HIGH,
    os_type=OSType.WINDOWS
)

# Valider le profil
errors = validator.validate(profile)

if errors:
    print("Problèmes détectés:")
    for error in errors:
        print(f"  - {error}")
else:
    print("✅ Profil valide")
```

### Incohérence mémoire

**Problème :** `device_memory` ne correspond pas à la RAM réelle.

**Solution :**
```python
from playwright_stealth.core.profile import FingerprintProfile
from playwright_stealth.core.types import HardwareTier, OSType

# Utiliser un profil généré qui assure la cohérence
profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.HIGH,
    os_type=OSType.WINDOWS
)

# Vérifier les valeurs
print(f"RAM: {profile.hardware.ram_gb} GB")
print(f"Device Memory: {profile.hardware.device_memory} GB")
```

### Incohérence User-Agent

**Problème :** Le User-Agent ne correspond pas à l'OS.

**Solution :**
```python
from playwright_stealth.core.profile import FingerprintProfile
from playwright_stealth.core.types import OSType

# Profil cohérent pour Windows
profile = FingerprintProfile.generate(
    os_type=OSType.WINDOWS
)

# Profil cohérent pour macOS
profile = FingerprintProfile.generate(
    os_type=OSType.MACOS
)
```

---

## ⚡ Problèmes de performances

### Lenteur de l'injection

**Cause :** Trop de modules injectés ou profils trop complexes.

**Solution :**
```python
# Solution 1 : Utiliser un profil "medium" au lieu de "high"
from playwright_stealth.core.types import HardwareTier, OSType

profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.MEDIUM,  # Au lieu de HIGH
    os_type=OSType.WINDOWS
)
success = stealth_sync(page, profile=profile)

# Solution 2 : Utiliser le cache
from playwright_stealth.cache.memory import LRUMemoryCache
cache = LRUMemoryCache(maxsize=256)

# Créer un engine avec cache
# Note: L'utilisation du cache est automatique via l'engine
success = stealth_sync(page, profile=profile)
```

### Fuite mémoire

**Problème :** La mémoire augmente avec chaque injection.

**Solution :**
```python
# Nettoyer les ressources
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
        success = stealth_sync(page)
        # ...
    finally:
        page.close()
        browser.close()

# Vider le cache régulièrement
from playwright_stealth.cache.memory import LRUMemoryCache
cache = LRUMemoryCache(maxsize=100)
cache.clear()  # Nettoyer le cache
```

---

## 🛡️ Problèmes de sites protégés

### Cloudflare Challenge

**Problème :** Page bloquée par Cloudflare.

**Solution :**
```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
from playwright_stealth.core.types import HardwareTier, OSType

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)  # HEADLESS=False
    page = browser.new_page()
    
    # Utiliser un profil personnalisé
    profile = FingerprintProfile.generate(
        hardware_tier=HardwareTier.HIGH,
        os_type=OSType.WINDOWS,
        custom_seed="cloudflare_seed"
    )
    success = stealth_sync(page, profile=profile)
    
    page.goto("https://site-avec-cloudflare.com")
    
    # Attendre que le challenge soit résolu
    page.wait_for_timeout(5000)
    page.wait_for_load_state("networkidle")
    
    # Vérifier le résultat
    if "cloudflare" in page.content().lower():
        print("❌ Toujours bloqué par Cloudflare")
    else:
        print("✅ Cloudflare contourné")
```

### Détection par FingerprintJS

**Problème :** Le site détecte le bot via FingerprintJS.

**Solution :**
```python
from playwright_stealth.core.types import HardwareTier, OSType
from playwright_stealth import stealth_sync

# Utiliser un profil strict
profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.HIGH,
    os_type=OSType.WINDOWS,
    custom_seed="fingerprint_seed"
)
success = stealth_sync(page, profile=profile)

# Vérifier avec un site de test
page.goto("https://fingerprintjs.com/demo/")
visitor_id = page.evaluate("document.querySelector('.visitor-id')?.textContent")
print(f"Visitor ID: {visitor_id}")
```

### Rate Limiting / Blocage IP

**Problème :** L'IP est bloquée après plusieurs requêtes.

**Solution :**
```python
import time
import random

# 1. Ajouter des délais aléatoires
def smart_wait():
    time.sleep(random.uniform(2, 5))

# 2. Rotation des profils
from playwright_stealth.core.types import HardwareTier, OSType
from playwright_stealth.core.profile import FingerprintProfile

def get_random_profile():
    tiers = [HardwareTier.LOW, HardwareTier.MEDIUM, HardwareTier.HIGH]
    tier = random.choice(tiers)
    return FingerprintProfile.generate(
        hardware_tier=tier,
        os_type=OSType.WINDOWS,
        custom_seed=str(random.randint(1, 1000))
    )

# 3. Utiliser des proxies (si configurés)
with sync_playwright() as p:
    browser = p.chromium.launch(
        proxy={"server": "http://proxy.example.com:8080"}
    )
    page = browser.new_page()
    profile = get_random_profile()
    success = stealth_sync(page, profile=profile)
```

---

## 🐛 Debugging avancé

### Activer les logs détaillés

```python
import logging

# Configurer les logs
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("playwright_stealth")

# Activer le debug dans le framework
window.__STEALTH_DEBUG__ = True

from playwright_stealth import stealth_sync
success = stealth_sync(page)
```

### Capturer les erreurs JavaScript

```python
page.on("pageerror", lambda err: print(f"❌ JS Error: {err}"))
page.on("console", lambda msg: print(f"📝 Console: {msg.text}"))

success = stealth_sync(page)
```

### Utiliser le mode headful

```python
# Pour voir ce qui se passe dans le navigateur
browser = p.chromium.launch(headless=False, slow_mo=500)
page = browser.new_page()
success = stealth_sync(page)
```

### Vérifier les modules injectés

```python
# Après injection, vérifier l'état
webdriver = page.evaluate("() => navigator.webdriver")
plugins = page.evaluate("() => navigator.plugins.length")
chrome_runtime = page.evaluate("() => !!window.chrome?.runtime")

print(f"webdriver: {webdriver}")
print(f"plugins: {plugins}")
print(f"chrome.runtime: {chrome_runtime}")
```

---

## 📊 Liste des codes d'erreur

| Code | Description | Solution |
|------|-------------|----------|
| `E001` | Module JS introuvable | Vérifier le chemin du script |
| `E002` | Injection timeout | Utiliser un profil "medium" |
| `E003` | Validation de profil échouée | Utiliser `FingerprintProfile.generate()` |
| `E004` | Navigateur non trouvé | Installer le navigateur |
| `E005` | Cache introuvable | Vérifier la configuration |
| `E006` | Script JS invalide | Vérifier la syntaxe JS |
| `E007` | Import manquant | Installer la dépendance |

---

## 🔗 Ressources utiles

- [Documentation Playwright](https://playwright.dev/python/docs/api/class-page)
- [Issues GitHub](https://github.com/playwright-stealth/playwright-stealth/issues)
- [Documentation du framework](../api/index.md)

---

## 🚀 Prochaine étape

- ❓ [FAQ](../faq.md) - Questions fréquentes
- 🔬 [Techniques de fingerprinting](../advanced/fingerprinting.md)
- 📚 [API Reference](../api/index.md)

---

**Dernière mise à jour** : 2026-07-19  
**Version** : 5.0.0
```

---

## 📋 RÉSUMÉ DES CORRECTIONS APPLIQUÉES

| # | Correction | Statut |
|---|------------|--------|
| 1 | `playwright-stealth-framework` → `playwright-stealth` | ✅ |
| 2 | Commande de patch corrigée (`python scripts/patch.py`) | ✅ |
| 3 | Remplacer `FingerprintProfile.load()` par `.generate()` | ✅ |
| 4 | Supprimer `report.is_valid` et `report.auto_fix()` | ✅ |
| 5 | Supprimer `StealthException` (inexistant) | ✅ |
| 6 | Supprimer `BuilderService.build_plan()` | ✅ |
| 7 | Supprimer `fallback_stealth` (inexistant) | ✅ |
| 8 | Corriger l'exemple d'accès à `profile.hardware` | ✅ |
| 9 | Ajouter `HardwareTier`, `OSType` dans les imports | ✅ |
| 10 | Mise à jour des commandes `pip list` pour Windows/Linux | ✅ |
