// Interfaz visual y eventos del auto-updater de Electron
import { getAppVersion } from './api.js';

export function initUpdater() {
    if (!window.sapiusAPI.onUpdateAvailable) return;

    // Crear contenedor flotante para la notificación
    const updateNotification = document.createElement('div');
    updateNotification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1e293b;
        border: 1px solid #3b82f6;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
        border-radius: 12px;
        padding: 16px;
        color: #f8fafc;
        font-family: inherit;
        z-index: 99999;
        width: 320px;
        display: none;
        transition: all 0.3s ease;
    `;
    document.body.appendChild(updateNotification);

    window.sapiusAPI.onUpdateAvailable((info) => {
        updateNotification.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                <span style="color: #3b82f6;">🔄</span> Actualizando Aplicación
            </div>
            <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px;">
                Descargando versión <strong>${info.version}</strong> en segundo plano...
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #94a3b8; margin-top: 8px;">
                <span>Descargando...</span>
                <span id="update-progress-percent">0%</span>
            </div>
            <div style="width: 100%; background: #334155; height: 6px; border-radius: 3px; overflow: hidden; margin-top: 6px; position: relative;">
                <div id="update-progress-bar" style="width: 0%; height: 100%; background: #3b82f6; transition: width 0.1s ease;"></div>
            </div>
        `;
        updateNotification.style.display = 'block';
    });

    window.sapiusAPI.onUpdateDownloadProgress((percent) => {
        const progressBar = document.getElementById('update-progress-bar');
        const progressPercent = document.getElementById('update-progress-percent');
        const roundedPercent = Math.round(percent);
        if (progressBar) {
            progressBar.style.width = `${roundedPercent}%`;
        }
        if (progressPercent) {
            progressPercent.textContent = `${roundedPercent}%`;
        }
    });

    window.sapiusAPI.onUpdateDownloaded((info) => {
        updateNotification.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                <span style="color: #10b981;">✅</span> Actualización Lista
            </div>
            <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 12px;">
                La versión <strong>${info.version}</strong> se descargó con éxito. Reinicia la aplicación para aplicar los cambios.
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button id="btn-update-later" style="background: transparent; border: none; color: #94a3b8; font-size: 0.85rem; cursor: pointer; padding: 6px 12px;">Más tarde</button>
                <button id="btn-update-restart" style="background: #3b82f6; border: none; color: #fff; font-size: 0.85rem; font-weight: 500; cursor: pointer; padding: 6px 12px; border-radius: 6px;">Reiniciar</button>
            </div>
        `;
        updateNotification.style.display = 'block';

        document.getElementById('btn-update-later').addEventListener('click', () => {
            updateNotification.style.display = 'none';
        });

        document.getElementById('btn-update-restart').addEventListener('click', () => {
            window.sapiusAPI.quitAndInstall();
        });
    });

    window.sapiusAPI.onUpdaterError((err) => {
        console.error('Error del actualizador:', err);
        updateNotification.style.display = 'none';
    });
}

export async function displayAppVersion() {
    try {
        const version = await getAppVersion();
        const verDisplay = document.getElementById('sidebar-version');
        if (verDisplay) {
            verDisplay.textContent = `v${version}`;
        }
        
        // Agregar footer
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
            background: rgba(15, 23, 42, 0.6);
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid rgba(255,255,255,0.05);
        `;
        verDiv.textContent = `v${version}`;
        document.body.appendChild(verDiv);
    } catch(e) {}
}
