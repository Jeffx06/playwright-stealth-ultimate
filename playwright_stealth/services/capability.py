# services/capability.py
"""
Service de résolution des capacités
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Set, Any
from pathlib import Path
import json

from core.types import FeatureCapability, APICapability, EvasionModule


@dataclass(slots=True)
class BrowserCapabilities:
    """Capabilités complètes d'une version de navigateur"""
    version: str
    features: Dict[str, FeatureCapability]
    apis: Dict[str, APICapability]
    deprecations: Set[str]
    experimental: Set[str]
    
    def supports(self, feature: str) -> bool:
        """Vérifie si une fonctionnalité est supportée"""
        feature_obj = self.features.get(feature)
        if feature_obj:
            return feature_obj.supported
        return False
    
    def api_status(self, api: str) -> Optional[str]:
        """Retourne le statut d'une API"""
        api_obj = self.apis.get(api)
        if api_obj:
            return api_obj.status
        return None


class CapabilityRegistry:
    """
    Registre des capacités par version.
    
    Responsabilités :
    - Charger les capacités depuis JSON
    - Gérer le cache des versions
    - Fournir la dernière version disponible
    """
    
    def __init__(self, data_dir: Optional[Path] = None):
        self._data_dir = data_dir or Path(__file__).parent.parent / 'config' / 'capabilities' / 'chromium'
        self._cache: Dict[str, BrowserCapabilities] = {}
    
    def load(self, version: str) -> BrowserCapabilities:
        """
        Charge les capacités pour une version donnée.
        
        Args:
            version: Version du navigateur (ex: "139.0.0.0")
            
        Returns:
            Capabilités de la version
        """
        if version in self._cache:
            return self._cache[version]
        
        path = self._data_dir / f"{version}.json"
        if not path.exists():
            raise FileNotFoundError(f"Capabilités non trouvées pour {version}")
        
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        capabilities = BrowserCapabilities(
            version=version,
            features={
                name: FeatureCapability(
                    name=name,
                    supported=details.get('supported', False),
                    since_version=details.get('since'),
                    deprecated_in=details.get('deprecated'),
                    experimental=details.get('experimental', False),
                )
                for name, details in data.get('features', {}).items()
            },
            apis={
                name: APICapability(
                    name=name,
                    status=details.get('status', 'unknown'),
                    since_version=details.get('since'),
                    removed_in=details.get('removed'),
                )
                for name, details in data.get('apis', {}).items()
            },
            deprecations=set(data.get('deprecations', [])),
            experimental=set(data.get('experimental', [])),
        )
        
        self._cache[version] = capabilities
        return capabilities
    
    def get_latest(self) -> BrowserCapabilities:
        """Récupère les capacités de la dernière version disponible"""
        versions = self._list_versions()
        if not versions:
            raise ValueError("Aucune version disponible")
        
        # Trier correctement les versions
        try:
            from packaging.version import Version, InvalidVersion
            parsed = []
            for v in versions:
                try:
                    parsed.append((Version(v), v))
                except InvalidVersion:
                    parsed.append((Version("0.0.0"), v))
            parsed.sort(key=lambda x: x[0])
            latest = parsed[-1][1]
        except ImportError:
            # Fallback: tri alphabétique simple
            versions.sort()
            latest = versions[-1]
        
        return self.load(latest)
    
    def _list_versions(self) -> List[str]:
        """Liste les versions disponibles"""
        pattern = self._data_dir / '*.json'
        return [p.stem for p in self._data_dir.glob('*.json')]
    
    def clear_cache(self) -> None:
        """Vide le cache"""
        self._cache.clear()


class CapabilityResolver:
    """
    Résolveur de capacités pour les modules d'évasion.
    
    Responsabilités :
    - Filtrer les modules compatibles avec une version
    - Vérifier les prérequis des modules
    - Gérer les conflits entre modules
    """
    
    def __init__(self, registry: CapabilityRegistry):
        self._registry = registry
    
    def resolve(self, 
                requested_modules: Optional[List[str]] = None,
                modules_registry: Optional[Dict[str, EvasionModule]] = None,
                browser_version: Optional[str] = None) -> List[EvasionModule]:
        """
        Résout la liste des modules compatibles.
        
        Args:
            requested_modules: Noms des modules demandés (None = tous)
            modules_registry: Dictionnaire nom -> module
            browser_version: Version du navigateur (None = dernière)
            
        Returns:
            Liste des modules compatibles
        """
        if browser_version is None:
            caps = self._registry.get_latest()
        else:
            caps = self._registry.load(browser_version)
        
        if modules_registry is None:
            return []
        
        if requested_modules is None:
            requested_modules = list(modules_registry.keys())
        
        compatible = []
        for name in requested_modules:
            module = modules_registry.get(name)
            if module and self._is_compatible(module, caps):
                compatible.append(module)
        
        return compatible
    
    def _is_compatible(self, module: EvasionModule, caps: BrowserCapabilities) -> bool:
        """Vérifie la compatibilité d'un module"""
        # Vérifier les prérequis
        required = getattr(module, 'requires', [])
        for req in required:
            if not caps.supports(req):
                return False
        
        # Vérifier les conflits
        conflicts = getattr(module, 'conflicts', [])
        for conflict in conflicts:
            if caps.supports(conflict):
                return False
        
        return True
    
    def supports(self, feature: str, browser_version: Optional[str] = None) -> bool:
        """Vérifie si une fonctionnalité est supportée"""
        if browser_version is None:
            caps = self._registry.get_latest()
        else:
            caps = self._registry.load(browser_version)
        return caps.supports(feature)
    
    def get_version_info(self, version: str) -> Dict[str, Any]:
        """Retourne des informations sur une version"""
        try:
            from packaging.version import Version, InvalidVersion
            v = Version(version)
            return {
                'version': version,
                'parsed': v,
                'major': v.major,
                'minor': v.minor,
                'micro': v.micro,
                'is_prerelease': v.is_prerelease,
                'is_devrelease': v.is_devrelease,
            }
        except (ImportError, InvalidVersion):
            return {'version': version, 'parsed': None}