import React, { useState, useEffect } from "react";
import { MdNavigateNext } from "react-icons/md";
import { MdNavigateBefore } from "react-icons/md";

const MediaSlider = ({ media, initialIndex = 0 }) => {
  const [current, setCurrent] = useState(initialIndex);
  useEffect(() => {
    setCurrent(initialIndex);
  }, [initialIndex]);

  if (!media || media.length === 0) return null;

  const handlePrev = () => {
    setCurrent((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };
  const handleNext = () => {
    setCurrent((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const currentMedia = media[current];

  return (
    <div className="relative w-full h-96 max-h-96 rounded-lg overflow-hidden flex flex-col items-center">
      <div className="w-full h-full flex justify-center items-center">
        {currentMedia.type.startsWith("image") ? (
          <img src={currentMedia.url} alt="media" className="w-full h-full object-contain" style={{height: '24rem'}} />
        ) : (
          <video src={currentMedia.url} controls className="w-full h-full object-contain" style={{height: '24rem'}} />
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
