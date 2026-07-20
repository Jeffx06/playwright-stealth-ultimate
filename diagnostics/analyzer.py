# diagnostics/analyzer.py
"""
Analyseur de cohérence des profils
"""

from typing import List, Dict, Any, Optional
from models.diff import Change, ChangeSeverity, DiffReport


class ConsistencyAnalyzer:
    """
    Analyseur de cohérence pour les profils.
    
    Responsabilités :
    - Analyser les différences entre snapshots
    - Détecter les incohérences
    - Assigner des sévérités
    """
    
    def analyze(self, diff: DiffReport) -> DiffReport:
        """
        Analyse un rapport de diff et assigne des sévérités.
        
        Args:
            diff: Rapport de diff à analyser
            
        Returns:
            Rapport de diff avec sévérités assignées
        """
        for change in diff.changes:
            if change.type.value == "changed":
                self._analyze_change(change)
        
        return diff
    
    def _analyze_change(self, change: Change):
        """Analyse un changement individuel"""
        
        # Incohérences WebGL
        if change.path == 'webgl.vendor':
            if change.after and 'Intel' not in change.after and 'NVIDIA' not in change.after:
                change.severity = ChangeSeverity.HIGH
                change.reason = "Vendor GPU improbable pour un navigateur standard"
                change.suggestion = "Utiliser 'Intel Inc.' ou 'NVIDIA Corporation'"
        
        elif change.path == 'webgl.renderer':
            if change.after and 'ANGLE' not in change.after:
                change.severity = ChangeSeverity.HIGH
                change.reason = "Renderer non standard"
                change.suggestion = "Utiliser 'ANGLE (Intel, ...)' ou 'ANGLE (NVIDIA, ...)'"
        
        # Incohérences de langue
        elif change.path == 'intl.timezone':
            # Récupérer la langue depuis le changement
            lang = 'en'
            if change.before and isinstance(change.before, str):
                if '-' in change.before:
                    lang = change.before.split('-')[0]
            elif change.after and isinstance(change.after, str):
                if '-' in change.after:
                    lang = change.after.split('-')[0]
            
            region_map = {
                'fr': ['Paris'],
                'en': ['New_York', 'London'],
                'de': ['Berlin'],
                'ja': ['Tokyo'],
                'es': ['Madrid'],
                'it': ['Rome'],
                'pt': ['Lisbon'],
                'zh': ['Shanghai'],
            }
            
            if lang in region_map and change.after:
                if not any(r in str(change.after) for r in region_map[lang]):
                    change.severity = ChangeSeverity.CRITICAL
                    change.reason = f"Langue '{lang}' incohérente avec fuseau '{change.after}'"
                    change.suggestion = f"Utiliser l'un de ces fuseaux: {region_map[lang]}"
        
        # Incohérences de plateforme
        elif change.path == 'navigator.platform':
            # Récupérer le User-Agent depuis le diff
            ua = ''
            # Chercher dans le contexte (à améliorer avec un vrai contexte)
            if change.after == 'Win32' and 'Windows' not in str(change.before or ''):
                change.severity = ChangeSeverity.HIGH
                change.reason = "Platform 'Win32' avec User-Agent non Windows"
                change.suggestion = "Corriger User-Agent pour inclure 'Windows NT'"
            elif change.after == 'MacIntel' and 'Macintosh' not in str(change.before or ''):
                change.severity = ChangeSeverity.HIGH
                change.reason = "Platform 'MacIntel' avec User-Agent non MacOS"
                change.suggestion = "Corriger User-Agent pour inclure 'Macintosh'"
        
        # Incohérences DPI
        elif change.path == 'window.devicePixelRatio':
            if change.after and change.after > 1.5:
                change.severity = ChangeSeverity.MEDIUM
                change.reason = f"DPI {change.after} élevé"
                change.suggestion = "Vérifier la cohérence avec la résolution d'écran"


__all__ = [
    "ConsistencyAnalyzer",
]
