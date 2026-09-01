import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as mammoth from 'mammoth';
import { Download, UploadCloud, X, Loader2, FileText, File } from 'lucide-react';
import { downloadPdf } from '../../utils/pdfHelpers';

const DocumentToPdf = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const extractText = async (fileObj) => {
    if (fileObj.name.endsWith('.txt')) {
      return await fileObj.text();
    } else if (fileObj.name.endsWith('.docx')) {
      const arrayBuffer = await fileObj.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }
    return '';
  };

  const wrapText = (text, maxWidth, font, fontSize) => {
    const lines = [];
    const paragraphs = text.split('\n');
    
    for (const p of paragraphs) {
      if (p.trim() === '') {
        lines.push('');
        continue;
      }
      
      const words = p.split(' ');
      let currentLine = words[0];
      
      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = font.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
    }
    return lines;
  };

  const convertToPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      const text = await extractText(file);
      if (!text) throw new Error("Tidak ada teks yang dapat diekstrak.");

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const margin = 50;
      
      // Default A4 size
      const width = 595.28;
      const height = 841.89;
      
      const maxWidth = width - (margin * 2);
      const lines = wrapText(text, maxWidth, font, fontSize);
      
      let page = pdfDoc.addPage([width, height]);
      let currentY = height - margin;
      const lineHeight = font.heightAtSize(fontSize) + 4;
      
      for (const line of lines) {
        if (currentY < margin) {
          page = pdfDoc.addPage([width, height]);
          currentY = height - margin;
        }
        
        page.drawText(line, {
          x: margin,
          y: currentY,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
        
        currentY -= lineHeight;
      }
      
      const pdfBytes = await pdfDoc.save();
      downloadPdf(pdfBytes, `${file.name.replace(/\.[^/.]+$/, "")}.pdf`);
    } catch (error) {
      console.error('Error converting document:', error);
      alert('Gagal mengonversi dokumen. Pastikan file valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dokumen ke PDF</h2>
        <p className="text-gray-500 mt-1">Ubah file teks (.txt) atau dokumen Word dasar (.docx) menjadi format PDF.</p>
      </div>

      {!file ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900">Tarik & Lepas dokumen di sini</p>
          <p className="text-sm text-gray-500 mt-1">Mendukung file .txt dan .docx</p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded text-purple-600">
                <FileText size={24} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button 
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-red-500 p-2 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm mb-6 border border-yellow-200">
            <strong>Catatan Konversi:</strong> Karena aplikasi berjalan di browser tanpa server, dokumen Word (.docx) akan diekstrak sebagai teks murni (raw text). Gambar atau format tabel rumit pada dokumen mungkin tidak akan terbawa ke PDF.
          </div>

          <div className="flex justify-end">
            <button
              onClick={convertToPdf}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <><Loader2 size={20} className="animate-spin" /> Memproses...</>
              ) : (
                <><Download size={20} /> Konversi ke PDF</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentToPdf;
