import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { RESULTS_PER_PAGE } from '../../lib/constants';

function getPageNumbers(current, total) {
  // Always show first page, last page, current page, and 1 neighbor on each side
  // With ellipsis between gaps
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const pages = new Set();
  pages.add(0);           // first
  pages.add(total - 1);   // last

  // current and neighbors
  for (let i = Math.max(0, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push('...');
    }
    result.push(sorted[i]);
  }

  return result;
}

// ── Pagination ──
export function Pagination({ currentPage, totalResults, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalResults / RESULTS_PER_PAGE));
  if (totalPages <= 1) return null;

  const pageItems = getPageNumbers(currentPage, totalPages);

  return (
    <nav className="pg">
      <div className="pg-logo">
        {"Looko".split("").map((ch, i) => (
          <span
            key={i}
            className="pg-letter"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {ch}
          </span>
        ))}
      </div>
      <div className="pg-row">
        {currentPage > 0 && (
          <button
            className="pg-arrow"
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>
        )}
        {pageItems.map((item, idx) =>
          item === '...' ? (
            <span key={`ellipsis-${idx}`} className="pg-ellipsis">…</span>
          ) : (
            <button
              key={item}
              className={`pg-num${item === currentPage ? " pg-num-active" : ""}`}
              onClick={() => onPageChange(item)}
            >
              {item + 1}
            </button>
          )
        )}
        {currentPage < totalPages - 1 && (
          <button
            className="pg-arrow"
            onClick={() => onPageChange(currentPage + 1)}
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </nav>
  );
}

