/**
 * navigator.deviceMemory.js
 * Évasion pour navigator.deviceMemory
 * 
 * Définit une valeur réaliste pour navigator.deviceMemory
 * afin d'éviter la détection basée sur la mémoire système.
 * 
 * Problème ciblé: Les scripts de détection vérifient la mémoire
 * système pour identifier les environnements headless.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: navigator.deviceMemory dans un vrai navigateur
 *            https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que navigator existe
    if (typeof navigator === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] navigator not available, skipping deviceMemory');
        }
        return;
    }

    // Vérifier que opts existe
    var opts = window.__STEALTH_OPTS__ || {};

    // =========================================================================
    // 2. PROFILS DE MÉMOIRE
    // =========================================================================

    /**
     * Profils de mémoire réalistes
     * Basé sur les données de Chrome User-Agent Client Hints
     */
    var MEMORY_PROFILES = {
        'low': {
            deviceMemory: 2,
            description: '2 GB - Entrée de gamme'
        },
        'medium_low': {
            deviceMemory: 4,
            description: '4 GB - Basique'
        },
        'medium': {
            deviceMemory: 8,
            description: '8 GB - Standard'
        },
        'medium_high': {
            deviceMemory: 12,
            description: '12 GB - Performant'
        },
        'high': {
            deviceMemory: 16,
            description: '16 GB - Haut de gamme'
        },
        'premium': {
            deviceMemory: 32,
            description: '32 GB - Premium'
        }
    };

    /**
     * Détermine la valeur de deviceMemory en fonction des options
     * @returns {number} Mémoire en GB
     */
    function getDeviceMemory() {
        // Si une valeur est spécifiée dans les options, l'utiliser
        if (typeof opts.navigator_device_memory !== 'undefined') {
            // S'assurer que la valeur est valide (2, 4, 8, 12, 16, 32)
            var validValues = [2, 4, 8, 12, 16, 32];
            if (validValues.indexOf(opts.navigator_device_memory) !== -1) {
                return opts.navigator_device_memory;
            }
            // Si la valeur n'est pas valide, arrondir à la valeur valide la plus proche
            var closest = validValues.reduce(function(prev, curr) {
                return Math.abs(curr - opts.navigator_device_memory) < Math.abs(prev - opts.navigator_device_memory) ? curr : prev;
            });
            return closest;
        }

        // Si un profil de mémoire est spécifié
        if (opts.memory_profile && MEMORY_PROFILES[opts.memory_profile]) {
            return MEMORY_PROFILES[opts.memory_profile].deviceMemory;
        }

        // Si un profil matériel est spécifié
        if (opts.hardware_profile) {
            var hardwareMap = {
                'low': 4,
                'medium': 8,
                'high': 16,
                'premium': 32
            };
            if (hardwareMap[opts.hardware_profile]) {
                return hardwareMap[opts.hardware_profile];
            }
        }

        // Cohérence avec hardwareConcurrency
        if (opts.navigator_hardware_concurrency) {
            var cores = opts.navigator_hardware_concurrency;
            if (cores <= 2) return 4;
            if (cores <= 4) return 8;
            if (cores <= 8) return 16;
            if (cores <= 12) return 16;
            return 32;
        }

        // Détection automatique basée sur la plateforme
        if (opts.os_type) {
            var osMap = {
                'windows': 8,
                'macos': 16,
                'linux': 8,
                'android': 4,
                'ios': 4
            };
            if (osMap[opts.os_type]) {
                return osMap[opts.os_type];
            }
        }

        // Valeur par défaut (la plus courante)
        return 8;
    }

    // =========================================================================
    // 3. OBTENTION DE LA VALEUR
    // =========================================================================

    var deviceMemory = getDeviceMemory();

    // =========================================================================
    // 4. PATCH DE navigator.deviceMemory
    // =========================================================================

    /**
     * Patch la propriété deviceMemory sur navigator
     */
    function patchDeviceMemory() {
        try {
            var target = Object.getPrototypeOf(navigator);

            if (!target || typeof target !== 'object') {
                // Fallback: patch navigator directement
                target = navigator;
            }

            // Utiliser Object.defineProperty pour un patch fiable
            Object.defineProperty(target, 'deviceMemory', {
                get: function() {
                    return deviceMemory;
                },
                set: function(newValue) {
                    // deviceMemory est en lecture seule
                    return deviceMemory;
                },
                configurable: true,
                enumerable: true
            });

            // S'assurer que navigator a également la propriété
            if (navigator !== target) {
                Object.defineProperty(navigator, 'deviceMemory', {
                    get: function() {
                        return deviceMemory;
                    },
                    set: function(newValue) {
                        return deviceMemory;
                    },
                    configurable: true,
                    enumerable: true
                });
            }

        } catch (e) {
            console.warn('[stealth] patchDeviceMemory error:', e);
        }
    }

    // =========================================================================
    // 5. APPLICATION DU PATCH
    // =========================================================================

    patchDeviceMemory();

    // =========================================================================
    // 6. VÉRIFICATION DE COHÉRENCE
    // =========================================================================

    /**
     * Vérifie la cohérence avec hardwareConcurrency
     * Note: Cette fonction est informative, le patch de hardwareConcurrency est fait ailleurs
     */
    function checkConsistency() {
        try {
            var memory = navigator.deviceMemory;
            var cores = navigator.hardwareConcurrency || 4;

            // Vérifier la cohérence mémoire / CPU
            var isConsistent = true;
            if (memory <= 4 && cores > 4) {
                isConsistent = false;
            }
            if (memory >= 16 && cores <= 4) {
                isConsistent = false;
            }

            if (!isConsistent && typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.warn('[stealth] deviceMemory/hardwareConcurrency inconsistency detected:', memory, cores);
            }

        } catch (e) {
            console.debug('[stealth] checkConsistency error:', e);
        }
    }

    // Exécuter la vérification
    checkConsistency();

    // =========================================================================
    // 7. PATCH DE navigator.getBattery (optionnel)
    // =========================================================================

    /**
     * Patch getBattery pour assurer la cohérence avec deviceMemory
     */
    function patchBatteryConsistency() {
        try {
            if (typeof navigator.getBattery !== 'function') {
                return;
            }

            var originalGetBattery = navigator.getBattery;

            navigator.getBattery = function() {
                return originalGetBattery.call(this).then(function(battery) {
                    // Ajuster les valeurs de batterie en fonction du profil mémoire
                    var isHighEnd = deviceMemory >= 16;
                    var isLowEnd = deviceMemory <= 4;

                    // Les machines haut de gamme ont souvent une meilleure batterie
                    if (isHighEnd) {
                        Object.defineProperty(battery, 'level', {
                            get: function() {
                                return 0.6 + Math.random() * 0.4;
                            },
                            configurable: true
                        });
                    } else if (isLowEnd) {
                        Object.defineProperty(battery, 'level', {
                            get: function() {
                                return 0.2 + Math.random() * 0.5;
                            },
                            configurable: true
                        });
                    }

                    return battery;
                });
            };

        } catch (e) {
            console.debug('[stealth] patchBatteryConsistency error:', e);
        }
    }

    // Appliquer le patch batterie
    patchBatteryConsistency();

    // =========================================================================
    // 8. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] navigator.deviceMemory.js loaded successfully');
        console.log('[stealth] navigator.deviceMemory:', navigator.deviceMemory);
        console.log('[stealth] navigator.hardwareConcurrency:', navigator.hardwareConcurrency);
        console.log('[stealth] opts:', opts);
    }

})();