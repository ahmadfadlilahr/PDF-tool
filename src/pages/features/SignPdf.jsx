import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import SignaturePad from 'react-signature-canvas';
import Draggable from 'react-draggable';
import * as pdfjsLib from 'pdfjs-dist';
import { Download, UploadCloud, X, Loader2, File, Edit3, Trash2, Image as ImageIcon, PenTool, ChevronLeft, ChevronRight } from 'lucide-react';
import { downloadPdf } from '../../utils/pdfHelpers';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const SignPdf = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signMode, setSignMode] = useState('draw'); // 'draw' or 'upload'
  const [uploadedSignature, setUploadedSignature] = useState(null);
  const [finalSignatureUrl, setFinalSignatureUrl] = useState(null);
  
  // PDF Preview State
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfRenderScale, setPdfRenderScale] = useState(1);
  const [pdfPageDimensions, setPdfPageDimensions] = useState({ width: 0, height: 0 });
  const [sigPosition, setSigPosition] = useState({ x: 50, y: 50 });
  
  const canvasRef = useRef(null);
  const sigPad = useRef({});
  const pdfDocumentRef = useRef(null);
  const draggableRef = useRef(null);

  const onDropPdf = useCallback(async (acceptedFiles) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      setCurrentPage(1);
      // Load PDF for preview
      try {
        const fileUrl = URL.createObjectURL(acceptedFiles[0]);
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        pdfDocumentRef.current = pdf;
        setPdfNumPages(pdf.numPages);
      } catch (err) {
        console.error("Error loading PDF preview", err);
      }
    }
  }, []);

  const onDropSignature = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) {
      const imgFile = acceptedFiles[0];
      setUploadedSignature(Object.assign(imgFile, {
        preview: URL.createObjectURL(imgFile)
      }));
    }
  }, []);

  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps, isDragActive: isPdfDragActive } = useDropzone({
    onDrop: onDropPdf,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });
  
  const { getRootProps: getSigRootProps, getInputProps: getSigInputProps, isDragActive: isSigDragActive } = useDropzone({
    onDrop: onDropSignature,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxFiles: 1,
    noClick: uploadedSignature !== null
  });

  // Render PDF Page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocumentRef.current || !canvasRef.current || !finalSignatureUrl) return;
      
      try {
        const page = await pdfDocumentRef.current.getPage(currentPage);
        
        // Calculate scale to fit container (max width 600px for preview)
        const unscaledViewport = page.getViewport({ scale: 1 });
        const containerWidth = Math.min(window.innerWidth - 64, 800); 
        const scale = containerWidth / unscaledViewport.width;
        setPdfRenderScale(scale);
        
        const viewport = page.getViewport({ scale });
        setPdfPageDimensions({ width: viewport.width, height: viewport.height });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
      } catch (err) {
        console.error("Error rendering page", err);
      }
    };
    
    renderPage();
  }, [currentPage, finalSignatureUrl]);

  const clearSignature = () => {
    if (sigPad.current && sigPad.current.clear) sigPad.current.clear();
  };

  const clearUploadedSignature = () => {
    setUploadedSignature(null);
  };

  const confirmSignature = () => {
    try {
      if (signMode === 'draw') {
        if (!sigPad.current || typeof sigPad.current.isEmpty !== 'function') {
          console.error("SignaturePad ref is invalid", sigPad.current);
          alert("Error internal: SignaturePad belum siap.");
          return;
        }
        if (sigPad.current.isEmpty()) {
          alert("Gambar tanda tangan terlebih dahulu.");
          return;
        }
        
        const canvas = sigPad.current.getCanvas();
        if (!canvas) {
          alert("Gagal memotong area tanda tangan.");
          return;
        }
        
        setFinalSignatureUrl(canvas.toDataURL('image/png'));
      } else {
        if (!uploadedSignature) {
          alert("Unggah gambar terlebih dahulu.");
          return;
        }
        setFinalSignatureUrl(uploadedSignature.preview);
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  const handleDrag = (e, data) => {
    setSigPosition({ x: data.x, y: data.y });
  };

  const addSignature = async () => {
    if (!file || !finalSignatureUrl) return;
    setIsProcessing(true);
    
    try {
      const fileBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      
      const fetchResponse = await fetch(finalSignatureUrl);
      const signatureBytes = await fetchResponse.arrayBuffer();
      
      let signatureImageEmbed;
      try {
        signatureImageEmbed = await pdfDoc.embedPng(signatureBytes);
      } catch (e) {
        signatureImageEmbed = await pdfDoc.embedJpg(signatureBytes);
      }
      
      // Calculate signature size in PDF coordinates
      const sigImgElement = document.getElementById('draggable-sig');
      const visualSigWidth = sigImgElement.offsetWidth;
      const visualSigHeight = sigImgElement.offsetHeight;
      
      // Scale back to original PDF size
      const pdfSigWidth = visualSigWidth / pdfRenderScale;
      const pdfSigHeight = visualSigHeight / pdfRenderScale;
      
      const pdfX = sigPosition.x / pdfRenderScale;
      const pdfY = sigPosition.y / pdfRenderScale;
      
      const pages = pdfDoc.getPages();
      const targetPage = pages[currentPage - 1];
      const { height: pageHeight } = targetPage.getSize();
      
      // PDF coordinate system originates from Bottom-Left. DOM is Top-Left.
      // So PDF Y = PageHeight - DOM_Y - SignatureHeight
      const finalY = pageHeight - pdfY - pdfSigHeight;
      
      targetPage.drawImage(signatureImageEmbed, {
        x: pdfX,
        y: finalY,
        width: pdfSigWidth,
        height: pdfSigHeight,
      });
      
      const pdfBytesToSave = await pdfDoc.save();
      downloadPdf(pdfBytesToSave, `signed-${file.name}`);
    } catch (error) {
      console.error('Error signing PDF:', error);
      alert('Gagal menambahkan tanda tangan.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Tanda Tangan PDF Interaktif</h2>
        <p className="text-gray-500 mt-1">Gambar atau unggah tanda tangan Anda, lalu letakkan di posisi yang Anda inginkan.</p>
      </div>

      {!file ? (
        <div 
          {...getPdfRootProps()} 
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isPdfDragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'}`}
        >
          <input {...getPdfInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900">Tarik & Lepas PDF di sini</p>
          <p className="text-sm text-gray-500 mt-1">atau klik untuk memilih dokumen</p>
        </div>
      ) : !finalSignatureUrl ? (
        <div className="mt-4">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded text-red-600">
                <File size={24} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={() => { setFile(null); setFinalSignatureUrl(null); }}
              className="text-gray-400 hover:text-red-500 p-2 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                <button
                  onClick={() => setSignMode('draw')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-all ${signMode === 'draw' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <PenTool size={18} /> Gambar Langsung
                </button>
                <button
                  onClick={() => setSignMode('upload')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-all ${signMode === 'upload' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <ImageIcon size={18} /> Unggah Gambar
                </button>
              </div>
            </div>

            {signMode === 'draw' ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Gambar Tanda Tangan Anda</label>
                  <button onClick={clearSignature} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                    <Trash2 size={14} /> Bersihkan
                  </button>
                </div>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                  <SignaturePad 
                    ref={sigPad}
                    canvasProps={{className: "w-full h-48 cursor-crosshair"}}
                    penColor="black"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Gambar Tanda Tangan (PNG transparan disarankan)</label>
                {!uploadedSignature ? (
                  <div 
                    {...getSigRootProps()} 
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isSigDragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'}`}
                  >
                    <input {...getSigInputProps()} />
                    <UploadCloud className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Tarik & Lepas gambar di sini</p>
                  </div>
                ) : (
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50/50 p-4 flex flex-col items-center relative">
                    <img src={uploadedSignature.preview} alt="Tanda tangan" className="max-h-32 object-contain" />
                    <button 
                      onClick={clearUploadedSignature}
                      className="absolute top-2 right-2 bg-red-100 text-red-600 hover:bg-red-200 p-1.5 rounded-full transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={confirmSignature}
                className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Lanjut ke Penempatan &rarr;
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center">
          <p className="text-gray-700 font-medium mb-4 text-center">Geser gambar tanda tangan ke posisi yang Anda inginkan</p>
          
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-medium text-sm">Halaman {currentPage} dari {pdfNumPages}</span>
            <button 
              onClick={() => setCurrentPage(Math.min(pdfNumPages, currentPage + 1))}
              disabled={currentPage === pdfNumPages}
              className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div 
            className="relative border border-gray-300 shadow-md bg-gray-100 overflow-hidden select-none" 
            style={{ width: pdfPageDimensions.width, height: pdfPageDimensions.height }}
          >
            <canvas ref={canvasRef} className="absolute top-0 left-0" />
            
            <Draggable bounds="parent" position={sigPosition} onDrag={handleDrag} nodeRef={draggableRef}>
              <div ref={draggableRef} className="absolute cursor-move border border-dashed border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition-colors p-1" style={{ zIndex: 10 }}>
                <img 
                  id="draggable-sig"
                  src={finalSignatureUrl} 
                  alt="Signature" 
                  className="max-w-[150px] max-h-[100px] object-contain pointer-events-none"
                />
              </div>
            </Draggable>
          </div>

          <div className="mt-8 flex gap-4 w-full max-w-md">
            <button
              onClick={() => setFinalSignatureUrl(null)}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Ubah Tanda Tangan
            </button>
            <button
              onClick={addSignature}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <><Loader2 size={20} className="animate-spin" /> Memproses...</>
              ) : (
                <><Download size={20} /> Simpan PDF</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignPdf;
