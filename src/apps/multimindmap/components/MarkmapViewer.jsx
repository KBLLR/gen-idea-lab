import React, { useEffect, useRef } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap as MarkmapView } from 'markmap-view';
import throttle from 'lodash/throttle';

/**
 * MarkmapViewer renders an interactive mind map from Markdown content using
 * markmap-lib and markmap-view. It handles incremental updates by
 * throttling data updates and fitting the map on resize. The SVG element is
 * kept within the bounds of its container so it inherits flexbox sizing.
 */
const transformer = new Transformer();

const MarkmapViewer = ({ content }) => {
  const svgRef = useRef(null);
  const mapRef = useRef(null);
  const initTimeoutRef = useRef(null);

  const throttledUpdate = useRef(
    throttle((markmap, md) => {
      try {
        const { root } = transformer.transform(md);
        markmap.setData(root).then(() => {
          markmap.fit();
        }).catch(error => {
          console.error('[Markmap] setData failed:', error);
        });
      } catch (error) {
        console.error('[Markmap] Transform failed:', error);
      }
    }, 500),
  ).current;

  // Initialise the markmap instance once.
  useEffect(() => {
    if (!mapRef.current && svgRef.current) {
      // Clear any pending timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }

      // Wait for next frame to ensure layout is complete
      initTimeoutRef.current = setTimeout(() => {
        if (!svgRef.current) return;
        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
          svg.setAttribute('width', rect.width);
          svg.setAttribute('height', rect.height);

          try {
            const markmap = MarkmapView.create(svg);
            mapRef.current = markmap;
            console.log('[Markmap] Initialized with dimensions:', rect.width, 'x', rect.height);
          } catch (error) {
            console.error('[Markmap] Initialization failed:', error);
          }
        } else {
          console.warn('[Markmap] SVG has zero dimensions:', rect);
        }
      }, 100); // Small delay to ensure layout is stable
    }

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  // Update the mind map when the content changes.
  useEffect(() => {
    const markmap = mapRef.current;
    if (content && markmap) {
      try {
        throttledUpdate(markmap, content);
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