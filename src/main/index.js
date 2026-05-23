const { app, BrowserWindow, ipcMain, session, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const axios = require('axios');

function loadEnv() {
    const envPath = path.join(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
}
loadEnv();

let mainWindow;
let userMac = '';
let apiToken = '';
let appIcon = null;
let isQuitting = false;

let BASE_URL = 'http://127.0.0.1:8000'; // Default
let API_URL = `${BASE_URL}/api`;

app.commandLine.appendSwitch('ignore-certificate-errors');

const logPath = path.join(app.getPath('userData'), 'sapius-detector.log');
function log(msg, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const formattedMsg = `[${timestamp}] [${type}] ${msg}\n`;
    console.log(formattedMsg.trim());
    try {
        fs.appendFileSync(logPath, formattedMsg);
    } catch (e) {}
}

function startBridgeServer() {
    const bridgeServer = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

        if (req.url === '/mac' && req.method === 'GET') {
            const interfaces = require('os').networkInterfaces();
            let mac = 'UNKNOWN';
            for (const name of Object.keys(interfaces)) {
                for (const iface of interfaces[name]) {
                    if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                        mac = iface.mac; break;
                    }
                }
                if (mac !== 'UNKNOWN') break;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ mac }));
        } else {
            res.writeHead(404); res.end();
        }
    });
    bridgeServer.listen(3005, '0.0.0.0');
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#0f172a',
        icon: path.join(__dirname, '../../tray_icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            webviewTag: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/views/login.html'));
    
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    // Capturar logs de la consola de la página web para depuración
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        const lvl = levels[level] || 'INFO';
        log(`[PAGE CONSOLE] (${path.basename(sourceId)}:${line}) ${message}`, lvl);
    });

    // Inyectar el encabezado X-Sapius-MAC en todas las peticiones a la plataforma de forma dinámica
    session.defaultSession.webRequest.onBeforeSendHeaders(
        { urls: ['*://*/*'] },
        (details, callback) => {
            const url = details.url;
            const isSapius = url.startsWith(BASE_URL) || 
                             url.includes('sapius.com.mx') || 
                             url.startsWith('http://localhost') || 
                             url.startsWith('http://127.0.0.1');

            if (isSapius) {
                if (userMac) {
                    details.requestHeaders['X-Sapius-MAC'] = userMac;
                }
                if (apiToken) {
                    details.requestHeaders['Authorization'] = `Bearer ${apiToken}`;
                }
            }
            callback({ requestHeaders: details.requestHeaders });
        }
    );
}

app.whenReady().then(() => {
    createWindow();
    startBridgeServer();
    
    globalShortcut.register('F12', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) win.webContents.toggleDevTools();
    });

    const iconPath = path.join(__dirname, '../../tray_icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    appIcon = new Tray(icon.resize({ width: 16, height: 16 }));
    
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Abrir Sapius', click: () => mainWindow.show() },
        { type: 'separator' },
        { label: 'Salir', click: () => { isQuitting = true; app.quit(); } }
    ]);
    appIcon.setToolTip('Sapius | Plataforma Activa');
    appIcon.setContextMenu(contextMenu);
    appIcon.on('click', () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show());
});

// IPC Handlers
ipcMain.handle('auth:login', async (event, credentials) => {
    try {
        const response = await axios.post(`${API_URL}/login`, credentials, { timeout: 10000 });
        apiToken = response.data.api_token;
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Error de conexión.' };
    }
});

ipcMain.handle('auth:validate-mac', async (event, mac) => {
    userMac = mac;
    try {
        const response = await axios.post(`${API_URL}/validate-mac`, 
            { mac_address: mac },
            { headers: { 'Authorization': `Bearer ${apiToken}` }, timeout: 10000 }
        );
        return response.data;
    } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Error de validación.' };
    }
});

ipcMain.on('open-dashboard', () => {
    mainWindow.loadFile(path.join(__dirname, '../renderer/views/dashboard.html'));
});

ipcMain.on('auth:logout', () => {
    apiToken = '';
    userMac = '';
    mainWindow.loadFile(path.join(__dirname, '../renderer/views/login.html'));
});

ipcMain.handle('api:get', async (event, endpoint) => {
    try {
        const response = await axios.get(`${API_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${apiToken}`, 'X-Sapius-MAC': userMac }
        });
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Error api.' };
    }
});

ipcMain.handle('api:post', async (event, { endpoint, payload, isMultipart = false }) => {
    try {
        let headers = {
            'Authorization': `Bearer ${apiToken}`,
            'X-Sapius-MAC': userMac
        };

        let data = payload;

        if (isMultipart) {
            // If it's multipart, we'll let axios handle it, but payload should be prepared.
            // Or the renderer can use standard fetch as headers are intercepted!
            // However, having a fallback is nice.
        }

        const response = await axios.post(`${API_URL}${endpoint}`, data, { headers });
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Error api.' };
    }
});

ipcMain.handle('get-env-urls', () => ({
    dev: process.env.DEV_URL || 'https://test.sapius.com.mx',
    prod: process.env.PROD_URL || 'https://sapius.com.mx',
    local: process.env.LOCAL_URL || 'http://127.0.0.1:8000'
}));

ipcMain.handle('set-server-url', (event, url) => {
    BASE_URL = url;
    API_URL = `${BASE_URL}/api`;
    return { success: true };
});

ipcMain.handle('get-base-url', () => BASE_URL);

ipcMain.on('log-message', (event, { msg, type }) => log(`[RENDERER] ${msg}`, type));
