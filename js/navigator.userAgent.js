/**
 * navigator.userAgent.js
 * Évasion pour navigator.userAgent
 * 
 * Définit un User-Agent réaliste en remplaçant les indicateurs headless
 * ou en utilisant une valeur personnalisée.
 * 
 * Problème ciblé: Les scripts de détection vérifient l'User-Agent
 * pour identifier les environnements headless.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: navigator.userAgent dans un vrai navigateur
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que navigator existe
    if (typeof navigator === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] navigator not available, skipping userAgent');
        }
        return;
    }

    // Vérifier que opts existe, sinon créer un objet par défaut
    const opts = window.__STEALTH_OPTS__ || {};
    
    // =========================================================================
    // 2. NETTOYAGE DE L'USER-AGENT
    // =========================================================================

    /**
     * Nettoie un User-Agent pour supprimer les indicateurs headless
     * @param {string} ua - User-Agent d'origine
     * @returns {string} User-Agent nettoyé
     */
    function cleanUserAgent(ua) {
        if (typeof ua !== 'string') {
            return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        }

        let cleaned = ua;

        // 1. Remplacer HeadlessChrome par Chrome
        cleaned = cleaned.replace(/HeadlessChrome\//g, 'Chrome/');

        // 2. Remplacer Headless dans d'autres contextes
        cleaned = cleaned.replace(/Headless/g, '');

        // 3. Nettoyer les espaces multiples
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        // 4. Supprimer les indicateurs headless connus
        const headlessPatterns = [
            /headless/i,
            /--headless/i,
            /--disable-gpu/i,
            /--no-sandbox/i
        ];

        for (const pattern of headlessPatterns) {
            cleaned = cleaned.replace(pattern, '');
        }

        // 5. Nettoyer les espaces supplémentaires
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        // 6. Si l'UA est vide ou trop court, utiliser un fallback
        if (cleaned.length < 50) {
            cleaned = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        }

        return cleaned;
    }

    /**
     * Détermine une version réaliste de Chrome
     * @returns {string} Version de Chrome
     */
    function getChromeVersion() {
        // Si une version est spécifiée dans les options, l'utiliser
        if (opts.chrome_version) {
            return opts.chrome_version;
        }

        // Versions récentes de Chrome (par ordre de prévalence)
        const versions = [
            '120.0.6099.130',
            '119.0.6045.199',
            '118.0.5993.120',
            '117.0.5938.132',
            '116.0.5845.188',
            '115.0.5790.170',
            '114.0.5735.199',
            '113.0.5672.127'
        ];

        // Si une seed est disponible, l'utiliser pour un choix déterministe
        if (typeof opts.seed !== 'undefined') {
            const seed = opts.seed;
            const index = seed % versions.length;
            return versions[index];
        }

        // Version par défaut (la plus courante)
        return versions[0];
    }

    // =========================================================================
    // 3. DÉTERMINATION DE L'USER-AGENT
    // =========================================================================

    /**
     * Détermine l'User-Agent à utiliser
     * @returns {string} User-Agent final
     */
    function getUserAgent() {
        // Si un User-Agent est spécifié dans les options, l'utiliser
        if (opts.navigator_user_agent) {
            return opts.navigator_user_agent;
        }

        // Si une plateforme est spécifiée, construire un UA cohérent
        if (opts.os_type) {
            const version = getChromeVersion();
            const uaMap = {
                'windows': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' + version + ' Safari/537.36',
                'macos': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' + version + ' Safari/537.36',
                'linux': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' + version + ' Safari/537.36'
            };
            if (uaMap[opts.os_type]) {
                return uaMap[opts.os_type];
            }
        }

        // Utiliser l'User-Agent actuel nettoyé
        const currentUA = navigator.userAgent || '';
        return cleanUserAgent(currentUA);
    }

    // =========================================================================
    // 4. PATCH DE navigator.userAgent
    // =========================================================================

    /**
     * Patch la propriété userAgent sur navigator
     * @param {Object} target - Objet cible (prototype de navigator)
     * @param {string} value - Valeur de l'User-Agent
     */
    function patchUserAgent(target, value) {
        if (!target || typeof target !== 'object') {
            console.warn('[stealth] invalid target for userAgent patch');
            return;
        }

        try {
            // Utiliser Object.defineProperty avec des descripteurs complets
            Object.defineProperty(target, 'userAgent', {
                get: function() {
                    return value;
                },
                set: function(newValue) {
                    // userAgent est en lecture seule
                    return value;
                },
                configurable: true,
                enumerable: true
            });

            // Si un setter existait, le préserver
            const existingDescriptor = Object.getOwnPropertyDescriptor(target, 'userAgent');
            if (existingDescriptor && typeof existingDescriptor.set === 'function') {
                Object.defineProperty(target, 'userAgent', {
                    get: function() {
                        return value;
                    },
                    set: existingDescriptor.set,
                    configurable: true,
                    enumerable: true
                });
            }

        } catch (e) {
            console.warn('[stealth] failed to patch userAgent:', e);
        }
    }

    // =========================================================================
    // 5. APPLICATION DU PATCH
    // =========================================================================

    const userAgent = getUserAgent();
    const target = Object.getPrototypeOf(navigator);

    if (target) {
        patchUserAgent(target, userAgent);
    } else {
        // Fallback: patch navigator directement
        patchUserAgent(navigator, userAgent);
    }

    // =========================================================================
    // 6. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] navigator.userAgent.js loaded successfully');
        console.log('[stealth] navigator.userAgent:', navigator.userAgent);
        console.log('[stealth] opts:', opts);
    }

})();