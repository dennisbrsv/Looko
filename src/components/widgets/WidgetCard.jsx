import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

export default function WidgetCard({ label, onDismiss, children, className = "" }) {
  return (
    <motion.div
      className={`wc ${className}`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="wc-header">
        <span className="wc-label">{label}</span>
        {onDismiss && (
          <button className="wc-dismiss" onClick={onDismiss} aria-label="Dismiss widget">
            <X size={14} />
          </button>
        )}
      </div>
      <div className="wc-body">{children}</div>
    </motion.div>
  );
}
