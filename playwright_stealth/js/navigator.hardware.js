/**
 * navigator.hardware.js
 * Regroupement des métriques matérielles et Client-Hints
 * 
 * Définit des valeurs cohérentes pour hardwareConcurrency, deviceMemory
 * et userAgentData (Client-Hints) pour éviter la détection.
 * 
 * Problème ciblé: Les scripts de détection vérifient la cohérence
 * entre les métriques matérielles et les Client-Hints.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. CONFIGURATION
    // =========================================================================

    // Récupérer les options globales
    var opts = window.__STEALTH_OPTS__ || {};

    /**
     * Profils matériels cohérents
     */
    var HARDWARE_PROFILES = {
        'low': {
            hardwareConcurrency: 2,
            deviceMemory: 4,
            platform: 'Win32',
            platformVersion: '10.0.0',
            brands: [
                { brand: 'NotA(Brand', version: '8' },
                { brand: 'Chromium', version: '122' },
                { brand: 'Google Chrome', version: '122' }
            ],
            fullVersion: '122.0.6261.129'
        },
        'medium': {
            hardwareConcurrency: 4,
            deviceMemory: 8,
            platform: 'Win32',
            platformVersion: '10.0.0',
            brands: [
                { brand: 'NotA(Brand', version: '8' },
                { brand: 'Chromium', version: '124' },
                { brand: 'Google Chrome', version: '124' }
            ],
            fullVersion: '124.0.6367.91'
        },
        'high': {
            hardwareConcurrency: 8,
            deviceMemory: 16,
            platform: 'Win32',
            platformVersion: '10.0.0',
            brands: [
                { brand: 'NotA(Brand', version: '8' },
                { brand: 'Chromium', version: '126' },
                { brand: 'Google Chrome', version: '126' }
            ],
            fullVersion: '126.0.6478.127'
        },
        'premium': {
            hardwareConcurrency: 16,
            deviceMemory: 32,
            platform: 'Win32',
            platformVersion: '10.0.0',
            brands: [
                { brand: 'NotA(Brand', version: '8' },
                { brand: 'Chromium', version: '128' },
                { brand: 'Google Chrome', version: '128' }
            ],
            fullVersion: '128.0.6613.84'
        },
        'macos': {
            hardwareConcurrency: 8,
            deviceMemory: 16,
            platform: 'macOS',
            platformVersion: '10.15.7',
            brands: [
                { brand: 'NotA(Brand', version: '8' },
                { brand: 'Chromium', version: '126' },
                { brand: 'Google Chrome', version: '126' }
            ],
            fullVersion: '126.0.6478.127'
        },
        'linux': {
            hardwareConcurrency: 4,
            deviceMemory: 8,
            platform: 'Linux',
            platformVersion: '5.15.0',
            brands: [
                { brand: 'NotA(Brand', version: '8' },
                { brand: 'Chromium', version: '124' },
                { brand: 'Google Chrome', version: '124' }
            ],
            fullVersion: '124.0.6367.91'
        }
    };

    /**
     * Détermine le profil matériel à utiliser
     * @returns {object} Profil matériel
     */
    function getHardwareProfile() {
        // Si un profil est spécifié dans les options
        if (opts.hardware_profile && HARDWARE_PROFILES[opts.hardware_profile]) {
            return HARDWARE_PROFILES[opts.hardware_profile];
        }

        // Utiliser les valeurs personnalisées
        if (opts.hardware_concurrency || opts.device_memory) {
            var profile = {
                hardwareConcurrency: opts.hardware_concurrency || 4,
                deviceMemory: opts.device_memory || 8,
                platform: opts.platform || 'Win32',
                platformVersion: opts.platform_version || '10.0.0',
                brands: opts.brands || [
                    { brand: 'NotA(Brand', version: '8' },
                    { brand: 'Chromium', version: '124' },
                    { brand: 'Google Chrome', version: '124' }
                ],
                fullVersion: opts.full_version || '124.0.6367.91'
            };
            return profile;
        }

        // Détection automatique basée sur la plateforme
        var ua = navigator.userAgent || '';
        if (opts.os_type === 'macos' || ua.includes('Macintosh')) {
            return HARDWARE_PROFILES['macos'];
        }
        if (opts.os_type === 'linux' || ua.includes('Linux')) {
            return HARDWARE_PROFILES['linux'];
        }

        // Profil par défaut (le plus courant)
        return HARDWARE_PROFILES['medium'];
    }

    // =========================================================================
    // 2. FONCTIONS UTILITAIRES
    // =========================================================================

    /**
     * Patch une propriété sur un objet
     * @param {object} obj - Objet cible
     * @param {string} prop - Nom de la propriété
     * @param {*} value - Valeur à définir
     */
    function patchProperty(obj, prop, value) {
        if (!obj || typeof obj !== 'object') {
            return;
        }

        try {
            var existingDescriptor = Object.getOwnPropertyDescriptor(obj, prop);
            Object.defineProperty(obj, prop, {
                get: function() {
                    return value;
                },
                set: function(newValue) {
                    // Propriété en lecture seule
                    return value;
                },
                configurable: true,
                enumerable: true
            });
        } catch (e) {
            console.debug('[stealth] patchProperty error for', prop, e);
        }
    }

    /**
     * Patch une méthode sur un objet avec un Proxy
     * @param {object} obj - Objet cible
     * @param {string} method - Nom de la méthode
     * @param {function} handler - Handler Proxy
     */
    function patchMethod(obj, method, handler) {
        if (!obj || typeof obj !== 'object' || typeof obj[method] !== 'function') {
            return;
        }

        try {
            var original = obj[method];
            var proxy = new Proxy(original, handler);
            Object.defineProperty(obj, method, {
                value: proxy,
                writable: true,
                enumerable: true,
                configurable: true
            });
            // Préserver le nom
            Object.defineProperty(obj[method], 'name', {
                value: method,
                configurable: true
            });
        } catch (e) {
            console.debug('[stealth] patchMethod error for', method, e);
        }
    }

    // =========================================================================
    // 3. OBTENTION DU PROFIL
    // =========================================================================

    var profile = getHardwareProfile();

    // =========================================================================
    // 4. PATCH DE hardwareConcurrency ET deviceMemory
    // =========================================================================

    // Vérifier que navigator existe
    if (typeof navigator !== 'undefined') {
        var proto = Object.getPrototypeOf(navigator);

        patchProperty(proto, 'hardwareConcurrency', profile.hardwareConcurrency);
        patchProperty(proto, 'deviceMemory', profile.deviceMemory);

        // Vérifier que navigator a aussi les propriétés
        patchProperty(navigator, 'hardwareConcurrency', profile.hardwareConcurrency);
        patchProperty(navigator, 'deviceMemory', profile.deviceMemory);
    }

    // =========================================================================
    // 5. PATCH DE userAgentData (Client-Hints)
    // =========================================================================

    /**
     * Patch navigator.userAgentData
     */
    function patchUserAgentData() {
        try {
            if (typeof navigator === 'undefined' || !('userAgentData' in navigator)) {
                return;
            }

            var uaData = navigator.userAgentData;
            var UADataConstructor = uaData.constructor || window.NavigatorUAData;

            if (!UADataConstructor || !UADataConstructor.prototype) {
                return;
            }

            var proto = UADataConstructor.prototype;

            // 5.1. Patch getHighEntropyValues
            patchMethod(proto, 'getHighEntropyValues', {
                apply: function(target, ctx, args) {
                    var hints = (args && args.length > 0) ? args[0] : [];

                    return new Promise(function(resolve) {
                        var response = {};

                        // Ajouter les propriétés demandées
                        if (hints.indexOf('architecture') !== -1) {
                            response.architecture = opts.architecture || 'x86';
                        }
                        if (hints.indexOf('bitness') !== -1) {
                            response.bitness = opts.bitness || '64';
                        }
                        if (hints.indexOf('model') !== -1) {
                            response.model = opts.model || '';
                        }
                        if (hints.indexOf('platformVersion') !== -1) {
                            response.platformVersion = profile.platformVersion;
                        }
                        if (hints.indexOf('fullVersionList') !== -1) {
                            response.fullVersionList = profile.brands.map(function(b) {
                                return {
                                    brand: b.brand,
                                    version: b.version
                                };
                            });
                        }
                        if (hints.indexOf('uaFullVersion') !== -1) {
                            response.uaFullVersion = profile.fullVersion;
                        }

                        // Toujours retourner les propriétés de base
                        response.brands = profile.brands;
                        response.mobile = opts.mobile || false;
                        response.platform = profile.platform;

                        resolve(response);
                    });
                }
            });

            // 5.2. Patch les propriétés synchrones
            patchProperty(proto, 'brands', profile.brands);
            patchProperty(proto, 'mobile', opts.mobile || false);
            patchProperty(proto, 'platform', profile.platform);

            // 5.3. Patch toJSON
            patchMethod(proto, 'toJSON', {
                apply: function(target, ctx, args) {
                    return {
                        brands: profile.brands,
                        mobile: opts.mobile || false,
                        platform: profile.platform
                    };
                }
            });

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] userAgentData patched');
            }

        } catch (e) {
            console.warn('[stealth] patchUserAgentData error:', e);
        }
    }

    // Appliquer le patch userAgentData
    patchUserAgentData();

    // =========================================================================
    // 6. COHÉRENCE CROISÉE
    // =========================================================================

    /**
     * Vérifie la cohérence entre les métriques
     * Note: Cette fonction est informative
     */
    function checkConsistency() {
        try {
            var cores = navigator.hardwareConcurrency;
            var memory = navigator.deviceMemory;

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] Hardware consistency check:');
                console.log('[stealth] - hardwareConcurrency:', cores);
                console.log('[stealth] - deviceMemory:', memory);
                console.log('[stealth] - platform:', profile.platform);
            }

        } catch (e) {
            console.debug('[stealth] checkConsistency error:', e);
        }
    }

    // Exécuter la vérification
    checkConsistency();

    // =========================================================================
    // 7. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] navigator.hardware.js loaded successfully');
        console.log('[stealth] Hardware profile:', profile);
        console.log('[stealth] navigator.hardwareConcurrency:', navigator.hardwareConcurrency);
        console.log('[stealth] navigator.deviceMemory:', navigator.deviceMemory);
        console.log('[stealth] navigator.userAgentData:', navigator.userAgentData);
    }

})();