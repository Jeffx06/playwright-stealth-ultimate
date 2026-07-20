/**
 * window.outerdimensions.js
 * Évasion pour window.outerWidth et window.outerHeight
 * 
 * Simule des dimensions extérieures réalistes en fonction de la plateforme
 * et du navigateur pour éviter la détection.
 * 
 * Problème ciblé: Les scripts de détection vérifient les dimensions
 * extérieures pour identifier les environnements headless.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: window.outerWidth / window.outerHeight dans un vrai navigateur
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que window existe
    if (typeof window === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] window not available, skipping outerdimensions');
        }
        return;
    }

    // =========================================================================
    // 2. DÉTERMINATION DE LA TAILLE DU CADRE
    // =========================================================================

    /**
     * Détermine la taille du cadre de la fenêtre en fonction de l'OS
     * @returns {object} { frameWidth, frameHeight }
     */
    function getFrameSize() {
        // Défauts par OS
        var osFrames = {
            'windows': { width: 16, height: 39 },   // Windows: bordure 8px + title bar 31px
            'macos': { width: 0, height: 44 },      // macOS: pas de bordure, title bar 44px
            'linux': { width: 8, height: 39 }       // Linux: bordure 8px + title bar 31px
        };

        // Détection de l'OS via User-Agent
        var ua = navigator.userAgent || '';
        var os = 'windows';
        if (ua.includes('Macintosh')) {
            os = 'macos';
        } else if (ua.includes('Linux') && !ua.includes('Android')) {
            os = 'linux';
        }

        // Si une option OS est spécifiée, l'utiliser
        var opts = window.__STEALTH_OPTS__ || {};
        if (opts.os_type) {
            var osMap = {
                'windows': 'windows',
                'macos': 'macos',
                'linux': 'linux'
            };
            if (osMap[opts.os_type]) {
                os = osMap[opts.os_type];
            }
        }

        // Récupérer les valeurs du cadre
        var frame = osFrames[os] || osFrames['windows'];

        // Ajustement pour le navigateur (Chrome vs Edge vs Firefox)
        if (ua.includes('Edg')) {
            // Edge utilise le même frame que Chrome
        } else if (ua.includes('Firefox')) {
            // Firefox a un frame légèrement différent
            if (os === 'windows') {
                frame.height = 42;
            } else if (os === 'macos') {
                frame.height = 48;
            }
        }

        // Ajuster en fonction du DPI
        var dpi = window.devicePixelRatio || 1;
        if (dpi > 1.5) {
            // Écrans haute densité (Retina, 4K)
            frame.width = Math.round(frame.width * dpi);
            frame.height = Math.round(frame.height * dpi);
        }

        // Si une valeur personnalisée est spécifiée
        if (opts.outer_frame_width) {
            frame.width = opts.outer_frame_width;
        }
        if (opts.outer_frame_height) {
            frame.height = opts.outer_frame_height;
        }

        return frame;
    }

    // =========================================================================
    // 3. PATCH DE window.outerWidth ET window.outerHeight
    // =========================================================================

    /**
     * Patch les propriétés outerWidth et outerHeight
     */
    function patchOuterDimensions() {
        try {
            var frame = getFrameSize();

            // Sauvegarder les valeurs originales
            var originalOuterWidth = window.outerWidth;
            var originalOuterHeight = window.outerHeight;

            // Patch outerWidth
            Object.defineProperty(window, 'outerWidth', {
                get: function() {
                    return window.innerWidth + frame.width;
                },
                set: function(value) {
                    // outerWidth est en lecture seule, ignorer les tentatives de définition
                    return window.innerWidth + frame.width;
                },
                configurable: true,
                enumerable: true
            });

            // Patch outerHeight
            Object.defineProperty(window, 'outerHeight', {
                get: function() {
                    return window.innerHeight + frame.height;
                },
                set: function(value) {
                    // outerHeight est en lecture seule, ignorer les tentatives de définition
                    return window.innerHeight + frame.height;
                },
                configurable: true,
                enumerable: true
            });

            // Vérification que les valeurs sont cohérentes
            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] window.outerdimensions.js loaded successfully');
                console.log('[stealth] Frame size:', frame);
                console.log('[stealth] window.innerWidth:', window.innerWidth);
                console.log('[stealth] window.innerHeight:', window.innerHeight);
                console.log('[stealth] window.outerWidth (patched):', window.outerWidth);
                console.log('[stealth] window.outerHeight (patched):', window.outerHeight);
            }

        } catch (e) {
            console.warn('[stealth] patchOuterDimensions error:', e);
        }
    }

    // =========================================================================
    // 4. APPLICATION DU PATCH
    // =========================================================================

    patchOuterDimensions();

    // =========================================================================
    // 5. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] window.outerdimensions.js loaded successfully');
    }

})();