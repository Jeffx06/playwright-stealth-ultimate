/**
 * fonts.js
 * Évasion pour le fingerprinting des polices
 * 
 * Simule une liste réaliste de polices installées en fonction
 * de la plateforme pour éviter la détection.
 * 
 * Problème ciblé: Les scripts de détection utilisent les polices
 * installées comme métrique de fingerprinting.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: https://developer.mozilla.org/en-US/docs/Web/API/FontFace
 *            https://www.browserleaks.com/fonts
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que document existe
    if (typeof document === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] document not available, skipping fonts.js');
        }
        return;
    }

    // Vérifier que opts existe
    var opts = window.__STEALTH_OPTS__ || {};

    // =========================================================================
    // 2. LISTES DE POLICES PAR PLATEFORME
    // =========================================================================

    /**
     * Polices communes à toutes les plateformes
     */
    var COMMON_FONTS = [
        'Arial',
        'Arial Black',
        'Comic Sans MS',
        'Courier New',
        'Georgia',
        'Impact',
        'Times New Roman',
        'Trebuchet MS',
        'Verdana'
    ];

    /**
     * Polices spécifiques à Windows
     */
    var WINDOWS_FONTS = [
        'Calibri',
        'Cambria',
        'Candara',
        'Consolas',
        'Constantia',
        'Corbel',
        'Segoe UI',
        'Segoe UI Light',
        'Segoe UI Semibold',
        'Segoe UI Symbol',
        'Tahoma',
        'Lucida Sans Unicode',
        'MS Sans Serif',
        'MS Serif',
        'Palatino Linotype',
        'SimSun',
        'Microsoft Sans Serif'
    ];

    /**
     * Polices spécifiques à macOS
     */
    var MACOS_FONTS = [
        'Helvetica',
        'Helvetica Neue',
        'Menlo',
        'Monaco',
        'San Francisco',
        'SF Pro',
        'SF Compact',
        'Lucida Grande',
        'Apple Color Emoji',
        'Apple Symbols',
        'Geneva',
        'Chalkboard SE',
        'Marker Felt',
        'Papyrus'
    ];

    /**
     * Polices spécifiques à Linux
     */
    var LINUX_FONTS = [
        'DejaVu Sans',
        'DejaVu Serif',
        'DejaVu Sans Mono',
        'Liberation Sans',
        'Liberation Serif',
        'Liberation Mono',
        'Nimbus Sans L',
        'Nimbus Roman No9 L',
        'Nimbus Mono L',
        'FreeSans',
        'FreeSerif',
        'FreeMono',
        'URW Gothic L',
        'URW Bookman L',
        'URW Chancery L',
        'Bitstream Vera Sans',
        'Bitstream Vera Serif',
        'Bitstream Vera Sans Mono'
    ];

    /**
     * Polices de Google Fonts courantes (souvent utilisées pour le fingerprinting)
     */
    var COMMON_WEB_FONTS = [
        'Roboto',
        'Open Sans',
        'Lato',
        'Montserrat',
        'Oswald',
        'Raleway',
        'PT Sans',
        'Ubuntu',
        'Noto Sans',
        'Source Sans Pro',
        'Merriweather',
        'Playfair Display',
        'Poppins',
        'Nunito',
        'Quicksand'
    ];

    /**
     * Obtient la liste des polices pour la plateforme
     * @returns {Array} Liste des polices
     */
    function getFontList() {
        // Si une liste personnalisée est spécifiée
        if (opts.fonts && Array.isArray(opts.fonts) && opts.fonts.length > 0) {
            return opts.fonts;
        }

        // Déterminer la plateforme
        var ua = navigator.userAgent || '';
        var isWindows = ua.includes('Windows');
        var isMac = ua.includes('Macintosh');
        var isLinux = ua.includes('Linux') && !ua.includes('Android');

        // Si une plateforme est spécifiée dans les options
        if (opts.os_type) {
            if (opts.os_type === 'windows') isWindows = true;
            if (opts.os_type === 'macos') isMac = true;
            if (opts.os_type === 'linux') isLinux = true;
        }

        // Construire la liste
        var fonts = [];

        // Ajouter les polices communes
        fonts = fonts.concat(COMMON_FONTS);

        // Ajouter les polices spécifiques à la plateforme
        if (isWindows) {
            fonts = fonts.concat(WINDOWS_FONTS);
        } else if (isMac) {
            fonts = fonts.concat(MACOS_FONTS);
        } else if (isLinux) {
            fonts = fonts.concat(LINUX_FONTS);
        } else {
            // Fallback: toutes les plateformes
            fonts = fonts.concat(WINDOWS_FONTS);
            fonts = fonts.concat(MACOS_FONTS);
            fonts = fonts.concat(LINUX_FONTS);
        }

        // Ajouter quelques polices web courantes
        fonts = fonts.concat(COMMON_WEB_FONTS.slice(0, 5));

        // Supprimer les doublons
        var uniqueFonts = [];
        var seen = {};
        for (var i = 0; i < fonts.length; i++) {
            var font = fonts[i];
            if (!seen[font]) {
                seen[font] = true;
                uniqueFonts.push(font);
            }
        }

        return uniqueFonts;
    }

    // =========================================================================
    // 3. PATCH DE document.fonts
    // =========================================================================

    var fontList = getFontList();

    /**
     * Patch document.fonts.check()
     * Intercepte les vérifications de polices
     */
    function patchFontsCheck() {
        try {
            if (typeof document.fonts === 'undefined' || typeof document.fonts.check !== 'function') {
                return;
            }

            var originalCheck = document.fonts.check;

            document.fonts.check = function(font, text) {
                // Extraire le nom de la police
                var fontName = font;
                if (typeof font === 'string') {
                    // Extraire le nom après le dernier espace (pour les déclarations de police)
                    var parts = font.split(' ');
                    if (parts.length > 1) {
                        fontName = parts[parts.length - 1];
                    }
                    // Enlever les guillemets
                    fontName = fontName.replace(/["']/g, '');
                } else if (font && typeof font === 'object' && font.family) {
                    fontName = font.family;
                }

                // Normaliser le nom
                fontName = fontName.replace(/,.*$/, '').trim();

                // Vérifier si la police est dans notre liste
                var isInstalled = fontList.some(function(f) {
                    return f.toLowerCase() === fontName.toLowerCase() ||
                           f.toLowerCase().includes(fontName.toLowerCase()) ||
                           fontName.toLowerCase().includes(f.toLowerCase());
                });

                // Si la police n'est pas dans notre liste, utiliser le comportement normal
                if (!isInstalled) {
                    return originalCheck.call(this, font, text);
                }

                // Retourner true pour les polices installées
                return true;
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] document.fonts.check patched');
            }

        } catch (e) {
            console.warn('[stealth] patchFontsCheck error:', e);
        }
    }

    /**
     * Patch document.fonts.ready
     * Simule le chargement des polices
     */
    function patchFontsReady() {
        try {
            if (typeof document.fonts === 'undefined' || typeof document.fonts.ready === 'undefined') {
                return;
            }

            // La propriété ready existe déjà, mais on peut la patcher pour
            // s'assurer qu'elle retourne une Promise résolue rapidement
            var originalReady = document.fonts.ready;

            Object.defineProperty(document.fonts, 'ready', {
                get: function() {
                    return originalReady || Promise.resolve(document.fonts);
                },
                configurable: true,
                enumerable: true
            });

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] document.fonts.ready patched');
            }

        } catch (e) {
            console.warn('[stealth] patchFontsReady error:', e);
        }
    }

    /**
     * Patch document.fonts.load()
     * Simule le chargement des polices
     */
    function patchFontsLoad() {
        try {
            if (typeof document.fonts === 'undefined' || typeof document.fonts.load !== 'function') {
                return;
            }

            var originalLoad = document.fonts.load;

            document.fonts.load = function(font, text) {
                // Vérifier si c'est une police que nous connaissons
                var fontName = font;
                if (typeof font === 'string') {
                    var parts = font.split(' ');
                    if (parts.length > 1) {
                        fontName = parts[parts.length - 1];
                    }
                    fontName = fontName.replace(/["']/g, '');
                }

                var isKnown = fontList.some(function(f) {
                    return f.toLowerCase() === fontName.toLowerCase() ||
                           f.toLowerCase().includes(fontName.toLowerCase());
                });

                if (isKnown) {
                    // Retourner une Promise résolue avec un FontFace simulé
                    var fontFace = {
                        family: fontName,
                        loaded: true,
                        status: 'loaded',
                        load: function() { return Promise.resolve(this); }
                    };
                    return Promise.resolve([fontFace]);
                }

                // Comportement normal pour les polices inconnues
                return originalLoad.call(this, font, text);
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] document.fonts.load patched');
            }

        } catch (e) {
            console.warn('[stealth] patchFontsLoad error:', e);
        }
    }

    // =========================================================================
    // 4. PATCH DE Canvas pour le fingerprinting de polices
    // =========================================================================

    /**
     * Patch Canvas pour masquer les différences de rendu des polices
     */
    function patchCanvasFonts() {
        try {
            if (typeof CanvasRenderingContext2D === 'undefined') {
                return;
            }

            var originalFillText = CanvasRenderingContext2D.prototype.fillText;
            var originalMeasureText = CanvasRenderingContext2D.prototype.measureText;

            // Patch fillText pour ajouter du bruit
            CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
                // Vérifier si le texte est une police connue
                var font = this.font || '';
                var isKnown = fontList.some(function(f) {
                    return font.toLowerCase().includes(f.toLowerCase());
                });

                if (isKnown) {
                    // Ajouter un léger bruit aux coordonnées
                    var noiseX = (Math.sin(x) * 0.01) || 0;
                    var noiseY = (Math.cos(y) * 0.01) || 0;
                    return originalFillText.call(this, text, x + noiseX, y + noiseY, maxWidth);
                }

                return originalFillText.call(this, text, x, y, maxWidth);
            };

            // Patch measureText pour ajouter du bruit
            CanvasRenderingContext2D.prototype.measureText = function(text) {
                var result = originalMeasureText.call(this, text);

                // Ajouter un bruit déterministe basé sur la taille du texte
                if (text && text.length > 0) {
                    var seed = 12345;
                    var noise = (Math.sin(text.length * seed) * 0.001) || 0;
                    result.width = result.width + noise;
                }

                return result;
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] Canvas fonts patched');
            }

        } catch (e) {
            console.warn('[stealth] patchCanvasFonts error:', e);
        }
    }

    // =========================================================================
    // 5. PATCH DE FontFace
    // =========================================================================

    /**
     * Patch FontFace pour simuler des polices installées
     */
    function patchFontFace() {
        try {
            if (typeof FontFace === 'undefined') {
                return;
            }

            var originalFontFace = FontFace;

            FontFace = function(family, source, descriptors) {
                // Vérifier si la police est dans notre liste
                var isKnown = fontList.some(function(f) {
                    return f.toLowerCase() === family.toLowerCase();
                });

                // Créer l'instance
                var instance = new originalFontFace(family, source, descriptors);

                // Si la police est connue, la marquer comme chargée
                if (isKnown) {
                    Object.defineProperty(instance, 'status', {
                        value: 'loaded',
                        writable: false,
                        enumerable: true,
                        configurable: true
                    });
                    Object.defineProperty(instance, 'loaded', {
                        value: Promise.resolve(instance),
                        writable: false,
                        enumerable: true,
                        configurable: true
                    });
                }

                return instance;
            };

            // Copier le prototype
            FontFace.prototype = originalFontFace.prototype;
            FontFace.load = originalFontFace.load;

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] FontFace patched');
            }

        } catch (e) {
            console.warn('[stealth] patchFontFace error:', e);
        }
    }

    // =========================================================================
    // 6. EXPOSITION DE LA LISTE DES POLICES
    // =========================================================================

    /**
     * Expose la liste des polices simulées pour le débogage
     */
    function exposeFontList() {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            window.__STEALTH_FONTS__ = fontList;
        }
    }

    // =========================================================================
    // 7. APPLICATION DES PATCHS
    // =========================================================================

    // Appliquer tous les patches
    patchFontsCheck();
    patchFontsReady();
    patchFontsLoad();
    patchCanvasFonts();
    patchFontFace();
    exposeFontList();

    // =========================================================================
    // 8. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] fonts.js loaded successfully');
        console.log('[stealth] Fonts simulated:', fontList.length);
        console.log('[stealth] First 10 fonts:', fontList.slice(0, 10).join(', '));
        console.log('[stealth] document.fonts.check patched:', typeof document.fonts.check === 'function');
        console.log('[stealth] document.fonts.load patched:', typeof document.fonts.load === 'function');
        console.log('[stealth] FontFace patched:', typeof FontFace !== 'undefined');
    }

})();