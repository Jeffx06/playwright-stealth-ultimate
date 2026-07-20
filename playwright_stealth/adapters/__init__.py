# adapters/__init__.py
"""
Adaptateurs pour différents navigateurs/frameworks
"""

from .playwright import (
    PlaywrightAdapter,
    stealth_sync,
    stealth_async,
    dump_configuration,
)

from .selenium import (
    SeleniumAdapter,
    stealth_selenium,
)

__all__ = [
    "PlaywrightAdapter",
    "stealth_sync",
    "stealth_async",
    "dump_configuration",
    "SeleniumAdapter",
    "stealth_selenium",
]
