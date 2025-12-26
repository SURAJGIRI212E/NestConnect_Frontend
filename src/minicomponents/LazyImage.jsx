import { useEffect, useState } from "react";
import "./shimmer.css";

function LazyImage({ 
  url, 
  width, 
  height, 
  alt = "Image", 
  className = "",
  containerClassName = "",
  rounded = false,
  objectFit = "cover"
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) {
      setError(true);
      return;
    }

    const img = new Image();
    img.src = url;

    img.onload = () => {
      setLoaded(true);
    };

    img.onerror = () => {
      setError(true);
      setLoaded(false);
    };

    // Cleanup function
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  const containerStyle = {
    width: width || '100%',
    height: height || '100%',
    ...(rounded && { borderRadius: '50%' })
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: objectFit,
    ...(rounded && { borderRadius: '50%' })
  };

  return (
    <div
      className={`image-container ${containerClassName}`}
      style={containerStyle}
    >
      {!loaded && !error && <div className="shimmer" />}
    
      
      {loaded && !error && (
        <img
          src={url}
          alt={alt}
          style={imageStyle}
          className={className}
        />
      )}

      {error && (
        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-500 text-xs">Failed to load</span>
        </div>
      )}
    </div>
  );
}

export default LazyImage;

