import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext(null);

export const HIGHLIGHT_COLORS = {
  Amarelo: { bg: 'rgba(255, 211, 0, 0.28)', swatch: '#FFD300' },
  Roxo: { bg: 'rgba(128, 0, 128, 0.28)', swatch: '#800080' },
  Verde: { bg: 'rgba(46, 125, 50, 0.28)', swatch: '#2e7d32' },
  Rosa: { bg: 'rgba(233, 30, 99, 0.28)', swatch: '#e91e63' },
  Azul: { bg: 'rgba(33, 150, 243, 0.28)', swatch: '#2196f3' },
  Laranja: { bg: 'rgba(255, 152, 0, 0.28)', swatch: '#FF9800' },
};

export const HIGHLIGHT_ORDER = ['Amarelo', 'Roxo', 'Verde', 'Rosa', 'Azul', 'Laranja'];

export const HOME_THEMES = {
  branca: { name: 'Branco', bg: '#FFFFFF', dark: false },
  creme: { name: 'Creme', bg: '#F7F4EE', dark: false },
  preto: { name: 'Preto', bg: '#121212', dark: true },
  azul_escuro: { name: 'Azul Escuro', bg: '#1E293B', dark: true },
  verde_escuro: { name: 'Verde Escuro', bg: '#1B3B2B', dark: true },
};

const lightColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#222222',
  textMuted: '#666666',
  border: '#cccccc',
  primary: '#2f6f4f',
  highlight: '#fff3b0',
  selection: '#cde8da',
  activeGreen: '#2e7d32',
  bar: '#f0f0f0',
};

const darkColors = {
  background: '#121212',
  surface: '#1e1e1e',
  text: '#eeeeee',
  textMuted: '#aaaaaa',
  border: '#333333',
  primary: '#4caf7d',
  highlight: '#8a7f2f',
  selection: '#274b3a',
  activeGreen: '#66bb6a',
  bar: '#1a1a1a',
};

export function AppProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [readChapters, setReadChapters] = useState([]);
  const [highlights, setHighlights] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [homeTheme, setHomeTheme] = useState('creme');
  const [lastRead, setLastReadState] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const LAST_READ_KEY = '@bibliaapp/lastRead';
  const HOME_THEME_KEY = '@bibliaapp/homeTheme';

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [raw, themeRaw] = await Promise.all([
          AsyncStorage.getItem(LAST_READ_KEY),
          AsyncStorage.getItem(HOME_THEME_KEY),
        ]);
        if (active && raw) {
          setLastReadState(JSON.parse(raw));
        }
        if (active && themeRaw && HOME_THEMES[themeRaw]) {
          setHomeTheme(themeRaw);
        }
      } catch (e) {
        // ignora falhas de leitura
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setLastRead = (value) => {
    setLastReadState(value);
    try {
      AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify(value));
    } catch (e) {
      // ignora falhas de escrita
    }
  };

  const updateHomeTheme = (value) => {
    setHomeTheme(value);
    try {
      AsyncStorage.setItem(HOME_THEME_KEY, value);
    } catch (e) {
      // ignora falhas de escrita
    }
  };

  const theme = darkMode ? darkColors : lightColors;

  const toggleFavorite = (verse) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.key === verse.key);
      if (exists) {
        return prev.filter((f) => f.key !== verse.key);
      }
      return [verse, ...prev];
    });
  };

  const isFavorite = (verseKey) => favorites.some((f) => f.key === verseKey);

  const toggleHighlight = (verseKey, color) => {
    setHighlights((prev) => {
      const next = { ...prev };
      if (next[verseKey] === color) {
        delete next[verseKey];
      } else {
        next[verseKey] = color;
      }
      return next;
    });
  };

  const getHighlight = (verseKey) => highlights[verseKey] ?? null;

  const setHighlight = (verseKey, color) => {
    setHighlights((prev) => {
      const next = { ...prev };
      if (!color) {
        delete next[verseKey];
      } else {
        next[verseKey] = color;
      }
      return next;
    });
  };

  const toggleChapterRead = (chapterKey) => {
    setReadChapters((prev) => {
      if (prev.includes(chapterKey)) {
        return prev.filter((k) => k !== chapterKey);
      }
      return [...prev, chapterKey];
    });
  };

  const isChapterRead = (chapterKey) => readChapters.includes(chapterKey);

  const value = useMemo(
    () => ({
      favorites,
      readChapters,
      highlights,
      darkMode,
      fontSize,
      homeTheme,
      lastRead,
      loaded,
      theme,
      toggleFavorite,
      isFavorite,
      toggleChapterRead,
      isChapterRead,
      toggleHighlight,
      getHighlight,
      setHighlight,
      setLastRead,
      setDarkMode,
      setFontSize,
      updateHomeTheme,
    }),
    [favorites, readChapters, highlights, darkMode, fontSize, homeTheme, lastRead, loaded, theme]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
