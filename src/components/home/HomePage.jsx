
import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Sun, Moon, X, Mic, MicOff, Clock, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { LogoIcon } from '../icons/LogoIcon';
import { QuickLinks } from './QuickLinks';
import { HomeWidgets } from './HomeWidgets';

const MAX_HISTORY = 8;
function getHistory() {
  try { return JSON.parse(localStorage.getItem('looko-history') || '[]'); } catch { return []; }
}
function addToHistory(q) {
  const h = getHistory().filter(item => item !== q);
  h.unshift(q);
  try { localStorage.setItem('looko-history', JSON.stringify(h.slice(0, MAX_HISTORY))); } catch {}
}
function clearHistory() {
  try { localStorage.removeItem('looko-history'); } catch {}
}

// ── Home Page ──
export function HomePage({ query, setQuery, onSearch }) {
  const { theme, setTheme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSug, setSelectedSug] = useState(-1);
  const [history, setHistory] = useState(() => getHistory());
  const sugRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const voice = useVoiceInput((text, isFinal) => {
    setQuery(text);
    if (isFinal) setTimeout(() => onSearch(text.trim()), 200);
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    if (val) {
      addToHistory(val);
      setHistory(getHistory());
      onSearch(val);
    }
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
    <div className="home-root">
      <div className="home-topbar">
        <div className="home-topbar-right">
          <button
            className="mode-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>

      <div className="home-center">
        <div
          className="home-logo-wrap"
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div
            initial={{ opacity: 0, rotate: -8 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <LogoIcon size={72} className="home-logo-icon" />
          </div>
          <span
            className="home-logo-text"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            Looko
          </span>
        </div>

        <div
          className={`search-bar search-bar-home${focused ? " search-bar-focus" : ""}`}
          ref={sugRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <Search size={18} className="sb-icon-left" />
          <input
            ref={inputRef}
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
            placeholder="Search the web"
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              className="sb-clear"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                inputRef.current?.focus();
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
          <button
            className="sb-search-btn"
            onClick={() => submit()}
            title="Search"
          >
            <ArrowRight size={18} />
          </button>

          {showSuggestions && suggestions.length > 0 && (
            <div className="sb-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className={`sug-item${i === selectedSug ? " sug-item-sel" : ""}`}
                  onMouseDown={() => {
                    setQuery(s);
                    setShowSuggestions(false);
                    addToHistory(s);
                    setHistory(getHistory());
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

          {/* Search history when input is empty */}
          {focused && !query.trim() && history.length > 0 && !showSuggestions && (
            <div className="sb-suggestions sb-history">
              <div className="sb-history-header">
                <span className="sb-history-title">Recent searches</span>
                <button
                  className="sb-history-clear"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearHistory();
                    setHistory([]);
                  }}
                >
                  <Trash2 size={12} />
                  <span>Clear</span>
                </button>
              </div>
              {history.map((h, i) => (
                <button
                  key={i}
                  className="sug-item"
                  onMouseDown={() => {
                    setQuery(h);
                    onSearch(h);
                  }}
                >
                  <Clock size={13} className="sug-icon" />
                  <span>{h}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <QuickLinks />

        {/* Home Widgets */}
        <HomeWidgets />
      </div>
    </div>
  );
}

