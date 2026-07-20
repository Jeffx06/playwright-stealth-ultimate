# playwright_stealth/version.py
"""
Playwright Stealth Ultimate - Version et métadonnées
"""

__version__ = "5.0.0"
__version_info__ = (5, 0, 0)

# Métadonnées du projet
__author__ = "Jeff"
__author_email__ = "jeffx@live.fr"
__description__ = "Framework d'évasion anti-bot pour Playwright et Selenium"
__license__ = "MIT"
__copyright__ = f"Copyright (c) 2026 {__author__}"
__url__ = "https://github.com/jeffx/playwright-stealth-ultimate"

# Informations de build
__build_date__ = "2026-07-20"
__python_required__ = ">=3.10"


def get_version() -> str:
    """Retourne la version du framework"""
    return __version__


def get_version_info() -> tuple:
    """Retourne la version sous forme de tuple (major, minor, patch)"""
    return __version_info__


def get_author() -> str:
    """Retourne l'auteur du framework"""
    return __author__


def get_author_email() -> str:
    """Retourne l'email de l'auteur"""
    return __author_email__


def get_metadata() -> dict:
    """Retourne toutes les métadonnées du framework"""
    return {
        "version": __version__,
        "version_info": __version_info__,
        "author": __author__,
        "author_email": __author_email__,
        "description": __description__,
        "license": __license__,
        "copyright": __copyright__,
        "url": __url__,
        "build_date": __build_date__,
        "python_required": __python_required__,
    }


__all__ = [
    "__version__",
    "__version_info__",
    "__author__",
    "__author_email__",
    "__description__",
    "__license__",
    "__copyright__",
    "__url__",
    "__build_date__",
    "__python_required__",
    "get_version",
    "get_version_info",
    "get_author",
    "get_author_email",
    "get_metadata",
]