# models/plan.py
"""
Plan d'injection - modèle de données
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import hashlib
import json


@dataclass(slots=True)
class InjectionPlan:
    """
    Plan d'injection reproductible.
    
    Le checksum est calculé une fois à la construction
    pour garantir l'intégrité du plan.
    """
    profile_id: str
    modules: List[str]
    scripts: List[str]
    dependencies: Dict[str, List[str]]
    metadata: Dict[str, Any] = field(default_factory=dict)
    _checksum: Optional[str] = field(init=False, default=None)
    
    def __post_init__(self):
        """Calcule le checksum à la construction"""
        self._checksum = self._compute_checksum()
    
    def _compute_checksum(self) -> str:
        """Calcule le checksum - O(n)"""
        data = f"{self.profile_id}|{','.join(self.modules)}|{','.join(self.scripts)}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    @property
    def checksum(self) -> str:
        """Retourne le checksum - O(1)"""
        if self._checksum is None:
            self._checksum = self._compute_checksum()
        return self._checksum
    
    @property
    def script_count(self) -> int:
        """Nombre de scripts dans le plan"""
        return len(self.scripts)
    
    @property
    def module_count(self) -> int:
        """Nombre de modules dans le plan"""
        return len(self.modules)
    
    def to_json(self) -> str:
        """Sérialise le plan en JSON"""
        return json.dumps({
            'profile_id': self.profile_id,
            'modules': self.modules,
            'checksum': self.checksum,
            'metadata': self.metadata,
        }, indent=2)
    
    def to_dict(self) -> Dict:
        """Convertit en dictionnaire"""
        return {
            'profile_id': self.profile_id,
            'modules': self.modules,
            'scripts': self.scripts,
            'dependencies': self.dependencies,
            'checksum': self.checksum,
            'metadata': self.metadata,
        }
    
    @classmethod
    def from_json(cls, data: str) -> 'InjectionPlan':
        """Désérialise un plan depuis JSON"""
        obj = json.loads(data)
        return cls(
            profile_id=obj['profile_id'],
            modules=obj['modules'],
            scripts=obj.get('scripts', []),
            dependencies=obj.get('dependencies', {}),
            metadata=obj.get('metadata', {})
        )


# =============================================================================
# Exports
# =============================================================================

__all__ = [
    "InjectionPlan",
]