# 📄 FICHIER CORRIGÉ : `documentations/guides/migration.md`

```markdown
# Guide de migration

Ce guide vous aide à migrer depuis les versions antérieures du framework vers la **v5.0**.

---

## 📋 Vue d'ensemble des changements

| Version | Changements majeurs |
|---------|---------------------|
| **v5.0** | Architecture modulaire, API unifiée, profils avancés |
| **v4.x** | API legacy, scripts intégrés, pas de profils |
| **v3.x** | Ancienne API, dépendance à `pkg_resources` |

### Principales améliorations v5.0

- ✅ **API unifiée** pour Playwright et Selenium
- ✅ **Profils matériel/navigateur** personnalisables
- ✅ **Cache intégré** (LRU) pour meilleures performances
- ✅ **Validation** automatique des profils
- ✅ **Support Python 3.10+** (incluant 3.14)
- ✅ **Architecture modulaire** et extensible

---

## 🔄 Migration depuis v4.x

### Avant (v4.x)

```python
from playwright_stealth import stealth

# Injection simple
stealth(page)

# Avec des options
stealth(page, options={
    'webgl': True,
    'canvas': True,
    'webrtc': True
})
```

### Après (v5.0)

```python
from playwright_stealth import stealth_sync
from playwright_stealth.core.types import HardwareTier, OSType

# Injection simple (même comportement)
stealth_sync(page)

# Avec des options (via profil)
from playwright_stealth.core.profile import FingerprintProfile

profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.MEDIUM,
    os_type=OSType.WINDOWS
)
stealth_sync(page, profile=profile)
```

---

## 📊 Mapping des fonctionnalités

### Options v4.x → Profils v5.0

| Option v4.x | Mapping v5.0 |
|-------------|--------------|
| `webgl: True` | Inclus par défaut dans `FingerprintProfile.generate()` |
| `canvas: True` | Inclus par défaut |
| `webrtc: True` | Inclus par défaut dans tous les profils |
| `navigator: True` | Inclus par défaut |
| `user_agent: "custom"` | `BrowserProfile.from_os()` ou profil YAML personnalisé |

### Exemple de migration

**v4.x :**
```python
from playwright_stealth import stealth

stealth(page, options={
    'webgl': True,
    'canvas': True,
    'navigator': True,
    'plugins': True
})
```

**v5.0 :**
```python
from playwright_stealth import stealth_sync
from playwright_stealth.core.types import HardwareTier, OSType

# Option 1 : Profil par défaut
stealth_sync(page)

# Option 2 : Profil personnalisé
from playwright_stealth.core.profile import FingerprintProfile

profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.HIGH,
    os_type=OSType.WINDOWS,
    custom_seed="my_seed_123"
)
stealth_sync(page, profile=profile)
```

---

## 🔄 Migration depuis v3.x

### Avant (v3.x)

```python
from playwright_stealth import Stealth

# Création d'une instance
stealth = Stealth()

# Application
stealth.stealth(page)
```

### Après (v5.0)

```python
from playwright_stealth import stealth_sync

# Pas d'instance nécessaire, fonction directe
stealth_sync(page)
```

---

## 📝 Migration manuelle des imports

### Tableau de correspondance

| Import v4.x | Import v5.0 |
|-------------|-------------|
| `from playwright_stealth import stealth` | `from playwright_stealth import stealth_sync` |
| `from playwright_stealth import Stealth` | `from playwright_stealth import stealth_sync` |
| `from playwright_stealth import stealth_async` | `from playwright_stealth import stealth_async` (inchangé) |
| `from playwright_stealth import stealth_selenium` | `from playwright_stealth import stealth_selenium` (inchangé) |
| `from playwright_stealth.core import Profile` | `from playwright_stealth.core.profile import FingerprintProfile` |

### Code avant

```python
# v4.x
from playwright_stealth import stealth
from playwright_stealth.core import Profile

profile = Profile()
profile.os = "Windows 11"
profile.user_agent = "Mozilla/5.0..."
stealth(page, profile=profile)
```

### Code après

```python
# v5.0
from playwright_stealth import stealth_sync
from playwright_stealth.core.profile import FingerprintProfile
from playwright_stealth.core.types import HardwareTier, OSType

profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.MEDIUM,
    os_type=OSType.WINDOWS
)
stealth_sync(page, profile=profile)
```

---

## 🔧 Migration des configurations

### Fichiers YAML v4.x

**v4.x configuration.yaml :**
```yaml
# v4.x
modules:
  webgl: true
  canvas: true
  webrtc: true
  navigator: true
  
user_agent: "custom"
```

**v5.0 configuration.yaml :**
```yaml
# v5.0
id: custom_profile
hardware:
  tier: medium
  cpu: Intel Core i5-1135G7
  cpu_cores: 4
  ram: 8
  gpu: Intel Iris Xe Graphics
  screen: [1920, 1080]
  dpi: 1.0

browser:
  os: windows
  version: 139.0.0.0
  chrome_version: 139.0.0.0
  platform: Win32
  locale: fr-FR
  languages: [fr-FR, fr, en-US, en]
  timezone: Europe/Paris
  user_agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36
  accept_language: fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7

modules:
  enabled:
    - webdriver
    - chrome_runtime
    - canvas
    - audio
    - intl
    - webgl
    - permissions

policies:
  consistency: balanced
  performance: balanced
```

---

## 🐛 Problèmes courants et solutions

### 1. `ModuleNotFoundError: No module named 'stealth'`

**Problème :** L'ancienne API a été renommée.

**Solution :**
```python
# Avant
from playwright_stealth import stealth

# Après
from playwright_stealth import stealth_sync  # ou stealth_async
```

### 2. `AttributeError: 'Profile' object has no attribute 'os'`

**Problème :** La structure de `Profile` a changé.

**Solution :**
```python
# Avant
profile.os = "Windows 11"

# Après
from playwright_stealth.core.types import OSType
from playwright_stealth.core.profile import FingerprintProfile

profile = FingerprintProfile.generate(
    os_type=OSType.WINDOWS
)
```

### 3. `TypeError: stealth_sync() got an unexpected keyword argument 'options'`

**Problème :** Le paramètre `options` a été remplacé par `profile`.

**Solution :**
```python
# Avant
stealth(page, options={'webgl': True})

# Après
stealth_sync(page)  # Les modules sont inclus par défaut
```

### 4. `ImportError: cannot import name 'Profile'`

**Problème :** `Profile` a été renommé `FingerprintProfile`.

**Solution :**
```python
# Avant
from playwright_stealth.core import Profile

# Après
from playwright_stealth.core.profile import FingerprintProfile
```

---

## 📊 Tableau de compatibilité

| Feature | v3.x | v4.x | v5.0 |
|---------|------|------|------|
| `stealth(page)` | ❌ | ✅ | ✅ (renommé `stealth_sync`) |
| `Stealth()` | ✅ | ❌ | ❌ |
| `Profile` | ❌ | ✅ | ✅ (renommé `FingerprintProfile`) |
| `options` | ❌ | ✅ | ❌ (remplacé par `profile`) |
| `profile` | ❌ | ❌ | ✅ |
| `cache` | ❌ | ❌ | ✅ |
| `validation` | ❌ | ❌ | ✅ |

---

## 🚀 Prochaine étape

- 📖 [Guide de configuration avancée](configuration.md)
- 🔬 [Techniques de fingerprinting](../advanced/fingerprinting.md)
- ❓ [FAQ](../faq.md)

---

**Dernière mise à jour** : 2026-07-19  
**Version** : 5.0.0
```

---

## 📋 RÉSUMÉ DES CORRECTIONS APPLIQUÉES

| # | Correction | Statut |
|---|------------|--------|
| 1 | Suppression de la section "Script de migration automatique" (inexistant) | ✅ |
| 2 | Remplacement de `FingerprintProfile.load()` par `.generate()` | ✅ |
| 3 | Correction de l'exemple v4.x avec `Profile` | ✅ |
| 4 | Suppression de la commande `python -m playwright_stealth.scripts.migrate` | ✅ |
| 5 | Mise à jour des imports avec `HardwareTier`, `OSType` | ✅ |
| 6 | Mise à jour du YAML v5.0 avec la structure réelle | ✅ |
| 7 | Mise à jour des exemples de migration | ✅ |
