import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { Download, UploadCloud, X, Loader2, File } from 'lucide-react';
import { downloadPdf } from '../../utils/pdfHelpers';

const MergePdf = () => {
  const [pdfs, setPdfs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    setPdfs(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    }
  });

  const removePdf = (index) => {
    setPdfs(prev => prev.filter((_, i) => i !== index));
  };

  const mergePdfs = async () => {
    if (pdfs.length < 2) {
      alert("Pilih setidaknya 2 file PDF untuk digabungkan.");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const file of pdfs) {
        const fileBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      downloadPdf(mergedPdfBytes, 'merged-document.pdf');
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Gagal menggabungkan PDF. Pastikan file tidak rusak atau dilindungi kata sandi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Gabung PDF</h2>
        <p className="text-gray-500 mt-1">Gabungkan beberapa file PDF menjadi satu dokumen dengan mudah.</p>
      </div>

      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900">Tarik & Lepas PDF di sini</p>
        <p className="text-sm text-gray-500 mt-1">atau klik untuk memilih file</p>
      </div>

      {pdfs.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-gray-700 mb-4">Urutan File ({pdfs.length})</h3>
          <div className="space-y-3">
            {pdfs.map((file, index) => (
              <div key={file.name + index} className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded text-indigo-600">
                    <File size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 line-clamp-1">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => removePdf(index)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={mergePdfs}
              disabled={isProcessing || pdfs.length < 2}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <><Loader2 size={20} className="animate-spin" /> Memproses...</>
              ) : (
                <><Download size={20} /> Gabungkan PDF</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MergePdf;
