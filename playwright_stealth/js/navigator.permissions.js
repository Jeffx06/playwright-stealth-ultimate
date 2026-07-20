/**
 * navigator.permissions.js
 * Évasion pour navigator.permissions.query()
 * 
 * Intercepte les appels à navigator.permissions.query() pour retourner
 * des états réalistes pour les différentes permissions.
 * 
 * Problème ciblé: Les scripts de détection vérifient les permissions
 * pour identifier les environnements headless.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: navigator.permissions.query() dans un vrai navigateur
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que navigator.permissions existe
    if (!navigator.permissions || typeof navigator.permissions.query !== 'function') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] navigator.permissions.query not available, skipping');
        }
        return;
    }

    // Vérifier que utils est disponible
    const hasUtils = typeof utils !== 'undefined';
    
    // =========================================================================
    // 2. FONCTIONS DE FALLBACK
    // =========================================================================

    /**
     * Fallback pour Reflect.apply
     */
    function reflectApplyFallback(target, thisArg, args) {
        try {
            return Reflect.apply(target, thisArg, args);
        } catch (e) {
            return target.apply(thisArg, args);
        }
    }

    /**
     * Fallback pour replaceWithProxy
     */
    function replaceWithProxyFallback(target, property, handler) {
        try {
            const original = target[property];
            const proxy = new Proxy(original, handler);
            Object.defineProperty(target, property, {
                value: proxy,
                writable: true,
                enumerable: true,
                configurable: true
            });
            return proxy;
        } catch (e) {
            console.warn('[stealth] replaceWithProxy fallback failed:', e);
            return target[property];
        }
    }

    // Sélectionner les méthodes appropriées
    const reflectApplyFn = (hasUtils && utils.cache && typeof utils.cache.Reflect !== 'undefined' && typeof utils.cache.Reflect.apply === 'function')
        ? utils.cache.Reflect.apply
        : reflectApplyFallback;

    const replaceWithProxyFn = (hasUtils && typeof utils.replaceWithProxy === 'function')
        ? utils.replaceWithProxy
        : replaceWithProxyFallback;

    // =========================================================================
    // 3. MAP DES PERMISSIONS
    // =========================================================================

    /**
     * États réalistes pour les permissions
     * Basé sur le comportement d'un vrai navigateur Chrome
     */
    const PERMISSION_STATES = {
        // Permissions qui sont généralement en 'prompt' par défaut
        'geolocation': 'prompt',
        'notifications': 'default',
        'camera': 'prompt',
        'microphone': 'prompt',
        'midi': 'prompt',
        'clipboard-read': 'prompt',
        'clipboard-write': 'granted',
        'display-capture': 'prompt',
        'persistent-storage': 'granted',
        'push': 'prompt',
        'speaker': 'prompt',
        'device-info': 'granted',
        'background-sync': 'granted',
        'bluetooth': 'prompt',
        'nfc': 'prompt',
        'storage-access': 'prompt',
        'window-management': 'prompt',
        'local-fonts': 'prompt',
        'idle-detection': 'prompt',
        'periodic-background-sync': 'granted',
        'screen-wake-lock': 'granted',
        'system-wake-lock': 'granted'
    };

    // =========================================================================
    // 4. CRÉATION D'UN OBJET PERMISSION STATUS
    // =========================================================================

    /**
     * Crée un objet PermissionStatus réaliste
     * @param {string} state - État de la permission ('prompt', 'granted', 'denied', 'default')
     * @param {string} name - Nom de la permission
     * @returns {Object} Objet PermissionStatus
     */
    function createPermissionStatus(state, name) {
        // Obtenir le prototype de PermissionStatus si disponible
        let proto = null;
        try {
            if (typeof PermissionStatus !== 'undefined') {
                proto = PermissionStatus.prototype;
            }
        } catch (e) {
            // Ignorer
        }

        // Créer l'objet
        const result = {
            state: state,
            name: name,
            onchange: null,
            // Méthodes
            addEventListener: function(type, listener) {
                if (type === 'change') {
                    // Simuler un écouteur d'événement
                }
            },
            removeEventListener: function(type, listener) {
                // Simuler la suppression d'écouteur
            },
            dispatchEvent: function(event) {
                // Simuler la distribution d'événement
                return true;
            },
            // toString pour imiter le comportement natif
            toString: function() {
                return '[object PermissionStatus]';
            }
        };

        // Définir le prototype si disponible
        if (proto) {
            Object.setPrototypeOf(result, proto);
        }

        // Rendre les propriétés non configurables (comme dans Chrome)
        Object.defineProperty(result, 'state', {
            value: state,
            writable: false,
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(result, 'name', {
            value: name,
            writable: false,
            enumerable: true,
            configurable: false
        });

        return result;
    }

    // =========================================================================
    // 5. INTERCEPTEUR PERMISSIONS
    // =========================================================================

    /**
     * Handler Proxy pour navigator.permissions.query
     */
    const permissionsHandler = {
        /**
         * Intercepte les appels à query
         */
        apply: function(target, ctx, args) {
            const param = (args && args.length > 0) ? args[0] : null;

            // Vérifier si c'est une demande de permission
            if (param && param.name) {
                const permissionName = param.name;
                const state = PERMISSION_STATES[permissionName] || 'prompt';

                // Créer un objet PermissionStatus réaliste
                const result = createPermissionStatus(state, permissionName);
                return Promise.resolve(result);
            }

            // Comportement par défaut
            try {
                return reflectApplyFn(target, ctx, args);
            } catch (e) {
                // Fallback: retourner une Promise avec une permission par défaut
                const result = createPermissionStatus('prompt', 'unknown');
                return Promise.resolve(result);
            }
        }
    };

    // =========================================================================
    // 6. APPLICATION DU PATCH
    // =========================================================================

    try {
        // Obtenir le prototype de navigator.permissions
        const target = Object.getPrototypeOf(navigator.permissions);

        if (target && typeof target.query === 'function') {
            // Appliquer le proxy
            replaceWithProxyFn(target, 'query', permissionsHandler);

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] navigator.permissions.js loaded successfully');
                console.log('[stealth] navigator.permissions.query patched');
                console.log('[stealth] PERMISSION_STATES:', Object.keys(PERMISSION_STATES).length + ' permissions');
            }
        } else {
            console.warn('[stealth] navigator.permissions.query not patchable');
        }

    } catch (e) {
        console.warn('[stealth] navigator.permissions.js error:', e);
    }

})();