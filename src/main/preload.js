const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

contextBridge.exposeInMainWorld('sapiusAPI', {
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
    validateMac: (mac) => ipcRenderer.invoke('auth:validate-mac', mac),
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
    openDashboard: () => ipcRenderer.send('open-dashboard'),
    logout: () => ipcRenderer.send('auth:logout'),
    getEnvUrls: () => ipcRenderer.invoke('get-env-urls'),
    setServerUrl: (url) => ipcRenderer.invoke('set-server-url', url),
    logToServer: (msg, type = 'INFO') => ipcRenderer.send('log-message', { msg, type }),
    apiGet: (endpoint) => ipcRenderer.invoke('api:get', endpoint),
    apiPost: (endpoint, payload, isMultipart = false) => ipcRenderer.invoke('api:post', { endpoint, payload, isMultipart }),
    getBaseUrl: () => ipcRenderer.invoke('get-base-url')
});
