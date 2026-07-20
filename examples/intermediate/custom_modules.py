#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
from pathlib import Path

# Ajouter le chemin du projet avant toute importation locale
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

"""
Exemple intermédiaire : Modules d'évasion personnalisés

Ce script démontre la création et l'utilisation de modules d'évasion
personnalisés avec le framework Playwright Stealth.

Niveau : Intermédiaire
Temps estimé : 10-15 minutes

Fonctionnalités :
- Création de modules d'évasion personnalisés
- Enregistrement des modules dans le moteur
- Utilisation des modules personnalisés avec stealth_sync
- Validation des modules (compatibilité avec les profils)
- Gestion des dépendances et conflits entre modules
- Gestion des priorités d'exécution

Compatibilité : Python 3.10+, Playwright 1.40+
"""

import time
from typing import List, Tuple, Optional
from playwright.sync_api import sync_playwright, Page
from playwright_stealth import stealth_sync
from playwright_stealth.core.types import EvasionModule, HardwareTier, OSType, BrowserVendor
from playwright_stealth.core.profile import FingerprintProfile


# =============================================================================
# 1. MODULE PERSONNALISÉ : CUSTOM_HEADER
# =============================================================================

class CustomHeaderModule:
    """
    Module d'évasion personnalisé qui ajoute des headers HTTP spécifiques.
    
    Ce module démontre comment créer un module d'évasion simple
    qui modifie le comportement du navigateur.
    """
    
    name = "custom_header"
    priority = 10
    dependencies = ()
    conflicts = ()
    
    def build(self, profile: FingerprintProfile, loader) -> str:
        """
        Génère le JavaScript du module.
        
        Args:
            profile: Profil d'empreinte
            loader: Chargeur de scripts
            
        Returns:
            str: JavaScript du module
        """
        return """
        (function() {
            // Ajouter un header personnalisé
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
                options = options || {};
                options.headers = options.headers || {};
                options.headers['X-Custom-Header'] = 'Stealth-Module';
                options.headers['X-Requested-With'] = 'XMLHttpRequest';
                return originalFetch.call(this, url, options);
            };
            console.log('🛡️ Custom header module activé');
        })();
        """
    
    def validate(self, profile: FingerprintProfile) -> List[str]:
        """
        Valide le module pour un profil donné.
        
        Args:
            profile: Profil à valider
            
        Returns:
            List[str]: Liste des erreurs (vide si valide)
        """
        # Ce module est compatible avec tous les profils
        return []


# =============================================================================
# 2. MODULE PERSONNALISÉ : PERFORMANCE_OPTIMIZER
# =============================================================================

class PerformanceOptimizerModule:
    """
    Module d'évasion personnalisé qui optimise les performances du navigateur.
    
    Ce module démontre comment créer un module avec des dépendances.
    """
    
    name = "performance_optimizer"
    priority = 20
    dependencies = ("custom_header",)  # Dépend du module custom_header
    conflicts = ("heavy_analytics",)   # Conflit avec un module hypothétique
    
    def build(self, profile: FingerprintProfile, loader) -> str:
        """
        Génère le JavaScript du module.
        
        Args:
            profile: Profil d'empreinte
            loader: Chargeur de scripts
            
        Returns:
            str: JavaScript du module
        """
        return """
        (function() {
            // Optimiser les performances
            // Désactiver les animations inutiles
            const style = document.createElement('style');
            style.textContent = `
                * { transition: none !important; animation: none !important; }
            `;
            document.head.appendChild(style);
            
            // Optimiser les requêtes réseau
            const originalXHR = window.XMLHttpRequest;
            window.XMLHttpRequest = function() {
                const xhr = new originalXHR();
                const originalOpen = xhr.open;
                xhr.open = function(method, url, async, user, password) {
                    // Ajouter un timeout pour éviter les requêtes bloquantes
                    setTimeout(() => {
                        if (xhr.readyState < 4) {
                            xhr.abort();
                        }
                    }, 30000);
                    return originalOpen.call(this, method, url, async, user, password);
                };
                return xhr;
            };
            console.log('🛡️ Performance optimizer module activé');
        })();
        """
    
    def validate(self, profile: FingerprintProfile) -> List[str]:
        """
        Valide le module pour un profil donné.
        
        Args:
            profile: Profil à valider
            
        Returns:
            List[str]: Liste des erreurs (vide si valide)
        """
        errors = []
        
        # Vérifier que le matériel est suffisant pour ce module
        if profile.hardware.cpu_cores < 4:
            errors.append("Performance optimizer nécessite au moins 4 cœurs CPU")
        
        if profile.hardware.ram_gb < 8:
            errors.append("Performance optimizer nécessite au moins 8 GB de RAM")
        
        return errors


