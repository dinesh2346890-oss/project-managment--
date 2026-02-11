export const safeImageUrl = (imageUrl) => {
  if (!imageUrl || imageUrl === null || imageUrl === undefined || imageUrl === '') {
    return null;
  }
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it starts with /, it's already a relative path
  if (imageUrl.startsWith('/')) {
    return `http://localhost:5000${imageUrl}`;
  }
  
  // Otherwise, assume it's a relative path without leading slash
  return `http://localhost:5000/${imageUrl}`;
};

export const handleImageError = (event, fallbackText = 'Image not available') => {
  event.target.style.display = 'none';
  const placeholder = document.createElement('div');
  placeholder.className = event.target.className + ' bg-gray-200 flex items-center justify-center text-gray-500 text-sm';
  placeholder.textContent = fallbackText;
  if (event.target.parentNode) {
    event.target.parentNode.replaceChild(placeholder, event.target);
  }
  event.preventDefault();
};

export const createImagePlaceholder = (text, className = 'bg-gray-200 flex items-center justify-center text-gray-500 text-sm') => {
  const placeholder = document.createElement('div');
  placeholder.className = className;
  placeholder.textContent = text;
  return placeholder;
};
