# run_all_tests.py
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import subprocess
from pathlib import Path

# ✅ Forcer l'encodage UTF-8
os.environ['PYTHONIOENCODING'] = 'utf-8'

# Ajouter le chemin du projet
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def run_command(cmd, description):
    """Exécute une commande et affiche le résultat."""
    print(f"\n{'='*60}")
    print(f"[TEST] {description}")
    print(f"{'='*60}")
    
    # ✅ Forcer l'encodage UTF-8 dans la commande
    env = os.environ.copy()
    env['PYTHONIOENCODING'] = 'utf-8'
    
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True,
        encoding='utf-8',  # ✅ Forcer l'encodage
        env=env
    )
    
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print("[ERREURS]")
        print(result.stderr)
    return result.returncode == 0

def main():
    """Exécute tous les tests."""
    tests = [
        ("python -c \"from playwright_stealth import stealth_sync; print('Import OK')\"", 
         "Verification de l'import"),
        ("python -X utf8 examples/basic/simple_injection.py",  # ✅ -X utf8
         "Test simple_injection.py"),
        ("python -X utf8 examples/basic/custom_profile.py",
         "Test custom_profile.py"),
        ("python -X utf8 examples/intermediate/custom_modules.py",
         "Test custom_modules.py"),
        ("python -X utf8 examples/intermediate/multi_page_scraping.py",
         "Test multi_page_scraping.py"),
        ("python -X utf8 examples/advanced/behavior_simulation.py",
         "Test behavior_simulation.py"),
        ("python -X utf8 examples/advanced/full_configuration.py",
         "Test full_configuration.py"),
        ("python -X utf8 examples/advanced/profile_migration.py",
         "Test profile_migration.py"),
        ("python -m pytest tests/unit/ -v --tb=short", 
         "Tests unitaires"),
        ("python -m pytest tests/integration/test_injection.py -v -m playwright --tb=short", 
         "Tests d'integration Playwright"),
    ]
    
    passed = 0
    total = len(tests)
    
    for cmd, description in tests:
        if run_command(cmd, description):
            passed += 1
    
    print(f"\n{'='*60}")
    print(f"RESULTAT FINAL: {passed}/{total} tests reussis")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()