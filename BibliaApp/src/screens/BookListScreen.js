import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getBooks } from '../data/books';
import { useApp } from '../context/AppContext';

export default function BookListScreen({ navigation }) {
  const { theme } = useApp();
  const insets = useSafeAreaInsets();
  const books = getBooks();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={books}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        windowSize={5}
        keyExtractor={(item) => item.abbrev}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 32 }]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, { borderBottomColor: theme.border }]}
            onPress={() => navigation.navigate('Read', { book: item })}
          >
            <Text style={[styles.itemText, { color: theme.text }]}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  item: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});