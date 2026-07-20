# Journal des modifications (Changelog)

Tous les changements notables apportés au framework Playwright Stealth.

---

## 📋 Vue d'ensemble

Ce journal suit l'évolution du framework selon [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

Les versions suivent le [Semantic Versioning](https://semver.org/lang/fr/) :

- **MAJEUR** : Changements incompatibles avec les versions précédentes
- **MINEUR** : Ajout de fonctionnalités rétrocompatibles
- **PATCH** : Corrections de bugs rétrocompatibles

---

## [5.0.0] - 2026-07-19

### 🎉 Nouveau framework - Version majeure

#### Ajouts majeurs

##### Architecture modulaire
- ✅ Nouvelle architecture basée sur une **plateforme d'ingénierie** modulaire
- ✅ Séparation claire en **Core**, **Services**, **Adapters**, **Models**
- ✅ Système de **plugins** pour l'extension des fonctionnalités
- ✅ API publique **unifiée** pour Playwright et Selenium

##### Profils avancés
- ✅ Profils **HardwareProfile** et **BrowserProfile** personnalisables
- ✅ 6 profils prédéfinis : **low**, **medium**, **high**, **premium**, **macos**, **linux**
- ✅ Support des fichiers de configuration **YAML** pour les profils
- ✅ Système de **seeds** pour la reproductibilité des profils
- ✅ Validation automatique de la **cohérence** des profils

##### Performance
- ✅ Cache **LRU** intégré pour les scripts JavaScript
- ✅ Injection **asynchrone** et **synchrone**
- ✅ Optimisation automatique des **plans d'injection**
- ✅ Benchmarks intégrés avec **métriques détaillées**

##### Compatibilité
- ✅ Support **Python 3.10, 3.11, 3.12, 3.13, 3.14**
- ✅ Support complet **Playwright 1.40+**
- ✅ Support **Selenium 4.0+** (optionnel)
- ✅ Résolution du problème `pkg_resources` pour Python 3.14

#### Nouveaux modules

##### Core
- `core/types.py` : Énumérations, protocoles, types de base
- `core/profile.py` : Profils matériel, navigateur, fingerprint
- `core/engine.py` : Moteur d'orchestration des injections

##### Services
- `services/builder.py` : Construction des plans d'injection
- `services/injector.py` : Injection des scripts JavaScript
- `services/validator.py` : Validation des profils
- `services/capability.py` : Gestion des capacités des modules
- `services/optimizer.py` : Optimisation des plans
- `services/behavior.py` : Simulation comportementale
- `services/telemetry.py` : Métriques et statistiques
- `services/observability.py` : Logs et monitoring

##### Adapters
- `adapters/playwright.py` : Adaptateur Playwright (sync/async)
- `adapters/selenium.py` : Adaptateur Selenium

##### Models
- `models/plan.py` : Plan d'injection
- `models/snapshot.py` : Snapshots de pages
- `models/config.py` : Modèles de configuration
- `models/diff.py` : Rapports de différences
- `models/diagnosis.py` : Diagnostics et recommandations

##### Infrastructure
- `cache/protocol.py` : Protocole de cache
- `cache/memory.py` : Cache LRU en mémoire
- `js/loader.py` : Chargeur de scripts JS
- `config/loader.py` : Chargeur de configurations

#### Scripts d'évasion (42 fichiers)

| Catégorie | Fichiers |
|-----------|----------|
| **Chrome** | `chrome.app.js`, `chrome.csi.js`, `chrome.hairline.js`, `chrome.load.times.js`, `chrome.runtime.js` |
| **Navigator** | `navigator.webdriver.js`, `navigator.userAgent.js`, `navigator.vendor.js`, `navigator.platform.js`, `navigator.languages.js`, `navigator.permissions.js`, `navigator.deviceMemory.js`, `navigator.hardwareConcurrency.js`, `navigator.maxTouchPoints.js`, `navigator.plugins.js`, `navigator.hardware.js` |
| **WebGL** | `webgl.js`, `webgl.vendor.js`, `webgl.anisotropy.js` |
| **Média** | `canvas.js`, `audio.js`, `media.codecs.js`, `fonts.js` |
| **Réseau** | `webrtc.js`, `iframe.contentWindow.js` |
| **Utilitaires** | `utils.js`, `generate.magic.arrays.js`, `errors.js`, `concurrency.js`, `evasions.proxies.js` |
| **Fenêtre/Écran** | `window.outerdimensions.js`, `screen.js`, `intl.js` |

#### Documentation
- ✅ **README.md** - Documentation complète du projet
- ✅ **Guides** : Installation, Quickstart, Configuration, Usage, Migration, Troubleshooting
- ✅ **API Reference** : Core, Services, Adapters, Models, Config
- ✅ **Advanced** : Fingerprinting, Custom Profiles, Testing, Performance, Evasion Modules, Benchmarking
- ✅ **Reference** : Changelog, Contributing, License
- ✅ **FAQ** - Foire aux questions

#### Tests
- ✅ **63 tests unitaires** - 100% de réussite
- ✅ **14 tests d'intégration** - 100% de réussite
- ✅ **Benchmarks** - < 0.1ms par injection

#### Configuration
- ✅ 3 profils YAML (Windows 11, Windows 10, macOS)
- ✅ 3 politiques YAML (strict, balanced, performance)
- ✅ 4 fichiers JSON de capacités (Chromium 136-139)

### 🚀 Nouvelle API publique

#### Fonctions principales
```python
# Playwright synchrone
from playwright_stealth import stealth_sync
stealth_sync(page, hardware_tier=HardwareTier.MEDIUM, os_type=OSType.WINDOWS)

# Playwright asynchrone
from playwright_stealth import stealth_async
await stealth_async(page)

# Selenium
from playwright_stealth import stealth_selenium
stealth_selenium(driver)

# Génération de profil
from playwright_stealth import FingerprintProfile, HardwareTier, OSType
profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.HIGH,
    os_type=OSType.WINDOWS,
    custom_seed="my_seed"
)
Classes principales
python
# Profils
FingerprintProfile
HardwareProfile
BrowserProfile

# Services
BuilderService
InjectorService
ProfileValidator
CapabilityResolver

# Modèles
InjectionPlan
🔧 Migration
Breaking Changes
❌ API stealth() renommée en stealth_sync()

❌ Classe Profile renommée en FingerprintProfile

❌ Paramètre options remplacé par profile

❌ Suppression de la dépendance pkg_resources

Migration Guide
Guide complet dans Guides/Migration

🐛 Corrections
✅ Correction de la compatibilité Python 3.14

✅ Correction du chargement des scripts JS

✅ Correction de la validation des profils

✅ Correction du cache LRU

📦 Dépendances
Nouvelles dépendances
playwright>=1.40.0

cachetools>=5.0.0

pyyaml>=6.0

pytest>=9.0.0

psutil>=7.0.0

Dépendances optionnelles
selenium>=4.0.0

[Historique] - Versions antérieures
Les versions antérieures (4.x) correspondent à l'ancien package playwright-stealth qui a servi de base à ce framework.

Version 4.3.0 - 2026-06-15
Support partiel de Selenium

Amélioration des scripts d'évasion

Version 4.0.0 - 2026-03-01
Première version publique

Framework de base avec scripts d'évasion

📊 Statistiques par version
Version	Date	Modules	Tests	Docs
5.0.0	2026-07-19	42	77	26
4.3.0	2026-06-15	18	35	12
4.0.0	2026-03-01	10	15	6
🔮 Roadmap à venir
Version 5.1.0 (2026-08)
Planifiés
📦 Intégration avec Selenium Grid

🔄 Support de Firefox complet

📊 Tableau de bord des performances

🔌 Plugin System officiel

Version 5.2.0 (2026-09)
Planifiés
🌐 Support WebKit complet

📱 Support mobile (Android/iOS)

📝 Convention de commit
Nous suivons la convention Conventional Commits :

text
feat: Ajout de la fonctionnalité X
fix: Correction du bug Y
docs: Mise à jour de la documentation
style: Formatage du code
refactor: Refactorisation du code
perf: Optimisation des performances
test: Ajout de tests
chore: Maintenance
🔗 Liens utiles
Guide de migration - Migrer vers la dernière version

Guide de contribution - Contribuer au projet

Documentation API - Référence complète

Dernière mise à jour : 2026-07-19
Version : 5.0.0