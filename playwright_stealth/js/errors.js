/**
 * errors.js
 * Interception et nettoyage des Stack Traces
 * 
 * Masque les traces d'automatisation (Playwright, Puppeteer, eval)
 * dans les stacks d'erreur pour éviter la détection.
 * 
 * Problème ciblé: Les scripts de détection analysent les stacks
 * d'erreur pour identifier l'automatisation.
 * 
 * Compatibilité: Chrome 80+
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. CONFIGURATION
    // =========================================================================

    /**
     * Patterns d'automatisation à masquer
     * Ces patterns sont associés à Playwright, Puppeteer et autres frameworks
     */
    var AUTOMATION_PATTERNS = [
        /playwright/i,
        /puppeteer/i,
        /__playwright__/i,
        /__puppeteer__/i,
        /eval at/i,
        /<anonymous>:\d+:\d+/,
        /at async/i,
        /node_modules/i,
        /internal\/process/i,
        /internal\/modules/i,
        /Function\.execute/i
    ];

    /**
     * Patterns de fallback pour les traces factices
     * Utilisés lorsque toute la trace est nettoyée
     */
    var FALLBACK_STACK = [
        '    at Object.run (js/main.js:12:43)',
        '    at dispatchEvent (js/events.js:84:12)',
        '    at handleClick (js/dom.js:156:18)',
        '    at processEvent (js/events.js:92:5)'
    ];

    /**
     * Noms de fichiers réalistes pour les traces factices
     */
    var REALISTIC_FILES = [
        'js/main.js',
        'js/events.js',
        'js/dom.js',
        'js/utils.js',
        'js/components.js',
        'js/app.js',
        'js/router.js',
        'js/store.js'
    ];

    // =========================================================================
    // 2. FONCTIONS DE SANITIZATION
    // =========================================================================

    /**
     * Sanitize une stack trace pour masquer les patterns d'automatisation
     * @param {string} stackString - La stack trace brute
     * @param {boolean} addFallback - Ajouter une trace factice si nécessaire
     * @returns {string} Stack trace nettoyée
     */
    function sanitizeStack(stackString, addFallback) {
        if (typeof stackString !== 'string') {
            return stackString;
        }

        var lines = stackString.split('\n');
        var cleanLines = [];

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var isAutomation = false;

            for (var j = 0; j < AUTOMATION_PATTERNS.length; j++) {
                if (AUTOMATION_PATTERNS[j].test(line)) {
                    isAutomation = true;
                    break;
                }
            }

            if (!isAutomation) {
                cleanLines.push(line);
            }
        }

        // Si toute la trace est nettoyée, ajouter un fallback réaliste
        if (addFallback && cleanLines.length <= 1 && lines.length > 1) {
            var firstLine = lines[0] || 'Error';
            var fallbackLines = FALLBACK_STACK.slice(0);
            
            // Ajouter un nom de fichier réaliste
            if (firstLine.includes('Error')) {
                return firstLine + '\n' + fallbackLines.join('\n');
            }
            return fallbackLines.join('\n');
        }

        return cleanLines.join('\n');
    }

    /**
     * Crée une trace factice réaliste
     * @param {string} errorType - Type d'erreur
     * @returns {string} Trace factice
     */
    function createRealisticFallback(errorType) {
        var lines = [];
        lines.push(errorType || 'Error');

        // Ajouter des frames réalistes
        var numFrames = 3 + Math.floor(Math.random() * 3);
        for (var i = 0; i < numFrames; i++) {
            var file = REALISTIC_FILES[i % REALISTIC_FILES.length];
            var line = 10 + Math.floor(Math.random() * 200);
            var col = 5 + Math.floor(Math.random() * 30);
            var func = ['run', 'dispatchEvent', 'handleClick', 'processEvent', 'init', 'render', 'update'][i % 7];
            lines.push('    at ' + func + ' (' + file + ':' + line + ':' + col + ')');
        }

        return lines.join('\n');
    }

    // =========================================================================
    // 3. PATCH DE Error.prototype.stack
    // =========================================================================

    /**
     * Patch le getter/setter de Error.prototype.stack
     */
    function patchStackDescriptor() {
        try {
            var stackDescriptor = Object.getOwnPropertyDescriptor(Error.prototype, 'stack');

            if (!stackDescriptor || typeof stackDescriptor.get !== 'function') {
                return;
            }

            var originalGet = stackDescriptor.get;
            var originalSet = stackDescriptor.set;

            Object.defineProperty(Error.prototype, 'stack', {
                get: function() {
                    var rawStack = originalGet.call(this);
                    return sanitizeStack(rawStack, true);
                },
                set: function(value) {
                    if (originalSet) {
                        originalSet.call(this, value);
                    }
                },
                configurable: true,
                enumerable: false
            });

        } catch (e) {
            console.warn('[stealth] patchStackDescriptor error:', e);
        }
    }

    // =========================================================================
    // 4. PATCH DE Error.prepareStackTrace (Version optimisée)
    // =========================================================================

    /**
     * Patch Error.prepareStackTrace de manière moins intrusive
     */
    function patchPrepareStackTrace() {
        try {
            var originalPrepareStackTrace = Error.prepareStackTrace;

            // Utiliser un Proxy pour intercepter les appels
            var prepareStackTraceHandler = {
                apply: function(target, ctx, args) {
                    var error = args[0];
                    var structuredStackTrace = args[1];

                    // Si un prepareStackTrace existait, l'utiliser
                    if (originalPrepareStackTrace) {
                        var result = originalPrepareStackTrace(error, structuredStackTrace);
                        return sanitizeStack(result, true);
                    }

                    // Fallback: construction par défaut
                    var fallback = createRealisticFallback(error ? error.toString() : 'Error');
                    return sanitizeStack(fallback, false);
                }
            };

            // Créer un Proxy sur la propriété si elle existe
            if (typeof Error.prepareStackTrace === 'function') {
                var proxy = new Proxy(Error.prepareStackTrace, prepareStackTraceHandler);
                Object.defineProperty(Error, 'prepareStackTrace', {
                    value: proxy,
                    configurable: true,
                    enumerable: true,
                    writable: true
                });
            } else {
                // Définir la propriété si elle n'existe pas
                Object.defineProperty(Error, 'prepareStackTrace', {
                    value: new Proxy(function() {}, prepareStackTraceHandler),
                    configurable: true,
                    enumerable: true,
                    writable: true
                });
            }

        } catch (e) {
            console.warn('[stealth] patchPrepareStackTrace error:', e);
        }
    }

    // =========================================================================
    // 5. PATCH DE Error.captureStackTrace (Version optimisée)
    // =========================================================================

    /**
     * Patch Error.captureStackTrace de manière moins intrusive
     */
    function patchCaptureStackTrace() {
        try {
            var originalCaptureStackTrace = Error.captureStackTrace;

            if (!originalCaptureStackTrace || typeof originalCaptureStackTrace !== 'function') {
                return;
            }

            // Créer une nouvelle fonction qui appelle l'originale puis sanitize
            var newCaptureStackTrace = function(targetObject, constructorOpt) {
                originalCaptureStackTrace(targetObject, constructorOpt);

                // Sanitizer le stack si présent
                if (targetObject && targetObject.stack) {
                    var sanitized = sanitizeStack(targetObject.stack, true);
                    // Redéfinir la propriété stack
                    Object.defineProperty(targetObject, 'stack', {
                        value: sanitized,
                        configurable: true,
                        writable: true,
                        enumerable: false
                    });
                }
            };

            // Remplacer la fonction
            Error.captureStackTrace = newCaptureStackTrace;

            // Préserver le toString
            Object.defineProperty(Error.captureStackTrace, 'toString', {
                value: function() {
                    return 'function captureStackTrace() { [native code] }';
                },
                configurable: true
            });

        } catch (e) {
            console.warn('[stealth] patchCaptureStackTrace error:', e);
        }
    }

    // =========================================================================
    // 6. PATCH DE Function.prototype.toString
    // =========================================================================

    /**
     * Patch Function.prototype.toString pour masquer nos modifications
     */
    function patchFunctionToString() {
        try {
            var originalToString = Function.prototype.toString;

            Function.prototype.toString = function() {
                // Si on essaie d'obtenir le toString d'une de nos fonctions patchées
                if (this === Error.captureStackTrace) {
                    return 'function captureStackTrace() { [native code] }';
                }
                if (this === Error.prepareStackTrace) {
                    return 'function prepareStackTrace() { [native code] }';
                }
                return originalToString.call(this);
            };

        } catch (e) {
            console.warn('[stealth] patchFunctionToString error:', e);
        }
    }

    // =========================================================================
    // 7. APPLICATION DES PATCHS
    // =========================================================================

    // Appliquer tous les patches
    patchStackDescriptor();
    patchPrepareStackTrace();
    patchCaptureStackTrace();
    patchFunctionToString();

    // =========================================================================
    // 8. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] errors.js loaded successfully');
        console.log('[stealth] Error.prototype.stack patched:', true);
        console.log('[stealth] Error.prepareStackTrace patched:', true);
        console.log('[stealth] Error.captureStackTrace patched:', true);
    }

})();