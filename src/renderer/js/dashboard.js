import { apiGet, getMacAddress, logout } from './modules/api.js';
import { loadView, initNavigation } from './modules/navigation.js';
import { loadDashboardData, activeInscripcionId } from './modules/courses.js';
import { initUpdater, displayAppVersion } from './modules/updater.js';
import { initPdfControls, initHomeworkDropZone } from './modules/lessons.js';
import { initExamControls } from './modules/exams.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Mostrar Datos Básicos y Fecha
    const currentDate = document.getElementById('current-date');
    const displayMac = document.getElementById('display-mac');
    const logoutBtn = document.getElementById('logout-btn');

    if (currentDate) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDate.innerText = new Date().toLocaleDateString('es-ES', options);
    }

    try {
        const mac = await getMacAddress();
        if (displayMac) displayMac.innerText = `MAC: ${mac}`;
    } catch(e) {}

    // 2. Inicializar Actualizador Automático y Versión
    initUpdater();
    displayAppVersion();

    // 3. Inicializar Navegación Lateral y Carga Dinámica
    initNavigation(async (targetView) => {
        // Asegurar que la barra lateral se expanda al cambiar de sección principal
        const layout = document.querySelector('.dashboard-layout');
        if (layout) layout.classList.remove('sidebar-collapsed');

        if (targetView === 'courses') {
            await loadView('courses');
            loadDashboardData();
        } else if (targetView === 'homework') {
            await loadView('homework-tracking');
            loadHomeworkTracking();
        } else if (targetView === 'calendar') {
            await loadView('calendar');
            loadCalendarView();
        } else if (targetView === 'support') {
            await loadView('support');
            loadSupportView();
        }
    });

    // Cargar Vista Inicial por Defecto
    await loadView('courses');
    loadDashboardData();

    // 4. Inicializar Controladores Globales de Overlays (Exámenes y PDF)
    // Usamos una función para obtener el ID de inscripción activo de forma dinámica
    initExamControls(() => activeInscripcionId);

    // 5. Salir de Sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }

    // 6. Escuchar Advertencias de Strikes
    if (window.sapiusAPI.onShowWarningStrike) {
        window.sapiusAPI.onShowWarningStrike((data) => {
            const warning = document.getElementById('warning-overlay');
            const msg = document.getElementById('strike-msg');
            if (warning && msg) {
                msg.textContent = `Advertencia: ${data.action} (${data.strikes}/${data.max_strikes})`;
                warning.style.display = 'flex';
                warning.classList.remove('hidden');

                setTimeout(() => {
                    warning.style.display = 'none';
                    warning.classList.add('hidden');
                }, 4000);
            }
        });
    }
});

// --- Lógicas Locales de Vistas ---

async function loadHomeworkTracking() {
    const homeworkTrackingBody = document.getElementById('homework-tracking-body');
    if (!homeworkTrackingBody) return;

    homeworkTrackingBody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align:center;">
                <div class="spinner" style="width:25px; height:25px;"></div> Cargando registro de tareas...
            </td>
        </tr>
    `;

    import('./modules/courses.js').then(async (coursesMod) => {
        const cpId = coursesMod.activeCourseId;
        if (!cpId) {
            homeworkTrackingBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Por favor ingresa a un curso primero para visualizar el seguimiento.</td></tr>`;
            return;
        }

        try {
            const res = await apiGet(`/electron/homework-tracking/${cpId}`);
            if (res && res.success) {
                const data = res.data;
                homeworkTrackingBody.innerHTML = '';

                data.modulos.forEach(modulo => {
                    modulo.clases.forEach(clase => {
                        const row = document.createElement('tr');
                        const hw = data.homeworks[clase.id];
                        const statusText = hw ? `Entregado ${hw.is_late ? '<strong style="color:var(--accent-coral)">(Con retraso)</strong>' : '(A tiempo)'}` : 'Pendiente';
                        const linkText = hw ? 'Ver Clase' : 'Entregar Tarea';

                        row.innerHTML = `
                            <td><strong>${clase.titulo}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${modulo.titulo}</span></td>
                            <td>Programada</td>
                            <td>${statusText}</td>
                            <td><button class="glass-btn small" id="btn-go-hw-${clase.id}">${linkText}</button></td>
                        `;

                        row.querySelector(`#btn-go-hw-${clase.id}`).addEventListener('click', async () => {
                            const success = await loadView('course-detail');
                            if (success) {
                                document.getElementById('view-title').innerText = "Temario del Curso";
                                
                                // Re-enlazar controles de PDF y Tareas del DOM dinámico
                                initPdfControls();
                                initHomeworkDropZone();
                                
                                coursesMod.loadCourseDetails(cpId).then(() => {
                                    import('./modules/lessons.js').then(lessonsMod => {
                                        lessonsMod.loadLessonDetails(clase.id, cpId);
                                    });
                                });
                            }
                        });

                        homeworkTrackingBody.appendChild(row);
                    });
                });
            }
        } catch (e) {
            homeworkTrackingBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--danger-red);">Error de conexión.</td></tr>`;
        }
    });
}

async function loadCalendarView() {
    const container = document.getElementById('calendar-content');
    if (!container) return;
    
    container.innerHTML = `<div class="spinner"></div>`;

    import('./modules/courses.js').then(async (coursesMod) => {
        const cpId = coursesMod.activeCourseId;
        if (!cpId) {
            container.innerHTML = `<p style="text-align:center;">Entra a un curso primero para cargar sus fechas y cronograma.</p>`;
            return;
        }

        try {
            const res = await apiGet(`/electron/course/${cpId}`);
            if (res && res.success) {
                const schedule = res.data.contenido_programado?.contenido || [];
                
                if (schedule.length === 0) {
                    container.innerHTML = `<p style="text-align:center; color:var(--text-muted);">No hay cronograma programado para este curso.</p>`;
                    return;
                }

                container.innerHTML = '';
                const table = document.createElement('table');
                table.className = 'premium-table';
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Materia / Unidad</th>
                            <th>Fecha de Inicio</th>
                            <th>Fecha Final</th>
                        </tr>
                    </thead>
                    <tbody id="calendar-body"></tbody>
                `;

                const tbody = table.querySelector('#calendar-body');
                schedule.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><strong>${item.titulo || 'Clase'}</strong></td>
                        <td>${item.fecha_inicio || '-'}</td>
                        <td>${item.fecha_final || '-'}</td>
                    `;
                    tbody.appendChild(row);
                });

                container.appendChild(table);
            }
        } catch (e) {
            container.innerHTML = `<p style="color:var(--danger-red);">Error al cargar el calendario.</p>`;
        }
    });
}

async function loadSupportView() {
    const supportMac = document.getElementById('support-mac');
    if (supportMac) {
        try {
            const mac = await getMacAddress();
            supportMac.innerText = mac;
        } catch (e) {}
    }
}
