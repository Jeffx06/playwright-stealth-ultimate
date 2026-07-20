/**
 * evasions.proxies.js
 * Framework de Proxys indétectables pour les évasions
 * 
 * Fournit un framework de Proxy qui imite parfaitement les propriétés,
 * prototypes et constructeurs natifs pour passer les tests de détection.
 * 
 * Problème ciblé: Les scripts de détection vérifient les Proxys
 * et les modifications de fonctions natives.
 * 
 * Compatibilité: Chrome 80+
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. STOCKAGE INTERNE
    // =========================================================================

    // Stockage pour les fonctions originales (non accessible)
    var _originalFunctions = new WeakMap();
    var _proxyCache = new WeakMap();

    // =========================================================================
    // 2. FONCTIONS UTILITAIRES
    // =========================================================================

    /**
     * Sauvegarde une fonction et préserve ses propriétés natives
     * @param {Function} customFn - Fonction personnalisée
     * @param {Function} originalFn - Fonction originale
     */
    function safeguard(customFn, originalFn) {
        if (typeof customFn !== 'function' || typeof originalFn !== 'function') {
            return;
        }

        try {
            // Préserver name et length
            Object.defineProperty(customFn, 'name', {
                value: originalFn.name,
                configurable: true,
                writable: false
            });

            Object.defineProperty(customFn, 'length', {
                value: originalFn.length,
                configurable: true,
                writable: false
            });

            // Stocker la fonction originale
            _originalFunctions.set(customFn, originalFn);

        } catch (e) {
            // Ignorer les erreurs
        }
    }

    /**
     * Vérifie si une fonction a été sauvegardée
     * @param {Function} fn - Fonction à vérifier
     * @returns {boolean} True si sauvegardée
     */
    function isSafeguarded(fn) {
        return _originalFunctions.has(fn);
    }

    /**
     * Récupère la fonction originale
     * @param {Function} fn - Fonction personnalisée
     * @returns {Function|null} Fonction originale ou null
     */
    function getOriginal(fn) {
        return _originalFunctions.get(fn) || null;
    }

    // =========================================================================
    // 3. PATCH SUBTIL DE toString (Version améliorée)
    // =========================================================================

    /**
     * Patch toString de manière moins intrusive
     * Utilise un Proxy sur Function.prototype.toString
     */
    function patchToString() {
        try {
            var originalToString = Function.prototype.toString;

            // Créer un Proxy pour intercepter les appels à toString
            var toStringProxy = new Proxy(originalToString, {
                apply: function(target, ctx, args) {
                    // Si la fonction est dans notre cache, retourner le toString original
                    if (_originalFunctions.has(ctx)) {
                        var original = _originalFunctions.get(ctx);
                        return originalToString.call(original);
                    }

                    // Vérifier si c'est notre Proxy lui-même
                    if (ctx === toStringProxy || ctx === Function.prototype.toString) {
                        return 'function toString() { [native code] }';
                    }

                    // Comportement normal
                    return target.call(ctx, args);
                }
            });

            // Remplacer Function.prototype.toString par le Proxy
            Object.defineProperty(Function.prototype, 'toString', {
                value: toStringProxy,
                writable: true,
                enumerable: false,
                configurable: true
            });

            // Sauvegarder pour que toStringProxy ne soit pas détectable
            _originalFunctions.set(toStringProxy, originalToString);

        } catch (e) {
            console.warn('[stealth] patchToString error:', e);
        }
    }

    // =========================================================================
    // 4. FABRIQUE DE PROXY AVANCÉ
    // =========================================================================

    /**
     * Crée un Proxy indétectable
     * @param {object} target - Objet cible
     * @param {object} handler - Handler Proxy
     * @param {object} options - Options
     * @returns {Proxy} Proxy configuré
     */
    function createStealthProxy(target, handler, options) {
        options = options || {};

        // Vérifier si déjà dans le cache
        if (_proxyCache.has(target)) {
            return _proxyCache.get(target);
        }

        // Handler par défaut
        var defaultHandler = {
            get: function(obj, prop, receiver) {
                // Intercepter Symbol.toStringTag pour masquer le Proxy
                if (prop === Symbol.toStringTag) {
                    if (typeof target === 'function') {
                        return 'Function';
                    }
                    return 'Object';
                }

                // Si un handler personnalisé est fourni, l'utiliser
                if (handler && typeof handler.get === 'function') {
                    return handler.get(obj, prop, receiver);
                }

                return Reflect.get(obj, prop, receiver);
            },
            set: function(obj, prop, value, receiver) {
                if (handler && typeof handler.set === 'function') {
                    return handler.set(obj, prop, value, receiver);
                }
                return Reflect.set(obj, prop, value, receiver);
            },
            has: function(obj, prop) {
                if (handler && typeof handler.has === 'function') {
                    return handler.has(obj, prop);
                }
                return Reflect.has(obj, prop);
            },
            ownKeys: function(obj) {
                if (handler && typeof handler.ownKeys === 'function') {
                    return handler.ownKeys(obj);
                }
                return Reflect.ownKeys(obj);
            },
            getOwnPropertyDescriptor: function(obj, prop) {
                if (handler && typeof handler.getOwnPropertyDescriptor === 'function') {
                    return handler.getOwnPropertyDescriptor(obj, prop);
                }
                return Reflect.getOwnPropertyDescriptor(obj, prop);
            },
            getPrototypeOf: function(obj) {
                if (handler && typeof handler.getPrototypeOf === 'function') {
                    return handler.getPrototypeOf(obj);
                }
                return Reflect.getPrototypeOf(obj);
            },
            setPrototypeOf: function(obj, proto) {
                if (handler && typeof handler.setPrototypeOf === 'function') {
                    return handler.setPrototypeOf(obj, proto);
                }
                return Reflect.setPrototypeOf(obj, proto);
            }
        };

        // Fusionner avec le handler personnalisé
        var finalHandler = Object.assign({}, defaultHandler, handler);

        // Créer le Proxy
        var proxy = new Proxy(target, finalHandler);

        // Mettre en cache
        _proxyCache.set(target, proxy);

        return proxy;
    }

    /**
     * Vérifie si un objet est un Proxy
     * @param {object} obj - Objet à vérifier
     * @returns {boolean} True si c'est un Proxy
     */
    function isProxy(obj) {
        // Les Proxys ne peuvent pas être détectés directement
        // Cette fonction est une estimation
        try {
            return obj && typeof obj === 'object' && _proxyCache.has(obj);
        } catch (e) {
            return false;
        }
    }

    // =========================================================================
    // 5. APPLICATION DES PATCHS
    // =========================================================================

    // 5.1. Patch toString
    patchToString();

    // 5.2. Sauvegarder les fonctions critiques
    safeguard(Function.prototype.toString, Function.prototype.toString);

    // =========================================================================
    // 6. EXPOSITION LIMITÉE
    // =========================================================================

    // Utiliser un symbole pour exposer les fonctions
    var stealthSymbol = Symbol('stealth.proxies');

    if (!window[stealthSymbol]) {
        window[stealthSymbol] = {
            safeguard: safeguard,
            isSafeguarded: isSafeguarded,
            getOriginal: getOriginal,
            createProxy: createStealthProxy,
            isProxy: isProxy
        };
    }

    // Exposer également via une propriété non énumérable
    if (!window.__stealth_proxy__) {
        Object.defineProperty(window, '__stealth_proxy__', {
            value: {
                create: createStealthProxy,
                safeguard: safeguard
            },
            configurable: false,
            enumerable: false,
            writable: false
        });
    }

    // =========================================================================
    // 7. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] evasions.proxies.js loaded successfully');
        console.log('[stealth] Function.prototype.toString patched');
        console.log('[stealth] createStealthProxy available');
    }

})();