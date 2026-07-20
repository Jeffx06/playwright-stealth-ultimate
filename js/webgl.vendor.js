/**
 * webgl.vendor.js
 * Évasion pour WebGL - Masquage du vendor et renderer
 * 
 * Intercepte les appels à getParameter pour masquer les informations
 * réelles du GPU et retourner des valeurs réalistes.
 * 
 * Problème ciblé: Les scripts de détection vérifient les informations
 * GPU via WebGL pour identifier les environnements headless.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
 * 
 * Constantes:
 * - UNMASKED_VENDOR_WEBGL = 37445
 * - UNMASKED_RENDERER_WEBGL = 37446
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que opts existe, sinon créer un objet par défaut
    var opts = window.__STEALTH_OPTS__ || {};

    // Vérifier que utils est disponible
    var hasUtils = typeof utils !== 'undefined';

    // =========================================================================
    // 2. FONCTION DE FALLBACK POUR replaceWithProxy
    // =========================================================================

    /**
     * Fallback pour replaceWithProxy si utils n'est pas disponible
     */
    function replaceWithProxyFallback(obj, propName, handler) {
        try {
            var original = obj[propName];
            var proxy = new Proxy(original, handler);
            Object.defineProperty(obj, propName, {
                value: proxy,
                writable: true,
                enumerable: true,
                configurable: true
            });
            return true;
        } catch (e) {
            console.warn('[stealth] replaceWithProxy fallback failed:', e);
            return false;
        }
    }

    /**
     * Fallback pour Reflect.apply si utils n'est pas disponible
     */
    function reflectApplyFallback(target, ctx, args) {
        try {
            return Reflect.apply(target, ctx, args);
        } catch (e) {
            return target.apply(ctx, args);
        }
    }

    // Sélectionner les méthodes appropriées
    var replaceWithProxyFn = (hasUtils && typeof utils.replaceWithProxy === 'function')
        ? utils.replaceWithProxy
        : replaceWithProxyFallback;

    var reflectApplyFn = (hasUtils && utils.cache && typeof utils.cache.Reflect !== 'undefined' && typeof utils.cache.Reflect.apply === 'function')
        ? utils.cache.Reflect.apply
        : reflectApplyFallback;

    // =========================================================================
    // 3. MAP DES VALEURS GPU RÉALISTES
    // =========================================================================

    /**
     * Profils GPU réalistes
     */
    var GPU_PROFILES = {
        // Intel (intégré)
        'intel_uhd': {
            vendor: 'Intel Inc.',
            renderer: 'ANGLE (Intel, Intel UHD Graphics Direct3D11)'
        },
        'intel_iris': {
            vendor: 'Intel Inc.',
            renderer: 'ANGLE (Intel, Intel Iris Xe Graphics Direct3D11)'
        },
        'intel_iris_pro': {
            vendor: 'Intel Inc.',
            renderer: 'ANGLE (Intel, Intel Iris Pro Graphics Direct3D11)'
        },
        // NVIDIA
        'nvidia_gtx_1650': {
            vendor: 'NVIDIA Corporation',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11)'
        },
        'nvidia_rtx_3060': {
            vendor: 'NVIDIA Corporation',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11)'
        },
        'nvidia_rtx_4080': {
            vendor: 'NVIDIA Corporation',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11)'
        },
        // AMD
        'amd_radeon': {
            vendor: 'AMD Corporation',
            renderer: 'ANGLE (AMD, AMD Radeon Graphics Direct3D11)'
        },
        // Apple
        'apple_m1': {
            vendor: 'Apple Inc.',
            renderer: 'ANGLE (Apple, Apple M1 GPU OpenGL)'
        },
        'apple_m2': {
            vendor: 'Apple Inc.',
            renderer: 'ANGLE (Apple, Apple M2 GPU OpenGL)'
        }
    };

    /**
     * Sélectionne un profil GPU en fonction des options
     * @returns {object} Profil GPU
     */
    function getGpuProfile() {
        // Si un profil est spécifié, l'utiliser
        if (opts.gpu_profile && GPU_PROFILES[opts.gpu_profile]) {
            return GPU_PROFILES[opts.gpu_profile];
        }

        // Utiliser les valeurs personnalisées si spécifiées
        if (opts.webgl_vendor || opts.webgl_renderer) {
            return {
                vendor: opts.webgl_vendor || 'Intel Inc.',
                renderer: opts.webgl_renderer || 'ANGLE (Intel, Intel Iris Xe Graphics Direct3D11)'
            };
        }

        // Détection basée sur la plateforme
        if (opts.os_type) {
            var osMap = {
                'windows': GPU_PROFILES['nvidia_rtx_3060'],
                'macos': GPU_PROFILES['apple_m2'],
                'linux': GPU_PROFILES['intel_iris']
            };
            if (osMap[opts.os_type]) {
                return osMap[opts.os_type];
            }
        }

        // Profil par défaut (le plus courant)
        return GPU_PROFILES['intel_iris'];
    }

    // =========================================================================
    // 4. HANDLER PROXY POUR getParameter
    // =========================================================================

    /**
     * Handler Proxy pour WebGLRenderingContext.getParameter
     */
    var getParameterProxyHandler = {
        apply: function(target, ctx, args) {
            var param = (args && args.length > 0) ? args[0] : null;

            // UNMASKED_VENDOR_WEBGL = 37445
            if (param === 37445) {
                return getGpuProfile().vendor;
            }

            // UNMASKED_RENDERER_WEBGL = 37446
            if (param === 37446) {
                return getGpuProfile().renderer;
            }

            // Autres paramètres: comportement normal
            try {
                return reflectApplyFn(target, ctx, args);
            } catch (e) {
                return target.apply(ctx, args);
            }
        }
    };

    // =========================================================================
    // 5. FONCTION D'AJOUT DE PROXY
    // =========================================================================

    /**
     * Ajoute un Proxy sur la méthode getParameter d'un contexte WebGL
     * @param {object} context - Le contexte WebGL (WebGLRenderingContext ou WebGL2RenderingContext)
     * @param {string} propName - Le nom de la propriété à patcher ('getParameter')
     */
    function addProxy(context, propName) {
        if (!context || typeof context !== 'object') {
            return false;
        }

        try {
            return replaceWithProxyFn(context, propName, getParameterProxyHandler);
        } catch (e) {
            console.warn('[stealth] addProxy failed for', context, e);
            return false;
        }
    }

    // =========================================================================
    // 6. APPLICATION DES PATCHS
    // =========================================================================

    // Vérifier et patcher WebGLRenderingContext
    if (typeof WebGLRenderingContext !== 'undefined' && WebGLRenderingContext.prototype) {
        addProxy(WebGLRenderingContext.prototype, 'getParameter');
    } else if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.warn('[stealth] WebGLRenderingContext not available');
    }

    // Vérifier et patcher WebGL2RenderingContext
    if (typeof WebGL2RenderingContext !== 'undefined' && WebGL2RenderingContext.prototype) {
        addProxy(WebGL2RenderingContext.prototype, 'getParameter');
    } else if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.warn('[stealth] WebGL2RenderingContext not available');
    }

    // =========================================================================
    // 7. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        var profile = getGpuProfile();
        console.log('[stealth] webgl.vendor.js loaded successfully');
        console.log('[stealth] GPU Profile:', profile);
        console.log('[stealth] WebGLRenderingContext patched:', !!WebGLRenderingContext);
        console.log('[stealth] WebGL2RenderingContext patched:', !!WebGL2RenderingContext);
    }

})();