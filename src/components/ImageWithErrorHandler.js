import React, { useState } from 'react';

const ImageWithErrorHandler = ({ 
  src, 
  alt, 
  className = '', 
  fallbackText = 'Image not available',
  fallbackClassName = 'bg-gray-200 flex items-center justify-center text-gray-500'
}) => {
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleError = (e) => {
    setHasError(true);
    e.target.style.display = 'none';
  };

  const handleLoad = () => {
    setImageLoaded(true);
  };

  if (hasError) {
    return (
      <div className={`${className} ${fallbackClassName}`}>
        <span className="text-sm text-center">{fallbackText}</span>
      </div>
    );
  }

  return (
    <>
      {!imageLoaded && (
        <div className={`${className} ${fallbackClassName}`}>
          <span className="text-sm text-center">Loading...</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${imageLoaded ? '' : 'hidden'}`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </>
  );
};

export default ImageWithErrorHandler;
