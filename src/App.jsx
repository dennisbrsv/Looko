import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";
import {
  Search,
  ArrowRight,
  Loader2,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  X,
  Mic,
  MicOff,
  Image as ImageIcon,
  ExternalLink,
  Languages,
  Copy,
  Check,
} from "lucide-react";

// ── Context ──
const ThemeContext = createContext(null);
function useTheme() {
  return useContext(ThemeContext);
}

// ── Constants ──
const RESULTS_PER_PAGE = 20;

const TABS = [
  { id: "all", label: "All" },
  { id: "images", label: "Images" },
  { id: "videos", label: "Videos" },
  { id: "news", label: "News" },
];

const CATEGORY_MAP = {
  all: undefined,
  videos: "videos",
  news: "news",
};

// ── Utilities ──
function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getBreadcrumb(url) {
  try {
    const u = new URL(url);
    const parts = [u.hostname.replace(/^www\./, "")];
    const path = u.pathname.replace(/\/$/, "");
    if (path && path !== "/") {
      const segs = path.split("/").filter(Boolean);
      if (segs.length <= 3) parts.push(...segs);
      else parts.push(segs[0], "…", segs[segs.length - 1]);
    }
    return parts.join(" › ");
  } catch {
    return url;
  }
}

function updateUrl(query, tab) {
  const url = new URL(window.location.href);
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  if (tab && tab !== "all") url.searchParams.set("tab", tab);
  else url.searchParams.delete("tab");
  window.history.pushState({ q: query, tab }, "", url);
}

function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

