#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
from pathlib import Path

# Ajouter le chemin du projet avant toute importation locale
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

"""
Exemple avancé : Simulation comportementale

Ce script démontre comment simuler un comportement humain réaliste
en utilisant le framework Playwright Stealth.

Niveau : Avancé
Temps estimé : 15-20 minutes

Fonctionnalités :
- Mouvement de souris naturel (trajectoire non linéaire)
- Frappe clavier réaliste (délais variables, erreurs)
- Scrolling naturel
- Navigation réaliste
- Gestion des timeouts et des erreurs
- Logs structurés
- Retry automatique sur échec

Compatibilité : Python 3.10+, Playwright 1.40+
"""

import time
import random
import math
import logging
from typing import Tuple, List, Optional, Dict, Any
from dataclasses import dataclass, field
from playwright.sync_api import sync_playwright, Page, TimeoutError
from playwright_stealth import stealth_sync
from playwright_stealth.core.types import HardwareTier, OSType


# =============================================================================
# 0. LOGGING
# =============================================================================

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


# =============================================================================
# 1. CONFIGURATION
# =============================================================================

@dataclass
class BehaviorConfig:
    """Configuration du comportement humain"""
    # Mouvement de souris
    mouse_speed_min: float = 50.0      # px/s
    mouse_speed_max: float = 300.0
    mouse_acceleration: float = 0.2
    mouse_jitter: float = 2.0          # px
    mouse_steps: int = 10              # Nombre d'étapes pour le mouvement

    # Frappe clavier
    key_interval_min: float = 0.05     # s
    key_interval_max: float = 0.25
    key_error_rate: float = 0.02       # 2% d'erreurs

    # Scrolling
    scroll_speed_min: float = 100.0    # px/s
    scroll_speed_max: float = 500.0
    scroll_jitter: float = 5.0

    # Timing
    idle_min: float = 0.5              # s
    idle_max: float = 3.0
    page_load_wait: float = 1.0        # s après chargement
    retry_count: int = 3               # Nombre de tentatives
    retry_delay: float = 2.0           # Délai entre les tentatives

    # Extraction
    max_links: int = 20
    max_paragraphs: int = 10
    sample_text_length: int = 500

    # Debug
    debug: bool = False                # Mode debug (plus de logs)


# Configuration par défaut
DEFAULT_CONFIG = BehaviorConfig()


# =============================================================================
# 2. SIMULATION DE SOURIS
# =============================================================================

def generate_mouse_trajectory(
    start_x: int,
    start_y: int,
    end_x: int,
    end_y: int,
    config: BehaviorConfig = DEFAULT_CONFIG,
    seed: Optional[int] = None
) -> List[Tuple[int, int, float]]:
    """
    Génère une trajectoire de souris réaliste (non linéaire).

    Args:
        start_x: Position X de départ
        start_y: Position Y de départ
        end_x: Position X d'arrivée
        end_y: Position Y d'arrivée
        config: Configuration du comportement
        seed: Seed pour la reproductibilité

    Returns:
        List[Tuple[int, int, float]]: Points de la trajectoire (x, y, vitesse)

    Raises:
        ValueError: Si les coordonnées sont invalides
    """
    if seed is not None:
        random.seed(seed)

    # Valider les coordonnées
    if not all(isinstance(v, (int, float)) for v in [start_x, start_y, end_x, end_y]):
        raise ValueError("Les coordonnées doivent être des nombres")

    # Calculer la distance
    distance = math.hypot(end_x - start_x, end_y - start_y)

    # Si la distance est nulle, retourner un point unique
    if distance < 1:
        return [(start_x, start_y, 0.0)]

    # Déterminer la vitesse
    speed = random.uniform(config.mouse_speed_min, config.mouse_speed_max)
    total_time = distance / speed
    num_points = max(config.mouse_steps, int(total_time * 60))  # 60 FPS

    points = []
    x, y = start_x, start_y
    vx, vy = 0.0, 0.0

    for i in range(num_points):
        t = i / num_points

        # Courbe smoothstep pour un mouvement naturel
        smooth = t * t * (3 - 2 * t)
        target_x = start_x + (end_x - start_x) * smooth
        target_y = start_y + (end_y - start_y) * smooth

        # Accélération vers la cible
        dx = target_x - x
        dy = target_y - y
        vx += dx * config.mouse_acceleration * 0.02
        vy += dy * config.mouse_acceleration * 0.02

        # Friction
        vx *= 0.92
        vy *= 0.92

        x += vx
        y += vy

        # Jitter (bruit)
        x += random.gauss(0, config.mouse_jitter * 0.3)
        y += random.gauss(0, config.mouse_jitter * 0.3)

        speed_mag = math.hypot(vx, vy)
        points.append((int(x), int(y), speed_mag))

    return points


