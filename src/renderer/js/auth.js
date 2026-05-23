document.addEventListener('DOMContentLoaded', async () => {
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

    // Obtener URLs de entorno desde el main process
    const envUrls = await window.sapiusAPI.getEnvUrls();

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
