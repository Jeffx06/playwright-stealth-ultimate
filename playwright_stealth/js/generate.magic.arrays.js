/**
 * generate.magic.arrays.js
 * Génération de tableaux magiques pour navigator.plugins et navigator.mimeTypes
 * 
 * Ces tableaux imitent parfaitement le comportement des objets natifs
 * MimeTypeArray et PluginArray de Chrome.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: Comportement observé dans Chrome 80+
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que utils est disponible
    const hasUtils = typeof utils !== 'undefined';
    
    // Fonction de fallback pour createProxy
    function createProxyFallback(target, handler) {
        try {
            return new Proxy(target, handler);
        } catch (e) {
            console.warn('[stealth] createProxy fallback: returning target', e);
            return target;
        }
    }

    // Fonction de fallback pour Reflect.get
    function reflectGetFallback(target, property, receiver) {
        try {
            return Reflect.get(target, property, receiver);
        } catch (e) {
            // Fallback: accès direct
            return target[property];
        }
    }

    // Sélectionner la méthode appropriée
    const createProxyFn = (hasUtils && typeof utils.createProxy === 'function') 
        ? utils.createProxy 
        : createProxyFallback;

    const reflectGetFn = (hasUtils && utils.cache && typeof utils.cache.Reflect !== 'undefined' && typeof utils.cache.Reflect.get === 'function')
        ? utils.cache.Reflect.get
        : reflectGetFallback;

    // =========================================================================
    // 2. FONCTION DE GÉNÉRATION DES MOCKS
    // =========================================================================

    /**
     * Génère les fonctions mock pour item, namedItem et refresh
     * @param {Object} proto - Prototype de l'objet (MimeTypeArray ou PluginArray)
     * @param {string} itemMainProp - Propriété principale de l'item ('type' pour MimeType, 'name' pour Plugin)
     * @param {Array} dataArray - Tableau de données
     * @returns {Object} Objet contenant les fonctions mock
     */
    function generateFunctionMocks(proto, itemMainProp, dataArray) {
        // Vérifier que proto existe
        if (!proto) {
            proto = {
                item: function() {},
                namedItem: function() {},
                refresh: function() {},
                [Symbol.toStringTag]: 'Array'
            };
        }

        const tag = proto[Symbol.toStringTag] || 'Array';

        return {
            /**
             * item(index)
             * Retourne l'élément à l'index spécifié
             * @param {number|string} index - Index ou chaîne convertible en nombre
             * @returns {Object|null} L'élément ou null
             */
            item: createProxyFn(proto.item || function() {}, {
                apply: function(target, ctx, args) {
                    if (!args || args.length === 0) {
                        throw new TypeError(
                            "Failed to execute 'item' on '" + tag + "': 1 argument required, but only 0 present."
                        );
                    }
                    // Chrome tente de convertir les strings en nombres (entiers)
                    // et les utilise comme index de propriété
                    const arg = args[0];
                    const isInteger = Number.isInteger(Number(arg));
                    // Note: Chrome ne retourne jamais `undefined`
                    if (isInteger) {
                        const index = Number(arg);
                        return (index >= 0 && index < dataArray.length) ? dataArray[index] : null;
                    }
                    return dataArray[0] || null;
                }
            }),

            /**
             * namedItem(name)
             * Retourne l'élément avec le nom spécifié
             * @param {string} name - Nom de l'élément
             * @returns {Object|null} L'élément ou null
             */
            namedItem: createProxyFn(proto.namedItem || function() {}, {
                apply: function(target, ctx, args) {
                    if (!args || args.length === 0) {
                        throw new TypeError(
                            "Failed to execute 'namedItem' on '" + tag + "': 1 argument required, but only 0 present."
                        );
                    }
                    // Trouver l'élément correspondant
                    for (var i = 0; i < dataArray.length; i++) {
                        if (dataArray[i][itemMainProp] === args[0]) {
                            return dataArray[i];
                        }
                    }
                    return null; // Not `undefined`!
                }
            }),

            /**
             * refresh()
             * Rafraîchit la liste (ne fait rien en pratique)
             * @returns {undefined}
             */
            refresh: (proto.refresh) 
                ? createProxyFn(proto.refresh, {
                    apply: function(target, ctx, args) {
                        return undefined;
                    }
                })
                : undefined
        };
    }

    // =========================================================================
    // 3. FONCTION PRINCIPALE DE GÉNÉRATION
    // =========================================================================

    /**
     * Génère un tableau magique imitant MimeTypeArray ou PluginArray
     * @param {Array} dataArray - Données à utiliser
     * @param {Object} proto - Prototype de l'objet (MimeTypeArray.prototype ou PluginArray.prototype)
     * @param {Object} itemProto - Prototype de l'item (MimeType.prototype ou Plugin.prototype)
     * @param {string} itemMainProp - Propriété principale ('type' ou 'name')
     * @returns {Proxy} Tableau magique proxyfié
     */
    function generateMagicArray(
        dataArray,
        proto,
        itemProto,
        itemMainProp
    ) {
        // Valeurs par défaut
        dataArray = dataArray || [];
        proto = proto || (typeof MimeTypeArray !== 'undefined' ? MimeTypeArray.prototype : {});
        itemProto = itemProto || (typeof MimeType !== 'undefined' ? MimeType.prototype : {});
        itemMainProp = itemMainProp || 'type';

        // =====================================================================
        // 3.1. Définition des propriétés
        // =====================================================================

        /**
         * Définit une propriété sur un objet avec les bons descripteurs
         * @param {Object} obj - Objet cible
         * @param {string} prop - Nom de la propriété
         * @param {*} value - Valeur de la propriété
         */
        function defineProp(obj, prop, value) {
            Object.defineProperty(obj, prop, {
                value: value,
                writable: false,
                enumerable: false, // Important: comme dans Chrome
                configurable: false
            });
        }

        // =====================================================================
        // 3.2. Construction des items
        // =====================================================================

        /**
         * Crée un item (MimeType ou Plugin) à partir de données
         * @param {Object} data - Données de l'item
         * @returns {Object} Item construit
         */
        function makeItem(data) {
            var item = {};
            for (var prop in data) {
                if (data.hasOwnProperty(prop) && !prop.startsWith('__')) {
                    defineProp(item, prop, data[prop]);
                }
            }
            // navigator.plugins[i].length doit toujours être 1
            if (itemProto === (typeof Plugin !== 'undefined' ? Plugin.prototype : {})) {
                defineProp(item, 'length', 1);
            }
            // Créer l'objet avec le bon prototype
            return Object.create(itemProto, Object.getOwnPropertyDescriptors(item));
        }

        // =====================================================================
        // 3.3. Création du tableau magique
        // =====================================================================

        var magicArray = [];

        // Construire les items
        dataArray.forEach(function(data) {
            magicArray.push(makeItem(data));
        });

        // Ajouter l'accès direct par propriété (ex: obj['application/pdf'])
        magicArray.forEach(function(entry) {
            defineProp(magicArray, entry[itemMainProp], entry);
        });

        // =====================================================================
        // 3.4. Création de l'objet Proxy
        // =====================================================================

        // Créer l'objet avec le bon prototype
        var magicArrayObj = Object.create(proto, {
            // Copier les propriétés du tableau
            ...Object.getOwnPropertyDescriptors(magicArray),
            
            // Rédefinir length pour qu'il ne soit pas énumérable
            length: {
                value: magicArray.length,
                writable: false,
                enumerable: false, // Important: non énumérable comme dans Chrome
                configurable: true // Permet le trapping dans le Proxy
            }
        });

        // =====================================================================
        // 3.5. Génération des fonctions mock
        // =====================================================================

        var functionMocks = generateFunctionMocks(
            proto,
            itemMainProp,
            magicArray
        );

        // =====================================================================
        // 3.6. Proxy final
        // =====================================================================

        return new Proxy(magicArrayObj, {
            /**
             * Intercepte les accès aux propriétés
             */
            get: function(target, key, receiver) {
                // Rediriger les appels de fonction vers nos versions mock
                if (key === 'item') {
                    return functionMocks.item;
                }
                if (key === 'namedItem') {
                    return functionMocks.namedItem;
                }
                if (proto === (typeof PluginArray !== 'undefined' ? PluginArray.prototype : {}) && key === 'refresh') {
                    return functionMocks.refresh;
                }
                // Tout le reste passe normalement
                try {
                    return reflectGetFn(target, key, receiver);
                } catch (e) {
                    // Fallback: accès direct
                    return target[key];
                }
            },

            /**
             * Intercepte la liste des propres propriétés
             * Simule le comportement magique de Chrome où `length` n'apparaît pas
             */
            ownKeys: function(target) {
                var keys = [];
                // Ajouter les indices numériques
                for (var i = 0; i < magicArray.length; i++) {
                    keys.push(String(i));
                }
                // Ajouter les noms de propriétés (ex: 'application/pdf')
                magicArray.forEach(function(item) {
                    keys.push(item[itemMainProp]);
                });
                return keys;
            }
        });
    }

    // =========================================================================
    // 4. EXPOSITION PUBLIQUE
    // =========================================================================

    // Exposer la fonction globalement
    window.generateMagicArray = generateMagicArray;
    window.generateFunctionMocks = generateFunctionMocks;

    // =========================================================================
    // 5. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] generate.magic.arrays.js loaded successfully');
        console.log('[stealth] generateMagicArray available');
        console.log('[stealth] hasUtils:', hasUtils);
    }

})();