# stealth_fallback.py
"""Fallback pour l'import de stealth_sync"""

import sys
from pathlib import Path

# Ajouter le chemin du projet
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Importer depuis l'adaptateur
from adapters.playwright import stealth_sync, stealth_async, dump_configuration

__all__ = ['stealth_sync', 'stealth_async', 'dump_configuration']
