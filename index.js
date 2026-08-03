const { app, BrowserWindow, ipcMain, session, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const axios = require('axios');

// Cargar variables de entorno (Simple .env parser si no está dotenv)
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
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

// Deshabilitar advertencias de SSL para desarrollo local con Laragon
app.commandLine.appendSwitch('ignore-certificate-errors');

// Sistema de logs en archivo
const logPath = path.join(app.getPath('userData'), 'sapius-detector.log');
function log(msg, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const formattedMsg = `[${timestamp}] [${type}] ${msg}\n`;
    console.log(formattedMsg.trim());
    try {
        fs.appendFileSync(logPath, formattedMsg);
    } catch (e) {
        console.error('No se pudo escribir en el log:', e);
    }
}

// Servidor de Puente (Bridge) para navegadores externos
function startBridgeServer() {
    const bridgeServer = http.createServer((req, res) => {
        // Manejar CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        if (req.url === '/mac' && req.method === 'GET') {
            const interfaces = require('os').networkInterfaces();
            let mac = 'UNKNOWN';
            for (const name of Object.keys(interfaces)) {
                for (const iface of interfaces[name]) {
                    if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                        mac = iface.mac;
                        break;
                    }
                }
                if (mac !== 'UNKNOWN') break;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ mac }));
            log(`Bridge solicitada: Enviando MAC ${mac}`);
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    bridgeServer.listen(3005, '0.0.0.0', () => {
        log('Servidor Puente activo en http://0.0.0.0:3005');
    });

    bridgeServer.on('error', (err) => {
        log(`Error en Servidor Puente: ${err.message}`, 'ERROR');
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#002146',
        icon: path.join(__dirname, 'icon.png'), // Placeholder for icon
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false, // Permitir modulos de node en preload
            webviewTag: true
        }
    });

    mainWindow.loadFile('index.html');
    
    // Escuchar la consola de la página web cargada y enviarla a los logs de Electron
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        log(`[PAGE CONSOLE] [Level:${level}] ${message} (Source: ${sourceId}:${line})`, 'PAGE_CONSOLE');
    });
    
    // Interceptar el botón de cerrar (X) para salir completamente
    mainWindow.on('close', (event) => {
        isQuitting = true;
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
    
    // Registrar atajo para DevTools (F12)
    globalShortcut.register('F12', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            win.webContents.toggleDevTools();
            log('DevTools toggled via F12');
        }
    });

    log(`Aplicación iniciada. Logs guardados en: ${logPath}`);

    // Crear Icono en Bandeja (Tray)
    const iconPath = path.join(__dirname, 'tray_icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    appIcon = new Tray(icon.resize({ width: 16, height: 16 }));
    
    const contextMenu = Menu.buildFromTemplate([
        { 
            label: 'Abrir Sapius Detector', 
            click: () => mainWindow.show() 
        },
        { type: 'separator' },
        { 
            label: 'Salir Completamente', 
            click: () => {
                isQuitting = true;
                app.quit();
            } 
        }
    ]);

    appIcon.setToolTip('Sapius | MAC Detector Activo');
    appIcon.setContextMenu(contextMenu);

    // Click en el icono restaura la ventana
    appIcon.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Authentication Handlers
ipcMain.handle('auth:login', async (event, credentials) => {
    try {
        log(`Intentando login para el usuario: ${credentials.username}`);
        const response = await axios.post(`${API_URL}/login`, credentials, { timeout: 10000 });
        apiToken = response.data.api_token;
        log('Login exitoso.');
        return { success: true, data: response.data };
    } catch (error) {
        log(`Error de login: ${error.message}`, 'ERROR');
        return { success: false, message: error.response?.data?.message || 'Error de conexión con el servidor (Timeout o Red).' };
    }
});

ipcMain.handle('auth:validate-mac', async (event, mac) => {
    userMac = mac;
    try {
        log(`Validando MAC: ${mac}`);
        const response = await axios.post(`${API_URL}/validate-mac`, 
            { mac_address: mac },
            { 
                headers: { 'Authorization': `Bearer ${apiToken}` },
                timeout: 10000
            }
        );
        log(`Resultado validación: ${response.data.success ? 'ÉXITO' : 'FALLO'}`);
        return response.data;
    } catch (error) {
        log(`Error de validación MAC: ${error.message}`, 'ERROR');
        return { success: false, message: error.response?.data?.message || 'Error al validar hardware.' };
    }
});

ipcMain.on('open-platform', () => {
    // Redirigir a la plataforma una vez validado
    log(`Redirigiendo a: ${BASE_URL}/home`);
    mainWindow.loadURL(`${BASE_URL}/home`);
});

ipcMain.on('auth:logout', () => {
    apiToken = '';
    userMac = '';
    mainWindow.loadFile(path.join(__dirname, 'src/renderer/views/login.html'));
});

ipcMain.handle('set-server-url', (event, url) => {
    BASE_URL = url;
    API_URL = `${BASE_URL}/api`;
    log(`Servidor configurado a: ${BASE_URL}`);
    return { success: true };
});

ipcMain.handle('get-env-urls', () => {
    return {
        dev: process.env.DEV_URL || 'https://test.sapius.com.mx',
        prod: process.env.PROD_URL || 'https://sapius.com.mx',
        local: process.env.LOCAL_URL || 'http://127.0.0.1:8000'
    };
});

ipcMain.on('log-message', (event, { msg, type }) => {
    log(`[RENDERER] ${msg}`, type);
});
