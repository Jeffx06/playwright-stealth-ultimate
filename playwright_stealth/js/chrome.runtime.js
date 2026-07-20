/**
 * chrome.runtime.js
 * Évasion pour window.chrome.runtime
 * 
 * Simule le comportement de chrome.runtime d'un navigateur Chrome
 * sans extension installée.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: chrome.runtime dans un vrai navigateur Chrome
 * API: https://developer.chrome.com/docs/extensions/reference/runtime/
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que window.chrome existe
    if (!window.chrome) {
        Object.defineProperty(window, 'chrome', {
            writable: true,
            enumerable: true,
            configurable: false,
            value: {}
        });
    }

    // Si runtime existe déjà, ne pas le redéfinir
    if ('runtime' in window.chrome) {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.log('[stealth] chrome.runtime.js: runtime already exists, skipping');
        }
        return;
    }

    // Vérifier le contexte sécurisé
    var isSecureContext = window.location.protocol.startsWith('https') || 
                          window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1';
    
    // Options (valeur par défaut si non définie)
    var opts = window.__STEALTH_OPTS__ || {};
    var runOnInsecureOrigins = opts.runOnInsecureOrigins || false;

    // Dans un vrai Chrome, runtime n'est exposé que sur les origines sécurisées
    if (!isSecureContext && !runOnInsecureOrigins) {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.log('[stealth] chrome.runtime.js: skipping on insecure origin');
        }
        return;
    }

    // =========================================================================
    // 2. DONNÉES STATIQUES
    // =========================================================================

    var STATIC_DATA = {
        "OnInstalledReason": {
            "CHROME_UPDATE": "chrome_update",
            "INSTALL": "install",
            "SHARED_MODULE_UPDATE": "shared_module_update",
            "UPDATE": "update"
        },
        "OnRestartRequiredReason": {
            "APP_UPDATE": "app_update",
            "OS_UPDATE": "os_update",
            "PERIODIC": "periodic"
        },
        "PlatformArch": {
            "ARM": "arm",
            "ARM64": "arm64",
            "MIPS": "mips",
            "MIPS64": "mips64",
            "X86_32": "x86-32",
            "X86_64": "x86-64"
        },
        "PlatformNaclArch": {
            "ARM": "arm",
            "MIPS": "mips",
            "MIPS64": "mips64",
            "X86_32": "x86-32",
            "X86_64": "x86-64"
        },
        "PlatformOs": {
            "ANDROID": "android",
            "CROS": "cros",
            "LINUX": "linux",
            "MAC": "mac",
            "OPENBSD": "openbsd",
            "WIN": "win"
        },
        "RequestUpdateCheckStatus": {
            "NO_UPDATE": "no_update",
            "THROTTLED": "throttled",
            "UPDATE_AVAILABLE": "update_available"
        }
    };

    // =========================================================================
    // 3. UTILITAIRES INTERNES (fallback si utils n'est pas disponible)
    // =========================================================================

    /**
     * Patch toString sur un objet pour imiter le comportement natif
     * @param {Object} obj - Objet à patcher
     */
    function patchToStringInternal(obj) {
        if (!obj || typeof obj !== 'object') return;

        // Patcher l'objet lui-même
        if (typeof obj.toString === 'function') {
            var origToString = obj.toString;
            obj.toString = function() {
                if (this && this.constructor) {
                    return '[object ' + this.constructor.name + ']';
                }
                return '[object Object]';
            };
        }

        // Patcher chaque méthode
        for (var key in obj) {
            if (typeof obj[key] === 'function') {
                (function(methodName) {
                    var originalMethod = obj[methodName];
                    obj[methodName] = function() {
                        return originalMethod.apply(this, arguments);
                    };
                    // Préserver le nom de la fonction
                    Object.defineProperty(obj[methodName], 'name', {
                        value: methodName,
                        configurable: true
                    });
                })(key);
            }
        }
    }

    /**
     * Patch toString sur un objet et ses enfants
     * @param {Object} obj - Objet à patcher
     */
    function patchToStringNestedInternal(obj) {
        if (!obj || typeof obj !== 'object') return;
        
        patchToStringInternal(obj);
        
        for (var key in obj) {
            if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && obj[key] !== null) {
                patchToStringNestedInternal(obj[key]);
            }
        }
    }

    /**
     * Mock une méthode avec un Proxy
     * @param {Object} target - Objet cible
     * @param {string} methodName - Nom de la méthode
     * @param {Function} fallback - Fonction de fallback
     * @param {Object} handler - Handler Proxy
     */
    function mockWithProxyInternal(target, methodName, fallback, handler) {
        if (!target || typeof target !== 'object') {
            console.warn('[stealth] mockWithProxy: invalid target');
            return;
        }

        try {
            var proxy = new Proxy(fallback || function() {}, handler);
            Object.defineProperty(target, methodName, {
                value: proxy,
                writable: false,
                enumerable: true,
                configurable: true
            });
        } catch (e) {
            console.debug('[stealth] mockWithProxy failed:', e);
            // Fallback: assigner directement
            target[methodName] = fallback || function() {};
        }
    }

    // =========================================================================
    // 4. VALIDATION DES EXTENSION IDs
    // =========================================================================

    /**
     * Valide un ID d'extension Chrome
     * Les IDs valides font 32 caractères et utilisent les lettres a à p
     * @param {string} str - ID à valider
     * @returns {boolean} True si l'ID est valide
     */
    function isValidExtensionID(str) {
        if (typeof str !== 'string') return false;
        return str.length === 32 && /^[a-p]+$/.test(str.toLowerCase());
    }

    /**
     * Détermine la plateforme OS
     * @returns {string} Nom de la plateforme
     */
    function getPlatformOS() {
        var ua = navigator.userAgent || '';
        if (ua.includes('Windows')) return 'win';
        if (ua.includes('Macintosh')) return 'mac';
        if (ua.includes('Linux')) return 'linux';
        if (ua.includes('Android')) return 'android';
        if (ua.includes('CrOS')) return 'cros';
        return 'win';
    }

    // =========================================================================
    // 5. CRÉATION DES ERREURS PERSONNALISÉES
    // =========================================================================

    /**
     * Crée des erreurs personnalisées pour runtime
     * @param {string} preamble - Préambule du message d'erreur
     * @param {string} method - Nom de la méthode
     * @param {string} extensionId - ID de l'extension
     * @returns {Object} Objet d'erreurs
     */
    function makeCustomRuntimeErrors(preamble, method, extensionId) {
        return {
            NoMatchingSignature: new TypeError(
                preamble + 'No matching signature.'
            ),
            MustSpecifyExtensionID: new TypeError(
                preamble +
                method + ' called from a webpage must specify an Extension ID (string) for its first argument.'
            ),
            InvalidExtensionID: new TypeError(
                preamble + "Invalid extension id: '" + extensionId + "'"
            )
        };
    }

    // =========================================================================
    // 6. CRÉATION DE LA RÉPONSE DE CONNEXION
    // =========================================================================

    /**
     * Crée un objet de réponse pour runtime.connect()
     * @returns {Object} Objet de réponse
     */
    function makeConnectResponse() {
        /**
         * Crée un objet listener pour onDisconnect / onMessage
         * @returns {Object} Objet listener
         */
        function createListener() {
            return {
                addListener: function addListener() {},
                dispatch: function dispatch() {},
                hasListener: function hasListener() {
                    return false;
                },
                hasListeners: function hasListeners() {
                    return false;
                },
                removeListener: function removeListener() {}
            };
        }

        var response = {
            name: '',
            sender: undefined,
            disconnect: function disconnect() {},
            onDisconnect: createListener(),
            onMessage: createListener(),
            postMessage: function postMessage() {
                if (arguments.length === 0) {
                    throw new TypeError('Insufficient number of arguments.');
                }
                throw new Error('Attempting to use a disconnected port object');
            }
        };

        // Patcher toString sur la réponse
        patchToStringNestedInternal(response);

        return response;
    }

    // =========================================================================
    // 7. CRÉATION DE window.chrome.runtime
    // =========================================================================

    // Créer l'objet runtime
    var runtime = {
        // Données statiques
        OnInstalledReason: STATIC_DATA.OnInstalledReason,
        OnRestartRequiredReason: STATIC_DATA.OnRestartRequiredReason,
        PlatformArch: STATIC_DATA.PlatformArch,
        PlatformNaclArch: STATIC_DATA.PlatformNaclArch,
        PlatformOs: STATIC_DATA.PlatformOs,
        RequestUpdateCheckStatus: STATIC_DATA.RequestUpdateCheckStatus,

        // Getters
        get id() {
            return undefined;
        },

        // Méthodes (seront remplacées par des Proxys)
        connect: null,
        sendMessage: null
    };

    // =========================================================================
    // 8. MOCK sendMessage
    // =========================================================================

    /**
     * Mock `chrome.runtime.sendMessage`
     */
    var sendMessageHandler = {
        apply: function(target, ctx, args) {
            var extensionId = args && args.length > 0 ? args[0] : undefined;
            var options = args && args.length > 1 ? args[1] : undefined;
            var responseCallback = args && args.length > 2 ? args[2] : undefined;

            // Définir les erreurs personnalisées
            var errorPreamble = 'Error in invocation of runtime.sendMessage(optional string extensionId, any message, optional object options, optional function responseCallback): ';
            var Errors = makeCustomRuntimeErrors(
                errorPreamble,
                'chrome.runtime.sendMessage()',
                extensionId
            );

            // Vérifier la signature
            var noArguments = !args || args.length === 0;
            var tooManyArguments = args && args.length > 4;
            var incorrectOptions = options && typeof options !== 'object';
            var incorrectResponseCallback = responseCallback && typeof responseCallback !== 'function';

            if (noArguments || tooManyArguments || incorrectOptions || incorrectResponseCallback) {
                throw Errors.NoMatchingSignature;
            }

            // Au moins 2 arguments sont nécessaires
            if (args.length < 2) {
                throw Errors.MustSpecifyExtensionID;
            }

            // Vérifier que le premier argument est une string
            if (typeof extensionId !== 'string') {
                throw Errors.NoMatchingSignature;
            }

            // Valider l'ID de l'extension
            if (!isValidExtensionID(extensionId)) {
                throw Errors.InvalidExtensionID;
            }

            return undefined; // Comportement normal
        }
    };

    // Appliquer le proxy sur sendMessage
    if (typeof utils !== 'undefined' && typeof utils.mockWithProxy === 'function') {
        utils.mockWithProxy(
            runtime,
            'sendMessage',
            function sendMessage() {},
            sendMessageHandler
        );
    } else {
        mockWithProxyInternal(
            runtime,
            'sendMessage',
            function sendMessage() {},
            sendMessageHandler
        );
    }

    // =========================================================================
    // 9. MOCK connect
    // =========================================================================

    /**
     * Mock `chrome.runtime.connect`
     */
    var connectHandler = {
        apply: function(target, ctx, args) {
            var extensionId = args && args.length > 0 ? args[0] : undefined;
            var connectInfo = args && args.length > 1 ? args[1] : undefined;

            // Définir les erreurs personnalisées
            var errorPreamble = 'Error in invocation of runtime.connect(optional string extensionId, optional object connectInfo): ';
            var Errors = makeCustomRuntimeErrors(
                errorPreamble,
                'chrome.runtime.connect()',
                extensionId
            );

            // Comportement différent de sendMessage
            var noArguments = !args || args.length === 0;
            var emptyStringArgument = args && args.length === 1 && extensionId === '';

            if (noArguments || emptyStringArgument) {
                throw Errors.MustSpecifyExtensionID;
            }

            var tooManyArguments = args && args.length > 2;
            var incorrectConnectInfoType = connectInfo && typeof connectInfo !== 'object';

            if (tooManyArguments || incorrectConnectInfoType) {
                throw Errors.NoMatchingSignature;
            }

            var extensionIdIsString = typeof extensionId === 'string';
            if (extensionIdIsString && extensionId === '') {
                throw Errors.MustSpecifyExtensionID;
            }
            if (extensionIdIsString && !isValidExtensionID(extensionId)) {
                throw Errors.InvalidExtensionID;
            }

            // Validation de connectInfo
            function validateConnectInfo(ci) {
                if (args.length > 1) {
                    throw Errors.NoMatchingSignature;
                }
                if (Object.keys(ci).length === 0) {
                    throw Errors.MustSpecifyExtensionID;
                }
                Object.entries(ci).forEach(function(entry) {
                    var k = entry[0];
                    var v = entry[1];
                    var isExpected = ['name', 'includeTlsChannelId'].includes(k);
                    if (!isExpected) {
                        throw new TypeError(
                            errorPreamble + "Unexpected property: '" + k + "'."
                        );
                    }
                    function MismatchError(propName, expected, found) {
                        return TypeError(
                            errorPreamble +
                            "Error at property '" + propName + "': Invalid type: expected " + expected + ", found " + found + "."
                        );
                    }
                    if (k === 'name' && typeof v !== 'string') {
                        throw MismatchError(k, 'string', typeof v);
                    }
                    if (k === 'includeTlsChannelId' && typeof v !== 'boolean') {
                        throw MismatchError(k, 'boolean', typeof v);
                    }
                });
            }

            if (typeof extensionId === 'object') {
                validateConnectInfo(extensionId);
                throw Errors.MustSpecifyExtensionID;
            }

            // Créer la réponse
            var response = makeConnectResponse();

            // Patcher la réponse avec utils si disponible
            if (typeof utils !== 'undefined' && typeof utils.patchToStringNested === 'function') {
                utils.patchToStringNested(response);
            } else {
                patchToStringNestedInternal(response);
            }

            return response;
        }
    };

    // Appliquer le proxy sur connect
    if (typeof utils !== 'undefined' && typeof utils.mockWithProxy === 'function') {
        utils.mockWithProxy(
            runtime,
            'connect',
            function connect() {},
            connectHandler
        );
    } else {
        mockWithProxyInternal(
            runtime,
            'connect',
            function connect() {},
            connectHandler
        );
    }

    // =========================================================================
    // 10. MÉTHODES SUPPLÉMENTAIRES (de chrome_runtime.js)
    // =========================================================================

    /**
     * getManifest()
     * Retourne un manifeste minimal (comme dans Chrome sans extension)
     * @returns {Object} Manifeste
     */
    runtime.getManifest = function() {
        return {
            manifest_version: 3,
            version: '1.0.0',
            name: 'Google Chrome'
        };
    };

    /**
     * getURL(path)
     * Génère une URL d'extension
     * @param {string} path - Chemin
     * @returns {string} URL
     */
    runtime.getURL = function(path) {
        if (arguments.length === 0) {
            throw new TypeError('Error in invocation of runtime.getURL(string path): 1 argument required');
        }
        return 'chrome-extension://dummy/' + (path || '');
    };

    /**
     * reload()
     * Simule un rechargement (ne fait rien)
     * @returns {undefined}
     */
    runtime.reload = function() {
        return undefined;
    };

    /**
     * requestUpdateCheck(callback)
     * Simule une vérification de mise à jour
     * @param {Function} callback - Fonction de rappel
     * @returns {undefined}
     */
    runtime.requestUpdateCheck = function(callback) {
        if (callback && typeof callback === 'function') {
            callback({
                status: 'no_update'
            });
        }
        return undefined;
    };

    /**
     * restart()
     * Simule un redémarrage (ne fait rien)
     * @returns {undefined}
     */
    runtime.restart = function() {
        return undefined;
    };

    /**
     * openOptionsPage(callback)
     * Simule l'ouverture de la page d'options
     * @param {Function} callback - Fonction de rappel
     * @returns {undefined}
     */
    runtime.openOptionsPage = function(callback) {
        if (callback && typeof callback === 'function') {
            callback();
        }
        return undefined;
    };

    /**
     * setUninstallURL(url, callback)
     * Simule la définition d'une URL de désinstallation
     * @param {string} url - URL
     * @param {Function} callback - Fonction de rappel
     * @returns {undefined}
     */
    runtime.setUninstallURL = function(url, callback) {
        if (callback && typeof callback === 'function') {
            callback();
        }
        return undefined;
    };

    /**
     * getPackageDirectoryEntry(callback)
     * Simule l'obtention d'un répertoire de package
     * @param {Function} callback - Fonction de rappel
     * @returns {undefined}
     */
    runtime.getPackageDirectoryEntry = function(callback) {
        if (callback && typeof callback === 'function') {
            callback(null);
        }
        return undefined;
    };

    /**
     * getPlatformInfo(callback)
     * Retourne des informations sur la plateforme
     * @param {Function} callback - Fonction de rappel
     * @returns {undefined}
     */
    runtime.getPlatformInfo = function(callback) {
        var platformInfo = {
            os: getPlatformOS(),
            arch: 'x86-64',
            nacl_arch: 'x86-64'
        };
        if (callback && typeof callback === 'function') {
            callback(platformInfo);
        }
        return undefined;
    };

    // =========================================================================
    // 11. ÉVÉNEMENTS (de chrome_runtime.js)
    // =========================================================================

    /**
     * Crée un objet d'événement avec addListener, removeListener, etc.
     * @returns {Object} Objet d'événement
     */
    function createEventObject() {
        return {
            addListener: function(listener) { return undefined; },
            removeListener: function(listener) { return undefined; },
            hasListener: function(listener) { return false; },
            hasListeners: function() { return false; }
        };
    }

    runtime.onMessage = createEventObject();
    runtime.onConnect = createEventObject();
    runtime.onMessageExternal = createEventObject();
    runtime.onConnectExternal = createEventObject();
    runtime.onInstalled = createEventObject();
    runtime.onUpdateAvailable = createEventObject();
    runtime.onStartup = createEventObject();
    runtime.onRestartRequired = createEventObject();

    // =========================================================================
    // 12. ATTACHER runtime à window.chrome
    // =========================================================================

    Object.defineProperty(window.chrome, 'runtime', {
        value: runtime,
        writable: false,
        enumerable: true,
        configurable: true
    });

    // =========================================================================
    // 13. PATCH toString GLOBAL
    // =========================================================================

    // Patcher les méthodes pour qu'elles apparaissent comme natives
    var methodNames = [
        'connect', 'sendMessage', 'getManifest', 'getURL',
        'reload', 'requestUpdateCheck', 'restart', 'openOptionsPage',
        'setUninstallURL', 'getPackageDirectoryEntry', 'getPlatformInfo'
    ];

    for (var i = 0; i < methodNames.length; i++) {
        var methodName = methodNames[i];
        if (typeof runtime[methodName] === 'function') {
            (function(mName) {
                var origMethod = runtime[mName];
                runtime[mName] = function() {
                    return origMethod.apply(this, arguments);
                };
                Object.defineProperty(runtime[mName], 'name', {
                    value: mName,
                    configurable: true
                });
            })(methodName);
        }
    }

    // Patcher l'objet runtime entier
    if (typeof utils !== 'undefined' && typeof utils.patchToStringNested === 'function') {
        try {
            utils.patchToStringNested(window.chrome.runtime);
        } catch (e) {
            console.debug('[stealth] utils.patchToStringNested failed:', e);
            patchToStringNestedInternal(window.chrome.runtime);
        }
    } else {
        patchToStringNestedInternal(window.chrome.runtime);
    }

    // =========================================================================
    // 14. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] chrome.runtime.js loaded successfully');
        console.log('[stealth] window.chrome.runtime:', window.chrome.runtime);
        console.log('[stealth] chrome.runtime.id:', window.chrome.runtime.id);
        console.log('[stealth] Platform:', getPlatformOS());
    }

})();