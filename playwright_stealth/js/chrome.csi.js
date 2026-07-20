/**
 * chrome.csi.js
 * Évasion pour window.chrome.csi
 * 
 * Simule la fonction chrome.csi() qui retourne des métriques de performance.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: chrome.csi() dans un vrai navigateur Chrome
 * 
 * NOTE: performance.timing est déprécié mais toujours supporté.
 *       Pour Chrome 80+, nous utilisons performance.timeOrigin + performance.now()
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

    // Ne pas redéfinir si déjà présent (signifie qu'on est dans un vrai Chrome)
    if ('csi' in window.chrome) {
        return;
    }

    // Vérifier que performance est disponible
    if (typeof window.performance === 'undefined') {
        console.warn('[stealth] performance not available, chrome.csi.js may not work correctly');
        return;
    }

    // =========================================================================
    // 2. FONCTION DE RÉCUPÉRATION DES MÉTRIQUES
    // =========================================================================

    /**
     * Récupère le temps de navigation start
     * @returns {number} Timestamp en millisecondes
     */
    function getNavigationStart() {
        // Méthode moderne (Chrome 80+)
        if (typeof window.performance.timeOrigin !== 'undefined') {
            return Math.floor(window.performance.timeOrigin);
        }
        // Fallback: performance.timing (déprécié)
        if (window.performance.timing && window.performance.timing.navigationStart) {
            return window.performance.timing.navigationStart;
        }
        // Dernier recours
        return Date.now() - 5000;
    }

    /**
     * Récupère le temps de chargement DOMContentLoaded
     * @returns {number} Timestamp en millisecondes
     */
    function getDomContentLoadedTime() {
        // Méthode moderne (PerformanceObserver)
        // Note: Cette approche est plus complexe, on utilise performance.timing en fallback
        if (window.performance.timing && window.performance.timing.domContentLoadedEventEnd) {
            return window.performance.timing.domContentLoadedEventEnd;
        }
        // Dernier recours
        return getNavigationStart() + 2000;
    }

    /**
     * Récupère le temps écoulé depuis le début de la navigation
     * @param {number} navigationStart - Timestamp de début de navigation
     * @returns {number} Temps écoulé en millisecondes
     */
    function getPageTime(navigationStart) {
        if (typeof window.performance.now === 'function') {
            return Math.floor(window.performance.now());
        }
        return Date.now() - navigationStart;
    }

    // =========================================================================
    // 3. DÉFINITION DE window.chrome.csi
    // =========================================================================

    /**
     * chrome.csi()
     * Retourne des métriques de performance de la page
     * @returns {Object} Métriques de performance
     */
    function chromeCsi() {
        // Si la fonction est appelée avec des arguments, Chrome retourne une erreur
        if (arguments.length > 0) {
            throw new TypeError('Error in invocation of csi()');
        }

        const navigationStart = getNavigationStart();
        const domContentLoaded = getDomContentLoadedTime();
        const pageTime = getPageTime(navigationStart);

        return {
            /**
             * Temps de chargement DOMContentLoaded
             * @type {number}
             */
            onloadT: domContentLoaded,
            
            /**
             * Début de la navigation
             * @type {number}
             */
            startE: navigationStart,
            
            /**
             * Temps écoulé depuis le début de la navigation
             * @type {number}
             */
            pageT: pageTime,
            
            /**
             * Type de transition de page
             * 15 = "transition" / navigation normale
             * @type {number}
             */
            tran: 15
        };
    }

    // Définir la fonction sur window.chrome avec les bons descripteurs
    Object.defineProperty(window.chrome, 'csi', {
        value: chromeCsi,
        writable: false,
        enumerable: true,
        configurable: true
    });

    // =========================================================================
    // 4. PATCH DE toString SUR LA FONCTION
    // =========================================================================

    /**
     * Patch toString sur la fonction pour imiter le comportement natif de Chrome
     */
    function patchToString() {
        try {
            const originalToString = Function.prototype.toString;
            
            // Créer une version personnalisée de toString pour chrome.csi
            Object.defineProperty(window.chrome.csi, 'toString', {
                value: function toString() {
                    // Si la fonction est appelée avec des arguments, Chrome retourne une erreur
                    if (arguments.length > 0) {
                        throw new TypeError('Error in invocation of toString()');
                    }
                    return 'function csi() { [native code] }';
                },
                writable: true,
                enumerable: false,
                configurable: true
            });
        } catch (e) {
            // Fallback: utiliser utils si disponible
            if (typeof utils !== 'undefined' && typeof utils.patchToString === 'function') {
                try {
                    utils.patchToString(window.chrome.csi);
                } catch (utilsError) {
                    console.debug('[stealth] utils.patchToString failed:', utilsError);
                }
            }
        }
    }

    // Exécuter le patch
    patchToString();

    // =========================================================================
    // 5. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] chrome.csi.js loaded successfully');
        console.log('[stealth] window.chrome.csi:', window.chrome.csi);
        console.log('[stealth] chrome.csi() result:', window.chrome.csi());
    }

})();