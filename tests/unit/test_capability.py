# tests/unit/test_capability.py
"""
Tests unitaires pour CapabilityResolver et CapabilityRegistry
"""

import pytest
from services.capability import CapabilityRegistry, CapabilityResolver
from core.types import FeatureCapability, APICapability


class TestCapabilityRegistry:
    """Tests pour CapabilityRegistry"""

    @pytest.fixture
    def registry(self):
        """Fixture pour le registre"""
        return CapabilityRegistry()

    def test_registry_initialization(self, registry):
        """Test d'initialisation du registre"""
        assert registry is not None
        assert registry._cache == {}

    def test_load_capabilities(self, registry):
        """Test de chargement des capacités"""
        caps = registry.load("139")
        assert caps is not None
        assert caps.version == "139"
        assert len(caps.features) > 0
        assert len(caps.apis) > 0

    def test_load_capabilities_cache(self, registry):
        """Test que le cache fonctionne"""
        caps1 = registry.load("139")
        caps2 = registry.load("139")
        assert caps1 is caps2  # Même objet en cache

    def test_get_latest(self, registry):
        """Test de récupération de la dernière version"""
        latest = registry.get_latest()
        assert latest is not None
        assert latest.version in ["139", "138", "137", "136"]

    def test_supports_feature(self, registry):
        """Test de vérification de support d'une fonctionnalité"""
        caps = registry.load("139")
        assert caps.supports("webgl2") is True
        # webgpu est supporté dans 139
        assert caps.supports("webgpu") is True

    def test_api_status(self, registry):
        """Test de récupération du statut d'une API"""
        caps = registry.load("139")
        assert caps.api_status("storage") == "stable"
        assert caps.api_status("webgpu") == "experimental"

    def test_clear_cache(self, registry):
        """Test de vidage du cache"""
        registry.load("139")
        assert len(registry._cache) > 0
        
        registry.clear_cache()
        assert registry._cache == {}

    def test_load_nonexistent_version(self, registry):
        """Test de chargement d'une version inexistante"""
        with pytest.raises(FileNotFoundError):
            registry.load("999")


class TestCapabilityResolver:
    """Tests pour CapabilityResolver"""

    @pytest.fixture
    def resolver(self, capability_registry):
        """Fixture pour le résolveur"""
        return CapabilityResolver(capability_registry)

    def test_resolver_initialization(self, resolver):
        """Test d'initialisation du résolveur"""
        assert resolver is not None
        assert resolver._registry is not None

    def test_resolve_empty(self, resolver):
        """Test de résolution avec une liste vide"""
        result = resolver.resolve([], {})
        assert result == []

    def test_resolve_with_modules(self, resolver):
        """Test de résolution avec des modules"""
        # Créer un module factice
        class DummyModule:
            name = "dummy"
            priority = 100
            dependencies = ()
            conflicts = ()
            requires = ["webgl2"]
            def build(self, profile, loader): 
                return "// script"
            def validate(self, p): 
                return []
        
        modules_registry = {"dummy": DummyModule()}
        result = resolver.resolve(["dummy"], modules_registry)
        
        # Le module devrait être compatible car webgl2 est supporté
        assert len(result) == 1
        assert result[0].name == "dummy"

    def test_resolve_incompatible_module(self, resolver):
        """Test de résolution avec un module incompatible"""
        # Créer un module avec une exigence non supportée
        class IncompatibleModule:
            name = "incompatible"
            priority = 100
            dependencies = ()
            conflicts = ()
            requires = ["fake_feature"]
            def build(self, profile, loader): 
                return "// script"
            def validate(self, p): 
                return []
        
        modules_registry = {"incompatible": IncompatibleModule()}
        result = resolver.resolve(["incompatible"], modules_registry)
        
        # Le module ne devrait pas être compatible
        assert len(result) == 0

    def test_resolve_with_conflicts(self, resolver):
        """Test de résolution avec des conflits"""
        class ConflictingModule:
            name = "conflicting"
            priority = 100
            dependencies = ()
            conflicts = ["webgpu"]
            requires = []
            def build(self, profile, loader): 
                return "// script"
            def validate(self, p): 
                return []
        
        modules_registry = {"conflicting": ConflictingModule()}
        result = resolver.resolve(["conflicting"], modules_registry)
        
        # Le module devrait être compatible car webgpu est supporté
        # mais il a un conflit, donc il ne devrait pas être inclus
        assert len(result) == 0

    def test_supports(self, resolver):
        """Test de vérification de support"""
        assert resolver.supports("webgl2") is True
        assert resolver.supports("webgpu") is True  # Supporté dans 139

    def test_supports_with_version(self, resolver):
        """Test de vérification de support avec une version spécifique"""
        assert resolver.supports("webgpu", "136") is False  # Pas supporté en 136
        assert resolver.supports("webgpu", "139") is True   # Supporté en 139

    def test_get_version_info(self, resolver):
        """Test de récupération des informations de version"""
        info = resolver.get_version_info("139.0.0.0")
        assert info is not None
        assert info.get("major") == 139
        assert info.get("minor") == 0
        assert info.get("micro") == 0
