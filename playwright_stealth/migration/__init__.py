# migration/__init__.py
"""
Migration des profils entre versions
"""

from .engine import MigrationEngine

__all__ = [
    "MigrationEngine",
]
