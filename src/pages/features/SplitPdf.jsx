import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { Download, UploadCloud, X, Loader2, File } from 'lucide-react';
import { downloadPdf } from '../../utils/pdfHelpers';

const SplitPdf = () => {
  const [file, setFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [rangeStr, setRangeStr] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Determine page count
      try {
        const fileBytes = await selectedFile.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        setTotalPages(pdf.getPageCount());
        setRangeStr(`1-${pdf.getPageCount()}`);
      } catch (e) {
        alert("Gagal membaca PDF. Pastikan file valid.");
        setFile(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  const parseRange = (range, max) => {
    const pages = new Set();
    const parts = range.split(',').map(p => p.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (start && end && start <= end && start >= 1 && end <= max) {
          for (let i = start; i <= end; i++) pages.add(i - 1);
        }
      } else {
        const page = Number(part);
        if (page && page >= 1 && page <= max) pages.add(page - 1);
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const splitPdf = async () => {
    const pagesToExtract = parseRange(rangeStr, totalPages);
    if (pagesToExtract.length === 0) {
      alert("Format rentang halaman tidak valid.");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const fileBytes = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(fileBytes);
      
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(originalPdf, pagesToExtract);
      copiedPages.forEach((page) => newPdf.addPage(page));
      
      const newPdfBytes = await newPdf.save();
      downloadPdf(newPdfBytes, `split-${file.name}`);
    } catch (error) {
      console.error('Error splitting PDF:', error);
      alert('Gagal memisahkan PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Pisah PDF</h2>
        <p className="text-gray-500 mt-1">Ekstrak halaman tertentu dari dokumen PDF Anda.</p>
      </div>

      {!file ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-pink-400 hover:bg-gray-50'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900">Tarik & Lepas file PDF di sini</p>
          <p className="text-sm text-gray-500 mt-1">atau klik untuk memilih file</p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-pink-100 p-2 rounded text-pink-600">
                <File size={24} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{totalPages} Halaman • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
              Halaman yang diekstrak (contoh: 1-3, 5, 8-10)
            </label>
            <input 
              type="text" 
              value={rangeStr}
              onChange={(e) => setRangeStr(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder={`1-${totalPages}`}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={splitPdf}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <><Loader2 size={20} className="animate-spin" /> Memproses...</>
              ) : (
                <><Download size={20} /> Pisahkan & Unduh</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitPdf;
