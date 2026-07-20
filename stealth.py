# stealth.py
"""
Point d'entrée direct pour playwright-stealth.
Utilisation: from stealth import dump_configuration
"""

# Importer directement depuis les modules locaux
from adapters.playwright import (
    stealth_sync,
    stealth_async,
    dump_configuration,
)

from core import (
    HardwareTier,
    OSType,
    BrowserVendor,
    FingerprintProfile,
)

__all__ = [
    "stealth_sync",
    "stealth_async",
    "dump_configuration",
    "HardwareTier",
    "OSType",
    "BrowserVendor",
    "FingerprintProfile",
]
