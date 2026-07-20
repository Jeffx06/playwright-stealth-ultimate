/**
 * navigator.vendor.js
 * Évasion pour navigator.vendor
 * 
 * Définit une valeur réaliste pour navigator.vendor
 * afin d'éviter la détection basée sur le fournisseur du navigateur.
 * 
 * Problème ciblé: Les scripts de détection vérifient le vendor
 * pour identifier l'environnement du navigateur.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: navigator.vendor dans un vrai navigateur
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que navigator existe
    if (typeof navigator === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] navigator not available, skipping vendor');
        }
        return;
    }

    // Vérifier que opts existe, sinon créer un objet par défaut
    const opts = window.__STEALTH_OPTS__ || {};
    
    // =========================================================================
    // 2. DÉTERMINATION DU VENDOR
    // =========================================================================

    /**
     * Détermine la valeur du vendor
     * @returns {string} Nom du vendor
     */
    function getVendor() {
        // Si un vendor est spécifié dans les options, l'utiliser
        if (opts.navigator_vendor) {
            return opts.navigator_vendor;
        }

        // Si un navigateur est spécifié, utiliser une valeur cohérente
        if (opts.browser_vendor) {
            const vendorMap = {
                'chrome': 'Google Inc.',
                'edge': 'Microsoft Corporation',
                'brave': 'Brave Software, Inc.',
                'opera': 'Opera Software ASA',
                'safari': 'Apple Computer, Inc.',
                'firefox': ''
            };
            if (vendorMap[opts.browser_vendor]) {
                return vendorMap[opts.browser_vendor];
            }
        }

        // Détection automatique basée sur l'User-Agent
        if (typeof navigator !== 'undefined' && navigator.userAgent) {
            const ua = navigator.userAgent;
            if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
                return 'Google Inc.';
            }
            if (ua.includes('Edg')) {
                return 'Microsoft Corporation';
            }
            if (ua.includes('OPR') || ua.includes('Opera')) {
                return 'Opera Software ASA';
            }
            if (ua.includes('Safari') && !ua.includes('Chrome')) {
                return 'Apple Computer, Inc.';
            }
            if (ua.includes('Firefox')) {
                return '';
            }
        }

        // Valeur par défaut (la plus courante)
        return 'Google Inc.';
    }

    // =========================================================================
    // 3. PATCH DE navigator.vendor
    // =========================================================================

    /**
     * Patch la propriété vendor sur navigator
     * @param {Object} target - Objet cible (prototype de navigator)
     * @param {string} value - Valeur du vendor
     */
    function patchVendor(target, value) {
        if (!target || typeof target !== 'object') {
            console.warn('[stealth] invalid target for vendor patch');
            return;
        }

        try {
            // Utiliser Object.defineProperty avec des descripteurs complets
            Object.defineProperty(target, 'vendor', {
                get: function() {
                    return value;
                },
                set: function(newValue) {
                    // vendor est en lecture seule
                    return value;
                },
                configurable: true,
                enumerable: true
            });

            // Si un setter existait, le préserver
            const existingDescriptor = Object.getOwnPropertyDescriptor(target, 'vendor');
            if (existingDescriptor && typeof existingDescriptor.set === 'function') {
                Object.defineProperty(target, 'vendor', {
                    get: function() {
                        return value;
                    },
                    set: existingDescriptor.set,
                    configurable: true,
                    enumerable: true
                });
            }

        } catch (e) {
            console.warn('[stealth] failed to patch vendor:', e);
        }
    }

    // =========================================================================
    // 4. APPLICATION DU PATCH
    // =========================================================================

    const vendor = getVendor();
    const target = Object.getPrototypeOf(navigator);

    if (target) {
        patchVendor(target, vendor);
    } else {
        // Fallback: patch navigator directement
        patchVendor(navigator, vendor);
    }

    // =========================================================================
    // 5. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] navigator.vendor.js loaded successfully');
        console.log('[stealth] navigator.vendor:', navigator.vendor);
        console.log('[stealth] opts:', opts);
    }

})();