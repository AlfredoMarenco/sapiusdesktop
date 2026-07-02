import { apiGet, logToServer, getBaseUrl } from './api.js';
import { loadView } from './navigation.js';
import { loadLessonDetails, closeActiveLesson, initPdfControls, initHomeworkDropZone } from './lessons.js';

export let activeCourseId = null;
export let activeInscripcionId = null;

export function setActiveCourseId(id) {
    activeCourseId = id;
}

export function setActiveInscripcionId(id) {
    activeInscripcionId = id;
}

export async function loadDashboardData() {
    const coursesGrid = document.getElementById('courses-grid');
    if (!coursesGrid) return;

    coursesGrid.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando tus cursos programados...</p>
        </div>
    `;

    try {
        const baseUrl = await getBaseUrl();
        const res = await apiGet('/electron/dashboard');
        if (res && res.success) {
            const user = res.data.user;
            const courses = res.data.mis_cursos;

            const userNameNode = document.getElementById('user-name');
            const userAvatarNode = document.getElementById('user-avatar');
            if (userNameNode) userNameNode.innerText = user.nombre_completo;
            if (userAvatarNode) userAvatarNode.innerText = user.nombre_completo.charAt(0).toUpperCase();

            if (courses.length === 0) {
                coursesGrid.innerHTML = `
                    <div class="loading-state">
                        <p>No estás inscrito en ningún curso activo en este momento.</p>
                    </div>
                `;
                return;
            }

            coursesGrid.innerHTML = '';
            courses.forEach(enrollment => {
                const cp = enrollment.curso_programado;
                if (!cp) return;
                const c = cp.curso;
                if (!c) return;
                const catName = cp.category ? cp.category.name : 'Curso';

                const card = document.createElement('div');
                card.className = 'glass-card course-card';
                card.innerHTML = `
                    <div class="course-card-image-wrapper">
                        ${c.imagen 
                            ? `<img src="${baseUrl}/cursos/image/${c.imagen}" class="course-card-image" alt="${c.titulo}">`
                            : `<div class="course-card-image-placeholder">📚</div>`
                        }
                    </div>
                    <div class="course-card-content">
                        <div class="course-card-header">
                            <span class="course-category-badge">${catName}</span>
                            <span class="course-code-badge">${cp.identificador || ''}</span>
                        </div>
                        <h3>${c.titulo}</h3>
                        <p class="subtitle">Instructor: ${cp.instructor ? cp.instructor.nombre_completo : 'Por asignar'}</p>
                        <div class="course-meta">
                            <span>Vence: ${cp.fecha_fin ? new Date(cp.fecha_fin).toLocaleDateString('es-ES') : ''}</span>
                        </div>
                    </div>
                `;

                card.addEventListener('click', () => {
                    loadCourseDetails(cp.id);
                });

                coursesGrid.appendChild(card);
            });
        } else {
            coursesGrid.innerHTML = `<div class="loading-state"><p class="status error">${res.message || 'Dispositivo o sesión no autorizada.'}</p></div>`;
        }
    } catch (e) {
        coursesGrid.innerHTML = `<div class="loading-state"><p class="status error">Error de red o conexión al servidor.</p></div>`;
    }
}

export async function loadCourseDetails(cpId) {
    activeCourseId = cpId;
    
    // Cargar la plantilla de detalles del curso
    const success = await loadView('course-detail');
    if (!success) return;

    // Colapsar barra lateral izquierda para maximizar espacio de trabajo
    document.querySelector('.dashboard-layout').classList.add('sidebar-collapsed');

    document.getElementById('view-title').innerText = "Temario del Curso";

    // Inicializar controles interactivos del DOM recién inyectado
    initPdfControls();
    initHomeworkDropZone();

    const modulesList = document.getElementById('modules-list');
    const courseDetailTitle = document.getElementById('course-detail-title');
    const courseProgressText = document.getElementById('course-progress-text');
    const courseProgressFill = document.getElementById('course-progress-fill');
    const btnBackToCourses = document.getElementById('btn-back-to-courses');
    const btnBackToCourse = document.getElementById('btn-back-to-course');

    btnBackToCourses.addEventListener('click', async () => {
        // Expandir barra lateral al volver a la lista general
        document.querySelector('.dashboard-layout').classList.remove('sidebar-collapsed');
        await loadView('courses');
        loadDashboardData();
        document.getElementById('view-title').innerText = "Mis Cursos";
    });

    btnBackToCourse.addEventListener('click', () => {
        closeActiveLesson();
    });

    modulesList.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando temario y progreso...</p>
        </div>
    `;

    try {
        const res = await apiGet(`/electron/course/${cpId}`);
        if (res && res.success) {
            const data = res.data;
            const cp = data.curso_programado;
            
            activeInscripcionId = data.inscrito.id;
            courseDetailTitle.innerText = cp.curso.titulo;

            if (cp.category.name === "Guias") {
                courseProgressText.innerText = 'Guía de Estudio';
                courseProgressFill.style.width = '100%';
                
                if (data.guia) {
                    modulesList.innerHTML = `
                        <div class="glass-card" style="text-align: center; padding: 3rem 0;">
                            <span style="font-size: 3rem;">📖</span>
                            <h3 style="margin-top: 1rem;">Esta es una Guía de Contenido</h3>
                            <p class="subtitle" style="margin-bottom: 2rem;">Puedes visualizarla de forma segura e interactiva en la plataforma sin descargas.</p>
                            <button class="glass-btn primary" id="btn-view-guia-pdf">Abrir Guía Segura</button>
                        </div>
                    `;
                    
                    document.getElementById('btn-view-guia-pdf').addEventListener('click', () => {
                        loadLessonDetails(0, cpId);
                    });
                } else {
                    modulesList.innerHTML = `<div class="loading-state"><p>El material de la guía no ha sido subido por el instructor.</p></div>`;
                }
                return;
            }

            courseProgressText.innerText = `${data.globalProgress}%`;
            courseProgressFill.style.width = `${data.globalProgress}%`;

            modulesList.innerHTML = '';
            const schedule = (data.contenido_programado && data.contenido_programado.contenido) ? data.contenido_programado.contenido : [];

            function parseDateStr(dateStr) {
                if (!dateStr) return null;
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    return new Date(parts[2], parts[1] - 1, parts[0]);
                }
                return new Date(dateStr);
            }

            const hoyTime = Date.now();
            function checkIsUnlocked(item) {
                if (schedule.length === 0) return true;

                const itemSchedule = schedule.find(x => x.id == item.id);
                if (!itemSchedule) return true;

                let fechaInicial = parseDateStr(itemSchedule.fecha_inicial);
                let fechaFinal = null;
                if (itemSchedule.fecha_final) {
                    let dateBase = parseDateStr(itemSchedule.fecha_final);
                    if (itemSchedule.hora_final) {
                        const timeParts = itemSchedule.hora_final.split(':');
                        dateBase.setHours(parseInt(timeParts[0]), parseInt(timeParts[1] ?? 0), 0, 0);
                    } else {
                        dateBase.setHours(23, 59, 59, 999);
                    }
                    fechaFinal = dateBase;
                }

                const unlockedLessons = data.unlockedLessonsData ?? {};
                const unlock = unlockedLessons[item.id];
                if (unlock) {
                    fechaFinal = new Date(unlock.until_date);
                    fechaFinal.setHours(23, 59, 59, 999);
                }

                let childUnlocked = false;
                if (item.clases && item.clases.length > 0) {
                    childUnlocked = item.clases.some(child => unlockedLessons[child.id] !== undefined);
                }

                const startOk = !fechaInicial || hoyTime >= fechaInicial.getTime();
                const endOk = !fechaFinal || hoyTime <= fechaFinal.getTime();

                return (startOk && endOk) || childUnlocked;
            }

            const rawModulos = cp.curso.lecciones;
            const modulos = [...rawModulos].sort((a, b) => {
                const itemA = schedule.find(x => x.id == a.id);
                const itemB = schedule.find(x => x.id == b.id);
                const ordenA = itemA ? (itemA.orden ?? 0) : 0;
                const ordenB = itemB ? (itemB.orden ?? 0) : 0;
                return ordenA - ordenB;
            });

            if (modulos.length === 0) {
                modulesList.innerHTML = `<div class="loading-state"><p>Aún no hay módulos cargados en este curso.</p></div>`;
                return;
            }

            modulos.forEach(modulo => {
                const modCard = document.createElement('div');
                modCard.className = 'module-card';
                
                const isModuleUnlocked = checkIsUnlocked(modulo);

                if (isModuleUnlocked) {
                    modCard.innerHTML = `
                        <div class="module-header">
                            <div class="module-title-box">
                                <h3>${modulo.titulo}</h3>
                                <span>${modulo.totalClases} clases • ${modulo.completedCount} completadas</span>
                            </div>
                            <div class="module-meta">
                                <span class="module-progress-text">${modulo.progress}%</span>
                                <span class="accordion-arrow">▼</span>
                            </div>
                        </div>
                        <div class="module-classes hidden" id="classes-of-${modulo.id}">
                            <!-- Clases dinámicas del módulo -->
                        </div>
                    `;

                    const header = modCard.querySelector('.module-header');
                    const classesContainer = modCard.querySelector('.module-classes');
                    const arrow = modCard.querySelector('.accordion-arrow');

                    header.addEventListener('click', () => {
                        const isHidden = classesContainer.classList.contains('hidden');
                        if (isHidden) {
                            classesContainer.classList.remove('hidden');
                            arrow.innerText = '▲';
                        } else {
                            classesContainer.classList.add('hidden');
                            arrow.innerText = '▼';
                        }
                        loadLessonDetails(modulo.id, cpId);
                    });

                    const sortedClases = [...modulo.clases].sort((a, b) => {
                        const itemA = schedule.find(x => x.id == a.id);
                        const itemB = schedule.find(x => x.id == b.id);
                        const ordenA = itemA ? (itemA.orden ?? 0) : 0;
                        const ordenB = itemB ? (itemB.orden ?? 0) : 0;
                        return ordenA - ordenB;
                    });

                    sortedClases.forEach((clase, idx) => {
                        const classRow = document.createElement('div');
                        const isCompleted = data.completedLessons.includes(clase.id);
                        const isClassUnlocked = checkIsUnlocked(clase);

                        if (isClassUnlocked) {
                            classRow.className = 'class-row';
                            const statusText = isCompleted ? 'Completado' : 'Pendiente';
                            const statusClass = isCompleted ? 'completed' : 'pending';

                            classRow.innerHTML = `
                                <div class="class-info">
                                    <span class="class-index">${idx + 1}</span>
                                    <span class="class-title">${clase.titulo}</span>
                                </div>
                                <span class="class-status-badge ${statusClass}">${statusText}</span>
                            `;

                            classRow.addEventListener('click', (e) => {
                                e.stopPropagation();
                                loadLessonDetails(clase.id, cpId);
                            });
                        } else {
                            classRow.className = 'class-row locked';
                            classRow.style.cssText = "opacity:0.55; cursor:not-allowed; background:rgba(255,255,255,0.02);";
                            
                            classRow.innerHTML = `
                                <div class="class-info">
                                    <span class="class-index" style="background:var(--bg-slate-700);">🔒</span>
                                    <span class="class-title" style="color:var(--text-muted);">${clase.titulo}</span>
                                </div>
                                <span class="class-status-badge pending" style="background:rgba(255,255,255,0.05); color:var(--text-muted);">Bloqueado</span>
                            `;
                        }

                        classesContainer.appendChild(classRow);
                    });
                } else {
                    modCard.className = 'module-card locked';
                    modCard.style.cssText = "opacity:0.55; cursor:not-allowed; background:rgba(255,255,255,0.01);";
                    modCard.innerHTML = `
                        <div class="module-header" style="pointer-events: none;">
                            <div class="module-title-box">
                                <h3 style="color:var(--text-muted);"><span style="margin-right:0.5rem;">🔒</span>${modulo.titulo}</h3>
                                <span style="color:var(--text-muted);">${modulo.totalClases} clases • 0 completadas</span>
                            </div>
                            <div class="module-meta">
                                <span class="module-progress-text" style="color:var(--text-muted);">Bloqueado</span>
                                <span class="accordion-arrow">▼</span>
                            </div>
                        </div>
                    `;
                }

                modulesList.appendChild(modCard);
            });
        }
    } catch (e) {
        modulesList.innerHTML = `<div class="loading-state"><p class="status error">Error de red o conexión al servidor.</p></div>`;
    }
}
