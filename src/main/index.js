const { app, BrowserWindow, ipcMain, session, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const axios = require('axios');
const { autoUpdater } = require('electron-updater');

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
let userRole = '';
let appIcon = null;
let isQuitting = false;

function registerStrikeFromMain(action, details) {
    if (!apiToken) return;

    axios.post(`${API_URL}/register-strike`, {
        action: action,
        details: details
    }, {
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'X-Sapius-MAC': userMac
        }
    })
    .then(response => {
        log(`Strike registrado en el servidor: ${action} - Status: ${response.data.status}`);
        if (response.data.status === 'blocked') {
            log('Cuenta bloqueada. Redirigiendo a locked.html');
            if (mainWindow) {
                const isDev = !app.isPackaged;
                if (isDev) {
                    mainWindow.loadURL('http://localhost:5173?view=locked');
                } else {
                    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'), { query: { view: 'locked' } });
                }
            }
        } else {
            if (mainWindow) {
                mainWindow.webContents.send('show-warning-strike', {
                    action: action,
                    strikes: response.data.strikes,
                    max_strikes: response.data.max_strikes
                });
            }
        }
    })
    .catch(err => {
        log(`Error al registrar strike en el servidor: ${err.message}`, 'ERROR');
    });
}

let config = { env: 'dev' };
try {
    const configPath = path.join(__dirname, '../../config.json');
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (e) {
    console.error('Error loading config.json:', e);
}

const DEFAULT_SERVERS = {
    dev: 'https://test.sapius.com.mx',
    prod: 'https://sapius.com.mx'
};

let BASE_URL = DEFAULT_SERVERS[config.env] || 'https://test.sapius.com.mx';
let API_URL = `${BASE_URL}/api`;

// Configuración de electron-updater
autoUpdater.autoDownload = true;
autoUpdater.logger = {
    info: (msg) => log(`[UPDATER] ${msg}`, 'INFO'),
    warn: (msg) => log(`[UPDATER] ${msg}`, 'WARN'),
    error: (msg) => log(`[UPDATER] ${msg}`, 'ERROR')
};

function setupAutoUpdater() {
    try {
        // Por defecto, buscar actualizaciones oficiales en el servidor de producción
        autoUpdater.setFeedURL({
            provider: 'generic',
            url: 'https://sapius.com.mx/updates/detector'
        });
        log('Configurando actualizador predeterminado con URL: https://sapius.com.mx/updates/detector');
    } catch (e) {
        log(`Error al configurar feed de actualización: ${e.message}`, 'ERROR');
    }

    autoUpdater.on('checking-for-update', () => {
        log('Buscando actualizaciones...');
    });

    autoUpdater.on('update-available', (info) => {
        log(`Actualización disponible: Versión ${info.version}`);
        if (mainWindow) {
            mainWindow.webContents.send('updater:update-available', info);
        }
    });

    autoUpdater.on('update-not-available', (info) => {
        log('No hay actualizaciones disponibles.');
        if (mainWindow) {
            mainWindow.webContents.send('updater:update-not-available', info);
        }
    });

    autoUpdater.on('error', (err) => {
        log(`Error del actualizador: ${err.message || err}`, 'ERROR');
        if (mainWindow) {
            mainWindow.webContents.send('updater:error', err.message || err);
        }
    });

    autoUpdater.on('download-progress', (progressObj) => {
        log(`Descargando actualización: ${progressObj.percent.toFixed(2)}%`);
        if (mainWindow) {
            mainWindow.webContents.send('updater:download-progress', progressObj.percent);
        }
    });

    autoUpdater.on('update-downloaded', (info) => {
        log('Actualización descargada. Lista para instalar.');
        if (mainWindow) {
            mainWindow.webContents.send('updater:update-downloaded', info);
        }
    });
}

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
        icon: path.join(__dirname, '../../icono-sapius.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            webviewTag: true
        }
    });

    // Quitar menú superior (File, Edit, Help, etc.)
    mainWindow.removeMenu();

    // Activar protección de contenido a nivel de OS (Evita capturas/grabaciones)
    mainWindow.setContentProtection(true);

    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    // Interceptar atajos de teclado del estudiante
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.type !== 'keyDown') return;

        const isMac = process.platform === 'darwin';
        const isCtrlOfTheOS = isMac ? input.meta : input.control;
        const isShift = input.shift;
        const key = input.key.toLowerCase();

        // Registrar en consola de Electron para depuración
        log(`[KEYLOG] Tecla: "${input.key}" (code: ${input.code}) | Ctrl/Cmd: ${isCtrlOfTheOS} | Shift: ${isShift}`);

        // Solo restringir si el usuario está autenticado y tiene rol 'alumno'
        if (apiToken && userRole !== 'alumno') {
            return;
        }

        // Detectar si presionan la combinación Ctrl + Shift sola
        if (isCtrlOfTheOS && isShift && (key === 'shift' || key === 'control')) {
            event.preventDefault();
            registerStrikeFromMain('Restricted Key / Modifier', 'Combinación Ctrl + Shift detectada');
            return;
        }

        // 1. Windows PrintScreen
        if (input.key === 'PrintScreen') {
            event.preventDefault();
            registerStrikeFromMain('PrintScreen', 'PrintScreen key pressed');
            return;
        }

        // 2. Mac Screenshots: Cmd+Shift+3, 4, 5
        if (isMac && input.meta && input.shift && ['3', '4', '5'].includes(input.key)) {
            event.preventDefault();
            registerStrikeFromMain('Mac Screenshot', `Mac screenshot shortcut (Cmd+Shift+${input.key})`);
            return;
        }

        // 3. Windows Snipping Tool: Win+Shift+S (key: 's', code: 'KeyS')
        if (!isMac && input.meta && input.shift && key === 's') {
            event.preventDefault();
            registerStrikeFromMain('Snipping Tool', 'Windows Snipping Tool (Win+Shift+S)');
            return;
        }

        // 3.5 Browser Screenshot Shortcut: Ctrl + Shift + S
        if (isCtrlOfTheOS && isShift && key === 's') {
            event.preventDefault();
            registerStrikeFromMain('PrintScreen', 'Browser Screenshot Shortcut (Ctrl+Shift+S)');
            return;
        }

        // 4. Ctrl/Cmd + P (Print), S (Save), C (Copy), X (Cut), U (View Source)
        if (isCtrlOfTheOS && ['p', 's', 'c', 'x', 'u'].includes(key)) {
            event.preventDefault();
            let actionName = 'Shortcut';
            if (key === 'p') actionName = 'PrintScreen';
            if (key === 's') actionName = 'Save';
            if (key === 'c') actionName = 'Copy';
            if (key === 'x') actionName = 'Cut';
            if (key === 'u') actionName = 'View Source';
            registerStrikeFromMain(actionName, `Shortcut Ctrl/Cmd + ${key.toUpperCase()}`);
            return;
        }

        // 5. DevTools F12
        if (input.key === 'F12') {
            event.preventDefault();
            registerStrikeFromMain('F12', 'F12 key pressed');
            return;
        }

        // 6. DevTools Ctrl/Cmd+Shift+I / J / C
        if (isCtrlOfTheOS && isShift && ['i', 'j', 'c'].includes(key)) {
            event.preventDefault();
            registerStrikeFromMain('DevTools', `DevTools shortcut (Ctrl+Shift+${key.toUpperCase()})`);
            return;
        }

        // 7. Volumen
        if (['volumeup', 'volumedown', 'volumemute'].includes(key)) {
            event.preventDefault();
            registerStrikeFromMain('Volume Key', `Volume key pressed (${input.key})`);
            return;
        }
    });

    // Bloquear Clic Derecho y registrar strike
    mainWindow.webContents.on('context-menu', (event) => {
        if (apiToken && userRole === 'alumno') {
            event.preventDefault();
            registerStrikeFromMain('Right Click', 'Right click context menu attempt');
        }
    });
    
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

    // Habilitar CORS dinámicamente para peticiones a dominios de Sapius (evita bloqueos de origen cruzado en desarrollo)
    session.defaultSession.webRequest.onHeadersReceived(
        { urls: ['*://*/*'] },
        (details, callback) => {
            const responseHeaders = details.responseHeaders;
            const url = details.url;
            const isSapius = url.startsWith(BASE_URL) || url.includes('sapius.com.mx');

            if (isSapius) {
                responseHeaders['Access-Control-Allow-Origin'] = ['*'];
                responseHeaders['Access-Control-Allow-Headers'] = ['*'];
                responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, OPTIONS, PUT, DELETE'];
            }
            callback({ responseHeaders });
        }
    );
}

