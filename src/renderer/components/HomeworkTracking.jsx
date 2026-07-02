import React from 'react';

/**
 * Componente que muestra la lista de seguimiento de tareas del estudiante.
 * Muestra las clases agrupadas por módulos con su respectivo estado de entrega.
 * 
 * @param {Object} props
 * @param {Object} props.homeworkTracking - Objeto con datos de tareas { modulos: [], homeworks: {} }.
 * @param {boolean} props.loading - Indicador de carga.
 * @param {boolean} props.courseSelected - Si hay un curso activo.
 * @param {Function} props.onGoToLesson - Función para navegar directo a una lección.
 */
export default function HomeworkTracking({ homeworkTracking, loading, courseSelected, onGoToLesson }) {
  return (
    <div className="view-pane active">
      <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-2">Seguimiento de Tareas</h2>
        <p className="text-xs text-slate-400 mb-6 font-medium">Visualiza el estado de las tareas solicitadas en tus cursos inscritos.</p>
        
        <div className="homework-table-wrapper overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/5">
                <th className="py-4 px-5 font-bold">Módulo / Clase</th>
                <th className="py-4 px-5 font-bold">Fecha Límite</th>
                <th className="py-4 px-5 font-bold">Estado</th>
                <th className="py-4 px-5 font-bold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {!courseSelected ? (
                // Mensaje instructivo si no se ha entrado a un curso
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500 font-medium text-xs">
                    Por favor ingresa a un curso primero en "Mis Cursos" para visualizar el seguimiento de tareas.
                  </td>
                </tr>
              ) : loading ? (
                // Spinner de carga
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-550 font-medium">
                    <div className="w-5 h-5 border border-white/10 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                    Cargando registro de tareas...
                  </td>
                </tr>
              ) : !homeworkTracking || !homeworkTracking.modulos || homeworkTracking.modulos.length === 0 ? (
                // Si la consulta fue exitosa pero no hay contenido
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500 font-medium text-xs">
                    No hay tareas pendientes en este curso.
                  </td>
                </tr>
              ) : (
                // Mapeamos los módulos y sus clases para renderizar las filas correspondientes
                homeworkTracking.modulos.map((modulo) => 
                  (modulo.clases || []).map((clase) => {
                    const homeworks = homeworkTracking.homeworks || {};
                    const hw = homeworks[clase.id];
                    const isSubmitted = !!hw;

                    return (
                      <tr key={clase.id} className="border-b border-white/5 hover:bg-white/[0.005]">
                        <td className="py-4 px-5">
                          <strong className="text-xs text-slate-200 block mb-0.5">{clase.titulo}</strong>
                          <span className="text-[10px] text-slate-500 font-medium">{modulo.titulo}</span>
                        </td>
                        <td className="py-4 px-5 text-xs text-slate-400">
                          {clase.fecha_limite ? new Date(clase.fecha_limite).toLocaleDateString() : 'Programada'}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`py-0.5 px-2 rounded-full text-[9px] font-bold uppercase border ${isSubmitted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                            {isSubmitted ? `Entregado ${hw.is_late ? '(Con retraso)' : '(A tiempo)'}` : 'Pendiente'}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <button 
                            onClick={() => onGoToLesson(clase.id)}
                            className="py-1 px-3 bg-white/[0.02] border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 text-slate-350 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition"
                          >
                            {isSubmitted ? 'Ver Clase' : 'Entregar Tarea'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
