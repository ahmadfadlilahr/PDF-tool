import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { PDFDocument } from 'pdf-lib';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera, Download, Loader2, RefreshCw, Scissors } from 'lucide-react';
import { downloadPdf } from '../../utils/pdfHelpers';

const CameraToPdf = () => {
  const webcamRef = useRef(null);
  const imgRef = useRef(null);
  
  const [photo, setPhoto] = useState(null);
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setPhoto(imageSrc);
      // Default crop taking most of the center
      setCrop({
        unit: '%',
        width: 80,
        height: 80,
        x: 10,
        y: 10
      });
    }
  }, [webcamRef]);

  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget;
  };

  const getCroppedImg = () => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
    setCroppedImageUrl(base64Image);
  };

  const generatePdf = async () => {
    const finalImage = croppedImageUrl || photo; // Use cropped if exists, otherwise raw
    if (!finalImage) return;
    
    setIsProcessing(true);
    
    try {
      const pdfDoc = await PDFDocument.create();
      
      const fetchResponse = await fetch(finalImage);
      const imageBytes = await fetchResponse.arrayBuffer();
      
      const pdfImage = await pdfDoc.embedJpg(imageBytes);
      const { width, height } = pdfImage.scale(1);
      
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(pdfImage, { x: 0, y: 0, width, height });
      
      const pdfBytes = await pdfDoc.save();
      downloadPdf(pdfBytes, 'scanned-document.pdf');
      
      // Reset
      setPhoto(null);
      setCroppedImageUrl(null);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const retake = () => {
    setPhoto(null);
    setCroppedImageUrl(null);
    setCompletedCrop(null);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Kamera ke PDF (Ringan)</h2>
        <p className="text-gray-500 mt-1">Ambil foto dokumen dan potong (crop) secara manual agar tidak membebani HP Anda.</p>
      </div>

      {!photo ? (
        <div className="flex flex-col items-center">
          <div className="rounded-xl overflow-hidden shadow-lg mb-6 border-4 border-gray-100 relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full max-w-2xl h-auto"
            />
          </div>
          
          <button
            onClick={capture}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-bold shadow-lg transition-transform hover:scale-105"
          >
            <Camera size={24} /> Ambil Gambar
          </button>
        </div>
      ) : !croppedImageUrl ? (
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-500 mb-4 text-center">
            Sesuaikan kotak pemotong pada dokumen Anda.
          </p>
          
          <div className="max-w-2xl w-full mb-8 rounded-xl overflow-hidden border border-gray-200">
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
            >
              <img src={photo} onLoad={onImageLoad} alt="Tangkapan" className="w-full h-auto" />
            </ReactCrop>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={retake}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <RefreshCw size={20} /> Ulangi
            </button>
            <button
              onClick={getCroppedImg}
              disabled={!completedCrop?.width || !completedCrop?.height}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Scissors size={20} /> Potong Gambar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-500 mb-4 text-center">Hasil akhir yang akan disimpan</p>
          <img src={croppedImageUrl} alt="Hasil crop" className="max-w-2xl w-full h-auto rounded-xl shadow-md border border-gray-200 mb-8" />
          
          <div className="flex gap-4">
            <button
              onClick={retake}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <RefreshCw size={20} /> Ambil Baru
            </button>
            <button
              onClick={generatePdf}
              disabled={isProcessing}
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