app.whenReady().then(() => {
    createWindow();
    startBridgeServer();
    setupAutoUpdater();
    
    // Buscar actualizaciones al iniciar
    setTimeout(() => {
        autoUpdater.checkForUpdates().catch(err => {
            log(`Fallo inicial al buscar actualizaciones: ${err.message}`, 'ERROR');
        });
    }, 3000);
    
    globalShortcut.register('F12', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            if (apiToken && userRole === 'alumno') {
                registerStrikeFromMain('F12', 'F12 global shortcut pressed');
            } else {
                win.webContents.toggleDevTools();
            }
        }
    });

    try {
        globalShortcut.register('Super+Shift+S', () => {
            if (apiToken && userRole === 'alumno') {
                registerStrikeFromMain('Snipping Tool', 'Windows Snipping Tool (Win+Shift+S) detected globally');
            }
        });
    } catch (e) {
        log('Fallo al registrar atajo global Win+Shift+S');
    }

    try {
        globalShortcut.register('PrintScreen', () => {
            if (apiToken && userRole === 'alumno') {
                registerStrikeFromMain('PrintScreen', 'PrintScreen global shortcut pressed');
            }
        });
    } catch (e) {
        log('Fallo al registrar atajo global PrintScreen');
    }

    // Monitoreo del portapapeles en segundo plano para detectar capturas de pantalla (Snipping Tool, PrintScreen, etc.)
    setInterval(() => {
        if (apiToken && userRole === 'alumno') {
            const { clipboard } = require('electron');
            const image = clipboard.readImage();
            if (!image.isEmpty()) {
                clipboard.clear();
                registerStrikeFromMain('PrintScreen', 'Captura de pantalla guardada en portapapeles');
                log('[CLIPBOARD] Imagen de captura detectada y eliminada del portapapeles.');
            }
        }
    }, 1000);

    const iconPath = path.join(__dirname, '../../icono-sapius.png');
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
        
        // El rol viene como un array de roles de Caffeinated Shinobi (ej: [{"name":"Alumno","slug":"alumno"}])
        const roles = response.data.user.rol;
        log(`Roles recibidos de la API: ${JSON.stringify(roles)}`);
        
        if (Array.isArray(roles)) {
            const hasAlumno = roles.some(r => r.slug === 'alumno' || (r.name && r.name.toLowerCase() === 'alumno'));
            userRole = hasAlumno ? 'alumno' : 'admin';
        } else if (typeof roles === 'string') {
            userRole = roles.toLowerCase();
        } else {
            userRole = 'alumno'; // Fallback por seguridad
        }
        
        log(`Rol procesado y asignado: ${userRole}`);
        return { success: true, data: response.data };
    } catch (error) {
        log(`Error al iniciar sesión: ${error.message}`, 'ERROR');
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
        return { 
            success: false, 
            message: error.response?.data?.message || 'Error de validación.',
            is_blocked: error.response?.data?.is_blocked || false
        };
    }
});

