/**
 * chrome.hairline.js
 * Évasion pour les détections de navigateur headless via Modernizr
 * 
 * Certains scripts de détection (comme Modernizr) utilisent des éléments
 * avec l'ID 'modernizr' pour détecter les navigateurs headless.
 * 
 * Cette évasion patch les propriétés de dimension pour renvoyer des valeurs
 * réalistes et empêcher la détection.
 * 
 * Référence: https://intoli.com/blog/making-chrome-headless-undetectable/
 * 
 * Compatibilité: Chrome 80+
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. CONFIGURATION
    // =========================================================================

    /**
     * IDs d'éléments qui déclenchent le patch
     * Modernizr utilise 'modernizr', mais d'autres détecteurs peuvent utiliser
     * d'autres IDs
     */
    const TARGET_IDS = ['modernizr', 'hairline', 'headless-test'];

    // =========================================================================
    // 2. PATCH DES PROPRIÉTÉS DE DIMENSION
    // =========================================================================

    /**
     * Patche une propriété de dimension sur un prototype
     * @param {Object} target - Prototype cible
     * @param {string} propertyName - Nom de la propriété
     * @param {number} fakeValue - Valeur à retourner pour les éléments cibles
     */
    function patchDimensionProperty(target, propertyName, fakeValue) {
        // Récupérer le descriptor existant
        const descriptor = Object.getOwnPropertyDescriptor(target, propertyName);
        if (!descriptor || typeof descriptor.get !== 'function') {
            return;
        }

        // Sauvegarder le getter original
        const originalGet = descriptor.get;

        // Redéfinir la propriété avec un getter patché
        Object.defineProperty(target, propertyName, {
            configurable: descriptor.configurable !== false,
            enumerable: descriptor.enumerable !== false,
            get: function() {
                // Si l'élément est un élément cible, retourner la valeur fake
                if (this && this.id && TARGET_IDS.includes(this.id)) {
                    return fakeValue;
                }
                // Sinon, retourner la valeur originale
                return originalGet.apply(this);
            }
        });
    }

    // =========================================================================
    // 3. PATCH DE getBoundingClientRect
    // =========================================================================

    /**
     * Patche getBoundingClientRect pour les éléments cibles
     */
    function patchGetBoundingClientRect() {
        const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

        Element.prototype.getBoundingClientRect = function() {
            const rect = originalGetBoundingClientRect.apply(this);

            // Si l'élément est un élément cible, retourner un rectangle avec des dimensions réalistes
            if (this && this.id && TARGET_IDS.includes(this.id)) {
                // Créer un DOMRect avec des dimensions réalistes
                return {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    toJSON: function() {
                        return {
                            x: this.x,
                            y: this.y,
                            width: this.width,
                            height: this.height,
                            top: this.top,
                            right: this.right,
                            bottom: this.bottom,
                            left: this.left
                        };
                    }
                };
            }

            return rect;
        };
    }

    // =========================================================================
    // 4. APPLICATION DES PATCHS
    // =========================================================================

    try {
        // Patch les propriétés de dimension sur HTMLElement (couvre tous les éléments)
        const dimensionProperties = ['offsetHeight', 'offsetWidth', 'clientHeight', 'clientWidth'];

        for (const prop of dimensionProperties) {
            patchDimensionProperty(HTMLElement.prototype, prop, 1);
        }

        // Patch getBoundingClientRect
        patchGetBoundingClientRect();

        // =========================================================================
        // 5. LOG DE DÉBOGAGE
        // =========================================================================

        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.log('[stealth] chrome.hairline.js loaded successfully');
            console.log('[stealth] Patched properties:', dimensionProperties.join(', '));
            console.log('[stealth] Target IDs:', TARGET_IDS.join(', '));
        }

    } catch (e) {
        console.warn('[stealth] chrome.hairline.js error:', e);
    }

})();