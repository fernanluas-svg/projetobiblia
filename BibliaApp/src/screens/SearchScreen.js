import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { getBooks, getBook } from '../data/books';
import {
  toSafeString,
  normalizeText,
  sanitizeSearchTerm,
  isValidSearchTerm,
  escapeRegExp,
} from '../utils/sanitize';

const RECENT_SEARCHES_KEY = '@biblia_recent_searches';
const MAX_RECENT = 8;
const PAGE_SIZE = 20;

// Divide o texto do versículo em partes, destacando cada ocorrência isolada da palavra.
// O texto é quebrado em tokens de palavra e separadores preservados; um token é marcado
// como "highlight" quando sua forma normalizada (sem acentos) é igual ao termo buscado.
function splitHighlight(verseText, normalizedTerm) {
  const parts = [];
  const safeVerseText = toSafeString(verseText);
  const tokenRegex = /([\p{L}\p{N}]+)|([^\p{L}\p{N}]+)/gu;
  let match;

  while ((match = tokenRegex.exec(safeVerseText)) !== null) {
    const word = match[1];
    const separator = match[2];
    if (word) {
      const isMatch = normalizeText(word) === normalizedTerm;
      parts.push({ text: word, highlight: isMatch });
    } else if (separator) {
      parts.push({ text: separator, highlight: false });
    }
  }

  return parts;
}

