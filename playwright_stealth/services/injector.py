# services/injector.py
"""
Service d'injection dans le navigateur
"""

from typing import Optional, Any

from models.plan import InjectionPlan
from services.telemetry import TelemetryService


class InjectorService:
    """
    Service d'injection des scripts dans le navigateur.
    
    Responsabilités :
    - Injecter les scripts d'un plan dans une page
    - Gérer l'injection synchrone et asynchrone
    - Vérifier l'intégrité du plan avant injection
    """
    
    def __init__(self, telemetry: Optional[TelemetryService] = None):
        self._telemetry = telemetry or TelemetryService()
    
    def inject(self, page, plan: InjectionPlan, verify: bool = True) -> bool:
        """
        Injecte un plan dans une page.
        
        Args:
            page: Page Playwright (sync)
            plan: Plan d'injection
            verify: Vérifier l'intégrité du plan
            
        Returns:
            True si l'injection a réussi
        """
        if verify and not self._verify_plan(plan):
            self._telemetry.record("injection_failed", {
                "reason": "plan_verification_failed",
                "profile_id": plan.profile_id,
            })
            return False
        
        try:
            # Construire le payload
            payload = "\n\n".join(plan.scripts)
            
            # Injecter
            page.add_init_script(payload)
            
            # Télémétrie
            self._telemetry.record("injection_success", {
                "profile_id": plan.profile_id,
                "modules": plan.modules,
                "script_count": plan.script_count,
                "payload_size": len(payload),
            })
            
            return True
            
        except Exception as e:
            self._telemetry.record("injection_error", {
                "profile_id": plan.profile_id,
                "error": str(e),
            })
            raise
    
    async def inject_async(self, page, plan: InjectionPlan, verify: bool = True) -> bool:
        """
        Injection asynchrone.
        
        Args:
            page: Page Playwright (async)
            plan: Plan d'injection
            verify: Vérifier l'intégrité du plan
            
        Returns:
            True si l'injection a réussi
        """
        if verify and not self._verify_plan(plan):
            self._telemetry.record("injection_failed", {
                "reason": "plan_verification_failed",
                "profile_id": plan.profile_id,
            })
            return False
        
        try:
            payload = "\n\n".join(plan.scripts)
            await page.add_init_script(payload)
            
            self._telemetry.record("injection_success", {
                "profile_id": plan.profile_id,
                "modules": plan.modules,
                "script_count": plan.script_count,
                "payload_size": len(payload),
            })
            
            return True
            
        except Exception as e:
            self._telemetry.record("injection_error", {
                "profile_id": plan.profile_id,
                "error": str(e),
            })
            raise
    
    def inject_context(self, context, plan: InjectionPlan, verify: bool = True) -> bool:
        """
        Injecte un plan dans un contexte (toutes les pages héritent).
        
        Args:
            context: BrowserContext Playwright
            plan: Plan d'injection
            verify: Vérifier l'intégrité du plan
            
        Returns:
            True si l'injection a réussi
        """
        if verify and not self._verify_plan(plan):
            self._telemetry.record("injection_failed", {
                "reason": "plan_verification_failed",
                "profile_id": plan.profile_id,
            })
            return False
        
        try:
            payload = "\n\n".join(plan.scripts)
            context.add_init_script(payload)
            
            self._telemetry.record("injection_success", {
                "profile_id": plan.profile_id,
                "modules": plan.modules,
                "script_count": plan.script_count,
                "payload_size": len(payload),
                "scope": "context",
            })
            
            return True
            
        except Exception as e:
            self._telemetry.record("injection_error", {
                "profile_id": plan.profile_id,
                "error": str(e),
            })
            raise
    
    def _verify_plan(self, plan: InjectionPlan) -> bool:
        """
        Vérifie l'intégrité d'un plan.
        
        Args:
            plan: Plan à vérifier
            
        Returns:
            True si le plan est valide
        """
        if not plan.scripts:
            return False
        
        # Vérifier le checksum
        expected = plan.checksum
        actual = plan._compute_checksum()
        
        return expected == actual