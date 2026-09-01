import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { Download, UploadCloud, X, Loader2, GripVertical } from 'lucide-react';
import { downloadPdf } from '../../utils/pdfHelpers';

const ImageToPdf = () => {
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const newImages = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': []
    }
  });

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    
    try {
      const pdfDoc = await PDFDocument.create();
      
      for (const file of images) {
        const imageBytes = await file.arrayBuffer();
        let pdfImage;
        
        if (file.type === 'image/jpeg') {
          pdfImage = await pdfDoc.embedJpg(imageBytes);
        } else if (file.type === 'image/png') {
          pdfImage = await pdfDoc.embedPng(imageBytes);
        }
        
        if (pdfImage) {
          const { width, height } = pdfImage.scale(1);
          // A4 size roughly 595 x 842. We can scale image to fit or just use image dimension as page dimension.
          // For simplicity, let's make the page size equal to the image size.
          const page = pdfDoc.addPage([width, height]);
          page.drawImage(pdfImage, {
            x: 0,
            y: 0,
            width,
            height,
          });
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      downloadPdf(pdfBytes, 'images-converted.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Gambar ke PDF</h2>
        <p className="text-gray-500 mt-1">Ubah file gambar (JPG, PNG) menjadi satu dokumen PDF.</p>
      </div>

      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900">Tarik & Lepas gambar di sini</p>
        <p className="text-sm text-gray-500 mt-1">atau klik untuk memilih file</p>
      </div>

      {images.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-gray-700 mb-4">Daftar Gambar ({images.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((file, index) => (
              <div key={file.name + index} className="relative group bg-gray-50 rounded-lg p-2 border border-gray-200">
                <img 
                  src={file.preview} 
                  alt="preview" 
                  className="w-full h-32 object-cover rounded-md"
                  onLoad={() => { URL.revokeObjectURL(file.preview) }}
                />
                <button 
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={generatePdf}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <><Loader2 size={20} className="animate-spin" /> Memproses...</>
              ) : (
                <><Download size={20} /> Buat PDF</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageToPdf;
