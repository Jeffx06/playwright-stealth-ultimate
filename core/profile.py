# playwright_stealth/core/profile.py
"""
Profils matériel, navigateur et empreinte
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional, Any
import hashlib
import random
import time
import re

from .types import HardwareTier, OSType, BrowserVendor


@dataclass(slots=True)
class HardwareProfile:
    """Profil matériel - IMMUABLE"""
    cpu_cores: int
    cpu_model: str
    cpu_vendor: str
    ram_gb: int
    device_memory: int
    gpu_vendor: str
    gpu_renderer: str
    gpu_model: str
    webgl_extensions: Tuple[str, ...]
    max_texture_size: int
    max_combined_texture_image_units: int
    max_vertex_uniform_vectors: int
    max_fragment_uniform_vectors: int
    max_varying_vectors: int
    screen_resolution: Tuple[int, int]
    color_depth: int
    pixel_depth: int
    device_pixel_ratio: float
    
    @classmethod
    def from_tier(cls, tier: HardwareTier) -> 'HardwareProfile':
        """Crée un profil matériel à partir d'un tier"""
        resolved_tier = tier.value if hasattr(tier, 'value') else tier
        
        profiles = {
            HardwareTier.LOW.value: {
                "cpu_cores": 2,
                "cpu_model": "Intel Core i3-10110U",
                "cpu_vendor": "Intel",
                "ram_gb": 4,
                "device_memory": 4,
                "gpu_vendor": "Intel Inc.",
                "gpu_renderer": "ANGLE (Intel, Intel UHD Graphics Direct3D11)",
                "gpu_model": "Intel UHD Graphics",
                "webgl_extensions": ("ANGLE_instanced_arrays", "EXT_blend_minmax"),
                "max_texture_size": 16384,
                "max_combined_texture_image_units": 80,
                "max_vertex_uniform_vectors": 128,
                "max_fragment_uniform_vectors": 64,
                "max_varying_vectors": 8,
                "screen_resolution": (1366, 768),
                "color_depth": 24,
                "pixel_depth": 24,
                "device_pixel_ratio": 1.0,
            },
            HardwareTier.MEDIUM.value: {
                "cpu_cores": 4,
                "cpu_model": "Intel Core i5-1135G7",
                "cpu_vendor": "Intel",
                "ram_gb": 8,
                "device_memory": 8,
                "gpu_vendor": "Intel Inc.",
                "gpu_renderer": "ANGLE (Intel, Intel Iris Xe Graphics Direct3D11)",
                "gpu_model": "Intel Iris Xe Graphics",
                "webgl_extensions": ("ANGLE_instanced_arrays", "EXT_blend_minmax", "EXT_color_buffer_float"),
                "max_texture_size": 16384,
                "max_combined_texture_image_units": 96,
                "max_vertex_uniform_vectors": 256,
                "max_fragment_uniform_vectors": 128,
                "max_varying_vectors": 16,
                "screen_resolution": (1920, 1080),
                "color_depth": 30,
                "pixel_depth": 30,
                "device_pixel_ratio": 1.0,
            },
            HardwareTier.HIGH.value: {
                "cpu_cores": 8,
                "cpu_model": "Intel Core i7-12700H",
                "cpu_vendor": "Intel",
                "ram_gb": 16,
                "device_memory": 16,
                "gpu_vendor": "NVIDIA Corporation",
                "gpu_renderer": "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11)",
                "gpu_model": "NVIDIA GeForce RTX 3060",
                "webgl_extensions": ("ANGLE_instanced_arrays", "EXT_blend_minmax", "EXT_color_buffer_float", "EXT_disjoint_timer_query"),
                "max_texture_size": 32768,
                "max_combined_texture_image_units": 128,
                "max_vertex_uniform_vectors": 512,
                "max_fragment_uniform_vectors": 256,
                "max_varying_vectors": 32,
                "screen_resolution": (2560, 1440),
                "color_depth": 32,
                "pixel_depth": 32,
                "device_pixel_ratio": 1.25,
            },
            HardwareTier.PREMIUM.value: {
                "cpu_cores": 16,
                "cpu_model": "Intel Core i9-13900HX",
                "cpu_vendor": "Intel",
                "ram_gb": 32,
                "device_memory": 32,
                "gpu_vendor": "NVIDIA Corporation",
                "gpu_renderer": "ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11)",
                "gpu_model": "NVIDIA GeForce RTX 4080",
                "webgl_extensions": ("ANGLE_instanced_arrays", "EXT_blend_minmax", "EXT_color_buffer_float", "EXT_disjoint_timer_query", "EXT_float_blend"),
                "max_texture_size": 32768,
                "max_combined_texture_image_units": 192,
                "max_vertex_uniform_vectors": 1024,
                "max_fragment_uniform_vectors": 512,
                "max_varying_vectors": 64,
                "screen_resolution": (3840, 2160),
                "color_depth": 32,
                "pixel_depth": 32,
                "device_pixel_ratio": 2.0,
            },
        }
        
        data = profiles[resolved_tier]
        return cls(**data)


