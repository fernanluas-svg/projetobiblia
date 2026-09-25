import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useApp } from '../context/AppContext';
import { getBooks } from '../data/books';

export default function FavoritesScreen({ navigation }) {
  const { favorites, toggleFavorite, theme, t } = useApp();
  const [sortOrder, setSortOrder] = useState('recent');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const books = getBooks();

  const sortedFavorites = useMemo(() => {
    const list = [...favorites];
    const timeOf = (favorite) => favorite?.createdAt ?? 0;
    list.sort((a, b) =>
      sortOrder === 'oldest'
        ? timeOf(a) - timeOf(b)
        : timeOf(b) - timeOf(a)
    );
    return list;
  }, [favorites, sortOrder]);

  const SORT_OPTIONS = [
    { key: 'recent', label: t('favoritesMostRecent') },
    { key: 'oldest', label: t('favoritesOldest') },
  ];

  const parseKey = (key) => {
    const parts = String(key).split(':');
    if (parts.length !== 3) return null;
    const [abbrev, chapterIdx, verseIdx] = parts;
    const book = books.find((b) => b.abbrev === abbrev);
    if (!book) return null;
    return {
      book,
      chapter: Number(chapterIdx),
      verse: Number(verseIdx),
    };
  };

  const resolveText = (item) => {
    const t = item.text;
    if (t && typeof t === 'object') return t.text ?? t.verse ?? '';
    return t ?? '';
  };

  const openFavorite = (favorite) => {
    const parsed = parseKey(favorite.key);
    if (!parsed) return;
    navigation.navigate('Read', parsed);
  };

  const confirmDelete = () => {
    if (deleteTarget) toggleFavorite(deleteTarget);
    setDeleteTarget(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            {t('favoritesEmpty')}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((option) => {
              const active = option.key === sortOrder;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortButton,
                    {
                      backgroundColor: active ? theme.primary : theme.surface,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setSortOrder(option.key)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      { color: active ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <FlatList
            data={sortedFavorites}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.content}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.verseContainer, { backgroundColor: theme.surface }]}
                onPress={() => openFavorite(item)}
                onLongPress={() => setDeleteTarget(item)}
                delayLongPress={350}
              >
                <View style={styles.referenceRow}>
                  <Text style={[styles.reference, { color: theme.primary }]}>
                    {item.reference}
                  </Text>
                  <Text style={[styles.hint, { color: theme.textMuted }]}>
                    {t('favoritesHoldToDelete')}
                  </Text>
                </View>
                <View style={styles.verseRow}>
                  <Text style={[styles.verseNumber, { color: theme.primary }]}>
                    {item.verseIndex + 1}
                  </Text>
                  <Text style={[styles.verseText, { color: theme.text }]}>
                    {resolveText(item)}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </>
      )}

      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDeleteTarget(null)}
        >
          <Pressable
            style={[styles.modalBox, { backgroundColor: theme.surface }]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('favoritesDeleteTitle')}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              {deleteTarget?.reference}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.bar }]}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  {t('favoritesCancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#c62828' }]}
                onPress={confirmDelete}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  {t('favoritesDelete')}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    padding: 16,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sortButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  verseContainer: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reference: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  hint: {
    fontSize: 11,
  },
  verseRow: {
    flexDirection: 'row',
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  verseText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
