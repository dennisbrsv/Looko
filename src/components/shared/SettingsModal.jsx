import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';

const REGIONS = [
  { value: 'none', label: 'Default' },
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'es', label: 'Spain' },
  { value: 'jp', label: 'Japan' },
];

const LANGUAGES = [
  { value: 'all', label: 'Any language' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
];

const THEME_COLORS = {
  light: { bg: '#f6f5f1', surface: '#ffffff', accent: '#2a9d8f', text: '#1c1c1a' },
  dark: { bg: '#141516', surface: '#1c1d1f', accent: '#5ec4b4', text: '#e4e2de' },
  solarized: { bg: '#fdf6e3', surface: '#ffffff', accent: '#2aa198', text: '#657b83' },
  'high-contrast': { bg: '#000000', surface: '#111111', accent: '#ffff00', text: '#ffffff' },
};

export function SettingsModal({ onClose }) {
  const { settings, setSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [closing, setClosing] = useState(false);
  const panelRef = useRef(null);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 280);
  };

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closing]);

  return (
    <div
      className={`settings-overlay${closing ? ' settings-overlay-closing' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={panelRef}
        className={`settings-panel${closing ? ' settings-panel-closing' : ''}`}
      >
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="settings-close" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div className="settings-body">
          {/* Theme selection */}
          <section className="settings-section">
            <h3 className="settings-section-title">Appearance</h3>
            <div className="theme-grid">
              {THEMES.map((t) => {
                const colors = THEME_COLORS[t.id];
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    className={`theme-card${isActive ? ' theme-card-active' : ''}`}
                    onClick={() => setTheme(t.id)}
                  >
                    {/* Mini preview */}
                    <div className="theme-preview" style={{ background: colors.bg }}>
                      <div className="theme-preview-bar" style={{ background: colors.surface, borderBottom: `1px solid ${colors.bg}` }}>
                        <div className="theme-preview-dot" style={{ background: colors.accent }} />
                        <div className="theme-preview-line" style={{ background: colors.text, opacity: 0.3, width: '40%' }} />
                      </div>
                      <div className="theme-preview-content">
                        <div className="theme-preview-line" style={{ background: colors.accent, width: '60%', height: 3 }} />
                        <div className="theme-preview-line" style={{ background: colors.text, opacity: 0.15, width: '80%' }} />
                        <div className="theme-preview-line" style={{ background: colors.text, opacity: 0.1, width: '50%' }} />
                      </div>
                    </div>
                    <div className="theme-card-footer">
                      <span className="theme-card-label">{t.label}</span>
                      {isActive && <Check size={14} className="theme-card-check" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Search defaults */}
          <section className="settings-section">
            <h3 className="settings-section-title">Search defaults</h3>
            <p className="settings-section-desc">These preferences apply to every search unless overridden by filters.</p>

            <div className="settings-field">
              <label className="settings-label">Region</label>
              <div className="settings-select-wrap">
                <select
                  className="settings-select"
                  value={settings.region}
                  onChange={(e) => setSettings({ region: e.target.value })}
                >
                  {REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="settings-select-arrow" />
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">Language</label>
              <div className="settings-select-wrap">
                <select
                  className="settings-select"
                  value={settings.language}
                  onChange={(e) => setSettings({ language: e.target.value })}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="settings-select-arrow" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
