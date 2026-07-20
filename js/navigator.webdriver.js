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

    if (typeof navigator === 'undefined') return;

    var proto = Object.getPrototypeOf(navigator);

    // 1. Suppression stricte et multicouche (Essentiel avant le Proxy)
    try {
        var current = navigator;
        while (current) {
            if (Object.getOwnPropertyDescriptor(current, 'webdriver')) {
                delete current.webdriver;
            }
            current = Object.getPrototypeOf(current);
        }
    } catch (e) {}

    // 2. Patch complet des méthodes d'inspection (Anti-Fingerprinting)
    try {
        var origHasOwnProperty = Object.prototype.hasOwnProperty;
        Object.prototype.hasOwnProperty = function(prop) {
            if ((this === navigator || this === proto) && prop === 'webdriver') return false;
            return origHasOwnProperty.call(this, prop);
        };

        var origKeys = Object.keys;
        Object.keys = function(obj) {
            var keys = origKeys(obj);
            if (obj === navigator || obj === proto) {
                return keys.filter(function(k) { return k !== 'webdriver'; });
            }
            return keys;
        };

        var origGetOwnPropertyNames = Object.getOwnPropertyNames;
        Object.getOwnPropertyNames = function(obj) {
            var keys = origGetOwnPropertyNames(obj);
            if (obj === navigator || obj === proto) {
                return keys.filter(function(k) { return k !== 'webdriver'; });
            }
            return keys;
        };

        var origReflectHas = Reflect.has;
        Reflect.has = function(target, property) {
            if ((target === navigator || target === proto) && property === 'webdriver') return false;
            return origReflectHas(target, property);
        };

        var origGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
        Object.getOwnPropertyDescriptor = function(obj, prop) {
            if ((obj === navigator || obj === proto) && prop === 'webdriver') return undefined;
            return origGetOwnPropertyDescriptor(obj, prop);
        };

        var origGetOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
        Object.getOwnPropertyDescriptors = function(obj) {
            var descriptors = origGetOwnPropertyDescriptors(obj);
            if (obj === navigator || obj === proto) delete descriptors.webdriver;
            return descriptors;
        };
    } catch (e) {}

    // 3. Proxy de surface respectant les invariants V8
    try {
        var handler = {
            get: function(t, p) {
                if (p === 'webdriver') return undefined;
                var value = Reflect.get(t, p);
                if (typeof value === 'function') {
                    return value.bind(t);
                }
                return value;
            },
            has: function(t, p) {
                if (p === 'webdriver') {
                    // Si la cible possède encore la propriété verrouillée, le piège DOIT renvoyer true
                    var desc = Object.getOwnPropertyDescriptor(t, p);
                    if (desc && !desc.configurable) return true;
                    return false;
                }
                return Reflect.has(t, p);
            },
            ownKeys: function(t) { 
                return Reflect.ownKeys(t).filter(function(k) { return k !== 'webdriver'; }); 
            },
            getOwnPropertyDescriptor: function(t, p) { 
                if (p === 'webdriver') return undefined;
                return Reflect.getOwnPropertyDescriptor(t, p); 
            }
        };
        var proxy = new Proxy(navigator, handler);
        Object.defineProperty(window, 'navigator', { value: proxy, configurable: false, enumerable: true, writable: false });
    } catch (e) {}

    console.log('[stealth] Masquage chirurgical de navigator.webdriver appliqué.');
})();