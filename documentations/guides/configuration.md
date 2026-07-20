# 📄 FICHIER CORRIGÉ : `documentations/guides/configuration.md`

```markdown
# Guide de configuration

Le framework Playwright Stealth offre une configuration flexible pour s'adapter à vos besoins, du scraping simple aux cas d'usage avancés.

---

## 📋 Vue d'ensemble

La configuration se fait à plusieurs niveaux :

| Niveau        | Description                               | Méthode              |
|---------------|-------------------------------------------|----------------------|
| **Profils**   | Configuration matérielle et navigateur    | YAML / Python        |
| **Politiques**| Stratégies d'injection                    | YAML / Python        |
| **Capacités** | Modules d'évasion compatibles             | JSON                 |
| **Runtime**   | Paramètres d'exécution                    | Variables d'environnement |

---

## 🎯 Configuration des profils

### 1. Profils prédéfinis

Le framework inclut 3 profils prêts à l'emploi via `FingerprintProfile.generate()` :

```python
from playwright_stealth import stealth_sync
from playwright_stealth.core.profile import FingerprintProfile
from playwright_stealth.core.types import HardwareTier, OSType, BrowserVendor

# Profil par défaut (balanced)
profile = FingerprintProfile.generate()

# Profil haute performance
profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.HIGH,
    os_type=OSType.WINDOWS,
    browser_vendor=BrowserVendor.CHROME
)

# Profil macOS
profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier.HIGH,
    os_type=OSType.MACOS,
    browser_vendor=BrowserVendor.CHROME
)

# Utilisation
stealth_sync(page, profile=profile)
```

---

### 2. Profil personnalisé en Python

```python
from playwright_stealth.core.profile import (
    FingerprintProfile,
    HardwareProfile,
    BrowserProfile,
)
from playwright_stealth.core.types import OSType, BrowserVendor

profile = FingerprintProfile(
    hardware=HardwareProfile(
        cpu_cores=8,
        cpu_model="Intel Core i7-12700K",
        ram_gb=32,
        device_memory=8,
        gpu_vendor="NVIDIA Corporation",
        gpu_renderer="ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11)",
        gpu_model="NVIDIA GeForce RTX 4080",
        screen_resolution=(1920, 1080),
        color_depth=24,
        pixel_depth=24,
        device_pixel_ratio=1.0,
        webgl_extensions=("ANGLE_instanced_arrays", "EXT_blend_minmax"),
        max_texture_size=16384,
        max_combined_texture_image_units=80,
        max_vertex_uniform_vectors=128,
        max_fragment_uniform_vectors=64,
        max_varying_vectors=8
    ),
    browser=BrowserProfile(
        os_type=OSType.WINDOWS,
        vendor=BrowserVendor.CHROME,
        version="120.0.6099.130",
        chrome_version="120.0.6099.130",
        os_version="11",
        platform="Win32",
        platform_version="10.0.0",
        locale="fr-FR",
        languages=("fr-FR", "fr", "en-US", "en"),
        timezone="Europe/Paris",
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        accept_language="fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        platform_hint="Windows",
        platform_version_hint="10.0.0",
        pdf_viewer_enabled=True,
        fonts=("Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Tahoma"),
        plugins=(
            ("Chrome PDF Plugin", "internal-pdf-viewer"),
            ("Chrome PDF Viewer", "mhjfbmdgcfjbbpaeojofohoefgiehjai"),
            ("Native Client", "internal-nacl-plugin"),
        ),
        speech_voices=(
            {"name": "Google US English", "lang": "en-US"},
            {"name": "Google UK English Female", "lang": "en-GB"},
            {"name": "Google français", "lang": "fr-FR"},
        )
    ),
    seed=42  # Pour la reproductibilité
)
```

---

### 3. Profil via fichier YAML

Créez un fichier `my_profile.yaml` :

```yaml
# my_profile.yaml
id: my_profile
hardware:
  tier: high
  cpu: AMD Ryzen 9 7950X
  cpu_cores: 12
  ram: 64
  gpu: AMD Radeon RX 7900 XTX
  gpu_vendor: AMD
  gpu_renderer: ANGLE (AMD, AMD Radeon RX 7900 XTX Direct3D11)
  screen: [2560, 1440]
  dpi: 1.25

browser:
  os: windows
  version: 139.0.0.0
  chrome_version: 139.0.0.0
  platform: Win32
  platform_version: 10.0.0
  locale: fr-FR
  languages: [fr-FR, fr, en-US, en]
  timezone: Europe/Paris
  user_agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36
  accept_language: fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7
  fonts: [Arial, Helvetica, Times New Roman, Courier New, Verdana, Georgia, Tahoma]

