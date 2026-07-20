/**
 * chrome.load.times.js
 * Évasion pour window.chrome.loadTimes()
 * 
 * Simule la fonction chrome.loadTimes() qui retourne des métriques
 * de chargement de la page et des informations de protocole réseau.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: chrome.loadTimes() dans un vrai navigateur Chrome
 * 
 * NOTE: loadTimes() est déprécié dans Chrome 80+, mais encore utilisé
 *       par certains scripts de détection.
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que window.chrome existe
    if (!window.chrome) {
        Object.defineProperty(window, 'chrome', {
            writable: true,
            enumerable: true,
            configurable: false,
            value: {}
        });
    }

    // Si loadTimes existe déjà, ne pas le redéfinir
    if ('loadTimes' in window.chrome) {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.log('[stealth] chrome.loadTimes.js: loadTimes already exists, skipping');
        }
        return;
    }

    // Vérifier que performance est disponible
    if (typeof window.performance === 'undefined') {
        console.warn('[stealth] performance not available, chrome.loadTimes.js may not work correctly');
        return;
    }

    // =========================================================================
    // 2. FALLBACKS ET HELPERS
    // =========================================================================

    /**
     * Fallback pour les entrées de navigation (about:blank)
     */
    const NT_ENTRY_FALLBACK = {
        nextHopProtocol: 'h2',
        type: 'other'
    };

    /**
     * Récupère l'entrée de navigation depuis Performance API
     * @returns {PerformanceNavigationTiming|Object} Entrée de navigation
     */
    function getNavigationEntry() {
        if (typeof window.performance.getEntriesByType === 'function') {
            const entries = window.performance.getEntriesByType('navigation');
            if (entries && entries.length > 0) {
                return entries[0];
            }
        }
        return NT_ENTRY_FALLBACK;
    }

    /**
     * Récupère le temps de first paint
     * @returns {number} Temps en millisecondes
     */
    function getFirstPaintTime() {
        if (typeof window.performance.getEntriesByType === 'function') {
            const paintEntries = window.performance.getEntriesByType('paint');
            if (paintEntries && paintEntries.length > 0) {
                // Chercher 'first-paint' ou 'first-contentful-paint'
                for (const entry of paintEntries) {
                    if (entry.name === 'first-paint' || entry.name === 'first-contentful-paint') {
                        return entry.startTime;
                    }
                }
                // Fallback: utiliser la première entrée
                return paintEntries[0].startTime;
            }
        }
        // Fallback: utiliser loadEventEnd
        if (window.performance.timing && window.performance.timing.loadEventEnd) {
            return window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        }
        return 0;
    }

    /**
     * Récupère le timeOrigin de manière compatible
     * @returns {number} Time origin en millisecondes
     */
    function getTimeOrigin() {
        if (typeof window.performance.timeOrigin !== 'undefined') {
            return window.performance.timeOrigin;
        }
        if (window.performance.timing && window.performance.timing.navigationStart) {
            return window.performance.timing.navigationStart;
        }
        return Date.now() - 5000;
    }

    /**
     * Formate un nombre avec une précision fixe
     * @param {number} num - Nombre à formater
     * @param {number} fixed - Nombre de décimales
     * @returns {string} Nombre formaté
     */
    function toFixed(num, fixed) {
        if (typeof num !== 'number' || isNaN(num)) {
            return '0';
        }
        return num.toFixed(fixed);
    }

    // =========================================================================
    // 3. PROTOCOL INFO
    // =========================================================================

    const protocolInfo = {
        /**
         * Informations de connexion (protocole)
         * @returns {string} Protocole utilisé
         */
        get connectionInfo() {
            const ntEntry = getNavigationEntry();
            return ntEntry.nextHopProtocol || 'h2';
        },

        /**
         * Protocole négocié via NPN (déprécié)
         * @returns {string} Protocole ou 'unknown'
         */
        get npnNegotiatedProtocol() {
            const ntEntry = getNavigationEntry();
            const protocol = ntEntry.nextHopProtocol || '';
            return ['h2', 'hq'].includes(protocol) ? protocol : 'unknown';
        },

        /**
         * Type de navigation
         * @returns {string} Type de navigation
         */
        get navigationType() {
            const ntEntry = getNavigationEntry();
            return ntEntry.type || 'other';
        },

        /**
         * Alternate-Protocol disponible (déprécié, toujours false)
         * @returns {boolean} Toujours false
         */
        get wasAlternateProtocolAvailable() {
            return false;
        },

        /**
         * SPDY utilisé (déprécié, toujours false)
         * @returns {boolean} Toujours false
         */
        get wasFetchedViaSpdy() {
            return false;
        },

        /**
         * NPN négocié (déprécié, toujours false)
         * @returns {boolean} Toujours false
         */
        get wasNpnNegotiated() {
            return false;
        }
    };

    // =========================================================================
    // 4. TIMING INFO
    // =========================================================================

    const timingInfo = {
        /**
         * First paint après le chargement (toujours 0)
         * @returns {number} Toujours 0
         */
        get firstPaintAfterLoadTime() {
            return 0;
        },

        /**
         * Temps de la requête (navigationStart en secondes)
         * @returns {string} Temps en secondes
         */
        get requestTime() {
            const timeOrigin = getTimeOrigin();
            return toFixed(timeOrigin / 1000, 3);
        },

        /**
         * Temps de début de chargement (navigationStart en secondes)
         * @returns {string} Temps en secondes
         */
        get startLoadTime() {
            const timeOrigin = getTimeOrigin();
            return toFixed(timeOrigin / 1000, 3);
        },

        /**
         * Temps de commit (responseStart en secondes)
         * @returns {string} Temps en secondes
         */
        get commitLoadTime() {
            const timeOrigin = getTimeOrigin();
            if (window.performance.timing && window.performance.timing.responseStart) {
                return toFixed(window.performance.timing.responseStart / 1000, 3);
            }
            return toFixed((timeOrigin + 1000) / 1000, 3);
        },

        /**
         * Temps de fin de chargement du document (domContentLoadedEventEnd en secondes)
         * @returns {string} Temps en secondes
         */
        get finishDocumentLoadTime() {
            const timeOrigin = getTimeOrigin();
            if (window.performance.timing && window.performance.timing.domContentLoadedEventEnd) {
                return toFixed(window.performance.timing.domContentLoadedEventEnd / 1000, 3);
            }
            return toFixed((timeOrigin + 2000) / 1000, 3);
        },

        /**
         * Temps de fin de chargement (loadEventEnd en secondes)
         * @returns {string} Temps en secondes
         */
        get finishLoadTime() {
            const timeOrigin = getTimeOrigin();
            if (window.performance.timing && window.performance.timing.loadEventEnd) {
                return toFixed(window.performance.timing.loadEventEnd / 1000, 3);
            }
            return toFixed((timeOrigin + 3000) / 1000, 3);
        },

        /**
         * Temps de first paint (en secondes)
         * @returns {string} Temps en secondes
         */
        get firstPaintTime() {
            const timeOrigin = getTimeOrigin();
            const firstPaintMs = getFirstPaintTime();
            return toFixed((timeOrigin + firstPaintMs) / 1000, 3);
        }
    };

    // =========================================================================
    // 5. DÉFINITION DE window.chrome.loadTimes
    // =========================================================================

    /**
     * chrome.loadTimes()
     * Retourne des métriques de chargement et des informations de protocole
     * @returns {Object} Métriques de chargement
     */
    function chromeLoadTimes() {
        return {
            ...protocolInfo,
            ...timingInfo
        };
    }

    // Définir la fonction sur window.chrome
    Object.defineProperty(window.chrome, 'loadTimes', {
        value: chromeLoadTimes,
        writable: false,
        enumerable: true,
        configurable: true
    });

    // =========================================================================
    // 6. PATCH DE toString SUR LA FONCTION
    // =========================================================================

    /**
     * Patch toString sur la fonction pour imiter le comportement natif de Chrome
     */
    function patchToString() {
        try {
            Object.defineProperty(window.chrome.loadTimes, 'toString', {
                value: function toString() {
                    if (arguments.length > 0) {
                        throw new TypeError('Error in invocation of toString()');
                    }
                    return 'function loadTimes() { [native code] }';
                },
                writable: true,
                enumerable: false,
                configurable: true
            });
        } catch (e) {
            // Fallback: utiliser utils si disponible
            if (typeof utils !== 'undefined' && typeof utils.patchToString === 'function') {
                try {
                    utils.patchToString(window.chrome.loadTimes);
                } catch (utilsError) {
                    console.debug('[stealth] utils.patchToString failed:', utilsError);
                }
            }
        }
    }

    // Exécuter le patch
    patchToString();

    // =========================================================================
    // 7. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] chrome.load.times.js loaded successfully');
        console.log('[stealth] window.chrome.loadTimes:', window.chrome.loadTimes);
        console.log('[stealth] chrome.loadTimes() result:', window.chrome.loadTimes());
    }

})();