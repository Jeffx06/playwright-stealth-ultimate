# config/loader.py
"""
Chargeur de configuration déclarative
"""

from pathlib import Path
from typing import Dict, Any, Optional
import yaml
import json


class ConfigLoader:
    """
    Chargeur de configuration à partir de fichiers YAML et JSON.
    
    Responsabilités :
    - Charger les profils depuis YAML
    - Charger les capacités depuis JSON
    - Gérer le cache des configurations
    """
    
    def __init__(self, config_dir: Optional[Path] = None):
        self._config_dir = config_dir or Path(__file__).parent
        self._cache: Dict[str, Any] = {}
    
    def load_profile(self, name: str) -> Dict[str, Any]:
        """
        Charge un profil par nom.
        
        Args:
            name: Nom du profil (ex: "windows_11_chrome_139")
            
        Returns:
            Configuration du profil
        """
        key = f"profile_{name}"
        if key in self._cache:
            return self._cache[key]
        
        path = self._config_dir / "profiles" / f"{name}.yaml"
        if not path.exists():
            raise FileNotFoundError(f"Profil non trouvé: {path}")
        
        with open(path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        
        self._cache[key] = data
        return data
    
    def load_capabilities(self, version: str) -> Dict[str, Any]:
        """
        Charge les capacités pour une version.
        
        Args:
            version: Version du navigateur (ex: "139")
            
        Returns:
            Configuration des capacités
        """
        key = f"capabilities_{version}"
        if key in self._cache:
            return self._cache[key]
        
        path = self._config_dir / "capabilities" / "chromium" / f"{version}.json"
        if not path.exists():
            raise FileNotFoundError(f"Capacités non trouvées: {path}")
        
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        self._cache[key] = data
        return data
    
    def load_policy(self, name: str) -> Dict[str, Any]:
        """
        Charge une politique par nom.
        
        Args:
            name: Nom de la politique (ex: "strict", "balanced", "performance")
            
        Returns:
            Configuration de la politique
        """
        key = f"policy_{name}"
        if key in self._cache:
            return self._cache[key]
        
        path = self._config_dir / "policies" / f"{name}.yaml"
        if not path.exists():
            # Politique par défaut
            return self._default_policy()
        
        with open(path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        
        self._cache[key] = data
        return data
    
    def _default_policy(self) -> Dict[str, Any]:
        """Politique par défaut"""
        return {
            'consistency': 'strict',
            'performance': 'balanced',
            'fallback': 'auto',
            'retry': {'max': 3, 'delay': 1.0}
        }
    
    def list_profiles(self) -> list:
        """Liste les profils disponibles"""
        pattern = self._config_dir / "profiles" / "*.yaml"
        return [p.stem for p in pattern.glob("*.yaml")]
    
    def list_capabilities(self) -> list:
        """Liste les versions de capacités disponibles"""
        pattern = self._config_dir / "capabilities" / "chromium" / "*.json"
        return sorted([p.stem for p in pattern.glob("*.json")])
    
    def clear_cache(self):
        """Vide le cache"""
        self._cache.clear()


__all__ = [
    "ConfigLoader",
]
