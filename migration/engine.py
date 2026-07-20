# migration/engine.py
"""
Moteur de migration des profils entre versions
"""

from copy import deepcopy
from typing import Dict, Any, Optional, Callable, Tuple
from enum import IntEnum


class SchemaVersion(IntEnum):
    """Versions du schéma de profil"""
    V1_0 = 100
    V1_1 = 101
    V2_0 = 200


class MigrationEngine:
    """
    Moteur de migration des profils.
    
    Responsabilités :
    - Migrer les profils d'une version à l'autre
    - Préserver l'intégrité des données
    - Gérer les chemins de migration
    """
    
    def __init__(self, preserve_original: bool = True):
        self._preserve_original = preserve_original
        self._migrations: Dict[Tuple[int, int], Callable] = {}
        self._register_migrations()
    
    def _register_migrations(self):
        """Enregistre les migrations disponibles"""
        self._migrations[(SchemaVersion.V1_0, SchemaVersion.V1_1)] = self._migrate_1_0_to_1_1
        self._migrations[(SchemaVersion.V1_1, SchemaVersion.V2_0)] = self._migrate_1_1_to_2_0
    
    def migrate(self, data: Dict[str, Any], 
                from_version: SchemaVersion, 
                to_version: SchemaVersion) -> Dict[str, Any]:
        """
        Migre un profil d'une version à l'autre.
        
        Args:
            data: Données du profil
            from_version: Version source
            to_version: Version cible
            
        Returns:
            Données migrées
        """
        if self._preserve_original:
            data = deepcopy(data)
        
        current = from_version
        while current < to_version:
            next_version = self._get_next_version(current)
            if next_version is None:
                raise ValueError(f"Pas de migration de {current} vers {to_version}")
            
            key = (current, next_version)
            if key not in self._migrations:
                raise ValueError(f"Pas de migration de {current} vers {next_version}")
            
            data = self._migrations[key](data)
            current = next_version
        
        return data
    
    def _get_next_version(self, version: SchemaVersion) -> Optional[SchemaVersion]:
        """Retourne la prochaine version disponible"""
        versions = sorted([v for v in SchemaVersion if v > version])
        return versions[0] if versions else None
    
    def _migrate_1_0_to_1_1(self, data: Dict) -> Dict:
        """Migration V1.0 → V1.1"""
        # Ajouter le champ 'hardware.tier' si absent
        if 'hardware' in data and 'tier' not in data['hardware']:
            data['hardware']['tier'] = 'medium'
        
        # Ajouter le champ 'modules' si absent
        if 'modules' not in data:
            data['modules'] = {'enabled': ['webdriver', 'chrome_runtime']}
        
        return data
    
    def _migrate_1_1_to_2_0(self, data: Dict) -> Dict:
        """Migration V1.1 → V2.0"""
        # Restructuration
        if 'hardware' in data:
            # Renommer gpu en gpu_model
            if 'gpu' in data['hardware']:
                data['hardware']['gpu_model'] = data['hardware'].pop('gpu')
        
        # Ajouter les politiques
        if 'policies' not in data:
            data['policies'] = {
                'consistency': 'balanced',
                'performance': 'balanced'
            }
        
        return data


__all__ = [
    "SchemaVersion",
    "MigrationEngine",
]
