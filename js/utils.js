/**
 * utils.js
 * Utilitaires pour les évasions anti-détection
 * 
 * Ensemble de fonctions utilitaires pour modifier les APIs natives du navigateur
 * sans laisser de traces.
 * 
 * Compatibilité: Chrome 80+
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. DÉFINITION DE L'OBJET utils
    // =========================================================================

    // Utiliser l'objet utils existant ou en créer un nouveau
    const utils = window.utils || {};

    // =========================================================================
    // 2. STRIP PROXY FROM ERRORS
    // =========================================================================

    /**
     * Wraps a JS Proxy Handler and strips it's presence from error stacks, in case the traps throw.
     * 
     * The presence of a JS Proxy can be revealed as it shows up in error stack traces.
     * 
     * @param {object} handler - The JS Proxy handler to wrap
     * @returns {object} Wrapped handler
     */
    utils.stripProxyFromErrors = function(handler) {
        if (!handler || typeof handler !== 'object') {
            return {};
        }

        var newHandler = {};
        var traps = Object.getOwnPropertyNames(handler);

        traps.forEach(function(trap) {
            newHandler[trap] = function() {
                try {
                    return handler[trap].apply(this, arguments || []);
                } catch (err) {
                    if (!err || !err.stack || !err.stack.includes('at ')) {
                        throw err;
                    }

                    // Strip avec ancrage ou blacklist
                    var stackArr = err.stack.split('\n');
                    var anchor = 'at Object.newHandler.<computed> [as ' + trap + '] ';
                    var anchorIndex = stackArr.findIndex(function(line) {
                        return line.trim().startsWith(anchor);
                    });

                    if (anchorIndex !== -1) {
                        stackArr.splice(1, anchorIndex);
                        err.stack = stackArr.join('\n');
                    } else {
                        // Blacklist fallback
                        var blacklist = [
                            'at Reflect.' + trap + ' ',
                            'at Object.' + trap + ' ',
                            'at Object.newHandler.<computed> [as ' + trap + '] '
                        ];
                        err.stack = stackArr
                            .filter(function(line, index) { return index !== 1; })
                            .filter(function(line) {
                                return !blacklist.some(function(bl) {
                                    return line.trim().startsWith(bl);
                                });
                            })
                            .join('\n');
                    }

                    throw err;
                }
            };
        });

        return newHandler;
    };

    // =========================================================================
    // 3. STRIP ERROR WITH ANCHOR
    // =========================================================================

    /**
     * Strip error lines from stack traces until (and including) a known line the stack.
     * 
     * @param {object} err - The error to sanitize
     * @param {string} anchor - The string the anchor line starts with
     * @returns {object} Sanitized error
     */
    utils.stripErrorWithAnchor = function(err, anchor) {
        if (!err || !err.stack || typeof err.stack !== 'string') {
            return err;
        }

        var stackArr = err.stack.split('\n');
        var anchorIndex = stackArr.findIndex(function(line) {
            return line.trim().startsWith(anchor);
        });

        if (anchorIndex === -1) {
            return err;
        }

        stackArr.splice(1, anchorIndex);
        err.stack = stackArr.join('\n');
        return err;
    };

    // =========================================================================
    // 4. REPLACE PROPERTY
    // =========================================================================

    /**
     * Replace the property of an object in a stealthy way.
     * 
     * @param {object} obj - The object which has the property to replace
     * @param {string} propName - The property name to replace
     * @param {object} descriptorOverrides - e.g. { value: "alice" }
     * @returns {object} The object with the replaced property
     */
    utils.replaceProperty = function(obj, propName, descriptorOverrides) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        descriptorOverrides = descriptorOverrides || {};

        var existingDescriptor = Object.getOwnPropertyDescriptor(obj, propName) || {};
        var newDescriptor = {};

        // Copier les descripteurs existants
        for (var key in existingDescriptor) {
            if (existingDescriptor.hasOwnProperty(key)) {
                newDescriptor[key] = existingDescriptor[key];
            }
        }

        // Ajouter les overrides
        for (var overrideKey in descriptorOverrides) {
            if (descriptorOverrides.hasOwnProperty(overrideKey)) {
                newDescriptor[overrideKey] = descriptorOverrides[overrideKey];
            }
        }

        Object.defineProperty(obj, propName, newDescriptor);
        return obj;
    };

    // =========================================================================
    // 5. PRELOAD CACHE
    // =========================================================================

    /**
     * Preload a cache of function copies and data.
     */
    utils.preloadCache = function() {
        if (utils.cache) {
            return;
        }

        utils.cache = {
            Reflect: {
                get: Reflect.get.bind(Reflect),
                apply: Reflect.apply.bind(Reflect)
            },
            nativeToStringStr: Function.toString + ''
        };
    };

    // =========================================================================
    // 6. MAKE NATIVE STRING
    // =========================================================================

    /**
     * Utility function to generate a cross-browser `toString` result representing native code.
     * 
     * @param {string} name - Optional function name
     * @returns {string} Native code string
     */
    utils.makeNativeString = function(name) {
        utils.preloadCache();
        var nativeStr = utils.cache.nativeToStringStr || 'function toString() { [native code] }';
        return nativeStr.replace('toString', name || '');
    };

    // =========================================================================
    // 7. PATCH TO STRING
    // =========================================================================

    /**
     * Helper function to modify the `toString()` result of the provided object.
     * 
     * @param {object} obj - The object for which to modify the `toString()` representation
     * @param {string} str - Optional string used as a return value
     */
    utils.patchToString = function(obj, str) {
        utils.preloadCache();
        str = str || '';

        var toStringProxy = new Proxy(Function.prototype.toString, {
            apply: function(target, ctx, args) {
                if (ctx === Function.prototype.toString) {
                    return utils.makeNativeString('toString');
                }
                if (ctx === obj) {
                    return str || utils.makeNativeString(obj.name || '');
                }
                var hasSameProto = Object.getPrototypeOf(Function.prototype.toString)
                    .isPrototypeOf(ctx.toString);
                if (!hasSameProto) {
                    return ctx.toString();
                }
                return target.call(ctx, args);
            }
        });

        utils.replaceProperty(Function.prototype, 'toString', {
            value: toStringProxy
        });
    };

    // =========================================================================
    // 8. PATCH TO STRING NESTED
    // =========================================================================

    /**
     * Make all nested functions of an object native.
     * 
     * @param {object} obj - The object to patch
     * @returns {object} The patched object
     */
    utils.patchToStringNested = function(obj) {
        return utils.execRecursively(obj, ['function'], utils.patchToString);
    };

    // =========================================================================
    // 9. REDIRECT TO STRING
    // =========================================================================

    /**
     * Redirect toString requests from one object to another.
     * 
     * @param {object} proxyObj - The object that toString will be called on
     * @param {object} originalObj - The object which toString result we want to return
     */
    utils.redirectToString = function(proxyObj, originalObj) {
        utils.preloadCache();

        var toStringProxy = new Proxy(Function.prototype.toString, {
            apply: function(target, ctx, args) {
                if (ctx === Function.prototype.toString) {
                    return utils.makeNativeString('toString');
                }
                if (ctx === proxyObj) {
                    var fallback = function() {
                        return originalObj && originalObj.name
                            ? utils.makeNativeString(originalObj.name)
                            : utils.makeNativeString(proxyObj.name || '');
                    };
                    try {
                        return originalObj + '' || fallback();
                    } catch (e) {
                        return fallback();
                    }
                }
                var hasSameProto = Object.getPrototypeOf(Function.prototype.toString)
                    .isPrototypeOf(ctx.toString);
                if (!hasSameProto) {
                    return ctx.toString();
                }
                return target.call(ctx, args);
            }
        });

        utils.replaceProperty(Function.prototype, 'toString', {
            value: toStringProxy
        });
    };

    // =========================================================================
    // 10. REPLACE WITH PROXY
    // =========================================================================

    /**
     * All-in-one method to replace a property with a JS Proxy.
     * 
     * @param {object} obj - The object which has the property to replace
     * @param {string} propName - The name of the property to replace
     * @param {object} handler - The JS Proxy handler to use
     * @returns {boolean} True if successful
     */
    utils.replaceWithProxy = function(obj, propName, handler) {
        if (!obj || typeof obj !== 'object' || !propName) {
            return false;
        }

        utils.preloadCache();

        try {
            var originalObj = obj[propName];
            var proxyObj = new Proxy(obj[propName], utils.stripProxyFromErrors(handler));

            utils.replaceProperty(obj, propName, { value: proxyObj });
            utils.redirectToString(proxyObj, originalObj);

            return true;
        } catch (e) {
            console.warn('[utils] replaceWithProxy failed:', e);
            return false;
        }
    };

    // =========================================================================
    // 11. MOCK WITH PROXY
    // =========================================================================

    /**
     * All-in-one method to mock a non-existing property with a JS Proxy.
     * 
     * @param {object} obj - The object which has the property to replace
     * @param {string} propName - The name of the property to replace or create
     * @param {object} pseudoTarget - The JS Proxy target to use as a basis
     * @param {object} handler - The JS Proxy handler to use
     * @returns {boolean} True if successful
     */
    utils.mockWithProxy = function(obj, propName, pseudoTarget, handler) {
        if (!obj || typeof obj !== 'object' || !propName) {
            return false;
        }

        utils.preloadCache();

        try {
            var proxyObj = new Proxy(pseudoTarget || function() {}, utils.stripProxyFromErrors(handler));
            utils.replaceProperty(obj, propName, { value: proxyObj });
            utils.patchToString(proxyObj);
            return true;
        } catch (e) {
            console.warn('[utils] mockWithProxy failed:', e);
            return false;
        }
    };

    // =========================================================================
    // 12. CREATE PROXY
    // =========================================================================

    /**
     * All-in-one method to create a new JS Proxy with stealth tweaks.
     * 
     * @param {object} pseudoTarget - The JS Proxy target to use as a basis
     * @param {object} handler - The JS Proxy handler to use
     * @returns {Proxy} The created Proxy
     */
    utils.createProxy = function(pseudoTarget, handler) {
        utils.preloadCache();

        try {
            var proxyObj = new Proxy(pseudoTarget, utils.stripProxyFromErrors(handler));
            utils.patchToString(proxyObj);
            return proxyObj;
        } catch (e) {
            console.warn('[utils] createProxy failed:', e);
            return pseudoTarget;
        }
    };

    // =========================================================================
    // 13. SPLIT OBJ PATH
    // =========================================================================

    /**
     * Helper function to split a full path to an Object into the first part and property.
     * 
     * @param {string} objPath - The full path to an object as dot notation string
     * @returns {object} { objName, propName }
     */
    utils.splitObjPath = function(objPath) {
        if (typeof objPath !== 'string') {
            return { objName: '', propName: '' };
        }

        var parts = objPath.split('.');
        return {
            objName: parts.slice(0, -1).join('.'),
            propName: parts.slice(-1)[0] || ''
        };
    };

    // =========================================================================
    // 14. REPLACE OBJ PATH WITH PROXY (SANS eval)
    // =========================================================================

    /**
     * Convenience method to replace a property with a JS Proxy using the provided objPath.
     * 
     * Version sécurisée qui n'utilise pas eval().
     * 
     * @param {string} objPath - The full path to an object (dot notation string) to replace
     * @param {object} handler - The JS Proxy handler to use
     * @returns {boolean} True if successful
     */
    utils.replaceObjPathWithProxy = function(objPath, handler) {
        if (typeof objPath !== 'string') {
            return false;
        }

        try {
            var parts = objPath.split('.');
            var current = window;

            for (var i = 0; i < parts.length - 1; i++) {
                var part = parts[i];
                if (!current || typeof current !== 'object' || !(part in current)) {
                    console.warn('[utils] replaceObjPathWithProxy: path not found:', objPath);
                    return false;
                }
                current = current[part];
            }

            var propName = parts[parts.length - 1];
            if (!current || typeof current !== 'object' || !(propName in current)) {
                console.warn('[utils] replaceObjPathWithProxy: property not found:', propName);
                return false;
            }

            return utils.replaceWithProxy(current, propName, handler);
        } catch (e) {
            console.warn('[utils] replaceObjPathWithProxy failed:', e);
            return false;
        }
    };

    // =========================================================================
    // 15. EXEC RECURSIVELY
    // =========================================================================

    /**
     * Traverse nested properties of an object recursively and apply the given function on a whitelist of value types.
     * 
     * @param {object} obj - The object to traverse
     * @param {array} typeFilter - e.g. ['function']
     * @param {Function} fn - e.g. utils.patchToString
     * @returns {object} The traversed object
     */
    utils.execRecursively = function(obj, typeFilter, fn) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        typeFilter = typeFilter || [];

        function recurse(current) {
            for (var key in current) {
                if (!current.hasOwnProperty(key)) {
                    continue;
                }
                var value = current[key];
                if (value === undefined || value === null) {
                    continue;
                }
                if (typeof value === 'object') {
                    recurse(value);
                } else if (typeFilter.indexOf(typeof value) !== -1) {
                    try {
                        fn.call(this, value);
                    } catch (e) {
                        // Ignorer les erreurs
                    }
                }
            }
        }

        recurse(obj);
        return obj;
    };

    // =========================================================================
    // 16. STRINGIFY FNS
    // =========================================================================

    /**
     * Convert an object with functions to an object with stringified functions.
     * 
     * @param {object} fnObj - An object containing functions as properties
     * @returns {object} An object with stringified functions
     */
    utils.stringifyFns = function(fnObj) {
        if (!fnObj || typeof fnObj !== 'object') {
            return {};
        }

        var result = {};
        for (var key in fnObj) {
            if (fnObj.hasOwnProperty(key) && typeof fnObj[key] === 'function') {
                result[key] = fnObj[key].toString();
            }
        }
        return result;
    };

    // =========================================================================
    // 17. MATERIALIZE FNS (SANS eval)
    // =========================================================================

    /**
     * Reverse of stringifyFns - materialize functions from strings.
     * 
     * Version sécurisée qui n'utilise pas eval().
     * Note: Cette version est limitée aux fonctions qui n'ont pas besoin de closure.
     * 
     * @param {object} fnStrObj - An object containing stringified functions as properties
     * @returns {object} An object with materialized functions
     */
    utils.materializeFns = function(fnStrObj) {
        if (!fnStrObj || typeof fnStrObj !== 'object') {
            return {};
        }

        var result = {};
        for (var key in fnStrObj) {
            if (fnStrObj.hasOwnProperty(key) && typeof fnStrObj[key] === 'string') {
                try {
                    // Utiliser Function constructor au lieu de eval
                    // Note: Ceci est plus sûr mais limite les fermetures
                    var fnStr = fnStrObj[key];
                    // Si c'est une fonction fléchée, la retourner directement
                    if (fnStr.includes('=>')) {
                        result[key] = new Function('return (' + fnStr + ')')();
                    } else {
                        // Fonction classique
                        result[key] = new Function('return ' + fnStr)();
                    }
                } catch (e) {
                    console.warn('[utils] materializeFns failed for ' + key + ':', e);
                    result[key] = function() {};
                }
            }
        }
        return result;
    };

    // =========================================================================
    // 18. EXPOSITION
    // =========================================================================

    // Exposer utils globalement
    window.utils = utils;

    // =========================================================================
    // 19. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] utils.js loaded successfully');
        console.log('[stealth] utils functions:', Object.keys(utils).filter(function(k) {
            return typeof utils[k] === 'function';
        }));
    }

})();