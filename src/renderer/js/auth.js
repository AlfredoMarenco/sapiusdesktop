document.addEventListener('DOMContentLoaded', async () => {
    const splashView = document.getElementById('splash-view');
    const splashStatus = document.getElementById('splash-status');
    const splashProgressContainer = document.getElementById('splash-progress-container');
    const splashProgressBar = document.getElementById('splash-progress-bar');

    const serverSelectionView = document.getElementById('server-selection-view');
    const loginView = document.getElementById('login-view');
    const loadingView = document.getElementById('loading-view');
    const statusMsg = document.getElementById('status-msg');

    const localServerBtn = document.getElementById('local-server-btn');
    const devServerBtn = document.getElementById('dev-server-btn');
    const prodServerBtn = document.getElementById('prod-server-btn');
    const loginBtn = document.getElementById('login-btn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    let currentServer = '';
    let isTransitioned = false;

    // Timeout de seguridad: Si no responde en 5 segundos, pasar al login por si falla la conexión
    const safetyTimeout = setTimeout(() => {
        transitionToSelector();
    }, 5000);

    function transitionToSelector() {
        if (isTransitioned) return;
        isTransitioned = true;
        clearTimeout(safetyTimeout);
        if (splashView) splashView.classList.add('hidden');
        if (serverSelectionView) serverSelectionView.classList.remove('hidden');
    }

    // Configurar escuchadores de eventos del actualizador para el Loader Inicial
    if (window.sapiusAPI.onUpdateAvailable) {
        window.sapiusAPI.onUpdateAvailable((info) => {
            clearTimeout(safetyTimeout);
            if (splashStatus) splashStatus.innerText = `Descargando actualización v${info.version}...`;
            if (splashProgressContainer) splashProgressContainer.classList.remove('hidden');
        });

        window.sapiusAPI.onUpdateDownloadProgress((percent) => {
            const rounded = Math.round(percent);
            if (splashProgressBar) splashProgressBar.style.width = `${rounded}%`;
            if (splashStatus) splashStatus.innerText = `Descargando actualización... ${rounded}%`;
        });

        window.sapiusAPI.onUpdateDownloaded((info) => {
            if (splashStatus) splashStatus.innerText = "Instalando actualización y reiniciando...";
            setTimeout(() => {
                window.sapiusAPI.quitAndInstall();
            }, 1000);
        });

        window.sapiusAPI.onUpdateNotAvailable(() => {
            transitionToSelector();
        });

        window.sapiusAPI.onUpdaterError((err) => {
            console.warn("Error del actualizador al iniciar:", err);
            transitionToSelector();
        });
        
        // Forzar chequeo inicial
        window.sapiusAPI.checkForUpdates();
    } else {
        transitionToSelector();
    }

    // Obtener URLs de entorno desde el main process
    const envUrls = await window.sapiusAPI.getEnvUrls();

    // Mostrar versión en la esquina inferior
    try {
        const version = await window.sapiusAPI.getAppVersion();
        const verDiv = document.createElement('div');
        verDiv.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            font-size: 11px;
            color: #64748b;
            z-index: 9999;
            pointer-events: none;
            user-select: none;
        `;
        verDiv.textContent = `v${version}`;
        document.body.appendChild(verDiv);
    } catch(e) {}

    // Actualizar visualización del botón local
    if (envUrls.local && localServerBtn) {
        const urlSpan = localServerBtn.querySelector('.btn-url');
        if (urlSpan) urlSpan.innerText = envUrls.local;
    }

    function showStatus(text, type = 'error') {
        statusMsg.innerText = text;
        statusMsg.className = `status ${type}`;
    }

    function clearStatus() {
        statusMsg.innerText = '';
        statusMsg.className = 'status';
    }

    // Elección de servidor
    localServerBtn.addEventListener('click', async () => {
        currentServer = envUrls.local || 'http://127.0.0.1:8000';
        await window.sapiusAPI.setServerUrl(currentServer);
        window.sapiusAPI.logToServer(`Servidor local seleccionado: ${currentServer}`);
        transitionToLogin();
    });

    devServerBtn.addEventListener('click', async () => {
        currentServer = envUrls.dev;
        await window.sapiusAPI.setServerUrl(currentServer);
        window.sapiusAPI.logToServer(`Servidor de desarrollo seleccionado: ${currentServer}`);
        transitionToLogin();
    });

    prodServerBtn.addEventListener('click', async () => {
        currentServer = envUrls.prod;
        await window.sapiusAPI.setServerUrl(currentServer);
        window.sapiusAPI.logToServer(`Servidor de producción seleccionado: ${currentServer}`);
        transitionToLogin();
    });

    function transitionToLogin() {
        serverSelectionView.classList.add('hidden');
        loginView.classList.remove('hidden');
        usernameInput.focus();
    }

    // Iniciar Sesión
    loginBtn.addEventListener('click', handleLogin);

    // Permite presionar Enter en los inputs
    usernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') passwordInput.focus();
    });
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    async function handleLogin() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            showStatus('Por favor complete todos los campos.');
            return;
        }

        clearStatus();
        loginView.classList.add('hidden');
        loadingView.classList.remove('hidden');

        try {
            window.sapiusAPI.logToServer(`Intentando login para el usuario: ${username}`);
            
            // 1. Intentar Autenticación
            const loginRes = await window.sapiusAPI.login({ username, password });
            
            if (!loginRes.success) {
                showStatus(loginRes.message || 'Credenciales incorrectas.');
                restoreLoginForm();
                return;
            }

            // 2. Obtener MAC y Validar
            const macAddress = window.sapiusAPI.getMacAddress();
            window.sapiusAPI.logToServer(`MAC detectada: ${macAddress}. Iniciando validación de hardware.`);

            const macRes = await window.sapiusAPI.validateMac(macAddress);

            if (!macRes.success) {
                if (macRes.is_blocked) {
                    window.sapiusAPI.logToServer(`Usuario bloqueado durante validación MAC. Redirigiendo a locked.html`);
                    window.location.href = 'locked.html';
                    return;
                }
                showStatus(macRes.message || 'Error de autorización del dispositivo.');
                restoreLoginForm();
                return;
            }

            // Registro exitoso, abrir Dashboard
            window.sapiusAPI.logToServer(`Dispositivo validado con éxito. Redirigiendo al aula virtual.`);
            showStatus('Acceso autorizado. Cargando aula...', 'success');
            
            setTimeout(() => {
                window.sapiusAPI.openDashboard();
            }, 1000);

        } catch (error) {
            window.sapiusAPI.logToServer(`Excepción en flujo de autenticación: ${error.message}`, 'ERROR');
            showStatus('Ocurrió un error inesperado de red o servidor.');
            restoreLoginForm();
        }
    }

    function restoreLoginForm() {
        loadingView.classList.add('hidden');
        loginView.classList.remove('hidden');
        passwordInput.value = '';
        passwordInput.focus();
    }
});