// ── Proxy helpers ──
function proxyImg(url, displayWidth) {
  if (!url) return null;
  if (!displayWidth) return `/api/proxy/image?url=${encodeURIComponent(url)}`;
  const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
  const size = Math.round(displayWidth * dpr);
  return `/api/proxy/image?url=${encodeURIComponent(url)}&size=${size}`;
}
function proxyFavicon(domain, size = 32) {
  if (!domain) return null;
  return `/api/proxy/favicon?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

// ── Deterministic height so masonry lays out BEFORE images load ──
function estimateImageHeight(result, index, baseWidth = 240) {
  if (result?.resolution) {
    const m = String(result.resolution).match(/(\d+)\s*[×x*]\s*(\d+)/);
    if (m) {
      const w = parseInt(m[1], 10);
      const h = parseInt(m[2], 10);
      if (w > 0 && h > 0) {
        return Math.max(140, Math.min(420, Math.round((h / w) * baseWidth)));
      }
    }
  }
  const key =
    (result?.thumbnail || result?.img_src || result?.url || "") + ":" + index;
  let hash = 0;
  for (let i = 0; i < key.length; i++)
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  const r = (Math.abs(hash) % 1000) / 1000;
  return Math.round(170 + r * 180); // 170..350
}

function distributeToColumns(items, columnCount) {
  if (!items.length) return Array.from({ length: columnCount }, () => []);
  const cols = Array.from({ length: columnCount }, () => []);
  const heights = new Array(columnCount).fill(0);
  for (const item of items) {
    let minIdx = 0;
    for (let i = 1; i < columnCount; i++)
      if (heights[i] < heights[minIdx]) minIdx = i;
    cols[minIdx].push(item);
    heights[minIdx] += (item.height || 200) + 6;
  }
  return cols;
}

// ── Voice Input Hook ──
function useVoiceInput(onResult) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (recRef.current) recRef.current.abort();
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      onResult(transcript, e.results[0].isFinal);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [onResult]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, start, stop };
}

// ── Theme Provider ──
function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem("search-theme") || "dark";
    } catch {
      return "dark";
    }
  });
  const setTheme = useCallback((t) => {
    setThemeState(t);
    try {
      localStorage.setItem("search-theme", t);
    } catch { }
    document.documentElement.setAttribute("data-theme", t);
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Logo ──
function Icon({ size = 28, className = "" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d7e74" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-binoculars-icon lucide-binoculars"><path d="M10 10h4"/><path d="M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3"/><path d="M20 21a2 2 0 0 0 2-2v-3.851c0-1.39-2-2.962-2-4.829V8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2z"/><path d="M 22 16 L 2 16"/><path d="M4 21a2 2 0 0 1-2-2v-3.851c0-1.39 2-2.962 2-4.829V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2z"/><path d="M9 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3"/></svg>
  );
}

// ── Home Page ──
function HomePage({ query, setQuery, onSearch }) {
  const { theme, setTheme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSug, setSelectedSug] = useState(-1);
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
        <div className="home-logo-wrap">
          <Icon size={72} className="home-logo-icon" />
          <span className="home-logo-text">Looko</span>

        </div>

        <div
          className={`search-bar search-bar-home${focused ? " search-bar-focus" : ""}`}
          ref={sugRef}
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
      </div>
    </div>
  );
}

// ── Results Header ──
function SearchHeader({
  query,
  setQuery,
  onSearch,
  loading,
  activeTab,
  setActiveTab,
  onGoHome,
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
          <Icon size={30} />
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
            className="mode-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
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

// ── Result Card ──
function ResultCard({ result, index }) {
  const domain = getDomain(result.url);
  const breadcrumb = getBreadcrumb(result.url);
  return (
    <div className="rc" style={{ animationDelay: `${index * 30}ms` }}>
      <div className="rc-cite">
        <img
          src={proxyFavicon(domain, 32)}
          alt=""
          className="rc-favicon"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />
        <div className="rc-cite-text">
          <span className="rc-site">{domain}</span>
          <span className="rc-breadcrumb">{breadcrumb}</span>
        </div>
      </div>
      <a href={result.url} className="rc-title">
        {result.title}
      </a>
      {result.snippet && <p className="rc-snippet">{result.snippet}</p>}
    </div>
  );
}

// ── Image Sidebar ──
function ImageSidebar({ image, onClose }) {
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

// ── Image Card (lazy, no NSFW) ──
function ImageCard({ result, index, src, height, eager, selected, onSelect }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(eager);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (eager || visible) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [eager, visible]);

  if (failed) return null;

  return (
    <div
      ref={ref}
      className={`img-card${selected ? " img-card-sel" : ""}`}
      style={{ animationDelay: `${(index % 12) * 18}ms` }}
      onClick={() => onSelect(result)}
    >
      <div
        className="img-thumb-wrap"
        style={{ height: `${height}px` }}
      >
        {visible && (
          <img
            src={src}
            alt={result.title || ""}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            fetchpriority={eager ? "high" : "auto"}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={loaded ? "is-loaded" : ""}
          />
        )}
      </div>
      <div className="img-meta-overlay">
        <span className="img-title">
          {result.title || getDomain(result.url)}
        </span>
        <span className="img-domain">{getDomain(result.url)}</span>
      </div>
    </div>
  );
}

// ── Image Results ──
function ImageResults({ results, selectedImage, onSelectImage }) {
  const containerRef = useRef(null);
  const [colCount, setColCount] = useState(5);
  const { ref, width } = useElementWidth();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth || 800;
      if (w > 1400) setColCount(6);
      else if (w > 1100) setColCount(5);
      else if (w > 820) setColCount(4);
      else if (w > 560) setColCount(3);
      else setColCount(2);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pre-compute everything once per results/colCount, before any image loads
  const columns = useMemo(() => {
    const colWidth = width ? Math.round(width / colCount) : 240;  // ← per-column width
    const items = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const src = proxyImg(r.thumbnail, colWidth) || proxyImg(r.img_src, colWidth);  // ← sized
      if (!src) continue;
      items.push({ result: r, index: i, src, height: estimateImageHeight(r, i) });
    }
    return distributeToColumns(items, colCount);
  }, [results, colCount, width]);

  // First (colCount * 2) items load eagerly — those that show on screen
  const eagerThreshold = colCount * 2;

  if (!results.length)
    return (
      <div className="no-results">
        <ImageIcon size={18} />
        <span>No images found</span>
      </div>
    );

  return (
    <div className="img-masonry" ref={containerRef}>
      {columns.map((col, ci) => (
        <div key={ci} className="img-masonry-col">
          {col.map(({ result: r, index: i, src, height }) => (
            <ImageCard
              key={`${r.url}-${i}`}
              result={r}
              index={i}
              src={src}
              height={height}
              eager={i < eagerThreshold}
              selected={selectedImage?.url === r.url}
              onSelect={onSelectImage}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Skeletons ──
function LoadingSkeleton() {
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

function ImageSkeleton({ colCount = 5 }) {
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

// ── Pagination ──
function Pagination({ currentPage, totalResults, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalResults / RESULTS_PER_PAGE));
  if (totalPages <= 1) return null;

  const maxVisible = 10;
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(0, currentPage - half);
  let end = Math.min(totalPages - 1, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(0, end - maxVisible + 1);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="pg">
      <div className="pg-logo">
        {"search".split("").map((ch, i) => (
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
        {pages.map((p) => (
          <button
            key={p}
            className={`pg-num${p === currentPage ? " pg-num-active" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </button>
        ))}
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

