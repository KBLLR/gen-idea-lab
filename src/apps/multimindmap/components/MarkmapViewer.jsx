import React, { useEffect, useRef } from 'react';
import throttle from 'lodash/throttle';

/**
 * MarkmapViewer renders an interactive mind map from Markdown content using
 * markmap-lib and markmap-view. It handles incremental updates by
 * throttling data updates and fitting the map on resize. The SVG element is
 * kept within the bounds of its container so it inherits flexbox sizing.
 */
// Lazily import markmap libs to avoid shipping them in the base chunk
const transformerRef = { current: null };
const MarkmapClassRef = { current: null };

const MarkmapViewer = ({ content }) => {
  const svgRef = useRef(null);
  const mapRef = useRef(null);
  const initTimeoutRef = useRef(null);

  const throttledUpdate = useRef(
    throttle((md) => {
      const markmap = mapRef.current;
      const transformer = transformerRef.current;
      if (!markmap || !transformer || !md) return;
      try {
        const { root } = transformer.transform(md);
        markmap
          .setData(root)
          .then(() => markmap.fit())
          .catch((error) => {
            console.error('[Markmap] setData failed:', error);
          });
      } catch (error) {
        console.error('[Markmap] Transform failed:', error);
      }
    }, 500)
  ).current;

  // Initialise the markmap instance once.
  useEffect(() => {
    if (!mapRef.current && svgRef.current) {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = setTimeout(async () => {
        if (!svgRef.current) return;
        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          console.warn('[Markmap] SVG has zero dimensions:', rect);
          return;
        }
        svg.setAttribute('width', rect.width);
        svg.setAttribute('height', rect.height);
        try {
          // Dynamic import markmap libs
          const [{ Transformer }, { Markmap }] = await Promise.all([
            import('markmap-lib'),
            import('markmap-view'),
          ]);
          transformerRef.current = new Transformer();
          MarkmapClassRef.current = Markmap;
          const markmap = Markmap.create(svg);
          mapRef.current = markmap;
          console.log('[Markmap] Initialized with dimensions:', rect.width, 'x', rect.height);

          // Render existing content immediately after initialization
          if (content) {
            console.log('[Markmap] Rendering initial content after initialization');
            throttledUpdate(content);
          }
        } catch (error) {
          console.error('[Markmap] Initialization failed:', error);
        }
      }, 100);
    }
    return () => { if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current); };
  }, [content, throttledUpdate]);

  // Update the mind map when the content changes.
  useEffect(() => {
    if (content && mapRef.current && transformerRef.current) {
      try {
        throttledUpdate(content);
      } catch (error) {
        console.error('[Markmap] Update failed:', error);
      }
    }
  }, [content, throttledUpdate]);

  // Refit the mind map on resize.
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          svgRef.current.setAttribute('width', rect.width);
          svgRef.current.setAttribute('height', rect.height);

          // Only fit if markmap is initialized
          if (mapRef.current) {
            try {
              mapRef.current.fit();
            } catch (error) {
              console.error('[Markmap] Fit failed:', error);
            }
          }
        }
      }
    });

    const currentSvg = svgRef.current;
    if (currentSvg) {
      observer.observe(currentSvg);
    }

    return () => {
      if (currentSvg) {
        observer.unobserve(currentSvg);
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', display: 'flex', width: '100%', height: '100%', alignItems: 'stretch' }}>
      <svg ref={svgRef} style={{ flex: 1, background: 'var(--color-bg, #1a1a1a)', minWidth: 0, minHeight: 0 }}></svg>
    </div>
  );
};

export default MarkmapViewer;
