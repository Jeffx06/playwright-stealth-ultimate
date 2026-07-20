# tests/unit/test_engine.py
"""
Tests unitaires pour FingerprintEngine
"""

import pytest
from core.profile import FingerprintProfile, HardwareTier, OSType, BrowserVendor
from core.engine import FingerprintEngine
from core.types import EvasionModule
from models.plan import InjectionPlan


class TestFingerprintEngine:
    """Tests pour FingerprintEngine"""

    @pytest.fixture
    def engine(self, default_profile, builder, injector, validator,
               capability_resolver, optimizer, behavior, telemetry,
               observability, cache):
        """Fixture pour le moteur"""
        return FingerprintEngine(
            profile=default_profile,
            builder=builder,
            injector=injector,
            validator=validator,
            capability=capability_resolver,
            optimizer=optimizer,
            behavior=behavior,
            telemetry=telemetry,
            observability=observability,
            cache=cache,
            modules={}
        )

    def test_engine_initialization(self, engine):
        """Test d'initialisation du moteur"""
        assert engine is not None
        assert engine.profile is not None
        assert engine.modules == {}

    def test_engine_profile_access(self, engine, default_profile):
        """Test d'accès au profil"""
        assert engine.profile.id == default_profile.id
        assert engine.profile.hardware.cpu_cores == default_profile.hardware.cpu_cores

    def test_register_module(self, engine, sample_module):
        """Test d'enregistrement d'un module"""
        engine.register_module(sample_module)
        assert sample_module.name in engine.modules
        assert engine.modules[sample_module.name] == sample_module

    def test_unregister_module(self, engine, sample_module):
        """Test de désenregistrement d'un module"""
        engine.register_module(sample_module)
        assert sample_module.name in engine.modules
        
        engine.unregister_module(sample_module.name)
        assert sample_module.name not in engine.modules

    def test_get_plan(self, engine):
        """Test de génération d'un plan"""
        plan = engine.get_plan()
        assert isinstance(plan, InjectionPlan)
        assert plan.profile_id == engine.profile.id
        assert plan.scripts == []  # Pas de modules enregistrés

    def test_get_plan_with_modules(self, engine, sample_module):
        """Test de génération d'un plan avec des modules"""
        engine.register_module(sample_module)
        plan = engine.get_plan(enabled_modules=[sample_module.name])
        assert isinstance(plan, InjectionPlan)
        assert sample_module.name in plan.modules

    def test_get_stats(self, engine):
        """Test de récupération des statistiques"""
        stats = engine.get_stats()
        assert 'profile_id' in stats
        assert stats['profile_id'] == engine.profile.id
        assert 'modules_count' in stats
        assert 'optimizer_stats' in stats
        assert 'telemetry' in stats

    def test_engine_with_different_profile(self, high_end_profile, builder, injector,
                                            validator, capability_resolver, optimizer,
                                            behavior, telemetry, observability, cache):
        """Test du moteur avec un profil différent"""
        engine = FingerprintEngine(
            profile=high_end_profile,
            builder=builder,
            injector=injector,
            validator=validator,
            capability=capability_resolver,
            optimizer=optimizer,
            behavior=behavior,
            telemetry=telemetry,
            observability=observability,
            cache=cache,
            modules={}
        )
        assert engine.profile.hardware.cpu_cores == 8
        assert engine.profile.hardware.ram_gb == 16

    def test_multiple_module_registration(self, engine):
        """Test d'enregistrement de multiples modules"""
        # Créer des modules factices
        class ModuleA:
            name = "module_a"
            priority = 100
            dependencies = ()
            conflicts = ()
            def build(self, ctx): return "// A"
            def validate(self, p): return []
        
        class ModuleB:
            name = "module_b"
            priority = 200
            dependencies = ()
            conflicts = ()
            def build(self, ctx): return "// B"
            def validate(self, p): return []
        
        engine.register_module(ModuleA())
        engine.register_module(ModuleB())
        
        assert len(engine.modules) == 2
        assert "module_a" in engine.modules
        assert "module_b" in engine.modules

    def test_plan_optimization(self, engine, sample_module):
        """Test d'optimisation du plan"""
        engine.register_module(sample_module)
        plan = engine.get_plan(enabled_modules=[sample_module.name], optimize=True)
        assert plan.metadata.get('optimized', False) is True

    def test_plan_without_optimization(self, engine, sample_module):
        """Test de plan sans optimisation"""
        engine.register_module(sample_module)
        plan = engine.get_plan(enabled_modules=[sample_module.name], optimize=False)
        assert plan.metadata.get('optimized', False) is False
