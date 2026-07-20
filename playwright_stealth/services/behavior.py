# services/behavior.py
"""
Service de comportement humain - Génération de modèles réalistes
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional, Any
import random
import math


@dataclass(slots=True)
class HumanArchetype:
    """
    Archétype humain - Facteurs latents de comportement.
    
    Les facteurs sont corrélés entre eux pour produire
    des comportements cohérents.
    """
    activity_level: float  # 0.0 à 1.0
    consistency: float     # 0.0 à 1.0
    error_prone: float     # 0.0 à 1.0
    
    @classmethod
    def random(cls, seed: Optional[int] = None) -> 'HumanArchetype':
        """Génère un archétype aléatoire"""
        rng = random.Random(seed)
        return cls(
            activity_level=rng.uniform(0.3, 0.9),
            consistency=rng.uniform(0.5, 0.95),
            error_prone=rng.uniform(0.0, 0.3),
        )
    
    def to_dict(self) -> Dict:
        return {
            'activity_level': self.activity_level,
            'consistency': self.consistency,
            'error_prone': self.error_prone,
        }


@dataclass(slots=True)
class HumanProfile:
    """
    Profil humain complet avec facteurs latents.
    
    Tous les paramètres comportementaux sont dérivés
    des facteurs latents pour garantir la cohérence.
    """
    archetype: HumanArchetype
    speed_base: float
    seed: int
    
    @classmethod
    def generate(cls, seed: Optional[int] = None) -> 'HumanProfile':
        """Génère un profil humain aléatoire"""
        if seed is None:
            seed = random.randint(0, 2**32 - 1)
        
        rng = random.Random(seed)
        archetype = HumanArchetype.random(seed)
        
        # La vitesse de base dépend de l'activité
        speed_base = 100 + archetype.activity_level * 400
        
        return cls(
            archetype=archetype,
            speed_base=speed_base,
            seed=seed,
        )
    
    def get_mouse_speed(self, rng: random.Random) -> float:
        """Vitesse de souris - corrélée à l'activité"""
        base = self.speed_base * (0.8 + rng.random() * 0.4)
        consistency = self.archetype.consistency
        variance = 1.0 - consistency
        return base * (1.0 + rng.gauss(0, variance * 0.3))
    
    def get_typing_interval(self, rng: random.Random) -> float:
        """Intervalle de frappe - corrélé à l'activité"""
        base = (100 + self.archetype.activity_level * 300) * 0.01  # secondes
        consistency = self.archetype.consistency
        variance = 1.0 - consistency
        return max(0.01, base * (1.0 + rng.gauss(0, variance * 0.2)))
    
    def get_typing_error_rate(self, rng: random.Random) -> float:
        """Taux d'erreur de frappe"""
        base = 0.01 + self.archetype.error_prone * 0.04
        consistency = self.archetype.consistency
        variance = 1.0 - consistency
        return max(0, min(0.1, base * (1.0 + rng.gauss(0, variance * 0.3))))
    
    def get_scroll_speed(self, rng: random.Random) -> float:
        """Vitesse de scroll - corrélée à l'activité"""
        base = self.speed_base * 0.5
        consistency = self.archetype.consistency
        variance = 1.0 - consistency
        return base * (1.0 + rng.gauss(0, variance * 0.3))
    
    def get_idle_duration(self, rng: random.Random) -> float:
        """Durée d'inactivité - anti-corrélée à l'activité"""
        base = (1.0 - self.archetype.activity_level) * 5 + 0.5
        consistency = self.archetype.consistency
        variance = 1.0 - consistency
        return max(0.1, base * (1.0 + rng.gauss(0, variance * 0.2)))
    
    def get_focus_duration(self, rng: random.Random) -> float:
        """Durée de focus - corrélée à l'activité"""
        base = 5 + self.archetype.activity_level * 25
        consistency = self.archetype.consistency
        variance = 1.0 - consistency
        return max(1, base * (1.0 + rng.gauss(0, variance * 0.2)))
    
    def to_dict(self) -> Dict:
        """Convertit en dictionnaire pour la sérialisation"""
        rng = random.Random(self.seed)
        return {
            'archetype': self.archetype.to_dict(),
            'speed_base': self.speed_base,
            'seed': self.seed,
            'sample': {
                'mouse_speed': self.get_mouse_speed(rng),
                'typing_interval': self.get_typing_interval(rng),
                'typing_error_rate': self.get_typing_error_rate(rng),
                'scroll_speed': self.get_scroll_speed(rng),
                'idle_duration': self.get_idle_duration(rng),
                'focus_duration': self.get_focus_duration(rng),
            }
        }