def simulate_mouse_movement(
    page: Page,
    start: Tuple[int, int],
    end: Tuple[int, int],
    config: BehaviorConfig = DEFAULT_CONFIG,
    seed: Optional[int] = None
) -> None:
    """
    Simule un mouvement de souris réaliste sur une page Playwright.

    Args:
        page: Page Playwright
        start: Point de départ (x, y)
        end: Point d'arrivée (x, y)
        config: Configuration du comportement
        seed: Seed pour la reproductibilité

    Raises:
        ValueError: Si les points de départ ou d'arrivée sont invalides
    """
    if not start or not end or len(start) != 2 or len(end) != 2:
        raise ValueError("Les points de départ et d'arrivée doivent être des tuples (x, y)")

    # Vérifier que les points sont dans la fenêtre
    viewport = page.viewport_size
    if viewport:
        width, height = viewport.get('width', 1920), viewport.get('height', 1080)
        if start[0] < 0 or start[0] > width or start[1] < 0 or start[1] > height:
            logger.warning(f"Point de départ hors fenêtre: {start}")
        if end[0] < 0 or end[0] > width or end[1] < 0 or end[1] > height:
            logger.warning(f"Point d'arrivée hors fenêtre: {end}")

    # Générer la trajectoire
    trajectory = generate_mouse_trajectory(
        start[0], start[1], end[0], end[1], config, seed
    )

    if config.debug:
        logger.debug(f"Trajectoire générée: {len(trajectory)} points")

    # Exécuter la trajectoire avec page.mouse.move pour plus d'efficacité
    # et de réalisme (Playwright gère les événements de souris)
    for x, y, speed in trajectory:
        page.mouse.move(x, y, steps=1)
        # Délai basé sur la vitesse (plus la souris est rapide, moins de délai)
        delay = max(0.001, 1.0 / (speed + 10) * 0.02)
        time.sleep(min(delay, 0.05))


# =============================================================================
# 3. SIMULATION DE CLAVIER
# =============================================================================

def simulate_typing(
    page: Page,
    text: str,
    config: BehaviorConfig = DEFAULT_CONFIG,
    seed: Optional[int] = None
) -> None:
    """
    Simule une frappe clavier réaliste avec délais variables.

    Args:
        page: Page Playwright
        text: Texte à taper
        config: Configuration du comportement
        seed: Seed pour la reproductibilité

    Raises:
        ValueError: Si le texte est vide
    """
    if not text:
        raise ValueError("Le texte à taper ne peut pas être vide")

    if seed is not None:
        random.seed(seed)

    # Logging du début de la frappe
    if config.debug:
        logger.debug(f"Début de la frappe: {len(text)} caractères")

    for i, char in enumerate(text):
        # Délai variable
        interval = random.uniform(config.key_interval_min, config.key_interval_max)
        # Variation supplémentaire
        interval += random.gauss(0, 0.01)
        interval = max(0.01, interval)

        # Pause après les mots
        if char == ' ':
            interval *= 1.5

        # Pause après la ponctuation
        if char in '.!?;':
            interval *= 2.0

        # Simuler une erreur de frappe (rare)
        if random.random() < config.key_error_rate:
            # Taper une mauvaise touche puis la corriger
            wrong_char = chr(ord(char) + random.randint(-2, 2))
            if wrong_char.isprintable() and wrong_char != char and wrong_char != ' ':
                page.keyboard.type(wrong_char, delay=interval)
                time.sleep(0.05)
                page.keyboard.press('Backspace')
                time.sleep(0.05)
                if config.debug:
                    logger.debug(f"Erreur de frappe corrigée: '{wrong_char}' -> '{char}'")

        # Taper le caractère correct
        page.keyboard.type(char, delay=interval)
        time.sleep(interval * 0.3)  # Réduire le temps d'attente

    if config.debug:
        logger.debug("Fin de la frappe")


