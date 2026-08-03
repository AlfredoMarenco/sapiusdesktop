import React, { useState } from 'react';
import InteractiveTutorial from './InteractiveTutorial';

/**
 * Componente que muestra el espacio de trabajo del curso, incluyendo el temario en la parte inferior,
 * reproductor de video, visor de PDF, estado de completado y entrega de tareas.
 * 
 * @param {Object} props
 * @param {Object} props.selectedCourse - Datos del curso seleccionado.
 * @param {boolean} props.loadingSyllabus - Indicador de carga del temario.
 * @param {Object} props.activeLesson - Datos de la lección activa actual.
 * @param {number} props.activeLessonId - ID de la lección activa.
 * @param {boolean} props.loadingLesson - Indicador de carga de la lección.
 * @param {boolean} props.lessonCompleted - Si la lección está completada.
 * @param {Object} props.homeworkStatus - Estado de la entrega de tarea de la lección.
 * @param {boolean} props.submittingHomework - Si se está subiendo una tarea.
 * @param {string} props.homeworkText - Comentario de la tarea.
 * @param {Object} props.uploadedFile - Archivo seleccionado para subir.
 * @param {Object} props.expandedModules - Módulos del acordeón expandidos.
 * @param {string} props.serverUrl - URL base del servidor activo para resolver streaming de videos.
 * @param {Function} props.onBackToCourses - Regresar a la lista de cursos.
 * @param {Function} props.onCloseLesson - Cerrar la lección activa.
 * @param {Function} props.onSelectLesson - Seleccionar una clase del acordeón.
 * @param {Function} props.onToggleCompletion - Cambiar estado de completado de la clase.
 * @param {Function} props.onFileChange - Seleccionar archivo de tarea.
 * @param {Function} props.onHomeworkSubmit - Enviar formulario de tarea.
 * @param {Function} props.onToggleModule - Alternar estado del acordeón de un módulo.
 * @param {Function} props.onLaunchExam - Abrir overlay del examen.
 * @param {React.RefObject} props.canvasRef - Ref del canvas para PDF.js.
 * @param {number} props.pdfPageNum - Página actual del PDF.
 * @param {number} props.pdfPageCount - Total de páginas del PDF.
 * @param {Function} props.onPrevPdfPage - Ir a la página anterior del PDF.
 * @param {Function} props.onNextPdfPage - Ir a la página siguiente del PDF.
 */
