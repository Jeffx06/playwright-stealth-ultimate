# services/optimizer.py
"""
Service d'optimisation des plans d'injection
"""

from typing import List, Set, Dict
from models.plan import InjectionPlan


class PlanOptimizer:
    """
    Optimiseur de plans d'injection.
    
    Responsabilités :
    - Supprimer les doublons de scripts
    - Fusionner les scripts compatibles
    - Optimiser l'ordre d'exécution
    """
    
    def __init__(self):
        self._optimization_count = 0
    
    def optimize(self, plan: InjectionPlan) -> InjectionPlan:
        """
        Optimise un plan d'injection.
        
        Args:
            plan: Plan à optimiser
            
        Returns:
            Plan optimisé
        """
        self._optimization_count += 1
        
        # 1. Supprimer les scripts vides
        scripts = [s for s in plan.scripts if s and s.strip()]
        
        # 2. Supprimer les doublons (en gardant l'ordre)
        unique_scripts = []
        seen: Set[str] = set()
        for script in scripts:
            # Utiliser un hash du script pour détecter les doublons
            script_hash = self._hash_script(script)
            if script_hash not in seen:
                unique_scripts.append(script)
                seen.add(script_hash)
        
        # 3. Compresser les scripts (optionnel)
        # Pour l'instant, on les garde séparés
        
        # 4. Vérifier les dépendances
        # TODO: Implémenter la vérification des dépendances
        
        return InjectionPlan(
            profile_id=plan.profile_id,
            modules=plan.modules,
            scripts=unique_scripts,
            dependencies=plan.dependencies,
            metadata={
                'optimized': True,
                'original_size': len(plan.scripts),
                'optimized_size': len(unique_scripts),
                'removed_duplicates': len(plan.scripts) - len(unique_scripts),
                'optimization_count': self._optimization_count,
                **plan.metadata,
            }
        )
    
    def _hash_script(self, script: str) -> str:
        """
        Calcule un hash pour un script.
        
        Utilisé pour détecter les doublons.
        """
        import hashlib
        return hashlib.md5(script.encode('utf-8')).hexdigest()[:16]
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Retourne les statistiques d'optimisation.
        
        Returns:
            Dictionnaire des statistiques
        """
        return {
            'optimization_count': self._optimization_count,
        }
    
    def reset_stats(self) -> None:
        """Réinitialise les statistiques d'optimisation"""
        self._optimization_count = 0