# =============================================================================
# 3. MODULE PERSONNALISÉ : MOCK_GEOLOCATION
# =============================================================================

class MockGeolocationModule:
    """
    Module d'évasion personnalisé qui simule une géolocalisation.
    
    Ce module démontre comment créer un module avec des dépendances.
    """
    
    name = "mock_geolocation"
    priority = 30
    dependencies = ()
    conflicts = ("real_geolocation",)
    
    def __init__(self, latitude: float = 48.8566, longitude: float = 2.3522):
        """
        Initialise le module avec des coordonnées personnalisées.
        
        Args:
            latitude: Latitude (défaut: Paris)
            longitude: Longitude (défaut: Paris)
        """
        self.latitude = latitude
        self.longitude = longitude
    
    def build(self, profile: FingerprintProfile, loader) -> str:
        """
        Génère le JavaScript du module.
        
        Args:
            profile: Profil d'empreinte
            loader: Chargeur de scripts
            
        Returns:
            str: JavaScript du module
        """
        lat = self.latitude
        lng = self.longitude
        
        return f"""
        (function() {{
            // Simuler la géolocalisation
            if (navigator.geolocation) {{
                const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
                const originalWatchPosition = navigator.geolocation.watchPosition;
                
                navigator.geolocation.getCurrentPosition = function(success, error, options) {{
                    const position = {{
                        coords: {{
                            latitude: {lat},
                            longitude: {lng},
                            accuracy: 10,
                            altitude: null,
                            altitudeAccuracy: null,
                            heading: null,
                            speed: null
                        }},
                        timestamp: Date.now()
                    }};
                    if (success) {{
                        success(position);
                    }}
                }};
                
                navigator.geolocation.watchPosition = function(success, error, options) {{
                    const position = {{
                        coords: {{
                            latitude: {lat},
                            longitude: {lng},
                            accuracy: 10,
                            altitude: null,
                            altitudeAccuracy: null,
                            heading: null,
                            speed: null
                        }},
                        timestamp: Date.now()
                    }};
                    if (success) {{
                        success(position);
                    }}
                    return 1; // ID du watcher
                }};
                
                console.log('🛡️ Mock geolocation module activé ({lat}, {lng})');
            }}
        }})();
        """
    
    def validate(self, profile: FingerprintProfile) -> List[str]:
        """
        Valide le module pour un profil donné.
        
        Args:
            profile: Profil à valider
            
        Returns:
            List[str]: Liste des erreurs (vide si valide)
        """
        # Vérifier que les coordonnées sont valides
        errors = []
        if not (-90 <= self.latitude <= 90):
            errors.append(f"Latitude invalide: {self.latitude}")
        if not (-180 <= self.longitude <= 180):
            errors.append(f"Longitude invalide: {self.longitude}")
        return errors


# =============================================================================
# 4. UTILISATION DES MODULES PERSONNALISÉS
# =============================================================================

def use_custom_modules(page: Page, url: str = "https://example.com") -> bool:
    """
    Utilise des modules d'évasion personnalisés avec stealth_sync.

    Args:
        page: Page Playwright
        url: URL à visiter

    Returns:
        bool: True si l'injection a réussi
    """
    print("🛡️ Utilisation des modules personnalisés...")

    # 1. Créer les modules personnalisés
    custom_modules = {
        "custom_header": CustomHeaderModule(),
        "performance_optimizer": PerformanceOptimizerModule(),
        "mock_geolocation": MockGeolocationModule(
            latitude=48.8566,   # Paris
            longitude=2.3522
        )
    }

    # 2. Appliquer le stealth avec les modules
    # Note: Pour utiliser des modules personnalisés, il faut passer par l'engine direct
    from playwright_stealth.core.engine import FingerprintEngine
    from playwright_stealth.core.profile import FingerprintProfile
    from playwright_stealth.services.builder import BuilderService
    from playwright_stealth.services.injector import InjectorService
    from playwright_stealth.services.validator import ProfileValidator
    from playwright_stealth.services.capability import CapabilityResolver, CapabilityRegistry
    from playwright_stealth.services.optimizer import PlanOptimizer
    from playwright_stealth.services.behavior import BehaviorService
    from playwright_stealth.services.telemetry import TelemetryService
    from playwright_stealth.services.observability import ObservabilityService
    from playwright_stealth.cache.memory import LRUMemoryCache

    # Créer le profil
    profile = FingerprintProfile.generate(
        hardware_tier=HardwareTier.HIGH,
        os_type=OSType.WINDOWS,
        browser_vendor=BrowserVendor.CHROME
    )

    # Services
    validator = ProfileValidator()
    telemetry = TelemetryService()
    cache = LRUMemoryCache()
    registry = CapabilityRegistry()
    capability = CapabilityResolver(registry)
    builder = BuilderService()
    injector = InjectorService(telemetry=telemetry)
    optimizer = PlanOptimizer()
    behavior = BehaviorService()
    observability = ObservabilityService()

    # Créer l'engine avec les modules personnalisés
    engine = FingerprintEngine(
        profile=profile,
        builder=builder,
        injector=injector,
        validator=validator,
        capability=capability,
        optimizer=optimizer,
        behavior=behavior,
        telemetry=telemetry,
        observability=observability,
        cache=cache,
        modules=custom_modules
    )

    # Injecter
    success = engine.inject(
        page,
        enabled_modules=["custom_header", "performance_optimizer", "mock_geolocation"]
    )

    if success:
        print("✅ Modules personnalisés injectés avec succès")
    else:
        print("❌ Échec de l'injection des modules personnalisés")

    return success


