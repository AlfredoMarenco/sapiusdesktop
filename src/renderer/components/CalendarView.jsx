import React, { useState } from 'react';

/**
 * Componente que muestra las fechas importantes y los calendarios semanales (imágenes) del curso.
 * 
 * @param {Object} props
 * @param {Array} props.calendarSchedule - Lista de eventos y plazos.
 * @param {Array} props.weeklyCalendars - Lista de calendarios semanales.
 * @param {string} props.serverUrl - URL base del servidor Laravel para cargar las imágenes.
 * @param {boolean} props.loading - Indicador de carga.
 * @param {boolean} props.courseSelected - Si hay un curso activo.
 */
export default function CalendarView({ calendarSchedule, weeklyCalendars = [], serverUrl = '', loading, courseSelected }) {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className="view-pane active">
      <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm sm:text-base font-bold text-white mb-2">Fechas Importantes</h2>
        <p className="text-[11px] sm:text-xs text-slate-400 mb-6 font-medium">Consulta el cronograma, plazos y calendarios semanales del curso actual.</p>
        
        {!courseSelected ? (
          <div className="text-center py-8 text-slate-500 text-[11px] sm:text-xs">
            Por favor ingresa a un curso primero en "Mis Cursos" para cargar sus fechas y cronograma.
          </div>
        ) : loading ? (
          <div className="text-center py-8 text-slate-500 text-[11px] sm:text-xs">
            <div className="w-5 h-5 border border-white/10 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
            Cargando fechas...
          </div>
        ) : (
          <>
            {/* Weekly Calendars (Images) */}
            {weeklyCalendars && weeklyCalendars.length > 0 && (
              <div className="mb-8 bg-white/[0.01] border border-white/5 rounded-2xl p-5 text-center">
                <h3 className="text-xs sm:text-sm font-bold text-white mb-4">Calendarios Semanales</h3>
                <div className="flex flex-col gap-4 items-center justify-center">
                  {weeklyCalendars.map((cal) => (
                    <div key={cal.id} className="max-w-2xl overflow-hidden rounded-xl border border-white/10 shadow-lg">
                      <img 
                        src={`${serverUrl}/storage/${cal.image_path}`} 
                        alt="Calendario Semanal" 
                        className="w-full h-auto cursor-pointer hover:opacity-90 transition duration-200"
                        onClick={() => setSelectedImage(`${serverUrl}/storage/${cal.image_path}`)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agenda/Schedule Table */}
            <h3 className="text-xs sm:text-sm font-bold text-white mb-3">Cronograma de Actividades</h3>
            {!calendarSchedule || calendarSchedule.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-[11px] sm:text-xs bg-white/[0.005] border border-white/5 rounded-2xl">
                No hay actividades registradas en el cronograma para este curso.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-900/60 text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/5">
                      <th className="py-4 px-5 font-bold">Materia / Unidad</th>
                      <th className="py-4 px-5 font-bold">Fecha de Inicio</th>
                      <th className="py-4 px-5 font-bold">Fecha Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendarSchedule.map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.005]">
                        <td className="py-4 px-5">
                          <strong className="text-[11px] sm:text-xs text-slate-200 block">{item.titulo || 'Clase'}</strong>
                        </td>
                        <td className="py-4 px-5 text-[11px] sm:text-xs text-slate-400">{item.fecha_inicio || '-'}</td>
                        <td className="py-4 px-5 text-[11px] sm:text-xs text-slate-400">{item.fecha_final || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="Vista previa de calendario" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10" 
            />
            <button 
              className="absolute top-4 right-4 bg-black/60 text-white hover:bg-black/80 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
