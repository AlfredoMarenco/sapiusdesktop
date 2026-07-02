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
    getBaseUrl: () => ipcRenderer.invoke('get-base-url'),
    onShowWarningStrike: (callback) => ipcRenderer.on('show-warning-strike', (event, data) => callback(data)),
    
    // Auto Updater API
    onUpdateAvailable: (callback) => ipcRenderer.on('updater:update-available', (event, info) => callback(info)),
    onUpdateNotAvailable: (callback) => ipcRenderer.on('updater:update-not-available', (event, info) => callback(info)),
    onUpdateDownloadProgress: (callback) => ipcRenderer.on('updater:download-progress', (event, progress) => callback(progress)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('updater:update-downloaded', (event, info) => callback(info)),
    onUpdaterError: (callback) => ipcRenderer.on('updater:error', (event, err) => callback(err)),
    quitAndInstall: () => ipcRenderer.send('updater:quit-and-install'),
    checkForUpdates: () => ipcRenderer.send('updater:check-for-updates'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
