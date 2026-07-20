# Guide de contribution

Merci de votre intérêt pour contribuer au framework Playwright Stealth ! Ce guide vous aidera à comprendre comment contribuer efficacement.

---

## 📋 Vue d'ensemble

```mermaid
graph TD
    A[Contribution] --> B[Signalement bugs]
    A --> C[Suggestions]
    A --> D[Code]
    A --> E[Documentation]
    A --> F[Tests]
    
    B --> B1[Issues GitHub]
    B --> B2[Template]
    
    C --> C1[Discussions]
    C --> C2[Feature requests]
    
    D --> D1[Pull Requests]
    D --> D2[Review]
    
    E --> E1[Docstrings]
    E --> E2[Guides]
    
    F --> F1[Unit tests]
    F --> F2[Integration]
🤝 Code de conduite
Ce projet adhère au Code de conduite Contributor Covenant. En participant, vous acceptez de respecter ce code.

Principes fondamentaux
✅ Respect envers tous les contributeurs

✅ Bienveillance dans les échanges

✅ Constructivité dans les critiques

✅ Inclusion de toutes les perspectives

🐛 Signalement de bugs
Avant de signaler
🔍 Vérifiez la documentation - Votre problème est peut-être déjà documenté

🔍 Vérifiez les issues existantes - Problème déjà signalé ?

🔍 Testez la dernière version - Problème corrigé dans une version récente ?

Template d'issue
markdown
## 🐛 Description du bug
Description claire et concise du problème.

## 🔄 Reproduction
Étapes pour reproduire le comportement :
1. Installez la version X
2. Exécutez le code Y
3. Voyez l'erreur Z

## ✅ Comportement attendu
Description de ce qui devrait se produire.

## 💻 Environnement
- Python version : 
- OS : 
- Playwright version : 
- Framework version :

## 📝 Logs
Logs d'erreur pertinents

text
Issue categories
Label	Description
bug	Bug à corriger
enhancement	Amélioration de fonctionnalité
documentation	Problème de documentation
question	Question / demande d'aide
good first issue	Bonne première contribution
💡 Suggestions
Processus de suggestion
Discussion : Ouvrez une discussion sur GitHub Discussions

Documentation : Décrivez clairement la fonctionnalité

Validation : Attendez le retour de la communauté

Implémentation : Proposez une PR si validé

Template de suggestion
markdown
## 💡 Résumé
Description de la fonctionnalité souhaitée.

## 🎯 Cas d'usage
Scénario d'utilisation de cette fonctionnalité.

## 🔍 Analyse
Analyse technique de l'implémentation.

## 📊 Bénéfices
- Bénéfice 1
- Bénéfice 2
💻 Contribution de code
1. Configuration de l'environnement
bash
# Fork et clone du dépôt
git clone https://github.com/votre-username/playwright-stealth.git
cd playwright-stealth

# Création d'un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/macOS
# ou
venv\Scripts\activate     # Windows

# Installation en mode développement
pip install -e .[dev]

# Installation des pré-commit hooks
pre-commit install
2. Branches
Branche	Description
main	Branche principale (stable)
develop	Branche de développement
feature/*	Nouvelles fonctionnalités
fix/*	Corrections de bugs
docs/*	Documentation
release/*	Préparation de release
3. Style de code
Python (PEP 8)
python
# ✅ Bon exemple
from typing import Optional
import random

class FingerprintProfile:
    """Profil fingerprint complet."""
    
    def __init__(
        self,
        hardware: HardwareProfile,
        browser: BrowserProfile,
        seed: Optional[int] = None
    ):
        self.hardware = hardware
        self.browser = browser
        self.seed = seed or random.randint(1, 10**6)
    
    def validate(self) -> bool:
        """Valider la cohérence du profil."""
        return self._validate_hardware() and self._validate_browser()

# ❌ Mauvais exemple
class fingerprintProfile:
    def __init__(self,hardware,browser,seed=None):
        self.hardware=hardware
        self.browser=browser
        self.seed=seed
Standards
Standard	Outil	Commande
Formatage	black	black .
Linting	ruff	ruff check .
Typage	mypy	mypy playwright_stealth
Docs	pydocstyle	pydocstyle playwright_stealth
4. Commits
Convention
text
<type>(<scope>): <message>

[corps du message]

[footer]
Types
Type	Description
feat	Nouvelle fonctionnalité
fix	Correction de bug
docs	Documentation
style	Formatage (non-fonctionnel)
refactor	Refactorisation
perf	Performance
test	Tests
chore	Maintenance
Exemples
bash
# Bon exemple
feat(core): ajout du support Python 3.14

fix(validator): correction de la validation deviceMemory

docs(api): documentation de l'API Services

# Mauvais exemple
update code
fix bug
docs update
5. Pull Requests
Processus
Fork le dépôt

Clone votre fork

Créez une branche feature/ma-fonctionnalite

Développez votre fonctionnalité

Testez vos modifications

Committez avec une convention claire

Push sur votre fork

Ouvrez une Pull Request vers develop

Template PR
markdown
## 📝 Description
Description des changements.

## 🔍 Changements
- Changement 1
- Changement 2
- Changement 3

## ✅ Checklist
- [ ] Tests ajoutés/modifiés
- [ ] Documentation mise à jour
- [ ] Code formaté (black)
- [ ] Type checking (mypy)
- [ ] Linting (ruff)

## 🧪 Tests
Résultats des tests

text
🧪 Tests
1. Écrire des tests
Tests unitaires
python
# tests/unit/test_nouvelle_fonction.py
import pytest
from playwright_stealth.nouveau_module import NouvelleClasse

class TestNouvelleClasse:
    """Tests de NouvelleClasse."""
    
    def test_initialisation(self):
        """Test de l'initialisation."""
        obj = NouvelleClasse(param="test")
        assert obj.param == "test"
    
    def test_methode(self):
        """Test d'une méthode."""
        obj = NouvelleClasse()
        result = obj.methode()
        assert result is True
    
    @pytest.mark.parametrize("input,expected", [
        ("a", "A"),
        ("b", "B"),
        ("c", "C")
    ])
    def test_parametres(self, input, expected):
        """Test paramétré."""
        obj = NouvelleClasse()
        assert obj.process(input) == expected
Tests d'intégration
python
# tests/integration/test_nouvelle_integration.py
import pytest
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

@pytest.mark.integration
class TestNouvelleIntegration:
    """Tests d'intégration."""
    
    def test_integration_playwright(self):
        """Test avec Playwright."""
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            success = stealth_sync(page)
            assert success is True
            browser.close()
2. Exécuter les tests
bash
# Tests unitaires
pytest tests/unit/ -v

# Tests d'intégration
pytest tests/integration/ -v -m integration

# Tous les tests avec coverage
pytest tests/ --cov=playwright_stealth --cov-report=html

# Tests spécifiques
pytest tests/unit/test_profile.py -v
📝 Documentation
1. Docstrings (Google Style)
python
def ma_fonction(param1: str, param2: int = 0) -> bool:
    """Description de la fonction.
    
    Args:
        param1: Description du premier paramètre.
        param2: Description du deuxième paramètre (défaut: 0).
    
    Returns:
        bool: Description du retour.
    
    Raises:
        ValueError: Si param1 est vide.
    
    Examples:
        >>> ma_fonction("test", 42)
        True
    """
    if not param1:
        raise ValueError("param1 ne peut pas être vide")
    return True
2. Documentation utilisateur
markdown
---
title: Titre du document
---

# Titre

## Introduction
Description de la section.

## 🎯 Objectif
Objectif de la section.

## 📝 Contenu
Contenu principal.

## 🔗 Voir aussi
- [Lien vers autre doc](autre-doc.md)
3. Vérification
bash
# Vérifier les docstrings
pydocstyle playwright_stealth/

# Vérifier la documentation Markdown
markdownlint docs/**/*.md
🎯 Domaines de contribution
1. Scripts d'évasion
javascript
// playwright_stealth/js/nouveau_module.js
(function() {
    'use strict';
    
    const MODULE = {
        id: 'nouveau_module',
        name: 'Nouveau Module',
        version: '1.0.0',
        priority: 5,
        dependencies: [],
        conflicts: []
    };
    
    function applyPatch(profile) {
        // Implémenter l'évasion
        return true;
    }
    
    // Exporter
    window.__stealth_modules = window.__stealth_modules || {};
    window.__stealth_modules[MODULE.id] = {
        ...MODULE,
        apply: applyPatch
    };
})();
2. Services
python
# playwright_stealth/services/nouveau_service.py
from typing import Optional
from playwright_stealth.core.profile import FingerprintProfile

class NouveauService:
    """Service pour ..."""
    
    def __init__(self, config: Optional[dict] = None):
        """Initialiser le service."""
        self.config = config or {}
    
    def process(self, profile: FingerprintProfile) -> bool:
        """Traiter le profil.
        
        Args:
            profile: Profil à traiter.
            
        Returns:
            bool: True si réussi.
        """
        # Implémenter
        return True
3. Tests
python
# tests/unit/test_nouveau_service.py
import pytest
from playwright_stealth.services.nouveau_service import NouveauService
from playwright_stealth import FingerprintProfile, HardwareTier, OSType

class TestNouveauService:
    """Tests de NouveauService."""
    
    def test_process(self):
        """Test de process()."""
        service = NouveauService()
        profile = FingerprintProfile.generate(
            hardware_tier=HardwareTier.MEDIUM,
            os_type=OSType.WINDOWS
        )
        assert service.process(profile) is True
📊 Processus de review
Checklist de review
Code
Le code suit le style PEP 8

Les types sont correctement annotés

Les docstrings sont présentes

Pas de code mort ou commenté

Pas de fonctions trop longues (> 50 lignes)

Pas de duplication de code

Tests
Les tests couvrent la nouvelle fonctionnalité

Les tests passent en local

Les tests d'intégration sont ajoutés si besoin

La couverture de code n'a pas diminué

Documentation
La documentation utilisateur est mise à jour

La documentation API est mise à jour

Les exemples sont fonctionnels

Le changelog est mis à jour

Performance
Pas de régression de performance

L'utilisation mémoire est raisonnable

Les temps de réponse sont acceptables

🔗 Ressources utiles
Outils de développement
Outil	Utilisation	Commande
ruff	Linting & formatage	ruff check .
black	Formatage	black .
mypy	Type checking	mypy .
pytest	Tests	pytest
pytest-cov	Coverage	pytest --cov
pre-commit	Hooks	pre-commit run
Liens utiles
Documentation Playwright

PEP 8

Google Docstrings

Conventional Commits

🚀 Prochaine étape
📖 FAQ

📖 Changelog

Dernière mise à jour : 2026-07-19
Version : 5.0.0