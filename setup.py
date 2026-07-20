#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Setup pour playwright-stealth-ultimate"""

from setuptools import setup, find_packages
from pathlib import Path

# Lire le README.md pour la description longue
readme_path = Path(__file__).parent / "README.md"
if readme_path.exists():
    with open(readme_path, "r", encoding="utf-8") as f:
        long_description = f.read()
else:
    long_description = "Framework d'évasion anti-bot pour Playwright et Selenium"

setup(
    name="playwright-stealth-ultimate",  # ✅ NOUVEAU NOM
    version="5.0.0",
    author="Jeff",  # ✅ AUTEUR MODIFIÉ
    author_email="jeffx@live.fr",  # ✅ EMAIL MODIFIÉ
    description="Framework d'évasion anti-bot pour Playwright et Selenium",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/playwright-stealth-ultimate",
    project_urls={
        "Bug Reports": "https://github.com/yourusername/playwright-stealth-ultimate/issues",
        "Source": "https://github.com/yourusername/playwright-stealth-ultimate",
        "Documentation": "https://github.com/yourusername/playwright-stealth-ultimate#readme",
    },
    license="MIT",
    packages=find_packages(
        include=["playwright_stealth", "playwright_stealth.*"],
        exclude=["tests", "tests.*", "examples", "examples.*", "docs", "benchmark_reports"]
    ),
    include_package_data=True,
    package_data={
        "playwright_stealth": [
            "js/*.js",
            "config/**/*.yaml",
            "config/**/*.json",
            "py.typed",
        ],
    },
    zip_safe=False,
    python_requires=">=3.10",
    install_requires=[
        "playwright>=1.40.0",
        "cachetools>=5.0.0",
        "pyyaml>=6.0",
    ],
    extras_require={
        "selenium": [
            "selenium>=4.0.0",
        ],
        "dev": [
            "pytest>=9.0.0",
            "pytest-cov>=7.0.0",
            "pytest-xdist>=3.0.0",
            "black>=24.0.0",
            "ruff>=0.5.0",
            "mypy>=1.0.0",
            "psutil>=7.0.0",
        ],
        "docs": [
            "mkdocs>=1.5.0",
            "mkdocs-material>=9.5.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "stealth-benchmark=examples.advanced.benchmark_runner:main",
        ],
    },
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Programming Language :: Python :: 3.13",
        "Programming Language :: Python :: 3.14",
        "Topic :: Internet :: WWW/HTTP :: Browsers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Typing :: Typed",
    ],
    keywords="playwright, selenium, stealth, anti-bot, scraping, automation, fingerprinting, evasion",
)