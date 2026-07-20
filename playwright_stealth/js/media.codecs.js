/**
 * media.codecs.js
 * Évasion pour HTMLMediaElement.canPlayType()
 * 
 * Intercepte les appels à canPlayType pour retourner des valeurs réalistes
 * et empêcher la détection basée sur les codecs média.
 * 
 * Problème ciblé: Les scripts de détection vérifient les codecs supportés
 * par le navigateur pour identifier les environnements headless.
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
    // 2. FONCTION DE PARSING
    // =========================================================================

    /**
     * Parse une chaîne de type MIME avec codecs
     * @param {string} arg - Chaîne à parser (ex: "video/mp4; codecs=\"avc1.42E01E\"")
     * @returns {Object} Objet contenant mime, codecStr et codecs
     */
    function parseInput(arg) {
        if (typeof arg !== 'string') {
            return { mime: '', codecStr: '', codecs: [] };
        }

        // Nettoyer la chaîne
        const trimmed = arg.trim();
        const parts = trimmed.split(';');
        const mime = parts[0] ? parts[0].trim() : '';
        const codecStr = parts[1] ? parts[1].trim() : '';
        
        let codecs = [];
        if (codecStr && codecStr.includes('codecs="')) {
            // Extraire les codecs entre guillemets
            const match = codecStr.match(/codecs="([^"]*)"/);
            if (match && match[1]) {
                codecs = match[1]
                    .split(',')
                    .map(function(c) { return c.trim(); })
                    .filter(function(c) { return c !== ''; });
            }
        }

        return {
            mime: mime,
            codecStr: codecStr,
            codecs: codecs
        };
    }

    // =========================================================================
    // 3. MAP DES CODECS MP4
    // =========================================================================

    // Codecs MP4 couramment utilisés et leur support
    const MP4_CODECS = {
        // Video codecs
        'avc1.42E01E': 'probably',  // H.264 baseline
        'avc1.42001E': 'probably',  // H.264 baseline
        'avc1.4D401E': 'probably',  // H.264 main
        'avc1.64001F': 'probably',  // H.264 high
        'avc1.64001E': 'probably',  // H.264 high
        'avc1.640020': 'probably',  // H.264 high
        'avc1.640028': 'probably',  // H.264 high
        'avc1.640029': 'probably',  // H.264 high
        'avc1.64002A': 'probably',  // H.264 high
        'avc1.640033': 'probably',  // H.264 high
        
        // Audio codecs
        'mp4a.40.2': 'probably',    // AAC LC
        'mp4a.40.5': 'probably',    // HE-AAC v1
        'mp4a.40.29': 'probably',   // HE-AAC v2
        'mp4a.40.34': 'probably',   // MPEG-4 Audio
        'mp4a.40.40': 'probably',   // MPEG-4 Audio
        'mp4a.40.41': 'probably',   // MPEG-4 Audio
        'mp4a.67': 'probably',      // MPEG-2 AAC
        'mp4a.6B': 'probably',      // MPEG-1 Audio
    };

    // =========================================================================
    // 4. INTERCEPTEUR canPlayType
    // =========================================================================

    /**
     * Handler Proxy pour canPlayType
     */
    const canPlayTypeHandler = {
        /**
         * Intercepte les appels à canPlayType
         */
        apply: function(target, ctx, args) {
            // Si pas d'arguments, comportement normal
            if (!args || args.length === 0) {
                return target.apply(ctx, args);
            }

            const arg = args[0];
            if (typeof arg !== 'string') {
                return target.apply(ctx, args);
            }

            // Parser l'entrée
            const parsed = parseInput(arg);
            const mime = parsed.mime;
            const codecs = parsed.codecs;

            // =============================================================
            // 4.1. Cas spécifique: video/mp4
            // =============================================================
            if (mime === 'video/mp4') {
                // Si un codec est spécifié, vérifier s'il est supporté
                if (codecs.length > 0) {
                    // Vérifier chaque codec
                    for (var i = 0; i < codecs.length; i++) {
                        if (MP4_CODECS[codecs[i]] === 'probably') {
                            return 'probably';
                        }
                    }
                    // Codec non reconnu
                    return '';
                }
                // Sans codec, retourner 'maybe' (comme dans Chrome)
                return 'maybe';
            }

            // =============================================================
            // 4.2. Cas spécifique: audio/x-m4a
            // =============================================================
            if (mime === 'audio/x-m4a') {
                // Supporté seulement sans codec spécifié
                if (codecs.length === 0) {
                    return 'probably';
                }
                return '';
            }

            // =============================================================
            // 4.3. Cas spécifique: audio/aac
            // =============================================================
            if (mime === 'audio/aac') {
                // Supporté seulement sans codec spécifié
                if (codecs.length === 0) {
                    return 'probably';
                }
                return '';
            }

            // =============================================================
            // 4.4. Cas spécifique: video/webm
            // =============================================================
            if (mime === 'video/webm') {
                if (codecs.length > 0) {
                    // WebM codecs supportés
                    var webmCodecs = ['vp8', 'vp9', 'vp9.0', 'vp9.1', 'vp9.2', 'opus', 'vorbis'];
                    for (var j = 0; j < codecs.length; j++) {
                        if (webmCodecs.indexOf(codecs[j]) !== -1) {
                            return 'probably';
                        }
                    }
                    return '';
                }
                return 'probably';
            }

            // =============================================================
            // 4.5. Cas spécifique: audio/webm
            // =============================================================
            if (mime === 'audio/webm') {
                if (codecs.length > 0) {
                    var audioCodecs = ['opus', 'vorbis'];
                    for (var k = 0; k < codecs.length; k++) {
                        if (audioCodecs.indexOf(codecs[k]) !== -1) {
                            return 'probably';
                        }
                    }
                    return '';
                }
                return 'probably';
            }

            // =============================================================
            // 4.6. Cas spécifique: video/ogg
            // =============================================================
            if (mime === 'video/ogg') {
                if (codecs.length > 0) {
                    var oggCodecs = ['theora', 'vorbis'];
                    for (var l = 0; l < codecs.length; l++) {
                        if (oggCodecs.indexOf(codecs[l]) !== -1) {
                            return 'probably';
                        }
                    }
                    return '';
                }
                return 'probably';
            }

            // =============================================================
            // 4.7. Cas spécifique: audio/ogg
            // =============================================================
            if (mime === 'audio/ogg') {
                if (codecs.length > 0) {
                    if (codecs.indexOf('vorbis') !== -1 || codecs.indexOf('opus') !== -1) {
                        return 'probably';
                    }
                    return '';
                }
                return 'probably';
            }

            // =============================================================
            // 4.8. Comportement par défaut
            // =============================================================
            return target.apply(ctx, args);
        }
    };

    // =========================================================================
    // 5. APPLICATION DU PATCH
    // =========================================================================

    // Vérifier que HTMLMediaElement existe
    if (typeof HTMLMediaElement === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] HTMLMediaElement not available, skipping media.codecs.js');
        }
    } else {
        try {
            // Appliquer le proxy sur canPlayType
            replaceWithProxyFn(
                HTMLMediaElement.prototype,
                'canPlayType',
                canPlayTypeHandler
            );

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] media.codecs.js loaded successfully');
                console.log('[stealth] HTMLMediaElement.prototype.canPlayType patched');
                console.log('[stealth] MP4_CODECS:', Object.keys(MP4_CODECS).length + ' codecs');
            }

        } catch (e) {
            console.warn('[stealth] media.codecs.js error:', e);
        }
    }

})();