ipcMain.on('open-dashboard', () => {
    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }
});

ipcMain.on('auth:logout', () => {
    apiToken = '';
    userMac = '';
    userRole = '';
    
    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }
});

ipcMain.handle('api:get', async (event, endpoint) => {
    try {
        const response = await axios.get(`${API_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${apiToken}`, 'X-Sapius-MAC': userMac }
        });
        const dataVal = response.data && Object.prototype.hasOwnProperty.call(response.data, 'data') ? response.data.data : response.data;
        return { success: true, data: dataVal };
    } catch (error) {
        return { 
            success: false, 
            message: error.response?.data?.message || 'Error api.',
            is_blocked: error.response?.data?.is_blocked || false
        };
    }
});

ipcMain.handle('api:post', async (event, { endpoint, payload, isMultipart = false }) => {
    try {
        let headers = {
            'Authorization': `Bearer ${apiToken}`,
            'X-Sapius-MAC': userMac
        };

        let data = payload;

        const response = await axios.post(`${API_URL}${endpoint}`, data, { headers });
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { 
            success: false, 
            message: error.response?.data?.message || 'Error api.',
            is_blocked: error.response?.data?.is_blocked || false
        };
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
    // Reconfigurar actualizador si cambia el servidor
    try {
        autoUpdater.setFeedURL({
            provider: 'generic',
            url: `${BASE_URL}/updates/detector`
        });
        log(`Reconfigurando URL de actualizaciones a: ${BASE_URL}/updates/detector`);
        
        // Disparar búsqueda en el nuevo servidor inmediatamente
        autoUpdater.checkForUpdates().catch(err => {
            log(`Fallo al buscar actualizaciones en el nuevo servidor: ${err.message}`, 'ERROR');
        });
    } catch (e) {}
    return { success: true };
});

ipcMain.handle('get-base-url', () => BASE_URL);

ipcMain.on('log-message', (event, { msg, type }) => log(`[RENDERER] ${msg}`, type));

// Updater IPC Listeners
ipcMain.on('updater:check-for-updates', () => {
    autoUpdater.checkForUpdates().catch(err => {
        log(`Fallo al solicitar buscar actualizaciones: ${err.message}`, 'ERROR');
    });
});

ipcMain.on('updater:quit-and-install', () => {
    log('Instalando actualización y reiniciando...');
    isQuitting = true;
    autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => app.getVersion());
