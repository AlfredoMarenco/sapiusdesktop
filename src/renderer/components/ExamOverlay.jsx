import React, { useState, useEffect, useRef } from 'react';
import InteractiveTutorial from './InteractiveTutorial';

/**
 * Componente autocontenido que gestiona la sesión completa de un examen (Instrucciones -> Cuestionario -> Retroalimentación).
 * Integra la lógica anti-plagio (blur/hidden) y se conecta directamente con la API local expuesta por Electron.
 * 
 * @param {Object} props
 * @param {number} props.pruebaId - ID de la prueba/examen a presentar.
 * @param {number} props.inscripcionId - ID de inscripción activa del alumno.
 * @param {Function} props.onClose - Función para cerrar el examen/overlay.
 * @param {Function} props.onExamFinished - Función ejecutada al finalizar el examen para recargar datos y barras de progreso.
 */
export default function ExamOverlay({ pruebaId, inscripcionId, feedbackExamenId, serverUrl, onClose, onExamFinished }) {
  const [step, setStep] = useState(feedbackExamenId ? 'feedback' : 'instructions'); // instructions, presenting, feedback
  const [loading, setLoading] = useState(true);
  const [instructionsData, setInstructionsData] = useState(null);
  
  // Estados del Examen en curso
  const [examSession, setExamSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsAll, setQuestionsAll] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [answers, setAnswers] = useState({});
  const [timerDisplay, setTimerDisplay] = useState('00:00');
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Estados de retroalimentación final
  const [feedbackData, setFeedbackData] = useState(null);
  const [showExamTutorial, setShowExamTutorial] = useState(false);
  const [showFeedbackTutorial, setShowFeedbackTutorial] = useState(false);
  
  const timerRef = useRef(null);

  // 1. Cargar datos previos de la prueba (Instrucciones y oportunidades) o retroalimentación directa
  useEffect(() => {
    async function loadInitialData() {
      if (!window.sapiusAPI) return;
      setLoading(true);
      try {
        if (feedbackExamenId) {
          console.log(`[ExamOverlay] Direct feedback load for exam session ${feedbackExamenId}`);
          const fbRes = await window.sapiusAPI.apiGet(`/electron/exam/feedback/${feedbackExamenId}`);
          if (fbRes && fbRes.success) {
            setFeedbackData(fbRes.data);
            setStep('feedback-instructions');
          } else {
            alert('No se pudo cargar la retroalimentación: ' + (fbRes?.message || 'Error del servidor.'));
            onClose();
          }
        } else {
          console.log(`[ExamOverlay] Fetching previo for exam ${pruebaId}, inscripcion ${inscripcionId}`);
          const res = await window.sapiusAPI.apiGet(`/electron/exam/previo/${pruebaId}/${inscripcionId}`);
          console.log('[ExamOverlay] Previo response:', res);
          
          if (res && res.success) {
            setInstructionsData(res.data);
            if (res.data.oportunidades_restantes <= 0) {
              alert('Has agotado todas las oportunidades de intento para presentar este examen.');
              onClose();
            }
          } else {
            alert('No se pudo obtener información del examen: ' + (res?.message || 'Error desconocido del servidor.'));
            onClose();
          }
        }
      } catch (err) {
        console.error('[ExamOverlay] Error loading initial data:', err);
        alert('Error de conexión al cargar la información de la prueba.');
        onClose();
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [pruebaId, inscripcionId, feedbackExamenId]);

  // 2. Controladores anti-plagio (registro de strikes)
  useEffect(() => {
    if (step !== 'presenting' || !examSession) return;

    const logWindowExit = async () => {
      try {
        await window.sapiusAPI.apiPost('/electron/exam/eventos', {
          examen_id: examSession.id,
          observacion: 'El usuario desenfocó o salió de la ventana del examen',
          tecla: 'N/A',
          lugar: 'Electron Client Blur'
        });
        window.sapiusAPI.logToServer('Strike anti-plagio: El usuario desenfocó la ventana del examen.');
      } catch (e) {
        console.error(e);
      }
    };

    const logVisibilityChange = async () => {
      if (document.hidden) {
        try {
          await window.sapiusAPI.apiPost('/electron/exam/eventos', {
            examen_id: examSession.id,
            observacion: 'El usuario ocultó o minimizó la pantalla del examen',
            tecla: 'N/A',
            lugar: 'Electron Client Hidden'
          });
          window.sapiusAPI.logToServer('Strike anti-plagio: Pantalla oculta.');
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener('blur', logWindowExit);
    document.addEventListener('visibilitychange', logVisibilityChange);

    return () => {
      window.removeEventListener('blur', logWindowExit);
      document.removeEventListener('visibilitychange', logVisibilityChange);
    };
  }, [step, examSession]);

  // 3. Destruir temporizador al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 4. Iniciar el examen
  const handleStartExam = async () => {
    setLoading(true);
    const durationMinutes = instructionsData?.prueba?.duracion || 60;
    const totalSeconds = durationMinutes * 60;

    // Cargar primera página de preguntas (el servidor devuelve el examen con created_at)
    const examData = await loadPage(1);

    // Calcular tiempo restante basado en el created_at real del servidor
    let remainingSeconds = totalSeconds;
    if (examData?.created_at) {
      const createdAt = new Date(examData.created_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - createdAt) / 1000);
      remainingSeconds = Math.max(1, totalSeconds - elapsedSeconds);
      console.log(`[ExamOverlay] Transcurrido: ${elapsedSeconds}s | Restante: ${remainingSeconds}s de ${totalSeconds}s`);
    }

    setTimeRemaining(remainingSeconds);

    // Mostrar tiempo correcto de inmediato sin esperar el primer tick
    const initMins = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
    const initSecs = (remainingSeconds % 60).toString().padStart(2, '0');
    setTimerDisplay(`${initMins}:${initSecs}`);

    // Inicializar temporizador visual con el tiempo correcto
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinishExam(true);
          return 0;
        }
        const mins = Math.floor((prev - 1) / 60).toString().padStart(2, '0');
        const secs = ((prev - 1) % 60).toString().padStart(2, '0');
        setTimerDisplay(`${mins}:${secs}`);
        return prev - 1;
      });
    }, 1000);

    setStep('presenting');
  };


  // 5. Cargar página específica — retorna el objeto examen para cálculo de tiempo restante
  const loadPage = async (pageNumber) => {
    if (!window.sapiusAPI) return null;
    setLoading(true);

    const respuestasPayload = JSON.stringify(Object.keys(answers).map(key => ({
      name: key,
      value: answers[key]
    })));

    try {
      const res = await window.sapiusAPI.apiPost('/electron/exam/presentar', {
        prueba_id: pruebaId,
        inscripcion_id: inscripcionId,
        page: pageNumber,
        respuestas: respuestasPayload
      });

      console.log(`[ExamOverlay] Page ${pageNumber} load response:`, res);
      if (res && res.success) {
        const data = res.data;
        setExamSession(data.examen);
        setTotalPages(data.preguntas.last_page);
        setQuestions(data.preguntas.data);
        setQuestionsAll(data.preguntasAll);
        setCurrentPage(pageNumber);

        // Mapear respuestas previamente guardadas en el servidor
        if (data.respuestas_guardadas && data.respuestas_guardadas.length > 0) {
          const updatedAnswers = { ...answers };
          data.respuestas_guardadas.forEach(r => {
            if (r.name && updatedAnswers[r.name] === undefined) {
              updatedAnswers[r.name] = r.value;
            }
          });
          setAnswers(updatedAnswers);
        }

        return data.examen; // Retornar examen para calcular tiempo restante en handleStartExam
      } else {
        alert('No se pudo cargar las preguntas: ' + (res?.message || 'Error del servidor.'));
        return null;
      }
    } catch (err) {
      console.error('[ExamOverlay] Error loading page:', err);
      alert('Error de conexión al cargar la página.');
      return null;
    } finally {
      setLoading(false);
    }
  };


  // 6. Seleccionar opción
  const handleSelectOption = (preguntaId, opcionId) => {
    setAnswers(prev => ({ ...prev, [preguntaId]: opcionId }));
  };

  // 7. Finalizar Examen
  const handleFinishExam = async (isAuto = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);

    if (isAuto) {
      alert('¡El tiempo límite ha expirado! Tu examen será enviado automáticamente.');
    }

    const respuestasPayload = JSON.stringify(Object.keys(answers).map(key => ({
      name: key,
      value: answers[key]
    })));

    try {
      // Guardar respuestas finales
      await window.sapiusAPI.apiPost('/electron/exam/presentar', {
        prueba_id: pruebaId,
        inscripcion_id: inscripcionId,
        page: currentPage,
        respuestas: respuestasPayload
      });

      // Finalizar examen
      const res = await window.sapiusAPI.apiPost('/electron/exam/finalizar', {
        examen_id: examSession.id
      });

      if (res && res.success) {
        alert('Examen finalizado con éxito. Para ver la retroalimentación, presiona el botón "Ver retroalimentación" que ahora aparece en la sección de exámenes de la clase.');
        if (onExamFinished) await onExamFinished();
        onClose();
      } else {
        alert('No se pudo completar el cierre del examen: ' + (res?.message || 'Error del servidor.'));
        onClose();
      }
    } catch (err) {
      console.error('[ExamOverlay] Error finishing exam:', err);
      alert('Error de conexión al enviar tus respuestas finales.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // RENDERIZADO 1: Cargando datos
  if (loading && (step === 'instructions' || step === 'feedback')) {
    return (
      <div className="fixed top-0 left-0 w-screen h-screen bg-[#f8fafc]/95 dark:bg-[#050912]/95 z-[9999] flex justify-center items-center font-sans text-slate-100 dark:text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-200 dark:border-white/10 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Preparando examen seguro...</p>
        </div>
      </div>
    );
  }

  // RENDERIZADO 2: Paso de Instrucciones
  if (step === 'instructions' && instructionsData) {
    const { prueba, oportunidades_restantes } = instructionsData;
    return (
      <div className="fixed top-0 left-0 w-screen h-screen bg-slate-950/40 dark:bg-[#050912]/95 z-[9999] flex justify-center items-center p-4 backdrop-blur-md font-sans text-slate-100 dark:text-white">
        <div className="bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 sm:p-10 w-full max-w-[650px] flex flex-col gap-6 shadow-2xl">
          <header className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-white/5">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 dark:text-white">Instrucciones de Examen</h2>
            <button 
              onClick={onClose}
              className="bg-none border-none text-slate-400 dark:text-slate-455 text-base cursor-pointer hover:text-rose-500 transition-colors"
            >
              ✖
            </button>
          </header>
          <div className="text-center py-4 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {prueba?.titulo || 'Evaluación de Clase'}
            </h3>
            <div 
              className="exam-content text-xs text-slate-500 dark:text-slate-400 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: prueba?.descripcion || 'Esta prueba evalúa los contenidos asimilados en la clase.' }}
            />
            <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 text-left mt-2">
              <strong className="block text-rose-500 dark:text-rose-400 text-[11px] sm:text-xs mb-1">🔒 Sistema Anti-Plagio Activo</strong>
              <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                El examen corre bajo monitoreo. Cambiar de ventana, abrir herramientas de desarrollador o inactividad prolongada registrarán strikes directos a tu historial.
              </p>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2">
              Oportunidades restantes: <span className="text-blue-600 dark:text-blue-400">{oportunidades_restantes}</span> • Duración: <span className="text-blue-600 dark:text-blue-400">{prueba?.duracion || 60} minutos</span>
            </div>
          </div>
          <button 
            onClick={handleStartExam}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-[#ffffff] rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Comenzar Examen
          </button>
        </div>
      </div>
    );
  }

  // RENDERIZADO 3: Paso de Presentación de Preguntas
  if (step === 'presenting' && examSession) {
    return (
      <div className="fixed top-0 left-0 w-screen h-screen bg-slate-50 dark:bg-[#050912] z-[9999] overflow-y-auto p-4 sm:p-12 font-sans text-slate-100 dark:text-white">
        <div className="w-full max-w-[1240px] mx-auto flex flex-col gap-6 sm:gap-8">
          <header className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-5 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => {
                  const confirmed = window.confirm('⚠️ ¿Seguro que deseas salir del examen?\n\nEl tiempo seguirá corriendo en el servidor. Al volver a entrar, el cronómetro continuará exactamente desde donde lo dejaste.');
                  if (confirmed) {
                    onClose();
                  }
                }}
                className="flex-shrink-0 flex items-center gap-1.5 py-2 px-3 bg-slate-950 hover:bg-rose-500/10 dark:bg-white/[0.03] border border-border-main dark:border-white/10 hover:border-rose-500/30 text-slate-500 dark:text-slate-400 hover:text-rose-400 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200"
                title="Salir del examen"
              >
                <span>←</span>
                <span className="hidden sm:inline">Salir</span>
              </button>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold truncate text-slate-100 dark:text-white">{examSession.titulo || 'Evaluación de Clase'}</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Examen en Curso</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                id="btn-trigger-exam-tutorial"
                onClick={() => setShowExamTutorial(true)}
                className="py-2 px-3 bg-bg-slate-900 border border-border-main text-text-white rounded-xl text-xs font-bold cursor-pointer transition-all hover:bg-bg-slate-950 shadow-sm"
              >
                ❓ Tutorial
              </button>
              <div id="tutorial-timer" className="flex-shrink-0 text-xs sm:text-sm font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 py-2 px-4 rounded-full border border-rose-500/20 shadow-md shadow-rose-500/5 whitespace-nowrap">
                ⏱ <strong className="text-rose-500 dark:text-rose-400 ml-1 font-mono">{timerDisplay}</strong>
              </div>
            </div>
          </header>

          <div className="grid gap-6 sm:gap-10 grid-cols-1 lg:grid-cols-[3.2fr_1fr]">
            <div className="flex flex-col gap-5 sm:gap-6">
              <div id="tutorial-question-container" className="bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 sm:p-10 overflow-y-visible shadow-2xl relative">
                {loading && (
                  <div className="absolute inset-0 bg-white/40 dark:bg-slate-955/40 backdrop-blur-xs flex justify-center items-center z-10 rounded-3xl">
                    <div className="w-6 h-6 border-2 border-slate-200 dark:border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                )}
                
                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-450 uppercase tracking-wider block mb-4">
                  Página {currentPage} de {totalPages}
                </span>

                {questions.map((mainPreg) => (
                  <div key={mainPreg.id} className="flex flex-col gap-6 animate-fadeIn">
                    {mainPreg.grupo_preguntas && mainPreg.grupo_preguntas.map((preg) => {
                      const savedAnswerVal = answers[preg.id];
                      return (
                        <div key={preg.id} className="flex flex-col gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
                          {/* Contenedor de la pregunta con hover */}
                          <div className="group/question relative cursor-pointer select-none min-h-[50px] p-2 border border-dashed border-white/5 hover:border-transparent rounded-2xl transition-all duration-200">
                            {/* Texto e imágenes ocultos por defecto, visibles en hover */}
                            <div className="opacity-0 group-hover/question:opacity-100 transition-opacity duration-200">
                              <div className="exam-content text-sm sm:text-base font-bold text-slate-100 dark:text-slate-100" dangerouslySetInnerHTML={{ __html: preg.pregunta }} />
                              {preg.imagen && serverUrl && (
                                <div className="mt-2 text-center">
                                  <img
                                    src={`${serverUrl}/api/electron/pregunta-imagen/${preg.imagen}`}
                                    alt="Imagen de la pregunta"
                                    className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-white/10 inline-block"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                              )}
                            </div>
                            {/* Indicador visible por defecto, oculto en hover */}
                            <div className="absolute inset-0 flex items-center justify-start pl-3 text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-semibold group-hover/question:hidden pointer-events-none">
                              👁️ Pasa el mouse aquí para ver la pregunta
                            </div>
                          </div>
                          <div className="options-list flex flex-col gap-3">
                            {preg.respuestas && preg.respuestas.map((resp) => {
                              const isSelected = String(savedAnswerVal) === String(resp.id);
                              return (
                                <div 
                                  key={resp.id}
                                  onClick={() => handleSelectOption(preg.id, resp.id)}
                                  className={`flex items-start py-3.5 px-5 bg-slate-50 dark:bg-slate-950/20 border rounded-xl cursor-pointer transition-all duration-200 hover:border-blue-500/40 hover:bg-blue-500/5 ${isSelected ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10' : 'border-border-main'}`}
                                >
                                  <input 
                                    type="radio" 
                                    name={`q-${preg.id}`}
                                    checked={isSelected}
                                    onChange={() => handleSelectOption(preg.id, resp.id)}
                                    className="mr-4 mt-1 w-4 h-4 flex-shrink-0 accent-blue-500 cursor-pointer"
                                  />
                                  <div className="exam-content text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex-1" dangerouslySetInnerHTML={{ __html: resp.respuesta }} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                 <button 
                  disabled={currentPage === 1 || loading}
                  onClick={() => loadPage(currentPage - 1)}
                  className="py-2.5 px-6 bg-slate-950 dark:bg-white/[0.02] border border-border-main dark:border-white/10 text-slate-500 dark:text-slate-100 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-30 hover:bg-slate-950 dark:hover:bg-white/[0.05]"
                >
                  Anterior
                </button>
                {currentPage < totalPages ? (
                  <button 
                    disabled={loading}
                    onClick={() => loadPage(currentPage + 1)}
                    className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-[#ffffff] rounded-xl text-xs font-semibold cursor-pointer shadow-md disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button 
                    disabled={loading}
                    onClick={() => handleFinishExam(false)}
                    className="py-2.5 px-6 bg-rose-600 hover:bg-rose-500 text-[#ffffff] rounded-xl text-xs font-semibold cursor-pointer shadow-md disabled:opacity-50"
                  >
                    Finalizar Examen
                  </button>
                )}
              </div>
            </div>

            {/* Quick navigation panels */}
            <div id="tutorial-navigation-pane" className="bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col gap-4 self-start sticky top-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Navegación de Preguntas</h3>
              <div className="flex flex-wrap gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                {questionsAll.map((grupo, idx) => {
                  const isCurrent = idx + 1 === currentPage;
                  const subQuestions = grupo.grupo_preguntas || [];
                  const isAgrupado = subQuestions.length > 1;
                  const isGroupAnswered = subQuestions.every(subPreg => answers[subPreg.id] !== undefined);
                  
                  const containerBg = isGroupAnswered ? 'bg-[#002146] text-[#ffffff]' : 'bg-slate-950 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400';
                  const borderStyle = isCurrent ? 'border-2 border-[#ed6a5a]' : 'border border-border-main';

                  return (
                    <div 
                      key={idx}
                      onClick={() => !loading && loadPage(idx + 1)}
                      className={`recuadro-paginacion p-1.5 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 ${containerBg} ${borderStyle}`}
                      style={{ minWidth: isAgrupado ? `${40 * subQuestions.length}px` : '36px' }}
                    >
                      {subQuestions.map((subPreg, subIdx) => {
                        const isAnswered = answers[subPreg.id] !== undefined;
                        const squareBg = isAnswered ? 'bg-[#002146] text-[#ffffff]' : 'bg-slate-900 text-slate-500 dark:text-slate-400';
                        const label = isAgrupado ? `${idx + 1}.${subIdx + 1}` : `${idx + 1}`;
                        
                        return (
                          <span 
                            key={subPreg.id}
                            className={`inline-block text-center rounded-md font-bold text-[10px] w-7 h-7 leading-7 ${squareBg}`}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {showExamTutorial && (
          <InteractiveTutorial
            customSteps={[
              {
                selector: '#btn-trigger-exam-tutorial',
                title: '✍️ Modo Examen',
                description: 'Has iniciado tu evaluación. Sigue estas instrucciones para completarla con éxito.',
                placement: 'bottom'
              },
              {
                selector: '#tutorial-timer',
                title: '⏱ Tiempo Restante',
                description: 'Vigila tu cronómetro. Si el tiempo expira, tus respuestas se guardarán y enviarán automáticamente.',
                placement: 'bottom'
              },
              {
                selector: '#tutorial-question-container',
                title: '❓ Área de Pregunta',
                description: 'Aquí se muestra el enunciado del reactivo actual y sus opciones múltiples. Elige tu respuesta haciendo clic sobre ella.',
                placement: 'top'
              },
              {
                selector: '#tutorial-navigation-pane',
                title: '🗺️ Panel de Navegación',
                description: 'Te permite ver el listado de preguntas de la prueba, cuáles has respondido y saltar de forma directa entre ellas.',
                placement: 'top'
              }
            ]}
            activeTab="courses"
            onSelectTab={() => {}}
            onClose={() => setShowExamTutorial(false)}
          />
        )}
      </div>
    );
  }


  // RENDERIZADO 3.5: Paso de Indicaciones Previas a la Retroalimentación
  if (step === 'feedback-instructions' && feedbackData) {
    const { examen } = feedbackData;
    return (
      <div className="fixed top-0 left-0 w-screen h-screen bg-slate-950/40 dark:bg-[#050912]/95 z-[9999] flex justify-center items-center p-4 backdrop-blur-md font-sans text-slate-100 dark:text-white">
        <div className="bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 sm:p-10 w-full max-w-[650px] flex flex-col gap-6 shadow-2xl">
          <header className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-white/5">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 dark:text-white">Instrucciones de Retroalimentación</h2>
            <button 
              onClick={onClose}
              className="bg-none border-none text-slate-400 dark:text-slate-455 text-base cursor-pointer hover:text-rose-500 transition-colors"
            >
              ✖
            </button>
          </header>
          <div className="text-center py-4 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {examen?.Prueba?.titulo || 'Retroalimentación de Evaluación'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-justify">
              El uso de SAPIUS trae consigo aceptar los derechos de autor y propiedad intelectual de todo el contenido en el sitio. Mismos que se encuentran reservados y protegidos de conformidad con la Ley Federal de Derechos de Autor.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-justify">
              Está estrictamente prohibido copiar, replicar, tomar capturas de pantalla y grabaciones, así como el uso indebido del material. Será perseguido jurídicamente cualquier infractor a estas condiciones, junto con ello, se le negará el acceso permanente a la plataforma.
            </p>
            <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 text-left mt-2">
              <strong className="block text-rose-500 dark:text-rose-400 text-[11px] sm:text-xs mb-1">🔒 Sistema Anti-Plagio Activo</strong>
              <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                El monitoreo sigue activo durante la retroalimentación. Cualquier acción indebida o intento de captura de pantalla bloqueará de inmediato tu acceso. Las preguntas y respuestas se revelarán únicamente al posicionar el mouse sobre ellas.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setStep('feedback')}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-[#ffffff] rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Ver Retroalimentación
          </button>
        </div>
      </div>
    );
  }

  // RENDERIZADO 4: Paso de Retroalimentación final
  if (step === 'feedback' && feedbackData) {
    const { examen, feedback: rawFeedback } = feedbackData;
    
    // Transformar los datos de retroalimentación del backend al formato plano que espera la vista
    const feedback = (rawFeedback || []).map(fb => {
      const pregunta = fb.correct_answer?.pregunta;
      if (!pregunta) return null;
      
      const isCorrect = fb.user_answer && String(fb.user_answer.value) === String(fb.correct_answer.id);
      const sinResponder = !fb.user_answer || fb.user_answer.value === 0 || fb.user_answer.value === '0';
      
      const opciones = (pregunta.respuestas || []).map(resp => ({
        id: resp.id,
        respuesta: resp.respuesta,
        is_correct: resp.correcto === 1,
        is_selected: fb.user_answer && String(fb.user_answer.value) === String(resp.id)
      }));
      
      return {
        pregunta_id: pregunta.id,
        pregunta_html: pregunta.pregunta,
        pregunta_imagen: pregunta.imagen,
        justificacion_html: pregunta.opciones, // En Sapius el campo 'opciones' de la pregunta contiene la justificación
        is_correct: isCorrect,
        sin_responder: sinResponder,
        opciones: opciones
      };
    }).filter(Boolean);

    const totalPreguntas = feedback?.length || 0;
    const totalCorrectas = feedback?.filter(f => f.is_correct).length || 0;
    const scoreTotal = examen?.score_total ?? (totalPreguntas > 0 ? ((totalCorrectas / totalPreguntas) * 10).toFixed(1) : 0);

    return (
      <div className="fixed top-0 left-0 w-screen h-screen bg-bg-slate-950 z-[9999] overflow-y-auto font-sans text-text-white">
        <div className="w-full max-w-[1100px] mx-auto flex flex-col gap-6 p-4 sm:p-10 pb-20">

          {/* Header */}
          <header className="flex justify-between items-center border-b border-border-main pb-5 gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-text-white">Retroalimentación del Examen</h2>
              <span className="text-xs text-text-muted font-medium">{examen?.Prueba?.titulo || 'Evaluación de Clase'}</span>
            </div>
            <div className="flex gap-2.5">
              <button
                id="btn-trigger-feedback-tutorial"
                onClick={() => setShowFeedbackTutorial(true)}
                className="flex items-center gap-2 py-2 px-3 bg-bg-slate-900 border border-border-main text-text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
              >
                ❓ Tutorial
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-[#ffffff] rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                ← Volver al curso
              </button>
            </div>
          </header>

          {/* Resumen de calificación */}
          <div id="tutorial-feedback-score-grid" className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="border border-border-main p-4 rounded-2xl text-center bg-bg-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">Correctas</span>
              <strong className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalCorrectas}</strong>
              <span className="text-text-muted text-sm"> / {totalPreguntas}</span>
            </div>
            <div className="border border-border-main p-4 rounded-2xl text-center bg-bg-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">Incorrectas</span>
              <strong className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{totalPreguntas - totalCorrectas}</strong>
            </div>
            <div className="border border-border-main p-4 rounded-2xl text-center bg-bg-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">Calificación</span>
              <strong className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{scoreTotal} / 10</strong>
            </div>
          </div>

          {/* Leyenda de colores */}
          <div className="flex gap-4 text-xs font-semibold flex-wrap text-text-white">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Respuesta correcta</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Tu respuesta incorrecta</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-600 inline-block"></span> Sin seleccionar</span>
          </div>

          {/* Lista de preguntas con retroalimentación */}
          <div className="flex flex-col gap-6">
            {feedback && feedback.map((item, idx) => (
              <div
                key={item.pregunta_id || idx}
                id={idx === 0 ? "tutorial-feedback-first-card" : undefined}
                className={`rounded-2xl border overflow-hidden transition-all duration-200 group/feedback-card ${item.is_correct ? 'border-emerald-500/20' : item.sin_responder ? 'border-border-main' : 'border-rose-500/20'}`}
              >
                {/* Cabecera de la pregunta */}
                <div className={`flex items-center gap-3 px-5 py-3 ${item.is_correct ? 'bg-emerald-500/10' : item.sin_responder ? 'bg-bg-slate-900' : 'bg-rose-500/10'}`}>
                  <span className="text-lg flex-shrink-0">{item.is_correct ? '✅' : item.sin_responder ? '⬜' : '❌'}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Pregunta {idx + 1}</span>
                  <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${item.is_correct ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : item.sin_responder ? 'bg-bg-slate-800 text-text-muted' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                    {item.is_correct ? 'Correcta' : item.sin_responder ? 'Sin responder' : 'Incorrecta'}
                  </span>
                </div>

                <div className="p-5 sm:p-6 flex flex-col gap-4 bg-bg-slate-900 relative min-h-[100px] justify-center">
                  {/* Contenedor de contenido oculto por defecto, visible en hover */}
                  <div className="opacity-0 group-hover/feedback-card:opacity-100 transition-opacity duration-200 flex flex-col gap-4 w-full">
                    {/* Enunciado HTML */}
                    <div className="exam-content text-sm sm:text-base font-semibold text-text-white" dangerouslySetInnerHTML={{ __html: item.pregunta_html }} />

                    {/* Imagen adjunta de la pregunta */}
                    {item.pregunta_imagen && serverUrl && (
                      <div className="text-center">
                        <img
                          src={`${serverUrl}/api/electron/pregunta-imagen/${item.pregunta_imagen}`}
                          alt="Imagen de la pregunta"
                          className="max-w-full h-auto rounded-lg border border-border-main inline-block"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {/* Opciones con colores */}
                    <div className="flex flex-col gap-2">
                      {item.opciones && item.opciones.map((opcion) => {
                        let optionClass = 'border-border-main bg-bg-slate-950 text-text-muted';
                        if (opcion.is_correct) {
                          optionClass = 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
                        } else if (opcion.is_selected && !opcion.is_correct) {
                          optionClass = 'border-rose-500/50 bg-rose-500/5 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300';
                        }
                        return (
                          <div key={opcion.id} className={`flex items-start gap-3 py-3 px-4 border rounded-xl ${optionClass}`}>
                            <span className="flex-shrink-0 mt-0.5 text-base">
                              {opcion.is_correct ? '✔' : opcion.is_selected ? '✘' : '○'}
                            </span>
                            <div className="exam-content text-xs sm:text-sm flex-1 font-semibold" dangerouslySetInnerHTML={{ __html: opcion.respuesta }} />
                          </div>
                        );
                      })}
                    </div>

                    {/* Justificación didáctica */}
                    {item.justificacion_html && (
                      <div className="mt-2 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-2">📖 Justificación</span>
                        <div className="exam-content text-xs text-text-white leading-relaxed font-semibold" dangerouslySetInnerHTML={{ __html: item.justificacion_html }} />
                      </div>
                    )}
                  </div>

                  {/* Indicador visible por defecto, oculto en hover */}
                  <div className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-semibold group-hover/feedback-card:hidden pointer-events-none bg-bg-slate-900 rounded-b-2xl">
                    👁️ Pasa el mouse aquí para ver la pregunta y retroalimentación
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botón final */}
          <div className="text-center pt-4">
            <button
              onClick={onClose}
              className="py-3 px-8 bg-blue-600 hover:bg-blue-500 text-[#ffffff] rounded-xl text-sm font-bold cursor-pointer transition-all shadow-lg"
            >
              ✓ Finalizar y volver al curso
            </button>
          </div>

        {showFeedbackTutorial && (
          <InteractiveTutorial
            customSteps={[
              {
                selector: '#btn-trigger-feedback-tutorial',
                title: '📖 Retroalimentación del Examen',
                description: 'En esta sección podrás revisar tus respuestas y analizar en detalle los errores cometidos.',
                placement: 'bottom'
              },
              {
                selector: '#tutorial-feedback-score-grid',
                title: '📊 Resumen de Calificación',
                description: 'Revisa de manera rápida la cantidad de reactivos correctos, incorrectos y tu calificación final sobre 10.',
                placement: 'bottom'
              },
              {
                selector: '#tutorial-feedback-first-card',
                title: '❓ Análisis de Preguntas',
                description: 'Las respuestas correctas aparecen resaltadas en color VERDE, mientras que los fallos cometidos se destacan en color ROJO.',
                placement: 'top'
              }
            ]}
            activeTab="courses"
            onSelectTab={() => {}}
            onClose={() => setShowFeedbackTutorial(false)}
          />
        )}
        </div>
      </div>
    );
  }

  return null;
}
