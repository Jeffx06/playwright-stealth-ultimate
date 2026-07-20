# benchmark/suite.py
"""
Suite de benchmarks
"""

import time
import statistics
import gc
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, field

from benchmark.scenarios import BenchmarkScenario, BenchmarkScenarios


@dataclass
class BenchmarkResult:
    """Résultat d'un benchmark"""
    name: str
    scenario: str
    iterations: int
    times: List[float]
    min_time: float
    max_time: float
    mean_time: float
    median_time: float
    p95_time: float
    p99_time: float
    std_dev: float
    memory_usage: float  # MB
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def summary(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "scenario": self.scenario,
            "iterations": self.iterations,
            "mean_ms": self.mean_time,
            "median_ms": self.median_time,
            "p95_ms": self.p95_time,
            "p99_ms": self.p99_time,
            "min_ms": self.min_time,
            "max_ms": self.max_time,
            "std_dev_ms": self.std_dev,
            "memory_mb": self.memory_usage,
        }


class BenchmarkSuite:
    """
    Suite de benchmarks pour mesurer les performances.
    
    Exemple:
        suite = BenchmarkSuite()
        suite.run("profile_generation", lambda: FingerprintProfile.generate())
        suite.run("plan_building", lambda: builder.build(modules, profile))
        report = suite.report()
    """

    def __init__(self, iterations: int = 100, warmup: int = 10):
        self.iterations = iterations
        self.warmup = warmup
        self.results: List[BenchmarkResult] = []
        self._metadata: Dict[str, Any] = {}

    def run(self, name: str, func: Callable, 
            scenario: Optional[BenchmarkScenario] = None,
            metadata: Optional[Dict[str, Any]] = None) -> BenchmarkResult:
        """
        Exécute un benchmark.
        
        Args:
            name: Nom du benchmark
            func: Fonction à mesurer
            scenario: Scénario associé
            metadata: Métadonnées supplémentaires
            
        Returns:
            Résultat du benchmark
        """
        scenario_name = scenario.name if scenario else "default"
        
        # Warmup
        for _ in range(self.warmup):
            try:
                func()
            except Exception:
                pass
        
        # Nettoyer la mémoire
        gc.collect()
        
        # Mesurer la mémoire avant
        import psutil
        process = psutil.Process()
        memory_before = process.memory_info().rss / 1024 / 1024
        
        # Exécuter les itérations
        times = []
        for _ in range(self.iterations):
            start = time.perf_counter()
            try:
                func()
            except Exception as e:
                print(f"⚠️ Erreur lors du benchmark {name}: {e}")
                continue
            end = time.perf_counter()
            times.append((end - start) * 1000)  # Convertir en ms
        
        # Mesurer la mémoire après
        memory_after = process.memory_info().rss / 1024 / 1024
        memory_usage = max(0, memory_after - memory_before)
        
        # Statistiques
        if not times:
            raise ValueError(f"Aucune mesure valide pour {name}")
        
        result = BenchmarkResult(
            name=name,
            scenario=scenario_name,
            iterations=len(times),
            times=times,
            min_time=min(times),
            max_time=max(times),
            mean_time=statistics.mean(times),
            median_time=statistics.median(times),
            p95_time=statistics.quantiles(times, n=100)[94] if len(times) >= 100 else max(times),
            p99_time=statistics.quantiles(times, n=100)[98] if len(times) >= 100 else max(times),
            std_dev=statistics.stdev(times) if len(times) > 1 else 0,
            memory_usage=memory_usage,
            metadata=metadata or {},
        )
        
        self.results.append(result)
        return result

    def report(self) -> Dict[str, Any]:
        """Génère un rapport complet des benchmarks"""
        return {
            "summary": {
                "total_benchmarks": len(self.results),
                "iterations": self.iterations,
                "warmup": self.warmup,
            },
            "results": [r.summary for r in self.results],
            "metadata": self._metadata,
        }

    def to_markdown(self) -> str:
        """Génère un rapport en Markdown"""
        lines = ["# 📊 Rapport de Benchmark\n"]
        lines.append(f"**Itérations**: {self.iterations}")
        lines.append(f"**Warmup**: {self.warmup}\n")
        
        lines.append("| Benchmark | Scénario | Mean (ms) | Median (ms) | P95 (ms) | P99 (ms) | Memory (MB) |")
        lines.append("|-----------|----------|-----------|-------------|----------|----------|-------------|")
        
        for r in self.results:
            lines.append(
                f"| {r.name} | {r.scenario} | "
                f"{r.mean_time:.2f} | {r.median_time:.2f} | "
                f"{r.p95_time:.2f} | {r.p99_time:.2f} | "
                f"{r.memory_usage:.2f} |"
            )
        
        return "\n".join(lines)

    def to_html(self) -> str:
        """Génère un rapport en HTML"""
        html = '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Benchmark Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: center; }}
                th {{ background-color: #4CAF50; color: white; }}
                tr:nth-child(even) {{ background-color: #f2f2f2; }}
                .good {{ color: green; }}
                .medium {{ color: orange; }}
                .bad {{ color: red; }}
                .summary {{ margin: 20px 0; padding: 10px; background: #f9f9f9; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <h1>📊 Rapport de Benchmark</h1>
            <div class="summary">
                <p><strong>Itérations:</strong> {iterations}</p>
                <p><strong>Warmup:</strong> {warmup}</p>
                <p><strong>Total benchmarks:</strong> {total}</p>
            </div>
            <table>
                <tr>
                    <th>Benchmark</th>
                    <th>Scénario</th>
                    <th>Mean (ms)</th>
                    <th>Median (ms)</th>
                    <th>P95 (ms)</th>
                    <th>P99 (ms)</th>
                    <th>Memory (MB)</th>
                </tr>
                {rows}
            </table>
        </body>
        </html>
        '''
        
        rows = []
        for r in self.results:
            mean_class = "good" if r.mean_time < 50 else "medium" if r.mean_time < 200 else "bad"
            rows.append(
                f"<tr>"
                f"<td><strong>{r.name}</strong></td>"
                f"<td>{r.scenario}</td>"
                f"<td class='{mean_class}'>{r.mean_time:.2f}</td>"
                f"<td>{r.median_time:.2f}</td>"
                f"<td>{r.p95_time:.2f}</td>"
                f"<td>{r.p99_time:.2f}</td>"
                f"<td>{r.memory_usage:.2f}</td>"
                f"</tr>"
            )
        
        return html.format(
            iterations=self.iterations,
            warmup=self.warmup,
            total=len(self.results),
            rows="\n".join(rows)
        )
