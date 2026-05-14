import React, { useRef, useEffect, useState } from 'react';
import { SlidersHorizontal, X, Clock, Globe, ChevronDown } from 'lucide-react';

const DATE_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: 'day', label: 'Past 24 hours' },
  { value: 'week', label: 'Past week' },
  { value: 'month', label: 'Past month' },
  { value: 'year', label: 'Past year' },
];

const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'All regions' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'es-ES', label: 'Español' },
  { value: 'it-IT', label: 'Italiano' },
  { value: 'pt-BR', label: 'Português' },
  { value: 'ru-RU', label: 'Русский' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'zh-CN', label: '中文' },
];

function FilterChip({ label, active, onClick }) {
  return (
    <button
      className={`filter-chip${active ? ' filter-chip-active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function FilterSelect({ icon: Icon, value, options, onChange }) {
  return (
    <div className="filter-select-wrap">
      <Icon size={14} className="filter-select-icon" />
      <select className="filter-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={12} className="filter-select-arrow" />
    </div>
  );
}

export function FilterSidebar({ filters, setFilters, isOpen, toggleSidebar }) {
  const sidebarRef = useRef(null);
  const [rendered, setRendered] = useState(isOpen);

  // Handle mount/unmount with animation
  useEffect(() => {
    if (isOpen) {
      setRendered(true);
    } else {
      const timer = setTimeout(() => setRendered(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const hasActiveFilters = filters.time_range || filters.language !== 'all';

  // Collapsed trigger button
  if (!isOpen && !rendered) {
    return (
      <div className="filter-trigger-wrap">
        <button
          className={`filter-trigger${hasActiveFilters ? ' filter-trigger-active' : ''}`}
          onClick={toggleSidebar}
          title="Open filters"
        >
          <SlidersHorizontal size={16} />
          {hasActiveFilters && <span className="filter-trigger-dot" />}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className={`filter-backdrop${isOpen ? ' filter-backdrop-visible' : ''}`}
        onClick={toggleSidebar}
      />

      <aside
        ref={sidebarRef}
        className={`filter-sidebar${isOpen ? ' filter-sidebar-open' : ' filter-sidebar-closing'}`}
      >
        <div className="filter-sidebar-header">
          <div className="filter-sidebar-title">
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </div>
          <button className="filter-close" onClick={toggleSidebar}>
            <X size={16} />
          </button>
        </div>

        <div className="filter-sidebar-body">
          {/* Date range as chips */}
          <div className="filter-section">
            <div className="filter-section-label">
              <Clock size={13} />
              <span>Date range</span>
            </div>
            <div className="filter-chips">
              {DATE_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  active={filters.time_range === opt.value}
                  onClick={() => setFilters({ ...filters, time_range: opt.value })}
                />
              ))}
            </div>
          </div>

          {/* Language as select */}
          <div className="filter-section">
            <div className="filter-section-label">
              <Globe size={13} />
              <span>Region</span>
            </div>
            <FilterSelect
              icon={Globe}
              value={filters.language}
              options={LANGUAGE_OPTIONS}
              onChange={(v) => setFilters({ ...filters, language: v })}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="filter-sidebar-footer">
            <button
              className="filter-clear"
              onClick={() => setFilters({ time_range: '', language: 'all' })}
            >
              Clear all filters
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
