import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useApp } from '../context/AppContext';
import { getBooks } from '../data/books';
import { getAdviceVerseEntries } from '../data/adviceVerses';

export default function AdviceDetailScreen({ route, navigation }) {
  const { theme, t } = useApp();
  const { title = '', icon = 'book-outline', emoji, category = '', color = '#81C784', bgColor = '#2E5C44' } =
    route?.params ?? {};

  const entries = getAdviceVerseEntries(category);

  const openVerse = (entry) => {
    const book = getBooks().find((b) => b.abbrev === entry.abbrev);
    if (!book) return;
    navigation.navigate('Início', {
      screen: 'Read',
      params: {
        book,
        chapter: entry.chapterIndex,
        verse: entry.verseIndex,
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
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={[styles.menuCircle, { backgroundColor: theme.background }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.bigIcon, { backgroundColor: bgColor }]}>
            {emoji ? (
              <Text style={{ fontSize: 36 }}>{emoji}</Text>
            ) : (
              <Ionicons name={icon} size={36} color={color} />
            )}
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.hint, { color: theme.textMuted }]}>{t('advice.openReader')}</Text>
        </View>

        {entries.map((entry, index) => (
          <TouchableOpacity
            key={`${entry.abbrev}-${entry.chapterIndex}-${index}`}
            style={[
              styles.verseCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => openVerse(entry)}
          >
            <View style={[styles.verseIcon, { backgroundColor: bgColor }]}>
              <Ionicons name="book-outline" size={20} color={color} />
            </View>
            <Text style={[styles.verseLabel, { color: theme.text }]} numberOfLines={1}>
              {entry.label}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </TouchableOpacity>
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
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bigIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  verseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  verseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  verseLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});