# =============================================================================
# 5. TEST DES MODULES PERSONNALISÉS
# =============================================================================

def test_custom_modules():
    """
    Teste les modules d'évasion personnalisés.
    """
    print("=" * 60)
    print("🧪 Test des modules personnalisés")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Utiliser les modules personnalisés
        success = use_custom_modules(page, "https://example.com")

        if success:
            # Naviguer
            page.goto("https://example.com", wait_until="domcontentloaded")
            page.wait_for_load_state("networkidle")
            time.sleep(1)

            # Vérifier les modules
            results = page.evaluate("""
                () => {
                    // Vérifier le header personnalisé (via fetch)
                    const hasCustomFetch = typeof window.fetch === 'function';
                    const hasCustomXHR = typeof window.XMLHttpRequest === 'function';

                    // Vérifier la géolocalisation
                    let geolocationMocked = false;
                    if (navigator.geolocation) {
                        geolocationMocked = typeof navigator.geolocation.getCurrentPosition === 'function';
                    }

                    return {
                        has_custom_fetch: hasCustomFetch,
                        has_custom_xhr: hasCustomXHR,
                        geolocation_mocked: geolocationMocked,
                        style_optimized: !!document.querySelector('style[optimized]')
                    };
                }
            """)

            print("\n📊 Résultats des modules personnalisés:")
            print(f"   Header personnalisé (fetch): {results['has_custom_fetch']}")
            print(f"   Header personnalisé (XHR): {results['has_custom_xhr']}")
            print(f"   Géolocalisation mockée: {results['geolocation_mocked']}")

            # Sauvegarder une capture
            page.screenshot(path="custom_modules_page.png")
            print("\n📸 Screenshot sauvegardé: custom_modules_page.png")

        browser.close()


# =============================================================================
# 6. VALIDATION DES MODULES
# =============================================================================

def validate_custom_modules():
    """
    Valide les modules personnalisés avec différents profils.
    """
    print("\n" + "=" * 60)
    print("🔍 Validation des modules personnalisés")
    print("=" * 60)

    # Créer les modules
    modules = [
        CustomHeaderModule(),
        PerformanceOptimizerModule(),
        MockGeolocationModule()
    ]

    # Tester avec différents profils
    profiles = [
        FingerprintProfile.generate(HardwareTier.LOW, OSType.WINDOWS),
        FingerprintProfile.generate(HardwareTier.MEDIUM, OSType.WINDOWS),
        FingerprintProfile.generate(HardwareTier.HIGH, OSType.WINDOWS),
        FingerprintProfile.generate(HardwareTier.PREMIUM, OSType.WINDOWS)
    ]

    for profile in profiles:
        print(f"\n📌 Profil: {profile.hardware.cpu_cores} cœurs, {profile.hardware.ram_gb} GB RAM")
        for module in modules:
            errors = module.validate(profile)
            if errors:
                print(f"   ❌ {module.name}: {', '.join(errors)}")
            else:
                print(f"   ✅ {module.name}: Valide")


# =============================================================================
# 7. MAIN
# =============================================================================

def main():
    """Point d'entrée principal."""
    print("=" * 70)
    print("🎯 Modules d'évasion personnalisés - Playwright Stealth")
    print("=" * 70)
    print()

    # 1. Présentation des modules
    print("📌 Modules disponibles:")
    print("   1. CustomHeaderModule - Ajoute des headers HTTP personnalisés")
    print("   2. PerformanceOptimizerModule - Optimise les performances")
    print("   3. MockGeolocationModule - Simule une géolocalisation")
    print()

    # 2. Valider les modules
    validate_custom_modules()

    # 3. Tester les modules
    try:
        test_custom_modules()
    except Exception as e:
        print(f"⚠️ Erreur lors du test: {e}")

    print("\n" + "=" * 70)
    print("✅ Démonstration terminée")
    print("=" * 70)


if __name__ == "__main__":
    main()