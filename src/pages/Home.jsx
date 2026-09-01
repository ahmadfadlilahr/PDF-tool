import React from 'react';
import { Link } from 'react-router-dom';
import { FileImage, Camera, Edit3, Minimize, Layers, SplitSquareHorizontal, Type, Image as ImageIcon, FileText } from 'lucide-react';

const tools = [
  { id: 'image-to-pdf', name: 'Gambar ke PDF', description: 'Ubah gambar JPG/PNG menjadi dokumen PDF.', icon: <FileImage className="text-blue-500" size={24} />, path: '/image-to-pdf' },
  { id: 'camera-to-pdf', name: 'Kamera ke PDF', description: 'Ambil foto dari web cam dan jadikan PDF lurus.', icon: <Camera className="text-emerald-500" size={24} />, path: '/camera-to-pdf' },
  { id: 'document-to-pdf', name: 'Dokumen ke PDF', description: 'Ubah file teks biasa atau .docx menjadi PDF.', icon: <FileText className="text-purple-500" size={24} />, path: '/document-to-pdf' },
  { id: 'sign-pdf', name: 'Tanda Tangan PDF', description: 'Tambahkan tanda tangan digital ke dokumen.', icon: <Edit3 className="text-red-500" size={24} />, path: '/sign-pdf' },
  { id: 'compress-pdf', name: 'Kompres PDF', description: 'Perkecil ukuran file PDF (Rasterize).', icon: <Minimize className="text-orange-500" size={24} />, path: '/compress-pdf' },
  { id: 'merge-pdf', name: 'Gabung PDF', description: 'Satukan beberapa file PDF menjadi satu.', icon: <Layers className="text-indigo-500" size={24} />, path: '/merge-pdf' },
  { id: 'split-pdf', name: 'Pisah PDF', description: 'Ambil halaman tertentu dari PDF.', icon: <SplitSquareHorizontal className="text-pink-500" size={24} />, path: '/split-pdf' },
  { id: 'pdf-to-image', name: 'PDF ke Gambar', description: 'Ekstrak setiap halaman PDF menjadi JPG.', icon: <ImageIcon className="text-teal-500" size={24} />, path: '/pdf-to-image' },
  { id: 'watermark-pdf', name: 'Beri Watermark', description: 'Tambahkan cap air pada dokumen PDF.', icon: <Type className="text-cyan-500" size={24} />, path: '/watermark-pdf' },
];

const Home = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Semua Alat PDF di Browser Anda</h1>
        <p className="text-lg text-gray-600">
          Cepat, aman, dan tanpa server. File Anda diproses secara lokal di perangkat Anda sendiri. 
          Tidak ada data yang diunggah ke internet.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {tools.map((tool) => (
          <Link 
            key={tool.id} 
            to={tool.path}
            className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-200 flex flex-col items-start gap-4"
          >
            <div className="p-3 bg-gray-50 rounded-xl group-hover:scale-110 group-hover:bg-blue-50 transition-transform duration-200">
              {tool.icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{tool.name}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
