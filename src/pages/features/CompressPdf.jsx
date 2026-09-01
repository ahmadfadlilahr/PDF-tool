import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Download, UploadCloud, X, Loader2, Minimize2, File } from 'lucide-react';
import { downloadPdf } from '../../utils/pdfHelpers';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const CompressPdf = () => {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(0.5); // 0.1 to 1.0
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  const compressPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const fileUrl = URL.createObjectURL(file);
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      
      const newPdf = await PDFDocument.create();
      
      for (let i = 1; i <= numPages; i++) {
        setProgress(Math.round((i / numPages) * 100));
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // Use 1.5 scale for decent quality-size tradeoff
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        const imgDataUrl = canvas.toDataURL('image/jpeg', parseFloat(quality));
        
        // Convert to array buffer
        const res = await fetch(imgDataUrl);
        const imgBuffer = await res.arrayBuffer();
        
        const pdfImg = await newPdf.embedJpg(imgBuffer);
        const newPage = newPdf.addPage([viewport.width, viewport.height]);
        newPage.drawImage(pdfImg, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });
      }
      
      const compressedBytes = await newPdf.save();
      downloadPdf(compressedBytes, `compressed-${file.name}`);
      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error('Error compressing PDF:', error);
      alert('Gagal mengompresi PDF.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Kompresi PDF (Rasterize)</h2>
        <p className="text-gray-500 mt-1">Kecilkan ukuran file PDF Anda dengan mengubahnya menjadi gambar terkompresi. <br/><span className="text-orange-500 text-sm">Catatan: Teks tidak akan bisa disalin setelah dikompresi.</span></p>
      </div>

      {!file ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900">Tarik & Lepas PDF di sini</p>
          <p className="text-sm text-gray-500 mt-1">atau klik untuk memilih file</p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded text-orange-600">
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

          <div className="mb-8 p-6 border border-gray-200 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 mb-4 flex justify-between">
              <span>Kualitas Gambar</span>
              <span className="font-bold text-orange-600">{Math.round(quality * 100)}%</span>
            </label>
            <input 
              type="range" 
              min="0.1" max="1.0" step="0.1" 
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Ukuran Terkecil</span>
              <span>Kualitas Terbaik</span>
            </div>
          </div>

          {isProcessing && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6 overflow-hidden">
              <div className="bg-orange-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={compressPdf}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <><Loader2 size={20} className="animate-spin" /> Mengompresi {progress}%</>
              ) : (
                <><Minimize2 size={20} /> Mulai Kompresi</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompressPdf;