class BehaviorService:
    """
    Service de comportement humain.
    
    Responsabilités :
    - Générer des profils comportementaux cohérents
    - Produire des modèles de mouvement réalistes
    - Adapter les profils pour Playwright
    """
    
    def __init__(self, default_seed: Optional[int] = None):
        self._default_seed = default_seed
        self._profile_cache: Dict[int, HumanProfile] = {}
    
    def generate_profile(self, seed: Optional[int] = None) -> HumanProfile:
        """
        Génère un profil comportemental.
        
        Args:
            seed: Seed pour la génération (None = aléatoire)
            
        Returns:
            Profil humain complet
        """
        if seed is None:
            seed = self._default_seed
        
        if seed is not None and seed in self._profile_cache:
            return self._profile_cache[seed]
        
        profile = HumanProfile.generate(seed)
        
        if seed is not None:
            self._profile_cache[seed] = profile
        
        return profile
    
    def generate_movement(self,
                          profile: HumanProfile,
                          from_point: Tuple[int, int],
                          to_point: Tuple[int, int],
                          seed: Optional[int] = None) -> List[Tuple[int, int, float]]:
        """
        Génère une trajectoire de souris réaliste.
        
        Args:
            profile: Profil humain
            from_point: Point de départ (x, y)
            to_point: Point d'arrivée (x, y)
            seed: Seed pour la génération
            
        Returns:
            Liste de points (x, y, speed)
        """
        rng = random.Random(seed or profile.seed)
        
        x0, y0 = from_point
        x1, y1 = to_point
        
        # Paramètres du mouvement
        speed = profile.get_mouse_speed(rng)
        acceleration = 0.5 + rng.random() * 0.4
        jitter = 1 + rng.random() * 3
        
        distance = math.hypot(x1 - x0, y1 - y0)
        total_time = distance / speed
        num_points = max(10, int(total_time * 60))  # 60 FPS
        
        points = []
        x, y = x0, y0
        vx, vy = 0.0, 0.0
        
        for i in range(num_points):
            t = i / num_points
            
            # Courbe smoothstep pour un mouvement naturel
            smooth = t * t * (3 - 2 * t)
            target_x = x0 + (x1 - x0) * smooth
            target_y = y0 + (y1 - y0) * smooth
            
            # Accélération vers la cible
            dx = target_x - x
            dy = target_y - y
            vx += dx * acceleration * 0.02
            vy += dy * acceleration * 0.02
            
            # Friction
            vx *= 0.92
            vy *= 0.92
            
            x += vx
            y += vy
            
            # Jitter
            x += rng.gauss(0, jitter * 0.3)
            y += rng.gauss(0, jitter * 0.3)
            
            speed_mag = math.hypot(vx, vy)
            points.append((int(x), int(y), speed_mag))
        
        return points
    
    def generate_typing(self,
                        profile: HumanProfile,
                        text: str,
                        seed: Optional[int] = None) -> List[Tuple[str, float]]:
        """
        Génère une séquence de frappe réaliste.
        
        Args:
            profile: Profil humain
            text: Texte à taper
            seed: Seed pour la génération
            
        Returns:
            Liste de (caractère, timestamp)
        """
        rng = random.Random(seed or profile.seed)
        
        events = []
        current_time = 0.0
        
        interval = profile.get_typing_interval(rng)
        error_rate = profile.get_typing_error_rate(rng)
        
        for i, char in enumerate(text):
            # Pause après les mots
            if i > 0 and text[i-1] == ' ':
                interval_base = interval * (1.5 + rng.random())
            else:
                interval_base = interval
            
            # Jitter
            interval_jitter = rng.gauss(0, interval * 0.2)
            current_time += max(0.01, interval_base + interval_jitter)
            
            # Erreurs de frappe
            if rng.random() < error_rate:
                # Simuler une faute de frappe
                wrong_char = chr(ord(char) + rng.randint(-2, 2))
                if wrong_char.isprintable():
                    events.append((wrong_char, current_time))
                    current_time += 0.05
                    events.append((char, current_time))
                else:
                    events.append((char, current_time))
            else:
                events.append((char, current_time))
        
        return events
    
    def generate_scroll(self,
                        profile: HumanProfile,
                        from_y: int,
                        to_y: int,
                        seed: Optional[int] = None) -> List[Tuple[int, float]]:
        """
        Génère un scrolling réaliste.
        
        Args:
            profile: Profil humain
            from_y: Position de départ
            to_y: Position d'arrivée
            seed: Seed pour la génération
            
        Returns:
            Liste de (position_y, speed)
        """
        rng = random.Random(seed or profile.seed)
        
        speed = profile.get_scroll_speed(rng)
        acceleration = 0.3 + rng.random() * 0.4
        
        distance = abs(to_y - from_y)
        total_time = distance / speed
        num_points = max(10, int(total_time * 60))
        
        points = []
        current_y = from_y
        velocity = 0.0
        
        for i in range(num_points):
            t = i / num_points
            
            # Cible avec easing
            smooth = t * t * (3 - 2 * t)
            target_y = from_y + (to_y - from_y) * smooth
            
            # Accélération
            dy = target_y - current_y
            velocity += dy * acceleration * 0.02
            velocity *= 0.9
            
            current_y += velocity
            current_y += rng.gauss(0, 2)
            
            points.append((int(current_y), abs(velocity)))
        
        return points
    
    def adapt_to_playwright(self, profile: HumanProfile) -> Dict[str, Any]:
        """
        Adapte un profil humain pour Playwright.
        
        Args:
            profile: Profil humain
            
        Returns:
            Configuration pour Playwright
        """
        rng = random.Random(profile.seed)
        
        return {
            'mouse': {
                'speed': profile.get_mouse_speed(rng),
                'acceleration': 0.5 + rng.random() * 0.4,
            },
            'keyboard': {
                'delay': profile.get_typing_interval(rng),
                'error_rate': profile.get_typing_error_rate(rng),
            },
            'scroll': {
                'speed': profile.get_scroll_speed(rng),
            },
            'idle': {
                'min': profile.get_idle_duration(rng) * 0.5,
                'max': profile.get_idle_duration(rng) * 1.5,
            },
            'focus': {
                'min': profile.get_focus_duration(rng) * 0.5,
                'max': profile.get_focus_duration(rng) * 1.5,
            }
        }
    
    def clear_cache(self):
        """Vide le cache des profils"""
        self._profile_cache.clear()