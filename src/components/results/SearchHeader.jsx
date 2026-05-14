import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, Mic, MicOff, Settings } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { LogoIcon } from '../icons/LogoIcon';
import { TABS } from '../../lib/constants';

// ── Results Header ──
export function SearchHeader({
  query,
  setQuery,
  onSearch,
  loading,
  activeTab,
  setActiveTab,
  onGoHome,
  onToggleSettings
}) {
  const { theme, setTheme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSug, setSelectedSug] = useState(-1);
  const sugRef = useRef(null);
  const debounceRef = useRef(null);

  const voice = useVoiceInput((text, isFinal) => {
    setQuery(text);
    if (isFinal) setTimeout(() => onSearch(text.trim()), 200);
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 150);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    function h(e) {
      if (sugRef.current && !sugRef.current.contains(e.target))
        setShowSuggestions(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const submit = (q) => {
    const val = (q ?? query).trim();
    setShowSuggestions(false);
    setSelectedSug(-1);
    if (val) onSearch(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (selectedSug >= 0 && suggestions[selectedSug]) {
        setQuery(suggestions[selectedSug]);
        submit(suggestions[selectedSug]);
      } else submit();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSug((p) => Math.min(p + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSug((p) => Math.max(p - 1, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <header className="rh">
      <div className="rh-top">
        <button className="rh-logo" onClick={onGoHome}>
          <LogoIcon size={30} />
        </button>

        <div
          className={`search-bar search-bar-results${focused ? " search-bar-focus" : ""}`}
          ref={sugRef}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setSelectedSug(-1);
            }}
            onFocus={() => {
              setFocused(true);
              if (suggestions.length) setShowSuggestions(true);
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            className="sb-input"
            autoComplete="off"
            spellCheck="false"
          />
          <div className="sb-right">
            {query && (
              <button
                className="sb-clear"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                }}
              >
                <X size={18} />
              </button>
            )}
            <div className="sb-divider" />
            <button
              className={`sb-mic${voice.listening ? " sb-mic-active" : ""}`}
              onClick={voice.listening ? voice.stop : voice.start}
              title={voice.listening ? "Stop listening" : "Voice search"}
            >
              {voice.listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            {loading ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <button
                className="sb-search-btn"
                onClick={() => submit()}
                title="Search"
              >
                <Search size={18} />
              </button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="sb-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className={`sug-item${i === selectedSug ? " sug-item-sel" : ""}`}
                  onMouseDown={() => {
                    setQuery(s);
                    setShowSuggestions(false);
                    onSearch(s);
                  }}
                  onMouseEnter={() => setSelectedSug(i)}
                >
                  <Search size={13} className="sug-icon" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rh-right">
          <button
            className="settings-btn"
            onClick={onToggleSettings}
            title="Settings"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      <nav className="rh-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`rh-tab${activeTab === tab.id ? " rh-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

