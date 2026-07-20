/**
 * navigator.plugins.js
 * Évasion pour navigator.plugins et navigator.mimeTypes
 * 
 * Simule les plugins et MIME types d'un vrai navigateur Chrome.
 * 
 * Problème ciblé: Les scripts de détection vérifient les plugins
 * et MIME types pour identifier les environnements headless.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: navigator.plugins et navigator.mimeTypes dans un vrai navigateur
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que navigator existe
    if (typeof navigator === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] navigator not available, skipping plugins');
        }
        return;
    }

    // Vérifier que generateMagicArray est disponible
    if (typeof generateMagicArray === 'undefined') {
        console.warn('[stealth] generateMagicArray not available, skipping plugins');
        return;
    }

    // Vérifier que utils est disponible
    const hasUtils = typeof utils !== 'undefined';

    // =========================================================================
    // 2. FONCTION DE FALLBACK POUR replaceProperty
    // =========================================================================

    /**
     * Fallback pour replaceProperty
     */
    function replacePropertyFallback(target, property, descriptor) {
        try {
            Object.defineProperty(target, property, {
                get: descriptor.get || function() { return undefined; },
                set: descriptor.set || function() {},
                configurable: true,
                enumerable: true
            });
        } catch (e) {
            console.warn('[stealth] replaceProperty fallback failed:', e);
        }
    }

    const replacePropertyFn = (hasUtils && typeof utils.replaceProperty === 'function')
        ? utils.replaceProperty
        : replacePropertyFallback;

    // =========================================================================
    // 3. DONNÉES
    // =========================================================================

    const PLUGIN_DATA = {
        mimeTypes: [
            {
                type: "application/pdf",
                suffixes: "pdf",
                description: "",
                __pluginName: "Chrome PDF Viewer"
            },
            {
                type: "application/x-google-chrome-pdf",
                suffixes: "pdf",
                description: "Portable Document Format",
                __pluginName: "Chrome PDF Plugin"
            },
            {
                type: "application/x-nacl",
                suffixes: "",
                description: "Native Client Executable",
                __pluginName: "Native Client"
            },
            {
                type: "application/x-pnacl",
                suffixes: "",
                description: "Portable Native Client Executable",
                __pluginName: "Native Client"
            },
            // MIME types supplémentaires pour plus de réalisme
            {
                type: "video/webm",
                suffixes: "webm",
                description: "WebM Video",
                __pluginName: "Chrome PDF Plugin"  // Associé à un plugin existant
            },
            {
                type: "audio/webm",
                suffixes: "webm",
                description: "WebM Audio",
                __pluginName: "Chrome PDF Plugin"
            }
        ],
        plugins: [
            {
                name: "Chrome PDF Plugin",
                filename: "internal-pdf-viewer",
                description: "Portable Document Format",
                __mimeTypes: ["application/x-google-chrome-pdf"]
            },
            {
                name: "Chrome PDF Viewer",
                filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
                description: "",
                __mimeTypes: ["application/pdf"]
            },
            {
                name: "Native Client",
                filename: "internal-nacl-plugin",
                description: "",
                __mimeTypes: ["application/x-nacl", "application/x-pnacl"]
            }
        ]
    };

    // =========================================================================
    // 4. GÉNÉRATION DES TABLEAUX MAGIQUES
    // =========================================================================

    // Ne pas redéfinir si déjà présent
    if (navigator.plugins && navigator.plugins.length > 0) {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.log('[stealth] navigator.plugins already present, skipping');
        }
        return;
    }

    // Générer les MIME types
    const mimeTypes = generateMagicArray(
        PLUGIN_DATA.mimeTypes,
        MimeTypeArray.prototype,
        MimeType.prototype,
        'type'
    );

    // Générer les plugins
    const plugins = generateMagicArray(
        PLUGIN_DATA.plugins,
        PluginArray.prototype,
        Plugin.prototype,
        'name'
    );

    // =========================================================================
    // 5. RÉFÉRENCES CROISÉES
    // =========================================================================

    /**
     * Crée une copie d'un plugin pour l'assigner comme enabledPlugin
     * @param {Object} plugin - Plugin source
     * @returns {Object} Copie du plugin
     */
    function createPluginCopy(plugin) {
        // Utiliser Object.assign pour éviter JSON.parse(JSON.stringify())
        const copy = Object.assign({}, plugin);
        // Copier les propriétés énumérables
        for (const key in plugin) {
            if (typeof plugin[key] !== 'function') {
                copy[key] = plugin[key];
            }
        }
        return copy;
    }

    // Références croisées
    for (const pluginData of PLUGIN_DATA.plugins) {
        if (pluginData.__mimeTypes) {
            for (const type of pluginData.__mimeTypes) {
                // Ajouter le MIME type au plugin
                const mimeType = mimeTypes[type];
                if (mimeType) {
                    // Ajouter le MIME type au plugin (par index)
                    const plugin = plugins[pluginData.name];
                    if (plugin) {
                        // Trouver l'index du MIME type dans le plugin
                        const index = pluginData.__mimeTypes.indexOf(type);
                        if (index !== -1) {
                            plugin[index] = mimeType;
                        }
                        // Ajouter l'accès direct par type
                        plugin[type] = mimeType;
                    }

                    // Ajouter enabledPlugin au MIME type
                    Object.defineProperty(mimeType, 'enabledPlugin', {
                        value: createPluginCopy(plugin),
                        writable: false,
                        enumerable: false, // Important: JSON.stringify
                        configurable: false
                    });
                }
            }
        }
    }

    // =========================================================================
    // 6. APPLICATION DU PATCH
    // =========================================================================

    try {
        const target = Object.getPrototypeOf(navigator);

        // Patch mimeTypes
        replacePropertyFn(target, 'mimeTypes', {
            get: function() {
                return mimeTypes;
            },
            configurable: true,
            enumerable: true
        });

        // Patch plugins
        replacePropertyFn(target, 'plugins', {
            get: function() {
                return plugins;
            },
            configurable: true,
            enumerable: true
        });

        // Vérifier que les propriétés sont bien définies
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.log('[stealth] navigator.plugins.js loaded successfully');
            console.log('[stealth] navigator.plugins.length:', navigator.plugins ? navigator.plugins.length : 0);
            console.log('[stealth] navigator.mimeTypes.length:', navigator.mimeTypes ? navigator.mimeTypes.length : 0);
        }

    } catch (e) {
        console.warn('[stealth] navigator.plugins.js error:', e);
    }

})();