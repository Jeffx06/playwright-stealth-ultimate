# migration/schemas/__init__.py
"""
Schémas de migration par version
"""

from .v1_0 import SchemaV1_0
from .v1_1 import SchemaV1_1
from .v2_0 import SchemaV2_0

__all__ = [
    "SchemaV1_0",
    "SchemaV1_1",
    "SchemaV2_0",
]
