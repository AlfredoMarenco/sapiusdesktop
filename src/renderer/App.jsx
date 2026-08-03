import React, { useState, useEffect, useRef } from 'react';
import CoursesList from './components/CoursesList';
import HomeworkTracking from './components/HomeworkTracking';
import CalendarView from './components/CalendarView';
import SupportView from './components/SupportView';
import LockedScreen from './components/LockedScreen';
import CourseDetail from './components/CourseDetail';
import ExamOverlay from './components/ExamOverlay';
import ProfileView from './components/ProfileView';
import InteractiveTutorial from './components/InteractiveTutorial';
import GradesView from './components/GradesView';
import CourseProgressView from './components/CourseProgressView';
import InteractivePdfOverlay from './components/InteractivePdfOverlay';
import iconoSapius from './assets/img/icono-sapius.svg';

function LogoSapius({ className }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 1080 366.5" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Capa_1">
        <circle cx="1000.5" cy="216" r="18.5" fill="#ED6A5A"/>
      </g>
      <g id="Capa_8">
        <path d="M837.1,222.9v-40.7c19.6,11.4,39.1,17.1,58.7,17.1c13.7,0,20.5-3.9,20.5-11.6c0-2.2-0.6-4.1-1.7-5.5c-1.1-1.4-3.1-2.6-5.8-3.5c-2.8-0.9-5.5-1.7-8.1-2.3c-2.7-0.6-6.4-1.3-11.2-2.1c-4.8-0.8-9-1.7-12.7-2.8c-15.1-3.7-26.4-8.9-33.9-15.7c-7.5-6.8-11.3-16.2-11.3-28c0.2-15.5,6.4-27.7,18.7-36.5c12.2-8.9,27.9-13.3,47.1-13.3c21.8,0,41,4,57.5,11.9v40.1c-19-10.8-37.8-16.2-56.6-16.2c-13,0-19.6,3.6-19.6,10.7c0,2,0.6,3.8,1.7,5.2c1.1,1.4,3,2.6,5.7,3.5c2.6,0.9,5.2,1.6,7.8,2.1c2.5,0.5,6.2,1.2,11,2.1c4.8,0.9,8.9,1.8,12.4,2.6c15.5,3.9,27.1,9.1,34.7,15.7c7.6,6.6,11.5,16.1,11.5,28.3c-0.2,16.1-6.6,28.6-19.1,37.6c-12.5,9-28.7,13.5-48.5,13.5C873.5,235.1,854,231,837.1,222.9z" fill="currentColor"/>
      </g>
      <g id="Capa_3">
        <path d="M670.1,220.4c-9.6-9.8-14.3-25.2-14.3-46.2l0.1-92.7l46.5,0l-0.1,85.6c0,10.4,1.9,17.6,5.8,21.7c3.9,4.5,9.4,6.7,16.5,6.7c11,0,21.2-4.5,30.6-13.4l0.1-100.6l46.5,0l-0.2,150.4l-45.9,0l0-14.1l-0.6-0.3c-13.7,11.8-29,17.7-45.9,17.7C692.7,235.4,679.6,230.4,670.1,220.4z" fill="currentColor"/>
      </g>
      <g id="Capa_4">
        <rect x="518.8" y="133.4" transform="matrix(1.006075e-03 -1 1 1.006075e-03 436.7053 750.5189)" width="150.4" height="46.5" fill="currentColor"/>
      </g>
      <g id="Capa_5">
        <path d="M432.5,229.6l-0.1,69.4l-46.5,0l0.2-217.7l45.6,0l0,7.6l0.6,0.3c11-7.5,23.5-11.3,37.3-11.3c19.8,0,36.6,7.2,50.4,21.6c13.8,14.4,20.8,33,20.7,55.8c0,23.7-7.5,42.9-22.5,57.6c-15,14.8-33.7,22.1-56.1,22.1c-11.2,0-20.9-2-29-5.8L432.5,229.6z M432.5,191.7c7.3,3.9,15.3,5.8,23.8,5.8c11.8,0,21.1-3.7,27.7-11.1c6.6-7.4,10-17,10-28.6c0-11.6-3.2-21.4-9.8-29.2c-6.5-7.9-15.4-11.8-26.6-11.8c-9.2,0-17.5,2.7-25.1,8.2L432.5,191.7z" fill="currentColor"/>
      </g>
      <g id="Capa_6">
        <path d="M264.6,234.9c-13.7,0-25.3-3.3-34.9-9.8c-11.8-8.2-17.7-19.9-17.7-35.2c0-15.9,6.1-28,18.4-36.4c10.4-7.1,24.5-10.7,42.2-10.7c9.2,0,17.8,0.9,26,2.8l0-5.8c0-7.1-1.9-12.4-5.8-15.9c-4.7-4.3-12.4-6.4-23.2-6.4c-14.7,0-29.4,3.9-44,11.9l0-40.1c15.5-7.7,33-11.6,52.6-11.6c21.8,0,38.5,4.8,50.1,14.4c11.2,9.2,16.8,23.1,16.8,41.6l-0.1,51.1c0,8,3,11.9,9.2,11.9c2.6,0,5.2-0.6,7.6-1.8l0,34.9c-5.7,3.1-13.2,4.6-22.3,4.6c-13.9,0-24.7-4-32.4-12l-0.6,0C294.9,230.8,280.9,235,264.6,234.9z M277.5,200.7c7.3,0,14.4-2,21.1-6.1l0-22c-4.5-1.4-10-2.2-16.5-2.2c-15.9,0-23.9,5.1-23.9,15.3c0,4.7,1.8,8.4,5.5,11C267.4,199.4,272,200.7,277.5,200.7z" fill="currentColor"/>
      </g>
      <g id="Capa_7">
        <path d="M67.1,222.5l0-40.7c19.6,11.4,39.1,17.2,58.7,17.2c13.7,0,20.5-3.8,20.5-11.6c0-2.2-0.6-4.1-1.7-5.5c-1.1-1.4-3.1-2.6-5.8-3.5c-2.8-0.9-5.5-1.7-8.1-2.3c-2.7-0.6-6.4-1.3-11.2-2.2c-4.8-0.8-9-1.7-12.7-2.8c-15.1-3.7-26.4-8.9-33.9-15.8c-7.5-6.8-11.3-16.2-11.3-28c0.2-15.5,6.4-27.7,18.7-36.5s27.9-13.3,47.1-13.3c21.8,0,41,4,57.5,12l0,40.1c-18.9-10.8-37.8-16.2-56.6-16.3c-13,0-19.6,3.5-19.6,10.7c0,2,0.6,3.8,1.7,5.2c1.1,1.4,3,2.6,5.7,3.5c2.6,0.9,5.2,1.6,7.8,2.1c2.5,0.5,6.2,1.2,11,2.2c4.8,0.9,8.9,1.8,12.4,2.6c15.5,3.9,27.1,9.2,34.7,15.8c7.6,6.6,11.5,16.1,11.4,28.3c-0.2,16.1-6.6,28.6-19.2,37.6c-12.5,9-28.7,13.4-48.5,13.4C103.5,234.8,84,230.7,67.1,222.5z" fill="currentColor"/>
      </g>
    </svg>
  );
}

