# js/loader.py
"""
Chargeur de scripts JavaScript avec cache
"""

from pathlib import Path
from typing import Optional, Dict, Any
from functools import lru_cache


class ScriptLoader:
    """
    Charge et cache les scripts JavaScript.
    
    Les scripts sont chargés depuis le dossier js/
    et mis en cache pour éviter les lectures disque répétées.
    """
    
    def __init__(self, base_path: Optional[Path] = None):
        self._base_path = base_path or Path(__file__).parent
        self._cache: Dict[str, str] = {}
    
    @lru_cache(maxsize=128)
    def get(self, name: str) -> str:
        """
        Charge un script depuis le cache ou le disque.
        
        Args:
            name: Nom du script (sans extension)
            
        Returns:
            Contenu du script, ou chaîne vide si non trouvé
        """
        if name in self._cache:
            return self._cache[name]
        
        # Chercher dans différents emplacements
        paths = [
            self._base_path / f"{name}.js",
            self._base_path / name,
        ]
        
        for path in paths:
            if path.exists():
                content = path.read_text(encoding="utf-8")
                self._cache[name] = content
                return content
        
        # Fallback: chercher dans le dossier parent
        parent_path = self._base_path.parent / "js" / f"{name}.js"
        if parent_path.exists():
            content = parent_path.read_text(encoding="utf-8")
            self._cache[name] = content
            return content
        
        return ""
    
    def render(self, name: str, **kwargs) -> str:
        """Charge un script et remplace les variables"""
        script = self.get(name)
        for key, value in kwargs.items():
            script = script.replace(f"{{{{{key}}}}}", str(value))
        return script
    
    def register(self, name: str, content: str) -> None:
        """Enregistre un script en mémoire"""
        self._cache[name] = content
    
    def clear_cache(self) -> None:
        """Vide le cache"""
        self._cache.clear()
        self.get.cache_clear()


# Instance globale
_default_loader: Optional[ScriptLoader] = None


def get_loader() -> ScriptLoader:
    """Récupère l'instance globale du chargeur"""
    global _default_loader
    if _default_loader is None:
        _default_loader = ScriptLoader()
    return _default_loader


# =============================================================================
# Exports
# =============================================================================

__all__ = [
    "ScriptLoader",
    "get_loader",
]