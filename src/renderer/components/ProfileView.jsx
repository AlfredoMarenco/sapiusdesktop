import React, { useState, useEffect } from 'react';

export default function ProfileView({ serverUrl, onProfileUpdated }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [universidad, setUniversidad] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [password, setPassword] = useState('');

  // Files
  const [foto, setFoto] = useState(null);
  const [documentoId, setDocumentoId] = useState(null);
  const [pase, setPase] = useState(null);

  const getFullUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${serverUrl}${path}`;
  };

  // Previews
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await window.sapiusAPI.apiGet('/electron/profile');
      if (res && res.success) {
        const data = res.data;
        setProfileData(data);
        setNombre(data.nombre || '');
        setApellido(data.apellido || '');
        setTelefono(data.telefono || '');
        setUniversidad(data.universidad_procedencia || '');
        setEspecialidad(data.especialidad || '');
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Error al cargar los datos del perfil.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage({ text: '', type: '' });

      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('apellido', apellido);
      formData.append('telefono', telefono);
      formData.append('universidad_procedencia', universidad);
      formData.append('especialidad', especialidad);
      if (password) {
        formData.append('password', password);
      }
      if (foto) {
        formData.append('foto', foto);
      }
      if (documentoId) {
        formData.append('documento_identificacion', documentoId);
      }
      if (pase) {
        formData.append('pase_ingreso', pase);
      }

      const baseUrl = await window.sapiusAPI.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/electron/profile/update`, {
        method: 'POST',
        body: formData
      });
      const res = await response.json();
      if (res && res.success) {
        setMessage({ text: '¡Perfil actualizado exitosamente!', type: 'success' });
        setPassword('');
        setFoto(null);
        setDocumentoId(null);
        setPase(null);
        fetchProfile();
        if (onProfileUpdated) {
          onProfileUpdated();
        }
      } else {
        setMessage({ text: res.message || 'Error al actualizar el perfil.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Error de red al actualizar el perfil.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-sapius-azul rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-200">
      
      {message.text && (
        <div className={`p-4 rounded-xl text-xs sm:text-sm font-semibold border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-455'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: User basic info form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-white/5">
              Información de la Cuenta
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-400 mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sapius-azul/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-400 mb-1">Apellido</label>
                <input 
                  type="text" 
                  value={apellido} 
                  onChange={(e) => setApellido(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sapius-azul/50"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-400 mb-1">Correo Electrónico (Solo Lectura)</label>
                <input 
                  type="email" 
                  value={profileData?.email || ''} 
                  disabled
                  className="w-full py-2.5 px-3 bg-slate-950/20 border border-white/5 rounded-xl text-slate-500 text-xs sm:text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-400 mb-1">Teléfono</label>
                <input 
                  type="text" 
                  value={telefono} 
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sapius-azul/50"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-400 mb-1">Universidad de Procedencia</label>
                <input 
                  type="text" 
                  value={universidad} 
                  onChange={(e) => setUniversidad(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sapius-azul/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-400 mb-1">Especialidad de Interés</label>
                <input 
                  type="text" 
                  value={especialidad} 
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sapius-azul/50"
                />
              </div>

              <div className="sm:col-span-2 mt-2">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-400 mb-1">Nueva Contraseña (Dejar vacío para conservar actual)</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full py-2.5 px-3 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sapius-azul/50"
                />
              </div>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-3 px-6 bg-sapius-azul hover:bg-sapius-azul/80 disabled:bg-sapius-azul/40 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-[0.99] cursor-pointer text-center"
          >
            {submitting ? 'Guardando Cambios...' : 'Guardar Datos del Perfil'}
          </button>
        </div>

        {/* RIGHT COLUMN: Documents checklist & upload slots */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-white/5">
              Expediente Digital
            </h3>

            {/* Profile Pic Display */}
            {profileData?.foto_url && (
              <div className="flex justify-center mb-6">
                <div className="relative group cursor-pointer" onClick={() => { setPreviewUrl(getFullUrl(profileData.foto_url)); setPreviewType('image'); }}>
                  <img 
                    src={getFullUrl(profileData.foto_url)} 
                    className="w-24 h-24 rounded-full object-cover border-2 border-sapius-azul/30 shadow-lg hover:border-sapius-azul/60 transition-all" 
                    alt="Foto de perfil" 
                  />
                  <div className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Ampliar</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              
              {/* Profile Pic Upload */}
              <div className="border border-white/5 rounded-2xl p-4 bg-slate-950/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-350">Fotografía Infantil</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    profileData?.foto ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-455 border border-rose-500/20'
                  }`}>
                    {profileData?.foto ? 'Cargado' : 'Pendiente'}
                  </span>
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setFoto(e.target.files[0])}
                  className="w-full text-[10px] text-slate-400 file:mr-2.5 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer"
                />
              </div>

              {/* ID Identification Upload */}
              <div className="border border-white/5 rounded-2xl p-4 bg-slate-950/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-350">Identificación Oficial</span>
                  <div className="flex items-center gap-2">
                    {profileData?.documento_url && (
                      <button
                        type="button"
                        onClick={() => {
                          const isPdf = profileData.documento_identificacion.toLowerCase().endsWith('.pdf');
                          setPreviewUrl(getFullUrl(profileData.documento_url));
                          setPreviewType(isPdf ? 'pdf' : 'image');
                        }}
                        className="text-[9px] px-2 py-0.5 rounded-full bg-sapius-azul/10 hover:bg-sapius-azul/20 text-sapius-azul border border-sapius-azul/20 font-bold uppercase cursor-pointer transition-colors"
                      >
                        Ver Preview
                      </button>
                    )}
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      profileData?.documento_identificacion ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-455 border border-rose-500/20'
                    }`}>
                      {profileData?.documento_identificacion ? 'Cargado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setDocumentoId(e.target.files[0])}
                  className="w-full text-[10px] text-slate-400 file:mr-2.5 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer"
                />
              </div>

              {/* Entry Pass Upload */}
              <div className="border border-white/5 rounded-2xl p-4 bg-slate-950/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-350">Pase de Ingreso</span>
                  <div className="flex items-center gap-2">
                    {profileData?.pase_url && (
                      <button
                        type="button"
                        onClick={() => {
                          const isPdf = profileData.pase_ingreso.toLowerCase().endsWith('.pdf');
                          setPreviewUrl(getFullUrl(profileData.pase_url));
                          setPreviewType(isPdf ? 'pdf' : 'image');
                        }}
                        className="text-[9px] px-2 py-0.5 rounded-full bg-sapius-azul/10 hover:bg-sapius-azul/20 text-sapius-azul border border-sapius-azul/20 font-bold uppercase cursor-pointer transition-colors"
                      >
                        Ver Preview
                      </button>
                    )}
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      profileData?.pase_ingreso ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-455 border border-rose-500/20'
                    }`}>
                      {profileData?.pase_ingreso ? 'Cargado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setPase(e.target.files[0])}
                  className="w-full text-[10px] text-slate-400 file:mr-2.5 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer"
                />
              </div>

            </div>
          </div>
        </div>

      </form>

      {/* PREVIEW MODAL */}
      {previewUrl && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative">
            <button 
              type="button"
              onClick={() => { setPreviewUrl(null); setPreviewType(''); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold cursor-pointer transition-all"
            >
              ✕
            </button>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
              Vista Previa del Documento
            </h3>
            <div className="grow overflow-auto flex items-center justify-center bg-slate-950/40 rounded-2xl p-2 min-h-[400px]">
              {previewType === 'pdf' ? (
                <iframe src={previewUrl} className="w-full h-[60vh] border-0 rounded-xl" />
              ) : (
                <img src={previewUrl} className="max-w-full max-h-[60vh] object-contain rounded-xl" alt="Preview" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
