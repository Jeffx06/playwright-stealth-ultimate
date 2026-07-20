/**
 * intl.js
 * Évasion pour l'API Intl
 * 
 * Assure la cohérence entre les différentes APIs Intl (DateTimeFormat,
 * NumberFormat, Collator, etc.) pour éviter la détection basée sur
 * les incohérences linguistiques.
 * 
 * Problème ciblé: Les scripts de détection vérifient les APIs Intl
 * pour détecter des incohérences entre la langue, la locale et le
 * fuseau horaire.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que Intl existe
    if (typeof Intl === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] Intl not available, skipping intl.js');
        }
        return;
    }

    // Vérifier que opts existe
    var opts = window.__STEALTH_OPTS__ || {};

    // =========================================================================
    // 2. DÉTERMINATION DE LA LOCALE ET DU FUSEAU
    // =========================================================================

    /**
     * Obtient la locale à utiliser
     * @returns {string} Locale (ex: 'fr-FR')
     */
    function getLocale() {
        // Utiliser la locale des options si disponible
        if (opts.locale) {
            return opts.locale;
        }
        // Utiliser navigator.language si disponible
        if (typeof navigator !== 'undefined' && navigator.language) {
            return navigator.language;
        }
        // Valeur par défaut
        return 'en-US';
    }

    /**
     * Obtient le fuseau horaire à utiliser
     * @returns {string} Fuseau horaire (ex: 'Europe/Paris')
     */
    function getTimezone() {
        // Utiliser le fuseau des options si disponible
        if (opts.timezone) {
            return opts.timezone;
        }
        // Détection automatique basée sur la locale
        var locale = getLocale();
        var timezoneMap = {
            'fr': 'Europe/Paris',
            'en-US': 'America/New_York',
            'en-GB': 'Europe/London',
            'de': 'Europe/Berlin',
            'es': 'Europe/Madrid',
            'it': 'Europe/Rome',
            'pt': 'Europe/Lisbon',
            'ja': 'Asia/Tokyo',
            'zh': 'Asia/Shanghai',
            'ru': 'Europe/Moscow',
            'ar': 'Asia/Dubai',
            'hi': 'Asia/Kolkata'
        };
        var lang = locale.split('-')[0];
        if (timezoneMap[lang]) {
            return timezoneMap[lang];
        }
        if (timezoneMap[locale]) {
            return timezoneMap[locale];
        }
        // Valeur par défaut
        return 'Europe/Paris';
    }

    /**
     * Obtient la liste des langues
     * @returns {Array} Liste des langues
     */
    function getLanguages() {
        if (opts.languages && Array.isArray(opts.languages) && opts.languages.length > 0) {
            return opts.languages;
        }
        if (typeof navigator !== 'undefined' && navigator.languages) {
            return navigator.languages;
        }
        return [getLocale()];
    }

    // =========================================================================
    // 3. PATCH DE Intl.DateTimeFormat
    // =========================================================================

    /**
     * Patch DateTimeFormat pour assurer la cohérence du fuseau horaire
     */
    function patchDateTimeFormat() {
        try {
            var locale = getLocale();
            var timezone = getTimezone();

            var originalDateTimeFormat = Intl.DateTimeFormat;

            Intl.DateTimeFormat = function(locales, options) {
                // Assurer la cohérence du fuseau horaire
                var mergedOptions = options || {};
                if (!mergedOptions.timeZone) {
                    mergedOptions.timeZone = timezone;
                }

                // Utiliser la locale par défaut si non spécifiée
                var resolvedLocales = locales || locale;

                // Créer l'instance
                var instance = new originalDateTimeFormat(resolvedLocales, mergedOptions);

                // Patch resolvedOptions
                var originalResolvedOptions = instance.resolvedOptions;
                instance.resolvedOptions = function() {
                    var resolved = originalResolvedOptions.call(this);
                    // Assurer la cohérence
                    resolved.timeZone = timezone;
                    if (!resolved.locale || resolved.locale === 'en') {
                        resolved.locale = locale;
                    }
                    return resolved;
                };

                return instance;
            };

            // Copier le prototype
            Intl.DateTimeFormat.prototype = originalDateTimeFormat.prototype;
            Intl.DateTimeFormat.supportedLocalesOf = originalDateTimeFormat.supportedLocalesOf;

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] Intl.DateTimeFormat patched');
            }

        } catch (e) {
            console.warn('[stealth] patchDateTimeFormat error:', e);
        }
    }

    // =========================================================================
    // 4. PATCH DE Intl.NumberFormat
    // =========================================================================

    /**
     * Patch NumberFormat pour assurer la cohérence de la locale
     */
    function patchNumberFormat() {
        try {
            var locale = getLocale();

            var originalNumberFormat = Intl.NumberFormat;

            Intl.NumberFormat = function(locales, options) {
                var resolvedLocales = locales || locale;
                var instance = new originalNumberFormat(resolvedLocales, options);

                var originalResolvedOptions = instance.resolvedOptions;
                instance.resolvedOptions = function() {
                    var resolved = originalResolvedOptions.call(this);
                    if (!resolved.locale || resolved.locale === 'en') {
                        resolved.locale = locale;
                    }
                    return resolved;
                };

                return instance;
            };

            Intl.NumberFormat.prototype = originalNumberFormat.prototype;
            Intl.NumberFormat.supportedLocalesOf = originalNumberFormat.supportedLocalesOf;

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] Intl.NumberFormat patched');
            }

        } catch (e) {
            console.warn('[stealth] patchNumberFormat error:', e);
        }
    }

    // =========================================================================
    // 5. PATCH DE Intl.Collator
    // =========================================================================

    /**
     * Patch Collator pour assurer la cohérence de la locale
     */
    function patchCollator() {
        try {
            var locale = getLocale();

            var originalCollator = Intl.Collator;

            Intl.Collator = function(locales, options) {
                var resolvedLocales = locales || locale;
                var instance = new originalCollator(resolvedLocales, options);

                var originalResolvedOptions = instance.resolvedOptions;
                instance.resolvedOptions = function() {
                    var resolved = originalResolvedOptions.call(this);
                    if (!resolved.locale || resolved.locale === 'en') {
                        resolved.locale = locale;
                    }
                    return resolved;
                };

                return instance;
            };

            Intl.Collator.prototype = originalCollator.prototype;
            Intl.Collator.supportedLocalesOf = originalCollator.supportedLocalesOf;

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] Intl.Collator patched');
            }

        } catch (e) {
            console.warn('[stealth] patchCollator error:', e);
        }
    }

    // =========================================================================
    // 6. PATCH DE Intl.DisplayNames
    // =========================================================================

    /**
     * Patch DisplayNames pour assurer la cohérence de la locale
     */
    function patchDisplayNames() {
        try {
            if (typeof Intl.DisplayNames === 'undefined') {
                return;
            }

            var locale = getLocale();

            var originalDisplayNames = Intl.DisplayNames;

            Intl.DisplayNames = function(locales, options) {
                var resolvedLocales = locales || locale;
                var instance = new originalDisplayNames(resolvedLocales, options);

                var originalResolvedOptions = instance.resolvedOptions;
                instance.resolvedOptions = function() {
                    var resolved = originalResolvedOptions.call(this);
                    if (!resolved.locale || resolved.locale === 'en') {
                        resolved.locale = locale;
                    }
                    return resolved;
                };

                return instance;
            };

            Intl.DisplayNames.prototype = originalDisplayNames.prototype;
            Intl.DisplayNames.supportedLocalesOf = originalDisplayNames.supportedLocalesOf;

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] Intl.DisplayNames patched');
            }

        } catch (e) {
            console.warn('[stealth] patchDisplayNames error:', e);
        }
    }

    // =========================================================================
    // 7. PATCH DE Intl.ListFormat
    // =========================================================================

    /**
     * Patch ListFormat pour assurer la cohérence de la locale
     */
    function patchListFormat() {
        try {
            if (typeof Intl.ListFormat === 'undefined') {
                return;
            }

            var locale = getLocale();

            var originalListFormat = Intl.ListFormat;

            Intl.ListFormat = function(locales, options) {
                var resolvedLocales = locales || locale;
                var instance = new originalListFormat(resolvedLocales, options);

                var originalResolvedOptions = instance.resolvedOptions;
                instance.resolvedOptions = function() {
                    var resolved = originalResolvedOptions.call(this);
                    if (!resolved.locale || resolved.locale === 'en') {
                        resolved.locale = locale;
                    }
                    return resolved;
                };

                return instance;
            };

            Intl.ListFormat.prototype = originalListFormat.prototype;
            Intl.ListFormat.supportedLocalesOf = originalListFormat.supportedLocalesOf;

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] Intl.ListFormat patched');
            }

        } catch (e) {
            console.warn('[stealth] patchListFormat error:', e);
        }
    }

    // =========================================================================
    // 8. PATCH DE Intl.RelativeTimeFormat
    // =========================================================================

    /**
     * Patch RelativeTimeFormat pour assurer la cohérence de la locale
     */
    function patchRelativeTimeFormat() {
        try {
            if (typeof Intl.RelativeTimeFormat === 'undefined') {
                return;
            }

            var locale = getLocale();

            var originalRelativeTimeFormat = Intl.RelativeTimeFormat;

            Intl.RelativeTimeFormat = function(locales, options) {
                var resolvedLocales = locales || locale;
                var instance = new originalRelativeTimeFormat(resolvedLocales, options);

                var originalResolvedOptions = instance.resolvedOptions;
                instance.resolvedOptions = function() {
                    var resolved = originalResolvedOptions.call(this);
                    if (!resolved.locale || resolved.locale === 'en') {
                        resolved.locale = locale;
                    }
                    return resolved;
                };

                return instance;
            };

            Intl.RelativeTimeFormat.prototype = originalRelativeTimeFormat.prototype;
            Intl.RelativeTimeFormat.supportedLocalesOf = originalRelativeTimeFormat.supportedLocalesOf;

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] Intl.RelativeTimeFormat patched');
            }

        } catch (e) {
            console.warn('[stealth] patchRelativeTimeFormat error:', e);
        }
    }

    // =========================================================================
    // 9. PATCH DE Intl.PluralRules
    // =========================================================================

    /**
     * Patch PluralRules pour assurer la cohérence de la locale
     */
    function patchPluralRules() {
        try {
            if (typeof Intl.PluralRules === 'undefined') {
                return;
            }

            var locale = getLocale();

            var originalPluralRules = Intl.PluralRules;

            Intl.PluralRules = function(locales, options) {
                var resolvedLocales = locales || locale;
                var instance = new originalPluralRules(resolvedLocales, options);

                var originalResolvedOptions = instance.resolvedOptions;
                instance.resolvedOptions = function() {
                    var resolved = originalResolvedOptions.call(this);
                    if (!resolved.locale || resolved.locale === 'en') {
                        resolved.locale = locale;
                    }
                    return resolved;
                };

                return instance;
            };

            Intl.PluralRules.prototype = originalPluralRules.prototype;
            Intl.PluralRules.supportedLocalesOf = originalPluralRules.supportedLocalesOf;

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] Intl.PluralRules patched');
            }

        } catch (e) {
            console.warn('[stealth] patchPluralRules error:', e);
        }
    }

    // =========================================================================
    // 10. APPLICATION DES PATCHS
    // =========================================================================

    // Appliquer tous les patches
    patchDateTimeFormat();
    patchNumberFormat();
    patchCollator();
    patchDisplayNames();
    patchListFormat();
    patchRelativeTimeFormat();
    patchPluralRules();

    // =========================================================================
    // 11. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] intl.js loaded successfully');
        console.log('[stealth] Locale:', getLocale());
        console.log('[stealth] Timezone:', getTimezone());
        console.log('[stealth] Languages:', getLanguages());
        console.log('[stealth] Intl.DateTimeFormat patched:', typeof Intl.DateTimeFormat !== 'undefined');
        console.log('[stealth] Intl.NumberFormat patched:', typeof Intl.NumberFormat !== 'undefined');
        console.log('[stealth] Intl.Collator patched:', typeof Intl.Collator !== 'undefined');
        console.log('[stealth] Intl.DisplayNames patched:', typeof Intl.DisplayNames !== 'undefined');
        console.log('[stealth] Intl.ListFormat patched:', typeof Intl.ListFormat !== 'undefined');
        console.log('[stealth] Intl.RelativeTimeFormat patched:', typeof Intl.RelativeTimeFormat !== 'undefined');
        console.log('[stealth] Intl.PluralRules patched:', typeof Intl.PluralRules !== 'undefined');
    }

})();