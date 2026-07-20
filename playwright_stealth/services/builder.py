# services/builder.py
"""
Service de construction des plans d'injection
"""

from typing import List, Optional, Dict, Any
from pathlib import Path

from core.types import EvasionModule
from core.profile import FingerprintProfile
from models.plan import InjectionPlan
from js.loader import ScriptLoader, get_loader


class BuilderService:
    """
    Service de construction des plans d'injection.
    
    Responsabilités :
    - Charger les scripts JS pour chaque module
    - Construire un plan d'injection complet
    - Gérer les dépendances entre modules
    """
    
    def __init__(self, loader: Optional[ScriptLoader] = None):
        self._loader = loader or get_loader()
        self._script_cache: Dict[str, str] = {}
    
    def build(self, 
              modules: List[EvasionModule],
              profile: FingerprintProfile,
              context: Optional[Dict[str, Any]] = None) -> InjectionPlan:
        """
        Construit un plan d'injection à partir des modules.
        
        Args:
            modules: Liste des modules à inclure
            profile: Profil d'empreinte
            context: Contexte additionnel
            
        Returns:
            Plan d'injection complet
        """
        scripts = []
        dependencies = {}
        module_names = []
        
        for module in modules:
            module_names.append(module.name)
            
            # Générer le script du module
            script = module.build(profile, self._loader)
            if script and script.strip():
                scripts.append(script)
                
            # Enregistrer les dépendances
            if hasattr(module, 'dependencies'):
                dependencies[module.name] = list(module.dependencies)
        
        return InjectionPlan(
            profile_id=profile.id,
            modules=module_names,
            scripts=scripts,
            dependencies=dependencies,
            metadata={
                'context': context or {},
                'module_count': len(modules),
                'script_count': len(scripts),
            }
        )
    
    def build_from_names(self,
                         module_names: List[str],
                         modules_registry: Dict[str, EvasionModule],
                         profile: FingerprintProfile,
                         context: Optional[Dict[str, Any]] = None) -> InjectionPlan:
        """
        Construit un plan à partir des noms de modules.
        
        Args:
            module_names: Liste des noms de modules
            modules_registry: Dictionnaire nom -> module
            profile: Profil d'empreinte
            context: Contexte additionnel
            
        Returns:
            Plan d'injection complet
        """
        modules = []
        for name in module_names:
            if name in modules_registry:
                modules.append(modules_registry[name])
        
        return self.build(modules, profile, context)
    
    def load_script(self, script_name: str) -> str:
        """
        Charge un script JS individuel.
        
        Args:
            script_name: Nom du script (sans extension)
            
        Returns:
            Contenu du script
        """
        if script_name in self._script_cache:
            return self._script_cache[script_name]
        
        content = self._loader.get(script_name)
        if content:
            self._script_cache[script_name] = content
        
        return content
    
    def clear_cache(self) -> None:
        """Vide le cache des scripts"""
        self._script_cache.clear()