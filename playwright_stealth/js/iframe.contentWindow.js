/**
 * iframe.contentWindow.js
 * Évasion pour les iframes et leur propriété contentWindow
 * 
 * Intercepte la création d'iframes et patch leur propriété contentWindow
 * pour imiter le comportement natif de Chrome.
 * 
 * Problème ciblé: Certains scripts de détection vérifient que
 * iframe.contentWindow.self === iframe.contentWindow (doit être true)
 * et que iframe.contentWindow.frameElement === iframe (doit être true)
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: Comportement observé dans Chrome
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que utils est disponible
    const hasUtils = typeof utils !== 'undefined';
    
    // Fonction de fallback pour replaceWithProxy
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

    // Sélectionner la méthode appropriée
    const replaceWithProxyFn = (hasUtils && typeof utils.replaceWithProxy === 'function') 
        ? utils.replaceWithProxy 
        : replaceWithProxyFallback;

    // =========================================================================
    // 2. FONCTION D'AJOUT DU PROXY contentWindow
    // =========================================================================

    /**
     * Ajoute un proxy sur contentWindow d'un iframe
     * @param {HTMLIFrameElement} iframe - L'iframe à patcher
     */
    function addContentWindowProxy(iframe) {
        if (!iframe || typeof iframe !== 'object') {
            return;
        }

        // Ne pas patcher si déjà fait
        if (iframe.__stealth_contentWindow_patched) {
            return;
        }

        try {
            // Créer le proxy contentWindow
            const contentWindowProxy = {
                /**
                 * Intercepte les accès aux propriétés de contentWindow
                 */
                get: function(target, key, receiver) {
                    // `self` doit pointer vers contentWindow lui-même
                    if (key === 'self') {
                        return this;
                    }
                    // `frameElement` doit pointer vers l'iframe parent
                    if (key === 'frameElement') {
                        return iframe;
                    }
                    // `top` doit pointer vers le top-level window
                    if (key === 'top') {
                        return window.top || window;
                    }
                    // `parent` doit pointer vers le parent window
                    if (key === 'parent') {
                        return window.parent || window;
                    }
                    // `window` doit pointer vers contentWindow lui-même
                    if (key === 'window') {
                        return this;
                    }
                    // `location` doit être accessible
                    if (key === 'location') {
                        try {
                            return target.location || window.location;
                        } catch (e) {
                            return window.location;
                        }
                    }
                    // `document` doit être accessible
                    if (key === 'document') {
                        try {
                            return target.document || window.document;
                        } catch (e) {
                            return window.document;
                        }
                    }
                    // Tout le reste : comportement normal
                    try {
                        return Reflect.get(target, key, receiver);
                    } catch (e) {
                        // Fallback pour les propriétés non accessibles
                        return undefined;
                    }
                },

                /**
                 * Vérifie l'existence d'une propriété
                 */
                has: function(target, key) {
                    // Simuler les propriétés attendues
                    if (key === 'self' || key === 'frameElement' || 
                        key === 'top' || key === 'parent' || key === 'window') {
                        return true;
                    }
                    try {
                        return Reflect.has(target, key);
                    } catch (e) {
                        return false;
                    }
                },

                /**
                 * Liste les propres propriétés
                 */
                ownKeys: function(target) {
                    var keys = [];
                    try {
                        keys = Reflect.ownKeys(target);
                    } catch (e) {
                        // Fallback: propriétés de base
                        keys = ['self', 'frameElement', 'top', 'parent', 'window', 'location', 'document'];
                    }
                    // Ajouter les propriétés simulées si manquantes
                    if (!keys.includes('self')) keys.push('self');
                    if (!keys.includes('frameElement')) keys.push('frameElement');
                    if (!keys.includes('top')) keys.push('top');
                    if (!keys.includes('parent')) keys.push('parent');
                    if (!keys.includes('window')) keys.push('window');
                    return keys;
                }
            };

            // Créer le proxy
            const target = iframe.contentWindow || window;
            const proxy = new Proxy(target, contentWindowProxy);

            // Définir la propriété contentWindow
            Object.defineProperty(iframe, 'contentWindow', {
                get: function() {
                    return proxy;
                },
                set: function(newValue) {
                    // contentWindow est immutable
                    return newValue;
                },
                enumerable: true,
                configurable: false
            });

            // Marquer comme patché
            iframe.__stealth_contentWindow_patched = true;

        } catch (e) {
            console.debug('[stealth] addContentWindowProxy failed:', e);
        }
    }

    // =========================================================================
    // 3. FONCTION DE GESTION DES IFRAMES
    // =========================================================================

    /**
     * Gère la création d'un iframe
     * @param {Function} target - Fonction originale
     * @param {Object} thisArg - Contexte d'appel
     * @param {Array} args - Arguments
     * @returns {HTMLIFrameElement} L'iframe créé
     */
    function handleIframeCreation(target, thisArg, args) {
        // Créer l'iframe
        var iframe = target.apply(thisArg, args);

        if (!iframe || typeof iframe !== 'object') {
            return iframe;
        }

        // Garder une référence à l'original
        var _iframe = iframe;
        var _srcdoc = _iframe.srcdoc;

        // Patcher contentWindow immédiatement
        addContentWindowProxy(iframe);

        // Ajouter un hook pour srcdoc
        try {
            Object.defineProperty(iframe, 'srcdoc', {
                configurable: true,
                get: function() {
                    return _iframe.srcdoc;
                },
                set: function(newValue) {
                    // Appliquer le proxy avant de définir srcdoc
                    addContentWindowProxy(this);
                    
                    // Restaurer la propriété srcdoc normale
                    Object.defineProperty(iframe, 'srcdoc', {
                        configurable: false,
                        writable: false,
                        value: _srcdoc
                    });
                    
                    // Définir la nouvelle valeur
                    _iframe.srcdoc = newValue;
                }
            });
        } catch (e) {
            // Fallback: définir srcdoc directement
            console.debug('[stealth] srcdoc hook failed:', e);
        }

        return iframe;
    }

    // =========================================================================
    // 4. FONCTION D'INTERCEPTION DE LA CRÉATION D'IFRAMES
    // =========================================================================

    /**
     * Ajoute un intercepteur pour la création d'iframes
     */
    function addIframeCreationSniffer() {
        // Vérifier que document existe
        if (typeof document === 'undefined') {
            console.warn('[stealth] document not available, iframe sniffing skipped');
            return;
        }

        // Handler pour createElement
        var createElementHandler = {
            /**
             * Intercepte les appels à createElement
             */
            apply: function(target, thisArg, args) {
                // Vérifier si c'est un iframe
                var isIframe = args && args.length && 
                              typeof args[0] === 'string' && 
                              args[0].toLowerCase() === 'iframe';
                
                if (!isIframe) {
                    // Comportement normal
                    return target.apply(thisArg, args);
                } else {
                    // Intercepter la création d'iframe
                    return handleIframeCreation(target, thisArg, args);
                }
            }
        };

        // Appliquer le proxy
        try {
            replaceWithProxyFn(document, 'createElement', createElementHandler);
        } catch (e) {
            console.warn('[stealth] addIframeCreationSniffer failed:', e);
        }
    }

    // =========================================================================
    // 5. PATCH DES IFRAMES EXISTANTS
    // =========================================================================

    /**
     * Patch les iframes déjà présents dans la page
     */
    function patchExistingIframes() {
        try {
            var iframes = document.querySelectorAll('iframe');
            for (var i = 0; i < iframes.length; i++) {
                addContentWindowProxy(iframes[i]);
            }
        } catch (e) {
            console.debug('[stealth] patchExistingIframes failed:', e);
        }
    }

    // =========================================================================
    // 6. INITIALISATION
    // =========================================================================

    // Ajouter l'intercepteur
    addIframeCreationSniffer();

    // Patcher les iframes existants
    patchExistingIframes();

    // =========================================================================
    // 7. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] iframe.contentWindow.js loaded successfully');
        console.log('[stealth] hasUtils:', hasUtils);
    }

})();