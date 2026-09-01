import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { Download, UploadCloud, X, Loader2, File, Type } from 'lucide-react';
import { downloadPdf } from '../../utils/pdfHelpers';

const WatermarkPdf = () => {
  const [file, setFile] = useState(null);
  const [watermarkText, setWatermarkText] = useState('RAHASIA');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const applyWatermark = async () => {
    if (!file || !watermarkText) return;
    setIsProcessing(true);
    
    try {
      const fileBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const pages = pdfDoc.getPages();
      
      for (const page of pages) {
        const { width, height } = page.getSize();
        
        // Calculate text size and position
        const textSize = 60;
        const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, textSize);
        const textHeight = helveticaFont.heightAtSize(textSize);
        
        // Center of page
        const x = width / 2 - textWidth / 2;
        const y = height / 2 - textHeight / 2;
        
        page.drawText(watermarkText, {
          x,
          y,
          size: textSize,
          font: helveticaFont,
          color: rgb(0.7, 0.7, 0.7), // Light gray
          opacity: 0.5,
          rotate: degrees(45),
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      downloadPdf(pdfBytes, `watermarked-${file.name}`);
    } catch (error) {
      console.error('Error applying watermark:', error);
      alert('Gagal menambahkan watermark.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Beri Watermark</h2>
        <p className="text-gray-500 mt-1">Tambahkan teks transparan (cap air) pada setiap halaman dokumen PDF Anda.</p>
      </div>

      {!file ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-cyan-500 bg-cyan-50' : 'border-gray-300 hover:border-cyan-400 hover:bg-gray-50'}`}
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
              <div className="bg-cyan-100 p-2 rounded text-cyan-600">
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teks Watermark
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Type className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="text" 
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="Contoh: RAHASIA"
                maxLength={30}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={applyWatermark}
              disabled={isProcessing || !watermarkText}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <><Loader2 size={20} className="animate-spin" /> Memproses...</>
              ) : (
                <><Download size={20} /> Terapkan & Unduh</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatermarkPdf;
