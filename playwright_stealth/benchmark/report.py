# benchmark/report.py
"""
Générateur de rapports de benchmark
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json


class ReportGenerator:
    """
    Générateur de rapports de benchmark.
    
    Supporte les formats : HTML, Markdown, JSON
    """

    def __init__(self, suite):
        self.suite = suite
        self._metadata = {
            "generated_at": datetime.now().isoformat(),
            "iterations": suite.iterations,
            "warmup": suite.warmup,
        }

    def generate_html(self, filename: Optional[str] = None) -> str:
        """Génère un rapport HTML"""
        html = self.suite.to_html()
        if filename:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(html)
        return html

    def generate_markdown(self, filename: Optional[str] = None) -> str:
        """Génère un rapport Markdown"""
        md = self.suite.to_markdown()
        if filename:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(md)
        return md

    def generate_json(self, filename: Optional[str] = None) -> str:
        """Génère un rapport JSON"""
        report = {
            "metadata": self._metadata,
            "results": [r.summary for r in self.suite.results],
        }
        json_str = json.dumps(report, indent=2, ensure_ascii=False)
        if filename:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(json_str)
        return json_str

    def generate_all(self, prefix: str = "benchmark_report") -> Dict[str, str]:
        """Génère tous les formats de rapport"""
        return {
            "html": self.generate_html(f"{prefix}.html"),
            "markdown": self.generate_markdown(f"{prefix}.md"),
            "json": self.generate_json(f"{prefix}.json"),
        }

    def compare_with(self, other: 'ReportGenerator') -> Dict[str, Any]:
        """Compare deux rapports de benchmark"""
        comparison = {
            "timestamp": datetime.now().isoformat(),
            "changes": []
        }
        
        for r1, r2 in zip(self.suite.results, other.suite.results):
            if r1.name == r2.name:
                change = {
                    "name": r1.name,
                    "scenario": r1.scenario,
                    "mean_diff": r2.mean_time - r1.mean_time,
                    "mean_diff_pct": ((r2.mean_time - r1.mean_time) / r1.mean_time) * 100 if r1.mean_time > 0 else 0,
                    "memory_diff": r2.memory_usage - r1.memory_usage,
                }
                comparison["changes"].append(change)
        
        return comparison
