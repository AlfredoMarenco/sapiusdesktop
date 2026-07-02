const { contextBridge, ipcRenderer, webFrame } = require('electron');
const os = require('os');

// Parche dinámico para corregir la falta de ID en los reproductores de video de la plataforma Sapius
// Usamos webFrame.executeJavaScript para inyectarlo en el Main World de forma segura,
// saltándonos cualquier restricción de CSP (Content Security Policy) de scripts en línea.
try {
    webFrame.executeJavaScript(`
        (function() {
            const originalGetElementById = document.getElementById;
            document.getElementById = function(id) {
                let element = originalGetElementById.call(document, id);
                if (!element) {
                    if (id === 'videoClase' || id === 'video') {
                        element = document.querySelector('video');
                        if (element) {
                            element.id = id;
                            console.log('[Sapius Detector] Asignado ID "' + id + '" al reproductor de video de forma dinámica.');
                        }
                    }
                }
                return element;
            };
        })();
    `);
} catch (e) {
    console.error('[Sapius Detector] Error al inyectar parche de video:', e);
}

contextBridge.exposeInMainWorld('sapiusAPI', {
    getMacAddress: () => {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                    return iface.mac;
                }
            }
        }
        return 'UNKNOWN';
    },
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
    validateMac: (mac) => ipcRenderer.invoke('auth:validate-mac', mac),
    onValidationSuccess: (callback) => ipcRenderer.on('validation-success', callback),
    openPlatform: () => ipcRenderer.send('open-platform'),
    setServerUrl: (url) => ipcRenderer.invoke('set-server-url', url),
    getEnvUrls: () => ipcRenderer.invoke('get-env-urls'),
    logToServer: (msg, type = 'INFO') => ipcRenderer.send('log-message', { msg, type })
});
