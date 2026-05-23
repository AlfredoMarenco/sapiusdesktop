document.addEventListener('DOMContentLoaded', async () => {
    // Navigation Nodes
    const navItems = document.querySelectorAll('.nav-item');
    const viewPanes = document.querySelectorAll('.view-pane');
    const viewTitle = document.getElementById('view-title');
    const currentDate = document.getElementById('current-date');
    const displayMac = document.getElementById('display-mac');
    const supportMac = document.getElementById('support-mac');
    const logoutBtn = document.getElementById('logout-btn');

    // User Nodes
    const userNameNode = document.getElementById('user-name');
    const userAvatarNode = document.getElementById('user-avatar');

    // View specific grids
    const coursesGrid = document.getElementById('courses-grid');
    
    // Course Detail Nodes
    const viewCoursesPane = document.getElementById('view-courses');
    const viewCourseDetailPane = document.getElementById('view-course-detail');
    const courseDetailTitle = document.getElementById('course-detail-title');
    const courseProgressText = document.getElementById('course-progress-text');
    const courseProgressFill = document.getElementById('course-progress-fill');
    const modulesList = document.getElementById('modules-list');
    const btnBackToCourses = document.getElementById('btn-back-to-courses');

    // Lesson Detail Nodes
    const viewLessonDetailPane = document.getElementById('view-lesson-detail');
    const lessonTitle = document.getElementById('lesson-title');
    const lessonDescription = document.getElementById('lesson-description');
    const videoContainer = document.getElementById('video-container');
    const secureVideo = document.getElementById('secure-video');
    if (secureVideo) {
        secureVideo.addEventListener('error', (e) => {
            const mediaError = secureVideo.error;
            const errorMsg = mediaError ? `Código ${mediaError.code}: ${mediaError.message || ''}` : 'Error desconocido';
            console.error("HTML5 Video Playback Error:", errorMsg, "Source:", secureVideo.src);
            window.sapiusAPI.logToServer(`Error de reproducción de video HTML5: ${errorMsg}. Fuente: ${secureVideo.src}`, 'ERROR');
        });
    }
    const pdfContainer = document.getElementById('pdf-container');
    const chkLessonCompleted = document.getElementById('chk-lesson-completed');
    const pruebasList = document.getElementById('pruebas-list');
    const homeworkStatusContainer = document.getElementById('homework-status-container');
    const formHomework = document.getElementById('form-homework');
    const fileDropZone = document.getElementById('file-drop-zone');
    const homeworkFileInput = document.getElementById('homework-file');
    const fileInfo = document.getElementById('file-info');
    const fileNameText = document.getElementById('file-name-text');
    const btnRemoveFile = document.getElementById('btn-remove-file');
    const homeworkText = document.getElementById('homework-text');
    const btnBackToCourse = document.getElementById('btn-back-to-course');

    // Exam Nodes
    const examOverlay = document.getElementById('exam-overlay');
    const examTitle = document.getElementById('exam-title');
    const examSubtitle = document.getElementById('exam-subtitle');
    const examTimer = document.getElementById('exam-timer');
    const questionCard = document.getElementById('question-card');
    const btnExamPrev = document.getElementById('btn-exam-prev');
    const btnExamNext = document.getElementById('btn-exam-next');
    const btnExamFinish = document.getElementById('btn-exam-finish');
    const questionsStatusGrid = document.getElementById('questions-status-grid');

    // Feedback Nodes
    const feedbackOverlay = document.getElementById('feedback-overlay');
    const btnCloseFeedback = document.getElementById('btn-close-feedback');
    const fbCorrectas = document.getElementById('fb-correctas');
    const fbPuntaje = document.getElementById('fb-puntaje');
    const feedbackDetailsList = document.getElementById('feedback-details-list');

    // Homework Tracking Node
    const homeworkTrackingBody = document.getElementById('homework-tracking-body');

    // State Variables
    let activeCourseId = null;
    let activeLessonId = null;
    let activeInscripcionId = null;
    let currentExamId = null;
    let currentPruebaId = null;
    let examQuestions = [];
    let examAnswers = {};
    let examCurrentPage = 1;
    let examTotalPages = 1;
    let examTimeLimitSeconds = 0;
    let examTimerInterval = null;

    // PDF.js State Variables
    let pdfDoc = null;
    let pdfPageNum = 1;
    let pdfPageRendering = false;
    let pdfPageNumPending = null;
    let pdfScale = 1.2;
    const pdfCanvas = document.getElementById('pdf-canvas');
    const pdfCtx = pdfCanvas.getContext('2d');

    // Set Current Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDate.innerText = new Date().toLocaleDateString('es-ES', options);

    // Get Device details
    const mac = window.sapiusAPI.getMacAddress();
    displayMac.innerText = `MAC: ${mac}`;
    supportMac.innerText = mac;

    // INITIALIZATION
    loadDashboardData();

    // MENU NAVIGATION SWITCHING
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = item.getAttribute('data-view');

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            viewPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(`view-${targetView}`).classList.add('active');

            // Set Title
            viewTitle.innerText = item.querySelector('span:last-child').innerText;

            // Specific View Triggers
            if (targetView === 'courses') {
                loadDashboardData();
            } else if (targetView === 'homework') {
                loadHomeworkTracking();
            } else if (targetView === 'calendar') {
                loadCalendarView();
            }
        });
    });

    // BACK BUTTONS
    btnBackToCourses.addEventListener('click', () => {
        viewCourseDetailPane.classList.remove('active');
        viewCoursesPane.classList.add('active');
        viewTitle.innerText = "Mis Cursos";
    });

    btnBackToCourse.addEventListener('click', () => {
        // Detener reproductores de video/audio
        secureVideo.pause();
        secureVideo.src = "";
        
        const welcomePane = document.getElementById('lesson-welcome-pane');
        const workspacePane = document.getElementById('lesson-workspace-pane');
        if (welcomePane) welcomePane.classList.remove('hidden');
        if (workspacePane) workspacePane.classList.add('hidden');
        viewTitle.innerText = "Temario del Curso";
    });

    // 1. DASHBOARD / COURSES LIST
    async function loadDashboardData() {
        coursesGrid.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Cargando tus cursos programados...</p>
            </div>
        `;

        try {
            const res = await window.sapiusAPI.apiGet('/electron/dashboard');
            if (res && res.success) {
                const user = res.data.user;
                const courses = res.data.mis_cursos;

                // Update Profile Info
                userNameNode.innerText = user.nombre_completo;
                userAvatarNode.innerText = user.nombre_completo.charAt(0).toUpperCase();

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
                    const c = cp.curso;
                    const catName = cp.category ? cp.category.name : 'Curso';

                    const card = document.createElement('div');
                    card.className = 'glass-card course-card';
                    card.innerHTML = `
                        <div class="course-card-header">
                            <span class="course-category-badge">${catName}</span>
                            <span class="course-progress-radial">🎯</span>
                        </div>
                        <h3>${c.titulo}</h3>
                        <p class="subtitle">Instructor: ${cp.instructor ? cp.instructor.nombre_completo : 'Por asignar'}</p>
                        <div class="course-meta">
                            <span>Vence: ${new Date(cp.fecha_fin).toLocaleDateString('es-ES')}</span>
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

    // 2. COURSE DETAILS (MODULES ACCORDION & PROGRESS)
    async function loadCourseDetails(cpId) {
        activeCourseId = cpId;
        viewCoursesPane.classList.remove('active');
        viewCourseDetailPane.classList.add('active');
        viewTitle.innerText = "Temario del Curso";

        const welcomePane = document.getElementById('lesson-welcome-pane');
        const workspacePane = document.getElementById('lesson-workspace-pane');
        if (welcomePane) welcomePane.classList.remove('hidden');
        if (workspacePane) workspacePane.classList.add('hidden');

        modulesList.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Cargando temario y progreso...</p>
            </div>
        `;

        try {
            const res = await window.sapiusAPI.apiGet(`/electron/course/${cpId}`);
            if (res && res.success) {
                const data = res.data;
                const cp = data.curso_programado;
                
                activeInscripcionId = data.inscrito.id;
                courseDetailTitle.innerText = cp.curso.titulo;

                if (cp.category.name === "Guias") {
                    // Si es una guía, renderizar descarga segura o vista directa de PDF
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
                            // Cargar la guía como una lección especial
                            loadLessonDetails(0, cpId); // 0 indica cargador de guía
                        });
                    } else {
                        modulesList.innerHTML = `<div class="loading-state"><p>El material de la guía no ha sido subido por el instructor.</p></div>`;
                    }
                    return;
                }

                // Si es un curso estándar
                courseProgressText.innerText = `${data.globalProgress}%`;
                courseProgressFill.style.width = `${data.globalProgress}%`;

                modulesList.innerHTML = '';
                const schedule = (data.contenido_programado && data.contenido_programado.contenido) ? data.contenido_programado.contenido : [];

                // Helper para parsear fechas d/m/Y o Y-m-d
                function parseDateStr(dateStr) {
                    if (!dateStr) return null;
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        return new Date(parts[2], parts[1] - 1, parts[0]);
                    }
                    return new Date(dateStr);
                }

                // Helper para verificar si un módulo o clase está desbloqueado
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

                    // Verificar desbloqueo manual de administrador
                    const unlockedLessons = data.unlockedLessonsData ?? {};
                    const unlock = unlockedLessons[item.id];
                    if (unlock) {
                        fechaFinal = new Date(unlock.until_date);
                        fechaFinal.setHours(23, 59, 59, 999);
                    }

                    // Verificar si tiene hijos y alguno de ellos está desbloqueado
                    let childUnlocked = false;
                    if (item.clases && item.clases.length > 0) {
                        childUnlocked = item.clases.some(child => unlockedLessons[child.id] !== undefined);
                    }

                    const startOk = !fechaInicial || hoyTime >= fechaInicial.getTime();
                    const endOk = !fechaFinal || hoyTime <= fechaFinal.getTime();

                    return (startOk && endOk) || childUnlocked;
                }

                // Ordenar Módulos por orden en el schedule
                const rawModulos = cp.curso.lecciones; // Lecciones con leccion_id = 0
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
                            // Cargar contenido del módulo en sí mismo
                            loadLessonDetails(modulo.id, cpId);
                        });

                        // Ordenar las clases del módulo según el schedule
                        const sortedClases = [...modulo.clases].sort((a, b) => {
                            const itemA = schedule.find(x => x.id == a.id);
                            const itemB = schedule.find(x => x.id == b.id);
                            const ordenA = itemA ? (itemA.orden ?? 0) : 0;
                            const ordenB = itemB ? (itemB.orden ?? 0) : 0;
                            return ordenA - ordenB;
                        });

                        // Renderizar clases (Lecciones del módulo)
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
                                classRow.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    // No hace nada
                                });
                            }

                            classesContainer.appendChild(classRow);
                        });
                    } else {
                        // Módulo completamente bloqueado
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

    // 3. LESSON DETAILS (SECURE PLAYERS, COMPLETION AND SECURE PDF)
    async function loadLessonDetails(leccionId, cpId) {
        activeLessonId = leccionId;
        
        const welcomePane = document.getElementById('lesson-welcome-pane');
        const workspacePane = document.getElementById('lesson-workspace-pane');
        if (welcomePane) welcomePane.classList.add('hidden');
        if (workspacePane) workspacePane.classList.remove('hidden');
        
        // Reiniciar vistas
        videoContainer.classList.add('hidden');
        pdfContainer.classList.add('hidden');
        pruebasList.innerHTML = '';
        homeworkStatusContainer.innerHTML = '';
        formHomework.reset();
        clearFileInfo();

        if (leccionId === 0) {
            // Caso especial: Guía
            lessonTitle.innerText = "Guía de Estudio Protegida";
            lessonDescription.innerHTML = "<p>Visualiza el material interactivo completo a continuación. Recuerda que la impresión y copia de este archivo están completamente restringidas por derechos de propiedad intelectual.</p>";
            
            // Cargar PDF de guía
            loadSecurePDF(0, cpId); // 0 indica que buscará el archivo de guía
            return;
        }

        try {
            console.log(`Llamando a apiGet para lección ID: ${leccionId}`);
            const res = await window.sapiusAPI.apiGet(`/electron/lesson/${leccionId}/${cpId}`);
            console.log("Respuesta de apiGet lección:", res);
            if (res && res.success) {
                const data = res.data;
                const leccion = data.leccion;
                console.log("Lección cargada con éxito:", leccion.titulo, "Datos asociados:", { video: data.video, videoext: data.videoext });

                lessonTitle.innerText = leccion.titulo;
                lessonDescription.innerHTML = leccion.contenido || '<p>No hay descripción adicional para esta clase.</p>';

                // 1. COMPLETION CHECKBOX
                if (chkLessonCompleted) {
                    chkLessonCompleted.checked = data.completedLessons.includes(leccion.id);
                    chkLessonCompleted.onchange = async () => {
                        const toggleRes = await window.sapiusAPI.apiPost('/electron/lecciones/toggle-completion', {
                            leccion_id: leccion.id,
                            curso_programado_id: cpId
                        });
                        if (toggleRes && toggleRes.success) {
                            window.sapiusAPI.logToServer(`Clase ${leccion.id} marcada/desmarcada exitosamente.`);
                        }
                    };
                }

                // 2. VIDEO PLAYER SECURE
                const videoUrlText = document.getElementById('video-url-text');
                if (data.video || data.videoext) {
                    videoContainer.classList.remove('hidden');
                    if (data.video) {
                        // Carga segura del video stream
                        const baseUrl = await window.sapiusAPI.getBaseUrl();
                        const fullUrl = `${baseUrl}/alumno/medias/stream/${data.video.ruta}`;
                        secureVideo.src = fullUrl;
                        if (videoUrlText) videoUrlText.textContent = fullUrl;
                    } else if (data.videoext) {
                        // External embed video (Youtube, Vimeo, etc.)
                        secureVideo.src = data.videoext.ruta;
                        if (videoUrlText) videoUrlText.textContent = data.videoext.ruta;
                    }
                }

                // 3. PDF VIEWER SECURE
                if (leccion.archivo_pdf) {
                    loadSecurePDF(leccion.id, cpId);
                }

                // 4. EXAMS / PRUEBAS LIST
                if (leccion.pruebas && leccion.pruebas.length > 0) {
                    leccion.pruebas.forEach(prueba => {
                        const div = document.createElement('div');
                        div.className = 'prueba-item-row';
                        div.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; padding:0.75rem; background:rgba(255,255,255,0.02); border-radius:0.5rem; border:1px solid rgba(255,255,255,0.05);";
                        
                        div.innerHTML = `
                            <div>
                                <strong style="display:block;">${prueba.titulo}</strong>
                                <span style="font-size:0.75rem; color:var(--text-muted);">${prueba.oportunidades} Oportunidades</span>
                            </div>
                            <button class="glass-btn primary small btn-present-exam" data-id="${prueba.id}">Presentar</button>
                        `;

                        div.querySelector('.btn-present-exam').addEventListener('click', () => {
                            launchStrictExam(prueba.id, data.inscripcion_id);
                        });

                        pruebasList.appendChild(div);
                    });
                } else {
                    pruebasList.innerHTML = '<p class="subtitle">No hay exámenes vinculados a esta clase.</p>';
                }

                // 5. HOMEWORK / TAREAS
                if (data.homework) {
                    homeworkStatusContainer.innerHTML = `
                        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success-green); padding: 1rem; border-radius: 0.75rem; margin-bottom: 1rem;">
                            <strong style="color: var(--success-green); display: block;">¡Tarea Entregada!</strong>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">
                                Estado: Entregado ${data.homework.is_late ? '<strong style="color:var(--accent-coral)">(Con retraso)</strong>' : '(A tiempo)'}
                            </span>
                        </div>
                    `;
                    formHomework.classList.add('hidden');
                } else {
                    formHomework.classList.remove('hidden');
                }
            } else {
                console.error("Error al cargar la lección: success es falso o la respuesta es inválida.", res);
                window.sapiusAPI.logToServer(`Error al cargar lección: success es falso o vacío. Respuesta: ${res ? JSON.stringify(res) : 'null'}`, 'ERROR');
            }
        } catch (e) {
            console.error("Excepción en loadLessonDetails:", e);
            window.sapiusAPI.logToServer(`Error cargando leccion (Excepcion): ${e.message}`, 'ERROR');
        }
    }

    // 4. SECURE PDF rendering (Page-by-page Canvas rendering)
    async function loadSecurePDF(leccionId, cpId) {
        pdfContainer.classList.remove('hidden');
        pdfDoc = null;
        pdfPageNum = 1;
        pdfPageRendering = false;
        pdfPageNumPending = null;

        const baseUrl = await window.sapiusAPI.getBaseUrl();
        const pdfUrl = leccionId === 0 
            ? `${baseUrl}/api/electron/pdf/0?curso_programado_id=${cpId}`
            : `${baseUrl}/api/electron/pdf/${leccionId}`;

        // Obtener ArrayBuffer usando fetch manual para pasar cabeceras de sesión de Electron
        try {
            // Nota: las cabeceras se insertan automáticamente por el interceptor del Main Process
            const response = await fetch(pdfUrl);
            if (!response.ok) throw new Error("Error fetching secure PDF");
            const data = await response.arrayBuffer();

            pdfjsLib.getDocument({ data: data }).promise.then((pdfDoc_) => {
                pdfDoc = pdfDoc_;
                document.getElementById('pdf-page-count').textContent = pdfDoc.numPages;
                renderPdfPage(pdfPageNum);
            });
        } catch (e) {
            window.sapiusAPI.logToServer(`Error al renderizar PDF seguro: ${e.message}`, 'ERROR');
            pdfContainer.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--danger-red);">Error al descargar o desencriptar PDF protegido.</div>';
        }
    }

    function renderPdfPage(num) {
        pdfPageRendering = true;
        pdfDoc.getPage(num).then((page) => {
            const viewport = page.getViewport({ scale: pdfScale });
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;

            const renderContext = {
                canvasContext: pdfCtx,
                viewport: viewport
            };
            const renderTask = page.render(renderContext);

            renderTask.promise.then(() => {
                pdfPageRendering = false;
                if (pdfPageNumPending !== null) {
                    renderPdfPage(pdfPageNumPending);
                    pdfPageNumPending = null;
                }
            });
        });

        document.getElementById('pdf-page-num').textContent = num;
    }

    function queueRenderPage(num) {
        if (pdfPageRendering) {
            pdfPageNumPending = num;
        } else {
            renderPdfPage(num);
        }
    }

    document.getElementById('pdf-prev').addEventListener('click', () => {
        if (pdfPageNum <= 1) return;
        pdfPageNum--;
        queueRenderPage(pdfPageNum);
    });

    document.getElementById('pdf-next').addEventListener('click', () => {
        if (pdfPageNum >= pdfDoc.numPages) return;
        pdfPageNum++;
        queueRenderPage(pdfPageNum);
    });

    document.getElementById('pdf-zoom-in').addEventListener('click', () => {
        pdfScale += 0.2;
        if (pdfDoc) renderPdfPage(pdfPageNum);
    });

    document.getElementById('pdf-zoom-out').addEventListener('click', () => {
        if (pdfScale <= 0.6) return;
        pdfScale -= 0.2;
        if (pdfDoc) renderPdfPage(pdfPageNum);
    });

    // 5. DRAG & DROP HOMEWORK FILE
    fileDropZone.addEventListener('click', () => homeworkFileInput.click());
    
    fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropZone.style.borderColor = 'var(--secondary-blue)';
    });

    fileDropZone.addEventListener('dragleave', () => {
        fileDropZone.style.borderColor = 'var(--glass-border)';
    });

    fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropZone.style.borderColor = 'var(--glass-border)';
        if (e.dataTransfer.files.length > 0) {
            handleHomeworkFileSelect(e.dataTransfer.files[0]);
        }
    });

    homeworkFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleHomeworkFileSelect(e.target.files[0]);
        }
    });

    function handleHomeworkFileSelect(file) {
        fileNameText.innerText = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
        fileDropZone.classList.add('hidden');
        fileInfo.classList.remove('hidden');
    }

    btnRemoveFile.addEventListener('click', () => {
        clearFileInfo();
    });

    function clearFileInfo() {
        homeworkFileInput.value = '';
        fileInfo.classList.add('hidden');
        fileDropZone.classList.remove('hidden');
    }

    formHomework.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = homeworkFileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('documento', file);
        formData.append('leccion_id', activeLessonId);
        formData.append('curso_programado_id', activeCourseId);
        formData.append('tarea', homeworkText.value.trim() || 'Entregado desde Electron Client');

        homeworkStatusContainer.innerHTML = `<div class="spinner" style="width: 25px; height: 25px;"></div> Subiendo tarea...`;
        formHomework.classList.add('hidden');

        try {
            const baseUrl = await window.sapiusAPI.getBaseUrl();
            const response = await fetch(`${baseUrl}/api/electron/send-homework`, {
                method: 'POST',
                body: formData
            });

            const res = await response.json();
            if (res.success) {
                homeworkStatusContainer.innerHTML = `
                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success-green); padding: 1rem; border-radius: 0.75rem; margin-bottom: 1rem;">
                        <strong style="color: var(--success-green); display: block;">¡Tarea Entregada!</strong>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">
                            Estado: Entregado ${res.data.is_late ? '<strong style="color:var(--accent-coral)">(Con retraso)</strong>' : '(A tiempo)'}
                        </span>
                    </div>
                `;
            } else {
                throw new Error(res.message);
            }
        } catch (err) {
            homeworkStatusContainer.innerHTML = `<p class="status error">Error: ${err.message}</p>`;
            formHomework.classList.remove('hidden');
        }
    });

    // 6. STRICT EXAM MODE OVERLAY (ANTI-PLAGIARISM SECURE)
    async function launchStrictExam(pruebaId, inscripcionId) {
        currentPruebaId = pruebaId;
        examOverlay.classList.remove('hidden');
        questionCard.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Preparando examen seguro...</p>
            </div>
        `;

        try {
            const prevRes = await window.sapiusAPI.apiGet(`/electron/exam/previo/${pruebaId}/${inscripcionId}`);
            if (prevRes && prevRes.success) {
                const data = prevRes.data;
                const prueba = data.prueba;

                if (data.oportunidades_restantes <= 0) {
                    questionCard.innerHTML = `
                        <div style="text-align:center;">
                            <span style="font-size:3rem;">❌</span>
                            <h3 style="margin-top:1rem;">Oportunidades Agotadas</h3>
                            <p class="subtitle">Ya has agotado el límite de intentos para esta evaluación.</p>
                            <button class="glass-btn primary" id="btn-close-exam-overlay">Regresar</button>
                        </div>
                    `;
                    document.getElementById('btn-close-exam-overlay').addEventListener('click', () => {
                        examOverlay.classList.add('hidden');
                    });
                    return;
                }

                questionCard.innerHTML = `
                    <div style="text-align:center; padding: 2rem;">
                        <h3>Instrucciones de Examen</h3>
                        <p class="subtitle" style="margin-top:1rem; line-height:1.6;">
                            ${prueba.descripcion || 'Esta prueba evalúa los contenidos asimilados en la clase.'}
                        </p>
                        <div style="background:rgba(239, 68, 68, 0.05); border:1px solid rgba(239, 68, 68, 0.2); border-radius:0.75rem; padding:1.25rem; margin:2rem 0; text-align:left;">
                            <strong style="color:var(--danger-red); display:block; margin-bottom:0.5rem;">🔒 Sistema Anti-Plagio Activo</strong>
                            <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5;">
                                El examen corre bajo monitoreo. Cambiar de ventana, abrir herramientas de desarrollador o inactividad prolongada registrarán strikes directos a tu historial.
                            </p>
                        </div>
                        <button class="glass-btn primary" id="btn-start-exam">Comenzar Examen</button>
                    </div>
                `;

                document.getElementById('btn-start-exam').addEventListener('click', () => {
                    startExamSession(pruebaId, inscripcionId, prueba.duracion);
                });
            }
        } catch (e) {
            examOverlay.classList.add('hidden');
        }
    }

    async function startExamSession(pruebaId, inscripcionId, durationMinutes) {
        examCurrentPage = 1;
        examAnswers = {};
        
        // Inicializar Anti-Plagio Event Listeners
        setupPlagiarismListeners();

        // Inicializar Temporizador
        examTimeLimitSeconds = (durationMinutes || 60) * 60;
        updateTimerDisplay();
        
        examTimerInterval = setInterval(() => {
            examTimeLimitSeconds--;
            updateTimerDisplay();
            if (examTimeLimitSeconds <= 0) {
                clearInterval(examTimerInterval);
                finishExamSession();
            }
        }, 1000);

        loadExamPage(pruebaId, inscripcionId);
    }

    function updateTimerDisplay() {
        const mins = Math.floor(examTimeLimitSeconds / 60).toString().padStart(2, '0');
        const secs = (examTimeLimitSeconds % 60).toString().padStart(2, '0');
        examTimer.innerText = `${mins}:${secs}`;
    }

    async function loadExamPage(pruebaId, inscripcionId) {
        questionCard.innerHTML = `<div class="spinner"></div>`;

        // Serializar respuestas actuales
        const respuestasPayload = JSON.stringify(Object.keys(examAnswers).map(key => ({
            name: key,
            value: examAnswers[key]
        })));

        try {
            const res = await window.sapiusAPI.apiPost('/electron/exam/presentar', {
                prueba_id: pruebaId,
                inscripcion_id: inscripcionId,
                page: examCurrentPage,
                respuestas: respuestasPayload
            });

            if (res && res.success) {
                const data = res.data;
                currentExamId = data.examen.id;
                
                // Sincronizar respuestas ya guardadas previamente en la BD con el estado local
                if (data.respuestas_guardadas && data.respuestas_guardadas.length > 0) {
                    data.respuestas_guardadas.forEach(r => {
                        if (r.name && examAnswers[r.name] === undefined) {
                            examAnswers[r.name] = r.value;
                        }
                    });
                }

                // Pregunta paginada actual (usualmente 1 por página en Sapius)
                const pregunta = data.preguntas.data[0];
                examTotalPages = data.preguntas.last_page;

                questionCard.innerHTML = '';

                if (pregunta && pregunta.grupo_preguntas) {
                    pregunta.grupo_preguntas.forEach(preg => {
                        const savedVal = data.respuestas_guardadas.find(r => r.name == preg.id)?.value;
                        const currentVal = examAnswers[preg.id] !== undefined ? examAnswers[preg.id] : savedVal;

                        let optionsHtml = '';
                        const respuestas = preg.respuestas || [];
                        respuestas.forEach(resp => {
                            const isChecked = currentVal == resp.id ? 'checked' : '';
                            optionsHtml += `
                                <label class="option-row">
                                    <input type="radio" name="question_${preg.id}" value="${resp.id}" ${isChecked}>
                                    <span class="option-text">${resp.respuesta}</span>
                                </label>
                            `;
                        });

                        const pregDiv = document.createElement('div');
                        pregDiv.className = 'question-group-item';
                        pregDiv.style.marginBottom = '2rem';
                        pregDiv.innerHTML = `
                            <div class="question-text" style="font-size:1.15rem; font-weight:600; margin-bottom:1rem;">${preg.pregunta}</div>
                            <div class="options-list">
                                ${optionsHtml}
                            </div>
                        `;

                        // Capturar respuesta seleccionada en tiempo real
                        const radios = pregDiv.querySelectorAll('input[type="radio"]');
                        radios.forEach(radio => {
                            radio.addEventListener('change', (e) => {
                                examAnswers[preg.id] = e.target.value;
                                // Actualizar grid navegación rápida
                                updateExamNavGrid(data.preguntasAll);
                            });
                        });

                        questionCard.appendChild(pregDiv);
                    });
                } else {
                    questionCard.innerHTML = '<p>No se encontraron preguntas en esta página.</p>';
                }

                // Botones navegación
                btnExamPrev.disabled = examCurrentPage === 1;
                
                if (examCurrentPage === examTotalPages) {
                    btnExamNext.classList.add('hidden');
                    btnExamFinish.classList.remove('hidden');
                } else {
                    btnExamNext.classList.remove('hidden');
                    btnExamFinish.classList.add('hidden');
                }

                // Grid lateral de estado de preguntas
                updateExamNavGrid(data.preguntasAll);

            }
        } catch (e) {
            window.sapiusAPI.logToServer(`Error al cargar página de examen: ${e.message}`, 'ERROR');
        }
    }

    function updateExamNavGrid(preguntasAll) {
        questionsStatusGrid.innerHTML = '';
        preguntasAll.forEach((grupo, idx) => {
            const container = document.createElement('div');
            container.className = 'exam-nav-group';
            container.style.cssText = "display:inline-block; margin:4px; padding:2px; border-radius:6px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); cursor:pointer;";
            
            if (idx + 1 === examCurrentPage) {
                container.style.borderColor = 'var(--secondary-blue)';
                container.style.boxShadow = '0 0 10px rgba(0, 102, 204, 0.3)';
            }
            
            container.addEventListener('click', () => {
                examCurrentPage = idx + 1;
                loadExamPage(currentPruebaId, activeInscripcionId);
            });
            
            const subQuestions = grupo.grupo_preguntas || [];
            subQuestions.forEach((subPreg, subIdx) => {
                const span = document.createElement('span');
                span.style.cssText = "display:inline-block; width:30px; height:30px; line-height:30px; text-align:center; font-size:0.75rem; border-radius:4px; margin:2px; font-weight:600;";
                
                const hasAnswer = examAnswers[subPreg.id] !== undefined;
                if (hasAnswer) {
                    span.style.background = 'var(--secondary-blue)';
                    span.style.color = '#ffffff';
                } else {
                    span.style.background = 'rgba(255,255,255,0.05)';
                    span.style.color = 'var(--text-muted)';
                }
                
                const label = subQuestions.length > 1 ? `${idx + 1}.${subIdx + 1}` : `${idx + 1}`;
                span.innerText = label;
                container.appendChild(span);
            });
            
            questionsStatusGrid.appendChild(container);
        });
    }

    btnExamPrev.addEventListener('click', () => {
        if (examCurrentPage > 1) {
            examCurrentPage--;
            loadExamPage(currentPruebaId, activeInscripcionId);
        }
    });

    btnExamNext.addEventListener('click', () => {
        if (examCurrentPage < examTotalPages) {
            examCurrentPage++;
            loadExamPage(currentPruebaId, activeInscripcionId);
        }
    });

    btnExamFinish.addEventListener('click', () => {
        finishExamSession();
    });

    async function finishExamSession() {
        clearInterval(examTimerInterval);
        
        // Remover detectores anti-plagio
        removePlagiarismListeners();

        // Enviar guardado de últimas respuestas y finalizar
        const respuestasPayload = JSON.stringify(Object.keys(examAnswers).map(key => ({
            name: key,
            value: examAnswers[key]
        })));

        try {
            // Guardar respuestas una última vez
            await window.sapiusAPI.apiPost('/electron/exam/presentar', {
                prueba_id: currentPruebaId,
                inscripcion_id: activeInscripcionId,
                page: examCurrentPage,
                respuestas: respuestasPayload
            });

            // Enviar fin de examen
            const finRes = await window.sapiusAPI.apiPost('/electron/exam/finalizar', {
                examen_id: currentExamId
            });

            if (finRes && finRes.success) {
                examOverlay.classList.add('hidden');
                
                // Mostrar retroalimentación
                showFeedbackModal(currentExamId);
                
                // Recargar temario para refrescar el progreso
                loadCourseDetails(activeCourseId);
            }
        } catch (e) {
            examOverlay.classList.add('hidden');
        }
    }

    // 7. ANTI-PLAGIARISM LISTENERS (STRIKE REGISTERING)
    function setupPlagiarismListeners() {
        window.addEventListener('blur', logWindowExit);
        document.addEventListener('visibilitychange', logVisibilityChange);
    }

    function removePlagiarismListeners() {
        window.removeEventListener('blur', logWindowExit);
        document.removeEventListener('visibilitychange', logVisibilityChange);
    }

    async function logWindowExit() {
        await window.sapiusAPI.apiPost('/electron/exam/eventos', {
            examen_id: currentExamId,
            observacion: 'El usuario desenfocó o salió de la ventana del examen',
            tecla: 'N/A',
            lugar: 'Electron Client Blur'
        });
        window.sapiusAPI.logToServer('Strike anti-plagio: El usuario desenfocó la ventana del examen.');
    }

    async function logVisibilityChange() {
        if (document.hidden) {
            await window.sapiusAPI.apiPost('/electron/exam/eventos', {
                examen_id: currentExamId,
                observacion: 'El usuario ocultó o minimizó la pantalla del examen',
                tecla: 'N/A',
                lugar: 'Electron Client Hidden'
            });
            window.sapiusAPI.logToServer('Strike anti-plagio: Pantalla oculta.');
        }
    }

    // 8. FEEDBACK MODAL
    async function showFeedbackModal(examenId) {
        feedbackOverlay.classList.remove('hidden');
        feedbackDetailsList.innerHTML = `<div class="spinner"></div>`;

        try {
            const res = await window.sapiusAPI.apiGet(`/electron/exam/feedback/${examenId}`);
            if (res && res.success) {
                const data = res.data;
                fbCorrectas.innerText = data.examen.total_correctas;
                fbPuntaje.innerText = data.examen.score_total;

                feedbackDetailsList.innerHTML = '';
                
                if (data.feedback.length === 0) {
                    feedbackDetailsList.innerHTML = '<p style="text-align:center; color:var(--success-green); font-weight:700;">¡Excelente! Todas tus respuestas fueron correctas.</p>';
                    return;
                }

                data.feedback.forEach(item => {
                    const isCorrect = item.user_answer.value == item.correct_answer.id;
                    const div = document.createElement('div');
                    div.className = `feedback-item ${isCorrect ? 'correct' : 'incorrect'}`;

                    div.innerHTML = `
                        <strong style="display:block; margin-bottom:0.5rem; font-size:1.1rem;">
                            Pregunta: ${item.correct_answer.pregunta ? item.correct_answer.pregunta.pregunta : 'Detalle'}
                        </strong>
                        <div style="font-size:0.95rem; margin-top:0.5rem;">
                            <span style="display:block; margin-bottom:0.25rem;">Tu respuesta: <strong style="color:var(--accent-coral);">${item.user_answer.value === 0 ? 'No respondida' : 'Seleccionada'}</strong></span>
                            <span>Respuesta correcta: <strong style="color:var(--success-green);">${item.correct_answer.respuesta}</strong></span>
                        </div>
                    `;

                    feedbackDetailsList.appendChild(div);
                });
            }
        } catch (e) {
            feedbackDetailsList.innerHTML = '<p>Error al recuperar la retroalimentación.</p>';
        }
    }

    btnCloseFeedback.addEventListener('click', () => {
        feedbackOverlay.classList.add('hidden');
    });

    // 9. HOMEWORK TRACKING VIEW
    async function loadHomeworkTracking() {
        homeworkTrackingBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;">
                    <div class="spinner" style="width:25px; height:25px;"></div> Cargando registro de tareas...
                </td>
            </tr>
        `;

        if (!activeCourseId) {
            homeworkTrackingBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Por favor ingresa a un curso primero para visualizar el seguimiento.</td></tr>`;
            return;
        }

        try {
            const res = await window.sapiusAPI.apiGet(`/electron/homework-tracking/${activeCourseId}`);
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

                        row.querySelector(`#btn-go-hw-${clase.id}`).addEventListener('click', () => {
                            loadLessonDetails(clase.id, activeCourseId);
                        });

                        homeworkTrackingBody.appendChild(row);
                    });
                });
            }
        } catch (e) {
            homeworkTrackingBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--danger-red);">Error de conexión.</td></tr>`;
        }
    }

    // 10. CALENDAR VIEW
    async function loadCalendarView() {
        const container = document.getElementById('calendar-content');
        container.innerHTML = `<div class="spinner"></div>`;

        if (!activeCourseId) {
            container.innerHTML = `<p style="text-align:center;">Entra a un curso primero para cargar sus fechas y cronograma.</p>`;
            return;
        }

        try {
            const res = await window.sapiusAPI.apiGet(`/electron/course/${activeCourseId}`);
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
    }

    // LOGOUT
    logoutBtn.addEventListener('click', () => {
        window.sapiusAPI.logout();
    });
});
