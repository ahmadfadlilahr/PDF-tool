import React from 'react';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="py-6 text-center text-sm text-gray-500 border-t border-gray-200 mt-auto">
        &copy; {new Date().getFullYear()} PDF Tools. No Database. 100% Client-Side.
      </footer>
    </div>
  );
};

export default Layout;
