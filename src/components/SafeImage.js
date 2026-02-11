import React, { useState } from 'react';

const SafeImage = ({ 
  src, 
  alt, 
  className = '', 
  fallbackText = 'Image not available',
  fallbackClassName = 'bg-gray-200 flex items-center justify-center text-gray-500 text-sm'
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Don't render anything if src is invalid
  if (!src || src === null || src === undefined || src === '' || typeof src !== 'string') {
    return (
      <div className={`${className} ${fallbackClassName}`}>
        <span className="text-center">{fallbackText}</span>
      </div>
    );
  }

  // Construct safe URL with error handling
  let safeSrc = src;
  try {
    if (typeof src === 'string' && src.startsWith('http')) {
      safeSrc = src;
    } else if (typeof src === 'string') {
      safeSrc = `http://localhost:5000${src}`;
    } else {
      throw new Error('Invalid src type');
    }
  } catch (error) {
    return (
      <div className={`${className} ${fallbackClassName}`}>
        <span className="text-center">{fallbackText}</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`${className} ${fallbackClassName}`}>
        <span className="text-center">{fallbackText}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} ${fallbackClassName} absolute inset-0`}>
          <span className="text-center">Loading...</span>
        </div>
      )}
      <img
        src={safeSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};

export default SafeImage;
