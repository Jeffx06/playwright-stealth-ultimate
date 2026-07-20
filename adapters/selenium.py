# adapters/selenium.py
"""
Adaptateur Selenium pour le framework stealth
"""

from typing import Optional, List, Dict, Any
from selenium.webdriver.remote.webdriver import WebDriver

from core.engine import FingerprintEngine
from core.profile import FingerprintProfile, HardwareTier, OSType, BrowserVendor
from services.builder import BuilderService
from services.injector import InjectorService
from services.validator import ProfileValidator
from services.capability import CapabilityResolver, CapabilityRegistry
from services.optimizer import PlanOptimizer
from services.behavior import BehaviorService
from services.telemetry import TelemetryService
from services.observability import ObservabilityService
from cache.memory import LRUMemoryCache


class SeleniumAdapter:
    """
    Adaptateur Selenium pour le framework stealth.
    
    Facilite l'utilisation du framework avec Selenium WebDriver.
    
    Exemple:
        from selenium import webdriver
        from playwright_stealth.adapters.selenium import SeleniumAdapter
        
        driver = webdriver.Chrome()
        adapter = SeleniumAdapter()
        adapter.create_engine()
        adapter.apply_to_driver(driver)
        driver.get("https://example.com")
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
            modules=modules or {}
        )
        
        return self._engine
    
    def apply_to_driver(self, driver: WebDriver,
                        enabled_modules: Optional[List[str]] = None,
                        browser_version: Optional[str] = None) -> bool:
        """
        Applique le stealth à un driver Selenium.
        
        Args:
            driver: Driver Selenium (Chrome, Firefox, Edge)
            enabled_modules: Modules à activer
            browser_version: Version du navigateur
            
        Returns:
            True si l'injection a réussi
        """
        if self._engine is None:
            raise ValueError("Engine not initialized. Call create_engine() first.")
        
        # Générer le plan
        plan = self._engine.get_plan(
            enabled_modules=enabled_modules,
            browser_version=browser_version,
            optimize=True
        )
        
        # Construire le payload
        payload = "\n\n".join(plan.scripts)
        
        if not payload:
            return True
        
        # Injecter via Selenium
        try:
            # Méthode standard pour Chrome/Edge
            if hasattr(driver, 'execute_cdp_cmd'):
                # CDP (Chrome DevTools Protocol) pour Chrome/Edge
                driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                    'source': payload
                })
            elif hasattr(driver, 'execute_script'):
                # Fallback: exécuter le script directement
                driver.execute_script(f"""
                    (function() {{
                        const script = document.createElement('script');
                        script.textContent = `{payload.replace('`', '\\`')}`;
                        document.documentElement.appendChild(script);
                        script.remove();
                    }})();
                """)
            else:
                # Dernier recours: utiliser execute_script
                driver.execute_script(payload)
            
            # Télémétrie
            self._engine._telemetry.record("injection_success", {
                "profile_id": self._engine.profile.id,
                "modules": plan.modules,
                "script_count": plan.script_count,
                "driver_type": type(driver).__name__,
            })
            
            return True
            
        except Exception as e:
            self._engine._telemetry.record("injection_error", {
                "profile_id": self._engine.profile.id,
                "error": str(e),
            })
            raise
    
    def apply_to_driver_with_cdp(self, driver: WebDriver,
                                  enabled_modules: Optional[List[str]] = None,
                                  browser_version: Optional[str] = None) -> bool:
        """
        Applique le stealth via CDP (Chrome DevTools Protocol).
        
        Recommandé pour Chrome/Edge pour une injection propre.
        """
        if self._engine is None:
            raise ValueError("Engine not initialized. Call create_engine() first.")
        
        if not hasattr(driver, 'execute_cdp_cmd'):
            raise ValueError("CDP not available for this driver. Use apply_to_driver() instead.")
        
        plan = self._engine.get_plan(
            enabled_modules=enabled_modules,
            browser_version=browser_version,
            optimize=True
        )
        
        payload = "\n\n".join(plan.scripts)
        
        if not payload:
            return True
        
        try:
            driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': payload
            })
            
            self._engine._telemetry.record("injection_success", {
                "profile_id": self._engine.profile.id,
                "modules": plan.modules,
                "script_count": plan.script_count,
                "method": "cdp",
            })
            
            return True
            
        except Exception as e:
            self._engine._telemetry.record("injection_error", {
                "profile_id": self._engine.profile.id,
                "error": str(e),
            })
            raise
    
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

def stealth_selenium(driver: WebDriver,
                     hardware_tier: HardwareTier = HardwareTier.MEDIUM,
                     os_type: OSType = OSType.WINDOWS,
                     browser_vendor: BrowserVendor = BrowserVendor.CHROME,
                     enabled_modules: Optional[List[str]] = None,
                     browser_version: Optional[str] = None,
                     custom_seed: Optional[str] = None,
                     use_cdp: bool = True) -> bool:
    """
    Applique le stealth à un driver Selenium.
    
    Exemple:
        from selenium import webdriver
        from playwright_stealth.adapters.selenium import stealth_selenium
        
        driver = webdriver.Chrome()
        stealth_selenium(driver)
        driver.get("https://example.com")
    
    Args:
        driver: Driver Selenium
        hardware_tier: Niveau de performance matérielle
        os_type: Type de système d'exploitation
        browser_vendor: Fournisseur du navigateur
        enabled_modules: Modules à activer
        browser_version: Version du navigateur
        custom_seed: Seed personnalisée
        use_cdp: Utiliser CDP (recommandé pour Chrome/Edge)
        
    Returns:
        True si l'injection a réussi
    """
    adapter = SeleniumAdapter()
    adapter.create_engine(hardware_tier, os_type, browser_vendor, custom_seed, modules={})
    
    if use_cdp and hasattr(driver, 'execute_cdp_cmd'):
        return adapter.apply_to_driver_with_cdp(driver, enabled_modules, browser_version)
    
    return adapter.apply_to_driver(driver, enabled_modules, browser_version)


__all__ = [
    "SeleniumAdapter",
    "stealth_selenium",
]