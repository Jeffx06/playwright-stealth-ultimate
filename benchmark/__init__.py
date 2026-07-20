# benchmark/__init__.py
"""
Benchmarks de performance du framework
"""

from .suite import BenchmarkSuite
from .scenarios import BenchmarkScenarios
from .report import ReportGenerator

__all__ = [
    "BenchmarkSuite",
    "BenchmarkScenarios",
    "ReportGenerator",
]
