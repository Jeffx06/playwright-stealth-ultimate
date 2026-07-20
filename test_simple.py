# test_simple.py
import sys
from pathlib import Path

# Ajouter le chemin du projet
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

print("=" * 60)
print("🧪 Test simple de Playwright Stealth")
print("=" * 60)

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
            plugins: navigator.plugins.length,
            chrome: !!window.chrome,
            runtime: !!window.chrome?.runtime,
            platform: navigator.platform,
            languages: navigator.languages
        })
    """)
    
    print("\n📊 Résultats:")
    for key, value in result.items():
        status = "✅" if value not in [True, 0, False, None] else "❌"
        if key == "webdriver" and value is True:
            status = "❌"
        elif key == "webdriver" and value in [False, None, "undefined"]:
            status = "✅"
        print(f"   {status} {key}: {value}")
    
    input("\nAppuie sur Entrée pour fermer...")
    browser.close()
