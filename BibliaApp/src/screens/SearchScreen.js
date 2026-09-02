import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { getBooks, getBook } from '../data/books';

const RECENT_SEARCHES_KEY = '@biblia_recent_searches';
const MAX_RECENT = 8;

export default function SearchScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, darkMode } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
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
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      // erro ao carregar
    }
  };

  const saveRecentSearch = async (searchTerm) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
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
      const allBooksPromises = bookList.map(async (b) => {
        const full = await getBook(b.abbrev);
        return { meta: b, full };
      });
      const resolved = await Promise.all(allBooksPromises);
      setBibleData(resolved);
    } catch (e) {
      // erro ao carregar livros
    }
  };

  const performSearch = async (searchTerm) => {
    const term = (searchTerm ?? query).trim().toLowerCase();
    if (!term) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    Keyboard.dismiss();
    saveRecentSearch(term);

    const foundVerses = [];

    for (const item of bibleData) {
      const { meta, full } = item;
      if (!full || !full.chapters) continue;

      full.chapters.forEach((chapter, cIndex) => {
        chapter.forEach((verseText, vIndex) => {
          if (verseText.toLowerCase().includes(term)) {
            foundVerses.push({
              key: `${meta.abbrev}:${cIndex}:${vIndex}`,
              bookMeta: meta,
              bookName: meta.name,
              chapterIndex: cIndex,
              verseIndex: vIndex,
              reference: `${meta.name} ${cIndex + 1}:${vIndex + 1}`,
              text: verseText,
            });
          }
        });
      });
    }

    setResults(foundVerses);
    setLoading(false);
  };

  const handleSelectVerse = (item) => {
    navigation.navigate('Livros', {
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Barra de Pesquisa */}
      <View style={[styles.searchBarContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={[styles.inputWrapper, { backgroundColor: darkMode ? '#1F2937' : '#F3F4F6' }]}>
          <Ionicons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Pesquisar versículos ou palavras..."
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => performSearch()}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={theme.textMuted} style={styles.clearIcon} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={() => performSearch()}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo: Histórico ou Resultados */}
      {!hasSearched ? (
        <View style={styles.recentContainer}>
          {recentSearches.length > 0 ? (
            <>
              <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, { color: darkMode ? '#9CA3AF' : '#4B5563' }]}>
                  Pesquisas Recentes
                </Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearRecentText}>Limpar</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipsRow}>
                {recentSearches.map((term, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.chip, { backgroundColor: darkMode ? '#374151' : '#E5E7EB' }]}
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
                Digite uma palavra ou versículo para começar a pesquisar.
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsCount, { color: darkMode ? '#9CA3AF' : '#6B7280' }]}>
            {results.length} versículo{results.length === 1 ? '' : 's'} encontrado{results.length === 1 ? '' : 's'}
          </Text>

          {results.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={56} color={theme.textMuted} />
              <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>
                Nenhum versículo encontrado para "{query}".
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.verseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => handleSelectVerse(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.verseReference, { color: darkMode ? '#6EE7B7' : '#2E7D32' }]}>
                    {item.reference}
                  </Text>
                  <Text style={[styles.verseText, { color: theme.text }]} numberOfLines={3}>
                    {item.text}
                  </Text>
                </TouchableOpacity>
              )}
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
