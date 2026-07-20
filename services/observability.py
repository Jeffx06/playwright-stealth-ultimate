# services/observability.py
"""
Service d'observabilité - Snapshot, Diff, Diagnostic
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

from core.types import NodeType, ChangeSeverity, ChangeType
from models.snapshot import SnapshotNode


@dataclass(slots=True)
class Change:
    """Un changement détecté dans un diff"""
    path: str
    type: ChangeType
    before: Optional[Any]
    after: Optional[Any]
    severity: Optional[ChangeSeverity] = None
    reason: Optional[str] = None
    suggestion: Optional[str] = None


@dataclass(slots=True)
class DiffReport:
    """Rapport de diff"""
    changes: List[Change]
    
    @property
    def total_changes(self) -> int:
        return len(self.changes)
    
    @property
    def critical_count(self) -> int:
        return sum(1 for c in self.changes if c.severity == ChangeSeverity.CRITICAL)
    
    @property
    def high_count(self) -> int:
        return sum(1 for c in self.changes if c.severity == ChangeSeverity.HIGH)
    
    @property
    def medium_count(self) -> int:
        return sum(1 for c in self.changes if c.severity == ChangeSeverity.MEDIUM)
    
    @property
    def low_count(self) -> int:
        return sum(1 for c in self.changes if c.severity == ChangeSeverity.LOW)
    
    def to_dict(self) -> Dict:
        return {
            'total_changes': self.total_changes,
            'critical': self.critical_count,
            'high': self.high_count,
            'medium': self.medium_count,
            'low': self.low_count,
            'changes': [
                {
                    'path': c.path,
                    'type': c.type.value,
                    'before': c.before,
                    'after': c.after,
                    'severity': c.severity.value if c.severity else None,
                    'reason': c.reason,
                    'suggestion': c.suggestion,
                }
                for c in self.changes
            ]
        }


@dataclass(slots=True)
class Diagnosis:
    """Diagnostic complet d'un profil"""
    total_issues: int
    critical: int
    high: int
    medium: int
    low: int
    recommendations: List[Dict[str, Any]]
    
    def to_dict(self) -> Dict:
        return {
            'total_issues': self.total_issues,
            'critical': self.critical,
            'high': self.high,
            'medium': self.medium,
            'low': self.low,
            'recommendations': self.recommendations,
        }


