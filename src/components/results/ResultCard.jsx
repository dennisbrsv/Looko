import React, { useState, useRef, useCallback } from 'react';
import { Link, Check } from 'lucide-react';
import { getDomain, getBreadcrumb, proxyFavicon } from '../../lib/utils';
import { createPortal } from 'react-dom';

function domainColor(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 55%)`;
}

// ── Result Card ──
export function ResultCard({ result, index }) {
  const domain = getDomain(result.url);
  const breadcrumb = getBreadcrumb(result.url);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const hoverTimer = useRef(null);
  const titleRef = useRef(null);

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(result.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const showPreview = useCallback((e) => {
    // ClientX/Y are viewport-relative
    const x = e.clientX;
    const y = e.clientY;

    // Offset by 15px so the preview doesn't sit under the cursor
    // Use window.innerWidth/Height to prevent overflow
    const safeX = Math.min(x + 15, window.innerWidth - 350);
    const safeY = Math.min(y + 15, window.innerHeight - 260);

    setPreviewPos({ x: safeX, y: safeY });
    hoverTimer.current = setTimeout(() => setPreview(true), 1000);
  }, []);

  const hidePreview = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setPreview(false);
  }, []);

  const initial = domain ? domain[0].toUpperCase() : '?';

  return (
    <div className="rc" style={{ animationDelay: `${index * 30}ms` }}>
      <div className="rc-cite">
        {faviconFailed ? (
          <div className="rc-favicon-fallback" style={{ background: domainColor(domain) }}>
            {initial}
          </div>
        ) : (
          <img
            src={proxyFavicon(domain, 32)}
            alt=""
            className="rc-favicon"
            loading="lazy"
            decoding="async"
            onError={() => setFaviconFailed(true)}
          />
        )}
        <div className="rc-cite-text">
          <span className="rc-site">{domain}</span>
          <span className="rc-breadcrumb">{breadcrumb}</span>
        </div>
        <button
          className={`rc-copy${copied ? ' rc-copy-done' : ''}`}
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy link'}
        >
          {copied ? <Check size={13} /> : <Link size={13} />}
        </button>
      </div>
      <a
        ref={titleRef}
        href={result.url}
        className="rc-title"
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
      >
        {result.title}
      </a>
      {result.snippet && <p className="rc-snippet">{result.snippet}</p>}

      {preview && createPortal(
        <div
          className="rc-site-preview"
          style={{
            position: 'fixed', 
            top: previewPos.y,
            left: previewPos.x,
            zIndex: 9999,   
            pointerEvents: 'auto'
          }}
          onMouseEnter={() => clearTimeout(hoverTimer.current)}
          onMouseLeave={hidePreview}
        >
          <div className="rc-sp-bar">
            <div className="rc-sp-dots"><span /><span /><span /></div>
            <span className="rc-sp-url">{domain}</span>
          </div>
          <div className="rc-sp-frame-wrap">
            <iframe
              src={result.url}
              className="rc-sp-frame"
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
              title={`Preview of ${domain}`}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

