/**
 * navigator.maxTouchPoints.js
 * Évasion pour navigator.maxTouchPoints
 * 
 * Définit une valeur réaliste pour navigator.maxTouchPoints
 * en fonction de la plateforme pour éviter la détection.
 * 
 * Problème ciblé: Les scripts de détection vérifient les capacités
 * tactiles pour identifier l'environnement.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: navigator.maxTouchPoints dans un vrai navigateur
 *            https://developer.mozilla.org/en-US/docs/Web/API/Navigator/maxTouchPoints
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que navigator existe
    if (typeof navigator === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] navigator not available, skipping maxTouchPoints');
        }
        return;
    }

    // Vérifier que opts existe
    var opts = window.__STEALTH_OPTS__ || {};

    // =========================================================================
    // 2. DÉTERMINATION DE LA VALEUR maxTouchPoints
    // =========================================================================

    /**
     * Détermine la valeur de maxTouchPoints en fonction des options
     * @returns {number} Nombre de points de contact
     */
    function getMaxTouchPoints() {
        // Si une valeur est spécifiée dans les options, l'utiliser
        if (typeof opts.navigator_max_touch_points !== 'undefined') {
            // S'assurer que la valeur est valide (0, 1, 2, 5, 10, 20)
            var validValues = [0, 1, 2, 5, 10, 20];
            if (validValues.indexOf(opts.navigator_max_touch_points) !== -1) {
                return opts.navigator_max_touch_points;
            }
            // Si la valeur n'est pas valide, arrondir à la valeur valide la plus proche
            var closest = validValues.reduce(function(prev, curr) {
                return Math.abs(curr - opts.navigator_max_touch_points) < Math.abs(prev - opts.navigator_max_touch_points) ? curr : prev;
            });
            return closest;
        }

        // Si un profil de toucher est spécifié
        if (opts.touch_profile) {
            var touchProfiles = {
                'none': 0,
                'single': 1,
                'dual': 2,
                'standard': 5,
                'multi': 10,
                'premium': 20
            };
            if (touchProfiles[opts.touch_profile]) {
                return touchProfiles[opts.touch_profile];
            }
        }

        // Détection basée sur la plateforme
        if (opts.os_type) {
            var osMap = {
                'windows': 0,      // Desktop Windows
                'macos': 0,        // Desktop macOS
                'linux': 0,        // Desktop Linux
                'android': 5,      // Android (standard)
                'ios': 5,          // iOS (standard)
                'chromeos': 5      // ChromeOS (standard)
            };
            if (osMap[opts.os_type]) {
                return osMap[opts.os_type];
            }
        }

        // Détection basée sur l'User-Agent
        var ua = navigator.userAgent || '';
        var isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|Windows Phone/i.test(ua);
        var isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);

        if (isTablet) {
            return 5; // Tablets supportent généralement 5 touches
        }
        if (isMobile) {
            return 5; // Smartphones supportent généralement 5 touches
        }

        // Détection basée sur screen (écran tactile)
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            // Si l'écran est tactile, retourner une valeur réaliste
            var currentValue = navigator.maxTouchPoints;
            if (currentValue > 0) {
                return Math.min(currentValue, 10);
            }
            // Vérifier s'il existe un périphérique tactile
            if (window.TouchEvent || window.Touch) {
                return 5;
            }
            return 0;
        }

        // Détection basée sur 'touch' dans matchMedia
        try {
            if (window.matchMedia && window.matchMedia('(any-pointer: coarse)').matches) {
                return 5;
            }
            if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
                return 5;
            }
        } catch (e) {
            // Ignorer les erreurs
        }

        // Valeur par défaut (0 pour desktop)
        return 0;
    }

    // =========================================================================
    // 3. OBTENTION DE LA VALEUR
    // =========================================================================

    var maxTouchPoints = getMaxTouchPoints();

    // =========================================================================
    // 4. PATCH DE navigator.maxTouchPoints
    // =========================================================================

    /**
     * Patch la propriété maxTouchPoints sur navigator
     */
    function patchMaxTouchPoints() {
        try {
            var target = Object.getPrototypeOf(navigator);

            if (!target || typeof target !== 'object') {
                // Fallback: patch navigator directement
                target = navigator;
            }

            // Utiliser Object.defineProperty pour un patch fiable
            Object.defineProperty(target, 'maxTouchPoints', {
                get: function() {
                    return maxTouchPoints;
                },
                set: function(newValue) {
                    // maxTouchPoints est en lecture seule
                    return maxTouchPoints;
                },
                configurable: true,
                enumerable: true
            });

            // S'assurer que navigator a également la propriété
            if (navigator !== target) {
                Object.defineProperty(navigator, 'maxTouchPoints', {
                    get: function() {
                        return maxTouchPoints;
                    },
                    set: function(newValue) {
                        return maxTouchPoints;
                    },
                    configurable: true,
                    enumerable: true
                });
            }

        } catch (e) {
            console.warn('[stealth] patchMaxTouchPoints error:', e);
        }
    }

    // =========================================================================
    // 5. PATCH DE window.TouchEvent
    // =========================================================================

    /**
     * Patch TouchEvent pour les environnements non tactiles
     */
    function patchTouchEvent() {
        try {
            // Si maxTouchPoints est 0, désactiver TouchEvent
            if (maxTouchPoints === 0 && typeof TouchEvent === 'undefined') {
                // Ne pas créer TouchEvent si inexistant (comportement normal)
                return;
            }

            // Si maxTouchPoints est 0, mais TouchEvent existe, le rendre silencieux
            if (maxTouchPoints === 0 && typeof TouchEvent !== 'undefined') {
                Object.defineProperty(window, 'TouchEvent', {
                    get: function() {
                        return undefined;
                    },
                    configurable: true
                });
            }

        } catch (e) {
            console.debug('[stealth] patchTouchEvent error:', e);
        }
    }

    // =========================================================================
    // 6. PATCH DE window.Touch
    // =========================================================================

    /**
     * Patch Touch pour les environnements non tactiles
     */
    function patchTouch() {
        try {
            // Si maxTouchPoints est 0, désactiver Touch
            if (maxTouchPoints === 0 && typeof Touch === 'undefined') {
                return;
            }

            if (maxTouchPoints === 0 && typeof Touch !== 'undefined') {
                Object.defineProperty(window, 'Touch', {
                    get: function() {
                        return undefined;
                    },
                    configurable: true
                });
            }

        } catch (e) {
            console.debug('[stealth] patchTouch error:', e);
        }
    }

    // =========================================================================
    // 7. PATCH DE 'touchstart' EVENT
    // =========================================================================

    /**
     * Patch les événements tactiles pour les environnements non tactiles
     */
    function patchTouchEvents() {
        try {
            if (maxTouchPoints === 0) {
                // Empêcher l'ajout d'écouteurs d'événements tactiles
                var originalAddEventListener = window.addEventListener;
                var originalRemoveEventListener = window.removeEventListener;

                window.addEventListener = function(type, listener, options) {
                    var touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
                    if (touchEvents.indexOf(type) !== -1) {
                        // Simuler l'ajout d'un écouteur sans réellement l'ajouter
                        return;
                    }
                    return originalAddEventListener.call(this, type, listener, options);
                };

                window.removeEventListener = function(type, listener, options) {
                    var touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
                    if (touchEvents.indexOf(type) !== -1) {
                        return;
                    }
                    return originalRemoveEventListener.call(this, type, listener, options);
                };

                if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                    console.log('[stealth] Touch events patched');
                }
            }

        } catch (e) {
            console.debug('[stealth] patchTouchEvents error:', e);
        }
    }

    // =========================================================================
    // 8. PATCH DE matchMedia POUR LE TOUCH
    // =========================================================================

    /**
     * Patch matchMedia pour les requêtes de toucher
     */
    function patchMatchMediaTouch() {
        try {
            if (typeof window.matchMedia === 'undefined') {
                return;
            }

            var originalMatchMedia = window.matchMedia;

            window.matchMedia = function(query) {
                if (typeof query === 'string') {
                    // Intercepter les requêtes de toucher
                    if (query.includes('pointer') || query.includes('any-pointer')) {
                        var isCoarse = query.includes('coarse');
                        var isFine = query.includes('fine');
                        var isNone = query.includes('none');

                        if (maxTouchPoints > 0) {
                            // Mode tactile
                            if (isCoarse) {
                                return { matches: true };
                            }
                            if (isFine) {
                                return { matches: false };
                            }
                            if (isNone) {
                                return { matches: false };
                            }
                        } else {
                            // Mode non tactile
                            if (isCoarse) {
                                return { matches: false };
                            }
                            if (isFine) {
                                return { matches: true };
                            }
                            if (isNone) {
                                return { matches: true };
                            }
                        }

                        // Requêtes de hover
                        if (query.includes('hover')) {
                            if (maxTouchPoints > 0) {
                                // Les appareils tactiles ont hover: none
                                if (query.includes('none')) {
                                    return { matches: true };
                                }
                                if (query.includes('hover')) {
                                    return { matches: false };
                                }
                            } else {
                                // Les appareils non tactiles ont hover: hover
                                if (query.includes('hover')) {
                                    return { matches: true };
                                }
                                if (query.includes('none')) {
                                    return { matches: false };
                                }
                            }
                        }
                    }
                }

                return originalMatchMedia.call(this, query);
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] matchMedia touch patched');
            }

        } catch (e) {
            console.debug('[stealth] patchMatchMediaTouch error:', e);
        }
    }

    // =========================================================================
    // 9. APPLICATION DES PATCHS
    // =========================================================================

    // Appliquer tous les patches
    patchMaxTouchPoints();
    patchTouchEvent();
    patchTouch();
    patchTouchEvents();
    patchMatchMediaTouch();

    // =========================================================================
    // 10. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] navigator.maxTouchPoints.js loaded successfully');
        console.log('[stealth] navigator.maxTouchPoints:', navigator.maxTouchPoints);
        console.log('[stealth] Platform:', opts.os_type || 'auto-detected');
        console.log('[stealth] opts:', opts);
    }

})();