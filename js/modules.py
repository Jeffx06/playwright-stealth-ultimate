# js/modules.py
"""Liste des modules d'évasion JavaScript"""

from pathlib import Path
import sys


class JSEvasionModule:
    """Module d'évasion JavaScript simple"""
    
    def __init__(self, name: str, script_name: str, priority: int = 0):
        self.name = name
        self.script_name = script_name
        self.priority = priority
        self.dependencies = ()
        self.conflicts = ()
    
    def build(self, profile, loader):
        """Charge le script JavaScript"""
        from .loader import ScriptLoader
        if loader is None:
            loader = ScriptLoader()
        return loader.get(self.script_name)
    
    def validate(self, profile):
        """Validation simple"""
        return []


def get_all_modules():
    """Retourne la liste de tous les modules d'évasion."""
    return {
        "webdriver": JSEvasionModule("webdriver", "navigator.webdriver", 0),
        "chrome_runtime": JSEvasionModule("chrome_runtime", "chrome.runtime", 1),
        "chrome_app": JSEvasionModule("chrome_app", "chrome.app", 2),
        "chrome_csi": JSEvasionModule("chrome_csi", "chrome.csi", 3),
        "chrome_load_times": JSEvasionModule("chrome_load_times", "chrome.load.times", 4),
        "chrome_hairline": JSEvasionModule("chrome_hairline", "chrome.hairline", 5),
        "generate_magic_arrays": JSEvasionModule("generate_magic_arrays", "generate.magic.arrays", 6),
        "iframe_content_window": JSEvasionModule("iframe_content_window", "iframe.contentWindow", 7),
        "media_codecs": JSEvasionModule("media_codecs", "media.codecs", 8),
        "navigator_hardware_concurrency": JSEvasionModule("navigator_hardware_concurrency", "navigator.hardwareConcurrency", 9),
        "navigator_languages": JSEvasionModule("navigator_languages", "navigator.languages", 10),
        "navigator_permissions": JSEvasionModule("navigator_permissions", "navigator.permissions", 11),
        "navigator_platform": JSEvasionModule("navigator_platform", "navigator.platform", 12),
        "navigator_plugins": JSEvasionModule("navigator_plugins", "navigator.plugins", 13),
        "navigator_user_agent": JSEvasionModule("navigator_user_agent", "navigator.userAgent", 14),
        "navigator_vendor": JSEvasionModule("navigator_vendor", "navigator.vendor", 15),
        "outerdimensions": JSEvasionModule("outerdimensions", "window.outerdimensions", 16),
        "webgl_vendor": JSEvasionModule("webgl_vendor", "webgl.vendor", 17),
        "canvas": JSEvasionModule("canvas", "canvas", 18),
        "audio": JSEvasionModule("audio", "audio", 19),
        "intl": JSEvasionModule("intl", "intl", 20),
        "webgl": JSEvasionModule("webgl", "webgl", 21),
        "fonts": JSEvasionModule("fonts", "fonts", 22),
        "webrtc": JSEvasionModule("webrtc", "webrtc", 23),
        "screen": JSEvasionModule("screen", "screen", 24),
        "navigator_deviceMemory": JSEvasionModule("navigator_deviceMemory", "navigator.deviceMemory", 25),
        "navigator_maxTouchPoints": JSEvasionModule("navigator_maxTouchPoints", "navigator.maxTouchPoints", 26),
        "webgl_anisotropy": JSEvasionModule("webgl_anisotropy", "webgl.anisotropy", 27),
        "window_properties": JSEvasionModule("window_properties", "window.properties", 28),
        "concurrency": JSEvasionModule("concurrency", "concurrency", 29),
        "errors": JSEvasionModule("errors", "errors", 30),
        "evasions_proxies": JSEvasionModule("evasions_proxies", "evasions.proxies", 31),
        "navigator_hardware": JSEvasionModule("navigator_hardware", "navigator.hardware", 32),
    }


__all__ = [
    "JSEvasionModule",
    "get_all_modules",
]