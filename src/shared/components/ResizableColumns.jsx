import { useState, useRef, useCallback, useEffect } from 'react';
import './ResizableColumns.css';

/**
 * ResizableColumns - A two-column layout with a draggable divider
 *
 * @param {Object} props
 * @param {React.ReactNode} props.left - Left column content
 * @param {React.ReactNode} props.right - Right column content
 * @param {number} [props.defaultLeftWidth=50] - Default left column width percentage (0-100)
 * @param {number} [props.minLeftWidth=20] - Minimum left column width percentage
 * @param {number} [props.maxLeftWidth=80] - Maximum left column width percentage
 * @param {string} [props.className] - Additional CSS class
 * @param {string} [props.storageKey] - LocalStorage key to persist column width
 */
export default function ResizableColumns({
  left,
  right,
  defaultLeftWidth = 50,
  minLeftWidth = 20,
  maxLeftWidth = 80,
  className = '',
  storageKey = null,
}) {
  // Load persisted width or use default
  const getInitialWidth = () => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed >= minLeftWidth && parsed <= maxLeftWidth) {
          return parsed;
        }
      }
    }
    return defaultLeftWidth;
  };

  const [leftWidth, setLeftWidth] = useState(getInitialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Persist width to localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, leftWidth.toString());
    }
  }, [leftWidth, storageKey]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const newLeftWidth = (offsetX / rect.width) * 100;

    // Clamp to min/max
    const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth);
    setLeftWidth(clampedWidth);
  }, [isDragging, minLeftWidth, maxLeftWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={`resizable-columns ${className} ${isDragging ? 'resizable-columns--dragging' : ''}`}
    >
      <div
        className="resizable-columns__left"
        style={{ width: `${leftWidth}%` }}
      >
        {left}
      </div>

      <div
        className="resizable-columns__divider"
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={leftWidth}
        aria-valuemin={minLeftWidth}
        aria-valuemax={maxLeftWidth}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            setLeftWidth(Math.max(leftWidth - 5, minLeftWidth));
          } else if (e.key === 'ArrowRight') {
            setLeftWidth(Math.min(leftWidth + 5, maxLeftWidth));
          }
        }}
      >
        <div className="resizable-columns__divider-handle" />
      </div>

      <div
        className="resizable-columns__right"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {right}
      </div>
    </div>
  );
}
