# test_direct.py
from playwright.sync_api import sync_playwright
from adapters.playwright import stealth_sync

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    # Appliquer le stealth
    success = stealth_sync(page)
    print(f"Stealth success: {success}")
    
    page.goto("https://example.com")
    
    # Vérifier
    result = page.evaluate("""
        () => ({
            webdriver: navigator.webdriver,
            plugins: navigator.plugins.length,
            chrome: !!window.chrome,
            runtime: !!window.chrome?.runtime
        })
    """)
    print(result)
    
    input("Appuie sur Entrée...")
    browser.close()