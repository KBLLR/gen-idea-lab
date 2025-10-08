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
  const throttledUpdate = useRef(
    throttle((markmap, md) => {
      const { root } = transformer.transform(md);
      markmap.setData(root).then(() => {
        markmap.fit();
      });
    }, 500),
  ).current;

  // Initialise the markmap instance once.
  useEffect(() => {
    if (!mapRef.current && svgRef.current) {
      const markmap = MarkmapView.create(svgRef.current);
      mapRef.current = markmap;
    }
  }, []);

  // Update the mind map when the content changes.
  useEffect(() => {
    const markmap = mapRef.current;
    if (content && markmap) {
      throttledUpdate(markmap, content);
    }
  }, [content, throttledUpdate]);

  // Refit the mind map on resize.
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      mapRef.current?.fit();
    });
    if (svgRef.current) {
      observer.observe(svgRef.current);
    }
    return () => {
      if (svgRef.current) {
        observer.unobserve(svgRef.current);
      }
    };
  }, []);

  return (
    <div className="relative flex h-full w-full items-stretch">
      <svg ref={svgRef} className="flex-1 bg-white"></svg>
    </div>
  );
};

export default MarkmapViewer;