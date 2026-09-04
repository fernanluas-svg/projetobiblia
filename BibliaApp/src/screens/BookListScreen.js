import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getBooks } from '../data/books';

export default function BookListScreen({ navigation }) {
  const books = getBooks();
  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        windowSize={5}
        keyExtractor={(item) => item.abbrev}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('Read', { book: item })}
          >
            <Text style={styles.itemText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  item: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cccccc',
  },
  itemText: {
    fontSize: 18,
    color: '#222222',
  },
});
