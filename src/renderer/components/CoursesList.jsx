import React from 'react';

/**
 * Componente que muestra la lista de cursos en los que está inscrito el alumno.
 * Diseñado con Tailwind CSS v4 para un aspecto premium, limpio y responsivo.
 * 
 * @param {Object} props
 * @param {Array} props.courses - Lista de cursos obtenidos del servidor.
 * @param {boolean} props.loading - Indicador de carga.
 * @param {string} props.serverUrl - URL base del servidor activo para resolver imágenes.
 * @param {Function} props.onSelectCourse - Función ejecutada al hacer clic en un curso.
 */
export default function CoursesList({ courses, loading, serverUrl, onSelectCourse }) {
  // Si está cargando los cursos, mostramos el indicador de carga (spinner)
  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400 font-medium">
        <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-sm">Cargando tus cursos programados...</p>
      </div>
    );
  }

  // Si no hay cursos cargados, mostramos un mensaje indicando que no hay inscripciones activas
  if (courses.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 font-medium bg-white/[0.01] rounded-2xl border border-white/5">
        <p className="text-sm">No estás inscrito en ningún curso activo en este momento.</p>
      </div>
    );
  }

  // Renderizamos la cuadrícula con las tarjetas de los cursos
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {courses.map((enrollment) => {
        const cp = enrollment.curso_programado;
        if (!cp) return null;
        const c = cp.curso;
        if (!c) return null;
        const catName = cp.category ? cp.category.name : 'Curso';

        return (
          <div
            key={enrollment.id}
            onClick={() => onSelectCourse(cp.id, enrollment.id)}
            className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 transition-all duration-300 flex flex-col h-full cursor-pointer hover:border-blue-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/[0.02]"
          >
            {/* Contenedor de la Imagen del Curso - object-contain para ver la imagen completa */}
            <div className="w-full h-auto relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/60 mb-4 flex items-center justify-center p-1.5">
              {c.imagen ? (
                <img
                  src={`${serverUrl}/cursos/image/${c.imagen}`}
                  className="max-w-full max-h-full"
                  alt={c.titulo}
                />
              ) : (
                <div className="w-full h-full flex justify-center items-center text-3xl bg-blue-500/5 text-slate-500">📚</div>
              )}
            </div>

             {/* Contenido de la Tarjeta del Curso */}
            <div className="flex flex-col grow">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] sm:text-xs font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  {catName}
                </span>
              </div>
              <div className="bg-sapius-naranja p-1 rounded-2xl text-center mb-3">
                <span className="text-xs sm:text-sm text-slate-900 font-bold">
                  {cp.identificador || ''}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 mb-1 leading-snug line-clamp-2">
                {c.titulo}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium mb-4">
                Instructor: {cp.instructor ? cp.instructor.nombre_completo : 'Por asignar'}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mb-4"
                dangerouslySetInnerHTML={{ __html: c.descripcion }}>
              </p>
              <div className="text-xs sm:text-sm text-slate-500 font-semibold mt-auto pt-4 border-t border-white/5 gap-1.5">
                <p>Inicia: {cp.fecha_inicio_venta ? new Date(cp.fecha_inicio_venta).toLocaleDateString('es-ES') : 'Sin fecha'}</p>
                <p>Vence: {cp.fecha_fin ? new Date(cp.fecha_fin).toLocaleDateString('es-ES') : 'Sin fecha'}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
