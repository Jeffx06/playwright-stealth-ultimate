#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Exemple intermédiaire : Scraping multi-pages
"""

import sys
from pathlib import Path

# ✅ Ajouter le chemin du projet
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import json
import csv
import time
import random
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime

from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext, TimeoutError
from playwright_stealth import stealth_sync
from playwright_stealth.core.types import HardwareTier, OSType, BrowserVendor


# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


@dataclass
class PageConfig:
    """Configuration d'une page à scraper"""
    url: str
    name: str
    selectors: Dict[str, str]
    wait_selector: Optional[str] = None
    max_retries: int = 3
    timeout: int = 30000


@dataclass
class ScraperConfig:
    """Configuration du scraper multi-pages"""
    headless: bool = False
    delay_between_pages: Tuple[float, float] = (1.0, 3.0)
    max_retries: int = 3
    export_format: str = "json"
    output_dir: str = "scraped_data"
    verbose: bool = True


class MultiPageScraper:
    """Scraper multi-pages avec Playwright Stealth."""

    def __init__(self, config: ScraperConfig = ScraperConfig()):
        self.config = config
        self.results: List[Dict[str, Any]] = []
        self.output_dir = Path(config.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def scrape_pages(self, pages: List[PageConfig], rotate_profiles: bool = True) -> List[Dict[str, Any]]:
        """Scrape plusieurs pages."""
        self.results = []

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=self.config.headless)
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                locale='fr-FR',
                timezone_id='Europe/Paris'
            )

            try:
                for i, page_config in enumerate(pages):
                    logger.info(f"\n{'='*60}")
                    logger.info(f"📋 Page {i+1}/{len(pages)}: {page_config.name}")
                    logger.info(f"{'='*60}")

                    page = context.new_page()
                    try:
                        # Appliquer le stealth
                        success = stealth_sync(page)
                        if not success:
                            logger.warning(f"⚠️ Échec du stealth pour {page_config.name}")
                            continue

                        # Naviguer
                        for attempt in range(page_config.max_retries):
                            try:
                                page.goto(page_config.url, wait_until="domcontentloaded", timeout=page_config.timeout)
                                page.wait_for_load_state("networkidle", timeout=30000)
                                break
                            except TimeoutError:
                                logger.warning(f"⏰ Timeout ({attempt + 1}/{page_config.max_retries})")
                                if attempt == page_config.max_retries - 1:
                                    raise
                                time.sleep(2 ** attempt)

                        if page_config.wait_selector:
                            page.wait_for_selector(page_config.wait_selector, timeout=page_config.timeout)

                        # Extraire les données
                        data = {"_meta": {}}
                        for key, selector in page_config.selectors.items():
                            try:
                                element = page.locator(selector).first
                                data[key] = element.text_content().strip() if element else None
                            except Exception as e:
                                data[key] = None
                                data["_meta"][f"{key}_error"] = str(e)

                        data["_meta"]["url"] = page.url
                        data["_meta"]["title"] = page.title() if page.title() else None
                        data["_meta"]["timestamp"] = datetime.now().isoformat()
                        data["_meta"]["page_name"] = page_config.name

                        self.results.append(data)
                        logger.info(f"✅ {page_config.name} terminé")

                    except Exception as e:
                        logger.error(f"❌ Erreur lors du scraping de {page_config.name}: {e}")
                    finally:
                        page.close()

                    if i < len(pages) - 1:
                        delay = random.uniform(*self.config.delay_between_pages)
                        logger.info(f"⏳ Attente de {delay:.1f}s...")
                        time.sleep(delay)

            finally:
                context.close()
                browser.close()

        logger.info(f"\n📊 Scraping terminé: {len(self.results)}/{len(pages)} pages réussies")
        return self.results

    def export_results(self) -> None:
        """Exporte les résultats."""
        if not self.results:
            logger.warning("⚠️ Aucun résultat à exporter")
            return

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_path = self.output_dir / f"scraped_data_{timestamp}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        logger.info(f"✅ Export JSON: {json_path}")


def create_sample_pages() -> List[PageConfig]:
    """Crée des exemples de configurations de pages."""
    return [
        PageConfig(
            url="https://example.com",
            name="Example.com",
            selectors={"title": "h1", "description": "p", "link_count": "a"},
            wait_selector="h1"
        ),
        PageConfig(
            url="https://www.wikipedia.org",
            name="Wikipedia",
            selectors={"title": "h1", "subtitle": "p", "links": "a"},
            wait_selector="h1"
        ),
        PageConfig(
            url="https://news.ycombinator.com",
            name="HackerNews",
            selectors={"title": "title", "top_story": ".athing .titleline > a", "story_count": ".athing"},
            wait_selector=".athing"
        )
    ]


def main():
    """Point d'entrée principal."""
    print("=" * 70)
    print("🌐 Scraping multi-pages - Playwright Stealth")
    print("=" * 70)
    print()

    config = ScraperConfig(headless=False, delay_between_pages=(2.0, 4.0))
    pages = create_sample_pages()

    print(f"📋 Pages à scraper: {len(pages)}")
    for i, page in enumerate(pages):
        print(f"   {i+1}. {page.name} - {page.url}")

    print()

    scraper = MultiPageScraper(config)
    scraper.scrape_pages(pages, rotate_profiles=True)
    scraper.export_results()

    print("\n" + "=" * 70)
    print("✅ Scraping multi-pages terminé")
    print("=" * 70)


if __name__ == "__main__":
    main()