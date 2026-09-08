import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useApp } from '../context/AppContext';
import { getBooks } from '../data/books';

const formatSigla = (abbrev) => {
  if (/^\d/.test(abbrev)) {
    const match = abbrev.match(/^(\d+)(.*)$/);
    const rest = match[2];
    return `${match[1]}${rest.charAt(0).toUpperCase()}${rest.slice(1)}`;
  }
  return abbrev.charAt(0).toUpperCase() + abbrev.slice(1);
};

export default function LivrosScreen({ navigation }) {
  const { theme, t } = useApp();

  const sections = useMemo(() => {
    const books = getBooks();
    const ntStart = books.findIndex((b) => b.abbrev === 'mt');
    return [
      { title: t('readOT'), books: books.slice(0, ntStart) },
      { title: t('readNT'), books: books.slice(ntStart) },
    ];
  }, [t]);

  const openBook = (book) => {
    navigation.navigate('Início', {
      screen: 'Read',
      params: {
        book: { abbrev: book.abbrev, name: book.name, chapters: book.chapters },
        chapter: 0,
        verse: 0,
      },
    });
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          hitSlop={8}
          style={[styles.menuCircle, { backgroundColor: theme.background }]}
        >
          <Ionicons name="menu" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('nav.livros')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
              {section.title}
            </Text>
            <View style={styles.grid}>
              {section.books.map((book) => (
                <TouchableOpacity
                  key={book.abbrev}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => openBook(book)}
                >
                  <Text style={[styles.sigla, { color: theme.text }]}>
                    {formatSigla(book.abbrev)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 12,
    paddingVertical: 22,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sigla: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
});