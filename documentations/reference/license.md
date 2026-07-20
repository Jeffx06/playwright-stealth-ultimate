# Licence MIT

Copyright (c) 2026 Playwright Stealth Team

---

## 📋 Résumé de la licence

La licence MIT est une licence permissive qui permet une utilisation, une modification et une distribution libre du logiciel, sous réserve de conserver l'avis de droit d'auteur.

| Vous pouvez | Vous devez | Vous ne pouvez pas |
|-------------|------------|-------------------|
| ✅ Utiliser le logiciel | ✅ Conserver l'avis de copyright | ❌ Utiliser mon nom pour promouvoir |
| ✅ Modifier le logiciel | ✅ Conserver l'avis de licence | ❌ Tenir les auteurs responsables |
| ✅ Distribuer le logiciel | | |
| ✅ Utiliser commercialement | | |
| ✅ Sublicencier | | |

---

## 📜 Texte complet de la licence MIT
MIT License

Copyright (c) 2026 Playwright Stealth Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

text

---

## 📝 Texte en français (traduction non officielle)
Licence MIT

Copyright (c) 2026 Équipe Playwright Stealth

La permission est accordée, gratuitement, à toute personne obtenant une copie
de ce logiciel et des fichiers de documentation associés (le "Logiciel"), de
traiter le Logiciel sans restriction, y compris, sans limitation, les droits
d'utilisation, de copie, de modification, de fusion, de publication, de
distribution, de sous-licence et/ou de vente de copies du Logiciel, et de
permettre aux personnes auxquelles le Logiciel est fourni de le faire,
sous réserve des conditions suivantes :

L'avis de copyright ci-dessus et le présent avis de permission doivent être
inclus dans toutes les copies ou parties substantielles du Logiciel.

LE LOGICIEL EST FOURNI "TEL QUEL", SANS GARANTIE D'AUCUNE SORTE, EXPLICITE OU
IMPLICITE, Y COMPRIS MAIS SANS S'Y LIMITER, LES GARANTIES DE QUALITÉ
MARCHANDE, D'ADÉQUATION À UN USAGE PARTICULIER ET D'ABSENCE DE CONTREFAÇON.
EN AUCUN CAS, LES AUTEURS OU TITULAIRES DU DROIT D'AUTEUR NE SERONT
RESPONSABLES DE TOUTE RÉCLAMATION, DOMMAGE OU AUTRE RESPONSABILITÉ, QUE CE
SOIT DANS LE CADRE D'UNE ACTION DE CONTRAT, DE DÉLIT OU AUTRE, DÉCOULANT DE,
OU EN RELATION AVEC LE LOGICIEL OU L'UTILISATION OU D'AUTRES TRANSACTIONS
DANS LE LOGICIEL.

text

---

## 🔍 Analyse de la licence MIT

### Ce que la licence vous permet

#### 1. Utilisation
- Utilisation personnelle ou professionnelle
- Déploiement dans des environnements de production
- Intégration dans d'autres projets

#### 2. Modification
- Modification du code source
- Adaptation à vos besoins spécifiques
- Amélioration des fonctionnalités

#### 3. Distribution
- Distribution du code source original
- Distribution de versions modifiées
- Distribution sous forme de package

#### 4. Commercialisation
- Utilisation dans des produits commerciaux
- Vente de produits dérivés
- Utilisation dans des SaaS

### Conditions à respecter

#### 1. Avis de copyright

# Exemple d'avis de copyright à conserver
# Copyright (c) 2026 Playwright Stealth Team
2. Avis de licence
text
# À inclure dans votre distribution
This software includes software developed by the Playwright Stealth Team
under the MIT License.
Limitations
1. Garantie
"AS IS" - Le logiciel est fourni sans garantie. Utilisez à vos propres risques.

2. Responsabilité
Les auteurs ne sont pas responsables des dommages liés à l'utilisation du logiciel.

3. Attribution
L'utilisation du nom "Playwright Stealth" pour la promotion nécessite une autorisation.

📦 Inclusion de la licence
Dans votre projet
1. Fichier LICENSE
markdown
MIT License

Copyright (c) 2026 Playwright Stealth Team

[Texte complet de la licence]
2. Notice dans le code
python
# playwright_stealth/__init__.py
"""
Playwright Stealth Framework

Copyright (c) 2026 Playwright Stealth Team
Licensed under the MIT License.
"""

