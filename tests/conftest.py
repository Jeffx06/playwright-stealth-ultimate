# tests/conftest.py
"""
Fixtures pytest pour les tests du framework
"""

import pytest
from typing import Dict, Any, Optional

from core.profile import FingerprintProfile, HardwareTier, OSType, BrowserVendor
from core.engine import FingerprintEngine
from core.types import EvasionModule

from services.builder import BuilderService
from services.injector import InjectorService
from services.validator import ProfileValidator
from services.capability import CapabilityResolver, CapabilityRegistry
from services.optimizer import PlanOptimizer
from services.behavior import BehaviorService
from services.telemetry import TelemetryService
from services.observability import ObservabilityService

from cache.memory import LRUMemoryCache


# =============================================================================
# Fixtures de profil
# =============================================================================

@pytest.fixture
def default_profile() -> FingerprintProfile:
    """Crée un profil par défaut pour les tests"""
    return FingerprintProfile.generate(
        hardware_tier=HardwareTier.MEDIUM,
        os_type=OSType.WINDOWS,
        browser_vendor=BrowserVendor.CHROME
    )


@pytest.fixture
def high_end_profile() -> FingerprintProfile:
    """Crée un profil haute performance pour les tests"""
    return FingerprintProfile.generate(
        hardware_tier=HardwareTier.HIGH,
        os_type=OSType.WINDOWS,
        browser_vendor=BrowserVendor.CHROME
    )


@pytest.fixture
def macos_profile() -> FingerprintProfile:
    """Crée un profil macOS pour les tests"""
    return FingerprintProfile.generate(
        hardware_tier=HardwareTier.HIGH,
        os_type=OSType.MACOS,
        browser_vendor=BrowserVendor.CHROME
    )


# =============================================================================
# Fixtures de services
# =============================================================================

@pytest.fixture
def validator() -> ProfileValidator:
    """Fournit un validateur de profil"""
    return ProfileValidator()


@pytest.fixture
def telemetry() -> TelemetryService:
    """Fournit un service de télémétrie"""
    return TelemetryService()


@pytest.fixture
def cache() -> LRUMemoryCache:
    """Fournit un cache mémoire"""
    return LRUMemoryCache(maxsize=100)


@pytest.fixture
def capability_registry() -> CapabilityRegistry:
    """Fournit un registre de capacités"""
    return CapabilityRegistry()


@pytest.fixture
def capability_resolver(capability_registry: CapabilityRegistry) -> CapabilityResolver:
    """Fournit un résolveur de capacités"""
    return CapabilityResolver(capability_registry)


@pytest.fixture
def builder() -> BuilderService:
    """Fournit un constructeur de plans"""
    return BuilderService()


@pytest.fixture
def injector(telemetry: TelemetryService) -> InjectorService:
    """Fournit un injecteur"""
    return InjectorService(telemetry=telemetry)


@pytest.fixture
def optimizer() -> PlanOptimizer:
    """Fournit un optimiseur de plans"""
    return PlanOptimizer()


@pytest.fixture
def behavior() -> BehaviorService:
    """Fournit un service de comportement"""
    return BehaviorService()


@pytest.fixture
def observability() -> ObservabilityService:
    """Fournit un service d'observabilité"""
    return ObservabilityService()


# =============================================================================
# Fixtures de moteur
# =============================================================================

@pytest.fixture
def engine(default_profile: FingerprintProfile,
           builder: BuilderService,
           injector: InjectorService,
           validator: ProfileValidator,
           capability_resolver: CapabilityResolver,
           optimizer: PlanOptimizer,
           behavior: BehaviorService,
           telemetry: TelemetryService,
           observability: ObservabilityService,
           cache: LRUMemoryCache) -> FingerprintEngine:
    """Fournit un moteur fingerprint complet"""
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


# =============================================================================
# Fixtures de données
# =============================================================================

@pytest.fixture
def sample_profile_data() -> Dict[str, Any]:
    """Fournit des données de profil pour les tests"""
    return {
        'id': 'test_profile_001',
        'hardware': {
            'cpu_cores': 4,
            'cpu_model': 'Intel Core i5-1135G7',
            'ram_gb': 8,
            'gpu_vendor': 'Intel Inc.',
            'gpu_renderer': 'ANGLE (Intel)',
        },
        'browser': {
            'platform': 'Win32',
            'locale': 'fr-FR',
            'timezone': 'Europe/Paris',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
    }


@pytest.fixture
def sample_module():
    """Fournit un module d'évasion factice pour les tests"""
    
    class DummyModule:
        name = "dummy"
        priority = 100
        dependencies = ()
        conflicts = ()
        
        def build(self, profile, loader):
            """Génère le script du module - signature correcte"""
            return "// Dummy module script"
        
        def validate(self, profile) -> list:
            return []
    
    return DummyModule()


# =============================================================================
# Fixtures Playwright (optionnelles)
# =============================================================================

@pytest.fixture(scope="session")
def playwright_installed() -> bool:
    """Vérifie si Playwright est installé"""
    try:
        import playwright
        return True
    except ImportError:
        return False


@pytest.fixture
def skip_if_no_playwright(playwright_installed: bool):
    """Skip les tests si Playwright n'est pas installé"""
    if not playwright_installed:
        pytest.skip("Playwright not installed")


# =============================================================================
# Configuration pytest
# =============================================================================

def pytest_configure(config):
    """Configuration personnalisée de pytest"""
    config.addinivalue_line(
        "markers", "integration: marque les tests d'intégration"
    )
    config.addinivalue_line(
        "markers", "slow: marque les tests lents"
    )
    config.addinivalue_line(
        "markers", "playwright: marque les tests nécessitant Playwright"
    )
