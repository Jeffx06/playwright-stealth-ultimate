# services/validator.py
"""
Service de validation des profils
"""

from typing import List, Optional, Dict, Any

from core.profile import FingerprintProfile


class ValidationError(Exception):
    """Erreur de validation du profil"""
    pass


class ProfileValidator:
    """
    Validateur de profils d'empreinte.
    
    Responsabilités :
    - Vérifier la cohérence des données d'un profil
    - Détecter les incohérences matérielles et logicielles
    - Fournir des messages d'erreur détaillés
    """
    
    def __init__(self):
        self._errors: List[str] = []
    
    def validate(self, profile: FingerprintProfile) -> List[str]:
        """
        Valide un profil et retourne la liste des incohérences.
        
        Args:
            profile: Profil à valider
            
        Returns:
            Liste des erreurs (vide si valide)
        """
        self._errors = []
        
        # 1. Cohérence RAM / Device Memory
        self._check_ram_consistency(profile)
        
        # 2. Cohérence GPU
        self._check_gpu_consistency(profile)
        
        # 3. Cohérence langue / fuseau horaire
        self._check_locale_consistency(profile)
        
        # 4. Cohérence User-Agent / Plateforme
        self._check_user_agent_consistency(profile)
        
        # 5. Cohérence DPI / Résolution
        self._check_dpi_consistency(profile)
        
        # 6. Cohérence Hardware Concurrency
        self._check_hardware_concurrency(profile)
        
        return self._errors
    
    def validate_or_raise(self, profile: FingerprintProfile) -> bool:
        """
        Valide un profil et lève une exception en cas d'erreur.
        
        Args:
            profile: Profil à valider
            
        Returns:
            True si le profil est valide
            
        Raises:
            ValidationError: En cas d'erreur de validation
        """
        errors = self.validate(profile)
        if errors:
            raise ValidationError(f"Profil invalide: {'; '.join(errors)}")
        return True
    
    def _check_ram_consistency(self, profile: FingerprintProfile) -> None:
        """Vérifie la cohérence entre RAM et Device Memory"""
        ram = profile.hardware.ram_gb
        device_memory = profile.hardware.device_memory
        
        if ram != device_memory:
            if device_memory not in (ram // 2, ram):
                self._errors.append(
                    f"Device Memory ({device_memory}GB) != RAM ({ram}GB)"
                )
    
    def _check_gpu_consistency(self, profile: FingerprintProfile) -> None:
        """Vérifie la cohérence du GPU"""
        vendor = profile.hardware.gpu_vendor
        renderer = profile.hardware.gpu_renderer
        
        if "Intel" in vendor and "NVIDIA" in renderer:
            self._errors.append(
                f"GPU incohérent: vendor={vendor}, renderer={renderer}"
            )
        
        if "NVIDIA" in vendor and "Intel" in renderer:
            self._errors.append(
                f"GPU incohérent: vendor={vendor}, renderer={renderer}"
            )
    
    def _check_locale_consistency(self, profile: FingerprintProfile) -> None:
        """Vérifie la cohérence entre la langue et le fuseau horaire"""
        locale = profile.locale.locale
        timezone = profile.locale.timezone
        
        if '-' in locale:
            lang = locale.split('-')[0]
        else:
            lang = 'en'
        
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
        
        if lang in region_map:
            if not any(r in timezone for r in region_map[lang]):
                self._errors.append(
                    f"Langue '{lang}' incohérente avec fuseau '{timezone}'"
                )
    
    def _check_user_agent_consistency(self, profile: FingerprintProfile) -> None:
        """Vérifie la cohérence entre User-Agent et Plateforme"""
        ua = profile.browser.user_agent
        platform = profile.browser.platform
        
        if platform == "Win32" and "Windows" not in ua:
            self._errors.append("User-Agent Windows incohérent")
        elif platform == "MacIntel" and "Macintosh" not in ua:
            self._errors.append("User-Agent MacOS incohérent")
        elif platform == "Linux x86_64" and "Linux" not in ua:
            self._errors.append("User-Agent Linux incohérent")
    
    def _check_dpi_consistency(self, profile: FingerprintProfile) -> None:
        """Vérifie la cohérence entre DPI et résolution"""
        dpi = profile.hardware.device_pixel_ratio
        width = profile.hardware.screen_resolution[0]
        
        if dpi > 1.5 and width < 1920:
            self._errors.append(
                f"DPI {dpi} incompatible avec résolution {width}x..."
            )
    
    def _check_hardware_concurrency(self, profile: FingerprintProfile) -> None:
        """Vérifie la cohérence de Hardware Concurrency"""
        cores = profile.hardware.cpu_cores
        
        if cores not in [2, 4, 6, 8, 10, 12, 14, 16]:
            self._errors.append(f"Hardware Concurrency improbable: {cores}")