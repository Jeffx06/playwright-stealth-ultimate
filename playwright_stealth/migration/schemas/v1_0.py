# migration/schemas/v1_0.py
"""
Schéma version 1.0
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List


@dataclass(slots=True)
class SchemaV1_0:
    """
    Schéma version 1.0
    Structure de base avec hardware et browser
    """
    version: str = "1.0"
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convertit un dictionnaire vers le schéma V1.0"""
        # Structure de base V1.0
        result = {
            'version': '1.0',
            'hardware': {
                'cpu': data.get('cpu', 'Intel Core i5-1135G7'),
                'cpu_cores': data.get('cpu_cores', 4),
                'ram': data.get('ram', 8),
                'gpu': data.get('gpu', 'Intel Iris Xe Graphics'),
            },
            'browser': {
                'platform': data.get('platform', 'Win32'),
                'user_agent': data.get('user_agent', 'Mozilla/5.0...'),
                'locale': data.get('locale', 'en-US'),
                'languages': data.get('languages', ['en-US', 'en']),
                'timezone': data.get('timezone', 'America/New_York'),
            }
        }
        return result
    
    @classmethod
    def to_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convertit un dictionnaire du schéma V1.0 vers un format simple"""
        return {
            'version': '1.0',
            **data.get('hardware', {}),
            **data.get('browser', {}),
        }


__all__ = [
    "SchemaV1_0",
]
