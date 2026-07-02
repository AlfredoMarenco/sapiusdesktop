import React from 'react';

/**
 * Componente que muestra las fechas importantes del curso actual en formato de cronograma.
 * 
 * @param {Object} props
 * @param {Array} props.calendarSchedule - Lista de eventos y plazos.
 * @param {boolean} props.loading - Indicador de carga.
 * @param {boolean} props.courseSelected - Si hay un curso activo.
 */
export default function CalendarView({ calendarSchedule, loading, courseSelected }) {
  return (
    <div className="view-pane active">
      <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-2">Fechas Importantes</h2>
        <p className="text-xs text-slate-400 mb-6 font-medium">Consulta el cronograma y plazos del curso actual.</p>
        
        {!courseSelected ? (
          // Mensaje instructivo si no se ha entrado a un curso
          <div className="text-center py-8 text-slate-500 text-xs">
            Por favor ingresa a un curso primero en "Mis Cursos" para cargar sus fechas y cronograma.
          </div>
        ) : loading ? (
          // Visualización de carga
          <div className="text-center py-8 text-slate-500">Cargando fechas...</div>
        ) : !calendarSchedule || calendarSchedule.length === 0 ? (
          // Si no hay fechas para mostrar
          <div className="text-center py-8 text-slate-500">
            No hay plazos registrados para este curso.
          </div>
        ) : (
          // Mapeamos los plazos e hitos del curso en una tabla premium
          <div className="overflow-x-auto rounded-2xl border border-white/5 mt-4">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/5">
                  <th className="py-4 px-5 font-bold">Materia / Unidad</th>
                  <th className="py-4 px-5 font-bold">Fecha de Inicio</th>
                  <th className="py-4 px-5 font-bold">Fecha Final</th>
                </tr>
              </thead>
              <tbody>
                {calendarSchedule.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.005]">
                    <td className="py-4 px-5">
                      <strong className="text-xs text-slate-200 block">{item.titulo || 'Clase'}</strong>
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-400">{item.fecha_inicio || '-'}</td>
                    <td className="py-4 px-5 text-xs text-slate-400">{item.fecha_final || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
