# diagnostics/recommendations.py
"""
Moteur de recommandations pour les profils
"""

from typing import List, Dict, Any
from models.diff import Change, ChangeSeverity, DiffReport
from models.diagnosis import Recommendation


class RecommendationEngine:
    """
    Moteur de recommandations.
    
    Responsabilités :
    - Générer des recommandations à partir des changements
    - Prioriser les recommandations
    - Proposer des corrections
    """
    
    def recommend(self, diff: DiffReport) -> List[Recommendation]:
        """
        Génère des recommandations à partir d'un rapport de diff.
        
        Args:
            diff: Rapport de diff
            
        Returns:
            Liste de recommandations
        """
        recommendations = []
        
        for change in diff.changes:
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
        
        # Trier par sévérité
        priority_order = {
            'critical': 0,
            'high': 1,
            'medium': 2,
            'low': 3,
            'info': 4,
        }
        recommendations.sort(key=lambda r: priority_order.get(r.severity, 5))
        
        return recommendations
    
    def get_summary(self, recommendations: List[Recommendation]) -> Dict[str, Any]:
        """
        Génère un résumé des recommandations.
        
        Args:
            recommendations: Liste de recommandations
            
        Returns:
            Résumé des recommandations
        """
        return {
            'total': len(recommendations),
            'critical': sum(1 for r in recommendations if r.severity == 'critical'),
            'high': sum(1 for r in recommendations if r.severity == 'high'),
            'medium': sum(1 for r in recommendations if r.severity == 'medium'),
            'low': sum(1 for r in recommendations if r.severity == 'low'),
            'priority': [
                {
                    'path': r.path,
                    'severity': r.severity,
                    'suggestion': r.suggestion,
                }
                for r in recommendations[:5]  # Top 5
            ]
        }


__all__ = [
    "RecommendationEngine",
]
