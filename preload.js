const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

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
