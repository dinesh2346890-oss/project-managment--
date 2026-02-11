import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Global error handler for image loading errors
window.addEventListener('error', (event) => {
  if (event.target && event.target.tagName === 'IMG') {
    event.target.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.className = event.target.className + ' bg-gray-200 flex items-center justify-center text-gray-500 text-sm';
    placeholder.textContent = 'Image not available';
    if (event.target.parentNode) {
      event.target.parentNode.replaceChild(placeholder, event.target);
    }
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

// Prevent unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
