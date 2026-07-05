import React, { useState, useEffect } from 'react';

export default function InteractiveTutorial({ customSteps, activeTab, onSelectTab, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState(null);

  const defaultSteps = [
    {
      selector: '#btn-nav-courses',
      title: '📚 Mis Cursos',
      description: 'Esta es tu área principal de estudio. Aquí puedes acceder a los módulos, clases, lecturas y exámenes de los cursos en los que estás inscrito.',
      placement: 'right',
      tab: 'courses'
    },
    {
      selector: '#btn-nav-homework',
      title: '📝 Mis Tareas',
      description: 'Lleva el control de todas tus entregas. En esta pestaña puedes revisar el estatus de las tareas subidas y sus respectivas calificaciones.',
      placement: 'right',
      tab: 'homework'
    },
    {
      selector: '#btn-nav-calendar',
      title: '📅 Calendario Escolar',
      description: 'Consulta las fechas programadas de inicio y fin para cada tema, clase y examen, asegurándote de no perder ninguna entrega límite.',
      placement: 'right',
      tab: 'calendar'
    },
    {
      selector: '#btn-nav-support',
      title: '☎️ Soporte Técnico',
      description: '¿Tienes alguna duda o incidencia con la plataforma? Nuestro equipo de soporte está a tu disposición en esta sección.',
      placement: 'right',
      tab: 'support'
    },
    {
      selector: '#btn-nav-profile',
      title: '👤 Mi Cuenta',
      description: 'Administra tus datos personales, contraseña y visualiza el estado de tu documentación oficial.',
      placement: 'right',
      tab: 'profile'
    },
    {
      selector: '#btn-nav-theme',
      title: '🌗 Tema Claro/Oscuro',
      description: 'Cambia el aspecto visual de la aplicación entre modo Claro y modo Oscuro según tu preferencia en cualquier momento.',
      placement: 'right',
      tab: null
    },
    {
      selector: '#btn-trigger-tutorial',
      title: '❓ Ayuda y Guía',
      description: 'Puedes hacer clic en este botón siempre que desees iniciar este tutorial interactivo nuevamente.',
      placement: 'bottom',
      tab: null
    }
  ];

  const steps = customSteps || defaultSteps;

  const step = steps[currentStep];

  useEffect(() => {
    // Si el paso actual requiere cambiar de pestaña para revelar el elemento
    if (step.tab && activeTab !== step.tab) {
      onSelectTab(step.tab);
    }
  }, [currentStep]);

  useEffect(() => {
    let active = true;
    let animationFrameId = null;
    let elementToElevate = null;
    let originalPosition = '';
    let originalZIndex = '';

    const updateBounds = () => {
      if (!active) return;
      const element = document.querySelector(step.selector);
      if (element) {
        const bounds = element.getBoundingClientRect();
        
        // Solo actualizamos el estado si las dimensiones cambiaron para evitar loops de renderizado
        setRect(prev => {
          if (!prev || 
              prev.top !== bounds.top || 
              prev.left !== bounds.left || 
              prev.width !== bounds.width || 
              prev.height !== bounds.height) {
            return bounds;
          }
          return prev;
        });

        // Elevamos el z-index del elemento para que brille por encima de la máscara
        if (!elementToElevate) {
          elementToElevate = element;
          originalPosition = element.style.position;
          originalZIndex = element.style.zIndex;

          const computedStyle = window.getComputedStyle(element);
          if (computedStyle.position === 'static') {
            element.style.position = 'relative';
          }
          element.style.zIndex = '100000';
        }
      } else {
        setRect(null);
      }

      animationFrameId = requestAnimationFrame(updateBounds);
    };

    // Desplazamos suavemente la vista hacia el elemento
    const element = document.querySelector(step.selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Iniciamos el bucle de seguimiento en tiempo real
    updateBounds();

    return () => {
      active = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (elementToElevate) {
        elementToElevate.style.position = originalPosition;
        elementToElevate.style.zIndex = originalZIndex;
      }
    };
  }, [currentStep, activeTab, step.selector]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('student_tutorial_seen', 'true');
    onClose();
  };

  const getPopoverStyle = () => {
    const space = 16;
    const popoverWidth = 320;
    const popoverHeight = 220; // Altura estimada razonable para evitar desborde
    const commonStyles = {
      zIndex: 100001
    };

    if (!rect) {
      return {
        ...commonStyles,
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    let top = 0;
    let left = 0;

    switch (step.placement) {
      case 'right':
        top = rect.top + rect.height / 2 - popoverHeight / 2;
        left = rect.right + space;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - popoverHeight / 2;
        left = rect.left - popoverWidth - space;
        break;
      case 'bottom':
        top = rect.bottom + space;
        left = rect.left + rect.width / 2 - popoverWidth / 2;
        break;
      case 'top':
        top = rect.top - popoverHeight - space;
        left = rect.left + rect.width / 2 - popoverWidth / 2;
        break;
      default:
        top = window.innerHeight / 2 - popoverHeight / 2;
        left = window.innerWidth / 2 - popoverWidth / 2;
    }

    // Ajustar límites de pantalla (clamping) con un margen de seguridad
    const margin = 16;
    top = Math.max(margin, Math.min(top, window.innerHeight - popoverHeight - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - popoverWidth - margin));

    return {
      ...commonStyles,
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-auto font-sans">
      {/* Sombra negra con recorte/máscara sobre el elemento si existe */}
      {rect ? (
        <div
          style={{
            position: 'fixed',
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            border: '2.5px solid #ed6a5a',
            borderRadius: '12px',
            boxShadow: `0 0 12px rgba(237, 106, 90, 0.7), 0 0 0 9999px ${isDark ? 'rgba(2, 6, 23, 0.75)' : 'rgba(15, 23, 42, 0.35)'}`,
            zIndex: 99999,
            pointerEvents: 'none',
            transition: 'all 0.25s ease-out'
          }}
          className="animate-pulse"
        />
      ) : (
        <div className={`fixed inset-0 transition-opacity duration-300 ${isDark ? 'bg-black/60' : 'bg-slate-900/35'} z-40`} />
      )}

      {/* Popover Tooltip del Paso */}
      <div
        style={getPopoverStyle()}
        className="w-[320px] bg-bg-slate-900 border border-border-main p-5 rounded-2xl shadow-2xl flex flex-col gap-4 animate-fadeIn transition-all duration-300"
      >
        <header className="flex flex-col gap-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-sapius-naranja">
            Paso {currentStep + 1} de {steps.length}
          </span>
          <h4 className="text-sm font-extrabold text-text-white leading-tight">
            {step.title}
          </h4>
        </header>

        <p className="text-xs text-text-muted leading-relaxed font-semibold">
          {step.description}
        </p>

        <footer className="flex justify-between items-center mt-2 border-t border-border-main pt-3">
          <button
            onClick={handleFinish}
            className="text-[10px] font-bold text-text-muted hover:text-rose-500 cursor-pointer transition-colors"
          >
            Omitir guía
          </button>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="py-1.5 px-3 bg-bg-slate-950 border border-border-main hover:bg-bg-slate-900 text-text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
              >
                Anterior
              </button>
            )}
            <button
              onClick={handleNext}
              className="py-1.5 px-4 bg-sapius-azul dark:bg-sapius-naranja text-[#ffffff] rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-md"
            >
              {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
