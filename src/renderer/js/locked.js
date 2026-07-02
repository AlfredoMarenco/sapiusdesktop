document.addEventListener('DOMContentLoaded', async () => {
    const userWelcomeMsg = document.getElementById('user-welcome-msg');
    const severityBadge = document.getElementById('severity-badge');
    const severityBar = document.getElementById('severity-bar');
    const strikesTableBody = document.getElementById('strikes-table-body');
    const btnLogout = document.getElementById('btn-logout');

    async function loadLockDetails() {
        try {
            const res = await window.sapiusAPI.apiGet('/user/locked-details');
            if (res && res.success) {
                const data = res.data;

                // 1. Redirección si ya no está bloqueado
                if (data.user && !data.user.is_blocked) {
                    window.sapiusAPI.logToServer('Cuenta desbloqueada detectada. Redirigiendo a login.');
                    window.location.href = 'login.html';
                    return;
                }

                // 2. Mensaje de bienvenida
                userWelcomeMsg.innerText = `Lo sentimos, ${data.user.nombre_completo}. Se ha suspendido temporalmente el acceso de tu cuenta.`;

                // 3. Semáforo de gravedad
                const severity = data.avg_severity || 0;
                const isGrave = data.is_grave_block;

                let color = '#10b981'; // Green
                let text = 'Baja Intencionalidad (Errores Comunes)';

                if (isGrave) {
                    color = '#7f1d1d'; // Dark Red
                    text = 'VIOLACIÓN CRÍTICA (MODO RETROALIMENTACIÓN)';
                } else if (severity >= 70) {
                    color = '#ef4444'; // Red
                    text = 'Alta Intencionalidad (Acciones Prohibidas)';
                } else if (severity >= 30) {
                    color = '#f59e0b'; // Yellow
                    text = 'Intencionalidad Media (Precaución)';
                }

                severityBadge.style.backgroundColor = color;
                severityBadge.innerText = text;
                severityBar.style.width = `${Math.min(severity, 100)}%`;
                severityBar.style.backgroundColor = color;

                // 4. Renderizar tabla de strikes
                strikesTableBody.innerHTML = '';
                if (data.history && data.history.length > 0) {
                    data.history.forEach(item => {
                        const tr = document.createElement('tr');
                        
                        // Formatear hora
                        let hora = '-';
                        if (item.created_at) {
                            try {
                                const dt = new Date(item.created_at);
                                hora = dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                            } catch(e) {}
                        }

                        // Formatear visual para atajos
                        let actionHtml = '';
                        const act = item.action;
                        if (act.includes('Right Click') || act.includes('Clic Derecho')) {
                            actionHtml = '<span style="background: rgba(239, 68, 68, 0.1); color: #f43f5e; padding: 4px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(239, 68, 68, 0.2);">🖱 Clic Derecho</span>';
                        } else if (act.includes('PrintScreen')) {
                            actionHtml = '<span style="background: rgba(239, 68, 68, 0.1); color: #f43f5e; padding: 4px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(239, 68, 68, 0.2);">📸 Captura (PrtScn)</span>';
                        } else if (act.includes('F12') || act.includes('DevTools')) {
                            actionHtml = '<span style="background: rgba(239, 68, 68, 0.1); color: #f43f5e; padding: 4px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(239, 68, 68, 0.2);">⚙️ DevTools / F12</span>';
                        } else if (act.includes('Mac Screenshot')) {
                            actionHtml = '<span style="background: rgba(239, 68, 68, 0.1); color: #f43f5e; padding: 4px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(239, 68, 68, 0.2);">🍎 Captura en Mac</span>';
                        } else if (act.includes('Snipping Tool')) {
                            actionHtml = '<span style="background: rgba(239, 68, 68, 0.1); color: #f43f5e; padding: 4px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(239, 68, 68, 0.2);">✂️ Herramienta Recortes</span>';
                        } else if (act.includes('Copy')) {
                            actionHtml = '<span style="background: rgba(239, 68, 68, 0.1); color: #f43f5e; padding: 4px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(239, 68, 68, 0.2);">📄 Copiar Contenido</span>';
                        } else if (act.includes('Volume')) {
                            actionHtml = '<span style="background: rgba(255,255,255,0.05); color: #94a3b8; padding: 4px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(255,255,255,0.1);">🔊 Tecla Volumen</span>';
                        } else if (act.includes('Shortcut')) {
                            actionHtml = `<span style="background: rgba(239, 68, 68, 0.1); color: #f43f5e; padding: 4px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(239, 68, 68, 0.2);">⌨️ Atajo ${act.replace('Shortcut ', '').toUpperCase()}</span>`;
                        } else {
                            actionHtml = `<span style="background: rgba(255,255,255,0.05); color: #94a3b8; padding: 4px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(255,255,255,0.1);">${act}</span>`;
                        }

                        tr.innerHTML = `
                            <td><strong>${hora}</strong></td>
                            <td>${actionHtml}</td>
                            <td style="color: #94a3b8;">${item.details || '-'}</td>
                        `;
                        strikesTableBody.appendChild(tr);
                    });
                } else {
                    strikesTableBody.innerHTML = `
                        <tr>
                            <td colspan="3" style="text-align: center; color: #64748b; padding: 2rem;">
                                No hay registros de strikes disponibles para este bloqueo.
                            </td>
                        </tr>
                    `;
                }
            } else {
                if (res && res.is_blocked === false) {
                    window.location.href = 'login.html';
                }
            }
        } catch (e) {
            window.sapiusAPI.logToServer(`Error cargando detalles del bloqueo en locked.js: ${e.message}`, 'ERROR');
        }
    }

    await loadLockDetails();

    const pollInterval = setInterval(async () => {
        await loadLockDetails();
    }, 5000);

    btnLogout.addEventListener('click', () => {
        clearInterval(pollInterval);
        window.sapiusAPI.logout();
    });
});
