
import React, { useState, useEffect, useRef } from 'react';
import { getDomain } from '../../lib/utils';

// ── Image Card (lazy, no NSFW) ──
export function ImageCard({ result, index, src, height, eager, selected, onSelect }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(eager);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (eager || visible) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [eager, visible]);

  if (failed) return null;

  return (
    <div
      ref={ref}
      className={`img-card${selected ? " img-card-sel" : ""}`}
      style={{ animationDelay: `${(index % 12) * 18}ms` }}
      onClick={() => onSelect(result)}
    >
      <div
        className="img-thumb-wrap"
        style={{ height: `${height}px` }}
      >
        {visible && (
          <img
            src={src}
            alt={result.title || ""}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            fetchpriority={eager ? "high" : "auto"}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={loaded ? "is-loaded" : ""}
          />
        )}
      </div>
      <div className="img-meta-overlay">
        <span className="img-title">
          {result.title || getDomain(result.url)}
        </span>
        <span className="img-domain">{getDomain(result.url)}</span>
      </div>
    </div>
  );
}

