/**
 * navigator.platform.js
 * Évasion pour navigator.platform
 * 
 * Définit une valeur réaliste pour navigator.platform
 * afin d'éviter la détection basée sur la plateforme.
 * 
 * Problème ciblé: Les scripts de détection vérifient la plateforme
 * pour identifier les environnements headless.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: navigator.platform dans un vrai navigateur
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que navigator existe
    if (typeof navigator === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] navigator not available, skipping platform');
        }
        return;
    }

    // Vérifier que opts existe, sinon créer un objet par défaut
    const opts = window.__STEALTH_OPTS__ || {};
    
    // =========================================================================
    // 2. DÉTERMINATION DE LA PLATEFORME
    // =========================================================================

    /**
     * Détermine une valeur réaliste pour la plateforme
     * @returns {string} Nom de la plateforme
     */
    function getPlatform() {
        // Si une plateforme est spécifiée dans les options, l'utiliser
        // CORRECTION: navigator_plaftorm -> navigator_platform
        if (opts.navigator_platform) {
            return opts.navigator_platform;
        }

        // Si un OS est spécifié, utiliser une valeur cohérente
        if (opts.os_type) {
            const osMap = {
                'windows': 'Win32',
                'macos': 'MacIntel',
                'linux': 'Linux x86_64'
            };
            if (osMap[opts.os_type]) {
                return osMap[opts.os_type];
            }
        }

        // Détection automatique basée sur l'User-Agent actuel
        if (typeof navigator !== 'undefined' && navigator.userAgent) {
            const ua = navigator.userAgent;
            if (ua.includes('Windows')) return 'Win32';
            if (ua.includes('Macintosh')) return 'MacIntel';
            if (ua.includes('Linux')) return 'Linux x86_64';
        }

        // Valeur par défaut (la plus courante)
        return 'Win32';
    }

    // =========================================================================
    // 3. PATCH DE navigator.platform
    // =========================================================================

    /**
     * Patch la propriété platform sur navigator
     * @param {Object} target - Objet cible (prototype de navigator)
     * @param {string} value - Valeur de la plateforme
     */
    function patchPlatform(target, value) {
        if (!target || typeof target !== 'object') {
            console.warn('[stealth] invalid target for platform patch');
            return;
        }

        try {
            // Utiliser Object.defineProperty avec des descripteurs complets
            Object.defineProperty(target, 'platform', {
                get: function() {
                    return value;
                },
                set: function(newValue) {
                    // platform est en lecture seule
                    return value;
                },
                configurable: true,
                enumerable: true
            });

            // Si un setter existait, le préserver
            const existingDescriptor = Object.getOwnPropertyDescriptor(target, 'platform');
            if (existingDescriptor && typeof existingDescriptor.set === 'function') {
                Object.defineProperty(target, 'platform', {
                    get: function() {
                        return value;
                    },
                    set: existingDescriptor.set,
                    configurable: true,
                    enumerable: true
                });
            }

        } catch (e) {
            console.warn('[stealth] failed to patch platform:', e);
        }
    }

    // =========================================================================
    // 4. APPLICATION DU PATCH
    // =========================================================================

    const platform = getPlatform();
    const target = Object.getPrototypeOf(navigator);

    if (target) {
        patchPlatform(target, platform);
    } else {
        // Fallback: patch navigator directement
        patchPlatform(navigator, platform);
    }

    // =========================================================================
    // 5. COHÉRENCE AVEC USER-AGENT
    // =========================================================================

    /**
     * Assure la cohérence entre navigator.platform et navigator.userAgent
     * Note: Cette fonction est informative, le patch de userAgent est fait ailleurs
     */
    function ensurePlatformConsistency() {
        try {
            const currentPlatform = navigator.platform;
            const ua = navigator.userAgent || '';

            // Vérifier la cohérence
            let consistent = true;
            if (currentPlatform === 'Win32' && !ua.includes('Windows')) {
                consistent = false;
            } else if (currentPlatform === 'MacIntel' && !ua.includes('Macintosh')) {
                consistent = false;
            } else if (currentPlatform === 'Linux x86_64' && !ua.includes('Linux')) {
                consistent = false;
            }

            if (!consistent && typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.warn('[stealth] platform/UA inconsistency detected:', currentPlatform, ua);
            }

        } catch (e) {
            console.debug('[stealth] failed to ensure platform consistency:', e);
        }
    }

    // Exécuter la vérification de cohérence
    ensurePlatformConsistency();

    // =========================================================================
    // 6. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] navigator.platform.js loaded successfully');
        console.log('[stealth] navigator.platform:', navigator.platform);
        console.log('[stealth] opts:', opts);
    }

})();