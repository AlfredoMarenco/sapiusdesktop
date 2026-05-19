console.log('Renderer.js cargado.');
window.sapiusAPI.logToServer('Renderer.js cargado.');

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const authForm = document.getElementById('auth-form');
const loadingView = document.getElementById('loading-view');
const successView = document.getElementById('success-view');
const displayUser = document.getElementById('display-user');
const displayMac = document.getElementById('display-mac');
const statusMsg = document.getElementById('status-msg');

const serverSelectionView = document.getElementById('server-selection-view');
const loginView = document.getElementById('login-view');
const devBtn = document.getElementById('dev-server-btn');
const prodBtn = document.getElementById('prod-server-btn');

let urls = { dev: '', prod: '' };

// Cargar URLs desde el proceso principal
async function initUrls() {
    urls = await window.sapiusAPI.getEnvUrls();
    // Actualizar texto en los botones si es necesario
    document.querySelector('#dev-server-btn .btn-url').innerText = urls.dev.replace('https://', '');
    document.querySelector('#prod-server-btn .btn-url').innerText = urls.prod.replace('https://', '');
}
initUrls();

devBtn.addEventListener('click', async () => {
    await window.sapiusAPI.setServerUrl(urls.dev);
    showLogin();
});

prodBtn.addEventListener('click', async () => {
    await window.sapiusAPI.setServerUrl(urls.prod);
    showLogin();
});

function showLogin() {
    serverSelectionView.classList.add('hidden');
    loginView.classList.remove('hidden');
}

loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    window.sapiusAPI.logToServer(`Botón clickeado. Usuario: ${username}`);

    if (!username || !password) {
        showStatus('Por favor completa todos los campos.', 'error');
        return;
    }

    try {
        showStatus('Iniciando sesión...');
        const authResult = await window.sapiusAPI.login({ username, password });

        if (!authResult.success) {
            showStatus(authResult.message, 'error');
            return;
        }

        authForm.classList.add('hidden');
        loadingView.classList.remove('hidden');
        showStatus('Validando hardware...');

        const mac = window.sapiusAPI.getMacAddress();
        const validationResult = await window.sapiusAPI.validateMac(mac);

        if (validationResult.success) {
            // ÉXITO: Mostramos pantalla final detallada
            loadingView.classList.add('hidden');
            successView.classList.remove('hidden');
            displayUser.innerText = username;
            displayMac.innerText = mac;
            
            showStatus(''); // Limpiamos msg inferior para limpieza visual
            window.sapiusAPI.logToServer('Equipo registrado con éxito. Pantalla final mostrada.');
        } else {
            // Error de hardware: mostramos mensaje claro y botón de soporte
            const errorHtml = `
                <div style="margin-top: 10px;">
                    <p style="color: #ed6a5a; font-weight: bold; font-size: 14px; margin-bottom: 5px;">${validationResult.message}</p>
                    <button onclick="window.open('https://wa.me/521XXXXXXXXXX')" style="background: #25D366; color: white; border: none; padding: 5px 15px; border-radius: 15px; cursor: pointer; font-weight: bold;">
                        📞 Contactar Soporte
                    </button>
                </div>
            `;
            showStatus(errorHtml, 'error', true);
            loadingView.classList.add('hidden');
            authForm.classList.remove('hidden');
        }
    } catch (error) {
        showStatus('Error inesperado.', 'error');
        loadingView.classList.add('hidden');
        authForm.classList.remove('hidden');
    }
});

function showStatus(content, type = '', isHtml = false) {
    if (isHtml) {
        statusMsg.innerHTML = content;
    } else {
        statusMsg.innerText = content;
    }
    statusMsg.className = 'status ' + type;
}