class ObservabilityService:
    """
    Service d'observabilité.
    
    Responsabilités :
    - Capturer des snapshots du navigateur
    - Comparer des snapshots
    - Diagnostiquer les incohérences
    """
    
    def __init__(self):
        self._snapshot_cache: Dict[str, SnapshotNode] = {}
    
    def capture(self, page) -> SnapshotNode:
        """
        Capture un snapshot complet du navigateur.
        
        Args:
            page: Page Playwright
            
        Returns:
            SnapshotNode arborescent
        """
        data = page.evaluate("""
            () => {
                function getProperties(obj, maxDepth) {
                    if (maxDepth === 0) return null;
                    const result = {};
                    const proto = Object.getPrototypeOf(obj);
                    
                    const ownProps = Object.getOwnPropertyNames(obj);
                    for (const key of ownProps) {
                        try {
                            const descriptor = Object.getOwnPropertyDescriptor(obj, key);
                            if (descriptor && typeof descriptor.value !== 'function') {
                                result[key] = descriptor.value;
                            }
                        } catch(e) {
                            result[key] = '[unaccessible]';
                        }
                    }
                    
                    if (proto && proto !== Object.prototype) {
                        const protoProps = getProperties(proto, maxDepth - 1);
                        if (protoProps) {
                            result['__proto__'] = protoProps;
                        }
                    }
                    
                    return result;
                }
                
                return {
                    navigator: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        vendor: navigator.vendor,
                        languages: navigator.languages,
                        webdriver: navigator.webdriver,
                        deviceMemory: navigator.deviceMemory,
                        hardwareConcurrency: navigator.hardwareConcurrency,
                        pdfViewerEnabled: navigator.pdfViewerEnabled,
                    },
                    screen: {
                        width: screen.width,
                        height: screen.height,
                        availWidth: screen.availWidth,
                        availHeight: screen.availHeight,
                        colorDepth: screen.colorDepth,
                        pixelDepth: screen.pixelDepth,
                    },
                    window: {
                        outerWidth: window.outerWidth,
                        outerHeight: window.outerHeight,
                        innerWidth: window.innerWidth,
                        innerHeight: window.innerHeight,
                        devicePixelRatio: window.devicePixelRatio,
                    },
                    intl: {
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        locale: Intl.NumberFormat().resolvedOptions().locale,
                    },
                    webgl: (() => {
                        try {
                            const canvas = document.createElement('canvas');
                            const gl = canvas.getContext('webgl');
                            if (!gl) return null;
                            const ext = gl.getExtension('WEBGL_debug_renderer_info');
                            if (!ext) return null;
                            return {
                                vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
                                renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
                                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                            };
                        } catch(e) {
                            return null;
                        }
                    })(),
                    performance: {
                        memory: performance.memory,
                        timeOrigin: performance.timeOrigin,
                    }
                };
            }
        """)
        
        # Construire l'arborescence
        root = SnapshotNode(name='root', value=None, node_type=NodeType.OBJECT)
        
        def build_tree(obj: Any, parent: SnapshotNode, name: str = ''):
            if isinstance(obj, dict):
                node = SnapshotNode(name=name, value=None, node_type=NodeType.OBJECT)
                parent.add_child(node)
                for key, value in obj.items():
                    if isinstance(value, dict):
                        build_tree(value, node, key)
                    else:
                        child = SnapshotNode(name=key, value=value, node_type=NodeType.PROPERTY)
                        node.add_child(child)
            else:
                child = SnapshotNode(name=name, value=obj, node_type=NodeType.PROPERTY)
                parent.add_child(child)
        
        build_tree(data, root, 'browser')
        
        return root
    
    def compare(self, a: SnapshotNode, b: SnapshotNode) -> DiffReport:
        """
        Compare deux snapshots.
        
        Args:
            a: Premier snapshot
            b: Second snapshot
            
        Returns:
            Rapport de diff
        """
        changes = []
        self._compare_nodes(a, b, '', changes)
        return DiffReport(changes=changes)
    
    def _compare_nodes(self, a: SnapshotNode, b: SnapshotNode,
                       path: str, changes: List[Change]):
        """Comparaison récursive de noeuds - O(1) par niveau"""
        
        a_keys = set(a.children.keys())
        b_keys = set(b.children.keys())
        
        # Noeuds supprimés (dans a mais pas dans b)
        for key in a_keys - b_keys:
            changes.append(Change(
                path=f"{path}.{key}" if path else key,
                type=ChangeType.REMOVED,
                before=a.children[key].value,
                after=None
            ))
        
        # Noeuds ajoutés (dans b mais pas dans a)
        for key in b_keys - a_keys:
            changes.append(Change(
                path=f"{path}.{key}" if path else key,
                type=ChangeType.ADDED,
                before=None,
                after=b.children[key].value
            ))
        
        # Noeuds communs
        for key in a_keys & b_keys:
            a_node = a.children[key]
            b_node = b.children[key]
            new_path = f"{path}.{key}" if path else key
            
            # Comparer les valeurs
            if a_node.value != b_node.value:
                changes.append(Change(
                    path=new_path,
                    type=ChangeType.CHANGED,
                    before=a_node.value,
                    after=b_node.value
                ))
            
            # Comparer récursivement
            if a_node.children or b_node.children:
                self._compare_nodes(a_node, b_node, new_path, changes)
    
    def diagnose(self, diff: DiffReport) -> Diagnosis:
        """
        Diagnostique un diff et produit des recommandations.
        
        Args:
            diff: Rapport de diff
            
        Returns:
            Diagnostic complet
        """
        recommendations = []
        
        for change in diff.changes:
            if change.type == ChangeType.CHANGED:
                severity, reason, suggestion = self._analyze_change(change)
                if severity:
                    change.severity = severity
                    change.reason = reason
                    change.suggestion = suggestion
                    recommendations.append({
                        'path': change.path,
                        'severity': severity.value,
                        'reason': reason,
                        'suggestion': suggestion,
                        'before': change.before,
                        'after': change.after,
                    })
        
        return Diagnosis(
            total_issues=len(recommendations),
            critical=sum(1 for r in recommendations if r['severity'] == 'critical'),
            high=sum(1 for r in recommendations if r['severity'] == 'high'),
            medium=sum(1 for r in recommendations if r['severity'] == 'medium'),
            low=sum(1 for r in recommendations if r['severity'] == 'low'),
            recommendations=recommendations
        )
    
    def _analyze_change(self, change: Change) -> Tuple[Optional[ChangeSeverity], Optional[str], Optional[str]]:
        """Analyse un changement et retourne (severity, reason, suggestion)"""
        
        # Incohérences WebGL
        if change.path == 'browser.webgl.vendor':
            if change.after and 'Intel' not in change.after and 'NVIDIA' not in change.after:
                return (
                    ChangeSeverity.HIGH,
                    "Vendor GPU improbable pour un navigateur standard",
                    "Utiliser 'Intel Inc.' ou 'NVIDIA Corporation'"
                )
        
        if change.path == 'browser.webgl.renderer':
            if change.after and 'ANGLE' not in change.after:
                return (
                    ChangeSeverity.HIGH,
                    "Renderer non standard",
                    "Utiliser 'ANGLE (Intel, ...)' ou 'ANGLE (NVIDIA, ...)'"
                )
        
        # Incohérences de langue
        if change.path == 'browser.intl.timezone':
            # Récupérer la langue depuis le diff
            lang = 'en'
            for c in change.path.split('.'):
                if c == 'timezone':
                    # Essayer de trouver la locale
                    for other in [change.before, change.after]:
                        if isinstance(other, str) and '-' in other:
                            lang = other.split('-')[0]
                            break
            
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
                if not any(r in change.after for r in region_map[lang]):
                    return (
                        ChangeSeverity.CRITICAL,
                        f"Langue '{lang}' incohérente avec fuseau '{change.after}'",
                        f"Utiliser l'un de ces fuseaux: {region_map[lang]}"
                    )
        
        # Incohérences de plateforme
        if change.path == 'browser.navigator.platform':
            # Récupérer le User-Agent
            ua = ''
            for c in diff.changes:
                if c.path == 'browser.navigator.userAgent':
                    ua = c.after or ''
                    break
            
            if change.after == 'Win32' and 'Windows' not in ua:
                return (
                    ChangeSeverity.HIGH,
                    "Platform 'Win32' avec User-Agent non Windows",
                    "Corriger User-Agent pour inclure 'Windows NT'"
                )
            if change.after == 'MacIntel' and 'Macintosh' not in ua:
                return (
                    ChangeSeverity.HIGH,
                    "Platform 'MacIntel' avec User-Agent non MacOS",
                    "Corriger User-Agent pour inclure 'Macintosh'"
                )
        
        # Incohérences DPI
        if change.path == 'browser.window.devicePixelRatio':
            width = None
            for c in diff.changes:
                if c.path == 'browser.screen.width':
                    width = c.after
                    break
            
            if width and change.after and change.after > 1.5 and width < 1920:
                return (
                    ChangeSeverity.MEDIUM,
                    f"DPI {change.after} trop élevé pour la résolution {width}x...",
                    "Ajuster DPI ou résolution"
                )
        
        # Changements mineurs
        return (None, None, None)
    
    def clear_cache(self):
        """Vide le cache des snapshots"""
        self._snapshot_cache.clear()