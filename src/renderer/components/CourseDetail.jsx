import React from 'react';

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
  onNextPdfPage
}) {

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
            // Mensaje de Bienvenida si no hay lección activa
            <div className="welcome-pane flex items-center justify-center text-center h-full p-8 my-auto min-h-[250px]">
              <div className="welcome-text">
                <span className="text-4xl block mb-4 animate-bounce">🎓</span>
                <h2 className="text-lg font-bold mt-4 tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">¡Te damos la bienvenida a tu clase!</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">Selecciona cualquier módulo o clase en el panel inferior para comenzar tu aprendizaje o continuar donde te quedaste.</p>
              </div>
            </div>
          ) : (
            // Workspace de Lección Activa Real
            <div className="w-full h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={onCloseLesson}
                  className="bg-white/[0.01] border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg hover:text-white hover:bg-slate-800"
                >
                  ✕ Cerrar Lección
                </button>
              </div>

              <div className="lesson-content-grid grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
                
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
                    <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col max-h-[580px] shadow-lg">
                      <div className="pdf-toolbar flex justify-center items-center gap-3 bg-slate-950/80 p-3 border-b border-white/5">
                        <button 
                          disabled={pdfPageNum <= 1}
                          onClick={onPrevPdfPage}
                          className="py-1 px-3 bg-white/[0.02] border border-white/5 rounded-lg text-xs font-semibold hover:bg-white/[0.05] disabled:opacity-50"
                        >
                          ‹ Anterior
                        </button>
                        <span className="pdf-page-indicator text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/[0.02] py-1 px-2.5 border border-white/5 rounded-lg">
                          Página {pdfPageNum} de {pdfPageCount}
                        </span>
                        <button 
                          disabled={pdfPageNum >= pdfPageCount}
                          onClick={onNextPdfPage}
                          className="py-1 px-3 bg-white/[0.02] border border-white/5 rounded-lg text-xs font-semibold hover:bg-white/[0.05] disabled:opacity-50"
                        >
                          Siguiente ›
                        </button>
                      </div>
                      <div className="pdf-scroll-area overflow-auto bg-[#050912] p-4 sm:p-6 flex justify-center items-start">
                        <canvas ref={canvasRef} className="shadow-2xl bg-white"></canvas>
                      </div>
                    </div>
                  )}

                  {/* Descripción / Contenido de Texto Enriquecido */}
                  <div 
                    className="lesson-text-content bg-slate-900/50 border border-white/5 rounded-2xl p-5 sm:p-6 leading-relaxed text-xs sm:text-sm text-slate-355"
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
                      <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Exámenes de la Clase</h3>
                        <div className="flex flex-col gap-2">
                          {activeLesson.leccion.pruebas.map((pr) => (
                            <div key={pr.id} className="flex justify-between items-center py-2 px-3 bg-slate-900 border border-white/5 rounded-xl">
                              <div className="truncate pr-2">
                                <strong className="block text-xs text-white truncate max-w-[120px]">{pr.titulo}</strong>
                                <span className="text-[10px] text-slate-450">{pr.oportunidades} Oportunidades</span>
                              </div>
                              <button 
                                onClick={() => onLaunchExam(pr.id)}
                                className="py-1 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Presentar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Entrega de Tarea */}
                    <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
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
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
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

        {/* SECCIÓN INFERIOR: Temario y Acordeón del Curso */}
        <div className="w-full flex flex-col gap-4 border border-white/5 rounded-2xl p-5 sm:p-6 bg-slate-900/10 backdrop-blur-md">
          <div className="course-detail-header mb-4">
            <h2 className="text-sm font-bold text-slate-350 uppercase tracking-wide">Plan de Estudios del Curso</h2>
            
            {/* Barra de Progreso Global */}
            <div className="progress-bar-container max-w-md mt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{isGuiasCategory ? 'Material de Estudio' : 'Progreso del Curso'}</span>
                <strong className="text-blue-400">
                  {isGuiasCategory ? 'Guía Abierta' : `${selectedCourse.globalProgress || 0}%`}
                </strong>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300" 
                  style={{ width: isGuiasCategory ? '100%' : `${selectedCourse.globalProgress || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {isGuiasCategory ? (
            // Renderizado de botón especial para Guías de Estudio
            <div className="text-center py-6 bg-white/[0.01] border border-white/5 rounded-xl max-w-sm">
              <span className="text-3xl block mb-2">📖</span>
              <h3 className="text-xs sm:text-sm font-bold text-slate-200 mb-1">Guía de Contenido</h3>
              <p className="text-[10px] text-slate-400 mb-4 px-4 leading-relaxed">Puedes visualizarla de forma segura e interactiva a continuación.</p>
              <button 
                onClick={() => onSelectLesson(0, cp.id)}
                className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md"
              >
                Abrir Guía Segura
              </button>
            </div>
          ) : (
            // Renderizado del temario en una Lista Vertical de Módulos (stacked below workspace)
            <div className="modules-accordion flex flex-col gap-4">
              {getSortedModules().map((modulo) => {
                const isExpanded = !!expandedModules[modulo.id];
                const isModuleUnlocked = checkIsUnlocked(modulo);

                return (
                  <div key={modulo.id} className={`rounded-2xl bg-slate-900/40 border overflow-hidden ${isModuleUnlocked ? 'border-white/5' : 'border-red-500/10 opacity-60'}`}>
                    
                    {/* Cabecera del Módulo */}
                    <div 
                      onClick={() => isModuleUnlocked && onToggleModule(modulo.id)}
                      className={`flex justify-between items-center py-3 px-4 transition-colors ${isModuleUnlocked ? 'cursor-pointer bg-white/[0.005] hover:bg-white/[0.02]' : 'cursor-not-allowed bg-black/20'}`}
                    >
                      <div className="module-title-box truncate pr-2">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5 truncate">
                          {!isModuleUnlocked && <span>🔒</span>}
                          {modulo.titulo}
                        </h3>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {modulo.totalClases} clases • {modulo.completedCount} completadas
                        </span>
                      </div>
                      <div className="module-meta flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-blue-400">{modulo.progress}%</span>
                        {isModuleUnlocked && <span className="text-[10px] text-slate-400">{isExpanded ? '▲' : '▼'}</span>}
                      </div>
                    </div>

                    {/* Lista de clases dentro del módulo */}
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
                                  <span className="w-5 h-5 rounded-full bg-slate-800 border border-white/5 flex justify-center items-center font-bold text-[9px] text-slate-450 shrink-0">{idx + 1}</span>
                                  <span className="font-semibold text-xs text-slate-200 truncate">{clase.titulo}</span>
                                </div>
                                <span className={`py-0.5 px-1.5 rounded-full text-[7px] font-bold uppercase border shrink-0 ${isClassCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                  {isClassCompleted ? 'Listo' : 'Pendiente'}
                                </span>
                              </div>
                            );
                          } else {
                            // Clase Bloqueada
                            return (
                              <div 
                                key={clase.id}
                                className="flex justify-between items-center py-2 px-3 bg-slate-900/10 border border-white/[0.02] rounded-xl cursor-not-allowed opacity-50"
                              >
                                <div className="class-info flex items-center gap-2 truncate pr-1">
                                  <span className="w-5 h-5 rounded-full bg-slate-950 flex justify-center items-center font-bold text-xs text-slate-650 shrink-0">🔒</span>
                                  <span className="font-semibold text-xs text-slate-400 truncate">{clase.titulo}</span>
                                </div>
                                <span className="py-0.5 px-1.5 bg-slate-950 text-slate-600 border border-white/5 rounded-full text-[7px] font-bold uppercase shrink-0">Bloqueado</span>
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
          )}
        </div>
        
      </div>
    </div>
  );
}
