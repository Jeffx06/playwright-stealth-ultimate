# core/engine.py
"""
FingerprintEngine - Orchestrateur principal du framework
"""

from typing import List, Optional, Dict, Any, Set
import time

from core.profile import FingerprintProfile
from core.types import EvasionModule
from models.plan import InjectionPlan

from services.builder import BuilderService
from services.injector import InjectorService
from services.validator import ProfileValidator
from services.capability import CapabilityResolver, CapabilityRegistry
from services.optimizer import PlanOptimizer
from services.behavior import BehaviorService
from services.telemetry import TelemetryService
from services.observability import ObservabilityService
from cache.protocol import CacheProtocol
from cache.memory import LRUMemoryCache


class FingerprintEngine:
    """
    Orchestrateur principal du framework.
    """
    
    def __init__(
        self,
        profile: FingerprintProfile,
        builder: BuilderService,
        injector: InjectorService,
        validator: ProfileValidator,
        capability: CapabilityResolver,
        optimizer: PlanOptimizer,
        behavior: BehaviorService,
        telemetry: TelemetryService,
        observability: ObservabilityService,
        cache: Optional[CacheProtocol] = None,
        modules: Optional[Dict[str, EvasionModule]] = None,
    ):
        self._profile = profile
        self._builder = builder
        self._injector = injector
        self._validator = validator
        self._capability = capability
        self._optimizer = optimizer
        self._behavior = behavior
        self._telemetry = telemetry
        self._observability = observability
        self._cache = cache or LRUMemoryCache()
        self._modules = modules or {}
        
        # Valider le profil automatiquement
        self._validator.validate_or_raise(profile)
    
    @property
    def profile(self) -> FingerprintProfile:
        return self._profile
    
    @property
    def modules(self) -> Dict[str, EvasionModule]:
        return self._modules
    
    def inject(self, 
               page,
               enabled_modules: Optional[List[str]] = None,
               browser_version: Optional[str] = None,
               optimize: bool = True) -> bool:
        """
        Injecte le stealth dans une page.
        """
        with self._telemetry.timer("injection_total"):
            # 1. Résoudre les capacités
            with self._telemetry.timer("capability_resolution"):
                compatible_modules = self._capability.resolve(
                    requested_modules=enabled_modules,
                    modules_registry=self._modules,
                    browser_version=browser_version,
                )
            
            # Si aucun module compatible, on injecte quand même un script minimal
            if not compatible_modules:
                # Injecter un script minimal pour éviter l'échec
                page.add_init_script("// Stealth: No modules available")
                self._telemetry.record("injection_empty", {
                    "profile_id": self._profile.id,
                    "modules_requested": enabled_modules,
                })
                return True
            
            # 2. Construire le plan
            with self._telemetry.timer("plan_building"):
                plan = self._builder.build(
                    modules=compatible_modules,
                    profile=self._profile,
                )
            
            # 3. Optimiser le plan
            if optimize:
                with self._telemetry.timer("plan_optimization"):
                    plan = self._optimizer.optimize(plan)
            
            # 4. Injecter
            with self._telemetry.timer("injection_execution"):
                success = self._injector.inject(page, plan)
            
            # 5. Télémétrie
            self._telemetry.record("injection_summary", {
                "profile_id": self._profile.id,
                "modules": plan.modules,
                "script_count": plan.script_count,
                "checksum": plan.checksum,
                "optimized": optimize,
                "success": success,
            })
            
            return success
    
    async def inject_async(self,
                           page,
                           enabled_modules: Optional[List[str]] = None,
                           browser_version: Optional[str] = None,
                           optimize: bool = True) -> bool:
        """
        Injection asynchrone.
        """
        with self._telemetry.timer("injection_total"):
            compatible_modules = self._capability.resolve(
                requested_modules=enabled_modules,
                modules_registry=self._modules,
                browser_version=browser_version,
            )
            
            if not compatible_modules:
                await page.add_init_script("// Stealth: No modules available")
                self._telemetry.record("injection_empty", {
                    "profile_id": self._profile.id,
                    "modules_requested": enabled_modules,
                })
                return True
            
            plan = self._builder.build(
                modules=compatible_modules,
                profile=self._profile,
            )
            
            if optimize:
                plan = self._optimizer.optimize(plan)
            
            success = await self._injector.inject_async(page, plan)
            
            self._telemetry.record("injection_summary", {
                "profile_id": self._profile.id,
                "modules": plan.modules,
                "script_count": plan.script_count,
                "checksum": plan.checksum,
                "optimized": optimize,
                "success": success,
            })
            
            return success
    
    def inject_context(self,
                       context,
                       enabled_modules: Optional[List[str]] = None,
                       browser_version: Optional[str] = None,
                       optimize: bool = True) -> bool:
        """
        Injecte le stealth dans un contexte.
        """
        with self._telemetry.timer("injection_total"):
            compatible_modules = self._capability.resolve(
                requested_modules=enabled_modules,
                modules_registry=self._modules,
                browser_version=browser_version,
            )
            
            if not compatible_modules:
                context.add_init_script("// Stealth: No modules available")
                self._telemetry.record("injection_empty", {
                    "profile_id": self._profile.id,
                    "modules_requested": enabled_modules,
                })
                return True
            
            plan = self._builder.build(
                modules=compatible_modules,
                profile=self._profile,
            )
            
            if optimize:
                plan = self._optimizer.optimize(plan)
            
            success = self._injector.inject_context(context, plan)
            
            self._telemetry.record("injection_summary", {
                "profile_id": self._profile.id,
                "modules": plan.modules,
                "script_count": plan.script_count,
                "checksum": plan.checksum,
                "optimized": optimize,
                "success": success,
                "scope": "context",
            })
            
            return success
    
    def register_module(self, module: EvasionModule) -> None:
        """Enregistre un module d'évasion"""
        self._modules[module.name] = module
    
    def unregister_module(self, name: str) -> None:
        """Désenregistre un module"""
        self._modules.pop(name, None)
    
    def get_plan(self,
                 enabled_modules: Optional[List[str]] = None,
                 browser_version: Optional[str] = None,
                 optimize: bool = True) -> InjectionPlan:
        """
        Génère un plan d'injection sans l'injecter.
        """
        compatible_modules = self._capability.resolve(
            requested_modules=enabled_modules,
            modules_registry=self._modules,
            browser_version=browser_version,
        )
        
        plan = self._builder.build(
            modules=compatible_modules,
            profile=self._profile,
        )
        
        if optimize:
            plan = self._optimizer.optimize(plan)
        
        return plan
    
    def capture_snapshot(self, page) -> 'SnapshotNode':
        """Capture un snapshot du navigateur"""
        return self._observability.capture(page)
    
    def compare_snapshots(self, a: 'SnapshotNode', b: 'SnapshotNode') -> 'DiffReport':
        """Compare deux snapshots"""
        return self._observability.compare(a, b)
    
    def diagnose(self, diff: 'DiffReport') -> 'Diagnosis':
        """Diagnostique un diff"""
        return self._observability.diagnose(diff)
    
    def get_behavior_profile(self, seed: Optional[int] = None) -> 'HumanProfile':
        """Génère un profil comportemental"""
        return self._behavior.generate_profile(seed)
    
    def get_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques du moteur"""
        return {
            'profile_id': self._profile.id,
            'modules_count': len(self._modules),
            'optimizer_stats': self._optimizer.get_stats(),
            'telemetry': self._telemetry.get_summary(),
        }
