/**
 * screen.js
 * Évasion pour les propriétés de l'écran
 * 
 * Patch les propriétés de l'objet screen pour simuler des valeurs
 * réalistes et cohérentes avec la plateforme.
 * 
 * Problème ciblé: Les scripts de détection utilisent les propriétés
 * de l'écran (width, height, colorDepth, etc.) pour le fingerprinting.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: screen dans un vrai navigateur
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que screen existe
    if (typeof screen === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] screen not available, skipping screen.js');
        }
        return;
    }

    // Vérifier que opts existe
    var opts = window.__STEALTH_OPTS__ || {};

    // =========================================================================
    // 2. PROFILS D'ÉCRAN
    // =========================================================================

    /**
     * Profils d'écran réalistes
     */
    var SCREEN_PROFILES = {
        'desktop_1080p': {
            width: 1920,
            height: 1080,
            availWidth: 1920,
            availHeight: 1040,
            colorDepth: 24,
            pixelDepth: 24,
            devicePixelRatio: 1.0
        },
        'desktop_1440p': {
            width: 2560,
            height: 1440,
            availWidth: 2560,
            availHeight: 1400,
            colorDepth: 30,
            pixelDepth: 30,
            devicePixelRatio: 1.25
        },
        'desktop_4k': {
            width: 3840,
            height: 2160,
            availWidth: 3840,
            availHeight: 2120,
            colorDepth: 32,
            pixelDepth: 32,
            devicePixelRatio: 2.0
        },
        'laptop_1366x768': {
            width: 1366,
            height: 768,
            availWidth: 1366,
            availHeight: 728,
            colorDepth: 24,
            pixelDepth: 24,
            devicePixelRatio: 1.0
        },
        'laptop_1920x1080': {
            width: 1920,
            height: 1080,
            availWidth: 1920,
            availHeight: 1040,
            colorDepth: 24,
            pixelDepth: 24,
            devicePixelRatio: 1.0
        },
        'mac_retina': {
            width: 2560,
            height: 1600,
            availWidth: 2560,
            availHeight: 1560,
            colorDepth: 30,
            pixelDepth: 30,
            devicePixelRatio: 2.0
        },
        'mobile_1080p': {
            width: 1080,
            height: 1920,
            availWidth: 1080,
            availHeight: 1880,
            colorDepth: 32,
            pixelDepth: 32,
            devicePixelRatio: 2.5
        }
    };

    /**
     * Sélectionne un profil d'écran en fonction des options
     * @returns {object} Profil d'écran
     */
    function getScreenProfile() {
        // Si un profil est spécifié, l'utiliser
        if (opts.screen_profile && SCREEN_PROFILES[opts.screen_profile]) {
            return SCREEN_PROFILES[opts.screen_profile];
        }

        // Utiliser les valeurs personnalisées si spécifiées
        if (opts.screen_width || opts.screen_height) {
            var profile = {
                width: opts.screen_width || 1920,
                height: opts.screen_height || 1080,
                availWidth: opts.screen_avail_width || (opts.screen_width || 1920),
                availHeight: opts.screen_avail_height || (opts.screen_height || 1080) - 40,
                colorDepth: opts.screen_color_depth || 24,
                pixelDepth: opts.screen_pixel_depth || 24,
                devicePixelRatio: opts.device_pixel_ratio || 1.0
            };
            return profile;
        }

        // Détection basée sur la plateforme
        if (opts.os_type) {
            var osMap = {
                'windows': SCREEN_PROFILES['desktop_1080p'],
                'macos': SCREEN_PROFILES['mac_retina'],
                'linux': SCREEN_PROFILES['desktop_1080p'],
                'android': SCREEN_PROFILES['mobile_1080p'],
                'ios': SCREEN_PROFILES['mobile_1080p']
            };
            if (osMap[opts.os_type]) {
                return osMap[opts.os_type];
            }
        }

        // Détection automatique basée sur le DPI actuel
        var currentDPI = window.devicePixelRatio || 1;
        if (currentDPI >= 2) {
            return SCREEN_PROFILES['mac_retina'];
        }
        if (currentDPI >= 1.25) {
            return SCREEN_PROFILES['desktop_1440p'];
        }
        if (window.screen && window.screen.width >= 2560) {
            return SCREEN_PROFILES['desktop_4k'];
        }

        // Profil par défaut (le plus courant)
        return SCREEN_PROFILES['desktop_1080p'];
    }

    // =========================================================================
    // 3. OBTENTION DU PROFIL
    // =========================================================================

    var profile = getScreenProfile();

    // =========================================================================
    // 4. PATCH DE L'OBJET screen
    // =========================================================================

    /**
     * Patch une propriété sur l'objet screen
     * @param {string} propName - Nom de la propriété
     * @param {*} value - Valeur à définir
     */
    function patchScreenProperty(propName, value) {
        try {
            // Utiliser Object.defineProperty pour un patch fiable
            Object.defineProperty(screen, propName, {
                get: function() {
                    return value;
                },
                set: function(newValue) {
                    // Propriété en lecture seule
                    return value;
                },
                configurable: true,
                enumerable: true
            });
        } catch (e) {
            console.warn('[stealth] patchScreenProperty error for', propName, e);
        }
    }

    // Appliquer les patches
    patchScreenProperty('width', profile.width);
    patchScreenProperty('height', profile.height);
    patchScreenProperty('availWidth', profile.availWidth);
    patchScreenProperty('availHeight', profile.availHeight);
    patchScreenProperty('colorDepth', profile.colorDepth);
    patchScreenProperty('pixelDepth', profile.pixelDepth);

    // =========================================================================
    // 5. PATCH DE window.devicePixelRatio
    // =========================================================================

    /**
     * Patch window.devicePixelRatio pour assurer la cohérence
     */
    function patchDevicePixelRatio() {
        try {
            var dpi = profile.devicePixelRatio || 1.0;

            Object.defineProperty(window, 'devicePixelRatio', {
                get: function() {
                    return dpi;
                },
                set: function(newValue) {
                    // devicePixelRatio est en lecture seule
                    return dpi;
                },
                configurable: true,
                enumerable: true
            });
        } catch (e) {
            console.warn('[stealth] patchDevicePixelRatio error:', e);
        }
    }

    patchDevicePixelRatio();

    // =========================================================================
    // 6. PATCH DE screen.orientation
    // =========================================================================

    /**
     * Patch screen.orientation pour les environnements mobiles
     */
    function patchScreenOrientation() {
        try {
            // Vérifier si screen.orientation existe
            if (typeof screen.orientation === 'undefined') {
                return;
            }

            // Déterminer l'orientation en fonction du profil
            var orientationType = profile.width > profile.height ? 'landscape' : 'portrait';
            var orientationAngle = profile.width > profile.height ? 0 : 90;

            // Patch du type
            Object.defineProperty(screen.orientation, 'type', {
                get: function() {
                    return orientationType + '-primary';
                },
                configurable: true,
                enumerable: true
            });

            // Patch de l'angle
            Object.defineProperty(screen.orientation, 'angle', {
                get: function() {
                    return orientationAngle;
                },
                configurable: true,
                enumerable: true
            });

        } catch (e) {
            console.debug('[stealth] patchScreenOrientation error:', e);
        }
    }

    patchScreenOrientation();

    // =========================================================================
    // 7. PATCH DE matchMedia
    // =========================================================================

    /**
     * Patch window.matchMedia pour assurer la cohérence avec les dimensions de l'écran
     */
    function patchMatchMedia() {
        try {
            if (typeof window.matchMedia === 'undefined') {
                return;
            }

            var originalMatchMedia = window.matchMedia;

            window.matchMedia = function(query) {
                // Intercepter les requêtes de dimension
                if (typeof query === 'string') {
                    // Vérifier les requêtes courantes
                    var width = profile.width;
                    var height = profile.height;
                    var dpi = profile.devicePixelRatio || 1;

                    // Requêtes de largeur
                    if (query.includes('min-width') || query.includes('max-width') ||
                        query.includes('min-device-width') || query.includes('max-device-width')) {
                        // Extraire la valeur de la requête
                        var matches = query.match(/(\d+)/);
                        if (matches) {
                            var value = parseInt(matches[1], 10);
                            var isMin = query.includes('min-');
                            var isMax = query.includes('max-');
                            var isDevice = query.includes('device');

                            var screenWidth = isDevice ? profile.width : window.innerWidth || profile.width;

                            if (isMin) {
                                return { matches: screenWidth >= value };
                            }
                            if (isMax) {
                                return { matches: screenWidth <= value };
                            }
                        }
                    }

                    // Requêtes de hauteur
                    if (query.includes('min-height') || query.includes('max-height') ||
                        query.includes('min-device-height') || query.includes('max-device-height')) {
                        var matches = query.match(/(\d+)/);
                        if (matches) {
                            var value = parseInt(matches[1], 10);
                            var isMin = query.includes('min-');
                            var isMax = query.includes('max-');
                            var isDevice = query.includes('device');

                            var screenHeight = isDevice ? profile.height : window.innerHeight || profile.height;

                            if (isMin) {
                                return { matches: screenHeight >= value };
                            }
                            if (isMax) {
                                return { matches: screenHeight <= value };
                            }
                        }
                    }

                    // Requêtes de DPI
                    if (query.includes('resolution') || query.includes('dpi')) {
                        var matches = query.match(/(\d+)/);
                        if (matches) {
                            var value = parseInt(matches[1], 10);
                            var isMin = query.includes('min-');
                            var isMax = query.includes('max-');

                            if (isMin) {
                                return { matches: dpi >= value };
                            }
                            if (isMax) {
                                return { matches: dpi <= value };
                            }
                        }
                    }
                }

                // Comportement par défaut
                return originalMatchMedia.call(this, query);
            };

        } catch (e) {
            console.debug('[stealth] patchMatchMedia error:', e);
        }
    }

    patchMatchMedia();

    // =========================================================================
    // 8. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] screen.js loaded successfully');
        console.log('[stealth] Screen profile:', profile);
        console.log('[stealth] screen.width:', screen.width);
        console.log('[stealth] screen.height:', screen.height);
        console.log('[stealth] screen.availWidth:', screen.availWidth);
        console.log('[stealth] screen.availHeight:', screen.availHeight);
        console.log('[stealth] screen.colorDepth:', screen.colorDepth);
        console.log('[stealth] screen.pixelDepth:', screen.pixelDepth);
        console.log('[stealth] window.devicePixelRatio:', window.devicePixelRatio);
    }

})();