@dataclass(slots=True)
class BrowserProfile:
    """Profil navigateur - IMMUABLE"""
    vendor: BrowserVendor
    version: str
    chrome_version: str
    os_type: OSType
    os_version: str
    platform: str
    platform_version: str
    locale: str
    languages: Tuple[str, ...]
    timezone: str
    user_agent: str
    accept_language: str
    platform_hint: str
    platform_version_hint: str
    pdf_viewer_enabled: bool
    fonts: Tuple[str, ...]
    plugins: Tuple[Tuple[str, str], ...]
    speech_voices: Tuple[Dict[str, str], ...]
    
    @classmethod
    def from_os(cls, os_type: OSType, vendor: BrowserVendor = BrowserVendor.CHROME) -> 'BrowserProfile':
        """Crée un profil navigateur à partir d'un OS"""
        profiles = {
            (OSType.WINDOWS, BrowserVendor.CHROME): {
                "version": "120.0.6099.130",
                "chrome_version": "120.0.6099.130",
                "os_version": "11",
                "platform": "Win32",
                "platform_version": "10.0.0",
                "locale": "fr-FR",
                "languages": ("fr-FR", "fr", "en-US", "en"),
                "timezone": "Europe/Paris",
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "accept_language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
                "platform_hint": "Windows",
                "platform_version_hint": "10.0.0",
                "fonts": ("Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Tahoma"),
                "plugins": (
                    ("Chrome PDF Plugin", "internal-pdf-viewer"),
                    ("Chrome PDF Viewer", "mhjfbmdgcfjbbpaeojofohoefgiehjai"),
                    ("Native Client", "internal-nacl-plugin"),
                ),
                "speech_voices": (
                    {"name": "Google US English", "lang": "en-US"},
                    {"name": "Google UK English Female", "lang": "en-GB"},
                    {"name": "Google français", "lang": "fr-FR"},
                ),
            },
            (OSType.MACOS, BrowserVendor.CHROME): {
                "version": "120.0.6099.130",
                "chrome_version": "120.0.6099.130",
                "os_version": "10.15.7",
                "platform": "MacIntel",
                "platform_version": "10.15.7",
                "locale": "en-US",
                "languages": ("en-US", "en", "fr-FR", "fr"),
                "timezone": "America/New_York",
                "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "accept_language": "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7",
                "platform_hint": "macOS",
                "platform_version_hint": "10.15.7",
                "fonts": ("Helvetica", "Arial", "Times New Roman", "Courier New", "Verdana", "Georgia"),
                "plugins": (
                    ("Chrome PDF Plugin", "internal-pdf-viewer"),
                    ("Chrome PDF Viewer", "mhjfbmdgcfjbbpaeojofohoefgiehjai"),
                ),
                "speech_voices": (
                    {"name": "Google US English", "lang": "en-US"},
                    {"name": "Google UK English Female", "lang": "en-GB"},
                ),
            },
            (OSType.LINUX, BrowserVendor.CHROME): {
                "version": "120.0.6099.130",
                "chrome_version": "120.0.6099.130",
                "os_version": "22.04",
                "platform": "Linux x86_64",
                "platform_version": "5.15.0",
                "locale": "en-GB",
                "languages": ("en-GB", "en", "fr-FR", "fr"),
                "timezone": "Europe/London",
                "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "accept_language": "en-GB,en;q=0.9,fr-FR;q=0.8,fr;q=0.7",
                "platform_hint": "Linux",
                "platform_version_hint": "5.15.0",
                "fonts": ("DejaVu Sans", "Liberation Sans", "Nimbus Sans L", "FreeSans"),
                "plugins": (
                    ("Chrome PDF Plugin", "internal-pdf-viewer"),
                    ("Native Client", "internal-nacl-plugin"),
                ),
                "speech_voices": (
                    {"name": "Google US English", "lang": "en-US"},
                    {"name": "Google UK English Male", "lang": "en-GB"},
                ),
            },
        }
        
        data = profiles.get((os_type, vendor), profiles[(OSType.WINDOWS, BrowserVendor.CHROME)])
        return cls(
            vendor=vendor,
            pdf_viewer_enabled=True,
            os_type=os_type,
            **data
        )


