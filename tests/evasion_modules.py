# tests/evasion_modules.py
"""
Modules d'évasion factices pour les tests d'intégration
"""

class WebDriverModule:
    """Module simple pour masquer webdriver"""
    name = "webdriver"
    priority = 0
    dependencies = ()
    conflicts = ()
    requires = []
    
    def build(self, profile, loader):
        return """
// Masquer webdriver
Object.defineProperty(Navigator.prototype, 'webdriver', {
    get: () => undefined,
    configurable: true,
    enumerable: false
});
Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
    configurable: true,
    enumerable: false
});
console.log('🛡️ WebDriver masqué');
"""
    
    def validate(self, profile):
        return []


class ChromeRuntimeModule:
    """Module simple pour chrome.runtime"""
    name = "chrome_runtime"
    priority = 1
    dependencies = ()
    conflicts = ()
    requires = []
    
    def build(self, profile, loader):
        return """
// Simuler chrome.runtime
if (!window.chrome) window.chrome = {};
window.chrome.runtime = {
    id: undefined,
    connect: () => ({ onMessage: { addListener: () => {} } }),
    sendMessage: () => {},
    getManifest: () => ({ version: '120.0.0.0' })
};
console.log('🛡️ Chrome Runtime simulé');
"""
    
    def validate(self, profile):
        return []


class PluginsModule:
    """Module simple pour les plugins"""
    name = "plugins"
    priority = 2
    dependencies = ()
    conflicts = ()
    requires = []
    
    def build(self, profile, loader):
        return """
// Simuler les plugins
Object.defineProperty(navigator, 'plugins', {
    get: () => {
        const plugins = [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
            { name: 'Native Client', filename: 'internal-nacl-plugin' }
        ];
        plugins.length = 3;
        plugins.item = (i) => plugins[i] || null;
        plugins.namedItem = (name) => plugins.find(p => p.name === name) || null;
        plugins.refresh = () => {};
        return plugins;
    },
    configurable: true
});
console.log('🛡️ Plugins simulés');
"""
    
    def validate(self, profile):
        return []


class PlatformModule:
    """Module pour simuler la plateforme"""
    name = "platform"
    priority = 0
    dependencies = ()
    conflicts = ()
    requires = []
    
    def build(self, profile, loader):
        platform = profile.browser.platform
        return f"""
// Simuler la plateforme
Object.defineProperty(navigator, 'platform', {{
    get: () => '{platform}',
    configurable: true,
    enumerable: true
}});
console.log('🛡️ Platform simulée: {platform}');
"""
    
    def validate(self, profile):
        return []


def get_test_modules():
    """Retourne la liste des modules d'évasion pour les tests"""
    return {
        "webdriver": WebDriverModule(),
        "chrome_runtime": ChromeRuntimeModule(),
        "plugins": PluginsModule(),
        "platform": PlatformModule(),
    }
