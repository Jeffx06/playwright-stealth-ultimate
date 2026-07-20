# test_fixed_injection.py
"""Test de correction pour l'injection"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    # Appliquer le stealth
    success = stealth_sync(page)
    print(f"✅ Stealth activé: {success}")
    
    page.goto("https://example.com")
    
    # Vérifier
    result = page.evaluate("""
        () => ({
            webdriver: navigator.webdriver,
            webdriver_in: 'webdriver' in navigator,
            webdriver_type: typeof navigator.webdriver,
            plugins: navigator.plugins.length,
            chrome: !!window.chrome,
            runtime: !!window.chrome?.runtime,
            platform: navigator.platform
        })
    """)
    
    print("\n📊 Résultats:")
    for key, value in result.items():
        status = "✅" if value in [None, False, "undefined"] else "❌"
        if key == "webdriver" and value is True:
            status = "❌"
        elif key == "webdriver" and value in [None, False, "undefined"]:
            status = "✅"
        elif key == "platform" and value == "MacIntel":
            status = "✅"
        print(f"   {status} {key}: {value}")
    
    input("\nAppuie sur Entrée pour fermer...")
    browser.close()