export default function CourseDetail({
  selectedCourse,
  loadingSyllabus,
  activeLesson,
  activeLessonId,
  loadingLesson,
  lessonCompleted,
  homeworkStatus,
  submittingHomework,
  homeworkText,
  uploadedFile,
  expandedModules,
  serverUrl,
  onBackToCourses,
  onCloseLesson,
  onSelectLesson,
  onToggleCompletion,
  onFileChange,
  onHomeworkSubmit,
  onToggleModule,
  onLaunchExam,
  canvasRef,
  pdfPageNum,
  pdfPageCount,
  onPrevPdfPage,
  onNextPdfPage,
  pdfDoc,
  onGoToPdfPage,
  onLaunchInteractivePdf,
  onDownloadInteractivePdfRaw
}) {
  const [opinionPending, setOpinionPending] = React.useState(false);
  const [opinionSubmitting, setOpinionSubmitting] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');
  const [opinionMsg, setOpinionMsg] = React.useState('');

  const [pdfOutline, setPdfOutline] = React.useState([]);
  const [showOutline, setShowOutline] = React.useState(false);
  const [showLessonTutorial, setShowLessonTutorial] = useState(false);

  React.useEffect(() => {
    if (selectedCourse && selectedCourse.globalProgress >= 90) {
      checkOpinion();
    }
  }, [selectedCourse]);

  React.useEffect(() => {
    if (pdfDoc) {
      pdfDoc.getOutline().then((outline) => {
        setPdfOutline(outline || []);
      }).catch(err => {
        console.error("Error loading PDF outline:", err);
        setPdfOutline([]);
      });
    } else {
      setPdfOutline([]);
      setShowOutline(false);
    }
  }, [pdfDoc]);

  const [animatingClass, setAnimatingClass] = React.useState('');
  const [twoPagesMode, setTwoPagesMode] = React.useState(false);
  const [pdfScaleLocal, setPdfScaleLocal] = React.useState(1.35);

  const canvasLeftRef = React.useRef(null);
  const canvasRightRef = React.useRef(null);
  const viewerContainerRef = React.useRef(null);
  
  const pdfRenderTaskLeft = React.useRef(null);
  const pdfRenderTaskRight = React.useRef(null);

  const renderPageOnCanvas = async (pageNum, canvasElement, renderTaskRef) => {
    if (!pdfDoc || !canvasElement) return;
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: pdfScaleLocal });
      const context = canvasElement.getContext('2d');
      canvasElement.height = viewport.height;
      canvasElement.width = viewport.width;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error("Render error page " + pageNum, err);
      }
    }
  };

  React.useEffect(() => {
    if (pdfDoc) {
      renderPageOnCanvas(pdfPageNum, canvasLeftRef.current, pdfRenderTaskLeft);
      
      if (twoPagesMode && pdfPageNum + 1 <= pdfPageCount) {
        renderPageOnCanvas(pdfPageNum + 1, canvasRightRef.current, pdfRenderTaskRight);
      }
    }
  }, [pdfDoc, pdfPageNum, pdfScaleLocal, twoPagesMode]);

  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen()
        .then(() => {
          setTimeout(fitToWidth, 200);
        })
        .catch((err) => {
          console.error("Error going fullscreen:", err);
        });
    } else {
      document.exitFullscreen();
    }
  };

  const fitToWidth = async () => {
    if (!pdfDoc || !viewerContainerRef.current) return;
    try {
      const page = await pdfDoc.getPage(pdfPageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const container = viewerContainerRef.current.querySelector('.pdf-scroll-area');
      if (!container) return;
      const containerWidth = container.clientWidth - 48;
      const targetWidth = twoPagesMode ? (containerWidth / 2) - 24 : containerWidth;
      const targetScale = targetWidth / viewport.width;
      setPdfScaleLocal(Number(targetScale.toFixed(2)));
    } catch (err) {
      console.error("Error fitting to width:", err);
    }
  };

  React.useEffect(() => {
    if (pdfDoc && isGuiasCategory) {
      setTimeout(() => {
        if (viewerContainerRef.current && !document.fullscreenElement) {
          viewerContainerRef.current.requestFullscreen()
            .then(() => {
              setTimeout(fitToWidth, 300);
            })
            .catch(err => {
              console.warn("Auto-fullscreen blocked, fitting width locally", err);
              fitToWidth();
            });
        } else {
          fitToWidth();
        }
      }, 800);
    }
  }, [pdfDoc, twoPagesMode]);

  const playPageFlipSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const bufferSize = ctx.sampleRate * 0.35;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 1.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {
      console.warn("Audio context not allowed", e);
    }
  };

  const triggerNextPage = () => {
    if (pdfPageNum >= pdfPageCount || animatingClass) return;
    playPageFlipSound();
    setAnimatingClass('pdf-page-flip-next');
    setTimeout(() => {
      const step = twoPagesMode ? 2 : 1;
      const nextPage = Math.min(pdfPageNum + step, pdfPageCount);
      onGoToPdfPage(nextPage);
      setAnimatingClass('');
    }, 380);
  };

  const triggerPrevPage = () => {
    if (pdfPageNum <= 1 || animatingClass) return;
    playPageFlipSound();
    setAnimatingClass('pdf-page-flip-prev');
    setTimeout(() => {
      const step = twoPagesMode ? 2 : 1;
      const prevPage = Math.max(pdfPageNum - step, 1);
      onGoToPdfPage(prevPage);
      setAnimatingClass('');
    }, 380);
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!pdfPageCount) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        triggerNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        triggerPrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdfPageNum, pdfPageCount, animatingClass, twoPagesMode]);

  const checkOpinion = async () => {
    try {
      const res = await window.sapiusAPI.apiGet(`/electron/opinion/check/${selectedCourse.curso_programado.id}`);
      if (res && res.success) {
        setOpinionPending(res.pending);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpinionSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim().length < 50) {
      setOpinionMsg('El comentario debe contener al menos 50 caracteres.');
      return;
    }
    try {
      setOpinionSubmitting(true);
      setOpinionMsg('');
      
      const payload = {
        course_id: selectedCourse.curso_programado.id,
        rating,
        comment: comment.trim()
      };
      
      const res = await window.sapiusAPI.apiPost('/electron/opinion/submit', payload);
      if (res && res.success) {
        setOpinionMsg('¡Gracias por tu opinión! Tu valoración ha sido registrada.');
        setOpinionPending(false);
      } else {
        setOpinionMsg(res.message || 'Error al enviar opinión.');
      }
    } catch (err) {
      console.error(err);
      setOpinionMsg('Error de red al enviar opinión.');
    } finally {
      setOpinionSubmitting(false);
    }
  };

  const handleOutlineClick = async (dest) => {
    if (!dest || !pdfDoc) return;
    try {
      let pageIndex = null;
      if (typeof dest === 'string') {
        const destObj = await pdfDoc.getDestination(dest);
        if (destObj && destObj[0]) {
          pageIndex = await pdfDoc.getPageIndex(destObj[0]);
        }
      } else if (Array.isArray(dest)) {
        if (dest[0]) {
          pageIndex = await pdfDoc.getPageIndex(dest[0]);
        }
      }
      
      if (pageIndex !== null) {
        const targetPage = pageIndex + 1;
        if (targetPage >= 1 && targetPage <= pdfPageCount) {
          onGoToPdfPage(targetPage);
        }
      }
    } catch (err) {
      console.error("Error navigating to outline destination:", err);
    }
  };

  // Helper: Comprobar si el módulo/clase está desbloqueado según la fecha del cronograma
  const checkIsUnlocked = (item) => {
    const schedule = (selectedCourse.contenido_programado && selectedCourse.contenido_programado.contenido) 
      ? selectedCourse.contenido_programado.contenido 
      : [];
      
    if (schedule.length === 0) return true;

    const itemSchedule = schedule.find(x => x.id == item.id);
    if (!itemSchedule) return true;

    const parseDateStr = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return new Date(dateStr);
    };

    const hoyTime = Date.now();
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

    const unlockedLessons = selectedCourse.unlockedLessonsData ?? {};
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
  };

  // Obtener los módulos del temario ordenados según el cronograma
  const getSortedModules = () => {
    const cp = selectedCourse.curso_programado;
    const rawModulos = cp.curso.lecciones || [];
    const schedule = (selectedCourse.contenido_programado && selectedCourse.contenido_programado.contenido) 
      ? selectedCourse.contenido_programado.contenido 
      : [];

    return [...rawModulos].sort((a, b) => {
      const itemA = schedule.find(x => x.id == a.id);
      const itemB = schedule.find(x => x.id == b.id);
      const ordenA = itemA ? (itemA.orden ?? 0) : 0;
      const ordenB = itemB ? (itemB.orden ?? 0) : 0;
      return ordenA - ordenB;
    });
  };

  // Obtener las clases del módulo ordenadas según el cronograma
  const getSortedClases = (modulo) => {
    const schedule = (selectedCourse.contenido_programado && selectedCourse.contenido_programado.contenido) 
      ? selectedCourse.contenido_programado.contenido 
      : [];

    return [...(modulo.clases || [])].sort((a, b) => {
      const itemA = schedule.find(x => x.id == a.id);
      const itemB = schedule.find(x => x.id == b.id);
      const ordenA = itemA ? (itemA.orden ?? 0) : 0;
      const ordenB = itemB ? (itemB.orden ?? 0) : 0;
      return ordenA - ordenB;
    });
  };

  // Si se está cargando el temario
  if (loadingSyllabus) {
    return (
      <div className="text-center py-20 text-slate-400 font-medium">
        <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
        <p>Cargando temario y progreso del curso...</p>
      </div>
    );
  }

  const cp = selectedCourse.curso_programado;
  const isGuiasCategory = cp.category && cp.category.name === "Guias";

  return (
    <div className="view-pane active">
      {/* Botón superior de retroceso */}
      <button 
        onClick={onBackToCourses}
        className="bg-white/[0.02] border border-white/10 text-blue-500 text-xs font-bold uppercase tracking-wider py-2 px-3 rounded-lg cursor-pointer mb-6 inline-flex items-center gap-1.5 transition-all duration-200 hover:text-white hover:bg-blue-50 hover:border-blue-500"
      >
        ← Volver a Mis Cursos
      </button>
      
      <div className="course-workspace flex flex-col gap-6 mt-4">
        
        {/* SECCIÓN SUPERIOR: Workspace de Lección Activa */}
        <section className="course-active-lesson w-full flex flex-col border border-white/5 rounded-2xl p-5 sm:p-6 bg-slate-900/20 backdrop-blur-md min-h-[300px]">
          {loadingLesson ? (
            <div className="text-center py-20 text-slate-400 font-medium my-auto">
              <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
              <p>Cargando detalles de la clase...</p>
            </div>
          ) : !activeLesson ? (
            opinionPending ? (
              // Opinion and Feedback form (Phase 3)
              <div className="welcome-pane flex flex-col items-center justify-center p-6 sm:p-8 my-auto max-w-xl mx-auto text-center w-full">
                <span className="text-4xl block mb-2 animate-bounce">⭐</span>
                <h2 className="text-base sm:text-lg font-bold tracking-wide text-white">¡Has completado gran parte de este curso!</h2>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-2 leading-relaxed">Tu retroalimentación es muy valiosa para nosotros. Por favor califica tu experiencia y déjanos un comentario.</p>
                
                {opinionMsg && (
                  <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl text-[10px] sm:text-xs text-sapius-naranja font-semibold">
                    {opinionMsg}
                  </div>
                )}

                <form onSubmit={handleOpinionSubmit} className="w-full mt-4 space-y-4">
                  {/* Rating Selector */}
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-transform hover:scale-115 cursor-pointer ${star <= rating ? 'text-amber-400' : 'text-slate-655'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  {/* Comment input */}
                  <textarea
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escribe tu opinión del curso aquí (mínimo 50 caracteres)..."
                    className="w-full p-3 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-655 focus:outline-none focus:border-sapius-azul/50 resize-none"
                    required
                  />

                  <button
                    type="submit"
                    disabled={opinionSubmitting}
                    className="w-full py-2.5 px-4 bg-sapius-azul hover:bg-sapius-azul/80 disabled:bg-sapius-azul/40 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    {opinionSubmitting ? 'Enviando opinión...' : 'Enviar Valoración'}
                  </button>
                </form>
              </div>
            ) : (
              // Mensaje de Bienvenida si no hay lección activa y no hay opinión pendiente
              <div className="welcome-pane flex items-center justify-center text-center h-full p-8 my-auto min-h-[250px]">
                <div className="welcome-text">
                  <span className="text-4xl block mb-4 animate-bounce">🎓</span>
                  <h2 className="text-lg font-bold mt-4 tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">¡Te damos la bienvenida a tu clase!</h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">Selecciona cualquier módulo o clase en el panel inferior para comenzar tu aprendizaje o continuar donde te quedaste.</p>
                </div>
              </div>
            )
          ) : (
            // Workspace de Lección Activa Real
            <div className="w-full h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={isGuiasCategory ? onBackToCourses : onCloseLesson}
                  className="bg-white/[0.01] border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  {isGuiasCategory ? '← Volver a Mis Cursos' : '✕ Cerrar Lección'}
                </button>
              </div>

              <div className={`lesson-content-grid grid gap-6 items-start ${isGuiasCategory ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr_300px]'}`}>
                
                {/* Columna Principal: Videos, PDFs, Descripciones */}
                <div className="lesson-main flex flex-col gap-5">
                  <h2 className="text-base sm:text-lg font-bold text-slate-100">
                    {activeLessonId === 0 ? 'Guía de Estudio Protegida' : activeLesson.leccion.titulo}
                  </h2>
                  
                  {/* Reproductor de Video */}
                  {(activeLesson.video || activeLesson.videoext) && (
                    <div className="video-container">
                      <div className="video-wrapper relative pb-[56.25%] h-0 rounded-2xl overflow-hidden bg-black border border-white/5 shadow-lg">
                        <video 
                          src={activeLesson.video 
                            ? `${serverUrl}/alumno/medias/stream/${activeLesson.video.ruta}` 
                            : activeLesson.videoext.ruta
                          }
                          controls 
                          controlsList="nodownload" 
                          disablePictureInPicture
                          className="absolute top-0 left-0 w-full h-full outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Canvas para PDF (Lector PDF.js Seguro) */}
                  {(activeLessonId === 0 || (activeLesson.leccion && activeLesson.leccion.archivo_pdf)) && (
                    <div ref={viewerContainerRef} className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col max-h-[720px] shadow-lg">
                      <div className="pdf-toolbar flex justify-between items-center bg-slate-950/80 p-3.5 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          {pdfOutline && pdfOutline.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowOutline(!showOutline)}
                              className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${showOutline ? 'bg-sapius-azul border-sapius-azul text-white' : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05]'}`}
                              title="Mostrar índice"
                            >
                              📂 <span className="hidden sm:inline">Índice</span>
                            </button>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => setPdfScaleLocal(prev => Math.min(prev + 0.15, 2.5))}
                            className="p-1.5 bg-white/[0.02] border border-white/5 rounded-lg text-xs hover:bg-white/[0.05] text-slate-300 font-bold cursor-pointer"
                            title="Acercar"
                          >
                            🔍+
                          </button>
                          <button
                            type="button"
                            onClick={() => setPdfScaleLocal(prev => Math.max(prev - 0.15, 0.65))}
                            className="p-1.5 bg-white/[0.02] border border-white/5 rounded-lg text-xs hover:bg-white/[0.05] text-slate-300 font-bold cursor-pointer"
                            title="Alejar"
                          >
                            🔍-
                          </button>
                          <button
                            type="button"
                            onClick={fitToWidth}
                            className="p-1.5 bg-white/[0.02] border border-white/5 rounded-lg text-xs hover:bg-white/[0.05] text-slate-300 font-bold cursor-pointer"
                            title="Ajustar al ancho"
                          >
                            ↔️ <span className="hidden sm:inline">Ajustar Ancho</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTwoPagesMode(!twoPagesMode)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${twoPagesMode ? 'bg-sapius-azul border-sapius-azul text-white' : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05]'}`}
                            title="Modo libro (Dos páginas)"
                          >
                            📖 <span className="hidden lg:inline">{twoPagesMode ? '1 Pág.' : '2 Págs.'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <button 
                            disabled={pdfPageNum <= 1}
                            onClick={triggerPrevPage}
                            className="py-1.5 px-3 bg-white/[0.02] border border-white/5 rounded-lg text-xs font-semibold hover:bg-white/[0.05] disabled:opacity-50 cursor-pointer text-white"
                          >
                            ‹ Anterior
                          </button>
                          <span className="pdf-page-indicator text-[11px] font-bold uppercase tracking-wider text-slate-300 bg-white/[0.02] py-1.5 px-3 border border-white/5 rounded-lg">
                            Pág. {pdfPageNum} {twoPagesMode && pdfPageNum + 1 <= pdfPageCount ? ` - ${pdfPageNum + 1}` : ''} / {pdfPageCount}
                          </span>
                          <button 
                            disabled={pdfPageNum >= pdfPageCount || (twoPagesMode && pdfPageNum + 1 >= pdfPageCount)}
                            onClick={triggerNextPage}
                            className="py-1.5 px-3 bg-white/[0.02] border border-white/5 rounded-lg text-xs font-semibold hover:bg-white/[0.05] disabled:opacity-50 cursor-pointer text-white"
                          >
                            Siguiente ›
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="py-1.5 px-3 bg-white/[0.02] border border-white/5 rounded-lg text-xs hover:bg-white/[0.05] text-slate-300 cursor-pointer flex items-center gap-1.5"
                            title="Pantalla Completa"
                          >
                            📺 <span className="hidden sm:inline">Pantalla Completa</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex grow overflow-hidden h-[620px] bg-[#050912]">
                        {/* Outline/Index Panel */}
                        {showOutline && pdfOutline && pdfOutline.length > 0 && (
                          <div className="w-64 border-r border-white/5 bg-slate-950/60 overflow-y-auto p-3 flex flex-col gap-1.5 shrink-0 select-none">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2 block">Índice de Temas</span>
                            {pdfOutline.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleOutlineClick(item.dest)}
                                className="text-left w-full p-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/[0.03] hover:text-white transition-all truncate cursor-pointer block border border-transparent hover:border-white/5"
                                title={item.title}
                              >
                                📄 {item.title}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* PDF Viewport Scroll Area */}
                        <div className="pdf-scroll-area grow overflow-auto p-4 sm:p-6 flex justify-center items-start h-full pdf-book-container">
                          <div className={`pdf-page-wrapper flex justify-center items-center gap-6 ${animatingClass}`}>
                            <div className="shadow-2xl bg-white rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                              <canvas ref={canvasLeftRef}></canvas>
                            </div>
                            {twoPagesMode && pdfPageNum + 1 <= pdfPageCount && (
                              <div className="shadow-2xl bg-white rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                                <canvas ref={canvasRightRef}></canvas>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Descripción / Contenido de Texto Enriquecido */}
                  <div 
                    className="lesson-text-content bg-slate-900/50 border border-white/5 rounded-2xl p-6 sm:p-8 leading-relaxed text-base sm:text-lg text-slate-355"
                    dangerouslySetInnerHTML={{ 
                      __html: activeLessonId === 0 
                        ? "<p>Visualiza el material interactivo completo a continuación. Recuerda que la impresión y copia de este archivo están completamente restringidas por derechos de propiedad intelectual.</p>" 
                        : (activeLesson.leccion.contenido || '<p>No hay descripción adicional para esta clase.</p>') 
                    }}
                  ></div>
                </div>

                {/* Columna Lateral de la Lección: Completado, Tareas y Exámenes */}
                {activeLessonId !== 0 && (
                  <div className="lesson-sidebar flex flex-col gap-5">
                    
                    {/* Tarjeta de Completado */}
                    <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Estado de la Clase</h3>
                      <button 
                        onClick={onToggleCompletion}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 border flex items-center justify-center gap-2 cursor-pointer ${lessonCompleted ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/25' : 'bg-slate-900 text-slate-300 border-white/5 hover:bg-white/[0.02]'}`}
                      >
                        <span className="text-sm">{lessonCompleted ? '✅' : '⬜'}</span>
                        <span>{lessonCompleted ? 'Clase Completada' : 'Marcar como Completada'}</span>
                      </button>
                    </div>

                    {/* Exámenes de la Clase */}
                    {activeLesson.leccion && activeLesson.leccion.pruebas && activeLesson.leccion.pruebas.length > 0 && (
                      <div id="tutorial-exams-card" className="bg-white/[0.015] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Exámenes de la Clase</h3>
                        <div className="flex flex-col gap-2">
                          {activeLesson.leccion.pruebas.map((pr) => {
                            const finishedAttempts = pr.examenes?.filter(ex => ex.finalizado === 'si') || [];
                            const pendingFeedbackExam = finishedAttempts.find(ex => ex.retro_visualizado === 'no');
                            const remainingOportunidades = pr.oportunidades - finishedAttempts.length;

                            let buttonText = 'Presentar';
                            let buttonColorClass = 'bg-blue-600 hover:bg-blue-500 text-[#ffffff]';
                            let isDisabled = false;
                            let onClickAction = () => onLaunchExam(pr.id);

                            if (pendingFeedbackExam) {
                              buttonText = 'Ver retroalimentación';
                              buttonColorClass = 'bg-emerald-600 hover:bg-emerald-500 text-[#ffffff]';
                              onClickAction = () => onLaunchExam(pr.id, pendingFeedbackExam.id);
                            } else if (remainingOportunidades <= 0) {
                              buttonText = 'Sin intentos';
                              buttonColorClass = 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed';
                              isDisabled = true;
                              onClickAction = () => {};
                            }

                            return (
                              <div key={pr.id} className="flex justify-between items-center py-2 px-3 bg-slate-900 border border-white/5 rounded-xl">
                                <div className="truncate pr-2">
                                  <strong className="block text-xs text-white truncate max-w-[120px]">{pr.titulo}</strong>
                                  <span className="text-[10px] text-slate-450">{pr.oportunidades} Oportunidades</span>
                                </div>
                                <button 
                                  onClick={onClickAction}
                                  disabled={isDisabled}
                                  className={`py-1 px-3 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-200 ${buttonColorClass}`}
                                >
                                  {buttonText}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Material Interactivo */}
                    {activeLesson.leccion && activeLesson.leccion.material_pdfs && activeLesson.leccion.material_pdfs.length > 0 && (
                      <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Material Interactivo</h3>
                        <div className="flex flex-col gap-2">
                          {activeLesson.leccion.material_pdfs.map((mat) => (
                            <div key={mat.id} className="flex justify-between items-center py-2 px-3 bg-slate-900 border border-white/5 rounded-xl gap-2">
                              <span className="text-xs text-white truncate max-w-[120px] font-semibold" title={mat.titulo}>
                                {mat.titulo}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button 
                                  onClick={() => onLaunchInteractivePdf(mat.id)}
                                  className="py-1 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                >
                                  Resolver
                                </button>
                                <button 
                                  onClick={() => onDownloadInteractivePdfRaw(mat.id)}
                                  className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-350 border border-white/5 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                  title="Descargar PDF Original"
                                >
                                  📥
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Entrega de Tarea */}
                    <div id="tutorial-homework-card" className="bg-white/[0.015] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Entregar Tarea</h3>
                      
                      {homeworkStatus ? (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 py-3.5 px-4 rounded-xl text-xs font-semibold text-emerald-400">
                          <strong className="block text-emerald-400 mb-1">¡Tarea Entregada!</strong>
                          <span className="text-[10px] text-slate-500">
                            Estado: {homeworkStatus.calificada ? `Calificada (${homeworkStatus.calificacion}/10)` : 'Entregada para revisión'}
                          </span>
                        </div>
                      ) : (
                        <form onSubmit={onHomeworkSubmit} className="form-homework flex flex-col gap-4">
                          <p className="text-[10px] text-slate-550 leading-relaxed font-medium">Sube tu archivo de tarea (.pdf, .zip, .docx) para revisión.</p>
                          <div className="border border-dashed border-white/10 rounded-2xl py-6 px-3 text-center cursor-pointer flex flex-col items-center gap-2 hover:border-blue-500/50 hover:bg-blue-500/[0.02] transition relative">
                            <span className="text-2xl">📥</span>
                            <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full">
                              {uploadedFile ? uploadedFile.name : 'Selecciona un archivo'}
                            </span>
                            <input 
                              type="file" 
                              onChange={onFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                            />
                          </div>
                          <textarea 
                            placeholder="Comentario sobre la tarea (opcional)"
                            value={homeworkText}
                            onChange={(e) => onFileChange(e, true)}
                            className="w-full py-2.5 px-4 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs outline-none resize-none placeholder:text-slate-650"
                            rows="2"
                          />
                          <button 
                            type="submit" 
                            disabled={!uploadedFile || submittingHomework}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-[#ffffff] rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
                          >
                            {submittingHomework ? 'Subiendo...' : 'Enviar Entrega'}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {!isGuiasCategory && (
          <div className="w-full flex flex-col gap-4 border border-white/5 rounded-2xl p-5 sm:p-6 bg-slate-900/10 backdrop-blur-md">
            <div className="course-detail-header mb-4">
              <h2 className="text-sm font-bold text-slate-350 uppercase tracking-wide">Plan de Estudios del Curso</h2>
              
              <div className="progress-bar-container max-w-md mt-3 bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                <div className="flex justify-between text-xs text-slate-350 mb-1.5 font-bold">
                  <span>Progreso del Curso</span>
                  <strong className="text-blue-400 text-sm font-extrabold tracking-wide">
                    {`${selectedCourse.globalProgress || 0}%`}
                  </strong>
                </div>
                <div className="w-full bg-slate-950/50 h-2.5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-500 ease-out" 
                    style={{ width: `${selectedCourse.globalProgress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="modules-accordion flex flex-col gap-4">
              {getSortedModules().map((modulo) => {
                const isExpanded = !!expandedModules[modulo.id];
                const isModuleUnlocked = checkIsUnlocked(modulo);

                return (
                  <div key={modulo.id} className={`rounded-2xl bg-slate-900/40 border overflow-hidden ${isModuleUnlocked ? 'border-white/5' : 'border-red-500/10 opacity-60'}`}>
                    
                    <div 
                      onClick={() => isModuleUnlocked && onToggleModule(modulo.id)}
                      className={`flex justify-between items-center py-3 px-4 transition-colors ${isModuleUnlocked ? 'cursor-pointer bg-white/[0.005] hover:bg-white/[0.02]' : 'cursor-not-allowed bg-black/20'}`}
                    >
                      <div className="module-title-box truncate pr-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-1.5 truncate">
                          {!isModuleUnlocked && <span>🔒</span>}
                          {modulo.titulo}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">
                          {modulo.totalClases} clases • {modulo.completedCount} completadas
                        </span>
                      </div>
                      <div className="module-meta flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-blue-400">{modulo.progress}%</span>
                        {isModuleUnlocked && <span className="text-sm text-slate-400">{isExpanded ? '▲' : '▼'}</span>}
                      </div>
                    </div>

                    {isExpanded && isModuleUnlocked && modulo.clases && (
                      <div className="border-t border-white/5 p-3 bg-black/[0.08] flex flex-col gap-2">
                        {getSortedClases(modulo).map((clase, idx) => {
                          const isClassCompleted = selectedCourse.completedLessons ? selectedCourse.completedLessons.includes(clase.id) : false;
                          const isClassActive = activeLessonId === clase.id;
                          const isClassUnlocked = checkIsUnlocked(clase);

                          if (isClassUnlocked) {
                            return (
                              <div 
                                key={clase.id}
                                onClick={() => onSelectLesson(clase.id, cp.id)}
                                className={`flex justify-between items-center py-2 px-3 bg-slate-900/50 border rounded-xl cursor-pointer transition-all duration-200 hover:translate-x-0.5 hover:bg-blue-500/5 ${isClassActive ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5'}`}
                              >
                                <div className="class-info flex items-center gap-2 truncate pr-1">
                                  <span className="w-6 h-6 rounded-full bg-slate-800 border border-white/5 flex justify-center items-center font-bold text-xs text-slate-450 shrink-0">{idx + 1}</span>
                                  <span className="font-semibold text-xs sm:text-sm text-slate-200 truncate">{clase.titulo}</span>
                                </div>
                                <span className={`py-0.5 px-2 rounded-full text-[9px] sm:text-[10px] font-bold uppercase border shrink-0 ${isClassCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                  {isClassCompleted ? 'Listo' : 'Pendiente'}
                                </span>
                              </div>
                            );
                          } else {
                            return (
                              <div 
                                key={clase.id}
                                className="flex justify-between items-center py-2 px-3 bg-slate-900/10 border border-white/[0.02] rounded-xl cursor-not-allowed opacity-50"
                              >
                                <div className="class-info flex items-center gap-2 truncate pr-1">
                                  <span className="w-6 h-6 rounded-full bg-slate-950 flex justify-center items-center font-bold text-xs text-slate-650 shrink-0">🔒</span>
                                  <span className="font-semibold text-xs sm:text-sm text-slate-450 truncate">{clase.titulo}</span>
                                </div>
                                <span className="py-0.5 px-2 bg-slate-950 text-slate-500 border border-white/5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase shrink-0">Bloqueado</span>
                              </div>
                            );
                          }
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
