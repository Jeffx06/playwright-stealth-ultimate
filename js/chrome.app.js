/**
 * chrome.app.js
 * Évasion pour window.chrome.app
 * 
 * Simule le comportement de window.chrome.app d'un navigateur Chrome
 * sans extension installée.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: Object.getOwnPropertyDescriptor(window, 'chrome')
 * Données: JSON.stringify(window.chrome.app, null, 2)
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que utils est disponible
    if (typeof utils === 'undefined') {
        console.warn('[stealth] utils not loaded, chrome.app.js may not work correctly');
        return;
    }

    // =========================================================================
    // 2. INITIALISATION DE window.chrome
    // =========================================================================

    if (!window.chrome) {
        Object.defineProperty(window, 'chrome', {
            writable: true,
            enumerable: true,
            configurable: false,
            value: {}
        });
    }

    // =========================================================================
    // 3. DONNÉES STATIQUES
    // =========================================================================

    // Données récupérées depuis un vrai Chrome:
    // JSON.stringify(window.chrome.app, null, 2)
    const APP_STATIC_DATA = {
        InstallState: {
            DISABLED: 'disabled',
            INSTALLED: 'installed',
            NOT_INSTALLED: 'not_installed'
        },
        RunningState: {
            CANNOT_RUN: 'cannot_run',
            READY_TO_RUN: 'ready_to_run',
            RUNNING: 'running'
        }
    };

    // =========================================================================
    // 4. FONCTION D'ERREUR
    // =========================================================================

    /**
     * Crée une erreur d'invocation réaliste
     * @param {string} fn - Nom de la fonction appelée
     * @returns {TypeError} Erreur formatée
     */
    function createInvocationError(fn) {
        const err = new TypeError(`Error in invocation of app.${fn}()`);
        if (typeof utils !== 'undefined' && typeof utils.stripErrorWithAnchor === 'function') {
            return utils.stripErrorWithAnchor(
                err,
                `at ${fn} (eval at <anonymous>`
            );
        }
        // Fallback: retourner l'erreur brute sans strip
        return err;
    }

    // =========================================================================
    // 5. DÉFINITION DE window.chrome.app
    // =========================================================================

    // Ne pas redéfinir si déjà présent (signifie qu'on est dans un vrai Chrome)
    if (!('app' in window.chrome)) {

        // Créer l'objet app
        const app = {};

        // --- Propriétés statiques (non énumérables) ---
        Object.defineProperty(app, 'InstallState', {
            value: APP_STATIC_DATA.InstallState,
            enumerable: false,
            configurable: true,
            writable: false
        });

        Object.defineProperty(app, 'RunningState', {
            value: APP_STATIC_DATA.RunningState,
            enumerable: false,
            configurable: true,
            writable: false
        });

        // --- Getter isInstalled ---
        Object.defineProperty(app, 'isInstalled', {
            enumerable: true,
            configurable: true,
            get: function() {
                return false;
            }
        });

        // --- Méthodes ---

        /**
         * getDetails()
         * Retourne les détails de l'extension (null si aucune extension)
         */
        app.getDetails = function getDetails() {
            if (arguments.length > 0) {
                throw createInvocationError('getDetails');
            }
            return null;
        };

        /**
         * getIsInstalled()
         * Retourne false (aucune extension installée)
         */
        app.getIsInstalled = function getIsInstalled() {
            if (arguments.length > 0) {
                throw createInvocationError('getIsInstalled');
            }
            return false;
        };

        /**
         * runningState()
         * Retourne 'cannot_run' (aucune extension en cours d'exécution)
         */
        app.runningState = function runningState() {
            if (arguments.length > 0) {
                throw createInvocationError('runningState');
            }
            return 'cannot_run';
        };

        // --- Attacher à window.chrome.app ---
        Object.defineProperty(window.chrome, 'app', {
            value: app,
            enumerable: true,
            configurable: false,
            writable: false
        });

        // =========================================================================
        // 6. PATCH toString SUR window.chrome.app
        // =========================================================================

        /**
         * Patch toString sur l'objet app et ses méthodes
         * pour imiter le comportement natif de Chrome
         */
        if (typeof utils !== 'undefined' && typeof utils.patchToStringNested === 'function') {
            try {
                utils.patchToStringNested(window.chrome.app);
            } catch (e) {
                // Fallback: patch manuel
                console.debug('[stealth] utils.patchToStringNested failed, using fallback');
                patchToStringFallback(window.chrome.app);
            }
        } else {
            // Fallback si utils n'est pas disponible
            patchToStringFallback(window.chrome.app);
        }

        // =========================================================================
        // 7. FALLBACK DE PATCH toString
        // =========================================================================

        /**
         * Fonction de fallback pour patchToStringNested
         * Utilisée si utils n'est pas disponible
         * @param {Object} obj - Objet à patcher
         */
        function patchToStringFallback(obj) {
            if (!obj || typeof obj !== 'object') return;

            // Patcher l'objet lui-même
            if (typeof obj.toString === 'function') {
                const origToString = obj.toString;
                obj.toString = function() {
                    return '[object App]';
                };
            }

            // Patcher chaque méthode
            const methodNames = ['getDetails', 'getIsInstalled', 'runningState'];
            for (const name of methodNames) {
                if (typeof obj[name] === 'function') {
                    const origFunc = obj[name];
                    obj[name] = function() {
                        return origFunc.apply(this, arguments);
                    };
                    // Préserver le nom de la fonction
                    Object.defineProperty(obj[name], 'name', {
                        value: name,
                        configurable: true
                    });
                }
            }
        }

        // =========================================================================
        // 8. LOG DE DÉBOGAGE
        // =========================================================================

        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.log('[stealth] chrome.app.js loaded successfully');
            console.log('[stealth] window.chrome.app:', window.chrome.app);
        }

    }

})();