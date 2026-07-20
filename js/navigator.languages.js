/**
 * navigator.languages.js
 * Évasion pour navigator.languages
 * 
 * Définit une liste réaliste de langues pour navigator.languages
 * afin d'éviter la détection basée sur les langues.
 * 
 * Problème ciblé: Les scripts de détection vérifient la liste des
 * langues pour identifier les environnements headless.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: navigator.languages dans un vrai navigateur
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que navigator existe
    if (typeof navigator === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] navigator not available, skipping languages');
        }
        return;
    }

    // Vérifier que opts existe, sinon créer un objet par défaut
    const opts = window.__STEALTH_OPTS__ || {};
    
    // =========================================================================
    // 2. DÉTERMINATION DE LA LISTE DES LANGUES
    // =========================================================================

    /**
     * Détermine une liste réaliste de langues
     * @returns {string[]} Liste des langues
     */
    function getLanguages() {
        // Si des langues sont spécifiées dans les options, les utiliser
        if (opts.languages && Array.isArray(opts.languages) && opts.languages.length > 0) {
            return opts.languages.slice(); // Copie pour éviter les mutations
        }

        // Si une locale est spécifiée, construire une liste cohérente
        if (opts.locale) {
            const locale = opts.locale;
            // Extraire la langue de base (ex: 'fr' de 'fr-FR')
            const baseLang = locale.split('-')[0];
            // Construire une liste cohérente: langue complète, langue de base, anglais
            const languages = [locale];
            if (baseLang && baseLang !== locale) {
                languages.push(baseLang);
            }
            // Ajouter l'anglais si pas déjà présent
            if (!languages.includes('en-US') && !languages.includes('en')) {
                languages.push('en-US');
                languages.push('en');
            }
            return languages;
        }

        // Liste par défaut (la plus courante)
        return ['en-US', 'en'];
    }

    // =========================================================================
    // 3. PATCH DE navigator.languages
    // =========================================================================

    /**
     * Patch la propriété languages sur navigator
     * @param {Object} target - Objet cible (prototype de navigator)
     * @param {Array} value - Liste des langues
     */
    function patchLanguages(target, value) {
        if (!target || typeof target !== 'object') {
            console.warn('[stealth] invalid target for languages patch');
            return;
        }

        try {
            // S'assurer que la valeur est un tableau gelé pour éviter les mutations
            const frozenValue = Object.freeze(value.slice());

            // Utiliser Object.defineProperty avec des descripteurs complets
            Object.defineProperty(target, 'languages', {
                get: function() {
                    return frozenValue;
                },
                set: function(newValue) {
                    // languages est en lecture seule
                    return frozenValue;
                },
                configurable: true,
                enumerable: true
            });

            // Si un setter existait, le préserver
            const existingDescriptor = Object.getOwnPropertyDescriptor(target, 'languages');
            if (existingDescriptor && typeof existingDescriptor.set === 'function') {
                Object.defineProperty(target, 'languages', {
                    get: function() {
                        return frozenValue;
                    },
                    set: existingDescriptor.set,
                    configurable: true,
                    enumerable: true
                });
            }

        } catch (e) {
            console.warn('[stealth] failed to patch languages:', e);
        }
    }

    // =========================================================================
    // 4. APPLICATION DU PATCH
    // =========================================================================

    const languages = getLanguages();
    const target = Object.getPrototypeOf(navigator);

    if (target) {
        patchLanguages(target, languages);
    } else {
        // Fallback: patch navigator directement
        patchLanguages(navigator, languages);
    }

    // =========================================================================
    // 5. COHÉRENCE AVEC navigator.language
    // =========================================================================

    /**
     * Assure la cohérence entre navigator.languages et navigator.language
     */
    function ensureLanguageConsistency() {
        try {
            const currentLanguages = navigator.languages;
            if (currentLanguages && currentLanguages.length > 0) {
                const primaryLanguage = currentLanguages[0];
                // Patch navigator.language pour qu'il corresponde
                Object.defineProperty(Object.getPrototypeOf(navigator), 'language', {
                    get: function() {
                        return primaryLanguage;
                    },
                    configurable: true,
                    enumerable: true
                });
            }
        } catch (e) {
            console.debug('[stealth] failed to ensure language consistency:', e);
        }
    }

    // Exécuter la vérification de cohérence
    ensureLanguageConsistency();

    // =========================================================================
    // 6. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] navigator.languages.js loaded successfully');
        console.log('[stealth] navigator.languages:', navigator.languages);
        console.log('[stealth] navigator.language:', navigator.language);
        console.log('[stealth] opts:', opts);
    }

})();