import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, UploadCloud, X, Loader2, ImageIcon, File } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PdfToImage = () => {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isZipping, setIsZipping] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      setImages([]); // reset
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  const extractImages = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    const extracted = [];
    
    try {
      const fileUrl = URL.createObjectURL(file);
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      
      for (let i = 1; i <= numPages; i++) {
        setProgress(Math.round((i / numPages) * 100));
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High resolution
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        const imgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        extracted.push({
          id: i,
          url: imgDataUrl
        });
      }
      
      setImages(extracted);
      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error('Error extracting images:', error);
      alert('Gagal mengekstrak gambar dari PDF.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadZip = async () => {
    if (images.length === 0) return;
    setIsZipping(true);
    
    try {
      const zip = new JSZip();
      
      images.forEach((img, idx) => {
        // Remove data:image/jpeg;base64,
        const base64Data = img.url.replace(/^data:image\/jpeg;base64,/, "");
        zip.file(`page-${idx + 1}.jpg`, base64Data, { base64: true });
      });
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${file.name.replace('.pdf', '')}-images.zip`);
    } catch (e) {
      console.error(e);
      alert('Gagal membuat file ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">PDF ke Gambar</h2>
        <p className="text-gray-500 mt-1">Ekstrak semua halaman dari dokumen PDF menjadi gambar JPG kualitas tinggi.</p>
      </div>

      {!file ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'}`}
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
              <div className="bg-teal-100 p-2 rounded text-teal-600">
                <File size={24} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={() => { setFile(null); setImages([]); }}
              className="text-gray-400 hover:text-red-500 p-2 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-gray-100 rounded-xl bg-gray-50/50">
              {isProcessing ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin text-teal-500 mb-4" />
                  <p className="text-gray-600 font-medium">Mengekstrak Halaman... {progress}%</p>
                  <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mt-4 overflow-hidden">
                    <div className="bg-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                </>
              ) : (
                <button
                  onClick={extractImages}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Mulai Ekstrak Gambar
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">Hasil Ekstrak ({images.length} Halaman)</h3>
                <button
                  onClick={downloadZip}
                  disabled={isZipping}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isZipping ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Unduh Semua (ZIP)
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2 border border-gray-100 rounded-xl bg-gray-50">
                {images.map((img) => (
                  <div key={img.id} className="relative group bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                    <img src={img.url} alt={`Page ${img.id}`} className="w-full h-auto rounded" />
                    <div className="absolute top-0 right-0 bg-black/50 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">
                      Hal {img.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfToImage;
