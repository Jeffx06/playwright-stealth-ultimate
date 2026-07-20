/**
 * window.properties.js
 * Nettoyage des propriétés d'automatisation
 * 
 * Supprime les propriétés associées aux frameworks d'automatisation
 * (Playwright, Puppeteer, Selenium, WebDriver) des objets globaux.
 * 
 * Problème ciblé: Les scripts de détection vérifient la présence
 * de propriétés spécifiques aux frameworks d'automatisation.
 * 
 * Compatibilité: Chrome 80+
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. CONFIGURATION
    // =========================================================================

    /**
     * Signatures d'automatisation à supprimer
     * Ces patterns sont associés aux frameworks d'automatisation
     */
    var SIGNATURES = [
        // Playwright
        '__playwright',
        '__playwright__',
        // Puppeteer
        '__puppeteer',
        '__puppeteer__',
        // Selenium
        'fxdriver',
        '_selenium',
        // WebDriver
        '_webdriver',
        'webdriver',
        '__webdriver_evaluate',
        '__webdriver_script_fn',
        '__webdriver_script_func',
        // Chrome DevTools Protocol
        'cdc_',
        'cdc_ado',
        // PhantomJS
        '__phantomas',
        '_phantom',
        // NightmareJS
        '__nightmare',
        // Cypress
        '__cypress',
        // TestCafe
        '__testcafe',
        // Generic
        '__automation',
        'selenium'
    ];

    /**
     * Objets à nettoyer
     */
    var TARGETS = ['window', 'document', 'navigator'];

    // =========================================================================
    // 2. FONCTIONS DE DÉTECTION
    // =========================================================================

    /**
     * Vérifie si une propriété est une signature d'automatisation
     * @param {string} prop - Nom de la propriété
     * @returns {boolean} True si c'est une signature
     */
    function isAutomationSignature(prop) {
        if (typeof prop !== 'string') {
            return false;
        }

        var lowerProp = prop.toLowerCase();

        for (var i = 0; i < SIGNATURES.length; i++) {
            var sig = SIGNATURES[i].toLowerCase();
            if (lowerProp.includes(sig)) {
                return true;
            }
        }

        // Pattern spécifique pour Selenium (cdc_xxx)
        if (/^cdc_[a-z0-9]+$/i.test(prop)) {
            return true;
        }

        return false;
    }

    // =========================================================================
    // 3. NETTOYAGE D'UN OBJET
    // =========================================================================

    /**
     * Nettoie un objet des propriétés d'automatisation
     * @param {object} target - Objet à nettoyer
     * @param {string} targetName - Nom de l'objet (pour le débogage)
     */
    function cleanObject(target, targetName) {
        if (!target || typeof target !== 'object') {
            return;
        }

        try {
            var props = Object.getOwnPropertyNames(target);
            var cleaned = [];

            for (var i = 0; i < props.length; i++) {
                var prop = props[i];

                if (isAutomationSignature(prop)) {
                    try {
                        // Tentative de suppression
                        delete target[prop];
                        cleaned.push(prop + ' (deleted)');
                    } catch (e) {
                        // Si la suppression échoue, masquer la propriété
                        try {
                            Object.defineProperty(target, prop, {
                                value: undefined,
                                writable: false,
                                enumerable: false,
                                configurable: true
                            });
                            cleaned.push(prop + ' (hidden)');
                        } catch (e2) {
                            // Ignorer
                        }
                    }
                }
            }

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__ && cleaned.length > 0) {
                console.log('[stealth] Cleaned ' + cleaned.length + ' properties from ' + targetName + ':', cleaned);
            }

        } catch (e) {
            // Ignorer les erreurs
        }
    }

    // =========================================================================
    // 4. NETTOYAGE DU PROTOTYPE
    // =========================================================================

    /**
     * Nettoie également les prototypes des objets
     * @param {object} target - Objet cible
     * @param {string} targetName - Nom de l'objet
     */
    function cleanPrototype(target, targetName) {
        if (!target || typeof target !== 'object') {
            return;
        }

        try {
            var proto = Object.getPrototypeOf(target);
            if (proto && proto !== Object.prototype) {
                cleanObject(proto, targetName + '.prototype');
            }
        } catch (e) {
            // Ignorer
        }
    }

    // =========================================================================
    // 5. APPLICATION DES NETTOYAGES
    // =========================================================================

    // Nettoyer les objets principaux
    if (typeof window !== 'undefined') {
        cleanObject(window, 'window');
        cleanPrototype(window, 'window');
    }

    if (typeof document !== 'undefined') {
        cleanObject(document, 'document');
        cleanPrototype(document, 'document');

        // Nettoyer document.documentElement si disponible
        if (document.documentElement) {
            cleanObject(document.documentElement, 'document.documentElement');
        }
    }

    if (typeof navigator !== 'undefined') {
        cleanObject(navigator, 'navigator');
        cleanPrototype(navigator, 'navigator');
    }

    // Nettoyer window.navigator (si différent)
    if (typeof window !== 'undefined' && window.navigator) {
        cleanObject(window.navigator, 'window.navigator');
    }

    // =========================================================================
    // 6. PROTECTION SUPPLÉMENTAIRE
    // =========================================================================

    /**
     * Ajoute une protection pour empêcher la réapparition des propriétés
     */
    function addProtection() {
        try {
            // Empêcher la définition de propriétés d'automatisation
            var originalDefineProperty = Object.defineProperty;
            Object.defineProperty = function(obj, prop, descriptor) {
                if (isAutomationSignature(prop)) {
                    // Ignorer les tentatives de définition de propriétés d'automatisation
                    return obj;
                }
                return originalDefineProperty.call(this, obj, prop, descriptor);
            };

            // Sauvegarder la fonction originale
            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] Object.defineProperty protected');
            }

        } catch (e) {
            console.warn('[stealth] addProtection error:', e);
        }
    }

    // Ajouter la protection (optionnelle, peut être trop intrusive)
    // addProtection();

    // =========================================================================
    // 7. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] window.properties.js loaded successfully');
        console.log('[stealth] Signatures:', SIGNATURES.length);
        console.log('[stealth] Targets:', TARGETS.join(', '));
    }

})();