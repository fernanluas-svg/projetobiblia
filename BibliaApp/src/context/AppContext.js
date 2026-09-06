import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { translate, SUPPORTED_LANGUAGES } from '../i18n';

const AppContext = createContext(null);

const isNative = Platform.OS !== 'web';
const Notifications = isNative ? require('expo-notifications') : null;
const NOTIF_CHANNEL_ID = 'versiculo-do-dia';

if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    // módulo nativo indisponível (ex.: binário antigo)
  }
}

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
  const [textAlign, setTextAlignState] = useState('left');
  const [language, setLanguageState] = useState('pt-BR');
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [dailyVerseEnabled, setDailyVerseEnabledState] = useState(false);
  const [dailyVerseTime, setDailyVerseTimeState] = useState('07:00');

  const LAST_READ_KEY = '@bibliaapp/lastRead';
  const HOME_THEME_KEY = '@bibliaapp/homeTheme';
  const READ_CHAPTERS_KEY = '@bibliaapp/readChapters';
  const FAVORITES_KEY = '@bibliaapp/favorites';
  const HIGHLIGHTS_KEY = '@bibliaapp/highlights';
  const TEXT_ALIGN_KEY = '@bibliaapp/textAlign';
  const LANGUAGE_KEY = '@bibliaapp/language';
  const NOTIFICATIONS_ENABLED_KEY = '@bibliaapp/notificationsEnabled';
  const DAILY_VERSE_ENABLED_KEY = '@bibliaapp/dailyVerseEnabled';
  const DAILY_VERSE_TIME_KEY = '@bibliaapp/dailyVerseTime';

  const TEXT_ALIGN_OPTIONS = ['left', 'right', 'center', 'justify'];

  const persist = (key, value) => {
    try {
      AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // ignora falhas de escrita
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [raw, themeRaw, readRaw, favoritesRaw, highlightsRaw, textAlignRaw, languageRaw, notifEnabledRaw, dailyVerseEnabledRaw, dailyVerseTimeRaw] =
          await Promise.all([
            AsyncStorage.getItem(LAST_READ_KEY),
            AsyncStorage.getItem(HOME_THEME_KEY),
            AsyncStorage.getItem(READ_CHAPTERS_KEY),
            AsyncStorage.getItem(FAVORITES_KEY),
            AsyncStorage.getItem(HIGHLIGHTS_KEY),
            AsyncStorage.getItem(TEXT_ALIGN_KEY),
            AsyncStorage.getItem(LANGUAGE_KEY),
            AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY),
            AsyncStorage.getItem(DAILY_VERSE_ENABLED_KEY),
            AsyncStorage.getItem(DAILY_VERSE_TIME_KEY),
          ]);
        if (active && raw) {
          setLastReadState(JSON.parse(raw));
        }
        if (active && themeRaw && HOME_THEMES[themeRaw]) {
          setThemeKeyState(themeRaw);
        }
        if (active && textAlignRaw) {
          try {
            const parsedAlign = JSON.parse(textAlignRaw);
            if (TEXT_ALIGN_OPTIONS.includes(parsedAlign)) {
              setTextAlignState(parsedAlign);
            }
          } catch (e) {
            // ignora dados corrompidos
          }
        }
        if (active && languageRaw) {
          try {
            const parsedLanguage = JSON.parse(languageRaw);
            if (SUPPORTED_LANGUAGES.includes(parsedLanguage)) {
              setLanguageState(parsedLanguage);
            }
          } catch (e) {
            // ignora dados corrompidos
          }
        }
        if (active && notifEnabledRaw) {
          setNotificationsEnabledState(notifEnabledRaw === 'true');
        }
        if (active && dailyVerseEnabledRaw) {
          setDailyVerseEnabledState(dailyVerseEnabledRaw === 'true');
        }
        if (active && dailyVerseTimeRaw) {
          try {
            const parsedTime = JSON.parse(dailyVerseTimeRaw);
            if (typeof parsedTime === 'string' && /^\d{2}:\d{2}$/.test(parsedTime)) {
              setDailyVerseTimeState(parsedTime);
            }
          } catch (e) {
            // ignora dados corrompidos
          }
        }
        if (active && readRaw) {
          try {
            setReadChapters(JSON.parse(readRaw));
          } catch (e) {
            // ignora dados corrompidos
          }
        }
        if (active && favoritesRaw) {
          try {
            setFavorites(JSON.parse(favoritesRaw));
          } catch (e) {
            // ignora dados corrompidos
          }
        }
        if (active && highlightsRaw) {
          try {
            setHighlights(JSON.parse(highlightsRaw));
          } catch (e) {
            // ignora dados corrompidos
          }
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

  const setTextAlign = (value) => {
    setTextAlignState(value);
    persist(TEXT_ALIGN_KEY, value);
  };

  const setLanguage = (value) => {
    setLanguageState(value);
    persist(LANGUAGE_KEY, value);
  };

  const t = useCallback((key, params) => translate(language, key, params), [language]);

  const ensureNotificationPermission = async () => {
    if (!Notifications) return true;
    try {
      const current = await Notifications.getPermissionsAsync();
      if (current.granted) return true;
      const requested = await Notifications.requestPermissionsAsync();
      return requested.granted;
    } catch (e) {
      return true;
    }
  };

  const setNotificationsEnabled = async (value) => {
    if (value && !(await ensureNotificationPermission())) {
      return false;
    }
    setNotificationsEnabledState(value);
    persist(NOTIFICATIONS_ENABLED_KEY, value);
    return true;
  };

  const setDailyVerseEnabled = (value) => {
    setDailyVerseEnabledState(value);
    persist(DAILY_VERSE_ENABLED_KEY, value);
  };

  const setDailyVerseTime = (value) => {
    setDailyVerseTimeState(value);
    persist(DAILY_VERSE_TIME_KEY, value);
  };

  useEffect(() => {
    if (!loaded || !Notifications) return;
    (async () => {
      try {
        if (!notificationsEnabled || !dailyVerseEnabled) {
          await Notifications.cancelAllScheduledNotificationsAsync();
          return;
        }
        const [hour, minute] = (dailyVerseTime || '07:00').split(':').map(Number);
        await Notifications.setNotificationChannelAsync(NOTIF_CHANNEL_ID, {
          name: translate(language, 'notifVerseTitle'),
          importance: Notifications.AndroidImportance.HIGH,
        });
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.scheduleNotificationAsync({
          content: {
            title: translate(language, 'notifVerseTitle'),
            body: translate(language, 'notifVerseBody'),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: NOTIF_CHANNEL_ID,
          },
        });
      } catch (e) {
        // ignora falhas de agendamento
      }
    })();
  }, [loaded, notificationsEnabled, dailyVerseEnabled, dailyVerseTime, language]);

  const toggleFavorite = (verse) => {
    const next = favorites.some((f) => f.key === verse.key)
      ? favorites.filter((f) => f.key !== verse.key)
      : [verse, ...favorites];
    setFavorites(next);
    persist(FAVORITES_KEY, next);
  };

  const isFavorite = (verseKey) => favorites.some((f) => f.key === verseKey);

  const toggleHighlight = (verseKey, color) => {
    const next = { ...highlights };
    if (next[verseKey] === color) {
      delete next[verseKey];
    } else {
      next[verseKey] = color;
    }
    setHighlights(next);
    persist(HIGHLIGHTS_KEY, next);
  };

  const getHighlight = (verseKey) => highlights[verseKey] ?? null;

  const setHighlight = (verseKey, color) => {
    const next = { ...highlights };
    if (!color) {
      delete next[verseKey];
    } else {
      next[verseKey] = color;
    }
    setHighlights(next);
    persist(HIGHLIGHTS_KEY, next);
  };

  const toggleChapterRead = (chapterKey) => {
    const next = readChapters.includes(chapterKey)
      ? readChapters.filter((k) => k !== chapterKey)
      : [...readChapters, chapterKey];
    setReadChapters(next);
    persist(READ_CHAPTERS_KEY, next);
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
      textAlign,
      language,
      notificationsEnabled,
      dailyVerseEnabled,
      dailyVerseTime,
      t,
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
      setTextAlign,
      setLanguage,
      setNotificationsEnabled,
      setDailyVerseEnabled,
      setDailyVerseTime,
    }),
    [
      favorites,
      readChapters,
      highlights,
      themeKey,
      fontSize,
      lastRead,
      loaded,
      theme,
      textAlign,
      language,
      notificationsEnabled,
      dailyVerseEnabled,
      dailyVerseTime,
      t,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
