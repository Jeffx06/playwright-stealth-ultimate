# test_manual_injection.py
"""Test d'injection manuelle des scripts JS"""

from playwright.sync_api import sync_playwright
from js.loader import ScriptLoader

def test_manual_injection():
    print("=" * 60)
    print("🧪 Test d'injection manuelle")
    print("=" * 60)
    
    loader = ScriptLoader()
    
    # Charger les scripts critiques
    webdriver_script = loader.get("navigator.webdriver")
    runtime_script = loader.get("chrome.runtime")
    
    print(f"📄 webdriver.js: {len(webdriver_script)} caractères")
    print(f"📄 runtime.js: {len(runtime_script)} caractères")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # Injecter manuellement les scripts
        print("🛡️ Injection manuelle des scripts...")
        page.add_init_script(webdriver_script)
        page.add_init_script(runtime_script)
        
        page.goto("https://example.com")
        
        result = page.evaluate("""
            () => ({
                webdriver: navigator.webdriver,
                plugins: navigator.plugins.length,
                chrome: !!window.chrome,
                runtime: !!window.chrome?.runtime,
                webdriver_in: 'webdriver' in navigator,
                webdriver_type: typeof navigator.webdriver
            })
        """)
        
        print("\n📊 Résultats:")
        for key, value in result.items():
            status = "✅" if value not in [True, 0, False, None] else "❌"
            if key == "webdriver" and value is True:
                status = "❌"
            elif key == "webdriver" and value in [False, None, "undefined"]:
                status = "✅"
            elif key == "webdriver_in" and value is False:
                status = "✅"
            elif key == "runtime" and value is True:
                status = "✅"
            print(f"   {status} {key}: {value}")
        
        input("\nAppuie sur Entrée pour fermer...")
        browser.close()

if __name__ == "__main__":
    test_manual_injection()
