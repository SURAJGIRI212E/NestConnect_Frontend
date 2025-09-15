import React, { useState, useEffect, useRef } from "react";
import { MdNavigateNext } from "react-icons/md";
import { MdNavigateBefore } from "react-icons/md";

const MediaSlider = ({ media, initialIndex = 0 }) => {
  const [current, setCurrent] = useState(initialIndex);
  const [prevIndex, setPrevIndex] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loaded, setLoaded] = useState({}); // map url -> true when loaded
  const loadersRef = useRef([]);
  useEffect(() => {
    setCurrent(initialIndex);
  }, [initialIndex]);

  // Preload current, next and previous images for faster navigation
  useEffect(() => {
    // cleanup previous loaders
    loadersRef.current.forEach(img => { if (img) img.onload = null; });
    loadersRef.current = [];

    if (!media || media.length === 0) return;

    const prevIndex = current === 0 ? media.length - 1 : current - 1;
    const nextIndex = current === media.length - 1 ? 0 : current + 1;

    const urlsToPreload = new Set();
    [prevIndex, current, nextIndex].forEach(i => {
      const item = media[i];
      if (item && item.type.startsWith('image')) urlsToPreload.add(item.url);
    });

    urlsToPreload.forEach(url => {
      if (loaded[url]) return; // already loaded
      const img = new Image();
      img.src = url;
      img.onload = () => setLoaded(prev => ({ ...prev, [url]: true }));
      loadersRef.current.push(img);
    });

    return () => {
      loadersRef.current.forEach(img => { if (img) img.onload = null; });
      loadersRef.current = [];
    };
  }, [media, current, loaded]);

  if (!media || media.length === 0) return null;

  const handlePrev = () => {
    setPrevIndex(current);
    const newIndex = current === 0 ? media.length - 1 : current - 1;
    setCurrent(newIndex);
    setIsTransitioning(true);
    // cleanup prev after transition
    setTimeout(() => {
      setPrevIndex(null);
      setIsTransitioning(false);
    }, 350);
  };
  const handleNext = () => {
    setPrevIndex(current);
    const newIndex = current === media.length - 1 ? 0 : current + 1;
    setCurrent(newIndex);
    setIsTransitioning(true);
    setTimeout(() => {
      setPrevIndex(null);
      setIsTransitioning(false);
    }, 350);
  };

  const currentMedia = media[current];

  return (
    <div className="relative w-full h-96 max-h-96 rounded-lg overflow-hidden flex flex-col items-center">
      <div className="w-full h-full flex justify-center items-center relative" style={{height: '24rem'}}>
        {/* Previous layer (fades out) */}
        {prevIndex !== null && media[prevIndex] && media[prevIndex].type.startsWith('image') && (
          <div className={`absolute inset-0 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {loaded[media[prevIndex].url] ? (
              <img src={media[prevIndex].url} alt="prev-media" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        )}

        {/* Current layer (fades in) */}
        {currentMedia.type.startsWith("image") ? (
          <div className={`absolute inset-0 transition-opacity duration-300 ${isTransitioning ? 'opacity-100' : 'opacity-100'}`}>
            {loaded[currentMedia.url] ? (
              <img src={currentMedia.url} alt="media" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0">
            <video src={currentMedia.url} controls className="w-full h-full object-contain" />
          </div>
        )}
      </div>
      {media.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center gap-4 px-4 pointer-events-none">
          <button
            className="pointer-events-auto bg-blue-600/90 text-white rounded-full px-2 py-1 text-base hover:bg-opacity-90 flex items-center justify-center"
            onClick={handlePrev}
          >
            <MdNavigateBefore/>
          </button>
          <span className="pointer-events-auto text-white text-xs bg-gray-800 bg-opacity-60 rounded-full px-2 py-1">
            {current + 1} / {media.length}
          </span>
          <button
            className="pointer-events-auto bg-blue-600/90 text-white rounded-full px-2 py-1 text-base hover:bg-opacity-90 flex items-center justify-center"
            onClick={handleNext}
          >
            <MdNavigateNext />
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaSlider;
