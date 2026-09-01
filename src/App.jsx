import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import { Loader2 } from 'lucide-react';

// Lazy loaded features
const ImageToPdf = lazy(() => import('./pages/features/ImageToPdf'));
const PdfToImage = lazy(() => import('./pages/features/PdfToImage'));
const MergePdf = lazy(() => import('./pages/features/MergePdf'));
const SplitPdf = lazy(() => import('./pages/features/SplitPdf'));
const WatermarkPdf = lazy(() => import('./pages/features/WatermarkPdf'));
const CompressPdf = lazy(() => import('./pages/features/CompressPdf'));
const SignPdf = lazy(() => import('./pages/features/SignPdf'));
const DocumentToPdf = lazy(() => import('./pages/features/DocumentToPdf'));
const CameraToPdf = lazy(() => import('./pages/features/CameraToPdf'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center py-32 space-y-4">
    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
    <p className="text-gray-500 font-medium">Memuat fitur...</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="image-to-pdf" element={<Suspense fallback={<PageLoader />}><ImageToPdf /></Suspense>} />
          <Route path="pdf-to-image" element={<Suspense fallback={<PageLoader />}><PdfToImage /></Suspense>} />
          <Route path="merge-pdf" element={<Suspense fallback={<PageLoader />}><MergePdf /></Suspense>} />
          <Route path="split-pdf" element={<Suspense fallback={<PageLoader />}><SplitPdf /></Suspense>} />
          <Route path="watermark-pdf" element={<Suspense fallback={<PageLoader />}><WatermarkPdf /></Suspense>} />
          <Route path="compress-pdf" element={<Suspense fallback={<PageLoader />}><CompressPdf /></Suspense>} />
          <Route path="sign-pdf" element={<Suspense fallback={<PageLoader />}><SignPdf /></Suspense>} />
          <Route path="document-to-pdf" element={<Suspense fallback={<PageLoader />}><DocumentToPdf /></Suspense>} />
          <Route path="camera-to-pdf" element={<Suspense fallback={<PageLoader />}><CameraToPdf /></Suspense>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
