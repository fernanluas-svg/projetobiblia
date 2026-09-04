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
  branca: {
    name: 'Branco',
    dark: false,
    colors: {
      background: '#FFFFFF',
      surface: '#F7F7F7',
      text: '#222222',
      textMuted: '#666666',
      border: '#E2E8F0',
      primary: '#2f6f4f',
      highlight: '#FFF3B0',
      selection: '#E6EFEA',
      activeGreen: '#2E7D32',
      bar: '#F0F0F0',
      cardVerseBg: '#23523B',
      dark: false,
    },
  },
  creme: {
    name: 'Creme',
    dark: false,
    colors: {
      background: '#F7F4EE',
      surface: '#FFFFFF',
      text: '#222222',
      textMuted: '#6B6560',
      border: '#E4DACC',
      primary: '#2f6f4f',
      highlight: '#FFF3B0',
      selection: '#E3EEE6',
      activeGreen: '#2E7D32',
      bar: '#EFE9DD',
      cardVerseBg: '#2A5540',
      dark: false,
    },
  },
  preto: {
    name: 'Preto',
    dark: true,
    colors: {
      background: '#121212',
      surface: '#1E1E1E',
      text: '#EEEEEE',
      textMuted: '#AAAAAA',
      border: '#333333',
      primary: '#4CAF7D',
      highlight: '#8A7F2F',
      selection: '#274B3A',
      activeGreen: '#66BB6A',
      bar: '#1A1A1A',
      cardVerseBg: '#182C22',
      dark: true,
    },
  },
  azul_escuro: {
    name: 'Azul Escuro',
    dark: true,
    colors: {
      background: '#1E293B',
      surface: '#27364D',
      text: '#E8EEF5',
      textMuted: '#9FB2C7',
      border: '#3B4A5E',
      primary: '#66BB8F',
      highlight: '#8A7F2F',
      selection: '#33465F',
      activeGreen: '#66BB6A',
      bar: '#182230',
      cardVerseBg: '#142030',
      dark: true,
    },
  },
  verde_escuro: {
    name: 'Verde Escuro',
    dark: true,
    colors: {
      background: '#1B3B2B',
      surface: '#22503A',
      text: '#E6F0EA',
      textMuted: '#9DB8A9',
      border: '#2F5543',
      primary: '#66BB8F',
      highlight: '#8A7F2F',
      selection: '#2E5C44',
      activeGreen: '#66BB6A',
      bar: '#143025',
      cardVerseBg: '#12261C',
      dark: true,
    },
  },
  marrom: {
    name: 'Marrom',
    dark: true,
    colors: {
      background: '#2C1D14',
      surface: '#3E2A1E',
      text: '#F5EBE1',
      textMuted: '#C2B2A3',
      border: '#543D2D',
      primary: '#D4A373',
      highlight: '#8A7F2F',
      selection: '#4E3728',
      activeGreen: '#D4A373',
      bar: '#22150E',
      cardVerseBg: '#1D120B',
      dark: true,
    },
  },
  rosa: {
    name: 'Rosa',
    dark: false,
    colors: {
      background: '#F5D7DF',
      surface: '#FFFFFF',
      text: '#4A1C28',
      textMuted: '#7D4552',
      border: '#D9A1B0',
      primary: '#B3254E',
      highlight: '#FFF3B0',
      selection: '#EAA8B8',
      activeGreen: '#B3254E',
      bar: '#E8C5CE',
      cardVerseBg: '#8A1C3C',
      dark: false,
    },
  },
};

export function getThemeConfig(themeKey) {
  return HOME_THEMES[themeKey] ?? HOME_THEMES.creme;
}

export function AppProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [readChapters, setReadChapters] = useState([]);
  const [highlights, setHighlights] = useState({});
  const [fontSize, setFontSize] = useState(16);
  const [themeKey, setThemeKeyState] = useState('creme');
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
          setThemeKeyState(themeRaw);
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

  const updateTheme = (value) => {
    setThemeKeyState(value);
    try {
      AsyncStorage.setItem(HOME_THEME_KEY, value);
    } catch (e) {
      // ignora falhas de escrita
    }
  };

  const theme = getThemeConfig(themeKey).colors;

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
      themeKey,
      fontSize,
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
      updateTheme,
      setFontSize,
    }),
    [favorites, readChapters, highlights, themeKey, fontSize, lastRead, loaded, theme]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
