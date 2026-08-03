import React from 'react';

/**
 * Componente que muestra las calificaciones e historial de exámenes del estudiante para el curso activo.
 * Usa exactamente la misma paleta de colores de resultados.blade.php en Laravel.
 * 
 * @param {Object} props
 * @param {Object} props.gradesData - Objeto con datos de calificaciones { calificaciones: [] }.
 * @param {boolean} props.loading - Indicador de carga.
 * @param {boolean} props.courseSelected - Si hay un curso activo.
 */
export default function GradesView({ gradesData, loading, courseSelected }) {
  const calificaciones = gradesData?.calificaciones || [];

  return (
    <div className="view-pane active">
      <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm sm:text-base font-bold text-white mb-2">Resultados de Evaluación</h2>
        <p className="text-[11px] sm:text-xs text-slate-400 mb-6 font-medium">Revisa tu historial, respuestas correctas y puntaje final obtenido en cada examen.</p>

        {/* Legend */}
        {courseSelected && !loading && calificaciones.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6 text-[10px] font-bold uppercase tracking-wider">
            <div style={{ backgroundColor: '#FFFF8A', color: '#948503' }} className="px-3 py-1.5 rounded-lg">
              No presentado: El examen no ha sido contestado.
            </div>
            <div style={{ backgroundColor: '#FFCCCC', color: '#a94442' }} className="px-3 py-1.5 rounded-lg">
              Deficiencia en puntaje, tema o contenido.
            </div>
            <div style={{ backgroundColor: '#D4EDDA', color: '#155724' }} className="px-3 py-1.5 rounded-lg">
              Puntaje satisfactorio.
            </div>
          </div>
        )}

        <div className="grades-table-wrapper overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-900/60 text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/5">
                <th className="py-4 px-5 font-bold">Examen</th>
                <th className="py-4 px-5 font-bold">Tipo</th>
                <th className="py-4 px-5 font-bold text-center">Total Preguntas</th>
                <th className="py-4 px-5 font-bold text-center">Correctas</th>
                <th className="py-4 px-5 font-bold text-center">Puntaje Final</th>
              </tr>
            </thead>
            <tbody>
              {!courseSelected ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500 font-medium text-[11px] sm:text-xs">
                    Por favor ingresa a un curso primero en "Mis Cursos" para visualizar tus calificaciones.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500 font-medium text-xs sm:text-sm">
                    <div className="w-5 h-5 border border-white/10 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                    Cargando calificaciones...
                  </td>
                </tr>
              ) : calificaciones.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500 font-medium text-[11px] sm:text-xs">
                    No hay exámenes asignados a este curso.
                  </td>
                </tr>
              ) : (
                calificaciones.map((item, idx) => {
                  let rowStyle = {};
                  let scoreDisplay = '-';
                  let correctDisplay = '-';
                  let totalQuestionsDisplay = '-';

                  if (item.presented) {
                    totalQuestionsDisplay = item.total_preguntas;
                    correctDisplay = item.total_correctas;
                    scoreDisplay = item.score_total;

                    if (item.score_total < 1200) {
                      rowStyle = { backgroundColor: '#FFCCCC', color: '#a94442' };
                    } else {
                      rowStyle = { backgroundColor: '#D4EDDA', color: '#155724' };
                    }
                  } else {
                    rowStyle = { backgroundColor: '#FFFF8A', color: '#948503' };
                  }

                  return (
                    <tr key={item.prueba_id || idx} style={rowStyle} className="border-b border-black/10 hover:brightness-95 transition-all">
                      <td className="py-4 px-5 font-semibold text-[11px] sm:text-xs">
                        {item.titulo}
                      </td>
                      <td className="py-4 px-5 text-[10px] sm:text-[11px] font-bold uppercase">
                        {item.tipo}
                      </td>
                      <td className="py-4 px-5 text-center text-[11px] sm:text-xs font-mono">
                        {item.presented ? totalQuestionsDisplay : 'No Presentado'}
                      </td>
                      <td className="py-4 px-5 text-center text-[11px] sm:text-xs font-mono">
                        {item.presented ? correctDisplay : 'No Presentado'}
                      </td>
                      <td className="py-4 px-5 text-center text-[11px] sm:text-xs font-bold font-mono">
                        {item.presented ? scoreDisplay : 'No Presentado'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
