/**
 * webgl.anisotropy.js
 * Évasion pour l'extension WebGL EXT_texture_filter_anisotropic
 * 
 * Simule l'extension d'anisotropie de texture pour masquer les
 * environnements headless qui ne la supportent pas.
 * 
 * Problème ciblé: Les scripts de détection vérifient la présence
 * de l'extension EXT_texture_filter_anisotropic.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: https://registry.khronos.org/webgl/extensions/EXT_texture_filter_anisotropic/
 *            Constante: MAX_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FF
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. CONFIGURATION
    // =========================================================================

    var opts = window.__STEALTH_OPTS__ || {};

    // Valeur par défaut: 16 (standard pour les GPU modernes)
    var MAX_ANISOTROPY = opts.webgl_max_anisotropy || 16;

    // =========================================================================
    // 2. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    if (typeof WebGLRenderingContext === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] WebGLRenderingContext not available');
        }
        return;
    }

    // Vérifier si utils est disponible
    var hasUtils = typeof window.__stealth_utils__ !== 'undefined' &&
                   typeof window.__stealth_utils__.safeguard === 'function';

    // =========================================================================
    // 3. CONSTANTES
    // =========================================================================

    var CONSTANTS = {
        // MAX_TEXTURE_MAX_ANISOTROPY_EXT
        MAX_TEXTURE_MAX_ANISOTROPY_EXT: 0x84FF,
        // EXT_texture_filter_anisotropic
        EXTENSION_NAME: 'EXT_texture_filter_anisotropic'
    };

    // =========================================================================
    // 4. CRÉATION DE L'OBJET EXTENSION
    // =========================================================================

    /**
     * Crée un objet d'extension réaliste
     * @returns {object} Objet d'extension
     */
    function createExtensionObject() {
        return {
            // Nom de l'extension
            NAME: CONSTANTS.EXTENSION_NAME,

            // Constantes
            MAX_TEXTURE_MAX_ANISOTROPY_EXT: CONSTANTS.MAX_TEXTURE_MAX_ANISOTROPY_EXT,

            // Méthodes (optionnelles)
            getMaxAnisotropy: function() {
                return MAX_ANISOTROPY;
            },

            // toString pour simuler le comportement natif
            toString: function() {
                return '[object WebGLExtension]';
            }
        };
    }

    // =========================================================================
    // 5. PATCH DE getExtension
    // =========================================================================

    /**
     * Patch getExtension pour retourner l'extension d'anisotropie
     * @param {object} proto - Prototype du contexte WebGL
     */
    function patchGetExtension(proto) {
        try {
            var originalGetExtension = proto.getExtension;

            if (!originalGetExtension) {
                return;
            }

            proto.getExtension = function(name) {
                // Si c'est l'extension d'anisotropie, retourner un objet réaliste
                if (name === CONSTANTS.EXTENSION_NAME) {
                    return createExtensionObject();
                }

                // Comportement normal pour les autres extensions
                return originalGetExtension.call(this, name);
            };

            // Sauvegarder la fonction
            if (hasUtils) {
                window.__stealth_utils__.safeguard(proto.getExtension, originalGetExtension);
            }

        } catch (e) {
            console.warn('[stealth] patchGetExtension error:', e);
        }
    }

    // =========================================================================
    // 6. PATCH DE getSupportedExtensions
    // =========================================================================

    /**
     * Patch getSupportedExtensions pour inclure l'extension d'anisotropie
     * @param {object} proto - Prototype du contexte WebGL
     */
    function patchGetSupportedExtensions(proto) {
        try {
            var originalGetSupportedExtensions = proto.getSupportedExtensions;

            if (!originalGetSupportedExtensions) {
                return;
            }

            proto.getSupportedExtensions = function() {
                // Obtenir la liste originale
                var extensions = originalGetSupportedExtensions.call(this) || [];

                // Ajouter l'extension d'anisotropie si elle n'est pas déjà présente
                if (extensions.indexOf(CONSTANTS.EXTENSION_NAME) === -1) {
                    extensions.push(CONSTANTS.EXTENSION_NAME);
                }

                return extensions;
            };

            // Sauvegarder la fonction
            if (hasUtils) {
                window.__stealth_utils__.safeguard(proto.getSupportedExtensions, originalGetSupportedExtensions);
            }

        } catch (e) {
            console.warn('[stealth] patchGetSupportedExtensions error:', e);
        }
    }

    // =========================================================================
    // 7. PATCH DE getParameter
    // =========================================================================

    /**
     * Patch getParameter pour retourner la valeur d'anisotropie
     * @param {object} proto - Prototype du contexte WebGL
     */
    function patchGetParameter(proto) {
        try {
            var originalGetParameter = proto.getParameter;

            if (!originalGetParameter) {
                return;
            }

            proto.getParameter = function(pname) {
                // MAX_TEXTURE_MAX_ANISOTROPY_EXT
                if (pname === CONSTANTS.MAX_TEXTURE_MAX_ANISOTROPY_EXT) {
                    return MAX_ANISOTROPY;
                }

                return originalGetParameter.call(this, pname);
            };

            // Sauvegarder la fonction
            if (hasUtils) {
                window.__stealth_utils__.safeguard(proto.getParameter, originalGetParameter);
            }

        } catch (e) {
            console.warn('[stealth] patchGetParameter error:', e);
        }
    }

    // =========================================================================
    // 8. APPLICATION DES PATCHS
    // =========================================================================

    /**
     * Applique tous les patches à un contexte WebGL
     * @param {object} proto - Prototype du contexte
     */
    function patchContext(proto) {
        if (!proto || typeof proto !== 'object') {
            return;
        }

        patchGetParameter(proto);
        patchGetExtension(proto);
        patchGetSupportedExtensions(proto);
    }

    // Patcher WebGLRenderingContext
    patchContext(WebGLRenderingContext.prototype);

    // Patcher WebGL2RenderingContext
    if (typeof WebGL2RenderingContext !== 'undefined') {
        patchContext(WebGL2RenderingContext.prototype);
    }

    // =========================================================================
    // 9. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] webgl.anisotropy.js loaded successfully');
        console.log('[stealth] MAX_ANISOTROPY:', MAX_ANISOTROPY);
        console.log('[stealth] WebGLRenderingContext patched:', true);
        console.log('[stealth] WebGL2RenderingContext patched:', typeof WebGL2RenderingContext !== 'undefined');
        console.log('[stealth] EXTENSION_NAME:', CONSTANTS.EXTENSION_NAME);
    }

})();