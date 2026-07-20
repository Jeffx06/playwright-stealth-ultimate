# playwright_stealth/adapters/playwright.py
"""
Adaptateur Playwright pour le framework stealth
"""

from typing import Optional, List, Dict, Any
from playwright.sync_api import Page, BrowserContext

# Imports relatifs (plus robustes)
from ..core.engine import FingerprintEngine
from ..core.profile import FingerprintProfile, HardwareTier, OSType, BrowserVendor
from ..services.builder import BuilderService
from ..services.injector import InjectorService
from ..services.validator import ProfileValidator
from ..services.capability import CapabilityResolver, CapabilityRegistry
from ..services.optimizer import PlanOptimizer
from ..services.behavior import BehaviorService
from ..services.telemetry import TelemetryService
from ..services.observability import ObservabilityService
from ..cache.memory import LRUMemoryCache
from ..js.loader import ScriptLoader

# Import conditionnel pour les modules d'évasion
try:
    from ..js.modules import get_all_modules
    MODULES_AVAILABLE = True
except ImportError:
    MODULES_AVAILABLE = False
    get_all_modules = lambda: {}


class PlaywrightAdapter:
    """
    Adaptateur Playwright pour le framework stealth.
    
    Facilite l'utilisation du framework avec Playwright.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self._config = config or {}
        self._engine: Optional[FingerprintEngine] = None
    
    def create_engine(self, 
                      hardware_tier: HardwareTier = HardwareTier.MEDIUM,
                      os_type: OSType = OSType.WINDOWS,
                      browser_vendor: BrowserVendor = BrowserVendor.CHROME,
                      custom_seed: Optional[str] = None,
                      modules: Optional[Dict[str, Any]] = None) -> FingerprintEngine:
        """
        Crée un moteur fingerprint avec les services par défaut.
        """
        # Générer le profil
        profile = FingerprintProfile.generate(
            hardware_tier=hardware_tier,
            os_type=os_type,
            browser_vendor=browser_vendor,
            custom_seed=custom_seed
        )
        
        # Services
        validator = ProfileValidator()
        telemetry = TelemetryService()
        cache = LRUMemoryCache()
        
        # Capability
        registry = CapabilityRegistry()
        capability = CapabilityResolver(registry)
        
        # Builder, Injector, Optimizer
        builder = BuilderService()
        injector = InjectorService(telemetry=telemetry)
        optimizer = PlanOptimizer()
        
        # Behavior
        behavior = BehaviorService()
        
        # Observability
        observability = ObservabilityService()
        
        # Résolution des modules JS
        if modules is None:
            if MODULES_AVAILABLE:
                resolved_modules = get_all_modules()
            else:
                resolved_modules = {}
                if self._config.get('verbose', False):
                    print("⚠️ Modules d'évasion non disponibles")
        else:
            resolved_modules = modules
        
        # Créer l'engine
        self._engine = FingerprintEngine(
            profile=profile,
            builder=builder,
            injector=injector,
            validator=validator,
            capability=capability,
            optimizer=optimizer,
            behavior=behavior,
            telemetry=telemetry,
            observability=observability,
            cache=cache,
            modules=resolved_modules
        )
        
        return self._engine
    
    def apply_to_page(self, page: Page, 
                      enabled_modules: Optional[List[str]] = None,
                      browser_version: Optional[str] = None) -> bool:
        """
        Applique le stealth à une page Playwright.
        """
        if self._engine is None:
            raise ValueError("Engine not initialized. Call create_engine() first.")
        
        return self._engine.inject(page, enabled_modules, browser_version)
    
    def apply_to_context(self, context: BrowserContext,
                         enabled_modules: Optional[List[str]] = None,
                         browser_version: Optional[str] = None) -> bool:
        """
        Applique le stealth à un contexte Playwright.
        """
        if self._engine is None:
            raise ValueError("Engine not initialized. Call create_engine() first.")
        
        return self._engine.inject_context(context, enabled_modules, browser_version)
    
    def get_engine(self) -> Optional[FingerprintEngine]:
        """Retourne le moteur actuel"""
        return self._engine
    
    def get_profile(self) -> Optional[FingerprintProfile]:
        """Retourne le profil actuel"""
        if self._engine:
            return self._engine.profile
        return None


# =============================================================================
# Fonctions de commodité (API simplifiée)
# =============================================================================

def stealth_sync(page: Page,
                 hardware_tier: HardwareTier = HardwareTier.MEDIUM,
                 os_type: OSType = OSType.WINDOWS,
                 browser_vendor: BrowserVendor = BrowserVendor.CHROME,
                 enabled_modules: Optional[List[str]] = None,
                 browser_version: Optional[str] = None,
                 custom_seed: Optional[str] = None) -> bool:
    """
    Applique le stealth à une page Playwright (sync).
    
    Exemple:
        from playwright.sync_api import sync_playwright
        from playwright_stealth import stealth_sync
        
        with sync_playwright() as p:
            page = p.chromium.launch().new_page()
            stealth_sync(page)
            page.goto("https://example.com")
    """
    adapter = PlaywrightAdapter()
    
    # ✅ Forcer le chargement des modules JS d'évasion
    try:
        from ..js.modules import get_all_modules
        modules = get_all_modules()
    except ImportError:
        modules = {}
        if adapter._config.get('verbose', False):
            print("⚠️ Modules d'évasion non disponibles")
    
    # Créer l'engine avec les modules
    adapter.create_engine(
        hardware_tier=hardware_tier,
        os_type=os_type,
        browser_vendor=browser_vendor,
        custom_seed=custom_seed,
        modules=modules
    )
    
    # Appliquer à la page
    return adapter.apply_to_page(page, enabled_modules or [], browser_version)


async def stealth_async(page,
                        hardware_tier: HardwareTier = HardwareTier.MEDIUM,
                        os_type: OSType = OSType.WINDOWS,
                        browser_vendor: BrowserVendor = BrowserVendor.CHROME,
                        enabled_modules: Optional[List[str]] = None,
                        browser_version: Optional[str] = None,
                        custom_seed: Optional[str] = None) -> bool:
    """
    Applique le stealth à une page Playwright (async).
    """
    adapter = PlaywrightAdapter()
    
    # ✅ Forcer le chargement des modules JS d'évasion
    try:
        from ..js.modules import get_all_modules
        modules = get_all_modules()
    except ImportError:
        modules = {}
    
    adapter.create_engine(
        hardware_tier=hardware_tier,
        os_type=os_type,
        browser_vendor=browser_vendor,
        custom_seed=custom_seed,
        modules=modules
    )
    
    return await adapter._engine.inject_async(page, enabled_modules or [], browser_version)


def dump_configuration(hardware_tier: HardwareTier = HardwareTier.MEDIUM,
                       os_type: OSType = OSType.WINDOWS,
                       browser_vendor: BrowserVendor = BrowserVendor.CHROME):
    """
    Affiche la configuration du stealth.
    
    Exemple:
        from playwright_stealth import dump_configuration
        dump_configuration()
    """
    from ..core.profile import FingerprintProfile
    
    profile = FingerprintProfile.generate(hardware_tier, os_type, browser_vendor)
    
    print("=" * 60)
    print("🛡️ STEALTH CONFIGURATION")
    print("=" * 60)
    
    print(f"\n📌 Profil ID: {profile.id}")
    print(f"   Seed: {profile.seed}")
    
    print("\n📌 HARDWARE:")
    print(f"   CPU: {profile.hardware.cpu_cores} cores ({profile.hardware.cpu_model})")
    print(f"   RAM: {profile.hardware.ram_gb} GB")
    print(f"   GPU: {profile.hardware.gpu_model}")
    print(f"   Screen: {profile.hardware.screen_resolution[0]}x{profile.hardware.screen_resolution[1]}")
    
    print("\n📌 BROWSER:")
    print(f"   OS: {profile.browser.os_type.value}")
    print(f"   Platform: {profile.browser.platform}")
    print(f"   Locale: {profile.browser.locale}")
    print(f"   Timezone: {profile.browser.timezone}")
    print(f"   Languages: {profile.browser.languages}")
    
    print("\n" + "=" * 60)


__all__ = [
    "PlaywrightAdapter",
    "stealth_sync",
    "stealth_async",
    "dump_configuration",
]