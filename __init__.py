# playwright_stealth/__init__.py
"""
Playwright Stealth Ultimate - Framework d'évasion anti-bot

Framework avancé pour Playwright et Selenium avec des techniques
d'évasion de pointe pour contourner les systèmes anti-bot.
"""

from .version import (
    __version__,
    __version_info__,
    __author__,
    __author_email__,
    __description__,
    __license__,
    __copyright__,
    __url__,
    __build_date__,
    __python_required__,
    get_version,
    get_version_info,
    get_author,
    get_author_email,
    get_metadata,
)

# Core
from .core import (
    HardwareTier,
    OSType,
    BrowserVendor,
    HardwareProfile,
    BrowserProfile,
    FingerprintProfile,
)

# Models
from .models import (
    InjectionPlan,
    SnapshotNode,
)

# JS Loader
from .js import ScriptLoader, get_loader

# API Publique
from .adapters.playwright import (
    stealth_sync,
    stealth_async,
    dump_configuration,
)

__all__ = [
    # Version et métadonnées
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
    # Core
    "HardwareTier",
    "OSType",
    "BrowserVendor",
    "HardwareProfile",
    "BrowserProfile",
    "FingerprintProfile",
    # Models
    "InjectionPlan",
    "SnapshotNode",
    # JS
    "ScriptLoader",
    "get_loader",
    # API
    "stealth_sync",
    "stealth_async",
    "dump_configuration",
]