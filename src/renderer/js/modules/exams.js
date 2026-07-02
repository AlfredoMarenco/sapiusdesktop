import { apiGet, apiPost, logToServer } from './api.js';

export let currentPruebaId = null;
export let currentExamId = null;
export let examAnswers = {};
export let examCurrentPage = 1;
export let examTotalPages = 1;
export let examTimeLimitSeconds = 0;
export let examTimerInterval = null;

export async function launchStrictExam(pruebaId, inscripcionId) {
    const examOverlay = document.getElementById('exam-overlay');
    const questionCard = document.getElementById('question-card');
    
    currentPruebaId = pruebaId;
    examOverlay.classList.remove('hidden');
    questionCard.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Preparando examen seguro...</p>
        </div>
    `;

    try {
        const prevRes = await apiGet(`/electron/exam/previo/${pruebaId}/${inscripcionId}`);
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
    const examTimer = document.getElementById('exam-timer');
    const mins = Math.floor(examTimeLimitSeconds / 60).toString().padStart(2, '0');
    const secs = (examTimeLimitSeconds % 60).toString().padStart(2, '0');
    if (examTimer) {
        examTimer.innerText = `${mins}:${secs}`;
    }
}

async function loadExamPage(pruebaId, inscripcionId) {
    const questionCard = document.getElementById('question-card');
    const btnExamPrev = document.getElementById('btn-exam-prev');
    const btnExamNext = document.getElementById('btn-exam-next');
    const btnExamFinish = document.getElementById('btn-exam-finish');
    
    questionCard.innerHTML = `<div class="spinner"></div>`;

    const respuestasPayload = JSON.stringify(Object.keys(examAnswers).map(key => ({
        name: key,
        value: examAnswers[key]
    })));

    try {
        const res = await apiPost('/electron/exam/presentar', {
            prueba_id: pruebaId,
            inscripcion_id: inscripcionId,
            page: examCurrentPage,
            respuestas: respuestasPayload
        });

        if (res && res.success) {
            const data = res.data;
            currentExamId = data.examen.id;
            
            if (data.respuestas_guardadas && data.respuestas_guardadas.length > 0) {
                data.respuestas_guardadas.forEach(r => {
                    if (r.name && examAnswers[r.name] === undefined) {
                        examAnswers[r.name] = r.value;
                    }
                });
            }

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

                    const radios = pregDiv.querySelectorAll('input[type="radio"]');
                    radios.forEach(radio => {
                        radio.addEventListener('change', (e) => {
                            examAnswers[preg.id] = e.target.value;
                            updateExamNavGrid(data.preguntasAll, inscripcionId);
                        });
                    });

                    questionCard.appendChild(pregDiv);
                });
            } else {
                questionCard.innerHTML = '<p>No se encontraron preguntas en esta página.</p>';
            }

            btnExamPrev.disabled = examCurrentPage === 1;
            
            if (examCurrentPage === examTotalPages) {
                btnExamNext.classList.add('hidden');
                btnExamFinish.classList.remove('hidden');
            } else {
                btnExamNext.classList.remove('hidden');
                btnExamFinish.classList.add('hidden');
            }

            updateExamNavGrid(data.preguntasAll, inscripcionId);
        }
    } catch (e) {
        logToServer(`Error al cargar página de examen: ${e.message}`, 'ERROR');
    }
}

function updateExamNavGrid(preguntasAll, inscripcionId) {
    const questionsStatusGrid = document.getElementById('questions-status-grid');
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
            loadExamPage(currentPruebaId, inscripcionId);
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

export function initExamControls(inscripcionIdGetter) {
    const btnExamPrev = document.getElementById('btn-exam-prev');
    const btnExamNext = document.getElementById('btn-exam-next');
    const btnExamFinish = document.getElementById('btn-exam-finish');
    const btnCloseFeedback = document.getElementById('btn-close-feedback');

    if (btnExamPrev) {
        btnExamPrev.addEventListener('click', () => {
            if (examCurrentPage > 1) {
                examCurrentPage--;
                loadExamPage(currentPruebaId, inscripcionIdGetter());
            }
        });
    }

    if (btnExamNext) {
        btnExamNext.addEventListener('click', () => {
            if (examCurrentPage < examTotalPages) {
                examCurrentPage++;
                loadExamPage(currentPruebaId, inscripcionIdGetter());
            }
        });
    }

    if (btnExamFinish) {
        btnExamFinish.addEventListener('click', () => {
            finishExamSession(inscripcionIdGetter());
        });
    }

    if (btnCloseFeedback) {
        btnCloseFeedback.addEventListener('click', () => {
            document.getElementById('feedback-overlay').classList.add('hidden');
        });
    }
}

async function finishExamSession(inscripcionId) {
    clearInterval(examTimerInterval);
    removePlagiarismListeners();

    const respuestasPayload = JSON.stringify(Object.keys(examAnswers).map(key => ({
        name: key,
        value: examAnswers[key]
    })));

    try {
        await apiPost('/electron/exam/presentar', {
            prueba_id: currentPruebaId,
            inscripcion_id: inscripcionId,
            page: examCurrentPage,
            respuestas: respuestasPayload
        });

        const finRes = await apiPost('/electron/exam/finalizar', {
            examen_id: currentExamId
        });

        if (finRes && finRes.success) {
            document.getElementById('exam-overlay').classList.add('hidden');
            showFeedbackModal(currentExamId);
            
            // Recargar detalles del curso para refrescar el progreso
            import('./courses.js').then(coursesMod => {
                coursesMod.loadCourseDetails(coursesMod.activeCourseId);
            });
        }
    } catch (e) {
        document.getElementById('exam-overlay').classList.add('hidden');
    }
}

function setupPlagiarismListeners() {
    window.addEventListener('blur', logWindowExit);
    document.addEventListener('visibilitychange', logVisibilityChange);
}

function removePlagiarismListeners() {
    window.removeEventListener('blur', logWindowExit);
    document.removeEventListener('visibilitychange', logVisibilityChange);
}

async function logWindowExit() {
    await apiPost('/electron/exam/eventos', {
        examen_id: currentExamId,
        observacion: 'El usuario desenfocó o salió de la ventana del examen',
        tecla: 'N/A',
        lugar: 'Electron Client Blur'
    });
    logToServer('Strike anti-plagio: El usuario desenfocó la ventana del examen.');
}

async function logVisibilityChange() {
    if (document.hidden) {
        await apiPost('/electron/exam/eventos', {
            examen_id: currentExamId,
            observacion: 'El usuario ocultó o minimizó la pantalla del examen',
            tecla: 'N/A',
            lugar: 'Electron Client Hidden'
        });
        logToServer('Strike anti-plagio: Pantalla oculta.');
    }
}

async function showFeedbackModal(examenId) {
    const feedbackOverlay = document.getElementById('feedback-overlay');
    const feedbackDetailsList = document.getElementById('feedback-details-list');
    const fbCorrectas = document.getElementById('fb-correctas');
    const fbPuntaje = document.getElementById('fb-puntaje');

    feedbackOverlay.classList.remove('hidden');
    feedbackDetailsList.innerHTML = `<div class="spinner"></div>`;

    try {
        const res = await apiGet(`/electron/exam/feedback/${examenId}`);
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
        feedbackDetailsList.innerHTML = '<p class="status error">Error cargando retroalimentación.</p>';
    }
}
