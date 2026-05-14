
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Search } from "lucide-react";
import detectWidget from "./lib/detectWidget";
import DesmosWidget from "./components/widgets/DesmosWidget";
import MapWidget from "./components/widgets/MapWidget";
import CalculatorWidget from "./components/widgets/CalculatorWidget";

import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import { RESULTS_PER_PAGE, CATEGORY_MAP } from "./lib/constants";
import { updateUrl } from "./lib/utils";

import { HomePage } from "./components/home/HomePage";
import { SearchHeader } from "./components/results/SearchHeader";
import { ResultCard } from "./components/results/ResultCard";
import { Pagination } from "./components/shared/Pagination";
import { LoadingSkeleton, ImageSkeleton } from "./components/shared/Skeletons";
import { ImageResults } from "./components/images/ImageResults";
import { ImageSidebar } from "./components/images/ImageSidebar";

import { SettingsModal } from "./components/shared/SettingsModal";
import { FilterSidebar } from "./components/results/FilterSidebar";
import { InfoboxPanel } from "./components/results/InfoboxPanel";

// ── Main App ──
function MainApp() {
  const { settings } = useSettings();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTime, setSearchTime] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [infoboxes, setInfoboxes] = useState([]);

  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ time_range: "", language: "all" });

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
      setDismissedWidget(false);
      const t0 = performance.now();

      try {
        const isImages = usedTab === "images";
        const endpoint = isImages ? "/api/search/images" : "/api/search/web";
        const params = new URLSearchParams({
          q: trimmed,
          limit: String(RESULTS_PER_PAGE),
          pageno: String(page + 1),
        });

        const applyLanguage = filters.language !== "all" ? filters.language : (settings.language !== "all" ? settings.language : "");
        if (applyLanguage) params.set("language", applyLanguage);

        if (filters.time_range) params.set("time_range", filters.time_range);

        if (settings.safesearch !== undefined) {
          params.set("safesearch", settings.safesearch ? "1" : "0");
        }

        if (!isImages && CATEGORY_MAP[usedTab]) {
          params.set("categories", CATEGORY_MAP[usedTab]);
        }

        const res = await fetch(`${endpoint}?${params}`);
        const data = await res.json();
        setResults(data.results || []);
        setTotalResults(data.total || (data.results || []).length);
        setSearchTime(((performance.now() - t0) / 1000).toFixed(2));
        if (data.infoboxes && data.infoboxes.length > 0) {
          setInfoboxes(data.infoboxes);
        } else {
          setInfoboxes([]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
        setSearchTime(null);
      } finally {
        setSearching(false);
      }
    },
    [query, activeTab, filters, settings],
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

  useEffect(() => {
    if (hasSearched && query.trim()) {
      doSearch(query, 0, activeTab);
    }
  }, [filters, settings.language]);

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
  const widgetInfo = useMemo(() => detectWidget(query), [query]);
  const [dismissedWidget, setDismissedWidget] = useState(false);

  return (
    <>
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
            onToggleSettings={() => setShowSettings(true)}
          />

          <main
            className={`results-main${isImages ? " results-main-images" : ""}`}
          >
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              isOpen={showFilters}
              toggleSidebar={() => setShowFilters(!showFilters)}
            />

            <div className="results-body">
              {widgetInfo && !dismissedWidget && !isImages && (
                <div className="widgets-area">
                  {widgetInfo.type === 'desmos' && (
                    <DesmosWidget expression={widgetInfo.expression} label={widgetInfo.label} onDismiss={() => setDismissedWidget(true)} />
                  )}
                  {widgetInfo.type === 'map' && (
                    <MapWidget location={widgetInfo.location} label={widgetInfo.label} onDismiss={() => setDismissedWidget(true)} />
                  )}
                  {widgetInfo.type === 'calculator' && (
                    <CalculatorWidget expression={widgetInfo.expression} result={widgetInfo.result} label={widgetInfo.label} onDismiss={() => setDismissedWidget(true)} />
                  )}
                </div>
              )}

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
                    <div className="results-toolbar">
                      <p className="results-stats">
                        About {totalResults.toLocaleString()} results ({searchTime} seconds)
                      </p>
                    </div>
                  )}

                  {infoboxes.length > 0 && (
                    <InfoboxPanel infobox={infoboxes[0]} />
                  )}

                  <div className="rc-list">
                    {results.map((r, i) => (
                      <ResultCard
                        key={r.url}
                        result={r}
                        index={i}
                      />
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

      {/* Settings panel - rendered as overlay at root level */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <MainApp />
      </SettingsProvider>
    </ThemeProvider>
  );
}