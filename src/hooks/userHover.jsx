import { useState, useCallback, useRef } from "react";

function useHover() {
  const [isHovering, setIsHovering] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [activeId, setActiveId] = useState(null);
  const timeoutId = useRef(null); // Ref to track the timeout

  const handleMouseEnter = useCallback((e, id) => {
    // Clear any existing timeout
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    timeoutId.current = setTimeout(() => {
      setPosition({
        top: rect.top + window.scrollY + rect.height, // Position below the element
        left: rect.left + window.scrollX, // Align with the element
      });
      setActiveId(id); // Set the active modal ID
      setIsHovering(true); // Show the modal
      // console.log("after 2 second",id);
    }, 1000); // Delay of 2 seconds
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Clear the timeout to prevent delayed activation
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    setIsHovering(false); // Hide the modal
    setActiveId(null); // Reset active modal ID
  }, []);

  return { isHovering, position, activeId, handleMouseEnter, handleMouseLeave };
}

export default useHover;
