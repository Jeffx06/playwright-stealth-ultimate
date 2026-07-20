/**
 * canvas.js
 * Évasion pour le fingerprinting Canvas
 * 
 * Ajoute un bruit déterministe aux données Canvas pour masquer
 * les caractéristiques du système et éviter le fingerprinting.
 * 
 * Problème ciblé: Les scripts de détection utilisent l'API Canvas
 * pour générer une empreinte unique du système de rendu.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que opts existe
    var opts = window.__STEALTH_OPTS__ || {};

    // Vérifier que Canvas existe
    if (typeof HTMLCanvasElement === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] HTMLCanvasElement not available, skipping canvas.js');
        }
        return;
    }

    // =========================================================================
    // 2. FONCTION DE BRUIT DÉTERMINISTE
    // =========================================================================

    /**
     * Génère une valeur de bruit déterministe basée sur une graine
     * @param {number} seed - Graine pour le générateur
     * @param {number} x - Coordonnée X
     * @param {number} y - Coordonnée Y
     * @param {number} channel - Canal de couleur (0=R, 1=G, 2=B, 3=A)
     * @returns {number} Valeur de bruit entre -1 et 1
     */
    function deterministicNoise(seed, x, y, channel) {
        // Combiner la graine, les coordonnées et le canal
        var value = seed + x * 0.01 + y * 0.013 + channel * 0.017;
        // Utiliser une fonction sinusoïdale pour générer un bruit pseudo-aléatoire
        var noise = Math.sin(value * 10000) * Math.cos(value * 7777) * Math.sin(value * 5555);
        // Normaliser entre -1 et 1
        return Math.max(-1, Math.min(1, noise));
    }

    /**
     * Obtient la graine pour le bruit Canvas
     * @returns {number} Graine de bruit
     */
    function getCanvasSeed() {
        // Utiliser la seed du profil si disponible
        if (typeof opts.seed !== 'undefined') {
            return opts.seed;
        }
        // Utiliser une valeur basée sur le profil matériel
        if (opts.hardware_profile) {
            var profileHash = 0;
            for (var i = 0; i < opts.hardware_profile.length; i++) {
                profileHash = ((profileHash << 5) - profileHash) + opts.hardware_profile.charCodeAt(i);
                profileHash = profileHash & profileHash;
            }
            return Math.abs(profileHash);
        }
        // Valeur par défaut
        return 12345;
    }

    // =========================================================================
    // 3. PATCH DE CanvasRenderingContext2D.prototype.getImageData
    // =========================================================================

    /**
     * Patch getImageData pour ajouter du bruit déterministe
     */
    function patchGetImageData() {
        try {
            if (typeof CanvasRenderingContext2D === 'undefined' || !CanvasRenderingContext2D.prototype) {
                return;
            }

            var seed = getCanvasSeed();
            var originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

            CanvasRenderingContext2D.prototype.getImageData = function(x, y, w, h) {
                // Appeler la méthode originale
                var result = originalGetImageData.call(this, x, y, w, h);

                // Ajouter du bruit déterministe aux données
                var data = result.data;
                var noiseAmount = 0.5 + (seed % 50) / 100;

                for (var py = 0; py < h; py++) {
                    for (var px = 0; px < w; px++) {
                        var idx = (py * w + px) * 4;
                        // Ajouter du bruit à chaque canal
                        for (var channel = 0; channel < 4; channel++) {
                            var noise = deterministicNoise(seed, x + px, y + py, channel) * noiseAmount;
                            data[idx + channel] = Math.max(0, Math.min(255, data[idx + channel] + noise));
                        }
                    }
                }

                return result;
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] CanvasRenderingContext2D.getImageData patched');
            }

        } catch (e) {
            console.warn('[stealth] patchGetImageData error:', e);
        }
    }

    // =========================================================================
    // 4. PATCH DE HTMLCanvasElement.prototype.toDataURL
    // =========================================================================

    /**
     * Patch toDataURL pour ajouter du bruit déterministe
     */
    function patchToDataURL() {
        try {
            if (typeof HTMLCanvasElement === 'undefined' || !HTMLCanvasElement.prototype) {
                return;
            }

            var seed = getCanvasSeed();
            var originalToDataURL = HTMLCanvasElement.prototype.toDataURL;

            HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
                // Pour PNG, ajouter du bruit avant de générer l'URL
                if (!type || type === 'image/png') {
                    var ctx = this.getContext('2d');
                    if (ctx) {
                        var w = this.width;
                        var h = this.height;
                        var imageData = ctx.getImageData(0, 0, w, h);
                        var data = imageData.data;
                        var noiseAmount = 0.3 + (seed % 30) / 100;

                        for (var i = 0; i < data.length; i += 4) {
                            for (var channel = 0; channel < 3; channel++) {
                                var px = (i / 4) % w;
                                var py = Math.floor((i / 4) / w);
                                var noise = deterministicNoise(seed + i, px, py, channel) * noiseAmount;
                                data[i + channel] = Math.max(0, Math.min(255, data[i + channel] + noise));
                            }
                        }
                        ctx.putImageData(imageData, 0, 0);
                    }
                }

                return originalToDataURL.call(this, type, quality);
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] HTMLCanvasElement.toDataURL patched');
            }

        } catch (e) {
            console.warn('[stealth] patchToDataURL error:', e);
        }
    }

    // =========================================================================
    // 5. PATCH DE HTMLCanvasElement.prototype.toBlob
    // =========================================================================

    /**
     * Patch toBlob pour ajouter du bruit déterministe
     */
    function patchToBlob() {
        try {
            if (typeof HTMLCanvasElement === 'undefined' || !HTMLCanvasElement.prototype) {
                return;
            }

            if (typeof HTMLCanvasElement.prototype.toBlob !== 'function') {
                return;
            }

            var seed = getCanvasSeed();
            var originalToBlob = HTMLCanvasElement.prototype.toBlob;

            HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
                // Pour PNG, ajouter du bruit avant de générer le blob
                if (!type || type === 'image/png') {
                    var ctx = this.getContext('2d');
                    if (ctx) {
                        var w = this.width;
                        var h = this.height;
                        var imageData = ctx.getImageData(0, 0, w, h);
                        var data = imageData.data;
                        var noiseAmount = 0.3 + (seed % 30) / 100;

                        for (var i = 0; i < data.length; i += 4) {
                            for (var channel = 0; channel < 3; channel++) {
                                var px = (i / 4) % w;
                                var py = Math.floor((i / 4) / w);
                                var noise = deterministicNoise(seed + i + 1000, px, py, channel) * noiseAmount;
                                data[i + channel] = Math.max(0, Math.min(255, data[i + channel] + noise));
                            }
                        }
                        ctx.putImageData(imageData, 0, 0);
                    }
                }

                return originalToBlob.call(this, callback, type, quality);
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] HTMLCanvasElement.toBlob patched');
            }

        } catch (e) {
            console.warn('[stealth] patchToBlob error:', e);
        }
    }

    // =========================================================================
    // 6. PATCH DE ImageData
    // =========================================================================

    /**
     * Patch ImageData pour ajouter du bruit déterministe
     */
    function patchImageData() {
        try {
            if (typeof ImageData === 'undefined') {
                return;
            }

            var seed = getCanvasSeed();
            var originalImageData = ImageData;

            ImageData = function(data, width, height) {
                // Ajouter du bruit déterministe aux données
                if (data && data.length > 0) {
                    var noiseAmount = 0.3 + (seed % 30) / 100;
                    for (var i = 0; i < data.length; i += 4) {
                        for (var channel = 0; channel < 3; channel++) {
                            var px = (i / 4) % width;
                            var py = Math.floor((i / 4) / width);
                            var noise = deterministicNoise(seed + i + 2000, px, py, channel) * noiseAmount;
                            data[i + channel] = Math.max(0, Math.min(255, data[i + channel] + noise));
                        }
                    }
                }
                return new originalImageData(data, width, height);
            };

            // Copier le prototype
            ImageData.prototype = originalImageData.prototype;

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] ImageData patched');
            }

        } catch (e) {
            console.warn('[stealth] patchImageData error:', e);
        }
    }

    // =========================================================================
    // 7. PATCH DE OffscreenCanvas
    // =========================================================================

    /**
     * Patch OffscreenCanvas pour les environnements qui le supportent
     */
    function patchOffscreenCanvas() {
        try {
            if (typeof OffscreenCanvas === 'undefined') {
                return;
            }

            var seed = getCanvasSeed();

            // Patch getContext pour OffscreenCanvas
            var originalGetContext = OffscreenCanvas.prototype.getContext;
            OffscreenCanvas.prototype.getContext = function(type, options) {
                var ctx = originalGetContext.call(this, type, options);
                if (ctx && type === '2d') {
                    // Ajouter une référence pour identifier le patch
                    ctx.__stealth_patched = true;
                }
                return ctx;
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] OffscreenCanvas patched');
            }

        } catch (e) {
            console.warn('[stealth] patchOffscreenCanvas error:', e);
        }
    }

    // =========================================================================
    // 8. APPLICATION DES PATCHS
    // =========================================================================

    // Appliquer tous les patches
    patchGetImageData();
    patchToDataURL();
    patchToBlob();
    patchImageData();
    patchOffscreenCanvas();

    // =========================================================================
    // 9. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] canvas.js loaded successfully');
        console.log('[stealth] CanvasRenderingContext2D patched:',
            typeof CanvasRenderingContext2D !== 'undefined');
        console.log('[stealth] HTMLCanvasElement patched:',
            typeof HTMLCanvasElement !== 'undefined');
        console.log('[stealth] Canvas seed:', getCanvasSeed());
    }

})();