modules:
  enabled:
    - webdriver
    - chrome_runtime
    - canvas
    - audio
    - intl
    - webgl
    - permissions
    - user_agent_data
    - pdf_viewer

policies:
  consistency: strict
  performance: balanced
```

Chargez-le dans votre code :

```python
from playwright_stealth.config.loader import ConfigLoader
from playwright_stealth.core.profile import FingerprintProfile
from playwright_stealth.core.types import HardwareTier, OSType
from playwright_stealth import stealth_sync

loader = ConfigLoader()

# Charger le profil (retourne un dictionnaire)
profile_data = loader.load_profile("my_profile")

# Convertir en FingerprintProfile
profile = FingerprintProfile.generate(
    hardware_tier=HardwareTier(profile_data["hardware"]["tier"]),
    os_type=OSType(profile_data["browser"]["os"])
)

stealth_sync(page, profile=profile)
```

---

## 🔧 Politiques d'injection

Les politiques définissent comment les modules d'évasion sont injectés.

### 1. Politiques prédéfinies

```python
from playwright_stealth.config.loader import ConfigLoader
from playwright_stealth.core.types import EvasionModule

# Charger une politique YAML
loader = ConfigLoader()
policy = loader.load_policy("balanced")  # ou "strict", "performance"

# Utiliser la politique pour filtrer les modules
# Les modules sont filtrés via CapabilityResolver
```

### 2. Politique personnalisée en YAML

Créez `custom_policy.yaml` :

```yaml
# custom_policy.yaml
consistency: strict
performance: balanced
fallback: auto
retry:
  max: 3
  delay: 1.0
validation:
  hardware: true
  browser: true
  locale: true
  network: false
  display: false
modules:
  require_all: false
  allow_fallback: true
injection:
  verify_checksum: true
  optimize: true
```

Utilisation :

```python
from playwright_stealth.config.loader import ConfigLoader

loader = ConfigLoader()
policy = loader.load_policy("custom_policy")
print(f"Politique chargée: {policy.get('consistency')}")
```

---

## 📊 Configuration des capacités

Les capacités définissent la compatibilité des modules avec chaque version de navigateur.

### Structure des fichiers JSON

```json
// config/capabilities/chromium/139.json
{
  "version": "139.0.0.0",
  "features": {
    "webgpu": {"supported": true, "experimental": true},
    "fedcm": {"supported": true, "experimental": true},
    "storage_buckets": {"supported": true, "experimental": true},
    "private_network_access": {"supported": true},
    "navigator_uadata": {"supported": true},
    "pdf_viewer": {"supported": true},
    "webgl2": {"supported": true},
    "webgl_extensions": {"supported": true}
  },
  "apis": {
    "storage": {"status": "stable"},
    "permissions": {"status": "stable"},
    "webgpu": {"status": "experimental"},
    "fedcm": {"status": "experimental"},
    "storage_buckets": {"status": "experimental"}
  },
  "deprecations": [],
  "experimental": ["webgpu", "fedcm", "storage_buckets"]
}
```

### Chargement des capacités

```python
from playwright_stealth.config.loader import ConfigLoader
from playwright_stealth.services.capability import CapabilityRegistry, CapabilityResolver

# Charger les capacités
loader = ConfigLoader()
caps_data = loader.load_capabilities("139")

# Créer le registre et le résolveur
registry = CapabilityRegistry()
capabilities = registry.load("139")

resolver = CapabilityResolver(registry)

# Vérifier le support d'une fonctionnalité
supports_webgpu = resolver.supports("webgpu", "139")
print(f"WebGPU supporté: {supports_webgpu}")
```

---

## 🌐 Configuration runtime

### Variables d'environnement

```bash
# Taille du cache des scripts JS
export PLAYWRIGHT_STEALTH_CACHE_SIZE=2048

# Mode debug (logs détaillés)
export PLAYWRIGHT_STEALTH_DEBUG=true

# Désactiver la validation
export PLAYWRIGHT_STEALTH_VALIDATION=false

# Timeout d'injection en ms
export PLAYWRIGHT_STEALTH_TIMEOUT=10000

# Seed pour la génération des profils
export PLAYWRIGHT_STEALTH_SEED=42
```

### Configuration dans le code

```python
from playwright_stealth import stealth_sync
from playwright_stealth.core.types import HardwareTier, OSType

# Configuration via paramètres
success = stealth_sync(
    page,
    hardware_tier=HardwareTier.HIGH,
    os_type=OSType.WINDOWS,
    custom_seed="my_seed_123"
)

