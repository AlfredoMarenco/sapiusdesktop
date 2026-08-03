import React, { useState } from 'react';

/**
 * Componente que muestra el progreso detallado del curso (lecciones vistas, tareas y exámenes).
 * 
 * @param {Object} props
 * @param {Object} props.progressData - Objeto con datos de progreso { modulos: [], completedLessons: [], homeworks: {}, examenes: {}, unlockedLessonsData: {} }.
 * @param {boolean} props.loading - Indicador de carga.
 * @param {boolean} props.courseSelected - Si hay un curso activo.
 */
export default function CourseProgressView({ progressData, loading, courseSelected }) {
  const modulos = progressData?.modulos || [];
  const completedLessons = progressData?.completedLessons || [];
  const homeworks = progressData?.homeworks || {};
  const examenes = progressData?.examenes || {};
  const unlockedLessonsData = progressData?.unlockedLessonsData || {};

  // Estado para controlar qué módulos están colapsados
  const [collapsedModules, setCollapsedModules] = useState({});

  const toggleModule = (id) => {
    setCollapsedModules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="view-pane active">
      <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm sm:text-base font-bold text-white mb-2">Progreso de Lecciones y Actividades</h2>
        <p className="text-[11px] sm:text-xs text-slate-400 mb-6 font-medium">Revisa el estado de visualización de cada clase, las tareas entregadas y tus calificaciones de exámenes.</p>

        <div className="progress-table-wrapper overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-900/60 text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/5">
                <th className="py-4 px-5 font-bold" colSpan="2">Módulo / Lección</th>
                <th className="py-4 px-5 font-bold text-center">Lección Vista</th>
                <th className="py-4 px-5 font-bold text-center">Tarea Enviada</th>
                <th className="py-4 px-5 font-bold text-center">Examen</th>
                <th className="py-4 px-5 font-bold text-center">Calificación</th>
              </tr>
            </thead>
            {modulos.map((modulo) => {
              const isCollapsed = collapsedModules[modulo.id];
              const clases = modulo.clases || [];
              const pruebasModulo = modulo.pruebas || [];

              return (
                <React.Fragment key={modulo.id}>
                  {/* Fila del Módulo */}
                  <tbody>
                    <tr 
                      onClick={() => toggleModule(modulo.id)}
                      className="bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer border-b border-white/5 transition-all"
                    >
                      <td className="py-3 px-5" colSpan="5">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span className="font-bold text-slate-200 text-[11px] sm:text-xs">{modulo.titulo}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="py-0.5 px-2 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400">
                            {clases.length} lecciones
                          </span>
                          <svg 
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor" 
                            strokeWidth="3"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </td>
                    </tr>
                  </tbody>

                  {/* Clases y Pruebas del Módulo (Acordeón) */}
                  {!isCollapsed && (
                    <tbody className="bg-black/10">
                      {/* Exámenes del Módulo */}
                      {pruebasModulo.map((prueba) => {
                        const examen = examenes[prueba.id];
                        let examStatusStr = 'No Presentado';
                        let scoreStr = '-';
                        let cellStyle = { backgroundColor: '#FFFF8A', color: '#948503' };

                        if (examen) {
                          if (examen.finalizado === 'si') {
                            examStatusStr = `Presentado (${examen.total_correctas}/${examen.total_preguntas})`;
                            scoreStr = examen.score_total;
                            if (examen.score_total < 1200) {
                              cellStyle = { backgroundColor: '#FFCCCC', color: '#a94442' };
                            } else {
                              cellStyle = { backgroundColor: '#D4EDDA', color: '#155724' };
                            }
                          } else {
                            examStatusStr = 'En Progreso';
                            cellStyle = { backgroundColor: '#FFF3CD', color: '#856404' };
                          }
                        }

                        return (
                          <tr key={`prueba-${prueba.id}`} className="border-b border-white/5 hover:bg-white/[0.005]">
                            <td className="py-2.5 px-5 text-center w-12 border-r border-white/5">
                              <svg className="w-4 h-4 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-[10px] sm:text-[11px] text-slate-350 pl-6">
                              <strong>Examen de Módulo:</strong> {prueba.titulo}
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-600">-</td>
                            <td className="py-2.5 px-4 text-center text-slate-600">-</td>
                            <td style={cellStyle} className="py-2.5 px-4 text-center text-[10px] sm:text-[11px] font-bold">
                              {examStatusStr}
                            </td>
                            <td style={cellStyle} className="py-2.5 px-4 text-center text-[10px] sm:text-[11px] font-extrabold font-mono">
                              {scoreStr}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Listado de Clases */}
                      {clases.map((clase) => {
                        let terminada = completedLessons.includes(clase.id);
                        const enviado = !!homeworks[clase.id];
                        const hw = homeworks[clase.id];

                        const pruebasClase = clase.pruebas || [];

                        // Auto-completion override si hay examen finalizado
                        const anyExamenFinalizado = pruebasClase.some(p => {
                          const ex = examenes[p.id];
                          return ex && ex.finalizado === 'si';
                        });

                        if (!terminada && (enviado || anyExamenFinalizado)) {
                          terminada = true;
                        }

                        const hasHomework = !!clase.tarea;

                        // Si la clase no tiene exámenes
                        if (pruebasClase.length === 0) {
                          return (
                            <tr key={`clase-${clase.id}`} className="border-b border-white/5 hover:bg-white/[0.005]">
                              <td className="py-2.5 px-5 text-center w-12 border-r border-white/5">
                                <svg className="w-3.5 h-3.5 text-slate-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                              </td>
                              <td className="py-2.5 px-4 text-[10px] sm:text-[11px] text-slate-300">
                                {clase.titulo}
                                {unlockedLessonsData[clase.id] && (
                                  <span className="ml-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 py-0.2 px-1.5 rounded-full text-[8px] font-bold">
                                    Desbloqueo Especial
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`py-0.5 px-2 rounded text-[9px] font-bold ${terminada ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                  {terminada ? 'Sí' : 'No'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {hasHomework ? (
                                  enviado ? (
                                    <span className="py-0.5 px-2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      Entregada {hw.is_late && '(Atrasada)'}
                                    </span>
                                  ) : (
                                    <span className="py-0.5 px-2 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-white/5">
                                      Pendiente
                                    </span>
                                  )
                                ) : (
                                  <span className="text-[10px] text-slate-600 font-italic">N/A</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center text-[10px] text-slate-600 font-italic">N/A</td>
                              <td className="py-2.5 px-4 text-center text-[10px] text-slate-600 font-italic">N/A</td>
                            </tr>
                          );
                        }

                        // Si la clase tiene exámenes (los listamos uno a uno)
                        return pruebasClase.map((prueba, index) => {
                          const examen = examenes[prueba.id];
                          let examStatusStr = 'No Presentado';
                          let scoreStr = '-';
                          let cellStyle = { backgroundColor: '#FFFF8A', color: '#948503' };

                          if (examen) {
                            if (examen.finalizado === 'si') {
                              examStatusStr = `Presentado (${examen.total_correctas}/${examen.total_preguntas})`;
                              scoreStr = examen.score_total;
                              if (examen.score_total < 1200) {
                                cellStyle = { backgroundColor: '#FFCCCC', color: '#a94442' };
                              } else {
                                cellStyle = { backgroundColor: '#D4EDDA', color: '#155724' };
                              }
                            } else {
                              examStatusStr = 'En Progreso';
                              cellStyle = { backgroundColor: '#FFF3CD', color: '#856404' };
                            }
                          }

                          return (
                            <tr key={`clase-${clase.id}-prueba-${prueba.id}`} className="border-b border-white/5 hover:bg-white/[0.005]">
                              <td className="py-2.5 px-5 text-center w-12 border-r border-white/5">
                                {index === 0 && (
                                  <svg className="w-3.5 h-3.5 text-slate-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                  </svg>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-[10px] sm:text-[11px] text-slate-300">
                                {index === 0 ? (
                                  <>
                                    {clase.titulo}
                                    {unlockedLessonsData[clase.id] && (
                                      <span className="ml-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 py-0.2 px-1.5 rounded-full text-[8px] font-bold">
                                        Desbloqueo Especial
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-slate-500 ml-4 inline-flex items-center gap-1">
                                    <svg className="w-3 h-3 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                    Examen: {prueba.titulo}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {index === 0 ? (
                                  <span className={`py-0.5 px-2 rounded text-[9px] font-bold ${terminada ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                    {terminada ? 'Sí' : 'No'}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {index === 0 ? (
                                  hasHomework ? (
                                    enviado ? (
                                      <span className="py-0.5 px-2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        Entregada {hw.is_late && '(Atrasada)'}
                                      </span>
                                    ) : (
                                      <span className="py-0.5 px-2 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-white/5">
                                        Pendiente
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-[10px] text-slate-600 font-italic">N/A</span>
                                  )
                                ) : '-'}
                              </td>
                              <td style={cellStyle} className="py-2.5 px-4 text-center text-[10px] sm:text-[11px] font-bold">
                                {examStatusStr}
                              </td>
                              <td style={cellStyle} className="py-2.5 px-4 text-center text-[10px] sm:text-[11px] font-extrabold font-mono">
                                {scoreStr}
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  )}
                </React.Fragment>
              );
            })}
          </table>
        </div>
      </div>
    </div>
  );
}
