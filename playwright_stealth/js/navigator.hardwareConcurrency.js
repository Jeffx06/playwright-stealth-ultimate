/**
 * navigator.hardwareConcurrency.js
 * Évasion pour navigator.hardwareConcurrency
 * 
 * Définit une valeur réaliste pour navigator.hardwareConcurrency
 * afin d'éviter la détection basée sur le nombre de cœurs CPU.
 * 
 * Problème ciblé: Les scripts de détection vérifient le nombre
 * de cœurs CPU pour identifier les environnements headless.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: navigator.hardwareConcurrency dans un vrai navigateur
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que navigator existe
    if (typeof navigator === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] navigator not available, skipping hardwareConcurrency');
        }
        return;
    }

    // Vérifier que opts existe, sinon créer un objet par défaut
    const opts = window.__STEALTH_OPTS__ || {};
    
    // =========================================================================
    // 2. DÉTERMINATION DE LA VALEUR hardwareConcurrency
    // =========================================================================

    /**
     * Détermine une valeur réaliste pour hardwareConcurrency
     * @returns {number} Nombre de cœurs CPU
     */
    function getHardwareConcurrency() {
        // Si une valeur est spécifiée dans les options, l'utiliser
        if (typeof opts.navigator_hardware_concurrency !== 'undefined') {
            return opts.navigator_hardware_concurrency;
        }

        // Valeurs réalistes pour différents types de machines
        // Basé sur les données de Chrome User-Agent Client Hints
        const REALISTIC_VALUES = [2, 4, 6, 8, 10, 12, 16];

        // Si une seed est disponible, l'utiliser pour un choix déterministe
        if (typeof opts.seed !== 'undefined') {
            const seed = opts.seed;
            const index = seed % REALISTIC_VALUES.length;
            return REALISTIC_VALUES[index];
        }

        // Valeur par défaut: 4 (le plus courant)
        return 4;
    }

    // =========================================================================
    // 3. PATCH DE navigator.hardwareConcurrency
    // =========================================================================

    /**
     * Patch une propriété sur navigator
     * @param {Object} target - Objet cible (prototype de navigator)
     * @param {string} property - Nom de la propriété
     * @param {*} value - Valeur à définir
     */
    function patchNavigatorProperty(target, property, value) {
        if (!target || typeof target !== 'object') {
            console.warn('[stealth] invalid target for property patch');
            return;
        }

        try {
            // Utiliser utils.replaceProperty si disponible
            if (typeof utils !== 'undefined' && typeof utils.replaceProperty === 'function') {
                utils.replaceProperty(target, property, {
                    get: function() {
                        return value;
                    },
                    configurable: true,
                    enumerable: true
                });
                return;
            }

            // Fallback: utiliser Object.defineProperty
            const descriptor = Object.getOwnPropertyDescriptor(target, property);
            Object.defineProperty(target, property, {
                get: function() {
                    return value;
                },
                configurable: true,
                enumerable: true,
                // Préserver le setter original si existant
                set: descriptor ? descriptor.set : undefined
            });

        } catch (e) {
            console.warn('[stealth] failed to patch hardwareConcurrency:', e);
        }
    }

    // =========================================================================
    // 4. APPLICATION DU PATCH
    // =========================================================================

    const value = getHardwareConcurrency();
    const target = Object.getPrototypeOf(navigator);

    if (target) {
        patchNavigatorProperty(target, 'hardwareConcurrency', value);
    } else {
        // Fallback: patch navigator directement
        patchNavigatorProperty(navigator, 'hardwareConcurrency', value);
    }

    // =========================================================================
    // 5. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] navigator.hardwareConcurrency.js loaded successfully');
        console.log('[stealth] navigator.hardwareConcurrency:', value);
        console.log('[stealth] opts:', opts);
    }

})();