if success:
    print("✅ Injection réussie")
```

---

## 🔍 Validation et diagnostic

### Validation automatique

Le framework valide automatiquement la cohérence des profils :

```python
from playwright_stealth.services.validator import ProfileValidator
from playwright_stealth.core.profile import FingerprintProfile

validator = ProfileValidator()

# Créer un profil
profile = FingerprintProfile.generate()

# Valider le profil (retourne une liste d'erreurs)
errors = validator.validate(profile)

if not errors:
    print("✅ Profil valide")
else:
    for error in errors:
        print(f"⚠️ {error}")
```

### Types d'erreurs détectées

| Erreur              | Description                                 | Correction                                  |
|---------------------|---------------------------------------------|---------------------------------------------|
| `RAM_MISMATCH`      | RAM système vs Device Memory                | Ajuster `ram_gb` ou `device_memory`         |
| `GPU_INCONSISTENT`  | GPU déclaré vs détection                    | Vérifier le GPU dans le profil              |
| `UA_MISMATCH`       | User-Agent incohérent avec l'OS             | Mettre à jour le User-Agent                 |
| `LOCALE_MISMATCH`   | Locale incohérente avec le fuseau horaire   | Ajuster `locale` ou `timezone`              |

---

## 📝 Exemple de configuration complète

```python
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
from playwright_stealth.core.profile import FingerprintProfile
from playwright_stealth.core.types import HardwareTier, OSType, BrowserVendor
from playwright_stealth.config.loader import ConfigLoader
from playwright_stealth.services.validator import ProfileValidator

def main():
    # 1. Charger la configuration
    loader = ConfigLoader()
    config = loader.load_profile("windows_11_chrome_139")

    # 2. Créer un profil
    profile = FingerprintProfile.generate(
        hardware_tier=HardwareTier(config["hardware"]["tier"]),
        os_type=OSType(config["browser"]["os"]),
        browser_vendor=BrowserVendor.CHROME,
        custom_seed="production_seed_123"
    )

    # 3. Valider le profil
    validator = ProfileValidator()
    errors = validator.validate(profile)
    if errors:
        print(f"⚠️ Problèmes détectés: {errors}")

    # 4. Charger la politique
    policy = loader.load_policy("balanced")
    print(f"Politique: {policy.get('consistency')}")

    # 5. Exécuter l'injection
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        success = stealth_sync(page, profile=profile)

        if success:
            print("✅ Injection réussie")
            page.goto("https://example.com")
            print(f"✅ Titre: {page.title()}")
        else:
            print("❌ Échec de l'injection")

        browser.close()

if __name__ == "__main__":
    main()
```

---

## 🎯 Résumé des options de configuration

| Méthode                 | Quand l'utiliser                                  |
|-------------------------|---------------------------------------------------|
| **Profils prédéfinis**  | Cas d'usage standard, démarrage rapide           |
| **Profil Python**       | Personnalisation avancée, logique programmatique |
| **Profil YAML**         | Configuration réutilisable, partage              |
| **Politiques YAML**     | Stratégies d'injection complexes                  |
| **Variables d'env**     | Configuration runtime, CI/CD                      |
| **Paramètres de fonction** | Cas spécifiques, tests unitaires              |

---

## 🚀 Prochaine étape

Pour aller plus loin :

- 📖 Guide d'utilisation (`guides/usage.md`) – Workflows complexes
- 🔬 Techniques de fingerprinting (`advanced/fingerprinting.md`) – Comprendre les détecteurs
- ⚡ Optimisation des performances (`advanced/performance.md`) – Accélérer vos scrapings

---

**Dernière mise à jour** : 2026-07-19
**Version** : 5.0.0
```

---

## 📋 RÉSUMÉ DES CORRECTIONS APPLIQUÉES

| # | Correction | Statut |
|---|------------|--------|
| 1 | Remplacer `FingerprintProfile.load()` par `.generate()` | ✅ |
| 2 | `ConfigLoader.load_profile()` retourne un dict, pas un objet | ✅ |
| 3 | `ConfigLoader.load_policy()` retourne un dict | ✅ |
| 4 | Correction de `BuilderService.build_plan()` (supprimé) | ✅ |
| 5 | Suppression de `ConfigLoader.load()` | ✅ |
| 6 | Suppression de `report.auto_fix()` et `report.is_valid` | ✅ |
| 7 | Mise à jour de `CapabilityResolver.resolve()` | ✅ |
| 8 | Mise à jour de l'exemple complet | ✅ |
| 9 | Ajout des imports `HardwareTier`, `OSType`, `BrowserVendor` | ✅ |
