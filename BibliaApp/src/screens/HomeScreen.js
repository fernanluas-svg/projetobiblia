import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApp } from '../context/AppContext';
import { getBooks } from '../data/books';

export default function HomeScreen({ navigation }) {
  const { theme } = useApp();
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
  item: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    fontSize: 18,
  },
});
