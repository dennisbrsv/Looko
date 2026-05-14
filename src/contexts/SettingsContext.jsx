import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(() => {
    try {
      const stored = localStorage.getItem("search-settings");
      if (stored) return JSON.parse(stored);
    } catch { }
    return { region: "none", language: "all", theme: "light", safesearch: true };
  });

  const setSettings = (newSettings) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem("search-settings", JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
