/**
 * navigator.webdriver.js
 * Évasion pour navigator.webdriver
 * 
 * Masque complètement la propriété navigator.webdriver pour qu'elle soit
 * indétectable par toutes les méthodes d'inspection.
 * 
 * Problème ciblé: navigator.webdriver est le signal le plus vérifié
 * par les scripts de détection d'automatisation.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Références:
 * - https://w3c.github.io/webdriver/#webdriver-interface
 * - https://stackoverflow.com/a/69533548
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que navigator existe
    if (typeof navigator === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] navigator not available, skipping webdriver');
        }
        return;
    }

    // =========================================================================
    // 2. SUPPRESSION COMPLÈTE DE webdriver
    // =========================================================================

    /**
     * Supprime la propriété webdriver de tous les niveaux du prototype
     */
    function removeWebdriverFromPrototypes() {
        try {
            // Parcourir la chaîne de prototypes
            var current = navigator;
            var visited = new Set();

            while (current && !visited.has(current)) {
                visited.add(current);
                try {
                    if (Object.getOwnPropertyDescriptor(current, 'webdriver')) {
                        delete current.webdriver;
                    }
                } catch (e) {
                    // Ignorer les erreurs
                }
                current = Object.getPrototypeOf(current);
            }
        } catch (e) {
            console.warn('[stealth] removeWebdriverFromPrototypes error:', e);
        }
    }

    /**
     * Supprime webdriver de toutes les instances possibles
     */
    function removeWebdriverFromAll() {
        try {
            // 1. Prototype de navigator
            var proto = Object.getPrototypeOf(navigator);
            if (proto && Object.getOwnPropertyDescriptor(proto, 'webdriver')) {
                delete proto.webdriver;
            }

            // 2. Navigateur directement
            if (Object.getOwnPropertyDescriptor(navigator, 'webdriver')) {
                delete navigator.webdriver;
            }

            // 3. Prototype du prototype
            var protoProto = Object.getPrototypeOf(proto);
            if (protoProto && Object.getOwnPropertyDescriptor(protoProto, 'webdriver')) {
                delete protoProto.webdriver;
            }

            // 4. Object.prototype (dernier recours)
            if (Object.prototype && Object.getOwnPropertyDescriptor(Object.prototype, 'webdriver')) {
                delete Object.prototype.webdriver;
            }

            // 5. Suppression des prototypes supplémentaires
            removeWebdriverFromPrototypes();

        } catch (e) {
            console.warn('[stealth] removeWebdriverFromAll error:', e);
        }
    }

    // =========================================================================
    // 3. MASQUAGE AVEC DESCRIPTEUR
    // =========================================================================

    /**
     * Définit webdriver comme non-configurable et non-enumerable
     */
    function maskWebdriverWithDescriptor() {
        try {
            Object.defineProperty(navigator, 'webdriver', {
                value: undefined,
                writable: false,
                enumerable: false,
                configurable: false
            });

            // Si la propriété existe déjà sur le prototype, la supprimer
            var proto = Object.getPrototypeOf(navigator);
            if (proto && Object.getOwnPropertyDescriptor(proto, 'webdriver')) {
                try {
                    delete proto.webdriver;
                } catch (e) {
                    Object.defineProperty(proto, 'webdriver', {
                        value: undefined,
                        writable: false,
                        enumerable: false,
                        configurable: false
                    });
                }
            }

        } catch (e) {
            console.warn('[stealth] maskWebdriverWithDescriptor error:', e);
        }
    }

    // =========================================================================
    // 4. PATCH DES MÉTHODES D'INSPECTION
    // =========================================================================

    /**
     * Patch les méthodes d'inspection pour masquer webdriver
     */
    function patchInspectionMethods() {
        try {
            var proto = Object.getPrototypeOf(navigator);

            // 4.1. hasOwnProperty
            var origHasOwnProperty = Object.prototype.hasOwnProperty;
            Object.prototype.hasOwnProperty = function(prop) {
                if (this === navigator && prop === 'webdriver') {
                    return false;
                }
                if (this === proto && prop === 'webdriver') {
                    return false;
                }
                return origHasOwnProperty.call(this, prop);
            };

            // 4.2. Object.keys
            var origKeys = Object.keys;
            Object.keys = function(obj) {
                var keys = origKeys(obj);
                if (obj === navigator || obj === proto) {
                    return keys.filter(function(key) { return key !== 'webdriver'; });
                }
                return keys;
            };

            // 4.3. Object.getOwnPropertyNames
            var origGetOwnPropertyNames = Object.getOwnPropertyNames;
            Object.getOwnPropertyNames = function(obj) {
                var keys = origGetOwnPropertyNames(obj);
                if (obj === navigator || obj === proto) {
                    return keys.filter(function(key) { return key !== 'webdriver'; });
                }
                return keys;
            };

            // 4.4. Object.getOwnPropertySymbols
            var origGetOwnPropertySymbols = Object.getOwnPropertySymbols;
            Object.getOwnPropertySymbols = function(obj) {
                var symbols = origGetOwnPropertySymbols(obj);
                if (obj === navigator || obj === proto) {
                    return symbols.filter(function(sym) {
                        return sym.toString() !== 'Symbol(webdriver)';
                    });
                }
                return symbols;
            };

            // 4.5. Reflect.has
            var origReflectHas = Reflect.has;
            Reflect.has = function(target, property) {
                if ((target === navigator || target === proto) && property === 'webdriver') {
                    return false;
                }
                return origReflectHas(target, property);
            };

            // 4.6. Object.getOwnPropertyDescriptor
            var origGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
            Object.getOwnPropertyDescriptor = function(obj, prop) {
                if ((obj === navigator || obj === proto) && prop === 'webdriver') {
                    return undefined;
                }
                return origGetOwnPropertyDescriptor(obj, prop);
            };

            // 4.7. Reflect.getOwnPropertyDescriptor
            var origReflectGetOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;
            Reflect.getOwnPropertyDescriptor = function(target, property) {
                if ((target === navigator || target === proto) && property === 'webdriver') {
                    return undefined;
                }
                return origReflectGetOwnPropertyDescriptor(target, property);
            };

            // 4.8. Object.getOwnPropertyDescriptors
            var origGetOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
            Object.getOwnPropertyDescriptors = function(obj) {
                var descriptors = origGetOwnPropertyDescriptors(obj);
                if (obj === navigator || obj === proto) {
                    delete descriptors.webdriver;
                }
                return descriptors;
            };

        } catch (e) {
            console.warn('[stealth] patchInspectionMethods error:', e);
        }
    }

    // =========================================================================
    // 5. PATCH DE Function.prototype.toString POUR webdriver
    // =========================================================================

    /**
     * Patch toString pour que webdriver apparaisse comme natif
     */
    function patchToString() {
        try {
            var origToString = Function.prototype.toString;
            Function.prototype.toString = function() {
                // Si on essaie d'obtenir le toString de webdriver
                if (this === navigator.webdriver) {
                    return 'function webdriver() { [native code] }';
                }
                return origToString.call(this);
            };
        } catch (e) {
            console.warn('[stealth] patchToString error:', e);
        }
    }

    // =========================================================================
    // 6. APPLICATION DES PATCHS
    // =========================================================================

    // 6.1. Supprimer webdriver de tous les prototypes
    removeWebdriverFromAll();

    // 6.2. Masquer avec un descripteur
    maskWebdriverWithDescriptor();

    // 6.3. Patch des méthodes d'inspection
    patchInspectionMethods();

    // 6.4. Patch de toString
    patchToString();

    // 6.5. Proxy sur navigator pour interception avancée
    try {
        var navigatorHandler = {
            get: function(target, prop, receiver) {
                if (prop === 'webdriver') {
                    return undefined;
                }
                return Reflect.get(target, prop, receiver);
            },
            has: function(target, prop) {
                if (prop === 'webdriver') {
                    return false;
                }
                return Reflect.has(target, prop);
            },
            ownKeys: function(target) {
                var keys = Reflect.ownKeys(target);
                return keys.filter(function(key) { return key !== 'webdriver'; });
            },
            getOwnPropertyDescriptor: function(target, prop) {
                if (prop === 'webdriver') {
                    return undefined;
                }
                return Reflect.getOwnPropertyDescriptor(target, prop);
            }
        };

        // Remplacer navigator par un Proxy
        var navigatorProxy = new Proxy(navigator, navigatorHandler);
        Object.defineProperty(window, 'navigator', {
            value: navigatorProxy,
            configurable: false,
            enumerable: true,
            writable: false
        });

    } catch (e) {
        console.warn('[stealth] navigator Proxy failed:', e);
    }

    // 6.6. Vérification finale - supprimer si réapparu
    try {
        if (navigator.webdriver !== undefined) {
            delete navigator.webdriver;
        }
    } catch (e) {
        // Ignorer
    }

    // =========================================================================
    // 7. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] navigator.webdriver.js loaded successfully');
        console.log('[stealth] navigator.webdriver:', navigator.webdriver);
        console.log('[stealth] "webdriver" in navigator:', 'webdriver' in navigator);
        console.log('[stealth] Object.keys(navigator):', Object.keys(navigator));
        console.log('[stealth] Object.getOwnPropertyNames(navigator):', 
                    Object.getOwnPropertyNames(navigator));
        console.log('[stealth] Reflect.has(navigator, "webdriver"):', 
                    Reflect.has(navigator, 'webdriver'));
    }

})();