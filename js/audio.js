/**
 * audio.js
 * Évasion pour l'API AudioContext / fingerprinting audio
 * 
 * Ajoute un bruit déterministe aux signaux audio pour masquer
 * les caractéristiques du système et éviter le fingerprinting.
 * 
 * Problème ciblé: Les scripts de détection utilisent l'API AudioContext
 * pour générer une empreinte unique du système audio.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que opts existe
    var opts = window.__STEALTH_OPTS__ || {};

    // Vérifier que AudioContext existe
    if (typeof AudioContext === 'undefined' && typeof OfflineAudioContext === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] AudioContext not available, skipping audio.js');
        }
        return;
    }

    // =========================================================================
    // 2. FONCTION DE BRUIT DÉTERMINISTE
    // =========================================================================

    /**
     * Génère une valeur de bruit déterministe basée sur une graine
     * @param {number} seed - Graine pour le générateur
     * @param {number} index - Index pour variation
     * @returns {number} Valeur de bruit entre -1 et 1
     */
    function deterministicNoise(seed, index) {
        // Combiner la graine et l'index
        var value = seed + index * 0.01;
        // Utiliser une fonction sinusoïdale pour générer un bruit pseudo-aléatoire
        var noise = Math.sin(value * 10000) * Math.cos(value * 7777);
        // Normaliser entre -1 et 1
        return Math.max(-1, Math.min(1, noise));
    }

    /**
     * Obtient la graine pour le bruit audio
     * @returns {number} Graine de bruit
     */
    function getAudioSeed() {
        // Utiliser la seed du profil si disponible
        if (typeof opts.seed !== 'undefined') {
            return opts.seed;
        }
        // Utiliser une valeur basée sur le profil matériel
        if (opts.hardware_profile) {
            var profileHash = 0;
            for (var i = 0; i < opts.hardware_profile.length; i++) {
                profileHash = ((profileHash << 5) - profileHash) + opts.hardware_profile.charCodeAt(i);
                profileHash = profileHash & profileHash;
            }
            return Math.abs(profileHash);
        }
        // Valeur par défaut
        return 42;
    }

    // =========================================================================
    // 3. PATCH DE AudioBuffer.prototype.getChannelData
    // =========================================================================

    /**
     * Patch getChannelData pour ajouter du bruit déterministe
     */
    function patchGetChannelData() {
        try {
            if (typeof AudioBuffer === 'undefined' || !AudioBuffer.prototype) {
                return;
            }

            var seed = getAudioSeed();
            var originalGetChannelData = AudioBuffer.prototype.getChannelData;

            AudioBuffer.prototype.getChannelData = function(channel) {
                // Appeler la méthode originale
                var result = originalGetChannelData.call(this, channel);

                // Ajouter du bruit déterministe
                var noiseAmount = 0.0001 + (seed % 100) / 1000000;
                var step = Math.max(1, Math.floor(result.length / 100));

                for (var i = 0; i < result.length; i += step) {
                    var noise = deterministicNoise(seed, i) * noiseAmount;
                    result[i] = Math.max(-1, Math.min(1, result[i] + noise));
                }

                return result;
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] AudioBuffer.prototype.getChannelData patched');
            }

        } catch (e) {
            console.warn('[stealth] patchGetChannelData error:', e);
        }
    }

    // =========================================================================
    // 4. PATCH DE AnalyserNode
    // =========================================================================

    /**
     * Patch AnalyserNode pour masquer les caractéristiques audio
     */
    function patchAnalyserNode() {
        try {
            if (typeof AnalyserNode === 'undefined' || !AnalyserNode.prototype) {
                return;
            }

            var seed = getAudioSeed();

            // Patch getByteFrequencyData
            var originalGetByteFrequencyData = AnalyserNode.prototype.getByteFrequencyData;
            AnalyserNode.prototype.getByteFrequencyData = function(array) {
                originalGetByteFrequencyData.call(this, array);
                // Ajouter du bruit déterministe
                var noiseAmount = 0.5 + (seed % 50) / 100;
                for (var i = 0; i < array.length; i++) {
                    var noise = deterministicNoise(seed + i, i) * noiseAmount;
                    array[i] = Math.max(0, Math.min(255, array[i] + noise));
                }
                return array;
            };

            // Patch getByteTimeDomainData
            var originalGetByteTimeDomainData = AnalyserNode.prototype.getByteTimeDomainData;
            AnalyserNode.prototype.getByteTimeDomainData = function(array) {
                originalGetByteTimeDomainData.call(this, array);
                var noiseAmount = 0.5 + (seed % 50) / 100;
                for (var i = 0; i < array.length; i++) {
                    var noise = deterministicNoise(seed + i * 2, i) * noiseAmount;
                    array[i] = Math.max(0, Math.min(255, array[i] + noise));
                }
                return array;
            };

            // Patch getFloatFrequencyData
            if (typeof AnalyserNode.prototype.getFloatFrequencyData === 'function') {
                var originalGetFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;
                AnalyserNode.prototype.getFloatFrequencyData = function(array) {
                    originalGetFloatFrequencyData.call(this, array);
                    var noiseAmount = 0.5 + (seed % 50) / 100;
                    for (var i = 0; i < array.length; i++) {
                        var noise = deterministicNoise(seed + i * 3, i) * noiseAmount;
                        array[i] = Math.max(-200, Math.min(200, array[i] + noise));
                    }
                    return array;
                };
            }

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] AnalyserNode patched');
            }

        } catch (e) {
            console.warn('[stealth] patchAnalyserNode error:', e);
        }
    }

    // =========================================================================
    // 5. PATCH DE OscillatorNode
    // =========================================================================

    /**
     * Patch OscillatorNode pour masquer les caractéristiques audio
     */
    function patchOscillatorNode() {
        try {
            if (typeof OscillatorNode === 'undefined' || !OscillatorNode.prototype) {
                return;
            }

            var seed = getAudioSeed();

            // Patch start pour ajouter un décalage temporel
            var originalStart = OscillatorNode.prototype.start;
            OscillatorNode.prototype.start = function(when) {
                // Ajouter un micro-décalage déterministe
                var offset = (seed % 100) / 1000000;
                var newWhen = (when || 0) + offset;
                return originalStart.call(this, newWhen);
            };

            // Patch stop pour ajouter un décalage temporel
            var originalStop = OscillatorNode.prototype.stop;
            OscillatorNode.prototype.stop = function(when) {
                var offset = (seed % 100) / 1000000;
                var newWhen = (when || 0) + offset;
                return originalStop.call(this, newWhen);
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] OscillatorNode patched');
            }

        } catch (e) {
            console.warn('[stealth] patchOscillatorNode error:', e);
        }
    }

    // =========================================================================
    // 6. PATCH DE AudioContext
    // =========================================================================

    /**
     * Patch AudioContext pour masquer les caractéristiques audio
     */
    function patchAudioContext() {
        try {
            if (typeof AudioContext === 'undefined') {
                return;
            }

            var seed = getAudioSeed();

            // Patch createAnalyser pour ajouter du bruit
            var originalCreateAnalyser = AudioContext.prototype.createAnalyser;
            AudioContext.prototype.createAnalyser = function() {
                var analyser = originalCreateAnalyser.call(this);
                // Ajouter une propriété cachée pour identifier le patch
                analyser.__stealth_patched = true;
                return analyser;
            };

            // Patch createOscillator pour ajouter du bruit
            var originalCreateOscillator = AudioContext.prototype.createOscillator;
            AudioContext.prototype.createOscillator = function() {
                var oscillator = originalCreateOscillator.call(this);
                oscillator.__stealth_patched = true;
                return oscillator;
            };

            // Patch createBuffer pour ajouter du bruit
            var originalCreateBuffer = AudioContext.prototype.createBuffer;
            AudioContext.prototype.createBuffer = function(numChannels, length, sampleRate) {
                var buffer = originalCreateBuffer.call(this, numChannels, length, sampleRate);
                // Ajouter du bruit déterministe au buffer
                for (var channel = 0; channel < numChannels; channel++) {
                    var data = buffer.getChannelData(channel);
                    var noiseAmount = 0.0001 + (seed % 100) / 1000000;
                    for (var i = 0; i < data.length; i += 10) {
                        var noise = deterministicNoise(seed + channel * 1000 + i, i) * noiseAmount;
                        data[i] = Math.max(-1, Math.min(1, data[i] + noise));
                    }
                }
                return buffer;
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] AudioContext patched');
            }

        } catch (e) {
            console.warn('[stealth] patchAudioContext error:', e);
        }
    }

    // =========================================================================
    // 7. PATCH DE OfflineAudioContext
    // =========================================================================

    /**
     * Patch OfflineAudioContext pour masquer les caractéristiques audio
     */
    function patchOfflineAudioContext() {
        try {
            if (typeof OfflineAudioContext === 'undefined') {
                return;
            }

            var seed = getAudioSeed();

            // Patch startRendering pour ajouter du bruit
            var originalStartRendering = OfflineAudioContext.prototype.startRendering;
            OfflineAudioContext.prototype.startRendering = function() {
                var result = originalStartRendering.call(this);
                // Ajouter du bruit déterministe au résultat
                if (result && typeof result.then === 'function') {
                    return result.then(function(audioBuffer) {
                        if (audioBuffer && audioBuffer.getChannelData) {
                            var noiseAmount = 0.0001 + (seed % 100) / 1000000;
                            for (var channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                                var data = audioBuffer.getChannelData(channel);
                                for (var i = 0; i < data.length; i += 10) {
                                    var noise = deterministicNoise(seed + channel * 1000 + i, i) * noiseAmount;
                                    data[i] = Math.max(-1, Math.min(1, data[i] + noise));
                                }
                            }
                        }
                        return audioBuffer;
                    });
                }
                return result;
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] OfflineAudioContext patched');
            }

        } catch (e) {
            console.warn('[stealth] patchOfflineAudioContext error:', e);
        }
    }

    // =========================================================================
    // 8. APPLICATION DES PATCHS
    // =========================================================================

    // Appliquer tous les patches
    patchGetChannelData();
    patchAnalyserNode();
    patchOscillatorNode();
    patchAudioContext();
    patchOfflineAudioContext();

    // =========================================================================
    // 9. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] audio.js loaded successfully');
        console.log('[stealth] AudioContext patched:',
            typeof AudioContext !== 'undefined');
        console.log('[stealth] OfflineAudioContext patched:',
            typeof OfflineAudioContext !== 'undefined');
        console.log('[stealth] Audio seed:', getAudioSeed());
    }

})();