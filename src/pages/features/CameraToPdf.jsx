import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { PDFDocument } from 'pdf-lib';
import { Camera, Download, Loader2, Check, RefreshCw } from 'lucide-react';
import { loadOpenCV, detectDocument } from '../../utils/cvScanner';
import { downloadPdf } from '../../utils/pdfHelpers';

const CameraToPdf = () => {
  const webcamRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [isCvLoaded, setIsCvLoaded] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [processedPhotoUrl, setProcessedPhotoUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    loadOpenCV().then(() => {
      setIsCvLoaded(true);
    }).catch(err => {
      console.error("OpenCV load error:", err);
      // Fallback
      setIsCvLoaded(true);
    });
  }, []);

  const capture = React.useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setPhoto(imageSrc);
    }
  }, [webcamRef]);

  const processImage = () => {
    if (!photo || !isCvLoaded || !imageRef.current || !canvasRef.current) return;
    
    try {
      detectDocument(imageRef.current, canvasRef.current);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
      setProcessedPhotoUrl(dataUrl);
    } catch (e) {
      console.error("Processing error", e);
      setProcessedPhotoUrl(photo); // fallback to original
    }
  };

  useEffect(() => {
    if (photo && imageRef.current) {
      // Need to wait for image to load before processing
      const img = imageRef.current;
      const doProcess = () => {
        // Beri jeda agar React bisa melakukan render UI "Loading" terlebih dahulu
        // sebelum OpenCV memonopoli CPU thread
        setTimeout(() => {
          processImage();
        }, 150);
      };
      
      if (img.complete) {
        doProcess();
      } else {
        img.onload = doProcess;
      }
    }
  }, [photo, isCvLoaded]);

  const generatePdf = async () => {
    if (!processedPhotoUrl) return;
    setIsProcessing(true);
    
    try {
      const pdfDoc = await PDFDocument.create();
      
      // Convert data URL to bytes
      const fetchResponse = await fetch(processedPhotoUrl);
      const imageBytes = await fetchResponse.arrayBuffer();
      
      const pdfImage = await pdfDoc.embedJpg(imageBytes);
      const { width, height } = pdfImage.scale(1);
      
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(pdfImage, { x: 0, y: 0, width, height });
      
      const pdfBytes = await pdfDoc.save();
      downloadPdf(pdfBytes, 'scanned-document.pdf');
      
      // Reset
      setPhoto(null);
      setProcessedPhotoUrl(null);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const retake = () => {
    setPhoto(null);
    setProcessedPhotoUrl(null);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Kamera ke PDF (Smart Scanner)</h2>
        <p className="text-gray-500 mt-1">Ambil foto dokumen. Tepi akan dideteksi dan dipotong otomatis.</p>
      </div>

      {!isCvLoaded ? (
        <div className="flex flex-col items-center py-20 text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
          <p>Memuat mesin pemindai pintar (OpenCV)...</p>
        </div>
      ) : !photo ? (
        <div className="flex flex-col items-center">
          <div className="rounded-xl overflow-hidden shadow-lg mb-6 border-4 border-gray-100 relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full max-w-2xl h-auto"
            />
            {/* Simple overlay guide */}
            <div className="absolute inset-0 border-4 border-emerald-500/30 m-8 rounded-lg pointer-events-none"></div>
          </div>
          
          <button
            onClick={capture}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-bold shadow-lg transition-transform hover:scale-105"
          >
            <Camera size={24} /> Ambil Gambar
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-500 mb-4 text-center">
            Hasil pindaian otomatis (auto-crop)
          </p>
          
          <div className="hidden">
            <img ref={imageRef} src={photo} alt="Original" crossOrigin="anonymous" />
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
          
          {processedPhotoUrl ? (
            <img src={processedPhotoUrl} alt="Processed" className="max-w-2xl w-full h-auto rounded-xl shadow-md border border-gray-200 mb-8" />
          ) : (
            <div className="h-64 w-full max-w-2xl flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-gray-200 mb-8">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
              <p className="text-gray-600 font-medium">Mendeteksi tepi & meluruskan dokumen...</p>
              <p className="text-xs text-gray-400 mt-2">Ini mungkin memakan waktu beberapa detik</p>
            </div>
          )}
          
          <div className="flex gap-4">
            <button
              onClick={retake}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <RefreshCw size={20} /> Ulangi
            </button>
            <button
              onClick={generatePdf}
              disabled={isProcessing || !processedPhotoUrl}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
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

export default CameraToPdf;
