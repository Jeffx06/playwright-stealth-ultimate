# tests/unit/test_validator.py
"""
Tests unitaires pour ProfileValidator
"""

import pytest
from core.profile import FingerprintProfile, HardwareTier, OSType, BrowserVendor
from services.validator import ProfileValidator, ValidationError


class TestProfileValidator:
    """Tests pour ProfileValidator"""

    @pytest.fixture
    def validator(self):
        """Fixture pour le validateur"""
        return ProfileValidator()

    def test_validate_valid_profile(self, validator):
        """Test de validation d'un profil valide"""
        profile = FingerprintProfile.generate()
        errors = validator.validate(profile)
        assert len(errors) == 0

    def test_validate_valid_profile_or_raise(self, validator):
        """Test de validation sans erreur"""
        profile = FingerprintProfile.generate()
        result = validator.validate_or_raise(profile)
        assert result is True

    def test_ram_consistency_error(self, validator):
        """Test de détection d'incohérence RAM/Device Memory"""
        profile = FingerprintProfile.generate()
        # Modifier manuellement pour créer une incohérence
        profile.hardware.ram_gb = 4
        profile.hardware.device_memory = 16
        
        errors = validator.validate(profile)
        assert len(errors) > 0
        assert any("Device Memory" in e for e in errors)

    def test_gpu_consistency_error(self, validator):
        """Test de détection d'incohérence GPU"""
        profile = FingerprintProfile.generate()
        # Modifier pour créer une incohérence
        profile.hardware.gpu_vendor = "Intel Inc."
        profile.hardware.gpu_renderer = "ANGLE (NVIDIA, NVIDIA RTX)"
        
        errors = validator.validate(profile)
        assert len(errors) > 0
        assert any("GPU" in e for e in errors)

    def test_locale_consistency_error(self, validator):
        """Test de détection d'incohérence langue/fuseau"""
        profile = FingerprintProfile.generate()
        # Modifier pour créer une incohérence
        profile.locale.locale = "fr-FR"
        profile.locale.timezone = "America/New_York"
        
        errors = validator.validate(profile)
        assert len(errors) > 0
        assert any("Langue" in e for e in errors)

    def test_user_agent_consistency_error(self, validator):
        """Test de détection d'incohérence User-Agent/Plateforme"""
        profile = FingerprintProfile.generate(os_type=OSType.WINDOWS)
        # Modifier pour créer une incohérence
        profile.browser.user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X)"
        
        errors = validator.validate(profile)
        assert len(errors) > 0
        assert any("User-Agent" in e for e in errors)

    def test_dpi_consistency_error(self, validator):
        """Test de détection d'incohérence DPI/Résolution"""
        profile = FingerprintProfile.generate()
        # Modifier pour créer une incohérence
        profile.hardware.device_pixel_ratio = 2.0
        profile.hardware.screen_resolution = (1366, 768)
        
        errors = validator.validate(profile)
        assert len(errors) > 0
        assert any("DPI" in e for e in errors)

    def test_hardware_concurrency_error(self, validator):
        """Test de détection d'incohérence Hardware Concurrency"""
        profile = FingerprintProfile.generate()
        # Modifier pour créer une incohérence
        profile.hardware.cpu_cores = 3  # Valeur improbable
        
        errors = validator.validate(profile)
        assert len(errors) > 0
        assert any("Hardware Concurrency" in e for e in errors)

    def test_validation_error_exception(self, validator):
        """Test que ValidationError est levée"""
        profile = FingerprintProfile.generate()
        profile.hardware.ram_gb = 4
        profile.hardware.device_memory = 16
        
        with pytest.raises(ValidationError) as exc_info:
            validator.validate_or_raise(profile)
        
        assert "Profil invalide" in str(exc_info.value)

    def test_multiple_errors(self, validator):
        """Test de détection de multiples erreurs"""
        profile = FingerprintProfile.generate()
        # Créer plusieurs incohérences
        profile.hardware.ram_gb = 4
        profile.hardware.device_memory = 16
        profile.hardware.cpu_cores = 3
        
        errors = validator.validate(profile)
        assert len(errors) >= 2
