import { apiGet, apiPost, getBaseUrl, logToServer } from './api.js';
import { launchStrictExam } from './exams.js';

export let activeLessonId = null;

let pdfDoc = null;
let pdfPageNum = 1;
let pdfPageRendering = false;
let pdfPageNumPending = null;
let pdfScale = 1.2;

export function closeActiveLesson() {
    const secureVideo = document.getElementById('secure-video');
    if (secureVideo) {
        secureVideo.pause();
        secureVideo.src = "";
    }
    const welcomePane = document.getElementById('lesson-welcome-pane');
    const workspacePane = document.getElementById('lesson-workspace-pane');
    if (welcomePane) welcomePane.classList.remove('hidden');
    if (workspacePane) workspacePane.classList.add('hidden');
    document.getElementById('view-title').innerText = "Temario del Curso";
}

export async function loadLessonDetails(leccionId, cpId) {
    activeLessonId = leccionId;
    
    const welcomePane = document.getElementById('lesson-welcome-pane');
    const workspacePane = document.getElementById('lesson-workspace-pane');
    if (welcomePane) welcomePane.classList.add('hidden');
    if (workspacePane) workspacePane.classList.remove('hidden');
    
    const videoContainer = document.getElementById('video-container');
    const pdfContainer = document.getElementById('pdf-container');
    const secureVideo = document.getElementById('secure-video');
    const pruebasList = document.getElementById('pruebas-list');
    const homeworkStatusContainer = document.getElementById('homework-status-container');
    const formHomework = document.getElementById('form-homework');
    const lessonTitle = document.getElementById('lesson-title');
    const lessonDescription = document.getElementById('lesson-description');

    // Reiniciar reproductores y vistas
    if (secureVideo) {
        secureVideo.pause();
        secureVideo.src = "";
    }
    videoContainer.classList.add('hidden');
    pdfContainer.classList.add('hidden');
    pruebasList.innerHTML = '';
    homeworkStatusContainer.innerHTML = '';
    formHomework.reset();
    clearFileInfo();

    if (leccionId === 0) {
        lessonTitle.innerText = "Guía de Estudio Protegida";
        lessonDescription.innerHTML = "<p>Visualiza el material interactivo completo a continuación. Recuerda que la impresión y copia de este archivo están completamente restringidas por derechos de propiedad intelectual.</p>";
        loadSecurePDF(0, cpId);
        return;
    }

    try {
        const res = await apiGet(`/electron/lesson/${leccionId}/${cpId}`);
        if (res && res.success) {
            const data = res.data;
            const leccion = data.leccion;

            lessonTitle.innerText = leccion.titulo;
            lessonDescription.innerHTML = leccion.contenido || '<p>No hay descripción adicional para esta clase.</p>';

            // Completado checkbox
            const chkLessonCompleted = document.getElementById('chk-lesson-completed');
            if (chkLessonCompleted) {
                chkLessonCompleted.checked = data.completedLessons.includes(leccion.id);
                chkLessonCompleted.onchange = async () => {
                    const toggleRes = await apiPost('/electron/lecciones/toggle-completion', {
                        leccion_id: leccion.id,
                        curso_programado_id: cpId
                    });
                    if (toggleRes && toggleRes.success) {
                        logToServer(`Clase ${leccion.id} marcada/desmarcada.`);
                    }
                };
            }

            // Reproductor de video
            const videoUrlText = document.getElementById('video-url-text');
            if (data.video || data.videoext) {
                videoContainer.classList.remove('hidden');
                if (data.video) {
                    const baseUrl = await getBaseUrl();
                    const fullUrl = `${baseUrl}/alumno/medias/stream/${data.video.ruta}`;
                    secureVideo.src = fullUrl;
                    if (videoUrlText) videoUrlText.textContent = fullUrl;
                } else if (data.videoext) {
                    secureVideo.src = data.videoext.ruta;
                    if (videoUrlText) videoUrlText.textContent = data.videoext.ruta;
                }
            }

            // Visor PDF
            if (leccion.archivo_pdf) {
                loadSecurePDF(leccion.id, cpId);
            }

            // Exámenes
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

            // Tareas
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
        }
    } catch (e) {
        logToServer(`Error cargando leccion: ${e.message}`, 'ERROR');
    }
}

export async function loadSecurePDF(leccionId, cpId) {
    const pdfContainer = document.getElementById('pdf-container');
    const pdfCanvas = document.getElementById('pdf-canvas');
    if (!pdfContainer || !pdfCanvas) return;

    pdfContainer.classList.remove('hidden');
    pdfDoc = null;
    pdfPageNum = 1;
    pdfPageRendering = false;
    pdfPageNumPending = null;

    const baseUrl = await getBaseUrl();
    const pdfUrl = leccionId === 0 
        ? `${baseUrl}/api/electron/pdf/0?curso_programado_id=${cpId}`
        : `${baseUrl}/api/electron/pdf/${leccionId}`;

    try {
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error("Error fetching secure PDF");
        const data = await response.arrayBuffer();

        pdfjsLib.getDocument({ data: data }).promise.then((pdfDoc_) => {
            pdfDoc = pdfDoc_;
            document.getElementById('pdf-page-count').textContent = pdfDoc.numPages;
            renderPdfPage(pdfPageNum);
        });
    } catch (e) {
        logToServer(`Error al renderizar PDF seguro: ${e.message}`, 'ERROR');
        pdfContainer.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--danger-red);">Error al descargar o desencriptar PDF protegido.</div>';
    }
}