@dataclass(slots=True)
class NetworkProfile:
    """Profil réseau - IMMUABLE"""
    rtt_ms: int
    downlink_mbps: float
    effective_type: str
    save_data: bool
    
    @classmethod
    def from_hardware(cls, hardware: HardwareProfile) -> 'NetworkProfile':
        """Crée un profil réseau cohérent avec le matériel"""
        rtt_ranges = {2: (80, 200), 4: (50, 150), 8: (30, 100), 16: (20, 80)}
        rtt_range = rtt_ranges.get(hardware.cpu_cores, (50, 150))
        rtt = random.randint(*rtt_range)
        
        downlink_ranges = {2: (1.0, 5.0), 4: (5.0, 20.0), 8: (10.0, 50.0), 16: (20.0, 100.0)}
        downlink_range = downlink_ranges.get(hardware.cpu_cores, (5.0, 20.0))
        downlink = round(random.uniform(*downlink_range), 1)
        
        effective_type = "4g" if downlink >= 5 else "3g" if downlink >= 1 else "2g"
        
        return cls(
            rtt_ms=rtt,
            downlink_mbps=downlink,
            effective_type=effective_type,
            save_data=False
        )


@dataclass(slots=True)
class DisplayProfile:
    """Profil d'affichage - IMMUABLE"""
    screen_width: int
    screen_height: int
    avail_width: int
    avail_height: int
    color_depth: int
    pixel_depth: int
    device_pixel_ratio: float
    
    @classmethod
    def from_hardware(cls, hardware: HardwareProfile) -> 'DisplayProfile':
        """Crée un profil d'affichage cohérent avec le matériel"""
        w, h = hardware.screen_resolution
        return cls(
            screen_width=w,
            screen_height=h,
            avail_width=w,
            avail_height=h,
            color_depth=hardware.color_depth,
            pixel_depth=hardware.pixel_depth,
            device_pixel_ratio=hardware.device_pixel_ratio,
        )


@dataclass(slots=True)
class LocaleProfile:
    """Profil linguistique - IMMUABLE"""
    locale: str
    languages: Tuple[str, ...]
    timezone: str
    accept_language: str
    
    @classmethod
    def from_browser(cls, browser: BrowserProfile) -> 'LocaleProfile':
        """Crée un profil linguistique cohérent avec le navigateur"""
        return cls(
            locale=browser.locale,
            languages=browser.languages,
            timezone=browser.timezone,
            accept_language=browser.accept_language,
        )


# ✅ Fonction utilitaire pour normaliser les seeds
def normalize_seed(seed: str) -> str:
    """
    Normalise une seed pour qu'elle soit une chaîne hexadécimale valide.
    
    Args:
        seed: Seed d'entrée (peut être alphanumérique)
    
    Returns:
        str: Chaîne hexadécimale valide
    """
    if not seed:
        return hashlib.sha256(str(random.random()).encode()).hexdigest()
    
    # Vérifier si c'est une chaîne hexadécimale valide
    try:
        int(seed[:8], 16)
        return seed
    except ValueError:
        # Si ce n'est pas hexadécimal, la hacher
        return hashlib.sha256(seed.encode()).hexdigest()


@dataclass(slots=True)
class FingerprintProfile:
    """Profil complet d'empreinte - IMMUABLE"""
    id: str
    hardware: HardwareProfile
    browser: BrowserProfile
    network: NetworkProfile
    display: DisplayProfile
    locale: LocaleProfile
    seed: int
    noise_seed: float
    created_at: float = field(default_factory=time.time)
    
    @classmethod
    def generate(cls, 
                 hardware_tier: HardwareTier = HardwareTier.MEDIUM,
                 os_type: OSType = OSType.WINDOWS,
                 browser_vendor: BrowserVendor = BrowserVendor.CHROME,
                 custom_seed: Optional[str] = None) -> 'FingerprintProfile':
        """Génère un profil complet et cohérent"""
        
        hardware = HardwareProfile.from_tier(hardware_tier)
        browser = BrowserProfile.from_os(os_type, browser_vendor)
        network = NetworkProfile.from_hardware(hardware)
        display = DisplayProfile.from_hardware(hardware)
        locale = LocaleProfile.from_browser(browser)
        
        # Générer une seed unique
        if custom_seed:
            # ✅ Normaliser la seed pour qu'elle soit hexadécimale
            seed_str = normalize_seed(custom_seed)
        else:
            seed_data = f"{hardware_tier.value}{os_type.value}{browser_vendor.value}{random.random()}"
            seed_str = hashlib.sha256(seed_data.encode()).hexdigest()
        
        profile_id = seed_str[:16]
        seed_int = int(seed_str[:8], 16)
        noise_seed = seed_int / 2**32
        
        return cls(
            id=profile_id,
            hardware=hardware,
            browser=browser,
            network=network,
            display=display,
            locale=locale,
            seed=seed_int,
            noise_seed=noise_seed,
        )
    
    def get_noise(self, module: str) -> float:
        """Génère un bruit déterministe pour un module"""
        data = f"{self.id}{module}{self.seed}"
        return int(hashlib.sha256(data.encode()).hexdigest()[:8], 16) / 2**32


__all__ = [
    "HardwareProfile",
    "BrowserProfile",
    "NetworkProfile",
    "DisplayProfile",
    "LocaleProfile",
    "FingerprintProfile",
    "normalize_seed",
]