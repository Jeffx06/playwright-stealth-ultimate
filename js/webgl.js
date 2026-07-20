/**
 * webgl.js
 * Évasion pour WebGL - Paramètres GPU et extensions
 * 
 * Intercepte les appels à getParameter et getSupportedExtensions
 * pour masquer les informations GPU réelles et retourner des
 * valeurs réalistes et cohérentes.
 * 
 * Problème ciblé: Les scripts de détection utilisent WebGL pour
 * identifier le GPU, les capacités et les extensions.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
 *           https://www.khronos.org/registry/webgl/specs/latest/1.0/
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que navigator existe
    if (typeof navigator === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] navigator not available, skipping webgl.js');
        }
        return;
    }

    // Vérifier que opts existe
    var opts = window.__STEALTH_OPTS__ || {};

    // Vérifier que WebGLRenderingContext existe
    if (typeof WebGLRenderingContext === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] WebGLRenderingContext not available, skipping webgl.js');
        }
        return;
    }

    // =========================================================================
    // 2. PROFILS GPU
    // =========================================================================

    /**
     * Profils GPU réalistes
     */
    var GPU_PROFILES = {
        // Intel (intégré)
        'intel_uhd': {
            vendor: 'Intel Inc.',
            renderer: 'ANGLE (Intel, Intel UHD Graphics Direct3D11)',
            maxTextureSize: 16384,
            maxVertexUniformVectors: 128,
            maxFragmentUniformVectors: 64,
            maxVaryingVectors: 8,
            maxCombinedTextureImageUnits: 80,
            extensions: [
                'ANGLE_instanced_arrays',
                'EXT_blend_minmax',
                'EXT_color_buffer_float',
                'EXT_disjoint_timer_query',
                'EXT_texture_compression_bptc',
                'EXT_texture_compression_rgtc',
                'EXT_texture_filter_anisotropic',
                'OES_element_index_uint',
                'OES_fbo_render_mipmap',
                'OES_standard_derivatives',
                'OES_texture_float',
                'OES_texture_float_linear',
                'OES_texture_half_float',
                'OES_texture_half_float_linear',
                'WEBGL_color_buffer_float',
                'WEBGL_compressed_texture_s3tc',
                'WEBGL_compressed_texture_s3tc_srgb',
                'WEBGL_debug_renderer_info',
                'WEBGL_debug_shaders',
                'WEBGL_depth_texture',
                'WEBGL_draw_buffers',
                'WEBGL_lose_context',
                'WEBGL_multi_draw'
            ]
        },
        'intel_iris': {
            vendor: 'Intel Inc.',
            renderer: 'ANGLE (Intel, Intel Iris Xe Graphics Direct3D11)',
            maxTextureSize: 16384,
            maxVertexUniformVectors: 256,
            maxFragmentUniformVectors: 128,
            maxVaryingVectors: 16,
            maxCombinedTextureImageUnits: 96,
            extensions: [
                'ANGLE_instanced_arrays',
                'EXT_blend_minmax',
                'EXT_color_buffer_float',
                'EXT_disjoint_timer_query',
                'EXT_texture_compression_bptc',
                'EXT_texture_compression_rgtc',
                'EXT_texture_filter_anisotropic',
                'OES_element_index_uint',
                'OES_fbo_render_mipmap',
                'OES_standard_derivatives',
                'OES_texture_float',
                'OES_texture_float_linear',
                'OES_texture_half_float',
                'OES_texture_half_float_linear',
                'WEBGL_color_buffer_float',
                'WEBGL_compressed_texture_s3tc',
                'WEBGL_compressed_texture_s3tc_srgb',
                'WEBGL_debug_renderer_info',
                'WEBGL_debug_shaders',
                'WEBGL_depth_texture',
                'WEBGL_draw_buffers',
                'WEBGL_lose_context',
                'WEBGL_multi_draw'
            ]
        },
        'nvidia_rtx_3060': {
            vendor: 'NVIDIA Corporation',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11)',
            maxTextureSize: 32768,
            maxVertexUniformVectors: 512,
            maxFragmentUniformVectors: 256,
            maxVaryingVectors: 32,
            maxCombinedTextureImageUnits: 128,
            extensions: [
                'ANGLE_instanced_arrays',
                'EXT_blend_minmax',
                'EXT_color_buffer_float',
                'EXT_disjoint_timer_query',
                'EXT_float_blend',
                'EXT_texture_compression_bptc',
                'EXT_texture_compression_rgtc',
                'EXT_texture_filter_anisotropic',
                'OES_element_index_uint',
                'OES_fbo_render_mipmap',
                'OES_standard_derivatives',
                'OES_texture_float',
                'OES_texture_float_linear',
                'OES_texture_half_float',
                'OES_texture_half_float_linear',
                'WEBGL_color_buffer_float',
                'WEBGL_compressed_texture_s3tc',
                'WEBGL_compressed_texture_s3tc_srgb',
                'WEBGL_debug_renderer_info',
                'WEBGL_debug_shaders',
                'WEBGL_depth_texture',
                'WEBGL_draw_buffers',
                'WEBGL_lose_context',
                'WEBGL_multi_draw'
            ]
        },
        'nvidia_rtx_4080': {
            vendor: 'NVIDIA Corporation',
            renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11)',
            maxTextureSize: 32768,
            maxVertexUniformVectors: 1024,
            maxFragmentUniformVectors: 512,
            maxVaryingVectors: 64,
            maxCombinedTextureImageUnits: 192,
            extensions: [
                'ANGLE_instanced_arrays',
                'EXT_blend_minmax',
                'EXT_color_buffer_float',
                'EXT_disjoint_timer_query',
                'EXT_float_blend',
                'EXT_texture_compression_bptc',
                'EXT_texture_compression_rgtc',
                'EXT_texture_filter_anisotropic',
                'OES_element_index_uint',
                'OES_fbo_render_mipmap',
                'OES_standard_derivatives',
                'OES_texture_float',
                'OES_texture_float_linear',
                'OES_texture_half_float',
                'OES_texture_half_float_linear',
                'WEBGL_color_buffer_float',
                'WEBGL_compressed_texture_s3tc',
                'WEBGL_compressed_texture_s3tc_srgb',
                'WEBGL_debug_renderer_info',
                'WEBGL_debug_shaders',
                'WEBGL_depth_texture',
                'WEBGL_draw_buffers',
                'WEBGL_lose_context',
                'WEBGL_multi_draw'
            ]
        },
        'apple_m2': {
            vendor: 'Apple Inc.',
            renderer: 'ANGLE (Apple, Apple M2 GPU OpenGL)',
            maxTextureSize: 16384,
            maxVertexUniformVectors: 256,
            maxFragmentUniformVectors: 128,
            maxVaryingVectors: 16,
            maxCombinedTextureImageUnits: 96,
            extensions: [
                'ANGLE_instanced_arrays',
                'EXT_blend_minmax',
                'EXT_color_buffer_float',
                'EXT_disjoint_timer_query',
                'EXT_texture_compression_bptc',
                'EXT_texture_compression_rgtc',
                'EXT_texture_filter_anisotropic',
                'OES_element_index_uint',
                'OES_fbo_render_mipmap',
                'OES_standard_derivatives',
                'OES_texture_float',
                'OES_texture_float_linear',
                'OES_texture_half_float',
                'OES_texture_half_float_linear',
                'WEBGL_color_buffer_float',
                'WEBGL_compressed_texture_s3tc',
                'WEBGL_compressed_texture_s3tc_srgb',
                'WEBGL_debug_renderer_info',
                'WEBGL_debug_shaders',
                'WEBGL_depth_texture',
                'WEBGL_draw_buffers',
                'WEBGL_lose_context',
                'WEBGL_multi_draw'
            ]
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
            var profile = {
                vendor: opts.webgl_vendor || 'Intel Inc.',
                renderer: opts.webgl_renderer || 'ANGLE (Intel, Intel Iris Xe Graphics Direct3D11)',
                maxTextureSize: opts.webgl_max_texture_size || 16384,
                maxVertexUniformVectors: opts.webgl_max_vertex_uniform_vectors || 256,
                maxFragmentUniformVectors: opts.webgl_max_fragment_uniform_vectors || 128,
                maxVaryingVectors: opts.webgl_max_varying_vectors || 16,
                maxCombinedTextureImageUnits: opts.webgl_max_combined_texture_image_units || 96,
                extensions: opts.webgl_extensions || GPU_PROFILES['intel_iris'].extensions
            };
            return profile;
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
    // 3. CONSTANTES WEBGL
    // =========================================================================

    var WEBGL_CONSTANTS = {
        // UNMASKED_VENDOR_WEBGL
        UNMASKED_VENDOR_WEBGL: 37445,
        // UNMASKED_RENDERER_WEBGL
        UNMASKED_RENDERER_WEBGL: 37446,
        // MAX_TEXTURE_SIZE
        MAX_TEXTURE_SIZE: 3379,
        // MAX_VERTEX_UNIFORM_VECTORS
        MAX_VERTEX_UNIFORM_VECTORS: 36347,
        // MAX_FRAGMENT_UNIFORM_VECTORS
        MAX_FRAGMENT_UNIFORM_VECTORS: 36349,
        // MAX_VARYING_VECTORS
        MAX_VARYING_VECTORS: 36348,
        // MAX_COMBINED_TEXTURE_IMAGE_UNITS
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 35661,
        // MAX_VERTEX_ATTRIBS
        MAX_VERTEX_ATTRIBS: 34921,
        // MAX_TEXTURE_IMAGE_UNITS
        MAX_TEXTURE_IMAGE_UNITS: 34930,
        // MAX_RENDERBUFFER_SIZE
        MAX_RENDERBUFFER_SIZE: 3377,
        // MAX_VIEWPORT_DIMS
        MAX_VIEWPORT_DIMS: 3386,
        // ALIASED_LINE_WIDTH_RANGE
        ALIASED_LINE_WIDTH_RANGE: 33914,
        // ALIASED_POINT_SIZE_RANGE
        ALIASED_POINT_SIZE_RANGE: 33913,
        // MAX_SAMPLES
        MAX_SAMPLES: 36183
    };

    // =========================================================================
    // 4. HANDLER PROXY POUR getParameter
    // =========================================================================

    /**
     * Handler Proxy pour getParameter
     */
    function createGetParameterHandler(profile) {
        return {
            apply: function(target, ctx, args) {
                var param = (args && args.length > 0) ? args[0] : null;

                // UNMASKED_VENDOR_WEBGL = 37445
                if (param === WEBGL_CONSTANTS.UNMASKED_VENDOR_WEBGL) {
                    return profile.vendor;
                }

                // UNMASKED_RENDERER_WEBGL = 37446
                if (param === WEBGL_CONSTANTS.UNMASKED_RENDERER_WEBGL) {
                    return profile.renderer;
                }

                // MAX_TEXTURE_SIZE = 3379
                if (param === WEBGL_CONSTANTS.MAX_TEXTURE_SIZE) {
                    return profile.maxTextureSize;
                }

                // MAX_VERTEX_UNIFORM_VECTORS = 36347
                if (param === WEBGL_CONSTANTS.MAX_VERTEX_UNIFORM_VECTORS) {
                    return profile.maxVertexUniformVectors;
                }

                // MAX_FRAGMENT_UNIFORM_VECTORS = 36349
                if (param === WEBGL_CONSTANTS.MAX_FRAGMENT_UNIFORM_VECTORS) {
                    return profile.maxFragmentUniformVectors;
                }

                // MAX_VARYING_VECTORS = 36348
                if (param === WEBGL_CONSTANTS.MAX_VARYING_VECTORS) {
                    return profile.maxVaryingVectors;
                }

                // MAX_COMBINED_TEXTURE_IMAGE_UNITS = 35661
                if (param === WEBGL_CONSTANTS.MAX_COMBINED_TEXTURE_IMAGE_UNITS) {
                    return profile.maxCombinedTextureImageUnits;
                }

                // MAX_VERTEX_ATTRIBS = 34921
                if (param === WEBGL_CONSTANTS.MAX_VERTEX_ATTRIBS) {
                    return 16;
                }

                // MAX_TEXTURE_IMAGE_UNITS = 34930
                if (param === WEBGL_CONSTANTS.MAX_TEXTURE_IMAGE_UNITS) {
                    return 16;
                }

                // MAX_RENDERBUFFER_SIZE = 3377
                if (param === WEBGL_CONSTANTS.MAX_RENDERBUFFER_SIZE) {
                    return profile.maxTextureSize;
                }

                // MAX_VIEWPORT_DIMS = 3386
                if (param === WEBGL_CONSTANTS.MAX_VIEWPORT_DIMS) {
                    return [profile.maxTextureSize, profile.maxTextureSize];
                }

                // ALIASED_LINE_WIDTH_RANGE = 33914
                if (param === WEBGL_CONSTANTS.ALIASED_LINE_WIDTH_RANGE) {
                    return [1, 10];
                }

                // ALIASED_POINT_SIZE_RANGE = 33913
                if (param === WEBGL_CONSTANTS.ALIASED_POINT_SIZE_RANGE) {
                    return [1, 1024];
                }

                // MAX_SAMPLES = 36183
                if (param === WEBGL_CONSTANTS.MAX_SAMPLES) {
                    return 4;
                }

                // Autres paramètres: comportement normal
                try {
                    return Reflect.apply(target, ctx, args);
                } catch (e) {
                    return target.apply(ctx, args);
                }
            }
        };
    }

    // =========================================================================
    // 5. HANDLER PROXY POUR getSupportedExtensions
    // =========================================================================

    /**
     * Handler Proxy pour getSupportedExtensions
     */
    function createGetSupportedExtensionsHandler(profile) {
        return {
            apply: function(target, ctx, args) {
                // Appeler la méthode originale
                var result = target.apply(ctx, args) || [];

                // Fusionner avec les extensions du profil
                var extensionSet = new Set(result);
                for (var i = 0; i < profile.extensions.length; i++) {
                    extensionSet.add(profile.extensions[i]);
                }

                // Filtrer les extensions de débogage (peuvent révéler l'automatisation)
                var filtered = Array.from(extensionSet).filter(function(ext) {
                    return ext !== 'WEBGL_debug_renderer_info' &&
                           ext !== 'WEBGL_debug_shaders';
                });

                return filtered;
            }
        };
    }

    // =========================================================================
    // 6. PATCH DE WebGLRenderingContext ET WebGL2RenderingContext
    // =========================================================================

    /**
     * Patch un contexte WebGL
     * @param {object} context - Le contexte (WebGLRenderingContext ou WebGL2RenderingContext)
     */
    function patchWebGLContext(context) {
        if (!context || typeof context !== 'object') {
            return;
        }

        try {
            var profile = getGpuProfile();

            // Patch getParameter
            var getParameterHandler = createGetParameterHandler(profile);
            var originalGetParameter = context.getParameter;

            // Remplacer getParameter par un Proxy
            var getParameterProxy = new Proxy(originalGetParameter, getParameterHandler);
            Object.defineProperty(context, 'getParameter', {
                value: getParameterProxy,
                writable: true,
                enumerable: true,
                configurable: true
            });

            // Patch getSupportedExtensions
            var getSupportedExtensionsHandler = createGetSupportedExtensionsHandler(profile);
            var originalGetSupportedExtensions = context.getSupportedExtensions;

            var getSupportedExtensionsProxy = new Proxy(originalGetSupportedExtensions, getSupportedExtensionsHandler);
            Object.defineProperty(context, 'getSupportedExtensions', {
                value: getSupportedExtensionsProxy,
                writable: true,
                enumerable: true,
                configurable: true
            });

            // Patch getExtension pour masquer WEBGL_debug_renderer_info
            var originalGetExtension = context.getExtension;
            context.getExtension = function(name) {
                if (name === 'WEBGL_debug_renderer_info' || name === 'WEBGL_debug_shaders') {
                    return null;
                }
                return originalGetExtension.call(this, name);
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] WebGL context patched');
            }

        } catch (e) {
            console.warn('[stealth] patchWebGLContext error:', e);
        }
    }

    // =========================================================================
    // 7. APPLICATION DES PATCHS
    // =========================================================================

    // Vérifier et patcher WebGLRenderingContext
    if (typeof WebGLRenderingContext !== 'undefined' && WebGLRenderingContext.prototype) {
        patchWebGLContext(WebGLRenderingContext.prototype);
    }

    // Vérifier et patcher WebGL2RenderingContext
    if (typeof WebGL2RenderingContext !== 'undefined' && WebGL2RenderingContext.prototype) {
        patchWebGLContext(WebGL2RenderingContext.prototype);
    }

    // =========================================================================
    // 8. PATCH DE HTMLCanvasElement.getContext
    // =========================================================================

    /**
     * Patch getContext pour intercepter les contextes WebGL
     */
    function patchGetContext() {
        try {
            if (typeof HTMLCanvasElement === 'undefined' || !HTMLCanvasElement.prototype) {
                return;
            }

            var originalGetContext = HTMLCanvasElement.prototype.getContext;

            HTMLCanvasElement.prototype.getContext = function(type, options) {
                var ctx = originalGetContext.call(this, type, options);

                // Si c'est un contexte WebGL, le patcher
                if (ctx && (type === 'webgl' || type === 'experimental-webgl' || type === 'webgl2')) {
                    patchWebGLContext(ctx);
                }

                return ctx;
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] HTMLCanvasElement.getContext patched');
            }

        } catch (e) {
            console.warn('[stealth] patchGetContext error:', e);
        }
    }

    // Appliquer le patch getContext
    patchGetContext();

    // =========================================================================
    // 9. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        var profile = getGpuProfile();
        console.log('[stealth] webgl.js loaded successfully');
        console.log('[stealth] GPU Profile:', profile);
        console.log('[stealth] WebGLRenderingContext patched:', typeof WebGLRenderingContext !== 'undefined');
        console.log('[stealth] WebGL2RenderingContext patched:', typeof WebGL2RenderingContext !== 'undefined');
        console.log('[stealth] HTMLCanvasElement.getContext patched:', typeof HTMLCanvasElement !== 'undefined');
    }

})();