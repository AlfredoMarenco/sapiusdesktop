import React, { useState, useEffect, useRef } from 'react';
import CoursesList from './components/CoursesList';
import HomeworkTracking from './components/HomeworkTracking';
import CalendarView from './components/CalendarView';
import SupportView from './components/SupportView';
import LockedScreen from './components/LockedScreen';
import CourseDetail from './components/CourseDetail';
import ExamOverlay from './components/ExamOverlay';

export default function App() {
  // Navigation & Core States
  const [currentView, setCurrentView] = useState('splash'); // splash, server-selection, login, dashboard, loading
  const [currentServer, setCurrentServer] = useState('');
  const [envUrls, setEnvUrls] = useState({ dev: '', prod: '', local: '' });
  const [statusMsg, setStatusMsg] = useState({ text: '', type: 'error' });
  const [appVersion, setAppVersion] = useState('1.0.0');
  
  // Auth State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState({ nombre_completo: '', avatar: '' });
  const [activeInscripcionId, setActiveInscripcionId] = useState(null);

  // Dashboard Navigation
  const [activeTab, setActiveTab] = useState('courses'); // courses, homework, calendar, support
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [macAddress, setMacAddress] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Auto Updater State
  const [updateStatus, setSplashStatus] = useState('Buscando actualizaciones de Sapius Desktop...');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  
  // Courses Data
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  
  // Active Lesson State
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [lessonDetail, setLessonDetail] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [submittingHomework, setSubmittingHomework] = useState(false);
  const [homeworkStatus, setHomeworkStatus] = useState(null);
  const [homeworkText, setHomeworkText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  // Accordion Toggles
  const [expandedModules, setExpandedModules] = useState({});

  // Exam States
  const [activeExamParams, setActiveExamParams] = useState(null); // { pruebaId, inscripcionId }

  // Strike Warnings
  const [strikeWarning, setStrikeWarning] = useState(null);

  // Homework Tab State
  const [homeworkTracking, setHomeworkTracking] = useState([]);
  const [loadingHomeworkTab, setLoadingHomeworkTab] = useState(false);

  // Calendar Tab State
  const [calendarSchedule, setCalendarSchedule] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // PDF.js State variables
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfPageNum, setPdfPageNum] = useState(1);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfScale, setPdfScale] = useState(1.0);
  const canvasRef = useRef(null);
  const pdfRenderTaskRef = useRef(null);

  // Initialize
  useEffect(() => {
    // Current date display
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('es-ES', options));

    // Get MAC Address
    if (window.sapiusAPI) {
      setMacAddress(window.sapiusAPI.getMacAddress());
      window.sapiusAPI.getAppVersion().then(v => setAppVersion(v)).catch(() => {});
      window.sapiusAPI.getEnvUrls().then(urls => setEnvUrls(urls)).catch(() => {});

      // Setup warning strike listener
      window.sapiusAPI.onShowWarningStrike((data) => {
        setStrikeWarning({
          action: data.action,
          strikes: data.strikes,
          max_strikes: data.max_strikes
        });
        setTimeout(() => setStrikeWarning(null), 4000);
      });

      // Evitar que la pantalla de carga (splash) quede congelada en desarrollo,
      // ya que autoUpdater.checkForUpdates() se omite si la app no está empaquetada y no dispara ningún evento.
      const isDevMode = window.location.hostname === 'localhost' || window.location.port === '5173';

      if (isDevMode) {
        transitionToSelector();
      } else if (window.sapiusAPI.onUpdateAvailable) {
        window.sapiusAPI.onUpdateAvailable((info) => {
          setSplashStatus(`Descargando actualización v${info.version}...`);
          setShowProgress(true);
        });

        window.sapiusAPI.onUpdateDownloadProgress((percent) => {
          setDownloadProgress(Math.round(percent));
        });

        window.sapiusAPI.onUpdateDownloaded(() => {
          setSplashStatus("Instalando actualización y reiniciando...");
          setTimeout(() => {
            window.sapiusAPI.quitAndInstall();
          }, 1000);
        });

        window.sapiusAPI.onUpdateNotAvailable(() => {
          transitionToSelector();
        });

        window.sapiusAPI.onUpdaterError((err) => {
          console.warn("Error del actualizador al iniciar:", err);
          transitionToSelector();
        });

        window.sapiusAPI.checkForUpdates();
      } else {
        transitionToSelector();
      }
    } else {
      transitionToSelector();
    }
  }, []);

  const transitionToSelector = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'locked') {
      setCurrentView('locked');
    } else {
      setCurrentView('server-selection');
    }
  };

  const handleServerSelection = async (url, label) => {
    setCurrentServer(url);
    if (window.sapiusAPI) {
      await window.sapiusAPI.setServerUrl(url);
      window.sapiusAPI.logToServer(`${label} seleccionado: ${url}`);
    }
    setCurrentView('login');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setStatusMsg({ text: 'Por favor complete todos los campos.', type: 'error' });
      return;
    }

    setStatusMsg({ text: '', type: '' });
    setCurrentView('loading');

    try {
      if (window.sapiusAPI) {
        window.sapiusAPI.logToServer(`Intentando login para el usuario: ${username}`);
        const loginRes = await window.sapiusAPI.login({ username, password });
        
        if (!loginRes.success) {
          setStatusMsg({ text: loginRes.message || 'Credenciales incorrectas.', type: 'error' });
          setCurrentView('login');
          setPassword('');
          return;
        }

        const mac = window.sapiusAPI.getMacAddress();
        window.sapiusAPI.logToServer(`MAC detectada: ${mac}. Iniciando validación.`);
        const macRes = await window.sapiusAPI.validateMac(mac);

        if (!macRes.success) {
          if (macRes.is_blocked) {
            window.sapiusAPI.logToServer(`Usuario bloqueado durante validación MAC. Redirigiendo a locked.html`);
            setCurrentView('locked');
            return;
          }
          setStatusMsg({ text: macRes.message || 'Error de autorización del dispositivo.', type: 'error' });
          setCurrentView('login');
          setPassword('');
          return;
        }

        // Successfully logged in
        window.sapiusAPI.logToServer(`Dispositivo validado con éxito. Cargando dashboard.`);
        loadDashboardData();
        setCurrentView('dashboard');
      } else {
        // Fallback for browser tests
        setUser({ nombre_completo: 'Usuario Local', avatar: 'U' });
        setCurrentView('dashboard');
      }
    } catch (err) {
      setStatusMsg({ text: 'Error inesperado de conexión con el servidor.', type: 'error' });
      setCurrentView('login');
      setPassword('');
    }
  };

  const handleLogout = () => {
    if (window.sapiusAPI) {
      window.sapiusAPI.logout();
    }
    setUser({ nombre_completo: '', avatar: '' });
    setSelectedCourse(null);
    setActiveLesson(null);
    setCurrentView('server-selection');
  };

  // Dashboard API Loaders
  const loadDashboardData = async () => {
    setLoadingCourses(true);
    try {
      if (window.sapiusAPI) {
        const res = await window.sapiusAPI.apiGet('/electron/dashboard');
        if (res && res.success) {
          setUser({
            nombre_completo: res.data.user.nombre_completo,
            avatar: res.data.user.nombre_completo.charAt(0).toUpperCase()
          });
          setCourses(res.data.mis_cursos);
        }
      }
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSelectCourse = async (cpId, inscripcionId) => {
    setLoadingSyllabus(true);
    setIsSidebarCollapsed(true);
    setSelectedCourse(null);
    setActiveLesson(null);
    if (inscripcionId) {
      setActiveInscripcionId(inscripcionId);
    }
    try {
      if (window.sapiusAPI) {
        const res = await window.sapiusAPI.apiGet(`/electron/course/${cpId}`);
        if (res && res.success) {
          setSelectedCourse(res.data);
          if (!inscripcionId && res.data.inscrito) {
            setActiveInscripcionId(res.data.inscrito.id);
          }
        }
      }
    } catch (err) {
      console.error('Error al cargar curso:', err);
    } finally {
      setLoadingSyllabus(false);
    }
  };

  const handleSelectLesson = async (leccionId, cpId) => {
    setLoadingLesson(true);
    setActiveLesson(null);
    setHomeworkStatus(null);
    setUploadedFile(null);
    setHomeworkText('');
    
    // Reiniciar visor PDF
    setPdfDoc(null);
    setPdfPageNum(1);
    setPdfPageCount(0);

    // Caso especial: Guía de estudio (leccionId === 0)
    // No hace consulta a la API del servidor, sino que inicializa datos simulados locales y descarga la guía
    if (leccionId === 0) {
      setActiveLessonId(0);
      setActiveLesson({
        leccion: {
          id: 0,
          titulo: 'Guía de Estudio Protegida',
          contenido: '<p>Visualiza el material interactivo completo a continuación. Recuerda que la impresión y copia de este archivo están completamente restringidas por derechos de propiedad intelectual.</p>'
        }
      });
      loadPDF(0, cpId);
      setLoadingLesson(false);
      return;
    }

    try {
      if (window.sapiusAPI) {
        const res = await window.sapiusAPI.apiGet(`/electron/lesson/${leccionId}/${cpId}`);
        if (res && res.success) {
          setActiveLessonId(leccionId);
          setActiveLesson(res.data);
          setActiveInscripcionId(res.data.inscripcion_id);
          
          // Verificar estado de completado comparando si está en la lista de completadas
          const isCompleted = res.data.completedLessons ? res.data.completedLessons.includes(leccionId) : false;
          setLessonCompleted(isCompleted);
          
          if (res.data.homework) {
            setHomeworkStatus(res.data.homework);
          }

          // Cargar PDF si existe la propiedad de archivo pdf
          if (res.data.leccion && res.data.leccion.archivo_pdf) {
            loadPDF(leccionId, cpId);
          }
        }
      }
    } catch (err) {
      console.error('Error al cargar lección:', err);
    } finally {
      setLoadingLesson(false);
    }
  };

  // Guardar cambio en el checkbox de completado
  const handleToggleCompletion = async () => {
    const nextState = !lessonCompleted;
    setLessonCompleted(nextState);
    if (window.sapiusAPI && selectedCourse && activeLessonId) {
      try {
        await window.sapiusAPI.apiPost('/electron/lecciones/toggle-completion', {
          leccion_id: activeLessonId,
          curso_programado_id: selectedCourse.curso_programado.id
        });
        
        // Recargar temario del curso para refrescar barras de progreso y checkmarks del acordeón
        const res = await window.sapiusAPI.apiGet(`/electron/course/${selectedCourse.curso_programado.id}`);
        if (res && res.success) {
          setSelectedCourse(res.data);
        }
      } catch (err) {
        console.error('Error toggle completion:', err);
      }
    }
  };

  // Homework Upload Dropzone
  const handleFileChange = (e, isText = false) => {
    if (isText) {
      setHomeworkText(e.target.value);
    } else if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleHomeworkSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedFile || !window.sapiusAPI) return;

    setSubmittingHomework(true);
    const formData = new FormData();
    formData.append('documento', uploadedFile);
    formData.append('leccion_id', activeLessonId);
    formData.append('curso_programado_id', selectedCourse.curso_programado.id);
    formData.append('tarea', homeworkText.trim() || 'Entregado desde Sapius Desktop');

    try {
      const baseUrl = await window.sapiusAPI.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/electron/send-homework`, {
        method: 'POST',
        body: formData
      });
      const res = await response.json();
      if (res.success) {
        setHomeworkStatus(res.data);
      } else {
        alert('Fallo la subida: ' + res.message);
      }
    } catch (err) {
      console.error('Error subiendo tarea:', err);
      alert('Error de conexión al subir la tarea.');
    } finally {
      setSubmittingHomework(false);
    }
  };

  // PDF.js rendering logic in Canvas
  const loadPDF = async (leccionId, cpId) => {
    if (!window.sapiusAPI) return;
    try {
      const baseUrl = await window.sapiusAPI.getBaseUrl();
      const pdfUrl = leccionId === 0 
        ? `${baseUrl}/api/electron/pdf/0?curso_programado_id=${cpId}`
        : `${baseUrl}/api/electron/pdf/${leccionId}`;

      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Error fetching PDF");
      const buffer = await response.arrayBuffer();

      window.pdfjsLib.getDocument({ data: buffer }).promise.then((pdfDoc_) => {
        setPdfDoc(pdfDoc_);
        setPdfPageCount(pdfDoc_.numPages);
        setPdfPageNum(1);
      });
    } catch (err) {
      console.error('Error cargando PDF:', err);
    }
  };

  useEffect(() => {
    if (pdfDoc) {
      renderPdfPage(pdfPageNum);
    }
  }, [pdfDoc, pdfPageNum, pdfScale]);

  const renderPdfPage = (num) => {
    if (!pdfDoc || !canvasRef.current) return;
    
    // Cancel pending rendering tasks
    if (pdfRenderTaskRef.current) {
      pdfRenderTaskRef.current.cancel();
    }

    pdfDoc.getPage(num).then((page) => {
      const viewport = page.getViewport({ scale: pdfScale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      const renderTask = page.render(renderContext);
      pdfRenderTaskRef.current = renderTask;
      
      renderTask.promise.catch((err) => {
        if (err.name !== 'RenderingCancelledException') {
          console.error(err);
        }
      });
    });
  };

  // Exam overlay logic
  const handleLaunchExam = (pruebaId) => {
    let inscId = activeInscripcionId;
    if (!inscId && selectedCourse && selectedCourse.inscrito) {
      inscId = selectedCourse.inscrito.id;
    }
    if (!inscId && activeLesson && activeLesson.inscripcion_id) {
      inscId = activeLesson.inscripcion_id;
    }
    console.log(`[Exam] Launching exam ${pruebaId} for inscription ${inscId}`);
    if (!inscId) {
      alert('No se pudo determinar el ID de inscripción de tu curso. Intenta reingresar al curso.');
      return;
    }
    setActiveExamParams({ pruebaId, inscripcionId: inscId });
  };

  // Tabs loading
  useEffect(() => {
    if (currentView === 'dashboard') {
      if (activeTab === 'homework') {
        loadHomeworkTab();
      } else if (activeTab === 'calendar') {
        loadCalendarTab();
      }
    }
  }, [activeTab, currentView]);

  const loadHomeworkTab = async () => {
    if (!window.sapiusAPI) return;
    setLoadingHomeworkTab(true);
    try {
      const cpId = selectedCourse ? selectedCourse.curso_programado.id : 0;
      const res = await window.sapiusAPI.apiGet(`/electron/homework-tracking/${cpId}`);
      if (res && res.success) {
        setHomeworkTracking(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHomeworkTab(false);
    }
  };

  const loadCalendarTab = async () => {
    if (!window.sapiusAPI) return;
    setLoadingCalendar(true);
    try {
      const cpId = selectedCourse ? selectedCourse.curso_programado.id : 0;
      const res = await window.sapiusAPI.apiGet(`/electron/course/${cpId}`);
      if (res && res.success) {
        // Build mock calendar from dates or fetch actual
        setCalendarSchedule([
          { label: 'Inicio del curso', date: res.data.curso_programado.fecha_inicio },
          { label: 'Fin del curso', date: res.data.curso_programado.fecha_fin },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const toggleModuleAccordion = (modId) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Views rendering Router
  if (currentView === 'splash') {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-950 text-white font-sans">
        <div className="bg-slate-900/30 border border-white/5 p-12 rounded-3xl w-full max-w-[420px] mx-4 text-center shadow-2xl backdrop-blur-xl">
          <div className="logo text-4xl font-extrabold mb-8 tracking-tight text-white">SAPIUS<span className="text-orange-500">.</span></div>
          <div className="spinner my-5 mx-auto w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-350">{updateStatus}</p>
          {showProgress && (
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${downloadProgress}%` }}></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'server-selection') {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-950 text-white font-sans">
        <div className="bg-slate-900/30 border border-white/5 p-8 sm:p-12 rounded-3xl w-full max-w-[420px] mx-4 shadow-2xl backdrop-blur-xl">
          <div className="logo text-center text-4xl font-extrabold mb-8 tracking-tight text-white">SAPIUS<span className="text-orange-500">.</span></div>
          <h2 className="text-lg font-bold mb-2 tracking-tight text-center">Selecciona un Entorno</h2>
          <p className="text-xs text-slate-400 mb-8 font-medium text-center">Por favor elige el servidor al que deseas conectarte.</p>
          
          <div className="server-options flex flex-col gap-4">
            <button 
              onClick={() => handleServerSelection(envUrls.local || 'http://127.0.0.1:8000', 'ENTORNO LOCAL')}
              className="flex flex-col items-center bg-white/[0.02] border border-white/5 p-5 rounded-2xl transition-all duration-200 hover:bg-white/[0.05] hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 cursor-pointer text-left"
            >
              <span className="text-sm font-bold tracking-wide text-slate-100 mb-1">ENTORNO LOCAL</span>
              <span className="text-xs text-slate-400 font-medium">{envUrls.local || 'http://127.0.0.1:8000'}</span>
            </button>

            <button 
              onClick={() => handleServerSelection(envUrls.dev || 'https://test.sapius.com.mx', 'DESARROLLO')}
              className="flex flex-col items-center bg-white/[0.02] border border-white/5 p-5 rounded-2xl transition-all duration-200 hover:bg-white/[0.05] hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 cursor-pointer text-left"
            >
              <span className="text-sm font-bold tracking-wide text-slate-100 mb-1">DESARROLLO</span>
              <span className="text-xs text-slate-400 font-medium">{envUrls.dev || 'test.sapius.com.mx'}</span>
            </button>

            <button 
              onClick={() => handleServerSelection(envUrls.prod || 'https://sapius.com.mx', 'PRODUCCIÓN')}
              className="flex flex-col items-center bg-white/[0.02] border border-white/5 p-5 rounded-2xl transition-all duration-200 hover:bg-white/[0.05] hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 cursor-pointer text-left"
            >
              <span className="text-sm font-bold tracking-wide text-slate-100 mb-1">PRODUCCIÓN</span>
              <span className="text-xs text-slate-400 font-medium">{envUrls.prod || 'sapius.com.mx'}</span>
            </button>
          </div>
          <div className="absolute bottom-4 left-4 text-[10px] text-slate-600 font-bold">v{appVersion}</div>
        </div>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-950 text-white font-sans">
        <form onSubmit={handleLogin} className="bg-slate-900/30 border border-white/5 p-8 sm:p-12 rounded-3xl w-full max-w-[420px] mx-4 shadow-2xl backdrop-blur-xl">
          <div className="logo text-center text-4xl font-extrabold mb-8 tracking-tight text-white">SAPIUS<span className="text-orange-500">.</span></div>
          <h2 className="text-lg font-bold mb-2 tracking-tight text-center">Bienvenido de nuevo</h2>
          <p className="text-xs text-slate-400 mb-8 font-medium text-center">Ingresa tus credenciales para acceder a tus cursos</p>
          
          <div className="form-group mb-4">
            <input 
              type="text" 
              placeholder="Usuario" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full py-3 px-4 bg-slate-950/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-650"
              required 
              autoComplete="off"
            />
          </div>
          <div className="form-group mb-6">
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3 px-4 bg-slate-950/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-650"
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 shadow-md shadow-blue-500/10 hover:shadow-lg active:scale-[0.98] border border-blue-400/10"
          >
            Iniciar Sesión
          </button>

          <button 
            type="button"
            onClick={() => setCurrentView('server-selection')}
            className="w-full mt-3 py-2.5 px-6 bg-transparent text-slate-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-250"
          >
            ← Cambiar Servidor
          </button>

          {statusMsg.text && (
            <div className="mt-6 text-xs text-center text-red-400 bg-red-500/5 border border-red-500/10 py-3 px-4 rounded-xl">
              {statusMsg.text}
            </div>
          )}
          <div className="absolute bottom-4 left-4 text-[10px] text-slate-600 font-bold">v{appVersion}</div>
        </form>
      </div>
    );
  }

  if (currentView === 'loading') {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-950 text-white font-sans">
        <div className="bg-slate-900/30 border border-white/5 p-12 rounded-3xl w-full max-w-[420px] mx-4 text-center shadow-2xl backdrop-blur-xl animate-pulse">
          <div className="logo text-4xl font-extrabold mb-8 tracking-tight text-white">SAPIUS<span className="text-orange-500">.</span></div>
          <div className="spinner my-5 mx-auto w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-350">Verificando dispositivo e iniciando sesión...</p>
        </div>
      </div>
    );
  }

  // --- OVERLAY: New ExamOverlay top-level routing ---
  if (activeExamParams) {
    return (
      <ExamOverlay
        pruebaId={activeExamParams.pruebaId}
        inscripcionId={activeExamParams.inscripcionId}
        serverUrl={currentServer}
        onClose={() => setActiveExamParams(null)}
        onExamFinished={async () => {
          if (selectedCourse) {
            const courseRes = await window.sapiusAPI.apiGet(`/electron/course/${selectedCourse.curso_programado.id}`);
            if (courseRes && courseRes.success) {
              setSelectedCourse(courseRes.data);
            }
          }
        }}
      />
    );
  }

  if (currentView === 'dashboard') {
    return (
      <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden font-sans bg-slate-950 text-slate-100">
        
        {/* SIDEBAR */}
        <aside className={`hidden md:flex flex-col py-6 px-4 md:px-5 shrink-0 transition-all duration-300 ease-in-out border-r border-white/5 bg-slate-900/60 backdrop-blur-xl group ${isSidebarCollapsed ? 'w-[75px]' : 'w-[260px]'} hover:w-[260px]`}>
          <div className="sidebar-header mb-8 flex flex-col gap-4">
            <div className="text-xl font-bold tracking-tight uppercase text-white flex items-center justify-between">
              <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                SAPIUS<span className="text-blue-500">.</span>
              </span>
              {isSidebarCollapsed && (
                <span className="text-blue-500 font-extrabold text-2xl mx-auto block group-hover:hidden">S.</span>
              )}
            </div>
            
            <div className="flex items-center gap-3 bg-white/[0.01] border border-white/[0.03] rounded-2xl p-3.5">
              <div className="w-8 h-8 text-sm font-bold flex justify-center items-center rounded-full shrink-0 shadow-md shadow-blue-500/10 text-white bg-blue-600">
                {user.avatar || 'S'}
              </div>
              <div className={`truncate transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                <h4 className="text-xs font-semibold text-white truncate w-[125px]">{user.nombre_completo || 'Estudiante'}</h4>
                <span className="text-[10px] text-slate-400 font-medium">Alumno</span>
              </div>
            </div>
          </div>
 
          <nav className="flex flex-col gap-1.5 grow">
            <button 
              onClick={() => { setActiveTab('courses'); }}
              className={`flex items-center gap-3.5 py-3 px-4 rounded-xl text-slate-450 font-semibold text-xs md:text-sm transition-all hover:text-white hover:bg-white/[0.01] shrink-0 cursor-pointer ${activeTab === 'courses' ? 'text-white bg-blue-500/10 border-l-2 border-l-blue-500 font-bold' : ''}`}
            >
              <span className="text-lg">📚</span>
              <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                Mis Cursos
              </span>
            </button>
            <button 
              onClick={() => { setActiveTab('homework'); }}
              className={`flex items-center gap-3.5 py-3 px-4 rounded-xl text-slate-455 font-semibold text-xs md:text-sm transition-all hover:text-white hover:bg-white/[0.01] shrink-0 cursor-pointer ${activeTab === 'homework' ? 'text-white bg-blue-500/10 border-l-2 border-l-blue-500 font-bold' : ''}`}
            >
              <span className="text-lg">📝</span>
              <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                Mis Tareas
              </span>
            </button>
            <button 
              onClick={() => { setActiveTab('calendar'); }}
              className={`flex items-center gap-3.5 py-3 px-4 rounded-xl text-slate-456 font-semibold text-xs md:text-sm transition-all hover:text-white hover:bg-white/[0.01] shrink-0 cursor-pointer ${activeTab === 'calendar' ? 'text-white bg-blue-500/10 border-l-2 border-l-blue-500 font-bold' : ''}`}
            >
              <span className="text-lg">📅</span>
              <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                Calendario
              </span>
            </button>
            <button 
              onClick={() => { setActiveTab('support'); }}
              className={`flex items-center gap-3.5 py-3 px-4 rounded-xl text-slate-457 font-semibold text-xs md:text-sm transition-all hover:text-white hover:bg-white/[0.01] shrink-0 cursor-pointer ${activeTab === 'support' ? 'text-white bg-blue-500/10 border-l-2 border-l-blue-500 font-bold' : ''}`}
            >
              <span className="text-lg">📞</span>
              <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                Soporte
              </span>
            </button>
          </nav>
 
          <div className="flex flex-col border-t border-white/5 pt-5 mt-auto gap-4">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium px-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></span>
              <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                MAC: {macAddress}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-bold border border-rose-500/10 flex items-center gap-2 justify-center cursor-pointer transition-all duration-300"
            >
              <span>🚪</span>
              <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                Cerrar Sesión
              </span>
            </button>
          </div>
        </aside>
 
        {/* MAIN PANEL CONTENT */}
        <main className="grow flex flex-col py-8 px-6 sm:px-10 overflow-y-auto bg-slate-950">
          <header className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              {activeTab === 'courses' && (selectedCourse ? 'Temario del Curso' : 'Mis Cursos')}
              {activeTab === 'homework' && 'Mis Tareas'}
              {activeTab === 'calendar' && 'Calendario'}
              {activeTab === 'support' && 'Soporte'}
            </h1>
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 bg-white/[0.01] border border-white/5 py-1 px-3 rounded-lg">
              {currentDate}
            </div>
          </header>

          <div className="view-content grow relative">
            
            {/* TABS 1: Courses */}
            {activeTab === 'courses' && (
              <>
                {!selectedCourse ? (
                  <CoursesList 
                    courses={courses}
                    loading={loadingCourses}
                    serverUrl={currentServer}
                    onSelectCourse={handleSelectCourse}
                  />
                ) : (
                  <CourseDetail
                    selectedCourse={selectedCourse}
                    loadingSyllabus={loadingSyllabus}
                    activeLesson={activeLesson}
                    activeLessonId={activeLessonId}
                    loadingLesson={loadingLesson}
                    lessonCompleted={lessonCompleted}
                    homeworkStatus={homeworkStatus}
                    submittingHomework={submittingHomework}
                    homeworkText={homeworkText}
                    uploadedFile={uploadedFile}
                    expandedModules={expandedModules}
                    serverUrl={currentServer}
                    onBackToCourses={() => { setSelectedCourse(null); setActiveLesson(null); setIsSidebarCollapsed(false); }}
                    onCloseLesson={() => setActiveLesson(null)}
                    onSelectLesson={handleSelectLesson}
                    onToggleCompletion={handleToggleCompletion}
                    onFileChange={handleFileChange}
                    onHomeworkSubmit={handleHomeworkSubmit}
                    onToggleModule={toggleModuleAccordion}
                    onLaunchExam={handleLaunchExam}
                    canvasRef={canvasRef}
                    pdfPageNum={pdfPageNum}
                    pdfPageCount={pdfPageCount}
                    onPrevPdfPage={() => setPdfPageNum(prev => Math.max(prev - 1, 1))}
                    onNextPdfPage={() => setPdfPageNum(prev => Math.min(prev + 1, pdfPageCount))}
                  />
                )}
              </>
            )}

            {/* TABS 2: Homework list */}
            {activeTab === 'homework' && (
              <HomeworkTracking 
                homeworkTracking={homeworkTracking} 
                loading={loadingHomeworkTab} 
                courseSelected={!!selectedCourse} 
                onGoToLesson={(lessonId) => {
                  setActiveTab('courses');
                  handleSelectLesson(lessonId, selectedCourse.curso_programado.id);
                }}
              />
            )}

            {/* TABS 3: Calendar */}
            {activeTab === 'calendar' && (
              <CalendarView calendarSchedule={calendarSchedule} loading={loadingCalendar} courseSelected={!!selectedCourse} />
            )}

            {/* TABS 4: Support */}
            {activeTab === 'support' && (
              <SupportView />
            )}

          </div>
        </main>
      </div>
    );
  }



  // --- VIEW: Locked screen view ---
  if (currentView === 'locked') {
    return <LockedScreen onLogout={handleLogout} />;
  }

  // --- OVERLAY: Strike Warning Strikes Popup ---
  return (
    <>
      {strikeWarning && (
        <div className="fixed top-0 left-0 w-screen h-screen bg-slate-950/95 backdrop-blur-md color-white z-[9999] flex items-center justify-center flex-col text-center p-6 font-sans">
          <div className="bg-white/[0.02] border border-white/5 p-12 rounded-3xl shadow-2xl max-w-[500px]">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="font-bold text-2xl mb-4 text-rose-500">Acción No Permitida</h2>
            <p className="text-sm leading-relaxed text-slate-300 mb-8">
              Está estrictamente prohibido realizar capturas de pantalla, copiar, imprimir o utilizar teclas restringidas en Sapius.<br />
              El material está protegido por la Ley Federal de Derechos de Autor.
            </p>
            <p className="font-extrabold text-sm text-yellow-400 bg-yellow-500/10 py-3 px-6 rounded-xl border border-yellow-500/20 display-inline-block">
              Advertencia: {strikeWarning.action} ({strikeWarning.strikes} / {strikeWarning.max_strikes})
            </p>
          </div>
        </div>
      )}

    </>
  );
}
