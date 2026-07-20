# benchmark/scenarios.py
"""
Scénarios de benchmark
"""

from dataclasses import dataclass
from typing import Callable, Optional, List, Dict, Any
import time


@dataclass
class BenchmarkScenario:
    """Scénario de benchmark"""
    name: str
    description: str
    setup: Optional[Callable] = None
    teardown: Optional[Callable] = None


class BenchmarkScenarios:
    """Collection de scénarios de benchmark"""

    @staticmethod
    def cold_start() -> BenchmarkScenario:
        """Scénario : Démarrage à froid"""
        return BenchmarkScenario(
            name="cold_start",
            description="Premier démarrage du framework (sans cache)"
        )

    @staticmethod
    def warm_start() -> BenchmarkScenario:
        """Scénario : Démarrage à chaud"""
        return BenchmarkScenario(
            name="warm_start",
            description="Démarrage avec cache pré-chargé"
        )

    @staticmethod
    def profile_generation() -> BenchmarkScenario:
        """Scénario : Génération de profil"""
        return BenchmarkScenario(
            name="profile_generation",
            description="Génération d'un profil d'empreinte"
        )

    @staticmethod
    def plan_building() -> BenchmarkScenario:
        """Scénario : Construction de plan"""
        return BenchmarkScenario(
            name="plan_building",
            description="Construction d'un plan d'injection"
        )

    @staticmethod
    def plan_optimization() -> BenchmarkScenario:
        """Scénario : Optimisation de plan"""
        return BenchmarkScenario(
            name="plan_optimization",
            description="Optimisation d'un plan d'injection"
        )

    @staticmethod
    def full_injection_playwright() -> BenchmarkScenario:
        """Scénario : Injection complète avec Playwright"""
        return BenchmarkScenario(
            name="full_injection_playwright",
            description="Injection complète du stealth avec Playwright"
        )

    @staticmethod
    def full_injection_selenium() -> BenchmarkScenario:
        """Scénario : Injection complète avec Selenium"""
        return BenchmarkScenario(
            name="full_injection_selenium",
            description="Injection complète du stealth avec Selenium"
        )

    @staticmethod
    def get_all() -> List[BenchmarkScenario]:
        """Retourne tous les scénarios"""
        return [
            BenchmarkScenarios.cold_start(),
            BenchmarkScenarios.warm_start(),
            BenchmarkScenarios.profile_generation(),
            BenchmarkScenarios.plan_building(),
            BenchmarkScenarios.plan_optimization(),
            BenchmarkScenarios.full_injection_playwright(),
            BenchmarkScenarios.full_injection_selenium(),
        ]
