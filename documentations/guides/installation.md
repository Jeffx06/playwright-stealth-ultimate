# 📄 FICHIER CORRIGÉ : `documentations/guides/installation.md`

```markdown
# Guide d'installation

Bienvenue dans le guide d'installation du framework Playwright Stealth.

---

## Prérequis

### Version de Python

Le framework est compatible avec :

| Version     | Support | Statut            |
|------------|---------|-------------------|
| Python 3.10| ✅      | Support complet   |
| Python 3.11| ✅      | Support complet   |
| Python 3.12| ✅      | Support complet   |
| Python 3.13| ✅      | Support complet   |
| Python 3.14| ✅      | Support complet   |

### Systèmes d'exploitation

- Windows 10 / 11  
- macOS 12+ (Monterey, Ventura, Sonoma, Sequoia)  
- Linux (Ubuntu 20.04+, Debian 11+, Fedora 36+)  

### Dépendances système

- Playwright : nécessite les dépendances système Playwright.  
- Selenium (optionnel) : ChromeDriver / GeckoDriver.

---

## Installation du package

### Installation standard

```bash
pip install playwright-stealth
```

### Avec support Selenium

```bash
pip install playwright-stealth[selenium]
```

### Installation complète (tests + développement)

```bash
pip install playwright-stealth[dev]
```

---

## Installation des navigateurs

### Playwright (recommandé)

```bash
# Installation de Chromium uniquement (recommandé)
playwright install chromium

# Installation de tous les navigateurs
playwright install

# Installation avec dépendances système (Linux)
playwright install --with-deps
```

### Selenium (optionnel)

```bash
# Chrome / Chromium
pip install webdriver-manager
python -c "from webdriver_manager.chrome import ChromeDriverManager; ChromeDriverManager().install()"

# Firefox
python -c "from webdriver_manager.firefox import GeckoDriverManager; GeckoDriverManager().install()"
```

---

## Vérification de l'installation

### Vérification rapide

```python
import playwright_stealth
print(f"✅ Version : {playwright_stealth.__version__}")
```

Résultat attendu :

```text
✅ Version : 5.0.0
```

### Vérification complète

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    stealth_sync(page)
    print("✅ Installation réussie !")
    browser.close()
```

---

## Résolution des problèmes courants

### Erreur : `ModuleNotFoundError: No module named 'cachetools'`

Solution :

```bash
pip install cachetools
```

### Erreur : `ModuleNotFoundError: No module named 'yaml'`

Solution :

```bash
pip install pyyaml
```

### Erreur : `playwright._impl._api_types.Error: Browser not found`

Solution :

```bash
# Installer le navigateur manquant
playwright install chromium
# Ou forcer la réinstallation
playwright install --force
```

### Erreur : `ImportError: cannot import name 'resource_string'`

Problème connu avec Python 3.14.

Solution :

```bash
# Le framework inclut déjà le patch automatique.
# Vous pouvez aussi exécuter manuellement :
python scripts/patch.py
```

### Erreur : `Permission denied` sur Linux

Solution :

```bash
# Ajouter les permissions d'exécution
chmod +x $(which playwright)

# Ou réinstaller avec sudo (non recommandé)
sudo pip install playwright-stealth
```

---

## Installation pour le développement

```bash
# Cloner le dépôt
git clone https://github.com/playwright-stealth/playwright-stealth.git
cd playwright-stealth

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux / macOS
# ou
venv\Scripts\activate     # Windows

# Installer en mode développement
pip install -e .[dev]

# Lancer les tests
python -m pytest tests/unit/ -v
```

---

## Configuration avancée

### Variables d'environnement

| Variable                       | Description               | Valeur par défaut |
|--------------------------------|---------------------------|-------------------|
| `PLAYWRIGHT_STEALTH_CACHE_SIZE`| Taille du cache LRU       | `1024`            |
| `PLAYWRIGHT_STEALTH_DEBUG`     | Mode debug                | `false`           |
| `PLAYWRIGHT_STEALTH_JS_DIR`    | Répertoire des scripts JS | `./js/`           |

### Exemple de configuration

```bash
# Activer le mode debug
export PLAYWRIGHT_STEALTH_DEBUG=true

# Augmenter la taille du cache
export PLAYWRIGHT_STEALTH_CACHE_SIZE=2048
```

---

## Dépendances détaillées

### Dépendances principales

| Package      | Version    | Utilisation                         |
|--------------|-----------|--------------------------------------|
| `playwright` | >= 1.40.0 | Automatisation du navigateur         |
| `cachetools` | >= 5.0.0  | Cache LRU des scripts JS            |
| `pyyaml`     | >= 6.0    | Chargement des profils YAML         |

### Dépendances optionnelles

| Package            | Version    | Utilisation              |
|--------------------|-----------|--------------------------|
| `selenium`         | >= 4.0.0  | Adaptateur Selenium      |
| `pytest`           | >= 9.0.0  | Tests unitaires          |
| `psutil`           | >= 7.0.0  | Métriques système        |
| `webdriver-manager`| >= 4.0.0  | Gestion des drivers      |

---

## Prochaine étape

Maintenant que le framework est installé, continue avec le :

👉 [Guide de démarrage rapide](quickstart.md)

---

**Dernière mise à jour** : 2026-07-19  
**Version du framework** : 5.0.0
```

---

## 📋 RÉSUMÉ DES CORRECTIONS APPLIQUÉES

| # | Correction | Statut |
|---|------------|--------|
| 1 | `playwright-stealth-framework` → `playwright-stealth` (ligne 34) | ✅ |
| 2 | `playwright-stealth-framework[selenium]` → `playwright-stealth[selenium]` (ligne 40) | ✅ |
| 3 | `playwright-stealth-framework[dev]` → `playwright-stealth[dev]` (ligne 46) | ✅ |
| 4 | `sudo pip install playwright-stealth-framework` → `sudo pip install playwright-stealth` (ligne 120) | ✅ |
| 5 | `python -m playwright_stealth.scripts.patch` → `python scripts/patch.py` (ligne 107) | ✅ |
