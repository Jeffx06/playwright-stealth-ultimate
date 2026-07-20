# test_stealth_fixed.py
import sys
from pathlib import Path

# Ajouter le chemin du projet
sys.path.insert(0, str(Path(__file__).parent))

# Importer les modules
from playwright.sync_api import sync_playwright
from adapters.playwright import PlaywrightAdapter
from js.modules import get_all_modules

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    adapter = PlaywrightAdapter()
    modules = get_all_modules()
    adapter.create_engine(modules=modules)
    
    success = adapter.apply_to_page(page)
    print(f"Stealth success: {success}")
    
    page.goto("https://example.com")
    
    result = page.evaluate("""
        () => ({
            webdriver: navigator.webdriver,
            plugins: navigator.plugins.length,
            chrome: !!window.chrome,
            runtime: !!window.chrome?.runtime
        })
    """)
    print(f"Results: {result}")
    
    input("Appuie sur Entrée...")
    browser.close()
