[![Python Version](https://img.shields.io/badge/python-3.10+-blue.svg)](https://python.org)
[![Playwright](https://img.shields.io/badge/Playwright-1.40+-green.svg)](https://playwright.dev)
[![Selenium](https://img.shields.io/badge/Selenium-4.0+-orange.svg)](https://selenium.dev)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **Framework anti-détection pour Playwright et Selenium**  
> Évitez la détection lors du scraping, de l'automatisation et des tests E2E.

---

## ✨ Pourquoi Playwright Stealth ?

Les sites modernes utilisent des techniques avancées de **fingerprinting** pour détecter les bots :

- ✅ **WebGL & Anisotropy** – Détection des GPU virtuels et filtrage des textures
- ✅ **Canvas** – Fingerprinting par rendu
- ✅ **WebRTC** – Détection des IP locales
- ✅ **Client-Hints** – `userAgentData` et métriques matérielles
- ✅ **Navigator** – Propriétés du navigateur (plugins, languages, etc.)
- ✅ **User-Agent** – Cohérence avec l'OS et le navigateur
- ✅ **Stack Traces** – Nettoyage des traces d'exécution

**Playwright Stealth** applique automatiquement des **scripts d'évasion** pour masquer ces traces.

---

## 🚀 Installation rapide

```bash
# Installation du package
pip install playwright-stealth

# Installation du navigateur Chromium
playwright install chromium
💻 Exemple minimal
python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Une seule ligne suffit !
    stealth_sync(page)

    page.goto("https://example.com")
    print(f"✅ Titre : {page.title()}")

    browser.close()
🧬 Profils personnalisés
python
from playwright_stealth import stealth_sync, FingerprintProfile, HardwareTier, OSType

# Générer un profil haute performance
profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.HIGH,
    os_type=OSType.WINDOWS,
    custom_seed="my_seed_123"
)

stealth_sync(page, profile=profile)
📖 Documentation complète
Section	Description
📘 Installation	Installation détaillée et prérequis
🚀 Démarrage rapide	Premier script en 5 minutes
⚙️ Configuration	Configuration des profils et politiques
📚 API Reference	Documentation complète de l'API
🔬 Avancé	Techniques de fingerprinting et modules
📝 Exemples	Exemples de code concrets
❓ FAQ	Foire aux questions
🎯 Cas d'usage
Cas d'usage	Description
Scraping	Extraction de données sans être bloqué
Tests E2E	Tests d'interface utilisateur réalistes
Automatisation	Workflows web automatisés
Analyse de marché	Surveillance des prix et des concurrents
SEO	Analyse des SERP et des mots-clés
🧩 Fonctionnalités clés
✅ Injection transparente
python
# Playwright (sync)
stealth_sync(page)

# Playwright asynchrone
await stealth_async(page)

# Selenium
stealth_selenium(driver)
🧬 Profils personnalisables
python
from playwright_stealth import stealth_sync, FingerprintProfile, HardwareTier, OSType

profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.HIGH,
    os_type=OSType.WINDOWS,
    custom_seed="my_seed"
)

stealth_sync(page, profile=profile)
🎯 Validation intégrée
Détection des incohérences (RAM / Device Memory, GPU, User-Agent)

Recommandations automatiques

Diagnostics détaillés

⚡ Performance optimisée
Cache LRU des scripts JS

Injection asynchrone

Profils pré-générés

📦 Dépendances
Principales
txt
playwright>=1.40.0
cachetools>=5.0.0
pyyaml>=6.0
Optionnelles
txt
selenium>=4.0.0    # Pour l'adaptateur Selenium
pytest>=9.0.0      # Pour les tests
psutil>=7.0.0      # Pour les métriques système
🧪 Tests
bash
# Tests unitaires
python -m pytest tests/unit/ -v

# Tests d'intégration
python -m pytest tests/integration/ -v

# Benchmarks
python run_benchmark.py
Résultats actuels :

✅ 63 tests unitaires – 100% de réussite

✅ 14 tests d'intégration – 100% de réussite

⚡ Benchmarks – < 0.1 ms par injection

🤝 Contribution
Nous accueillons les contributions ! Consultez notre guide de contribution.

Rapport de bugs
Ouvrez une issue GitHub

Incluez : version Python, OS, Playwright/Selenium, et un exemple minimal

Suggestions d'amélioration
Discutez sur Discord

Proposez des PR

📄 License
Ce projet est sous licence MIT. Voir LICENSE pour plus de détails.

🌟 Supportez le projet
⭐ Star le dépôt sur GitHub

🐛 Reportez les bugs

📝 Contribuez à la documentation

💬 Partagez votre expérience

🔗 Liens utiles
Documentation Playwright

Documentation Selenium

Guide du fingerprinting

Changelog

Dernière mise à jour : 2026-07-19
Version : 5.0.0
```
