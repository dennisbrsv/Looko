
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { proxyImg, estimateImageHeight, distributeToColumns } from '../../lib/utils';
import { useElementWidth } from '../../hooks/useElementWidth';
import { ImageCard } from './ImageCard';

// ── Image Results ──
export function ImageResults({ results, selectedImage, onSelectImage }) {
  const containerRef = useRef(null);
  const [colCount, setColCount] = useState(5);
  const { ref, width } = useElementWidth();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth || 800;
      if (w > 1400) setColCount(6);
      else if (w > 1100) setColCount(5);
      else if (w > 820) setColCount(4);
      else if (w > 560) setColCount(3);
      else setColCount(2);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pre-compute everything once per results/colCount, before any image loads
  const columns = useMemo(() => {
    const colWidth = width ? Math.round(width / colCount) : 240;  // ← per-column width
    const items = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const src = proxyImg(r.thumbnail, colWidth) || proxyImg(r.img_src, colWidth);  // ← sized
      if (!src) continue;
      items.push({ result: r, index: i, src, height: estimateImageHeight(r, i) });
    }
    return distributeToColumns(items, colCount);
  }, [results, colCount, width]);

  // First (colCount * 2) items load eagerly — those that show on screen
  const eagerThreshold = colCount * 2;

  if (!results.length)
    return (
      <div className="no-results">
        <ImageIcon size={18} />
        <span>No images found</span>
      </div>
    );

  return (
    <div className="img-masonry" ref={containerRef}>
      {columns.map((col, ci) => (
        <div key={ci} className="img-masonry-col">
          {col.map(({ result: r, index: i, src, height }) => (
            <ImageCard
              key={`${r.url}-${i}`}
              result={r}
              index={i}
              src={src}
              height={height}
              eager={i < eagerThreshold}
              selected={selectedImage?.url === r.url}
              onSelect={onSelectImage}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

