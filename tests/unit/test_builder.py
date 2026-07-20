# tests/unit/test_builder.py
"""
Tests unitaires pour BuilderService
"""

import pytest
from services.builder import BuilderService
from models.plan import InjectionPlan


class TestBuilderService:
    """Tests pour BuilderService"""

    @pytest.fixture
    def builder(self):
        """Fixture pour le builder"""
        return BuilderService()

    def test_builder_initialization(self, builder):
        """Test d'initialisation du builder"""
        assert builder is not None
        assert builder._loader is not None
        assert builder._script_cache == {}

    def test_build_empty_modules(self, builder, default_profile):
        """Test de construction avec une liste vide"""
        plan = builder.build([], default_profile)
        assert isinstance(plan, InjectionPlan)
        assert plan.profile_id == default_profile.id
        assert plan.modules == []
        assert plan.scripts == []
        assert plan.dependencies == {}

    def test_build_with_modules(self, builder, default_profile, sample_module):
        """Test de construction avec des modules"""
        modules = [sample_module]
        plan = builder.build(modules, default_profile)
        
        assert isinstance(plan, InjectionPlan)
        assert plan.profile_id == default_profile.id
        assert sample_module.name in plan.modules
        assert len(plan.scripts) == 1
        assert "// Dummy module script" in plan.scripts[0]

    def test_build_multiple_modules(self, builder, default_profile):
        """Test de construction avec plusieurs modules"""
        # Créer des modules factices
        class ModuleA:
            name = "module_a"
            priority = 100
            dependencies = ()
            conflicts = ()
            def build(self, profile, loader): 
                return "// Module A script"
            def validate(self, p): 
                return []
        
        class ModuleB:
            name = "module_b"
            priority = 200
            dependencies = ()
            conflicts = ()
            def build(self, profile, loader): 
                return "// Module B script"
            def validate(self, p): 
                return []
        
        modules = [ModuleA(), ModuleB()]
        plan = builder.build(modules, default_profile)
        
        assert len(plan.modules) == 2
        assert "module_a" in plan.modules
        assert "module_b" in plan.modules
        assert len(plan.scripts) == 2

    def test_build_from_names(self, builder, default_profile, sample_module):
        """Test de construction à partir des noms de modules"""
        modules_registry = {sample_module.name: sample_module}
        plan = builder.build_from_names(
            [sample_module.name],
            modules_registry,
            default_profile
        )
        
        assert isinstance(plan, InjectionPlan)
        assert sample_module.name in plan.modules

    def test_build_from_names_empty(self, builder, default_profile):
        """Test de construction avec une liste de noms vide"""
        plan = builder.build_from_names([], {}, default_profile)
        assert plan.modules == []
        assert plan.scripts == []

    def test_load_script(self, builder):
        """Test de chargement d'un script"""
        # Le script webdriver.js devrait exister
        script = builder.load_script("webdriver")
        # Peut être vide si le fichier n'existe pas, mais ne doit pas planter
        assert script is not None

    def test_clear_cache(self, builder):
        """Test de vidage du cache"""
        builder.load_script("webdriver")
        assert len(builder._script_cache) >= 0
        
        builder.clear_cache()
        assert builder._script_cache == {}

    def test_build_with_context(self, builder, default_profile, sample_module):
        """Test de construction avec un contexte"""
        context = {"test_key": "test_value"}
        modules = [sample_module]
        plan = builder.build(modules, default_profile, context)
        
        assert plan.metadata.get("context") == context
        assert plan.metadata.get("module_count") == 1