# =============================================================================
# 4. SIMULATION DE SCROLL
# =============================================================================

def simulate_scroll(
    page: Page,
    scroll_distance: int,
    config: BehaviorConfig = DEFAULT_CONFIG,
    seed: Optional[int] = None
) -> None:
    """
    Simule un scrolling naturel.

    Args:
        page: Page Playwright
        scroll_distance: Distance à scroller (px, négatif = vers le haut)
        config: Configuration du comportement
        seed: Seed pour la reproductibilité

    Note:
        Si la page n'est pas assez longue, le scroll sera limité.
    """
    if scroll_distance == 0:
        return

    if seed is not None:
        random.seed(seed)

    # Récupérer la hauteur de la page
    page_height = page.evaluate("() => document.body.scrollHeight")
    window_height = page.viewport_size.get('height', 800) if page.viewport_size else 800

    # Limiter le scroll à la hauteur de la page
    max_scroll = page_height - window_height
    if max_scroll <= 0:
        logger.warning("Page trop courte pour scroller")
        return

    # Ajuster la distance de scroll
    actual_distance = min(abs(scroll_distance), max_scroll)
    if scroll_distance < 0:
        actual_distance = -actual_distance

    # Nombre d'étapes
    steps = max(5, int(abs(actual_distance) / 50))
    speed = random.uniform(config.scroll_speed_min, config.scroll_speed_max)
    total_time = abs(actual_distance) / speed

    if config.debug:
        logger.debug(f"Scroll: {actual_distance}px en {steps} étapes")

    # Scroller progressivement
    current_scroll = 0
    for i in range(steps):
        t = i / steps
        # Courbe d'accélération/décélération
        smooth = t * t * (3 - 2 * t)
        target_scroll = smooth * actual_distance
        delta_scroll = target_scroll - current_scroll
        current_scroll = target_scroll

        # Jitter
        delta_scroll += random.gauss(0, config.scroll_jitter)

        if delta_scroll != 0:
            page.mouse.wheel(0, delta_scroll)
            time.sleep(total_time / steps * random.uniform(0.8, 1.2))

    # Scroll final précis
    remaining = actual_distance - current_scroll
    if abs(remaining) > 1:
        page.mouse.wheel(0, remaining)


# =============================================================================
# 5. NAVIGATION RÉALISTE
# =============================================================================

