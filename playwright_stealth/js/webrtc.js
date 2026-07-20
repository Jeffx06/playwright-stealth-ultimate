/**
 * webrtc.js
 * Évasion pour WebRTC - Masquage de l'IP locale
 * 
 * Intercepte les appels WebRTC pour masquer l'adresse IP locale
 * et simuler un comportement réseau réaliste.
 * 
 * Problème ciblé: Les scripts de détection utilisent WebRTC
 * pour révéler l'adresse IP locale.
 * 
 * Compatibilité: Chrome 80+
 * 
 * Référence: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
 *            https://www.browserleaks.com/webrtc
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. VÉRIFICATION DES DÉPENDANCES
    // =========================================================================

    // Vérifier que RTCPeerConnection existe
    if (typeof RTCPeerConnection === 'undefined') {
        if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
            console.warn('[stealth] RTCPeerConnection not available, skipping webrtc.js');
        }
        return;
    }

    // Vérifier que opts existe
    var opts = window.__STEALTH_OPTS__ || {};

    // =========================================================================
    // 2. CONFIGURATION
    // =========================================================================

    /**
     * Obtient la configuration réseau
     * @returns {object} Configuration réseau
     */
    function getNetworkConfig() {
        // Si une configuration est spécifiée
        if (opts.webrtc_config) {
            return opts.webrtc_config;
        }

        // Configuration par défaut
        return {
            // IP locale à masquer (0.0.0.0 pour masquer complètement)
            localIP: '0.0.0.0',
            // IP publique simulée (optionnelle)
            publicIP: null,
            // Masquer les IPs dans les candidats ICE
            hideIPs: true,
            // Simuler un réseau réaliste
            simulateNetwork: true
        };
    }

    var config = getNetworkConfig();

    // =========================================================================
    // 3. PATCH DE RTCPeerConnection
    // =========================================================================

    /**
     * Patch RTCPeerConnection pour masquer les IPs
     */
    function patchRTCPeerConnection() {
        try {
            var originalRTCPeerConnection = RTCPeerConnection;

            // Fonction pour masquer les IPs dans les candidats ICE
            function maskICEAddress(sdp) {
                if (!config.hideIPs) {
                    return sdp;
                }

                // Remplacer les adresses IP dans les candidats ICE
                // Format: candidate:... 1 UDP 2122252543 192.168.1.100 5000 typ host
                // Format: candidate:... 1 UDP 2122252543 10.0.0.1 5000 typ srflx
                // Format: candidate:... 1 UDP 2122252543 172.16.0.1 5000 typ host

                // Remplacer les IPs privées
                // 192.168.x.x
                sdp = sdp.replace(/(\d{1,3}\.){3}\d{1,3}/g, function(match) {
                    // Vérifier si c'est une IP privée
                    var parts = match.split('.');
                    if (parts.length === 4) {
                        var first = parseInt(parts[0], 10);
                        var second = parseInt(parts[1], 10);
                        // 10.0.0.0/8
                        if (first === 10) {
                            return config.localIP || '0.0.0.0';
                        }
                        // 172.16.0.0/12
                        if (first === 172 && second >= 16 && second <= 31) {
                            return config.localIP || '0.0.0.0';
                        }
                        // 192.168.0.0/16
                        if (first === 192 && second === 168) {
                            return config.localIP || '0.0.0.0';
                        }
                        // 127.0.0.1
                        if (match === '127.0.0.1') {
                            return config.localIP || '0.0.0.0';
                        }
                    }
                    return match;
                });

                return sdp;
            }

            // Nouvelle implémentation de RTCPeerConnection
            RTCPeerConnection = function(configuration) {
                // Créer l'instance originale
                var instance = new originalRTCPeerConnection(configuration);

                // Patch createDataChannel
                var originalCreateDataChannel = instance.createDataChannel;
                instance.createDataChannel = function(label, options) {
                    // Appeler la méthode originale
                    var channel = originalCreateDataChannel.call(this, label, options);
                    // Marquer le canal pour le masquage
                    channel.__stealth_patched = true;
                    return channel;
                };

                // Patch createOffer
                var originalCreateOffer = instance.createOffer;
                instance.createOffer = function(options) {
                    return originalCreateOffer.call(this, options).then(function(offer) {
                        // Masquer les IPs dans la SDP
                        if (offer && offer.sdp) {
                            offer.sdp = maskICEAddress(offer.sdp);
                        }
                        return offer;
                    });
                };

                // Patch createAnswer
                var originalCreateAnswer = instance.createAnswer;
                instance.createAnswer = function(options) {
                    return originalCreateAnswer.call(this, options).then(function(answer) {
                        // Masquer les IPs dans la SDP
                        if (answer && answer.sdp) {
                            answer.sdp = maskICEAddress(answer.sdp);
                        }
                        return answer;
                    });
                };

                // Patch setLocalDescription
                var originalSetLocalDescription = instance.setLocalDescription;
                instance.setLocalDescription = function(description) {
                    // Masquer les IPs dans la SDP avant de définir la description
                    if (description && description.sdp) {
                        description.sdp = maskICEAddress(description.sdp);
                    }
                    return originalSetLocalDescription.call(this, description);
                };

                // Patch addIceCandidate
                var originalAddIceCandidate = instance.addIceCandidate;
                instance.addIceCandidate = function(candidate) {
                    // Filtrer les candidats ICE
                    if (candidate && candidate.candidate) {
                        // Vérifier si le candidat contient une IP privée
                        var ipMatch = candidate.candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
                        if (ipMatch) {
                            var ip = ipMatch[0];
                            var parts = ip.split('.');
                            if (parts.length === 4) {
                                var first = parseInt(parts[0], 10);
                                var second = parseInt(parts[1], 10);
                                // Si c'est une IP privée, ignorer le candidat
                                if (first === 10 || (first === 172 && second >= 16 && second <= 31) ||
                                    (first === 192 && second === 168) || ip === '127.0.0.1') {
                                    return Promise.resolve();
                                }
                            }
                        }
                    }
                    return originalAddIceCandidate.call(this, candidate);
                };

                // Patch getStats
                var originalGetStats = instance.getStats;
                instance.getStats = function(selector) {
                    return originalGetStats.call(this, selector).then(function(stats) {
                        // Filtrer les statistiques pour masquer les IPs
                        if (stats && typeof stats.forEach === 'function') {
                            var filteredStats = new Map();
                            stats.forEach(function(value, key) {
                                // Filtrer les candidats avec des IPs privées
                                if (value && value.candidateType) {
                                    // Vérifier si le candidat contient une IP privée
                                    var ip = value.ipAddress || value.address;
                                    if (ip) {
                                        var parts = ip.split('.');
                                        if (parts.length === 4) {
                                            var first = parseInt(parts[0], 10);
                                            var second = parseInt(parts[1], 10);
                                            if (first === 10 || (first === 172 && second >= 16 && second <= 31) ||
                                                (first === 192 && second === 168) || ip === '127.0.0.1') {
                                                // Ignorer ce candidat
                                                return;
                                            }
                                        }
                                    }
                                }
                                filteredStats.set(key, value);
                            });
                            return filteredStats;
                        }
                        return stats;
                    });
                };

                // Ajouter une propriété pour identifier l'instance patchée
                instance.__stealth_patched = true;

                return instance;
            };

            // Copier les propriétés statiques
            RTCPeerConnection.prototype = originalRTCPeerConnection.prototype;
            RTCPeerConnection.generateCertificate = originalRTCPeerConnection.generateCertificate;

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] RTCPeerConnection patched');
            }

        } catch (e) {
            console.warn('[stealth] patchRTCPeerConnection error:', e);
        }
    }

    // =========================================================================
    // 4. PATCH DE RTCSessionDescription
    // =========================================================================

    /**
     * Patch RTCSessionDescription pour masquer les IPs
     */
    function patchRTCSessionDescription() {
        try {
            if (typeof RTCSessionDescription === 'undefined') {
                return;
            }

            var originalRTCSessionDescription = RTCSessionDescription;

            RTCSessionDescription = function(description) {
                // Masquer les IPs dans la SDP
                if (description && description.sdp) {
                    // Remplacer les IPs privées
                    description.sdp = description.sdp.replace(/(\d{1,3}\.){3}\d{1,3}/g, function(match) {
                        var parts = match.split('.');
                        if (parts.length === 4) {
                            var first = parseInt(parts[0], 10);
                            var second = parseInt(parts[1], 10);
                            if (first === 10 || (first === 172 && second >= 16 && second <= 31) ||
                                (first === 192 && second === 168) || match === '127.0.0.1') {
                                return config.localIP || '0.0.0.0';
                            }
                        }
                        return match;
                    });
                }

                return new originalRTCSessionDescription(description);
            };

            // Copier le prototype
            RTCSessionDescription.prototype = originalRTCSessionDescription.prototype;

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] RTCSessionDescription patched');
            }

        } catch (e) {
            console.warn('[stealth] patchRTCSessionDescription error:', e);
        }
    }

    // =========================================================================
    // 5. PATCH DE RTCIceCandidate
    // =========================================================================

    /**
     * Patch RTCIceCandidate pour masquer les IPs
     */
    function patchRTCIceCandidate() {
        try {
            if (typeof RTCIceCandidate === 'undefined') {
                return;
            }

            var originalRTCIceCandidate = RTCIceCandidate;

            RTCIceCandidate = function(candidate) {
                // Masquer les IPs dans le candidat
                if (candidate && candidate.candidate) {
                    candidate.candidate = candidate.candidate.replace(/(\d{1,3}\.){3}\d{1,3}/g, function(match) {
                        var parts = match.split('.');
                        if (parts.length === 4) {
                            var first = parseInt(parts[0], 10);
                            var second = parseInt(parts[1], 10);
                            if (first === 10 || (first === 172 && second >= 16 && second <= 31) ||
                                (first === 192 && second === 168) || match === '127.0.0.1') {
                                return config.localIP || '0.0.0.0';
                            }
                        }
                        return match;
                    });
                }

                return new originalRTCIceCandidate(candidate);
            };

            // Copier le prototype
            RTCIceCandidate.prototype = originalRTCIceCandidate.prototype;

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] RTCIceCandidate patched');
            }

        } catch (e) {
            console.warn('[stealth] patchRTCIceCandidate error:', e);
        }
    }

    // =========================================================================
    // 6. PATCH DE RTCRtpSender ET RTCRtpReceiver
    // =========================================================================

    /**
     * Patch RTCRtpSender et RTCRtpReceiver pour masquer les IPs
     */
    function patchRTCRtp() {
        try {
            if (typeof RTCRtpSender !== 'undefined' && RTCRtpSender.prototype) {
                var originalGetStats = RTCRtpSender.prototype.getStats;
                RTCRtpSender.prototype.getStats = function() {
                    return originalGetStats.call(this).then(function(stats) {
                        // Filtrer les statistiques
                        if (stats && typeof stats.forEach === 'function') {
                            var filteredStats = new Map();
                            stats.forEach(function(value, key) {
                                if (value && value.candidateType) {
                                    var ip = value.ipAddress || value.address;
                                    if (ip) {
                                        var parts = ip.split('.');
                                        if (parts.length === 4) {
                                            var first = parseInt(parts[0], 10);
                                            var second = parseInt(parts[1], 10);
                                            if (first === 10 || (first === 172 && second >= 16 && second <= 31) ||
                                                (first === 192 && second === 168) || ip === '127.0.0.1') {
                                                return;
                                            }
                                        }
                                    }
                                }
                                filteredStats.set(key, value);
                            });
                            return filteredStats;
                        }
                        return stats;
                    });
                };
            }

            if (typeof RTCRtpReceiver !== 'undefined' && RTCRtpReceiver.prototype) {
                var originalGetStats = RTCRtpReceiver.prototype.getStats;
                RTCRtpReceiver.prototype.getStats = function() {
                    return originalGetStats.call(this).then(function(stats) {
                        // Filtrer les statistiques
                        if (stats && typeof stats.forEach === 'function') {
                            var filteredStats = new Map();
                            stats.forEach(function(value, key) {
                                if (value && value.candidateType) {
                                    var ip = value.ipAddress || value.address;
                                    if (ip) {
                                        var parts = ip.split('.');
                                        if (parts.length === 4) {
                                            var first = parseInt(parts[0], 10);
                                            var second = parseInt(parts[1], 10);
                                            if (first === 10 || (first === 172 && second >= 16 && second <= 31) ||
                                                (first === 192 && second === 168) || ip === '127.0.0.1') {
                                                return;
                                            }
                                        }
                                    }
                                }
                                filteredStats.set(key, value);
                            });
                            return filteredStats;
                        }
                        return stats;
                    });
                };
            }

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] RTCRtpSender/Receiver patched');
            }

        } catch (e) {
            console.warn('[stealth] patchRTCRtp error:', e);
        }
    }

    // =========================================================================
    // 7. PATCH DE navigator.mediaDevices.enumerateDevices
    // =========================================================================

    /**
     * Patch enumerateDevices pour masquer les périphériques
     */
    function patchEnumerateDevices() {
        try {
            if (typeof navigator.mediaDevices === 'undefined' ||
                typeof navigator.mediaDevices.enumerateDevices !== 'function') {
                return;
            }

            var originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;

            navigator.mediaDevices.enumerateDevices = function() {
                return originalEnumerateDevices.call(this).then(function(devices) {
                    // Filtrer les périphériques audio/vidéo
                    // Simuler un ensemble réaliste de périphériques
                    var filteredDevices = [];

                    // Simuler un périphérique audio par défaut
                    filteredDevices.push({
                        deviceId: 'default',
                        kind: 'audioinput',
                        label: 'Default - Microphone (Realtek Audio)',
                        groupId: 'default-audio-group'
                    });

                    filteredDevices.push({
                        deviceId: 'default',
                        kind: 'audiooutput',
                        label: 'Default - Speakers (Realtek Audio)',
                        groupId: 'default-audio-group'
                    });

                    // Simuler une caméra
                    filteredDevices.push({
                        deviceId: 'default',
                        kind: 'videoinput',
                        label: 'Default - Integrated Camera',
                        groupId: 'default-video-group'
                    });

                    // Si l'utilisateur a des périphériques réels, les ajouter
                    if (devices && devices.length > 0) {
                        // Filtrer les périphériques réels
                        var realDevices = devices.filter(function(d) {
                            // Garder les périphériques audio/vidéo
                            return d.kind === 'audioinput' ||
                                   d.kind === 'audiooutput' ||
                                   d.kind === 'videoinput';
                        });

                        // Ajouter les périphériques réels
                        for (var i = 0; i < realDevices.length; i++) {
                            filteredDevices.push(realDevices[i]);
                        }
                    }

                    return filteredDevices;
                });
            };

            if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
                console.log('[stealth] navigator.mediaDevices.enumerateDevices patched');
            }

        } catch (e) {
            console.warn('[stealth] patchEnumerateDevices error:', e);
        }
    }

    // =========================================================================
    // 8. APPLICATION DES PATCHS
    // =========================================================================

    // Appliquer tous les patches
    patchRTCPeerConnection();
    patchRTCSessionDescription();
    patchRTCIceCandidate();
    patchRTCRtp();
    patchEnumerateDevices();

    // =========================================================================
    // 9. LOG DE DÉBOGAGE
    // =========================================================================

    if (typeof window.__STEALTH_DEBUG__ !== 'undefined' && window.__STEALTH_DEBUG__) {
        console.log('[stealth] webrtc.js loaded successfully');
        console.log('[stealth] RTCPeerConnection patched:', typeof RTCPeerConnection !== 'undefined');
        console.log('[stealth] RTCSessionDescription patched:', typeof RTCSessionDescription !== 'undefined');
        console.log('[stealth] RTCIceCandidate patched:', typeof RTCIceCandidate !== 'undefined');
        console.log('[stealth] Config:', config);
    }

})();