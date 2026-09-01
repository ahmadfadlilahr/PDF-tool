import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, FileImage, Camera, Edit3, Minimize, Layers, SplitSquareHorizontal, Type, Image as ImageIcon } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <FileText size={20} />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">PDF Tools</span>
            </Link>
          </div>
          <div className="flex items-center">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
