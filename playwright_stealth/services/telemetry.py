# services/telemetry.py
"""
Service de télémétrie interne
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from collections import deque
import time
import random
from contextlib import contextmanager


@dataclass(slots=True)
class TelemetryConfig:
    """Configuration de télémétrie"""
    max_events: int = 1000
    sampling_rate: float = 1.0
    export_backend: Optional[str] = None
    export_interval: int = 60  # secondes
    enabled: bool = True


class TelemetryService:
    """
    Service de télémétrie interne.
    
    Responsabilités :
    - Collecter des métriques et événements
    - Gérer la rétention des données
    - Exporter vers différents backends
    """
    
    def __init__(self, config: Optional[TelemetryConfig] = None):
        self._config = config or TelemetryConfig()
        self._events: deque = deque(maxlen=self._config.max_events)
        self._metrics: Dict[str, List[float]] = {}
        self._last_export = time.time()
        self._enabled = self._config.enabled
    
    @contextmanager
    def timer(self, name: str):
        """
        Timer contextuel pour mesurer la durée d'une opération.
        
        Args:
            name: Nom de l'opération
            
        Yields:
            Rien (utiliser comme context manager)
        """
        if not self._enabled:
            yield
            return
        
        start = time.perf_counter()
        try:
            yield
        finally:
            duration_ms = (time.perf_counter() - start) * 1000
            self.record(name, {'duration_ms': duration_ms})
    
    def record(self, name: str, data: Dict[str, Any], duration_ms: Optional[float] = None):
        """
        Enregistre un événement.
        
        Args:
            name: Nom de l'événement
            data: Données de l'événement
            duration_ms: Durée optionnelle
        """
        if not self._enabled:
            return
        
        # Sampling
        if self._config.sampling_rate < 1.0:
            if random.random() > self._config.sampling_rate:
                return
        
        event = {
            'name': name,
            'timestamp': time.time(),
            'data': data,
            'duration_ms': duration_ms,
        }
        self._events.append(event)
        
        # Métriques agrégées
        if 'value' in data:
            if name not in self._metrics:
                self._metrics[name] = []
            self._metrics[name].append(data['value'])
            
            # Limiter la taille des métriques
            if len(self._metrics[name]) > 10000:
                self._metrics[name] = self._metrics[name][-1000:]
        
        # Export automatique
        if self._config.export_backend:
            self._auto_export()
    
    def _auto_export(self):
        """Export automatique périodique"""
        now = time.time()
        if now - self._last_export > self._config.export_interval:
            self.export()
            self._last_export = now
    
    def export(self) -> Optional[Dict]:
        """Exporte les données vers un backend"""
        if not self._enabled:
            return None
        
        if self._config.export_backend == 'jsonl':
            return self._export_jsonl()
        elif self._config.export_backend == 'opentelemetry':
            return self._export_opentelemetry()
        return None
    
    def _export_jsonl(self) -> Dict:
        """Export en JSON Lines"""
        return {
            'events': list(self._events),
            'metrics': self._metrics,
            'timestamp': time.time(),
        }
    
    def _export_opentelemetry(self) -> Dict:
        """Export vers OpenTelemetry (placeholder)"""
        return {
            'metrics': self._metrics,
            'timestamp': time.time(),
        }
    
    def get_metric(self, name: str, stat: str = 'avg') -> Optional[float]:
        """
        Récupère une métrique agrégée.
        
        Args:
            name: Nom de la métrique
            stat: 'avg', 'min', 'max', 'count', 'sum'
            
        Returns:
            Valeur de la métrique ou None
        """
        values = self._metrics.get(name, [])
        if not values:
            return None
        
        if stat == 'avg':
            return sum(values) / len(values)
        elif stat == 'min':
            return min(values)
        elif stat == 'max':
            return max(values)
        elif stat == 'count':
            return len(values)
        elif stat == 'sum':
            return sum(values)
        return None
    
    def get_summary(self) -> Dict:
        """
        Retourne un résumé des métriques.
        
        Returns:
            Dictionnaire des métriques résumées
        """
        return {
            name: {
                'count': len(values),
                'avg': sum(values) / len(values) if values else 0,
                'min': min(values) if values else 0,
                'max': max(values) if values else 0,
            }
            for name, values in self._metrics.items()
        }
    
    def enable(self):
        """Active la télémétrie"""
        self._enabled = True
    
    def disable(self):
        """Désactive la télémétrie"""
        self._enabled = False
    
    def clear(self):
        """Vide toutes les données"""
        self._events.clear()
        self._metrics.clear()