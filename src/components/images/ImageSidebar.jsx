
import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { getDomain, proxyImg, proxyFavicon } from '../../lib/utils';

// ── Image Sidebar ──
export function ImageSidebar({ image, onClose }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImgLink, setCopiedImgLink] = useState(false);
  const [copiedImg, setCopiedImg] = useState(false);

  const displaySrc = proxyImg(image.img_src) || proxyImg(image.thumbnail);
  const realImgUrl = image.img_src || image.thumbnail;

  if (!image) return null;

  const handleCopyText = (text, setter) => {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  };

  const handleCopyImage = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopiedImg(true);
      setTimeout(() => setCopiedImg(false), 2000);
    } catch (err) {
      console.error("Failed to copy image", err);
      alert("Could not copy image. Browser might block this action.");
    }
  };

  const highResSrc = proxyImg(image.img_src) || proxyImg(image.thumbnail);

  return (
    <div className="img-sidebar">
      <div className="img-sb-top">
        <button className="img-sb-close" onClick={onClose} title="Close">
          <X size={20} />
        </button>
      </div>

      <div className="img-sb-preview">
        <a href={image.url}>
          <img src={displaySrc} alt={image.title} className="img-sb-img" />
        </a>
      </div>

      <div className="img-sb-info">
        <div className="img-sb-site">
          <img
            src={proxyFavicon(getDomain(image.url), 16)}
            alt=""
            className="img-sb-fav"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <span>{getDomain(image.url)}</span>
        </div>
        <a href={image.url} className="img-sb-title">
          {image.title}
        </a>
        {image.resolution && (
          <span className="img-sb-res">{image.resolution}</span>
        )}
      </div>

      <div className="img-sb-actions">
        <a href={image.url} className="img-sb-btn btn-primary">
          <ExternalLink size={16} />
          <span>Visit</span>
        </a>
        <button
          className="img-sb-btn"
          onClick={() => handleCopyText(image.url, setCopiedLink)}
        >
          {copiedLink ? "Copied!" : "Copy Link"}
        </button>
        <button
          className="img-sb-btn"
          onClick={() => handleCopyText(realImgUrl, setCopiedImgLink)}  // ← real URL
        >
          {copiedImgLink ? "Copied!" : "Copy Image Link"}
        </button>
        <button
          className="img-sb-btn"
          onClick={() => handleCopyImage(realImgUrl)}  // ← fetch from real URL, not proxy
        >
          {copiedImg ? "Copied!" : "Copy Image"}
        </button>
      </div>
    </div>
  );
}

