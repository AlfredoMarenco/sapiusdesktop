import React, { useEffect, useState } from 'react';

/**
 * Componente que muestra la pantalla de bloqueo seguro de Sapius.
 * Se muestra si el alumno infringe de forma grave o consecutiva las normas de seguridad.
 * 
 * @param {Object} props
 * @param {Function} props.onLogout - Acción para cerrar sesión y regresar al inicio.
 */
export default function LockedScreen({ onLogout }) {
  const [loading, setLoading] = useState(true);
  const [lockData, setLockData] = useState({
    user: { nombre_completo: 'Estudiante' },
    avg_severity: 0,
    is_grave_block: false,
    history: []
  });

  // Efecto para consultar los detalles del bloqueo en tiempo real (polling cada 5 segundos)
  useEffect(() => {
    const fetchLockDetails = async () => {
      if (!window.sapiusAPI) return;
      try {
        const res = await window.sapiusAPI.apiGet('/user/locked-details');
        if (res && res.success) {
          const data = res.data;

          // Si el servidor indica que el usuario ya no está bloqueado, cerramos la sesión automáticamente
          // para obligarlo a ingresar de nuevo y restablecer el estado limpio de la app.
          if (data.user && !data.user.is_blocked) {
            window.sapiusAPI.logToServer('Cuenta desbloqueada detectada. Redirigiendo al inicio de sesión.');
            onLogout();
            return;
          }

          setLockData(data);
        }
      } catch (err) {
        console.error('Error cargando detalles de bloqueo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLockDetails();
    
    // Configurar polling automático
    const interval = setInterval(fetchLockDetails, 5000);
    
    // Limpieza al desmontar el componente
    return () => clearInterval(interval);
  }, [onLogout]);

  // Determinamos los colores y textos del semáforo de gravedad
  const severity = lockData.avg_severity || 0;
  const isGrave = lockData.is_grave_block;

  let severityColor = 'bg-emerald-500';
  let severityText = 'Baja Intencionalidad (Errores Comunes)';
  let badgeBorderColor = 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10';

  if (isGrave) {
    severityColor = 'bg-red-950';
    severityText = 'VIOLACIÓN CRÍTICA (MODO RETROALIMENTACIÓN)';
    badgeBorderColor = 'border-red-700/20 text-red-500 bg-red-950/20';
  } else if (severity >= 70) {
    severityColor = 'bg-rose-500';
    severityText = 'Alta Intencionalidad (Acciones Prohibidas)';
    badgeBorderColor = 'border-rose-500/20 text-rose-400 bg-rose-500/10';
  } else if (severity >= 30) {
    severityColor = 'bg-amber-500';
    severityText = 'Intencionalidad Media (Precaución)';
    badgeBorderColor = 'border-amber-500/20 text-amber-400 bg-amber-500/10';
  }

  // Helper para mostrar con formato el tipo de acción detectada
  const renderActionBadge = (act) => {
    if (act.includes('Right Click') || act.includes('Clic Derecho')) {
      return <span className="bg-red-500/10 text-rose-400 border border-red-500/20 py-1 px-2.5 rounded-lg text-xs font-bold">🖱 Clic Derecho</span>;
    } else if (act.includes('PrintScreen')) {
      return <span className="bg-red-500/10 text-rose-400 border border-red-500/20 py-1 px-2.5 rounded-lg text-xs font-bold">📸 Captura (PrtScn)</span>;
    } else if (act.includes('F12') || act.includes('DevTools')) {
      return <span className="bg-red-500/10 text-rose-400 border border-red-500/20 py-1 px-2.5 rounded-lg text-xs font-bold">⚙️ DevTools / F12</span>;
    } else if (act.includes('Mac Screenshot')) {
      return <span className="bg-red-500/10 text-rose-400 border border-red-500/20 py-1 px-2.5 rounded-lg text-xs font-bold">🍎 Captura en Mac</span>;
    } else if (act.includes('Snipping Tool')) {
      return <span className="bg-red-500/10 text-rose-400 border border-red-500/20 py-1 px-2.5 rounded-lg text-xs font-bold">✂️ Herramienta Recortes</span>;
    } else if (act.includes('Copy')) {
      return <span className="bg-red-500/10 text-rose-400 border border-red-500/20 py-1 px-2.5 rounded-lg text-xs font-bold">📄 Copiar Contenido</span>;
    } else if (act.includes('Volume')) {
      return <span className="bg-white/5 text-slate-400 border border-white/10 py-1 px-2.5 rounded-lg text-xs font-bold">🔊 Tecla Volumen</span>;
    } else if (act.includes('Shortcut')) {
      return <span className="bg-red-500/10 text-rose-400 border border-red-500/20 py-1 px-2.5 rounded-lg text-xs font-bold">⌨️ Atajo {act.replace('Shortcut ', '').toUpperCase()}</span>;
    }
    return <span className="bg-white/5 text-slate-400 border border-white/10 py-1 px-2.5 rounded-lg text-xs font-bold">{act}</span>;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6 font-sans">
      <div className="bg-slate-900/30 border-2 border-rose-500/30 w-full max-w-3xl p-8 sm:p-12 text-center rounded-3xl shadow-2xl backdrop-blur-xl">
        
        {/* Candado de bloqueo */}
        <div className="text-6xl mb-6 animate-pulse">🔒</div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-500 mb-2 uppercase">
          ACCESO BLOQUEADO
        </h1>
        <h3 className="text-sm sm:text-base text-slate-300 font-medium mb-8 leading-relaxed">
          Lo sentimos, {lockData.user.nombre_completo}. Se ha suspendido temporalmente el acceso de tu cuenta.
        </h3>

        {/* Tarjeta de Instrucción */}
        <div className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-5 text-left mb-8">
          <h4 className="text-yellow-500 font-bold text-sm mb-2 flex items-center gap-2">
            <span>📸</span> Instrucción de Desbloqueo:
          </h4>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Para recuperar el acceso, por favor <strong>toma una foto de esta pantalla</strong> donde se aprecien con claridad las acciones indebidas detectadas y envíala al departamento de soporte técnico presionando el botón de WhatsApp al final.
          </p>
        </div>

        {/* Semáforo de Gravedad */}
        <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-5 text-left mb-8">
          <h4 className="font-bold text-xs sm:text-sm flex justify-between items-center text-slate-300">
            <span>Nivel de Gravedad de Infracciones</span>
            <span className={`text-[10px] uppercase font-bold py-1 px-3 border rounded-full ${badgeBorderColor}`}>
              {loading ? 'Analizando...' : severityText}
            </span>
          </h4>
          <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden mt-4">
            <div className={`h-full transition-all duration-1000 ${severityColor}`} style={{ width: `${Math.min(severity, 100)}%` }}></div>
          </div>
        </div>

        {/* Tabla de Incidentes */}
        <div className="text-left mb-8">
          <h4 className="text-xs sm:text-sm font-bold text-slate-300 mb-4 border-b border-white/5 pb-2 uppercase tracking-wide">
            Historial de Incidentes Recientes
          </h4>
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                  <th className="py-3 px-4 font-bold">Hora</th>
                  <th className="py-3 px-4 font-bold">Acción Detectada</th>
                  <th className="py-3 px-4 font-bold">Detalles / Contexto</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3" className="py-6 text-center text-xs text-slate-500">
                      Cargando historial de incidentes...
                    </td>
                  </tr>
                ) : lockData.history.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-6 text-center text-xs text-slate-500">
                      No hay registros de strikes disponibles para este bloqueo.
                    </td>
                  </tr>
                ) : (
                  lockData.history.map((item, idx) => {
                    let hora = '-';
                    if (item.created_at) {
                      try {
                        const dt = new Date(item.created_at);
                        hora = dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      } catch(e) {}
                    }
                    return (
                      <tr key={idx} className="border-b border-white/5 text-xs hover:bg-white/[0.005]">
                        <td className="py-3 px-4 font-bold text-slate-200">{hora}</td>
                        <td className="py-3 px-4">{renderActionBadge(item.action)}</td>
                        <td className="py-3 px-4 text-slate-400">{item.details || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mensaje Informativo */}
        <p className="text-slate-500 text-xs mb-8 max-w-md mx-auto leading-normal font-medium">
          El sistema verifica automáticamente tu estado de forma periódica. Si tu tutor/soporte realiza el desbloqueo, esta pantalla se cerrará automáticamente.
        </p>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="https://wa.me/529993648594?text=Hola,%20mi%20cuenta%20Sapius%20ha%20sido%20bloqueada" 
            target="_blank" 
            rel="noreferrer"
            className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 text-decoration-none inline-flex items-center justify-center gap-1.5"
          >
            💬 Contactar Soporte Técnico
          </a>
          <button 
            onClick={onLogout}
            className="py-3 px-6 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
