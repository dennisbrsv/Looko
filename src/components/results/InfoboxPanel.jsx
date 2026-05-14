import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';

export function InfoboxPanel({ infobox }) {
  if (!infobox) return null;

  const { infobox: title, content, img_src, urls, id } = infobox;
  if (!title && !content) return null;

  return (
    <motion.div
      className="ib"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {img_src && (
        <div className="ib-img-wrap">
          <img src={img_src} alt={title} className="ib-img" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
      )}
      <div className="ib-content">
        <h3 className="ib-title">{title}</h3>
        {id && <span className="ib-source">{id}</span>}
        {content && <p className="ib-desc">{content}</p>}
        {urls && urls.length > 0 && (
          <div className="ib-links">
            {urls.slice(0, 4).map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="ib-link">
                <ExternalLink size={12} />
                <span>{link.title}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