// ── Main App ──
export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTime, setSearchTime] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const initialLoadDone = useRef(false);
  const marqueeRef = useRef(null);

  // Marquee title
  useEffect(() => {
    if (marqueeRef.current) clearInterval(marqueeRef.current);
    if (!hasSearched || !query.trim() || searching) {
      document.title = "Looko";
      return;
    }
    const segment = `"${query.trim()}" - ${totalResults.toLocaleString()} results`;
    const sep = "  ·  ";
    const repeat = Math.max(4, Math.ceil(80 / segment.length));
    const full = Array.from({ length: repeat }, () => segment).join(sep) + sep;
    let pos = 0;
    document.title = full.slice(0, 50);
    marqueeRef.current = setInterval(() => {
      pos = (pos + 1) % (segment.length + sep.length);
      document.title = full.slice(pos, pos + 50);
    }, 300);
    return () => {
      if (marqueeRef.current) clearInterval(marqueeRef.current);
    };
  }, [query, hasSearched, searching, totalResults]);

  const doSearch = useCallback(
    async (q, page = 0, tab = null) => {
      const trimmed = (q ?? query).trim();
      const usedTab = tab || activeTab;
      if (!trimmed) {
        setHasSearched(false);
        setResults([]);
        return;
      }

      setSearching(true);
      setHasSearched(true);
      setCurrentPage(page);
      setSelectedImage(null);
      const t0 = performance.now();

      try {
        const isImages = usedTab === "images";
        const endpoint = isImages ? "/api/search/images" : "/api/search/web";
        const params = new URLSearchParams({
          q: trimmed,
          limit: String(RESULTS_PER_PAGE),
          pageno: String(page + 1),
        });
        if (!isImages && CATEGORY_MAP[usedTab]) {
          params.set("categories", CATEGORY_MAP[usedTab]);
        }

        const res = await fetch(`${endpoint}?${params}`);
        const data = await res.json();
        setResults(data.results || []);
        setTotalResults(data.total || (data.results || []).length);
        setSearchTime(((performance.now() - t0) / 1000).toFixed(2));
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
        setSearchTime(null);
      } finally {
        setSearching(false);
      }
    },
    [query, activeTab],
  );

  // Read ?q= on mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const tab = params.get("tab") || "all";
    if (q && q.trim()) {
      setQuery(q.trim());
      setActiveTab(tab);
      doSearch(q.trim(), 0, tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Browser back/forward
  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q") || "";
      const tab = params.get("tab") || "all";
      if (q.trim()) {
        setQuery(q.trim());
        setActiveTab(tab);
        doSearch(q.trim(), 0, tab);
      } else {
        setQuery("");
        setHasSearched(false);
        setResults([]);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    updateUrl(trimmed, activeTab);
    doSearch(trimmed, 0, activeTab);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (hasSearched && query.trim()) {
      updateUrl(query, tab);
      doSearch(query, 0, tab);
    }
  };

  const handlePageChange = (page) => {
    doSearch(query, page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goHome = () => {
    setHasSearched(false);
    setResults([]);
    setQuery("");
    setActiveTab("all");
    setSearchTime(null);
    setTotalResults(0);
    document.title = "search";
    const url = new URL(window.location.href);
    url.search = "";
    window.history.pushState({}, "", url);
  };

  const isImages = activeTab === "images";

  return (
    <ThemeProvider>
      {!hasSearched ? (
        <HomePage
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
        />
      ) : (
        <div className="app-root">
          <SearchHeader
            query={query}
            setQuery={setQuery}
            onSearch={handleSearch}
            loading={searching}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            onGoHome={goHome}
          />

          <main
            className={`results-main${isImages ? " results-main-images" : ""}`}
          >
            <div className="results-body">
              {searching ? (
                isImages ? (
                  <div className="img-grid-container">
                    <ImageSkeleton />
                  </div>
                ) : (
                  <LoadingSkeleton />
                )
              ) : results.length === 0 ? (
                <div className="no-results">
                  <Search size={18} />
                  <span>
                    No results found for <strong>{query}</strong>
                  </span>
                </div>
              ) : isImages ? (
                <div
                  className={`img-layout${selectedImage ? " img-layout-split" : ""}`}
                >
                  <div className="img-grid-container">
                    <ImageResults
                      results={results}
                      selectedImage={selectedImage}
                      onSelectImage={setSelectedImage}
                    />
                    <Pagination
                      currentPage={currentPage}
                      totalResults={totalResults}
                      onPageChange={handlePageChange}
                    />
                  </div>
                  {selectedImage && (
                    <ImageSidebar
                      image={selectedImage}
                      onClose={() => setSelectedImage(null)}
                    />
                  )}
                </div>
              ) : (
                <>
                  {searchTime && (
                    <p className="results-stats">
                      About {totalResults.toLocaleString()} results (
                      {searchTime} seconds)
                    </p>
                  )}
                  <div className="rc-list">
                    {results.map((r, i) => (
                      <ResultCard key={`${r.url}-${i}`} result={r} index={i} />
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalResults={totalResults}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          </main>
        </div>
      )}
    </ThemeProvider>
  );
}