def navigate_to_url(
    page: Page,
    url: str,
    config: BehaviorConfig = DEFAULT_CONFIG,
    wait_after_load: Optional[float] = None
) -> bool:
    """
    Navigue vers une URL avec un comportement réaliste.

    Args:
        page: Page Playwright
        url: URL à visiter
        config: Configuration du comportement
        wait_after_load: Temps d'attente après le chargement

    Returns:
        bool: True si la navigation a réussi

    Raises:
        ValueError: Si l'URL est invalide
    """
    if not url or not url.startswith(('http://', 'https://')):
        raise ValueError(f"URL invalide: {url}")

    wait_after_load = wait_after_load or config.page_load_wait

    for attempt in range(config.retry_count):
        try:
            logger.info(f"Navigation vers {url} (tentative {attempt + 1}/{config.retry_count})")

            # Naviguer
            page.goto(url, wait_until="domcontentloaded")
            page.wait_for_load_state("networkidle", timeout=30000)

            # Attendre un peu (comportement humain)
            wait_time = random.uniform(0.5, wait_after_load)
            time.sleep(wait_time)

            logger.info(f"✅ Navigation réussie vers {url}")
            return True

        except TimeoutError:
            logger.warning(f"⏰ Timeout lors de la navigation vers {url} (tentative {attempt + 1})")
            if attempt < config.retry_count - 1:
                time.sleep(config.retry_delay * (attempt + 1))
            continue

        except Exception as e:
            logger.error(f"❌ Erreur lors de la navigation vers {url}: {e}")
            if attempt < config.retry_count - 1:
                time.sleep(config.retry_delay)
            continue

    logger.error(f"❌ Échec de la navigation vers {url} après {config.retry_count} tentatives")
    return False


# =============================================================================
# 6. EXTRACTION DE DONNÉES
# =============================================================================

def extract_page_data(page: Page, config: BehaviorConfig = DEFAULT_CONFIG) -> Dict[str, Any]:
    """
    Extrait les données d'une page Playwright.

    Args:
        page: Page Playwright
        config: Configuration du comportement

    Returns:
        Dict[str, Any]: Données extraites
    """
    data = page.evaluate("""
        (args) => {
            const maxLinks = args.maxLinks;
            const maxParagraphs = args.maxParagraphs;
            const sampleLength = args.sampleLength;

            const title = document.title || '';
            const h1 = document.querySelector('h1')?.textContent || '';
            const meta_desc = document.querySelector('meta[name="description"]')?.content || '';

            const links = Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => href && href.startsWith('http'))
                .slice(0, maxLinks);

            const paragraphs = Array.from(document.querySelectorAll('p'))
                .map(p => p.textContent)
                .filter(text => text && text.trim().length > 10)
                .slice(0, maxParagraphs);

            const sampleText = paragraphs.slice(0, 3).join(' ');
            const truncatedSample = sampleText.length > sampleLength
                ? sampleText.substring(0, sampleLength) + '...'
                : sampleText;

            return {
                title: title,
                h1: h1,
                description: meta_desc,
                links: links,
                links_count: links.length,
                paragraphs: paragraphs,
                paragraphs_count: paragraphs.length,
                sample_text: truncatedSample,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
        }
    """, {
        'maxLinks': config.max_links,
        'maxParagraphs': config.max_paragraphs,
        'sampleLength': config.sample_text_length
    })

    return data


# =============================================================================
# 7. SCRAPING COMPLET AVEC COMPORTEMENT
# =============================================================================

