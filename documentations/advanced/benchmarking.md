# Benchmarking

Guide complet pour mesurer et analyser les performances du framework Playwright Stealth.

---

## 📋 Vue d'ensemble

Le benchmarking permet de mesurer objectivement les performances du framework et d'identifier les goulots d'étranglement.

```mermaid
graph TD
    A[Benchmarking] --> B[Métriques]
    A --> C[Scénarios]
    A --> D[Outils]
    A --> E[Analyse]
    
    B --> B1[Temps d'injection]
    B --> B2[Utilisation mémoire]
    B --> B3[Taux de succès]
    B --> B4[Charge CPU]
    
    C --> C1[Injection unique]
    C --> C2[Injection massive]
    C --> C3[Rotation profils]
    C --> C4[Scraping]
    
    D --> D1[run_benchmark.py]
    D --> D2[BenchmarkSuite]
    D --> D3[Profiling]
    
    E --> E1[Rapports]
    E --> E2[Comparaisons]
    E --> E3[Recommandations]
📊 Métriques de performance
1. Métriques principales
python
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class BenchmarkMetrics:
    """Métriques de benchmark."""
    
    # Injection
    injection_time_ms: float
    success: bool
    error: Optional[str] = None
    
    # Profil
    profile_generation_ms: float = 0.0
    profile_validation_ms: float = 0.0
    
    # Cache
    cache_hit_rate: float = 0.0
    cache_size: int = 0
    
    # Système
    memory_usage_mb: float = 0.0
    cpu_usage_percent: float = 0.0

    def to_dict(self) -> dict:
        """Convertir en dictionnaire."""
        return {
            'injection_time_ms': self.injection_time_ms,
            'success': self.success,
            'profile_generation_ms': self.profile_generation_ms,
            'profile_validation_ms': self.profile_validation_ms,
            'cache_hit_rate': self.cache_hit_rate,
            'cache_size': self.cache_size,
            'memory_usage_mb': self.memory_usage_mb,
            'cpu_usage_percent': self.cpu_usage_percent
        }
2. Collecte des métriques
python
import time
import psutil
from playwright_stealth import stealth_sync
from playwright_stealth.core.profile import FingerprintProfile
from playwright_stealth import HardwareTier, OSType

class MetricsCollector:
    """Collecteur de métriques de performance."""
    
    def __init__(self):
        self.metrics = []
        self.process = psutil.Process()
    
    def measure_injection(self, page, profile=None):
        """Mesurer une injection."""
        # Métriques système avant
        mem_before = self.process.memory_info().rss / 1024 / 1024
        cpu_before = self.process.cpu_percent()
        
        # Timing de l'injection
        start = time.perf_counter()
        try:
            success = stealth_sync(page, profile=profile)
            error = None
        except Exception as e:
            success = False
            error = str(e)
        duration = (time.perf_counter() - start) * 1000
        
        # Métriques système après
        mem_after = self.process.memory_info().rss / 1024 / 1024
        cpu_after = self.process.cpu_percent()
        
        metrics = BenchmarkMetrics(
            injection_time_ms=duration,
            success=success,
            error=error,
            profile_generation_ms=0,
            profile_validation_ms=0,
            cache_hit_rate=0,
            cache_size=0,
            memory_usage_mb=mem_after - mem_before,
            cpu_usage_percent=cpu_after - cpu_before
        )
        
        self.metrics.append(metrics)
        return metrics
    
    def get_statistics(self):
        """Obtenir les statistiques."""
        if not self.metrics:
            return {}
        
        times = [m.injection_time_ms for m in self.metrics]
        successes = [m.success for m in self.metrics]
        
        return {
            'total_injections': len(self.metrics),
            'success_rate': sum(successes) / len(successes) * 100,
            'avg_time_ms': sum(times) / len(times),
            'min_time_ms': min(times),
            'max_time_ms': max(times),
            'avg_memory_mb': sum(m.memory_usage_mb for m in self.metrics) / len(self.metrics),
            'avg_cpu_percent': sum(m.cpu_usage_percent for m in self.metrics) / len(self.metrics)
        }
🏃 Suite de benchmarks
1. Benchmark d'injection
python
# run_benchmark.py
import time
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
from playwright_stealth import FingerprintProfile, HardwareTier, OSType

class InjectionBenchmark:
    """Benchmark d'injection."""
    
    def __init__(self):
        self.results = {
            'simple': [],
            'with_profile': [],
            'parallel': []
        }
    
    def benchmark_simple_injection(self, n: int = 100):
        """Benchmark de l'injection simple."""
        print(f"🔬 Injection simple ({n} itérations)...")
        
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            
            for i in range(n):
                start = time.perf_counter()
                success = stealth_sync(page)
                duration = (time.perf_counter() - start) * 1000
                
                self.results['simple'].append({
                    'iteration': i,
                    'duration_ms': duration,
                    'success': success
                })
            
            browser.close()
    
    def benchmark_with_profile(self, n: int = 100):
        """Benchmark avec profil personnalisé."""
        print(f"🔬 Injection avec profil ({n} itérations)...")
        
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            
            for i in range(n):
                profile = FingerprintProfile.generate(
                    hardware_tier=HardwareTier.MEDIUM,
                    os_type=OSType.WINDOWS,
                    custom_seed=str(i)
                )
                
                start = time.perf_counter()
                success = stealth_sync(page, profile=profile)
                duration = (time.perf_counter() - start) * 1000
                
                self.results['with_profile'].append({
                    'iteration': i,
                    'duration_ms': duration,
                    'success': success,
                    'profile_seed': i
                })
            
            browser.close()
    
    def benchmark_parallel_injection(self, n: int = 10):
        """Benchmark d'injection parallèle."""
        print(f"🔬 Injection parallèle ({n} pages)...")
        
        from concurrent.futures import ThreadPoolExecutor
        
        def inject_page(page_id: int):
            with sync_playwright() as p:
                browser = p.chromium.launch()
                page = browser.new_page()
                
                start = time.perf_counter()
                success = stealth_sync(page)
                duration = (time.perf_counter() - start) * 1000
                
                browser.close()
                return {
                    'page_id': page_id,
                    'duration_ms': duration,
                    'success': success
                }
        
        with ThreadPoolExecutor(max_workers=n) as executor:
            futures = [executor.submit(inject_page, i) for i in range(n)]
            results = [f.result() for f in futures]
        
        self.results['parallel'] = results
    
    def run_all(self):
        """Exécuter tous les benchmarks."""
        print("🚀 Démarrage des benchmarks...\n")
        
        self.benchmark_simple_injection(50)
        print()
        self.benchmark_with_profile(50)
        print()
        self.benchmark_parallel_injection(20)
        print()
        
        self.generate_report()
    
    def generate_report(self):
        """Générer un rapport détaillé."""
        print("\n" + "="*60)
        print("📊 RAPPORT DE BENCHMARK")
        print("="*60 + "\n")
        
        for name, results in self.results.items():
            if not results:
                continue
            
            durations = [r['duration_ms'] for r in results]
            successes = [r.get('success', True) for r in results]
            
            print(f"📈 {name.upper()}:")
            print(f"  Total: {len(results)} injections")
            print(f"  Taux de succès: {sum(successes)/len(successes)*100:.1f}%")
            print(f"  Temps moyen: {sum(durations)/len(durations):.2f}ms")
            print(f"  Min: {min(durations):.2f}ms")
            print(f"  Max: {max(durations):.2f}ms")
            print()

# Exécution
if __name__ == "__main__":
    benchmark = InjectionBenchmark()
    benchmark.run_all()
2. Benchmark de génération de profils
python
class ProfileBenchmark:
    """Benchmark de génération de profils."""
    
    def __init__(self):
        self.results = {
            'generation': [],
            'validation': []
        }
    
    def benchmark_generation(self, n: int = 1000):
        """Benchmark de génération de profils."""
        print(f"🔬 Génération de profils ({n} itérations)...")
        
        from playwright_stealth import FingerprintProfile, HardwareTier, OSType
        
        for i in range(n):
            start = time.perf_counter()
            profile = FingerprintProfile.generate(
                hardware_tier=HardwareTier.MEDIUM,
                os_type=OSType.WINDOWS,
                custom_seed=str(i)
            )
            duration = (time.perf_counter() - start) * 1000
            
            self.results['generation'].append({
                'seed': i,
                'duration_ms': duration
            })
    
    def benchmark_validation(self, n: int = 100):
        """Benchmark de validation de profils."""
        print(f"🔬 Validation de profils ({n} itérations)...")
        
        from playwright_stealth.services.validator import ProfileValidator
        from playwright_stealth import FingerprintProfile, HardwareTier, OSType
        
        validator = ProfileValidator()
        profiles = [
            FingerprintProfile.generate(
                hardware_tier=HardwareTier.MEDIUM,
                os_type=OSType.WINDOWS,
                custom_seed=str(i)
            )
            for i in range(n)
        ]
        
        for i, profile in enumerate(profiles):
            start = time.perf_counter()
            errors = validator.validate(profile)
            duration = (time.perf_counter() - start) * 1000
            
            self.results['validation'].append({
                'index': i,
                'duration_ms': duration,
                'valid': len(errors) == 0
            })
    
    def generate_report(self):
        """Générer un rapport détaillé."""
        print("\n" + "="*60)
        print("📊 RAPPORT DE BENCHMARK - PROFILS")
        print("="*60 + "\n")
        
        for name, results in self.results.items():
            if not results:
                continue
            
            durations = [r['duration_ms'] for r in results]
            
            print(f"📈 {name.upper()}:")
            print(f"  Total: {len(results)} opérations")
            print(f"  Temps moyen: {sum(durations)/len(durations):.3f}ms")
            print(f"  Min: {min(durations):.3f}ms")
            print(f"  Max: {max(durations):.3f}ms")
            print()
📈 Analyse des résultats
1. Export des résultats
python
import json
import csv
from datetime import datetime

class BenchmarkReporter:
    """Générateur de rapports de benchmark."""
    
    def __init__(self, results: dict):
        self.results = results
        self.timestamp = datetime.now().isoformat()
    
    def to_json(self, filename: str = "benchmark_results.json"):
        """Exporter en JSON."""
        data = {
            'timestamp': self.timestamp,
            'results': self.results
        }
        
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"✅ Rapport exporté: {filename}")
    
    def to_csv(self, filename: str = "benchmark_results.csv"):
        """Exporter en CSV."""
        with open(filename, 'w', newline='') as f:
            writer = csv.writer(f)
            
            # En-têtes
            writer.writerow(['Test', 'Iteration', 'Duration_ms', 'Success'])
            
            # Données
            for test_name, results in self.results.items():
                for r in results:
                    writer.writerow([
                        test_name,
                        r.get('iteration', r.get('page_id', r.get('index', 0))),
                        r['duration_ms'],
                        r.get('success', True)
                    ])
        
        print(f"✅ Rapport exporté: {filename}")
    
    def print_summary(self):
        """Afficher un résumé."""
        print("\n" + "="*60)
        print("📊 RÉSUMÉ DES PERFORMANCES")
        print("="*60 + "\n")
        
        for name, results in self.results.items():
            if not results:
                continue
            
            durations = [r['duration_ms'] for r in results]
            successes = [r.get('success', True) for r in results]
            
            print(f"📈 {name.upper()}:")
            print(f"  ✅ Taux de succès: {sum(successes)/len(successes)*100:.1f}%")
            print(f"  ⏱️  Moyenne: {sum(durations)/len(durations):.2f}ms")
            print(f"  ⏱️  P50: {sorted(durations)[len(durations)//2]:.2f}ms")
            print(f"  ⏱️  P95: {sorted(durations)[int(len(durations)*0.95)]:.2f}ms")
            print()
2. Visualisation
python
import matplotlib.pyplot as plt

class BenchmarkVisualizer:
    """Visualisation des benchmarks."""
    
    def __init__(self, results: dict):
        self.results = results
    
    def plot_durations(self, filename: str = "benchmark_durations.png"):
        """Tracer les durées d'injection."""
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        axes = axes.flatten()
        
        for idx, (name, results) in enumerate(self.results.items()):
            if idx >= 4 or not results:
                continue
            
            durations = [r['duration_ms'] for r in results]
            ax = axes[idx]
            
            ax.hist(durations, bins=20, alpha=0.7, color='blue')
            ax.axvline(sum(durations)/len(durations), color='red', linestyle='--', label='Moyenne')
            ax.set_title(f"{name.upper()}")
            ax.set_xlabel("Durée (ms)")
            ax.set_ylabel("Fréquence")
            ax.legend()
        
        plt.tight_layout()
        plt.savefig(filename)
        print(f"✅ Graphique sauvegardé: {filename}")
    
    def plot_comparison(self, filename: str = "benchmark_comparison.png"):
        """Comparer les différentes configurations."""
        fig, ax = plt.subplots(figsize=(10, 6))
        
        names = []
        means = []
        
        for name, results in self.results.items():
            if not results:
                continue
            
            durations = [r['duration_ms'] for r in results]
            names.append(name.upper())
            means.append(sum(durations)/len(durations))
        
        x = range(len(names))
        ax.bar(x, means, alpha=0.7)
        ax.set_xticks(x)
        ax.set_xticklabels(names)
        ax.set_ylabel("Durée moyenne (ms)")
        ax.set_title("Comparaison des performances")
        
        # Ajouter les valeurs
        for i, v in enumerate(means):
            ax.text(i, v + 0.5, f"{v:.1f}ms", ha='center')
        
        plt.tight_layout()
        plt.savefig(filename)
        print(f"✅ Graphique sauvegardé: {filename}")
📊 Résultats de référence
Performances attendues
Métrique	Valeur	Conditions
Injection simple	5-15 ms	Profil par défaut
Injection avec profil	10-25 ms	Profil personnalisé
Génération profil	0.03-0.08 ms	Profil prédéfini
Validation profil	0.1-0.5 ms	Validation standard
Cache hit	< 1 ms	Scripts en cache
Memory usage	< 20 MB	100 injections
Commandes de benchmark
bash
# Benchmarks complets
python run_benchmark.py

# Benchmark d'injection
python -c "from benchmark.suite import BenchmarkSuite; suite = BenchmarkSuite(); suite.run_injection_benchmark()"

# Benchmark de profils
python -c "from benchmark.suite import BenchmarkSuite; suite = BenchmarkSuite(); suite.run_profile_benchmark()"

# Export JSON
python run_benchmark.py --export json --output results.json

# Export CSV
python run_benchmark.py --export csv --output results.csv

# Visualisation
python run_benchmark.py --visualize --output charts/
🔗 Navigation rapide
Module	Description
Performance	Optimisation des performances
Testing	Stratégies de test
API Core	Types et moteur
🚀 Prochaine étape
📖 Performance - Optimisation des performances

📖 Testing - Stratégies de test

📖 Guide de configuration

Dernière mise à jour : 2026-07-19
Version : 5.0.0