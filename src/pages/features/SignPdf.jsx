import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import SignaturePad from 'react-signature-canvas';
import { Download, UploadCloud, X, Loader2, File, Edit3, Trash2, Image as ImageIcon, PenTool } from 'lucide-react';
import { downloadPdf } from '../../utils/pdfHelpers';

const SignPdf = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signMode, setSignMode] = useState('draw'); // 'draw' or 'upload'
  const [uploadedSignature, setUploadedSignature] = useState(null);
  
  const sigPad = useRef({});

  const onDropPdf = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) setFile(acceptedFiles[0]);
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

  const clearSignature = () => {
    if (sigPad.current && sigPad.current.clear) {
      sigPad.current.clear();
    }
  };

  const clearUploadedSignature = () => {
    setUploadedSignature(null);
  };

  const addSignature = async () => {
    if (!file) return;
    
    let signatureImageEmbed;
    let width, height;
    
    setIsProcessing(true);
    
    try {
      const fileBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      
      if (signMode === 'draw') {
        if (sigPad.current.isEmpty()) {
          alert("Silakan gambar tanda tangan Anda terlebih dahulu.");
          setIsProcessing(false);
          return;
        }
        // Get signature image as PNG base64
        const signatureDataUrl = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
        const signatureBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
        
        signatureImageEmbed = await pdfDoc.embedPng(signatureBytes);
        const scaled = signatureImageEmbed.scale(0.5); // scale it down
        width = scaled.width;
        height = scaled.height;
      } else {
        if (!uploadedSignature) {
          alert("Silakan unggah gambar tanda tangan Anda.");
          setIsProcessing(false);
          return;
        }
        const signatureBytes = await uploadedSignature.arrayBuffer();
        
        if (uploadedSignature.type === 'image/jpeg') {
          signatureImageEmbed = await pdfDoc.embedJpg(signatureBytes);
        } else {
          signatureImageEmbed = await pdfDoc.embedPng(signatureBytes);
        }
        
        // Scale to a reasonable size (e.g., max width 150px)
        const scaleFactor = 150 / signatureImageEmbed.width;
        width = signatureImageEmbed.width * scaleFactor;
        height = signatureImageEmbed.height * scaleFactor;
      }
      
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { width: pageWidth } = lastPage.getSize();
      
      // Place signature at the bottom right of the last page
      lastPage.drawImage(signatureImageEmbed, {
        x: pageWidth - width - 50,
        y: 50,
        width,
        height,
      });
      
      const pdfBytes = await pdfDoc.save();
      downloadPdf(pdfBytes, `signed-${file.name}`);
    } catch (error) {
      console.error('Error signing PDF:', error);
      alert('Gagal menambahkan tanda tangan. Pastikan gambar valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Tanda Tangan PDF</h2>
        <p className="text-gray-500 mt-1">Gambar secara langsung atau unggah gambar tanda tangan Anda.</p>
      </div>

      {!file ? (
        <div 
          {...getPdfRootProps()} 
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isPdfDragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'}`}
        >
          <input {...getPdfInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900">Tarik & Lepas PDF di sini</p>
          <p className="text-sm text-gray-500 mt-1">atau klik untuk memilih file utama</p>
        </div>
      ) : (
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
              onClick={() => setFile(null)}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Gambar Tanda Tangan (PNG disarankan)</label>
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
            
            <p className="text-xs text-gray-400 mt-3 text-center">
              Tanda tangan akan otomatis disesuaikan ukurannya dan diletakkan di sudut kanan bawah halaman terakhir.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={addSignature}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <><Loader2 size={20} className="animate-spin" /> Memproses...</>
              ) : (
                <><Edit3 size={20} /> Bubuhkan & Unduh</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignPdf;