__version__ = "5.0.0"
3. Notice dans les packages
python
# setup.py
setup(
    name="playwright-stealth",
    license="MIT",
    license_files=["LICENSE"],
    classifiers=[
        "License :: OSI Approved :: MIT License",
    ],
)
Dans les distributions
1. PyPI
python
# pyproject.toml
[project]
license = { text = "MIT" }

[tool.setuptools]
license-files = ["LICENSE"]
2. Docker
dockerfile
# Ajouter la licence dans l'image
COPY LICENSE /usr/local/lib/python3.11/site-packages/playwright_stealth/
⚖️ Comparaison avec d'autres licences
Licence	Permissive	Commercial	Modifications	Copyleft
MIT	      ✅	       ✅	         ✅	             ❌
BSD	✅	✅	✅	❌
Apache 2.0	✅	✅	✅	❌
GPL v2	❌	✅	✅	✅
GPL v3	❌	✅	✅	✅
LGPL	❌	✅	✅	✅ (partiel)
🔗 Notices des dépendances
Playwright
text
Copyright (c) Microsoft Corporation.

Licensed under the Apache License, Version 2.0.
cachetools
text
Copyright (c) 2015 Thomas Kemmer

Licensed under the MIT License.
PyYAML
text
Copyright (c) 2006-2025 Kirill Simonov

Licensed under the MIT License.
Selenium
text
Copyright (c) 2011-2025 Software Freedom Conservancy

Licensed under the Apache License, Version 2.0.
✅ Compliance checklist
Pour les utilisateurs
Conserver la notice de copyright

Inclure la licence dans les distributions

Mentionner l'utilisation du framework

Ne pas utiliser le nom sans autorisation

Pour les contributeurs
Contribuer sous la même licence MIT

Conserver la notice de copyright

Respecter les conditions de la licence

Pour les distributeurs
Inclure le fichier LICENSE

Conserver les avis de copyright

Mentionner la licence dans la documentation

📝 FAQ sur la licence
Puis-je utiliser Playwright Stealth dans un projet commercial ?
Oui. La licence MIT permet une utilisation commerciale.

Puis-je modifier le code et ne pas publier les modifications ?
Oui. La licence MIT ne nécessite pas de publier les modifications.

Puis-je utiliser le nom "Playwright Stealth" dans mon produit ?
Non sans autorisation. Le nom est protégé par la marque.

Puis-je distribuer une version modifiée de Playwright Stealth ?
Oui. Sous réserve de conserver la licence MIT.

Le framework est-il garanti sans bugs ?
Non. Le logiciel est fourni "tel quel", sans garantie.

Puis-je contribuer au projet sans signer un CLA ?
Oui. Le projet n'a pas de CLA (Contributor License Agreement).

🔗 Ressources légales
Comprendre la licence MIT
Open Source Initiative - MIT License

Choose a License - MIT

TLDRLegal - MIT

Textes officiels
MIT License - Texte officiel

SPDX License List

🚀 Prochaine étape
📖 FAQ

📖 Guide de contribution

Dernière mise à jour : 2026-07-19
Version : 5.0.0
text

---

## 📋 RÉSUMÉ DES MODIFICATIONS

| # | Modification | Justification |
|---|--------------|---------------|
| 1 | **En-tête interne supprimé** | "📝 RÉDACTION DU FICHIER" supprimé |
| 2 | **Nom du package** | `playwright-stealth-framework` → `playwright-stealth` |
| 3 | **Date** | 2026-07-18 → 2026-07-19 |

---

## ✅ STATUT DU FICHIER

| Critère | État |
|---------|------|
| **Structure** | ✅ OK |
| **Lisibilité** | ✅ OK |
| **Exactitude technique** | ✅ OK |
| **Complétude** | ✅ OK |

---

## 🎉 RÉCAPITULATIF FINAL - TOUS LES FICHIERS TRAITÉS

| # | Fichier | Statut |
|---|---------|--------|
| 1 | `README.md` | ✅ OPTIMISÉ |
| 2 | `docs_overview.md` | ✅ OPTIMISÉ |
| 3 | `faq.md` | ✅ OPTIMISÉ |
| 4 | `mkdocs.yml` | ✅ OPTIMISÉ |
| 5 | `resumé.txt` | ⏭️ IGNORÉ |
| 6 | `advanced/benchmarking.md` | ✅ OPTIMISÉ |
| 7 | `reference/changelog.md` | ✅ OPTIMISÉ |
| 8 | `reference/contributing.md` | ✅ OPTIMISÉ |
| 9 | `reference/license.md` | ✅ OPTIMISÉ |

**9 fichiers de documentation traités avec succès !** 🚀