export default function App() {
  // MAC request states
  const [pendingMacRequest, setPendingMacRequest] = useState(null);
  const [requestMacSent, setRequestMacSent] = useState(false);

  // Navigation & Core States
  const [currentView, setCurrentView] = useState('splash'); // splash, server-selection, login, dashboard, loading
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentServer, setCurrentServer] = useState(localStorage.getItem('sapius_server_url') || '');
  const [envUrls, setEnvUrls] = useState({ dev: '', prod: '', local: '' });
  const [statusMsg, setStatusMsg] = useState({ text: '', type: 'error' });
  const [appVersion, setAppVersion] = useState('1.0.0');
  
  // Auth State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState({ nombre_completo: '', avatar: '' });
  const [avatarError, setAvatarError] = useState(false);
  const [activeInscripcionId, setActiveInscripcionId] = useState(null);

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auto-start tutorial on first dashboard load
  useEffect(() => {
    if (currentView === 'dashboard' && user?.nombre_completo && !localStorage.getItem('student_tutorial_seen')) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentView, user]);

  // Dashboard Navigation
  const [activeTab, setActiveTab] = useState('courses'); // courses, homework, calendar, support, profile
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
  const [weeklyCalendars, setWeeklyCalendars] = useState([]);

  // Grades Tab State
  const [gradesData, setGradesData] = useState(null);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // Detailed Course Progress State
  const [courseProgressData, setCourseProgressData] = useState(null);
  const [loadingCourseProgress, setLoadingCourseProgress] = useState(false);
  const [activeInteractivePdfId, setActiveInteractivePdfId] = useState(null);

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

  const transitionToSelector = async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'locked') {
      setCurrentView('locked');
    } else {
      if (window.sapiusAPI && window.sapiusAPI.getBaseUrl) {
        try {
          const url = await window.sapiusAPI.getBaseUrl();
          setCurrentServer(url);
          localStorage.setItem('sapius_server_url', url);
        } catch (e) {
          console.error('Error fetching base URL from main process:', e);
        }
      }
      setCurrentView('login');
    }
  };

  const handleServerSelection = async (url, label) => {
    setCurrentServer(url);
    localStorage.setItem('sapius_server_url', url);
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
          if (macRes.pending_request) {
            setPendingMacRequest(mac);
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

  const fetchNotifications = async () => {
    try {
      if (window.sapiusAPI) {
        const res = await window.sapiusAPI.apiGet('/electron/notifications');
        if (res && res.success) {
          setNotifications(res.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markNotificationAsRead = async (notifId) => {
    try {
      if (window.sapiusAPI) {
        const res = await window.sapiusAPI.apiPost(`/electron/notifications/${notifId}/read`);
        if (res && res.success) {
          setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      if (window.sapiusAPI) {
        const res = await window.sapiusAPI.apiPost('/electron/notifications/clear-all');
        if (res && res.success) {
          setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dashboard API Loaders
  const loadDashboardData = async () => {
    setLoadingCourses(true);
    try {
      if (window.sapiusAPI) {
        const res = await window.sapiusAPI.apiGet('/electron/dashboard');
        if (res && res.success) {
          console.log('[DEBUG] Dashboard User Loaded:', JSON.stringify(res.data.user));
          setAvatarError(false);
          setUser({
            nombre_completo: res.data.user.nombre_completo,
            avatar: res.data.user.nombre_completo.charAt(0).toUpperCase(),
            foto_url: res.data.user.foto_url ? `${currentServer}${res.data.user.foto_url}` : null
          });
          setCourses(res.data.mis_cursos);
          fetchNotifications(); // Cargar notificaciones al iniciar
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
          const cp = res.data.curso_programado;
          if (cp && cp.category && cp.category.name === "Guias") {
            setPdfScale(1.5);
            handleSelectLesson(0, cpId);
          } else {
            setPdfScale(1.1);
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
  const handleLaunchExam = (pruebaId, feedbackExamenId = null) => {
    let inscId = activeInscripcionId;
    if (!inscId && selectedCourse && selectedCourse.inscrito) {
      inscId = selectedCourse.inscrito.id;
    }
    if (!inscId && activeLesson && activeLesson.inscripcion_id) {
      inscId = activeLesson.inscripcion_id;
    }
    console.log(`[Exam] Launching exam ${pruebaId} for inscription ${inscId} (feedback: ${feedbackExamenId})`);
    if (!inscId) {
      alert('No se pudo determinar el ID de inscripción de tu curso. Intenta reingresar al curso.');
      return;
    }
    setActiveExamParams({ pruebaId, inscripcionId: inscId, feedbackExamenId });
  };

  // Tabs loading
  useEffect(() => {
    if (currentView === 'dashboard') {
      if (activeTab === 'homework') {
        loadHomeworkTab();
      } else if (activeTab === 'calendar') {
        loadCalendarTab();
      } else if (activeTab === 'grades') {
        loadGradesTab();
      } else if (activeTab === 'progress') {
        loadCourseProgressTab();
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
      const res = await window.sapiusAPI.apiGet(`/electron/calendar/${cpId}`);
      if (res && res.success) {
        setCalendarSchedule(res.data.events || []);
        setWeeklyCalendars(res.data.weekly_calendars || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const loadGradesTab = async () => {
    if (!window.sapiusAPI) return;
    setLoadingGrades(true);
    try {
      let inscId = activeInscripcionId;
      if (!inscId && selectedCourse && selectedCourse.inscrito) {
        inscId = selectedCourse.inscrito.id;
      }
      const res = await window.sapiusAPI.apiGet(`/electron/grades/${inscId || 0}`);
      if (res && res.success) {
        setGradesData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGrades(false);
    }
  };

  const loadCourseProgressTab = async () => {
    if (!window.sapiusAPI) return;
    setLoadingCourseProgress(true);
    try {
      const cpId = selectedCourse ? selectedCourse.curso_programado.id : 0;
      const res = await window.sapiusAPI.apiGet(`/electron/course-progress/${cpId}`);
      if (res && res.success) {
        setCourseProgressData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCourseProgress(false);
    }
  };

  const handleDownloadInteractivePdfRaw = async (id) => {
    if (!window.sapiusAPI) return;
    try {
      const token = localStorage.getItem('token') || '';
      const url = `${currentServer}/electron/material-pdfs/${id}/download-raw`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `material_${id}.pdf`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Error al descargar el PDF.");
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
          <LogoSapius className="h-12 mx-auto mb-8 text-white" />
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
          <LogoSapius className="h-12 mx-auto mb-8 text-white" />
          <h2 className="text-base sm:text-lg font-bold mb-2 tracking-tight text-center">Selecciona un Entorno</h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mb-8 font-medium text-center">Por favor elige el servidor al que deseas conectarte.</p>
          
          <div className="server-options flex flex-col gap-4">
            <button 
              onClick={() => handleServerSelection(envUrls.local || 'http://127.0.0.1:8000', 'ENTORNO LOCAL')}
              className="flex flex-col items-center bg-white/[0.02] border border-white/5 p-5 rounded-2xl transition-all duration-200 hover:bg-white/[0.05] hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 cursor-pointer text-left"
            >
              <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-100 mb-1">ENTORNO LOCAL</span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium">{envUrls.local || 'http://127.0.0.1:8000'}</span>
            </button>

            <button 
              onClick={() => handleServerSelection(envUrls.dev || 'https://test.sapius.com.mx', 'DESARROLLO')}
              className="flex flex-col items-center bg-white/[0.02] border border-white/5 p-5 rounded-2xl transition-all duration-200 hover:bg-white/[0.05] hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 cursor-pointer text-left"
            >
              <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-100 mb-1">DESARROLLO</span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium">{envUrls.dev || 'test.sapius.com.mx'}</span>
            </button>

            <button 
              onClick={() => handleServerSelection(envUrls.prod || 'https://sapius.com.mx', 'PRODUCCIÓN')}
              className="flex flex-col items-center bg-white/[0.02] border border-white/5 p-5 rounded-2xl transition-all duration-200 hover:bg-white/[0.05] hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 cursor-pointer text-left"
            >
              <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-100 mb-1">PRODUCCIÓN</span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium">{envUrls.prod || 'sapius.com.mx'}</span>
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
          <LogoSapius className="h-12 mx-auto mb-8 text-white" />
          <h2 className="text-base sm:text-lg font-bold mb-2 tracking-tight text-center">Bienvenido de nuevo</h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mb-8 font-medium text-center">Ingresa tus credenciales para acceder a tus cursos</p>
          
          <div className="form-group mb-4">
            <input 
              type="text" 
              placeholder="Usuario" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full py-3 px-4 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-650"
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
              className="w-full py-3 px-4 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-650"
              required 
              
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold cursor-pointer transition-all duration-200 shadow-md shadow-blue-500/10 hover:shadow-lg active:scale-[0.98] border border-blue-400/10"
          >
            Iniciar Sesión
          </button>


          {statusMsg.text && (
            <div className="mt-6 text-[11px] sm:text-xs text-center text-red-400 bg-red-500/5 border border-red-500/10 py-3 px-4 rounded-xl flex flex-col items-center gap-3">
              <span>{statusMsg.text}</span>
              {pendingMacRequest && !requestMacSent && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await window.sapiusAPI.apiPost('/electron/request-mac-auth', { mac_address: pendingMacRequest });
                      if (res && res.success) {
                        setRequestMacSent(true);
                        setStatusMsg({ text: 'Solicitud de autorización enviada con éxito. Por favor espera la aprobación del administrador.', type: 'success' });
                      } else {
                        alert(res.message || 'Error al enviar solicitud.');
                      }
                    } catch (e) {
                      console.error(e);
                      alert('Error al enviar la solicitud.');
                    }
                  }}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Solicitar Autorización de este Dispositivo
                </button>
              )}
            </div>
          )}
          <div className="absolute bottom-4 left-4 text-[10px] text-slate-600 font-bold">v{appVersion}</div>
        </form>
      </div>
    );
  }

  const renderStrikeWarning = () => {
    if (!strikeWarning) return null;
    return (
      <div className="fixed inset-0 w-screen h-screen bg-slate-950/95 backdrop-blur-md text-white z-[9999] flex items-center justify-center flex-col text-center p-6 font-sans">
        <div className="bg-white/[0.02] border border-white/5 p-12 rounded-3xl shadow-2xl max-w-[500px]">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="font-bold text-2xl mb-4 text-rose-500">Acción No Permitida</h2>
          <p className="text-sm leading-relaxed text-slate-300 mb-8">
            Está estrictamente prohibido realizar capturas de pantalla, copiar, imprimir o utilizar teclas restringidas en Sapius.<br />
            El material está protegido por la Ley Federal de Derechos de Autor.
          </p>
          <p className="font-extrabold text-sm text-yellow-400 bg-yellow-500/10 py-3 px-6 rounded-xl border border-yellow-500/20 inline-block">
            Advertencia: {strikeWarning.action} ({strikeWarning.strikes} / {strikeWarning.max_strikes})
          </p>
        </div>
      </div>
    );
  };

  if (currentView === 'loading') {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-950 text-white font-sans">
        <div className="bg-slate-900/30 border border-white/5 p-12 rounded-3xl w-full max-w-[420px] mx-4 text-center shadow-2xl backdrop-blur-xl animate-pulse">
          <LogoSapius className="h-12 mx-auto mb-8 text-white animate-pulse" />
          <div className="spinner my-5 mx-auto w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-350">Verificando dispositivo e iniciando sesión...</p>
        </div>
      </div>
    );
  }

  // --- OVERLAY: Interactive PDF Overlay ---
  if (activeInteractivePdfId) {
    return (
      <InteractivePdfOverlay
        materialId={activeInteractivePdfId}
        serverUrl={currentServer}
        onClose={() => {
          setActiveInteractivePdfId(null);
          if (activeLesson && selectedCourse) {
            handleSelectLesson(activeLesson.leccion.id, selectedCourse.curso_programado.id);
          }
        }}
      />
    );
  }

  // --- OVERLAY: New ExamOverlay top-level routing ---
  if (activeExamParams) {
    return (
      <>
        <ExamOverlay
          pruebaId={activeExamParams.pruebaId}
          inscripcionId={activeExamParams.inscripcionId}
          feedbackExamenId={activeExamParams.feedbackExamenId}
          serverUrl={currentServer}
          onClose={() => setActiveExamParams(null)}
          onExamFinished={async () => {
            if (selectedCourse) {
              if (activeLesson) {
                const lessonRes = await window.sapiusAPI.apiGet(`/electron/lesson/${activeLesson.leccion.id}/${selectedCourse.curso_programado.id}`);
                if (lessonRes && lessonRes.success) {
                  setActiveLesson(lessonRes.data);
                }
              }
              const courseRes = await window.sapiusAPI.apiGet(`/electron/course/${selectedCourse.curso_programado.id}`);
              if (courseRes && courseRes.success) {
                setSelectedCourse(courseRes.data);
              }
            }
          }}
        />
        {renderStrikeWarning()}
      </>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden font-sans bg-slate-950 text-slate-100">
        
        {/* SIDEBAR */}
        <aside className={`hidden md:flex flex-col py-6 px-4 md:px-5 shrink-0 transition-all duration-300 ease-in-out border-r border-white/5 bg-slate-900/60 backdrop-blur-xl group ${isSidebarCollapsed ? 'w-[75px]' : 'w-[260px]'} hover:w-[260px]`}>
          <div className="sidebar-header mb-8 flex flex-col gap-4">
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center group-hover:justify-between' : 'justify-between'}`}>
              <LogoSapius 
                className={`h-14 mx-auto transition-all duration-300 ${theme === 'light' ? 'text-[#0a2540]' : 'text-slate-100'} ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}
              />
              {isSidebarCollapsed && (
                <img 
                  src={iconoSapius} 
                  className={`h-8 w-8 object-contain mx-auto block group-hover:hidden ${theme === 'light' ? 'invert brightness-[0.2]' : ''}`} 
                  alt="Sapius Icon" 
                />
              )}
            </div>
            
            <div className={`flex items-center bg-white/[0.02] border border-white/[0.04] rounded-2xl transition-all duration-300 ${isSidebarCollapsed ? 'p-1 justify-center mx-auto w-10 h-10 md:w-11 md:h-11 group-hover:w-full group-hover:h-auto group-hover:p-3 group-hover:justify-start group-hover:gap-3 shadow-inner' : 'p-3 gap-3 w-full shadow-inner'}`}>
              {user.foto_url && !avatarError ? (
                <img 
                  src={user.foto_url} 
                  onError={() => setAvatarError(true)}
                  className="w-8 h-8 rounded-full object-cover shrink-0 shadow-lg shadow-sapius-azul/20" 
                  alt="Avatar" 
                />
              ) : (
                <div className="w-8 h-8 text-xs font-extrabold flex justify-center items-center rounded-full shrink-0 shadow-lg shadow-sapius-azul/20 text-[#ffffff] bg-sapius-azul dark:bg-sapius-naranja">
                  {user.avatar || 'S'}
                </div>
              )}
              <div className={`truncate transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                <h4 className="text-[11px] sm:text-xs font-bold text-slate-100 truncate w-[125px]">{user.nombre_completo || 'Estudiante'}</h4>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Alumno</span>
              </div>
            </div>
          </div>
 
          <nav className="flex flex-col gap-2 grow">
            <button 
              id="btn-nav-courses"
              onClick={() => { setActiveTab('courses'); }}
              className={`flex items-center rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 shrink-0 cursor-pointer ${isSidebarCollapsed ? 'w-10 h-10 md:w-11 md:h-11 justify-center p-0 mx-auto group-hover:w-full group-hover:h-auto group-hover:py-3 group-hover:px-4 group-hover:justify-start group-hover:gap-3.5' : 'w-full py-3 px-4 gap-3.5'} ${activeTab === 'courses' ? 'text-slate-100 bg-sapius-azul/10 dark:bg-sapius-naranja border-l-4 border-sapius-azul shadow-sm shadow-sapius-azul/5 font-bold' : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]'}`}
            >
              <svg className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${activeTab === 'courses' ? 'text-sapius-azul' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
              <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                Mis Cursos
              </span>
            </button>

            {selectedCourse && (
              <>
                <button 
                  id="btn-nav-progress"
                  onClick={() => { setActiveTab('progress'); }}
                  className={`flex items-center rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 shrink-0 cursor-pointer ${isSidebarCollapsed ? 'w-10 h-10 md:w-11 md:h-11 justify-center p-0 mx-auto group-hover:w-full group-hover:h-auto group-hover:py-3 group-hover:px-4 group-hover:justify-start group-hover:gap-3.5' : 'w-full py-3 px-4 gap-3.5'} ${activeTab === 'progress' ? 'text-slate-100 bg-sapius-azul/10 dark:bg-sapius-naranja border-l-4 border-sapius-azul shadow-sm shadow-sapius-azul/5 font-bold' : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]'}`}
                >
                  <svg className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${activeTab === 'progress' ? 'text-sapius-azul' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20V10" />
                    <path d="M18 20V4" />
                    <path d="M6 20v-4" />
                  </svg>
                  <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                    Progreso de Lecciones
                  </span>
                </button>

                <button 
                  id="btn-nav-homework"
                  onClick={() => { setActiveTab('homework'); }}
                  className={`flex items-center rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 shrink-0 cursor-pointer ${isSidebarCollapsed ? 'w-10 h-10 md:w-11 md:h-11 justify-center p-0 mx-auto group-hover:w-full group-hover:h-auto group-hover:py-3 group-hover:px-4 group-hover:justify-start group-hover:gap-3.5' : 'w-full py-3 px-4 gap-3.5'} ${activeTab === 'homework' ? 'text-slate-100 bg-sapius-azul/10 dark:bg-sapius-naranja border-l-4 border-sapius-azul shadow-sm shadow-sapius-azul/5 font-bold' : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]'}`}
                >
                  <svg className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${activeTab === 'homework' ? 'text-sapius-azul' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                    Mis Tareas
                  </span>
                </button>

                <button 
                  id="btn-nav-calendar"
                  onClick={() => { setActiveTab('calendar'); }}
                  className={`flex items-center rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 shrink-0 cursor-pointer ${isSidebarCollapsed ? 'w-10 h-10 md:w-11 md:h-11 justify-center p-0 mx-auto group-hover:w-full group-hover:h-auto group-hover:py-3 group-hover:px-4 group-hover:justify-start group-hover:gap-3.5' : 'w-full py-3 px-4 gap-3.5'} ${activeTab === 'calendar' ? 'text-slate-100 bg-sapius-azul/10 dark:bg-sapius-naranja border-l-4 border-sapius-azul shadow-sm shadow-sapius-azul/5 font-bold' : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]'}`}
                >
                  <svg className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${activeTab === 'calendar' ? 'text-sapius-azul' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                    Calendario
                  </span>
                </button>

                <button 
                  id="btn-nav-grades"
                  onClick={() => { setActiveTab('grades'); }}
                  className={`flex items-center rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 shrink-0 cursor-pointer ${isSidebarCollapsed ? 'w-10 h-10 md:w-11 md:h-11 justify-center p-0 mx-auto group-hover:w-full group-hover:h-auto group-hover:py-3 group-hover:px-4 group-hover:justify-start group-hover:gap-3.5' : 'w-full py-3 px-4 gap-3.5'} ${activeTab === 'grades' ? 'text-slate-100 bg-sapius-azul/10 dark:bg-sapius-naranja border-l-4 border-sapius-azul shadow-sm shadow-sapius-azul/5 font-bold' : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]'}`}
                >
                  <svg className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${activeTab === 'grades' ? 'text-sapius-azul' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                    Calificaciones
                  </span>
                </button>
              </>
            )}

            <button 
              id="btn-nav-support"
              onClick={() => { setActiveTab('support'); }}
              className={`flex items-center rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 shrink-0 cursor-pointer ${isSidebarCollapsed ? 'w-10 h-10 md:w-11 md:h-11 justify-center p-0 mx-auto group-hover:w-full group-hover:h-auto group-hover:py-3 group-hover:px-4 group-hover:justify-start group-hover:gap-3.5' : 'w-full py-3 px-4 gap-3.5'} ${activeTab === 'support' ? 'text-slate-100 bg-sapius-azul/10 dark:bg-sapius-naranja border-l-4 border-sapius-azul shadow-sm shadow-sapius-azul/5 font-bold' : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]'}`}
            >
              <svg className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${activeTab === 'support' ? 'text-sapius-azul' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 .7 2.81" />
              </svg>
              <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                Soporte
              </span>
            </button>

            <button 
              id="btn-nav-profile"
              onClick={() => { setActiveTab('profile'); }}
              className={`flex items-center rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 shrink-0 cursor-pointer ${isSidebarCollapsed ? 'w-10 h-10 md:w-11 md:h-11 justify-center p-0 mx-auto group-hover:w-full group-hover:h-auto group-hover:py-3 group-hover:px-4 group-hover:justify-start group-hover:gap-3.5' : 'w-full py-3 px-4 gap-3.5'} ${activeTab === 'profile' ? 'text-slate-100 bg-sapius-azul/10 dark:bg-sapius-naranja border-l-4 border-sapius-azul shadow-sm shadow-sapius-azul/5 font-bold' : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]'}`}
            >
              <svg className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${activeTab === 'profile' ? 'text-sapius-azul' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                Mi Cuenta
              </span>
            </button>
          </nav>
 
          <div className="flex flex-col border-t border-white/5 pt-5 mt-auto gap-3">
            <div className={`flex items-center gap-2 text-[10px] text-slate-500 font-medium ${isSidebarCollapsed ? 'justify-center group-hover:justify-start px-2' : 'px-2'}`}>
              <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] flex-shrink-0"></span>
              <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                MAC: {macAddress}
              </span>
            </div>
            
            <button 
              id="btn-nav-theme"
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-all duration-300 ${isSidebarCollapsed ? 'w-10 h-10 md:w-11 md:h-11 p-0 mx-auto group-hover:w-full group-hover:h-auto group-hover:py-2.5 group-hover:px-4 group-hover:gap-3.5' : 'w-full py-2.5 px-4 gap-3.5'}`}
              title={theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
              <span className={`inline-block transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[150px]' : 'opacity-100 max-w-[150px]'}`}>
                {theme === 'dark' ? 'Tema Claro' : 'Tema Oscuro'}
              </span>
            </button>

            <button 
              onClick={handleLogout}
              className={`bg-rose-600/10 hover:bg-rose-600 border border-rose-500/10 text-rose-400 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-all duration-300 ${isSidebarCollapsed ? 'w-10 h-10 md:w-11 md:h-11 p-0 mx-auto group-hover:w-full group-hover:h-auto group-hover:py-2.5 group-hover:px-4 group-hover:gap-3.5' : 'w-full py-2.5 px-4 gap-3.5'}`}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
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
              {activeTab === 'profile' && 'Mi Cuenta'}
            </h1>
            <div className="flex items-center gap-4">
              {/* Tutorial Button */}
              <button
                id="btn-trigger-tutorial"
                onClick={() => setShowTutorial(true)}
                className="flex items-center gap-2 py-2 px-3 text-text-muted hover:text-text-white bg-bg-slate-900 border border-border-main rounded-xl transition-all cursor-pointer text-xs font-bold shadow-sm"
                title="Ver Tutorial de Inicio"
              >
                ❓ <span className="hidden sm:inline">Ver Tutorial</span>
              </button>

              {/* Notification Popover Dropdown Button */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl transition-all cursor-pointer"
                  title="Notificaciones"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.filter(n => !n.read_at).length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-sapius-naranja rounded-full ring-2 ring-slate-950 animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/5 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Avisos y Alertas</span>
                      <button 
                        onClick={clearAllNotifications}
                        className="text-[10px] font-bold text-sapius-azul hover:underline cursor-pointer"
                      >
                        Marcar todo leído
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2.5">
                      {notifications.length === 0 ? (
                        <div className="text-[11px] text-slate-500 text-center py-4">No tienes notificaciones por el momento.</div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              if (!notif.read_at) markNotificationAsRead(notif.id);
                            }}
                            className={`p-2.5 rounded-xl border text-[11px] transition-all cursor-pointer ${
                              notif.read_at 
                                ? 'bg-slate-950/20 border-white/5 text-slate-400' 
                                : 'bg-sapius-azul/5 border-sapius-azul/20 text-slate-200 hover:bg-sapius-azul/10'
                            }`}
                          >
                            <p className="font-medium leading-relaxed">{notif.data?.message || 'Nueva alerta de Sapius'}</p>
                            <span className="text-[9px] text-slate-500 block mt-1">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 bg-white/[0.01] border border-white/5 py-2 px-3 rounded-xl">
                {currentDate}
              </div>
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
                    onBackToCourses={() => { setSelectedCourse(null); setActiveLesson(null); setIsSidebarCollapsed(false); setPdfScale(1.1); }}
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
                    pdfDoc={pdfDoc}
                    onGoToPdfPage={(num) => setPdfPageNum(num)}
                    onLaunchInteractivePdf={(id) => setActiveInteractivePdfId(id)}
                    onDownloadInteractivePdfRaw={handleDownloadInteractivePdfRaw}
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
              <CalendarView 
                calendarSchedule={calendarSchedule} 
                weeklyCalendars={weeklyCalendars}
                serverUrl={currentServer}
                loading={loadingCalendar} 
                courseSelected={!!selectedCourse} 
              />
            )}

            {/* TABS 3.5: Grades */}
            {activeTab === 'grades' && (
              <GradesView 
                gradesData={gradesData} 
                loading={loadingGrades} 
                courseSelected={!!selectedCourse} 
              />
            )}

            {/* TABS 3.7: Course Progress Detailed */}
            {activeTab === 'progress' && (
              <CourseProgressView 
                progressData={courseProgressData} 
                loading={loadingCourseProgress} 
                courseSelected={!!selectedCourse} 
              />
            )}

            {/* TABS 4: Support */}
            {activeTab === 'support' && (
              <SupportView />
            )}

            {/* TABS 5: Profile View */}
            {activeTab === 'profile' && (
              <ProfileView serverUrl={currentServer} onProfileUpdated={loadDashboardData} />
            )}

          </div>
        </main>
        {renderStrikeWarning()}
        {showTutorial && (
          <InteractiveTutorial 
            customSteps={
              selectedCourse 
                ? [
                    {
                      selector: '#btn-trigger-tutorial',
                      title: '📖 Aula Virtual de Sapius',
                      description: 'Estás en la vista del curso. Sigue esta guía para conocer cómo navegar por las lecciones y actividades.',
                      placement: 'bottom'
                    },
                    {
                      selector: '.lesson-main',
                      title: '📺 Contenidos de Aprendizaje',
                      description: 'En esta sección principal verás el reproductor de video de la clase o el visor interactivo de PDF de estudio.',
                      placement: 'bottom'
                    },
                    {
                      selector: '.course-detail-header',
                      title: '📊 Progreso del Curso',
                      description: 'Monitorea tu avance general dentro de este plan de estudios en tiempo real.',
                      placement: 'bottom'
                    },
                    {
                      selector: '.modules-accordion',
                      title: '🗺️ Navegación de Clases',
                      description: 'Este menú te permite explorar los módulos completos del curso, ver tu avance y abrir otras clases del temario.',
                      placement: 'top'
                    },
                    {
                      selector: '#tutorial-exams-card',
                      title: '✍️ Evaluaciones de Clase',
                      description: 'Aquí encontrarás los exámenes de esta lección. Asegúrate de leer los límites de tiempo e intentos antes de iniciar.',
                      placement: 'top'
                    },
                    {
                      selector: '#tutorial-homework-card',
                      title: '📥 Entrega de Tareas',
                      description: 'Sube tus archivos resueltos (.pdf, .zip, .docx) en este apartado para que el docente califique tu desempeño.',
                      placement: 'top'
                    }
                  ]
                : null
            }
            activeTab={activeTab} 
            onSelectTab={setActiveTab} 
            onClose={() => setShowTutorial(false)} 
          />
        )}
      </div>
    );
  }



  // --- VIEW: Locked screen view ---
  if (currentView === 'locked') {
    return <LockedScreen onLogout={handleLogout} onUnlock={() => { setCurrentView('dashboard'); loadDashboardData(); }} />;
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
