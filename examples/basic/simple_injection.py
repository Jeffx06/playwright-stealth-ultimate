#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
from pathlib import Path

# Ajouter le chemin du projet avant toute importation locale
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

"""
Exemple basique : Injection simple

Ce script démontre l'injection de base du stealth sur une page Playwright.

Niveau : Basique
Temps estimé : 2-5 minutes

Fonctionnalités :
- Injection simple avec stealth_sync()
- Navigation vers une page
- Vérification de l'injection (webdriver, plugins, etc.)
- Capture d'écran
- Extraction de données basique

Compatibilité : Python 3.10+, Playwright 1.40+
"""

import time
from playwright.sync_api import sync_playwright, Page
from playwright_stealth import stealth_sync, dump_configuration


# =============================================================================
# 1. INJECTION SIMPLE
# =============================================================================

def simple_injection_example(url: str = "https://example.com"):
    """
    Exemple d'injection simple du stealth sur une page Playwright.

    Args:
        url: URL à visiter
    """
    print("=" * 60)
    print("🎯 Injection simple - Playwright Stealth")
    print("=" * 60)

    with sync_playwright() as p:
        # Lancer le navigateur
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Appliquer le stealth avec les valeurs par défaut
        print("🛡️ Application du stealth...")
        success = stealth_sync(page)

        if success:
            print("✅ Stealth activé avec succès")
        else:
            print("❌ Échec de l'injection stealth")
            browser.close()
            return

        # Naviguer vers la page
        print(f"🌐 Navigation vers {url}...")
        page.goto(url, wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Vérifier l'injection
        verify_injection(page)

        # Sauvegarder une capture d'écran
        screenshot_path = "simple_injection_page.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"\n📸 Screenshot sauvegardé: {screenshot_path}")

        browser.close()
        print("\n✅ Injection terminée avec succès")


# =============================================================================
# 2. VÉRIFICATION DE L'INJECTION
# =============================================================================

def verify_injection(page: Page) -> dict:
    """
    Vérifie que l'injection stealth a bien fonctionné.

    Args:
        page: Page Playwright

    Returns:
        dict: Résultats de la vérification
    """
    print("\n🔍 Vérification de l'injection...")

    results = page.evaluate("""
        () => {
            // Vérifier webdriver
            const webdriver = navigator.webdriver;
            const webdriverIn = 'webdriver' in navigator;

            // Vérifier les plugins
            const pluginsLength = navigator.plugins ? navigator.plugins.length : 0;

            // Vérifier chrome
            const hasChrome = !!window.chrome;

            // Vérifier runtime
            const hasRuntime = !!window.chrome?.runtime;

            // Vérifier les langues
            const languages = navigator.languages || [];

            // Vérifier la plateforme
            const platform = navigator.platform || '';

            // Vérifier l'User-Agent
            const userAgent = navigator.userAgent || '';

            return {
                webdriver: webdriver,
                webdriver_in: webdriverIn,
                plugins_length: pluginsLength,
                has_chrome: hasChrome,
                has_runtime: hasRuntime,
                languages: languages,
                platform: platform,
                user_agent: userAgent,
                is_stealth_active: webdriver === undefined || webdriver === null || webdriver === false
            };
        }
    """)

    print("\n📊 Résultats de la vérification:")
    print(f"   webdriver: {results['webdriver']} (✅ masqué)" if results['webdriver'] in [None, 'undefined', False] else f"   webdriver: {results['webdriver']} (❌ détecté)")
    print(f"   webdriver in navigator: {results['webdriver_in']} (✅ faux)" if results['webdriver_in'] is False else f"   webdriver in navigator: {results['webdriver_in']}")
    print(f"   plugins: {results['plugins_length']} (✅ > 0)" if results['plugins_length'] > 0 else f"   plugins: {results['plugins_length']} (⚠️ vide)")
    print(f"   chrome: {results['has_chrome']}")
    print(f"   chrome.runtime: {results['has_runtime']}")
    print(f"   languages: {', '.join(results['languages'][:3])}")
    print(f"   platform: {results['platform']}")
    print(f"   user_agent: {results['user_agent'][:80]}...")

    status = "✅ Stealth actif" if results['is_stealth_active'] else "❌ Stealth inactif"
    print(f"\n   {status}")

    return results


# =============================================================================
# 3. EXTRACTION DE DONNÉES BASIQUE
# =============================================================================

def extract_basic_data(page: Page) -> dict:
    """
    Extrait des données basiques d'une page.

    Args:
        page: Page Playwright

    Returns:
        dict: Données extraites
    """
    data = page.evaluate("""
        () => {
            const title = document.title || '';
            const h1 = document.querySelector('h1')?.textContent || '';
            const description = document.querySelector('meta[name="description"]')?.content || '';
            const links = document.querySelectorAll('a').length;
            const paragraphs = document.querySelectorAll('p').length;

            return {
                title: title,
                h1: h1,
                description: description,
                links_count: links,
                paragraphs_count: paragraphs
            };
        }
    """)

    print("\n📊 Données extraites:")
    print(f"   Titre: {data['title']}")
    print(f"   H1: {data['h1']}")
    print(f"   Description: {data['description'][:100] if data['description'] else 'N/A'}...")
    print(f"   Liens: {data['links_count']}")
    print(f"   Paragraphes: {data['paragraphs_count']}")

    return data


# =============================================================================
# 4. MULTIPLES SITES
# =============================================================================

def test_multiple_sites():
    """
    Teste l'injection sur plusieurs sites.
    """
    print("\n" + "=" * 60)
    print("🌐 Test sur multiples sites")
    print("=" * 60)

    sites = [
        "https://example.com",
        "https://www.wikipedia.org",
        "https://news.ycombinator.com"
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for url in sites:
            print(f"\n📄 Test de {url}")
            page = browser.new_page()

            # Injecter le stealth
            success = stealth_sync(page)

            if success:
                page.goto(url, wait_until="domcontentloaded")
                page.wait_for_load_state("networkidle")

                # Vérifier rapidement
                result = page.evaluate("""
                    () => ({
                        webdriver: navigator.webdriver,
                        plugins: navigator.plugins ? navigator.plugins.length : 0,
                        title: document.title || ''
                    })
                """)

                print(f"   ✅ webdriver: {result['webdriver']}")
                print(f"   ✅ plugins: {result['plugins']}")
                print(f"   📄 title: {result['title'][:50]}...")
            else:
                print(f"   ❌ Échec de l'injection sur {url}")

            page.close()

        browser.close()

    print("\n✅ Tests sur multiples sites terminés")


# =============================================================================
# 5. MAIN
# =============================================================================

def main():
    """Point d'entrée principal."""
    print("=" * 70)
    print("🚀 Injection simple - Playwright Stealth")
    print("=" * 70)
    print()

    # 1. Afficher la configuration par défaut
    print("📌 Configuration par défaut")
    dump_configuration()
    print()

    # 2. Exemple d'injection simple
    simple_injection_example("https://example.com")

    # 3. Tester sur plusieurs sites
    try:
        test_multiple_sites()
    except Exception as e:
        print(f"⚠️ Erreur lors du test sur multiples sites: {e}")

    print("\n" + "=" * 70)
    print("✅ Démonstration terminée")
    print("=" * 70)


if __name__ == "__main__":
    main()