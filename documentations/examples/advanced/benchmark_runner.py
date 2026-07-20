#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Exemple avancé : Benchmark Runner

Ce script exécute une suite complète de benchmarks pour mesurer
les performances du framework Playwright Stealth.

Niveau : Avancé
Temps estimé : 10-20 minutes (selon les itérations)

Fonctionnalités :
- Benchmarks de performance (génération de profil, construction de plan, etc.)
- Benchmarks d'injection (Playwright, Selenium)
- Benchmarks de cache
- Génération de rapports (HTML, Markdown, JSON)
- Comparaison avec des benchmarks précédents
- Métriques complètes (mean, median, P95, P99, std dev, memory)

Compatibilité : Python 3.10+, Playwright 1.40+
"""

import sys
import os
import json
import time
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass

# =============================================================================
# AJOUT DU CHEMIN DU PROJET
# =============================================================================

# Ajouter le chemin du projet avant toute importation locale
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# =============================================================================
# IMPORTS DU FRAMEWORK
# =============================================================================

from core.profile import FingerprintProfile, HardwareTier, OSType, BrowserVendor
from services.builder import BuilderService
from services.capability import CapabilityResolver, CapabilityRegistry
from services.optimizer import PlanOptimizer
from js.loader import ScriptLoader

# Imports conditionnels pour le module benchmark
try:
    from benchmark.suite import BenchmarkSuite
    from benchmark.scenarios import BenchmarkScenarios
    from benchmark.report import ReportGenerator
    BENCHMARK_AVAILABLE = True
except ImportError as e:
    BENCHMARK_AVAILABLE = False
    print(f"⚠️ Module benchmark non disponible: {e}")
    print("   Assurez-vous que le dossier benchmark/ existe et contient les fichiers nécessaires.")


# =============================================================================
# 1. CONFIGURATION
# =============================================================================

@dataclass
class BenchmarkConfig:
    """Configuration des benchmarks"""
    iterations: int = 50
    warmup: int = 5
    output_dir: str = "benchmark_reports"
    verbose: bool = True
    compare_with: Optional[str] = None  # Chemin vers un rapport précédent


DEFAULT_CONFIG = BenchmarkConfig()


# =============================================================================
# 2. FONCTIONS DE BENCHMARK
# =============================================================================

def create_benchmark_functions() -> Dict[str, Callable]:
    """
    Crée les fonctions de benchmark à exécuter.

    Returns:
        Dict[str, Callable]: Dictionnaire des fonctions de benchmark
    """
    functions = {}

    # -------------------------------------------------------------------------
    # 2.1. Génération de profil
    # -------------------------------------------------------------------------

    def benchmark_profile_generation_low():
        FingerprintProfile.generate(
            hardware_tier=HardwareTier.LOW,
            os_type=OSType.WINDOWS
        )

    def benchmark_profile_generation_high():
        FingerprintProfile.generate(
            hardware_tier=HardwareTier.HIGH,
            os_type=OSType.MACOS
        )

    functions["profile_generation_low"] = benchmark_profile_generation_low
    functions["profile_generation_high"] = benchmark_profile_generation_high

    # -------------------------------------------------------------------------
    # 2.2. Construction de plan
    # -------------------------------------------------------------------------

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
    modules_1 = [DummyModule()]
    modules_5 = [DummyModule() for _ in range(5)]
    for i, m in enumerate(modules_5):
        m.name = f"module_{i}"

    def benchmark_plan_building_1():
        builder.build(modules_1, profile)

    def benchmark_plan_building_5():
        builder.build(modules_5, profile)

    functions["plan_building_1_module"] = benchmark_plan_building_1
    functions["plan_building_5_modules"] = benchmark_plan_building_5

    # -------------------------------------------------------------------------
    # 2.3. Optimisation de plan
    # -------------------------------------------------------------------------

    optimizer = PlanOptimizer()
    plan = builder.build(modules_5, profile)

    def benchmark_plan_optimization():
        optimizer.optimize(plan)

    functions["plan_optimization"] = benchmark_plan_optimization

    # -------------------------------------------------------------------------
    # 2.4. Chargement de scripts
    # -------------------------------------------------------------------------

    loader = ScriptLoader()

    def benchmark_script_loader_webdriver():
        loader.get("navigator.webdriver")

    def benchmark_script_loader_chrome_runtime():
        loader.get("chrome.runtime")

    functions["script_loader_webdriver"] = benchmark_script_loader_webdriver
    functions["script_loader_chrome_runtime"] = benchmark_script_loader_chrome_runtime

    # -------------------------------------------------------------------------
    # 2.5. Cache performance
    # -------------------------------------------------------------------------

    def benchmark_cache_cold():
        # Forcer un nouveau loader sans cache
        temp_loader = ScriptLoader()
        temp_loader.get("navigator.webdriver")

    def benchmark_cache_warm():
        loader.get("navigator.webdriver")  # Utilise le cache

    functions["cache_cold"] = benchmark_cache_cold
    functions["cache_warm"] = benchmark_cache_warm

    # -------------------------------------------------------------------------
    # 2.6. Injection Playwright (optionnel)
    # -------------------------------------------------------------------------

    try:
        from playwright.sync_api import sync_playwright
        from adapters.playwright import stealth_sync

        def benchmark_injection_playwright():
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                try:
                    stealth_sync(page)
                finally:
                    browser.close()

        functions["injection_playwright"] = benchmark_injection_playwright

    except ImportError as e:
        if DEFAULT_CONFIG.verbose:
            print(f"⚠️ Playwright non disponible: {e}")

    # -------------------------------------------------------------------------
    # 2.7. Injection Selenium (optionnel)
    # -------------------------------------------------------------------------

    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from adapters.selenium import stealth_selenium

        def benchmark_injection_selenium():
            options = Options()
            options.add_argument("--headless")
            driver = webdriver.Chrome(options=options)
            try:
                stealth_selenium(driver, use_cdp=True)
            finally:
                driver.quit()

        functions["injection_selenium"] = benchmark_injection_selenium

    except ImportError as e:
        if DEFAULT_CONFIG.verbose:
            print(f"⚠️ Selenium non disponible: {e}")

    return functions


# =============================================================================
# 3. EXÉCUTION DES BENCHMARKS
# =============================================================================

def run_benchmarks(
    config: BenchmarkConfig = DEFAULT_CONFIG
) -> Dict[str, Any]:
    """
    Exécute la suite de benchmarks.

    Args:
        config: Configuration des benchmarks

    Returns:
        Dict[str, Any]: Résultats des benchmarks
    """
    if not BENCHMARK_AVAILABLE:
        print("❌ Module benchmark non disponible")
        print("   Vérifiez que le dossier benchmark/ existe.")
        return {}

    print("=" * 70)
    print("🚀 PLAYWRIGHT STEALTH - BENCHMARK RUNNER")
    print("=" * 70)
    print(f"\n📊 Configuration:")
    print(f"   Itérations: {config.iterations}")
    print(f"   Warmup: {config.warmup}")
    print(f"   Output: {config.output_dir}")
    print()

    # Créer la suite de benchmarks
    suite = BenchmarkSuite(
        iterations=config.iterations,
        warmup=config.warmup
    )

    # Récupérer les fonctions de benchmark
    functions = create_benchmark_functions()

    if not functions:
        print("❌ Aucune fonction de benchmark disponible")
        return {}

    print(f"📋 Benchmarks à exécuter: {len(functions)}")
    print()

    # Scénarios par défaut
    scenarios = {
        "profile_generation": BenchmarkScenarios.profile_generation(),
        "plan_building": BenchmarkScenarios.plan_building(),
        "plan_optimization": BenchmarkScenarios.plan_optimization(),
        "cold_start": BenchmarkScenarios.cold_start(),
        "warm_start": BenchmarkScenarios.warm_start(),
        "full_injection_playwright": BenchmarkScenarios.full_injection_playwright(),
        "full_injection_selenium": BenchmarkScenarios.full_injection_selenium()
    }

    # Exécuter chaque benchmark
    results = {}
    for name, func in functions.items():
        print(f"📊 Benchmark: {name}...")
        try:
            # Déterminer le scénario
            scenario = None
            for key, sc in scenarios.items():
                if key in name:
                    scenario = sc
                    break

            # Exécuter
            result = suite.run(
                name=name,
                func=func,
                scenario=scenario,
                metadata={"iterations": config.iterations, "warmup": config.warmup}
            )

            results[name] = result
            print(f"   ✅ Mean: {result.mean_time:.3f} ms, P95: {result.p95_time:.3f} ms")

        except Exception as e:
            print(f"   ❌ Erreur: {e}")
            results[name] = None

    print("\n" + "=" * 70)
    print("📊 BENCHMARKS TERMINÉS")
    print("=" * 70)
    successful = len([r for r in results.values() if r is not None])
    print(f"Total: {successful}/{len(results)} réussis")

    return {
        "suite": suite,
        "results": results,
        "config": config
    }


# =============================================================================
# 4. GÉNÉRATION DES RAPPORTS
# =============================================================================

def generate_reports(
    benchmark_data: Dict[str, Any],
    config: BenchmarkConfig = DEFAULT_CONFIG
) -> Dict[str, str]:
    """
    Génère les rapports de benchmark.

    Args:
        benchmark_data: Données des benchmarks
        config: Configuration

    Returns:
        Dict[str, str]: Chemins des rapports générés
    """
    if not BENCHMARK_AVAILABLE:
        print("❌ Module benchmark non disponible")
        return {}

    suite = benchmark_data.get("suite")
    if not suite:
        print("❌ Aucune donnée de benchmark à rapporter")
        return {}

    # Créer le dossier de sortie
    output_dir = Path(config.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Générer les rapports
    report_gen = ReportGenerator(suite)

    # Ajouter la date dans le nom des fichiers
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    prefix = str(output_dir / f"benchmark_{timestamp}")

    print(f"\n📝 Génération des rapports...")

    # Générer tous les formats
    report_gen.generate_all(prefix=prefix)

    # Afficher les chemins
    files = {
        "html": f"{prefix}.html",
        "markdown": f"{prefix}.md",
        "json": f"{prefix}.json"
    }

    print(f"   ✅ HTML: {files['html']}")
    print(f"   ✅ Markdown: {files['markdown']}")
    print(f"   ✅ JSON: {files['json']}")

    return files


# =============================================================================
# 5. COMPARAISON AVEC DES BENCHMARKS PRÉCÉDENTS
# =============================================================================

def compare_with_previous(
    current_data: Dict[str, Any],
    previous_path: str
) -> Dict[str, Any]:
    """
    Compare les benchmarks actuels avec des benchmarks précédents.

    Args:
        current_data: Données des benchmarks actuels
        previous_path: Chemin vers le rapport précédent (JSON)

    Returns:
        Dict[str, Any]: Résultat de la comparaison
    """
    try:
        with open(previous_path, 'r', encoding='utf-8') as f:
            previous_data = json.load(f)

        print(f"\n📊 Comparaison avec {previous_path}")

        current_results = current_data.get("results", {})
        previous_results = {r['name']: r for r in previous_data.get('results', [])}

        comparison = {
            "timestamp": datetime.now().isoformat(),
            "changes": []
        }

        for name, current in current_results.items():
            if current is None:
                continue

            prev = previous_results.get(name)
            if prev:
                mean_diff = current.mean_time - prev['mean_ms']
                mean_diff_pct = (mean_diff / prev['mean_ms']) * 100 if prev['mean_ms'] > 0 else 0

                comparison["changes"].append({
                    "name": name,
                    "current_ms": current.mean_time,
                    "previous_ms": prev['mean_ms'],
                    "diff_ms": mean_diff,
                    "diff_pct": mean_diff_pct,
                    "status": "✅" if mean_diff_pct < 5 else "⚠️" if mean_diff_pct < 20 else "❌"
                })

                print(f"   {comparison['changes'][-1]['status']} {name}: "
                      f"{prev['mean_ms']:.2f} → {current.mean_time:.2f} ms "
                      f"({mean_diff_pct:+.1f}%)")

        return comparison

    except Exception as e:
        print(f"❌ Erreur lors de la comparaison: {e}")
        return {}


# =============================================================================
# 6. POINT D'ENTRÉE PRINCIPAL
# =============================================================================

def main():
    """Point d'entrée principal."""
    parser = argparse.ArgumentParser(
        description="Benchmark Runner pour Playwright Stealth"
    )
    parser.add_argument(
        "-i", "--iterations",
        type=int,
        default=50,
        help="Nombre d'itérations par benchmark (défaut: 50)"
    )
    parser.add_argument(
        "-w", "--warmup",
        type=int,
        default=5,
        help="Nombre d'itérations de warmup (défaut: 5)"
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default="benchmark_reports",
        help="Dossier de sortie pour les rapports (défaut: benchmark_reports)"
    )
    parser.add_argument(
        "-c", "--compare",
        type=str,
        default=None,
        help="Chemin vers un rapport précédent pour comparaison"
    )
    parser.add_argument(
        "-q", "--quiet",
        action="store_true",
        help="Mode silencieux (moins de logs)"
    )

    args = parser.parse_args()

    # Configurer le logging
    if args.quiet:
        import logging
        logging.basicConfig(level=logging.WARNING)
    else:
        import logging
        logging.basicConfig(level=logging.INFO)

    # Configurer les benchmarks
    config = BenchmarkConfig(
        iterations=args.iterations,
        warmup=args.warmup,
        output_dir=args.output,
        verbose=not args.quiet,
        compare_with=args.compare
    )

    # Exécuter les benchmarks
    benchmark_data = run_benchmarks(config)

    if not benchmark_data or not benchmark_data.get("results"):
        print("❌ Aucun résultat de benchmark disponible")
        return 1

    # Générer les rapports
    reports = generate_reports(benchmark_data, config)

    # Comparaison avec un rapport précédent
    if args.compare:
        comparison = compare_with_previous(benchmark_data, args.compare)

        # Sauvegarder la comparaison
        if comparison:
            output_dir = Path(config.output_dir)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            comp_path = output_dir / f"comparison_{timestamp}.json"
            with open(comp_path, 'w', encoding='utf-8') as f:
                json.dump(comparison, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Comparaison sauvegardée: {comp_path}")

    print("\n" + "=" * 70)
    print("✅ Benchmark Runner terminé")
    print("=" * 70)

    return 0


if __name__ == "__main__":
    sys.exit(main())