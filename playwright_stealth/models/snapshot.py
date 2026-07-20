# models/snapshot.py
"""
Snapshot arborescent du navigateur - modèle de données
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List
import json

from core.types import NodeType


@dataclass(slots=True)
class SnapshotNode:
    """
    Noeud de snapshot avec dictionnaire pour les enfants.
    Complexité O(1) pour les recherches.
    """
    name: str
    value: Any
    node_type: NodeType = NodeType.PROPERTY
    descriptor: Optional[Dict[str, Any]] = None
    children: Dict[str, 'SnapshotNode'] = field(default_factory=dict)
    parent: Optional['SnapshotNode'] = field(default=None, repr=False)
    
    def add_child(self, node: 'SnapshotNode') -> 'SnapshotNode':
        """Ajoute un enfant avec référence parent"""
        node.parent = self
        self.children[node.name] = node
        return node
    
    def get_child(self, name: str) -> Optional['SnapshotNode']:
        """Récupère un enfant par son nom - O(1)"""
        return self.children.get(name)
    
    def find(self, path: str) -> Optional['SnapshotNode']:
        """Trouve un noeud par chemin - O(1) par niveau"""
        if not path:
            return self
        
        parts = path.split('.')
        current = self
        
        for part in parts:
            if part not in current.children:
                return None
            current = current.children[part]
        
        return current
    
    def get_value(self, path: str, default: Any = None) -> Any:
        """Récupère la valeur d'un noeud par chemin"""
        node = self.find(path)
        return node.value if node else default
    
    def path(self) -> str:
        """Retourne le chemin complet - O(depth)"""
        if self.parent is None:
            return self.name
        parent_path = self.parent.path()
        return f"{parent_path}.{self.name}" if parent_path else self.name
    
    def depth(self) -> int:
        """Retourne la profondeur - O(depth)"""
        if self.parent is None:
            return 0
        return 1 + self.parent.depth()
    
    def root(self) -> 'SnapshotNode':
        """Retourne le noeud racine - O(depth)"""
        if self.parent is None:
            return self
        return self.parent.root()
    
    def walk(self) -> List['SnapshotNode']:
        """Parcourt l'arborescence - O(n)"""
        nodes = [self]
        for child in self.children.values():
            nodes.extend(child.walk())
        return nodes
    
    def to_dict(self) -> Dict:
        """Convertit en dictionnaire"""
        result = {
            'name': self.name,
            'value': self.value,
            'type': self.node_type.value,
        }
        if self.descriptor:
            result['descriptor'] = self.descriptor
        if self.children:
            result['children'] = {
                name: child.to_dict()
                for name, child in self.children.items()
            }
        return result
    
    def to_json(self, indent: int = 2) -> str:
        """Convertit en JSON"""
        return json.dumps(self.to_dict(), indent=indent, default=str)
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'SnapshotNode':
        """Crée un noeud à partir d'un dictionnaire"""
        node = cls(
            name=data['name'],
            value=data['value'],
            node_type=NodeType(data.get('type', 'property')),
            descriptor=data.get('descriptor'),
        )
        for name, child_data in data.get('children', {}).items():
            child = cls.from_dict(child_data)
            node.add_child(child)
        return node
    
    @classmethod
    def from_json(cls, data: str) -> 'SnapshotNode':
        """Crée un noeud à partir de JSON"""
        return cls.from_dict(json.loads(data))


# =============================================================================
# Exports
# =============================================================================

__all__ = [
    "SnapshotNode",
]