function renderPdfPage(num, animateIn = false) {
    const pdfCanvas = document.getElementById('pdf-canvas');
    if (!pdfCanvas) return;
    const pdfCtx = pdfCanvas.getContext('2d');
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
            
            if (animateIn) {
                // Configurar para slide-in
                pdfCanvas.classList.remove('pdf-slide-out');
                pdfCanvas.classList.add('pdf-slide-in');
                
                // Forzar reflujo
                pdfCanvas.offsetHeight;
                
                // Remover slide-in para hacer la animación de entrada
                pdfCanvas.classList.remove('pdf-slide-in');
            } else {
                pdfCanvas.classList.remove('pdf-slide-out');
                pdfCanvas.classList.remove('pdf-slide-in');
            }

            if (pdfPageNumPending !== null) {
                renderPdfPage(pdfPageNumPending, true);
                pdfPageNumPending = null;
            }
        });
    });

    document.getElementById('pdf-page-num').textContent = num;
}

function queueRenderPage(num) {
    const pdfCanvas = document.getElementById('pdf-canvas');
    if (!pdfCanvas) {
        if (pdfPageRendering) {
            pdfPageNumPending = num;
        } else {
            renderPdfPage(num);
        }
        return;
    }

    // Aplicar clase slide-out para animación de salida
    pdfCanvas.classList.add('pdf-slide-out');
    
    // Esperar a que termine la transición slide-out (150ms)
    setTimeout(() => {
        if (pdfPageRendering) {
            pdfPageNumPending = num;
        } else {
            renderPdfPage(num, true); // true = animar entrada
        }
    }, 150);
}

export function initPdfControls() {
    const prevBtn = document.getElementById('pdf-prev');
    const nextBtn = document.getElementById('pdf-next');
    const zoomInBtn = document.getElementById('pdf-zoom-in');
    const zoomOutBtn = document.getElementById('pdf-zoom-out');
    const fullscreenBtn = document.getElementById('pdf-fullscreen');
    const pdfContainer = document.getElementById('pdf-container');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (pdfPageNum <= 1) return;
            pdfPageNum--;
            queueRenderPage(pdfPageNum);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (pdfPageNum >= pdfDoc.numPages) return;
            pdfPageNum++;
            queueRenderPage(pdfPageNum);
        });
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            if (pdfScale >= 3.0) return;
            pdfScale += 0.25;
            if (pdfDoc) renderPdfPage(pdfPageNum);
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            if (pdfScale <= 0.5) return;
            pdfScale -= 0.25;
            if (pdfDoc) renderPdfPage(pdfPageNum);
        });
    }

    if (fullscreenBtn && pdfContainer) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                pdfContainer.requestFullscreen().catch(err => {
                    console.error("Error al entrar a pantalla completa:", err);
                });
                fullscreenBtn.textContent = '📺 Normal';
            } else {
                document.exitFullscreen();
                fullscreenBtn.textContent = '📺 Maximizar';
            }
        });

        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement === pdfContainer) {
                fullscreenBtn.textContent = '📺 Normal';
            } else {
                fullscreenBtn.textContent = '📺 Maximizar';
            }
        });
    }
}

export function initHomeworkDropZone() {
    const fileDropZone = document.getElementById('file-drop-zone');
    const homeworkFileInput = document.getElementById('homework-file');
    const formHomework = document.getElementById('form-homework');
    const btnRemoveFile = document.getElementById('btn-remove-file');

    if (!fileDropZone || !homeworkFileInput) return;

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

    if (btnRemoveFile) {
        btnRemoveFile.addEventListener('click', () => clearFileInfo());
    }

    if (formHomework) {
        formHomework.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = homeworkFileInput.files[0];
            if (!file) return;

            const homeworkStatusContainer = document.getElementById('homework-status-container');
            const homeworkText = document.getElementById('homework-text');
            const formData = new FormData();
            formData.append('documento', file);
            formData.append('leccion_id', activeLessonId);
            import('./courses.js').then(async (coursesMod) => {
                formData.append('curso_programado_id', coursesMod.activeCourseId);
                formData.append('tarea', homeworkText.value.trim() || 'Entregado desde Sapius Desktop');

                homeworkStatusContainer.innerHTML = `<div class="spinner" style="width: 25px; height: 25px;"></div> Subiendo tarea...`;
                formHomework.classList.add('hidden');

                try {
                    const baseUrl = await getBaseUrl();
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
        });
    }
}

function handleHomeworkFileSelect(file) {
    const fileDropZone = document.getElementById('file-drop-zone');
    const fileInfo = document.getElementById('file-info');
    const fileNameText = document.getElementById('file-name-text');
    if (fileNameText) {
        fileNameText.innerText = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
    }
    fileDropZone.classList.add('hidden');
    fileInfo.classList.remove('hidden');
}

function clearFileInfo() {
    const fileDropZone = document.getElementById('file-drop-zone');
    const fileInfo = document.getElementById('file-info');
    const homeworkFileInput = document.getElementById('homework-file');
    if (homeworkFileInput) homeworkFileInput.value = '';
    if (fileInfo) fileInfo.classList.add('hidden');
    if (fileDropZone) fileDropZone.classList.remove('hidden');
}
