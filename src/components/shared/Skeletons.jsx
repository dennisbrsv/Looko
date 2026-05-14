
import React from 'react';

// ── Skeletons ──
export function LoadingSkeleton() {
  return (
    <div className="sk-list">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="sk-item">
          <div className="sk-row">
            <div className="sk sk-circle" />
            <div
              className="sk sk-line"
              style={{ width: 100 + ((i * 17) % 60) }}
            />
          </div>
          <div
            className="sk sk-title"
            style={{ width: `${45 + ((i * 13) % 40)}%` }}
          />
          <div
            className="sk sk-line"
            style={{ width: `${55 + ((i * 9) % 30)}%` }}
          />
          <div
            className="sk sk-line"
            style={{ width: `${35 + ((i * 11) % 25)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function ImageSkeleton({ colCount = 5 }) {
  return (
    <div className="img-masonry">
      {Array.from({ length: colCount }).map((_, ci) => (
        <div key={ci} className="img-masonry-col">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="img-card img-card-sk">
              <div
                className="sk img-thumb-sk"
                style={{ height: `${150 + ((ci * 37 + i * 53) % 140)}px` }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

