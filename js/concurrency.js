/**
 * concurrency.js
 * Gestion des timings et synchronisation des évasions
 * 
 * Standardise les points de référence temporels et gère la synchronisation
 * des évasions asynchrones pour éviter les incohérences.
 * 
 * Problème ciblé: Les scripts de détection vérifient les timings
 * et les races conditions dans l'injection de scripts.
 * 
 * Compatibilité: Chrome 80+
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. CONFIGURATION
    // =========================================================================

    var opts = window.__STEALTH_OPTS__ || {};

    // =========================================================================
    // 2. GESTION DE performance.now()
    // =========================================================================

    /**
     * Patch performance.now() de manière subtile
     */
    function patchPerformanceNow() {
        try {
            if (typeof window.performance === 'undefined') {
                return;
            }

            var perfProto = Object.getPrototypeOf(window.performance);
            if (!perfProto || typeof perfProto.now !== 'function') {
                return;
            }

            var originalNow = perfProto.now;
            var timeOrigin = window.performance.timeOrigin || Date.now();

            // Ajouter un très léger bruit déterministe
            var seed = 0;
            var noiseSeed = opts.seed || 12345;

            perfProto.now = function() {
                var rawTime = originalNow.call(this);

                // Ajouter un bruit déterministe (microsecondes)
                // Trop faible pour être détecté, mais suffisant pour varier
                seed = (seed + 1) % 1000;
                var noise = (Math.sin(noiseSeed + seed) * 0.000001) || 0;

                // Conserver la précision native
                return rawTime + noise;
            };

            // Préserver le toString
            Object.defineProperty(perfProto.now, 'toString', {
                value: function() {
                    return originalNow.toString();
                },
                configurable: true
            });

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] performance.now patched');
            }

        } catch (e) {
            console.warn('[stealth] patchPerformanceNow error:', e);
        }
    }

    // =========================================================================
    // 3. GESTION DE performance.timeOrigin
    // =========================================================================

    /**
     * Patch performance.timeOrigin pour assurer la cohérence
     */
    function patchTimeOrigin() {
        try {
            if (typeof window.performance === 'undefined') {
                return;
            }

            var timeOrigin = window.performance.timeOrigin || Date.now();

            // S'assurer que timeOrigin est cohérent
            Object.defineProperty(window.performance, 'timeOrigin', {
                get: function() {
                    return timeOrigin;
                },
                set: function() {
                    // timeOrigin est en lecture seule
                    return timeOrigin;
                },
                configurable: true,
                enumerable: true
            });

        } catch (e) {
            console.warn('[stealth] patchTimeOrigin error:', e);
        }
    }

    // =========================================================================
    // 4. GESTION DE performance.timing (déprécié mais encore utilisé)
    // =========================================================================

    /**
     * Patch performance.timing pour les navigateurs plus anciens
     */
    function patchPerformanceTiming() {
        try {
            if (typeof window.performance === 'undefined' || !window.performance.timing) {
                return;
            }

            var timing = window.performance.timing;
            var timeOrigin = window.performance.timeOrigin || Date.now();

            // S'assurer que navigationStart est cohérent avec timeOrigin
            Object.defineProperty(timing, 'navigationStart', {
                get: function() {
                    return Math.floor(timeOrigin);
                },
                set: function() {
                    return Math.floor(timeOrigin);
                },
                configurable: true,
                enumerable: true
            });

            // Redéfinir responseStart si nécessaire
            if (timing.responseStart) {
                Object.defineProperty(timing, 'responseStart', {
                    get: function() {
                        return Math.floor(timeOrigin) + 100;
                    },
                    configurable: true,
                    enumerable: true
                });
            }

        } catch (e) {
            console.warn('[stealth] patchPerformanceTiming error:', e);
        }
    }

    // =========================================================================
    // 5. SYSTÈME DE SYNCHRONISATION
    // =========================================================================

    // Cache interne pour les locks (non exposé globalement)
    var _lockRegistry = new Map();

    /**
     * Acquiert un verrou pour une opération asynchrone
     * @param {string} lockId - Identifiant du verrou
     * @param {number} timeout - Timeout en ms (défaut: 5000)
     * @returns {Promise} Résolu quand le verrou est acquis
     */
    function acquireBarrier(lockId, timeout) {
        timeout = timeout || 5000;

        return new Promise(function(resolve) {
            // Vérifier si le verrou existe déjà
            if (_lockRegistry.has(lockId)) {
                var existing = _lockRegistry.get(lockId);
                existing.count++;
                resolve(existing);
                return;
            }

            // Créer un nouveau verrou
            var lock = {
                id: lockId,
                count: 1,
                timestamp: Date.now(),
                timer: setTimeout(function() {
                    // Timeout automatique
                    releaseBarrier(lockId);
                }, timeout)
            };

            _lockRegistry.set(lockId, lock);
            resolve(lock);
        });
    }

    /**
     * Libère un verrou
     * @param {string} lockId - Identifiant du verrou
     */
    function releaseBarrier(lockId) {
        if (!_lockRegistry.has(lockId)) {
            return;
        }

        var lock = _lockRegistry.get(lockId);
        lock.count--;

        if (lock.count <= 0) {
            if (lock.timer) {
                clearTimeout(lock.timer);
            }
            _lockRegistry.delete(lockId);
        }
    }

    /**
     * Vérifie si tous les verrous sont libérés
     * @returns {boolean} True si aucun verrou actif
     */
    function isSettled() {
        return _lockRegistry.size === 0;
    }

    // =========================================================================
    // 6. APPLICATION DES PATCHS
    // =========================================================================

    // Appliquer les patches
    patchPerformanceNow();
    patchTimeOrigin();
    patchPerformanceTiming();

    // =========================================================================
    // 7. EXPOSITION LIMITÉE
    // =========================================================================

    // Exposer les fonctions de synchronisation de manière limitée
    // Utiliser un symbole pour éviter la détection
    var stealthSymbol = Symbol('stealth');

    if (!window[stealthSymbol]) {
        window[stealthSymbol] = {
            acquireBarrier: acquireBarrier,
            releaseBarrier: releaseBarrier,
            isSettled: isSettled
        };
    }

    // Exposer également via un nom non détectable
    if (!window.__stealth_guard__) {
        Object.defineProperty(window, '__stealth_guard__', {
            value: {
                acquire: acquireBarrier,
                release: releaseBarrier,
                settled: isSettled
            },
            configurable: false,
            enumerable: false,
            writable: false
        });
    }

    // =========================================================================
    // 8. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] concurrency.js loaded successfully');
        console.log('[stealth] performance.now patched:', typeof performance.now === 'function');
        console.log('[stealth] Lock registry:', _lockRegistry);
    }

})();