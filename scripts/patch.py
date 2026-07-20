# scripts/patch.py
#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de patch automatique pour playwright-stealth.
Corrige les problèmes de compatibilité avec Python 3.14+.
"""

import os
import sys
import shutil
import site
from pathlib import Path
from typing import Optional


# =============================================================================
# Constantes
# =============================================================================

PATCHED_FILE_CONTENT = '''# -*- coding: utf-8 -*-
"""
Playwright Stealth - Version patchée pour Python 3.14+
Supprime toute dépendance à pkg_resources
"""
import json
from dataclasses import dataclass
from typing import Tuple, Optional, Dict
from pathlib import Path
import os

# =============================================================================
# Fonction de lecture des fichiers JS
# =============================================================================

def from_file(name: str) -> str:
    """
    Lit un fichier JS depuis le dossier js/ du package.
    Compatible Python 3.14+ sans pkg_resources.
    """
    try:
        # Méthode 1: importlib.resources (Python 3.9+)
        try:
            import importlib.resources
            ref = importlib.resources.files('playwright_stealth') / f'js/{name}'
            return ref.read_text(encoding='utf-8')
        except (AttributeError, TypeError, ImportError, ValueError):
            pass

        # Méthode 2: Lecture directe depuis le même dossier
        current_dir = Path(__file__).parent
        js_path = current_dir / 'js' / name
        if js_path.exists():
            return js_path.read_text(encoding='utf-8')

        # Méthode 3: Chercher dans site-packages
        import site
        for site_path in site.getsitepackages():
            full_path = Path(site_path) / 'playwright_stealth' / 'js' / name
            if full_path.exists():
                return full_path.read_text(encoding='utf-8')

        # Méthode 4: Chercher dans le chemin du module
        try:
            import importlib.util
            spec = importlib.util.find_spec('playwright_stealth')
            if spec and spec.origin:
                base_path = Path(spec.origin).parent
                full_path = base_path / 'js' / name
                if full_path.exists():
                    return full_path.read_text(encoding='utf-8')
        except:
            pass

        print(f"⚠️ Fichier JS non trouvé: {name}")
        return ''

    except Exception as e:
        print(f"⚠️ Erreur chargement {name}: {e}")
        return ''

# =============================================================================
# Chargement des scripts JS
# =============================================================================

print("📦 Chargement des scripts stealth...")

_scripts = {}
_script_names = [
    'chrome.app.js',
    'chrome.csi.js',
    'chrome.load.times.js',
    'chrome.runtime.js',
    'navigator.connection.js',
    'navigator.device_memory.js',
    'navigator.do_not_track.js',
    'navigator.hardware_concurrency.js',
    'navigator.languages.js',
    'navigator.permissions.js',
    'navigator.plugins.js',
    'navigator.user_agent.js',
    'navigator.vendor.js',
    'navigator.webdriver.js',
    'webgl.vendor.js',
    'window.outerheight.js',
    'window.outerwidth.js',
]

for script_name in _script_names:
    key = script_name.replace('.js', '').replace('.', '_')
    _scripts[key] = from_file(script_name)

print(f"✅ {len([v for v in _scripts.values() if v])} scripts chargés sur {len(_scripts)}")

# =============================================================================
# Classe StealthConfig
# =============================================================================

@dataclass
class StealthConfig:
    """Configuration du mode stealth"""
    # load script options
    webdriver: bool = True
    webgl_vendor: bool = True
    chrome_app: bool = True
    chrome_csi: bool = True
    chrome_load_times: bool = True
    chrome_runtime: bool = True
    iframe_content_window: bool = True
    media_codecs: bool = True
    navigator_hardware_concurrency: int = 4
    navigator_languages: bool = True
    navigator_permissions: bool = True
    navigator_platform: bool = True
    navigator_plugins: bool = True
    navigator_user_agent: bool = True
    navigator_vendor: bool = True
    outerdimensions: bool = True
    hairline: bool = True

    # options
    vendor: str = 'Intel Inc.'
    renderer: str = 'Intel Iris OpenGL Engine'
    nav_vendor: str = 'Google Inc.'
    nav_user_agent: str = None
    nav_platform: str = None
    languages: Tuple[str] = ('en-US', 'en')
    runOnInsecureOrigins: Optional[bool] = None

    @property
    def enabled_scripts(self):
        opts = json.dumps({
            'webgl_vendor': self.vendor,
            'webgl_renderer': self.renderer,
            'navigator_vendor': self.nav_vendor,
            'navigator_platform': self.nav_platform,
            'navigator_user_agent': self.nav_user_agent,
            'languages': list(self.languages),
            'runOnInsecureOrigins': self.runOnInsecureOrigins,
        })
        yield f'const opts = {opts}'
        yield _scripts['utils']
        yield _scripts['generate_magic_arrays']

        if self.chrome_app:
            yield _scripts['chrome_app']
        if self.chrome_csi:
            yield _scripts['chrome_csi']
        if self.hairline:
            yield _scripts['chrome_hairline']
        if self.chrome_load_times:
            yield _scripts['chrome_load_times']
        if self.chrome_runtime:
            yield _scripts['chrome_runtime']
        if self.iframe_content_window:
            yield _scripts['iframe_content_window']
        if self.media_codecs:
            yield _scripts['media_codecs']
        if self.navigator_languages:
            yield _scripts['navigator_languages']
        if self.navigator_permissions:
            yield _scripts['navigator_permissions']
        if self.navigator_platform:
            yield _scripts['navigator_platform']
        if self.navigator_plugins:
            yield _scripts['navigator_plugins']
        if self.navigator_user_agent:
            yield _scripts['navigator_user_agent']
        if self.navigator_vendor:
            yield _scripts['navigator_vendor']
        if self.webdriver:
            yield _scripts['webdriver']
        if self.outerdimensions:
            yield _scripts['outerdimensions']
        if self.webgl_vendor:
            yield _scripts['webgl_vendor']


def stealth_sync(page, config: StealthConfig = None):
    """Version synchrone"""
    for script in (config or StealthConfig()).enabled_scripts:
        page.add_init_script(script)


async def stealth_async(page, config: StealthConfig = None):
    """Version asynchrone"""
    for script in (config or StealthConfig()).enabled_scripts:
        await page.add_init_script(script)
'''


def find_stealth_file() -> Optional[Path]:
    """
    Trouve le fichier stealth.py dans site-packages.
    """
    for site_path in site.getsitepackages():
        stealth_file = Path(site_path) / 'playwright_stealth' / 'stealth.py'
        if stealth_file.exists():
            return stealth_file
    return None


def patch_stealth_file(stealth_file: Path, dry_run: bool = False) -> bool:
    """
    Patche le fichier stealth.py.
    """
    print(f"📁 Fichier trouvé: {stealth_file}")

    if dry_run:
        print("🔍 Mode dry-run - aucune modification")
        return True

    # Sauvegarder l'original
    backup_file = stealth_file.with_suffix('.py.bak')
    if not backup_file.exists():
        shutil.copy2(stealth_file, backup_file)
        print(f"💾 Backup créé: {backup_file}")

    # Écrire le nouveau contenu
    stealth_file.write_text(PATCHED_FILE_CONTENT, encoding='utf-8')
    print("✅ Fichier patché avec succès !")
    return True


def main():
    """Point d'entrée du script"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Patch automatique pour playwright-stealth (Python 3.14+)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simuler le patch sans modifier les fichiers'
    )
    parser.add_argument(
        '--restore',
        action='store_true',
        help='Restaurer le fichier original depuis le backup'
    )
    args = parser.parse_args()

    print("=" * 60)
    print("🔧 PATCH AUTOMATIQUE - PLAYWRIGHT-STEALTH")
    print("=" * 60)

    if args.restore:
        stealth_file = find_stealth_file()
        if not stealth_file:
            print("❌ Fichier stealth.py non trouvé")
            return 1

        backup_file = stealth_file.with_suffix('.py.bak')
        if backup_file.exists():
            shutil.copy2(backup_file, stealth_file)
            print(f"✅ Restauration depuis {backup_file}")
            return 0
        else:
            print("❌ Aucun backup trouvé")
            return 1

    stealth_file = find_stealth_file()
    if not stealth_file:
        print("❌ Fichier stealth.py non trouvé")
        print("   Assurez-vous que playwright-stealth est installé")
        return 1

    patch_stealth_file(stealth_file, dry_run=args.dry_run)

    # Vérifier l'import
    if not args.dry_run:
        print("\n🧪 Vérification de l'import...")
        try:
            # Nettoyer le cache
            if 'playwright_stealth' in sys.modules:
                del sys.modules['playwright_stealth']

            from playwright_stealth import stealth_sync
            print("✅ Import réussi ! playwright_stealth fonctionne avec Python 3.14")
            return 0
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())