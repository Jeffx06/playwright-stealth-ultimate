# models/diagnosis.py
"""
Modèle de diagnostic et recommandations
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional


@dataclass(slots=True)
class Recommendation:
    """Recommandation individuelle"""
    path: str
    severity: str  # 'critical', 'high', 'medium', 'low', 'info'
    reason: str
    suggestion: str
    before: Optional[Any] = None
    after: Optional[Any] = None
    affected_modules: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class Diagnosis:
    """Diagnostic complet"""
    total_issues: int
    critical: int
    high: int
    medium: int
    low: int
    recommendations: List[Recommendation] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def has_issues(self) -> bool:
        return self.total_issues > 0
    
    @property
    def has_critical(self) -> bool:
        return self.critical > 0
    
    @property
    def has_high(self) -> bool:
        return self.high > 0
    
    def to_dict(self) -> Dict:
        return {
            'total_issues': self.total_issues,
            'critical': self.critical,
            'high': self.high,
            'medium': self.medium,
            'low': self.low,
            'recommendations': [
                {
                    'path': r.path,
                    'severity': r.severity,
                    'reason': r.reason,
                    'suggestion': r.suggestion,
                    'before': r.before,
                    'after': r.after,
                    'affected_modules': r.affected_modules,
                    'metadata': r.metadata,
                }
                for r in self.recommendations
            ],
            'metadata': self.metadata,
        }
    
    @classmethod
    def from_diff(cls, diff_report: 'DiffReport') -> 'Diagnosis':
        """Crée un diagnostic à partir d'un rapport de diff"""
        recommendations = []
        for change in diff_report.changes:
            if change.severity and change.reason and change.suggestion:
                recommendations.append(
                    Recommendation(
                        path=change.path,
                        severity=change.severity.value,
                        reason=change.reason,
                        suggestion=change.suggestion,
                        before=change.before,
                        after=change.after,
                    )
                )
        
        return cls(
            total_issues=len(recommendations),
            critical=sum(1 for r in recommendations if r.severity == 'critical'),
            high=sum(1 for r in recommendations if r.severity == 'high'),
            medium=sum(1 for r in recommendations if r.severity == 'medium'),
            low=sum(1 for r in recommendations if r.severity == 'low'),
            recommendations=recommendations,
        )


__all__ = [
    "Recommendation",
    "Diagnosis",
]
