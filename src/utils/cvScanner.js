// OpenCV.js helper functions for document scanning
// It assumes cv is available in window object

export const loadOpenCV = () => {
  return new Promise((resolve, reject) => {
    if (window.cv && typeof window.cv.imread === 'function') {
      resolve(window.cv);
      return;
    }
    
    // Check if script already added
    if (document.getElementById('opencv-js')) {
      // Script is there but maybe not loaded
      const checkCv = setInterval(() => {
        if (window.cv && typeof window.cv.imread === 'function') {
          clearInterval(checkCv);
          resolve(window.cv);
        }
      }, 500);
      return;
    }

    const script = document.createElement('script');
    script.id = 'opencv-js';
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
    script.async = true;
    script.onload = () => {
      // OpenCV.js takes a while to initialize even after script load
      const checkCv = setInterval(() => {
        if (window.cv && typeof window.cv.imread === 'function') {
          clearInterval(checkCv);
          resolve(window.cv);
        }
      }, 500);
    };
    script.onerror = () => {
      reject(new Error('Failed to load OpenCV.js'));
    };
    document.body.appendChild(script);
  });
};

export const detectDocument = (imageElement, canvasElement) => {
  const cv = window.cv;
  let src = cv.imread(imageElement);
  let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
  
  // Convert to grayscale
  cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
  
  // Blur
  let ksize = new cv.Size(5, 5);
  cv.GaussianBlur(dst, dst, ksize, 0, 0, cv.BORDER_DEFAULT);
  
  // Canny edge detection
  cv.Canny(dst, dst, 75, 200, 3, false);
  
  // Find contours
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  
  // Find largest contour that looks like a rectangle
  let maxArea = 0;
  let maxContourIndex = -1;
  let maxContour = null;
  
  for (let i = 0; i < contours.size(); ++i) {
    let cnt = contours.get(i);
    let area = cv.contourArea(cnt);
    let peri = cv.arcLength(cnt, true);
    let approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
    
    if (approx.rows === 4 && area > maxArea) {
      maxArea = area;
      maxContourIndex = i;
      maxContour = approx;
    } else {
      approx.delete();
    }
    cnt.delete();
  }
  
  if (maxContourIndex !== -1 && maxArea > src.rows * src.cols * 0.1) {
    // We found a document!
    
    // Order points (top-left, top-right, bottom-right, bottom-left)
    // Simplified for now, just bounding rect for safety if perspective transform fails
    let rect = cv.boundingRect(maxContour);
    let cropped = src.roi(rect);
    cv.imshow(canvasElement, cropped);
    cropped.delete();
    maxContour.delete();
  } else {
    // If no document found, just show original
    cv.imshow(canvasElement, src);
  }
  
  src.delete();
  dst.delete();
  contours.delete();
  hierarchy.delete();
};
