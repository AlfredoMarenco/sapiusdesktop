import React, { useState, useEffect, useRef } from 'react';

/**
 * Componente Overlay para contestar PDFs interactivos de Sapius.
 * Emula el comportamiento completo y la seguridad anti-plagio de viewer.blade.php.
 */
export default function InteractivePdfOverlay({ materialId, serverUrl, onClose }) {
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState(null);
  const [savedAnswers, setSavedAnswers] = useState({});
  const [fields, setFields] = useState([]);
  
  const [zoomScale, setZoomScale] = useState(1.25);
  const [isHighlighterMode, setIsHighlighterMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#0038a8'); // Default to blue ink
  const [highlights, setHighlights] = useState([]);
  const [inputValues, setInputValues] = useState({}); // { [fieldName]: { value, color } }
  
  // Security / Anti-plagiarism
  const [isBlurred, setIsBlurred] = useState(false);
  const [strikeCount, setStrikeCount] = useState(0);
  const maxStrikes = 5;

  const pdfDocRef = useRef(null);
  const viewerContainerRef = useRef(null);

  // Load material details
  useEffect(() => {
    const fetchMaterialDetails = async () => {
      try {
        setLoading(true);
        const res = await window.sapiusAPI.apiGet(`/electron/material-pdfs/${materialId}/show`);
        if (res && res.success) {
          const mat = res.data.material;
          const resp = res.data.respuesta;
          
          setMaterial(mat);
          setFields(mat.fields_config || []);
          
          const rawAnswers = resp?.respuestas || {};
          if (rawAnswers.inputs) {
            setInputValues(rawAnswers.inputs);
            setHighlights(rawAnswers.highlights || []);
            setSelectedColor(rawAnswers.color || '#0038a8');
          } else {
            // Retrocompatibility
            setInputValues(rawAnswers);
          }
        }
      } catch (err) {
        console.error("Error loading material details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterialDetails();
  }, [materialId]);

  // Load and Render PDF pages using PDF.js
  useEffect(() => {
    if (loading || !material) return;

    const renderPdf = async () => {
      try {
        const pdfUrl = `${serverUrl}/api/electron/material-pdfs/${materialId}/download-raw`;
        const response = await fetch(pdfUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const pdfDoc = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pdfDocRef.current = pdfDoc;
        renderAllPages(pdfDoc);
      } catch (err) {
        console.error("Error rendering PDF:", err);
      }
    };

    renderPdf();
  }, [loading, material, zoomScale]);

  const renderAllPages = async (pdfDoc) => {
    if (!viewerContainerRef.current) return;
    viewerContainerRef.current.innerHTML = ''; // Clear container

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      await renderPage(pdfDoc, pageNum);
    }
  };

  const renderPage = async (pdfDoc, pageNum) => {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: zoomScale });

    // Page wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'relative mb-6 shadow-2xl bg-white rounded-lg overflow-hidden border border-white/5 select-none mx-auto';
    wrapper.style.width = `${viewport.width}px`;
    wrapper.style.height = `${viewport.height}px`;

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    wrapper.appendChild(canvas);

    // Overlay container for interactive items
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 z-10';
    overlay.id = `page-overlay-${pageNum}`;
    overlay.dataset.pageNum = pageNum;
    wrapper.appendChild(overlay);

    // Render page
    const renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport: viewport
    };
    await page.render(renderContext).promise;

    viewerContainerRef.current.appendChild(wrapper);
  };

  // Render fields and highlights over pages after DOM is generated
  useEffect(() => {
    if (loading || !material || !pdfDocRef.current) return;

    // Render interactive inputs
    fields.forEach(field => {
      const pageOverlay = document.getElementById(`page-overlay-${field.page}`);
      if (!pageOverlay) return;

      // Check if text area already exists
      let textarea = document.getElementById(`input-${field.name}`);
      if (!textarea) {
        textarea = document.createElement('textarea');
        textarea.id = `input-${field.name}`;
        textarea.className = 'absolute z-20 bg-amber-500/10 border border-amber-500/40 rounded px-1 text-slate-800 outline-none transition-all focus:bg-white focus:border-blue-500 resize-none overflow-y-auto whitespace-pre-wrap break-words';
        
        // Initial value & color
        const savedData = inputValues[field.name];
        let val = '';
        let col = '#0038a8';
        if (savedData) {
          if (typeof savedData === 'object') {
            val = savedData.value || '';
            col = savedData.color || '#0038a8';
          } else {
            val = savedData;
          }
        }
        textarea.value = val;
        textarea.style.color = col;
        textarea.dataset.color = col;

        // Sync values to local react state on type
        textarea.addEventListener('input', (e) => {
          const value = e.target.value;
          setInputValues(prev => ({
            ...prev,
            [field.name]: {
              value: value,
              color: textarea.dataset.color || '#0038a8'
            }
          }));
        });

        // Ink color dot selector element inside container
        const colorSelector = document.createElement('div');
        colorSelector.className = 'absolute z-30 flex gap-1 opacity-0 hover:opacity-100 transition-opacity bg-slate-900/90 border border-white/10 rounded px-1.5 py-0.5 pointer-events-auto';
        
        // Dynamic positioning of color selector right next to the textarea
        const fieldY = parseFloat(field.y);
        const fieldH = parseFloat(field.height);
        colorSelector.style.left = `${(parseFloat(field.x) + parseFloat(field.width)) * zoomScale - 45}px`;
        colorSelector.style.top = `${(fieldY + fieldH) * zoomScale + 2}px`;

        const blackDot = document.createElement('span');
        blackDot.className = 'w-3 h-3 rounded-full cursor-pointer border border-white/30 bg-black';
        blackDot.addEventListener('click', (e) => {
          e.stopPropagation();
          textarea.style.color = '#000000';
          textarea.dataset.color = '#000000';
          setInputValues(prev => ({
            ...prev,
            [field.name]: {
              ...prev[field.name],
              color: '#000000'
            }
          }));
        });

        const blueDot = document.createElement('span');
        blueDot.className = 'w-3 h-3 rounded-full cursor-pointer border border-white/30 bg-blue-700';
        blueDot.addEventListener('click', (e) => {
          e.stopPropagation();
          textarea.style.color = '#0038a8';
          textarea.dataset.color = '#0038a8';
          setInputValues(prev => ({
            ...prev,
            [field.name]: {
              ...prev[field.name],
              color: '#0038a8'
            }
          }));
        });

        colorSelector.appendChild(blackDot);
        colorSelector.appendChild(blueDot);

        pageOverlay.appendChild(textarea);
        pageOverlay.appendChild(colorSelector);
      }

      // Update positions for zoom scale
      textarea.style.left = `${parseFloat(field.x) * zoomScale}px`;
      textarea.style.top = `${parseFloat(field.y) * zoomScale}px`;
      textarea.style.width = `${parseFloat(field.width) * zoomScale}px`;
      textarea.style.height = `${parseFloat(field.height) * zoomScale}px`;
      
      const fieldHeight = parseFloat(field.height);
      if (fieldHeight < 30) {
        textarea.style.fontSize = `${Math.min(13, Math.max(10, fieldHeight * 0.45 * zoomScale))}px`;
      } else {
        textarea.style.fontSize = `${Math.min(15, Math.max(11, 11 * zoomScale))}px`;
      }
    });

    // Render Highlights
    document.querySelectorAll('.pdf-highlight').forEach(el => el.remove());
    highlights.forEach(hl => {
      const pageOverlay = document.getElementById(`page-overlay-${hl.page}`);
      if (!pageOverlay) return;

      const element = document.createElement('div');
      element.className = 'absolute bg-yellow-500/35 border border-yellow-500/10 rounded pointer-events-auto pdf-highlight cursor-pointer hover:bg-red-500/40 z-15';
      element.style.left = `${hl.x * zoomScale}px`;
      element.style.top = `${hl.y * zoomScale}px`;
      element.style.width = `${hl.width * zoomScale}px`;
      element.style.height = `${hl.height * zoomScale}px`;

      // Click highlight to remove in marcatexto mode
      element.addEventListener('click', (e) => {
        if (isHighlighterMode) {
          e.stopPropagation();
          element.remove();
          setHighlights(prev => prev.filter(h => h.id !== hl.id));
        }
      });

      pageOverlay.appendChild(element);
    });

  }, [loading, material, fields, highlights, zoomScale, isHighlighterMode]);

  // Handle Highlighter mouse drawing
  useEffect(() => {
    if (loading || !material || !isHighlighterMode) return;

    let isDrawing = false;
    let startX, startY;
    let currentHighlight = null;
    let activeOverlay = null;

    const handleMouseDown = (e) => {
      if (!isHighlighterMode) return;
      
      const overlay = e.currentTarget;
      if (e.target !== overlay) return; // Must click overlay directly
      
      isDrawing = true;
      activeOverlay = overlay;
      const rect = overlay.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;

      currentHighlight = document.createElement('div');
      currentHighlight.className = 'absolute bg-yellow-400/40 border border-yellow-500/20 rounded z-15 pointer-events-none';
      currentHighlight.style.left = `${startX}px`;
      currentHighlight.style.top = `${startY}px`;
      overlay.appendChild(currentHighlight);
    };

    const handleMouseMove = (e) => {
      if (!isDrawing || !currentHighlight || !activeOverlay) return;

      const rect = activeOverlay.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(startX - currentX);
      const height = Math.abs(startY - currentY);

      currentHighlight.style.left = `${x}px`;
      currentHighlight.style.top = `${y}px`;
      currentHighlight.style.width = `${width}px`;
      currentHighlight.style.height = `${height}px`;
    };

    const handleMouseUp = () => {
      if (!isDrawing || !currentHighlight || !activeOverlay) return;
      isDrawing = false;

      const pageNum = parseInt(activeOverlay.dataset.pageNum);
      const left = parseFloat(currentHighlight.style.left);
      const top = parseFloat(currentHighlight.style.top);
      const width = parseFloat(currentHighlight.style.width);
      const height = parseFloat(currentHighlight.style.height);

      if (width > 5 && height > 5) {
        const highlightId = `hl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Save relative coordinates at scale = 1.0
        setHighlights(prev => [
          ...prev,
          {
            id: highlightId,
            page: pageNum,
            x: left / zoomScale,
            y: top / zoomScale,
            width: width / zoomScale,
            height: height / zoomScale
          }
        ]);
      } else {
        currentHighlight.remove();
      }

      currentHighlight = null;
      activeOverlay = null;
    };

    // Attach to all page overlays
    const overlays = document.querySelectorAll('[id^="page-overlay-"]');
    overlays.forEach(overlay => {
      overlay.addEventListener('mousedown', handleMouseDown);
    });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      overlays.forEach(overlay => {
        overlay.removeEventListener('mousedown', handleMouseDown);
      });
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [loading, material, isHighlighterMode, zoomScale]);

  // Anti-Plagiarism Security Listeners (Desactivados por solicitud)
  useEffect(() => {
    const handleBlur = () => setIsBlurred(false);
    const handleFocus = () => setIsBlurred(false);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [strikeCount]);

  const triggerStrike = async (reason) => {
    const nextStrike = strikeCount + 1;
    setStrikeCount(nextStrike);
    alert(`[ADVERTENCIA ANTI-PLAGIO]\nStrike ${nextStrike}/${maxStrikes}: ${reason}`);
    
    // Register strike on Laravel server
    if (window.sapiusAPI) {
      await window.sapiusAPI.apiPost('/register-strike', {
        action: 'Restricted Key / Modifier',
        details: `Interactive PDF Mode - ${reason}`
      });
    }

    if (nextStrike >= maxStrikes) {
      alert("Límite de strikes excedido. Saliendo de la clase por seguridad.");
      onClose();
    }
  };

  // Save Answers to Laravel
  const handleSaveAnswers = async () => {
    try {
      const payload = {
        inputs: inputValues,
        highlights: highlights,
        color: selectedColor
      };
      
      const res = await window.sapiusAPI.apiPost(`/electron/material-pdfs/${materialId}/save-answers`, {
        respuestas: payload
      });

      if (res && res.success) {
        alert("Respuestas guardadas exitosamente.");
      } else {
        alert("Error al guardar respuestas.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al guardar.");
    }
  };

  // Compile filled PDF using pdf-lib on client and download
  const handleDownloadResolved = async () => {
    try {
      // Fetch original PDF bytes
      const pdfUrl = `${serverUrl}/api/electron/material-pdfs/${materialId}/download-raw`;
      const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());

      // Load PDF via pdf-lib
      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      // Helper to convert hex to RGB
      const hexToRgb = (hex) => {
        if (!hex) return { r: 0.0, g: 0.0, b: 0.0 };
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        return result ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255
        } : { r: 0.0, g: 0.0, b: 0.0 };
      };

      // Helper to split text for pdf-lib text wrapping
      const getWrappedLines = (textStr, font, fontSize, maxWidth) => {
        const rawParagraphs = textStr.split(/\r?\n/);
        const resultLines = [];

        rawParagraphs.forEach(para => {
          if (!para.trim()) {
            resultLines.push('');
            return;
          }
          const words = para.split(' ');
          let currentLine = '';

          words.forEach(word => {
            const testLine = currentLine ? (currentLine + ' ' + word) : word;
            let testWidth = 0;
            try {
              testWidth = font.widthOfTextAtSize(testLine, fontSize);
            } catch (e) {
              testWidth = testLine.length * (fontSize * 0.5);
            }
            if (testWidth <= maxWidth || !currentLine) {
              currentLine = testLine;
            } else {
              resultLines.push(currentLine);
              currentLine = word;
            }
          });
          if (currentLine) {
            resultLines.push(currentLine);
          }
        });

        return resultLines;
      };

      // Burn Highlights
      highlights.forEach(hl => {
        const pageIndex = hl.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) return;

        const page = pages[pageIndex];
        const pdfY = page.getHeight() - (parseFloat(hl.y) + parseFloat(hl.height));

        page.drawRectangle({
          x: parseFloat(hl.x),
          y: pdfY,
          width: parseFloat(hl.width),
          height: parseFloat(hl.height),
          color: rgb(1.0, 1.0, 0.0), // Yellow highlighter
          opacity: 0.35
        });
      });

      // Burn inputs text
      fields.forEach(field => {
        const ans = inputValues[field.name];
        if (!ans) return;

        const text = typeof ans === 'object' ? (ans.value || '') : (ans || '');
        if (!text.trim()) return;

        const pageIndex = field.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) return;

        const page = pages[pageIndex];
        const fieldH = parseFloat(field.height);
        
        let pdfFontSize = 10;
        if (fieldH < 30) {
          pdfFontSize = Math.min(12, Math.max(9, fieldH * 0.48));
        } else {
          pdfFontSize = Math.min(11, Math.max(9, 10));
        }
        const lineHeight = pdfFontSize * 1.25;

        const colorHex = typeof ans === 'object' ? (ans.color || '#0038a8') : '#0038a8';
        const color = hexToRgb(colorHex);

        const lines = getWrappedLines(text, helveticaFont, pdfFontSize, parseFloat(field.width) - 6);

        lines.forEach((line, index) => {
          const lineY = page.getHeight() - (parseFloat(field.y) + pdfFontSize + 3 + (index * lineHeight));
          page.drawText(line, {
            x: parseFloat(field.x) + 3,
            y: lineY,
            size: pdfFontSize,
            font: helveticaFont,
            color: rgb(color.r, color.g, color.b)
          });
        });
      });

      // Save PDF bytes and download locally
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${material.titulo}_resuelto.pdf`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Error al compilar y descargar el PDF.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 overflow-hidden">
      {/* Header bar */}
      <header className="flex justify-between items-center py-4 px-6 border-b border-white/5 bg-slate-900/60 select-none">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white">
            Material: {material?.titulo || 'Cargando...'}
          </h2>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
            PDF Interactivo
          </span>
        </div>
        
        {/* Tools bar */}
        {!loading && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsHighlighterMode(!isHighlighterMode)}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${isHighlighterMode ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-white/5 text-amber-400 hover:bg-white/10'}`}
            >
              🖍️ Marcatextos
            </button>
            <button 
              onClick={() => {
                if (window.confirm('¿Deseas limpiar todos los resaltados?')) setHighlights([]);
              }}
              className="py-1.5 px-3 rounded-lg text-xs font-bold bg-white/5 text-rose-400 hover:bg-white/10 cursor-pointer"
            >
              🧹 Limpiar Marcados
            </button>
            <div className="flex border border-white/10 rounded-lg overflow-hidden shrink-0">
              <button 
                onClick={() => setZoomScale(s => Math.max(0.7, s - 0.15))}
                className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs cursor-pointer"
              >
                - Zoom
              </button>
              <button 
                onClick={() => setZoomScale(s => Math.min(2.5, s + 0.15))}
                className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs border-l border-white/10 cursor-pointer"
              >
                + Zoom
              </button>
            </div>
            
            <button 
              onClick={handleSaveAnswers}
              className="py-1.5 px-4 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-pointer"
            >
              💾 Guardar Respuestas
            </button>
            <button 
              onClick={handleDownloadResolved}
              className="py-1.5 px-4 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer"
            >
              📥 Descargar Resuelto
            </button>
            <button 
              onClick={onClose}
              className="py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
            >
              ✕ Cerrar
            </button>
          </div>
        )}
      </header>

      {/* Main content scrollarea */}
      <main className="grow overflow-auto p-6 flex flex-col items-center">
        {loading ? (
          <div className="my-auto text-center text-slate-500 text-xs sm:text-sm">
            <div className="w-6 h-6 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
            Cargando material interactivo...
          </div>
        ) : (
          <div 
            ref={viewerContainerRef}
            className={`w-full max-w-5xl transition-all duration-350 select-none ${isBlurred ? 'blur-3xl opacity-5 pointer-events-none' : 'blur-none opacity-100 pointer-events-auto'}`}
          >
            {/* Canvases and overlays will be dynamically rendered here */}
          </div>
        )}
      </main>
      
      {/* Blurred background security notification */}
      {isBlurred && !loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="bg-slate-900 border border-red-500/25 p-6 rounded-2xl max-w-md text-center shadow-2xl">
            <span className="text-4xl block mb-3 animate-pulse">🔒</span>
            <h3 className="text-white font-bold text-sm sm:text-base">Documento Protegido</h3>
            <p className="text-xs text-slate-400 mt-2">
              Haz clic dentro de la ventana de la aplicación para volver a enfocar y mostrar el contenido del PDF interactivo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
