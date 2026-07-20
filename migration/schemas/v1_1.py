# migration/schemas/v1_1.py
"""
Schéma version 1.1
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List


@dataclass(slots=True)
class SchemaV1_1:
    """
    Schéma version 1.1
    Ajoute le tier matériel et les modules
    """
    version: str = "1.1"
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convertit un dictionnaire vers le schéma V1.1"""
        result = {
            'version': '1.1',
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
            },
            'modules': {
                'enabled': data.get('modules', ['webdriver', 'chrome_runtime']),
            }
        }
        return result


__all__ = [
    "SchemaV1_1",
]
