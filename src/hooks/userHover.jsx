import { useState, useCallback, useRef } from "react";

function useHover() {
  const [isHovering, setIsHovering] = useState(false);
  // position now includes index of hovered item so callers can know which user to show
  const [position, setPosition] = useState({ top: 0, left: 0, index: null });
  const [activeId, setActiveId] = useState(null);
  const hideTimeoutId = useRef(null); // Ref to track the timeout for hiding
  const showTimeoutId = useRef(null); // Ref to track the timeout for showing

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutId.current) {
      clearTimeout(hideTimeoutId.current);
      hideTimeoutId.current = null;
    }
  }, []);

  const clearShowTimeout = useCallback(() => {
    if (showTimeoutId.current) {
      clearTimeout(showTimeoutId.current);
      showTimeoutId.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback((e, id) => {
    clearHideTimeout(); // Clear any existing hide timeout
    clearShowTimeout(); // Clear any existing show timeout

    const rect = e.currentTarget.getBoundingClientRect();

    showTimeoutId.current = setTimeout(() => {
      setPosition({
        top: rect.top , // Position below the element
        left: 0, // Align with the element
         index: id,
      });
      setActiveId(id); // Set the active modal ID
      setIsHovering(true); // Show the modal after delay
    }, 1000); // Delay of 1 second
  }, [clearHideTimeout, clearShowTimeout]);

  const handleMouseLeave = useCallback(() => {
    clearShowTimeout(); // Clear the show timeout to prevent delayed activation
    if (hideTimeoutId.current) {
      clearTimeout(hideTimeoutId.current);
    }
    hideTimeoutId.current = setTimeout(() => {
      setIsHovering(false); // Hide the modal
      setActiveId(null); // Reset active modal ID
      setPosition((p) => ({ ...p, index: null }));
    }, 300); // Delay of 300ms before hiding
  }, [clearShowTimeout]);

  return {
    isHovering,
    position,
    activeId,
    handleMouseEnter,
    handleMouseLeave,
    clearHideTimeout,
  };
}

export default useHover;
