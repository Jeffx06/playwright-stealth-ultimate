# migration/schemas/v2_0.py
"""
Schéma version 2.0
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List


@dataclass(slots=True)
class SchemaV2_0:
    """
    Schéma version 2.0
    Version complète avec politiques et métadonnées
    """
    version: str = "2.0"
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convertit un dictionnaire vers le schéma V2.0"""
        result = {
            'version': '2.0',
            'hardware': {
                'tier': data.get('tier', 'medium'),
                'cpu': data.get('cpu', 'Intel Core i5-1135G7'),
                'cpu_cores': data.get('cpu_cores', 4),
                'ram': data.get('ram', 8),
                'gpu': data.get('gpu', 'Intel Iris Xe Graphics'),
                'screen': data.get('screen', [1920, 1080]),
                'dpi': data.get('dpi', 1.0),
            },
            'browser': {
                'platform': data.get('platform', 'Win32'),
                'user_agent': data.get('user_agent', 'Mozilla/5.0...'),
                'locale': data.get('locale', 'en-US'),
                'languages': data.get('languages', ['en-US', 'en']),
                'timezone': data.get('timezone', 'America/New_York'),
                'fonts': data.get('fonts', ['Arial', 'Helvetica']),
            },
            'modules': {
                'enabled': data.get('modules', ['webdriver', 'chrome_runtime', 'canvas', 'audio']),
            },
            'policies': {
                'consistency': data.get('consistency', 'balanced'),
                'performance': data.get('performance', 'balanced'),
            },
            'metadata': {
                'created_at': data.get('created_at', None),
                'updated_at': data.get('updated_at', None),
            }
        }
        return result


__all__ = [
    "SchemaV2_0",
]