def scrape_with_behavior(
    url: str,
    config: BehaviorConfig = DEFAULT_CONFIG,
    headless: bool = False,
    seed: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    """
    Effectue un scraping complet avec simulation comportementale.

    Args:
        url: URL à scraper
        config: Configuration du comportement
        headless: Mode headless
        seed: Seed pour la reproductibilité

    Returns:
        Optional[Dict[str, Any]]: Données extraites ou None

    Raises:
        ValueError: Si l'URL est invalide
    """
    if not url or not url.startswith(('http://', 'https://')):
        raise ValueError(f"URL invalide: {url}")

    if seed is not None:
        random.seed(seed)

    with sync_playwright() as p:
        # Lancer le navigateur
        browser = p.chromium.launch(headless=headless)

        # Créer un contexte avec des dimensions réalistes
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            locale='fr-FR',
            timezone_id='Europe/Paris'
        )
        page = context.new_page()

        try:
            # Appliquer le stealth
            success = stealth_sync(
                page,
                hardware_tier=HardwareTier.HIGH,
                os_type=OSType.WINDOWS,
                custom_seed=str(seed) if seed else None
            )

            if not success:
                logger.error("❌ Échec de l'injection stealth")
                return None

            logger.info("🛡️ Stealth activé")

            # 1. Naviguer vers la page
            if not navigate_to_url(page, url, config):
                return None

            # 2. Comportement aléatoire avant interaction
            idle_time = random.uniform(config.idle_min, config.idle_max)
            time.sleep(idle_time)

            # 3. Simuler un scroll de découverte
            viewport_height = page.viewport_size.get('height', 800) if page.viewport_size else 800
            scroll_distance = viewport_height * random.uniform(0.3, 1.5)
            simulate_scroll(page, int(scroll_distance), config)
            logger.info("🔄 Scroll simulé")

            # 4. Simuler un mouvement de souris vers un élément aléatoire
            viewport_size = page.viewport_size
            if viewport_size:
                width, height = viewport_size.get('width', 1920), viewport_size.get('height', 1080)
                # Point de départ aléatoire
                start = (
                    random.randint(100, width - 100),
                    random.randint(100, height - 100)
                )
                # Point d'arrivée aléatoire
                end = (
                    random.randint(100, width - 100),
                    random.randint(100, height - 100)
                )
                simulate_mouse_movement(page, start, end, config)
                logger.info("🖱️ Mouvement de souris simulé")

            # 5. Simuler une lecture de la page
            reading_time = random.uniform(1.0, 3.0)
            time.sleep(reading_time)

            # 6. Extraire les données
            logger.info("📊 Extraction des données...")
            data = extract_page_data(page, config)

            logger.info(f"✅ Extraction terminée")
            logger.info(f"   - Titre: {data['title'][:50] if data['title'] else 'N/A'}...")
            logger.info(f"   - Liens: {data['links_count']}")
            logger.info(f"   - Paragraphes: {data['paragraphs_count']}")

            # 7. Comportement de fin
            time.sleep(random.uniform(0.5, 1.5))

            return data

        except Exception as e:
            logger.error(f"❌ Erreur lors du scraping: {e}")
            return None

        finally:
            browser.close()


# =============================================================================
# 8. EXEMPLE D'UTILISATION
# =============================================================================

def main():
    """Point d'entrée principal."""
    print("=" * 60)
    print("🎯 Simulation comportementale - Playwright Stealth")
    print("=" * 60)
    print()

    # Configuration personnalisée
    config = BehaviorConfig(
        mouse_speed_min=80.0,
        mouse_speed_max=400.0,
        mouse_jitter=3.0,
        key_interval_min=0.08,
        key_interval_max=0.3,
        key_error_rate=0.01,
        scroll_speed_min=150.0,
        scroll_speed_max=600.0,
        idle_min=1.0,
        idle_max=4.0,
        debug=True
    )

    # URLs de test
    urls = [
        "https://www.wikipedia.org",
        "https://news.ycombinator.com",
        "https://github.com"
    ]

    results = []
    seed = 42

    for i, url in enumerate(urls):
        logger.info(f"\n📄 Scraping de {url}")
        print("-" * 40)

        data = scrape_with_behavior(
            url=url,
            config=config,
            headless=False,
            seed=seed + i
        )

        if data:
            results.append(data)
            logger.info(f"✅ Données extraites avec succès")
        else:
            logger.error(f"❌ Échec du scraping de {url}")

        # Attendre entre les requêtes
        if i < len(urls) - 1:
            wait_time = random.uniform(2, 5)
            logger.info(f"⏳ Attente de {wait_time:.1f}s...")
            time.sleep(wait_time)

    # Résumé
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ")
    print("=" * 60)
    print(f"Pages scrapées: {len(results)}/{len(urls)}")

    for i, data in enumerate(results):
        title = data.get('title', 'N/A')[:50]
        print(f"\n  {i+1}. {title}...")
        print(f"     URL: {data.get('url', 'N/A')}")
        print(f"     Liens: {data.get('links_count', 0)}")
        print(f"     Paragraphes: {data.get('paragraphs_count', 0)}")

    return results


if __name__ == "__main__":
    main()