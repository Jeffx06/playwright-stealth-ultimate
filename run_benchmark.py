#!/usr/bin/env python
# run_benchmark.py
"""
Script pour exécuter les benchmarks du framework
"""

import sys
import os
from pathlib import Path

# Ajouter le chemin du projet
sys.path.insert(0, str(Path(__file__).parent))

from benchmark import BenchmarkSuite, BenchmarkScenarios, ReportGenerator
from core.profile import FingerprintProfile, HardwareTier, OSType, BrowserVendor
from services.builder import BuilderService
from services.capability import CapabilityResolver, CapabilityRegistry
from services.optimizer import PlanOptimizer
from js.loader import ScriptLoader


def run_benchmarks():
    """Exécute tous les benchmarks"""
    
    print("=" * 60)
    print("🚀 PLAYWRIGHT STEALTH - BENCHMARK")
    print("=" * 60)
    print()
    
    # Créer la suite
    suite = BenchmarkSuite(iterations=50, warmup=5)
    
    # ============ 1. Profile Generation ============
    print("📊 1. Profil Generation...")
    suite.run(
        name="profile_generation_low",
        func=lambda: FingerprintProfile.generate(
            hardware_tier=HardwareTier.LOW,
            os_type=OSType.WINDOWS
        ),
        scenario=BenchmarkScenarios.profile_generation(),
        metadata={"tier": "low", "os": "windows"}
    )
    
    suite.run(
        name="profile_generation_high",
        func=lambda: FingerprintProfile.generate(
            hardware_tier=HardwareTier.HIGH,
            os_type=OSType.MACOS
        ),
        scenario=BenchmarkScenarios.profile_generation(),
        metadata={"tier": "high", "os": "macos"}
    )
    
    # ============ 2. Plan Building ============
    print("📊 2. Plan Building...")
    
    # Créer un module factice pour le test
    class DummyModule:
        name = "dummy"
        priority = 100
        dependencies = ()
        conflicts = ()
        def build(self, profile, loader):
            return "// Dummy module script"
        def validate(self, profile):
            return []
    
    profile = FingerprintProfile.generate()
    builder = BuilderService()
    modules = [DummyModule()]
    
    suite.run(
        name="plan_building_1_module",
        func=lambda: builder.build(modules, profile),
        scenario=BenchmarkScenarios.plan_building(),
        metadata={"modules": 1}
    )
    
    # 5 modules
    modules_5 = [DummyModule() for _ in range(5)]
    for i, m in enumerate(modules_5):
        m.name = f"module_{i}"
    
    suite.run(
        name="plan_building_5_modules",
        func=lambda: builder.build(modules_5, profile),
        scenario=BenchmarkScenarios.plan_building(),
        metadata={"modules": 5}
    )
    
    # ============ 3. Plan Optimization ============
    print("📊 3. Plan Optimization...")
    
    optimizer = PlanOptimizer()
    plan = builder.build(modules_5, profile)
    
    suite.run(
        name="plan_optimization",
        func=lambda: optimizer.optimize(plan),
        scenario=BenchmarkScenarios.plan_optimization(),
        metadata={"modules": 5}
    )
    
    # ============ 4. Script Loading ============
    print("📊 4. Script Loading...")
    
    loader = ScriptLoader()
    
    suite.run(
        name="script_loader_webdriver",
        func=lambda: loader.get("webdriver"),
        scenario=BenchmarkScenarios.cold_start(),
        metadata={"script": "webdriver"}
    )
    
    suite.run(
        name="script_loader_chrome_runtime",
        func=lambda: loader.get("chrome_runtime"),
        scenario=BenchmarkScenarios.cold_start(),
        metadata={"script": "chrome_runtime"}
    )
    
    # ============ 5. Cache Performance ============
    print("📊 5. Cache Performance...")
    
    # Premier chargement (cache froid)
    suite.run(
        name="cache_cold",
        func=lambda: loader.get("webdriver"),
        scenario=BenchmarkScenarios.cold_start(),
        metadata={"cache": "cold"}
    )
    
    # Deuxième chargement (cache chaud)
    suite.run(
        name="cache_warm",
        func=lambda: loader.get("webdriver"),
        scenario=BenchmarkScenarios.warm_start(),
        metadata={"cache": "warm"}
    )
    
    # ============ Générer le rapport ============
    print("\n📊 Génération du rapport...")
    
    report_gen = ReportGenerator(suite)
    
    # Afficher le résumé
    print("\n" + "=" * 60)
    print("📊 RÉSULTATS DES BENCHMARKS")
    print("=" * 60)
    print()
    print(suite.to_markdown())
    
    # Sauvegarder les rapports
    report_dir = Path("benchmark_reports")
    report_dir.mkdir(exist_ok=True)
    
    report_gen.generate_all(prefix=str(report_dir / "benchmark"))
    
    print(f"\n✅ Rapports sauvegardés dans {report_dir}/")
    print(f"   - benchmark.html")
    print(f"   - benchmark.md")
    print(f"   - benchmark.json")
    
    return suite


if __name__ == "__main__":
    # Vérifier les dépendances
    try:
        import psutil
    except ImportError:
        print("⚠️ psutil n'est pas installé. Installation...")
        os.system("pip install psutil")
        import psutil
    
    run_benchmarks()
