import React from 'react';

/**
 * Componente que muestra la información de soporte técnico y el enlace de contacto por WhatsApp.
 */
export default function SupportView() {
  return (
    <div className="view-pane active">
      <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-6 text-center max-w-lg mx-auto">
        <span className="text-4xl block mb-4">📞</span>
        <h2 className="text-base sm:text-lg font-bold text-white mb-2">Soporte Técnico Sapius</h2>
        <p className="text-[11px] sm:text-xs text-slate-400 mb-6 leading-relaxed font-medium">
          ¿Tienes problemas con la plataforma o con tu dispositivo? Nuestro equipo técnico está listo para ayudarte de forma inmediata.
        </p>
        
        {/* Tarjeta de horarios y datos de contacto */}
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 text-left mb-6 space-y-4">
          <div>
            <span className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Horario de Atención</span>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-200">Lunes a Viernes: 9:00 AM - 6:00 PM</p>
          </div>
          <div>
            <span className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contacto de WhatsApp</span>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-200">+52 1 999 364 8594</p>
          </div>
        </div>

        {/* Botón de redirección directo a WhatsApp Web/App */}
        <a 
          href="https://wa.me/529993648594?text=Hola,%20necesito%20soporte%20tecnico%20con%20la%20aplicacion%20de%20Sapius" 
          target="_blank" 
          rel="noreferrer"
          className="inline-flex justify-center items-center py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-md active:scale-98 text-decoration-none"
        >
          💬 Chatear con Soporte en WhatsApp
        </a>
      </div>
    </div>
  );
}