export default function SearchScreen({ navigation }) {
  const { theme, t } = useApp();
  const [query, setQuery] = useState('');
  const [allResults, setAllResults] = useState([]);
  const [visibleResults, setVisibleResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bibleData, setBibleData] = useState([]);

  // Carregar histórico recente e pré-carregar os dados dos livros
  useEffect(() => {
    loadRecentSearches();
    loadAllBibleData();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.filter((item) => typeof item === 'string'));
        }
      }
    } catch (e) {
      // erro ao carregar
    }
  };

  const saveRecentSearch = async (searchTerm) => {
    const trimmed = toSafeString(searchTerm).replace(/\s+/g, ' ').trim();
    if (!trimmed || !isValidSearchTerm(trimmed)) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((item) => item !== trimmed)].slice(0, MAX_RECENT);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      // erro ao salvar
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      // erro ao limpar
    }
  };

  const loadAllBibleData = async () => {
    try {
      const bookList = getBooks();
      // Carrega cada livro individualmente; falhas isoladas não derrubam o restante.
      const settled = await Promise.allSettled(
        bookList.map(async (b) => {
          const full = await getBook(b.abbrev);
          return { meta: b, full };
        })
      );
      const resolved = settled
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);
      setBibleData(resolved);
      return resolved;
    } catch (e) {
      // erro ao carregar livros
      return [];
    } finally {
      setDataReady(true);
    }
  };

  const performSearch = async (searchTerm, clearPaginate = true) => {
    const rawTerm = sanitizeSearchTerm(searchTerm ?? query);

    // Entrada vazia ou composta apenas de símbolos: volta à lista padrão sem quebrar.
    if (!isValidSearchTerm(rawTerm)) {
      setAllResults([]);
      setVisibleResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    Keyboard.dismiss();
    if (clearPaginate) saveRecentSearch(rawTerm);

    try {
      // Garante que os dados da Bíblia estejam carregados antes de buscar
      const data = bibleData.length > 0
        ? bibleData
        : await loadAllBibleData();

      // Busca exata por palavras usando word boundary (\b) e sem distinção de maiúsculas/acentos
      const escapedTerm = escapeRegExp(rawTerm);
      const termRegex = new RegExp(`\\b${escapedTerm}\\b`, 'g');

      const foundVerses = [];

      for (const item of data) {
        const { meta, full } = item;
        if (!full || !full.chapters) continue;

        // Percorre capítulos e versículos procurando o termo exato no texto
        full.chapters.forEach((chapter, cIndex) => {
          if (!Array.isArray(chapter)) return;
          chapter.forEach((verseObj, vIndex) => {
            const verseText =
              typeof verseObj === 'object'
                ? verseObj.text || verseObj.verse || ''
                : verseObj;
            if (!toSafeString(verseText)) return;

            // A verificação com Regex ocorre EXCLUSIVAMENTE sobre o texto do versículo.
            const normalizedVerse = normalizeText(verseText);
            termRegex.lastIndex = 0;
            const verseMatch = termRegex.test(normalizedVerse);

            if (verseMatch) {
              foundVerses.push({
                key: `${meta.abbrev}:${cIndex}:${vIndex}`,
                bookMeta: meta,
                bookName: meta.name,
                chapterIndex: cIndex,
                verseIndex: vIndex,
                reference: `${meta.name} ${cIndex + 1}:${vIndex + 1}`,
                text: verseText,
                normalizedTerm: rawTerm,
              });
            }
          });
        });
      }

      // Guarda todo o array em memória, mas renderiza apenas o primeiro PAGE_SIZE
      setAllResults(foundVerses);
      setVisibleResults(foundVerses.slice(0, PAGE_SIZE));
    } catch (e) {
      // Falha inesperada: restaura o estado padrão sem disparar exceções
      setAllResults([]);
      setVisibleResults([]);
      setHasSearched(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    setVisibleResults((prev) => {
      if (prev.length >= allResults.length) return prev;
      return allResults.slice(0, prev.length + PAGE_SIZE);
    });
  }, [allResults]);

  const handleSelectVerse = (item) => {
    // A tela "Read" fica dentro do HomeStack, aninhada no drawer "Início".
    // Navegamos para o drawer e depois para a tela de leitura dentro do stack.
    navigation.navigate('Início', {
      screen: 'Read',
      params: {
        book: item.bookMeta,
        chapter: item.chapterIndex,
        verse: item.verseIndex,
      },
    });
  };

  const handleChipPress = (term) => {
    setQuery(term);
    performSearch(term);
  };

  const renderItem = useCallback(
    ({ item }) => {
      const parts = splitHighlight(item.text, item.normalizedTerm);

      return (
        <TouchableOpacity
          style={[styles.verseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => handleSelectVerse(item)}
          activeOpacity={0.7}
        >
          <Text style={[styles.verseReference, { color: theme.dark ? '#6EE7B7' : '#2E7D32' }]}>
            {item.reference}
          </Text>
          <Text style={[styles.verseText, { color: theme.text }]} numberOfLines={3}>
            {parts.map((part, index) =>
              part.highlight ? (
                <Text
                  key={index}
                  style={[
                    styles.highlightedTerm,
                    {
                      backgroundColor: theme.dark ? '#3F6212' : '#DCFCE7',
                      color: theme.text,
                    },
                  ]}
                >
                  {part.text}
                </Text>
              ) : (
                <Text key={index}>{part.text}</Text>
              )
            )}
          </Text>
        </TouchableOpacity>
      );
    },
    [theme]
  );

  const keyExtractor = useCallback((item) => item.key, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Barra de Pesquisa */}
      <View style={[styles.searchBarContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={[styles.inputWrapper, { backgroundColor: theme.dark ? '#1F2937' : '#F3F4F6' }]}>
          <Ionicons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (!text.trim()) {
                setAllResults([]);
                setVisibleResults([]);
                setHasSearched(false);
              }
            }}
            onSubmitEditing={() => performSearch()}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => { setQuery(''); setAllResults([]); setVisibleResults([]); setHasSearched(false); }} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={theme.textMuted} style={styles.clearIcon} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={() => performSearch()}>
          <Text style={styles.searchButtonText}>{t('searchSearch')}</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo: Histórico ou Resultados */}
      {!hasSearched ? (
        <View style={styles.recentContainer}>
          {recentSearches.length > 0 ? (
            <>
              <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, { color: theme.dark ? '#9CA3AF' : '#4B5563' }]}>
                  {t('searchRecent')}
                </Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearRecentText}>{t('searchClear')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipsRow}>
                {recentSearches.map((term, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.chip, { backgroundColor: theme.dark ? '#374151' : '#E5E7EB' }]}
                    onPress={() => handleChipPress(term)}
                  >
                    <Ionicons name="time-outline" size={14} color={theme.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.chipText, { color: theme.text }]}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={56} color={theme.textMuted} />
              <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>
                {t('searchEmpty')}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsCount, { color: theme.dark ? '#9CA3AF' : '#6B7280' }]}>
            {allResults.length === 1
              ? t('searchCountOne', { n: allResults.length })
              : t('searchCountMany', { n: allResults.length })}
          </Text>

          {loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="hourglass-outline" size={56} color={theme.textMuted} />
              <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>
                {t('searchSearching')}
              </Text>
            </View>
          ) : !dataReady || bibleData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="server-outline" size={56} color={theme.textMuted} />
              <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>
                {t('searchLoadingData')}
              </Text>
            </View>
          ) : allResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={56} color={theme.textMuted} />
              <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>
                {t('searchNoVerses', { q: query })}
              </Text>
            </View>
          ) : (
            <FlatList
              data={visibleResults}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.listContent}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={PAGE_SIZE}
              maxToRenderPerBatch={PAGE_SIZE}
              windowSize={10}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  clearIcon: {
    marginLeft: 8,
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  recentContainer: {
    flex: 1,
    padding: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearRecentText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 40,
  },
  verseCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 22,
  },
  highlightedTerm: {
    fontWeight: 'bold',
    borderRadius: 3,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
  },
});