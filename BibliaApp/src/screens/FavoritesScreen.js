import { useState } from 'react';
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
  const { favorites, toggleFavorite, theme } = useApp();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const books = getBooks();

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

  const openFavorite = (favorite) => {
    const parsed = parseKey(favorite.key);
    if (!parsed) return;
    navigation.navigate('Início', { screen: 'Read', params: parsed });
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
            Nenhum favorito ainda.{'\n'}Toque num versículo durante a leitura para marcá-lo aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
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
                  segure para excluir
                </Text>
              </View>
              <View style={styles.verseRow}>
                <Text style={[styles.verseNumber, { color: theme.primary }]}>
                  {item.verseIndex + 1}
                </Text>
                <Text style={[styles.verseText, { color: theme.text }]}>
                  {item.text}
                </Text>
              </View>
            </Pressable>
          )}
        />
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
              Excluir favorito?
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
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#c62828' }]}
                onPress={confirmDelete}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Excluir
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
