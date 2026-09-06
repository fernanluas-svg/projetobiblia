import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Updates from 'expo-updates';

import { useApp } from '../context/AppContext';
import { getBooks } from '../data/books';

export default function ProgressScreen({ navigation }) {
  const { readChapters, theme, t } = useApp();
  const insets = useSafeAreaInsets();
  const books = getBooks();

  const [selectedBook, setSelectedBook] = useState(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const barProgress = useSharedValue(0);

  const readSet = useMemo(() => new Set(readChapters), [readChapters]);

  const items = useMemo(
    () =>
      books.map((book) => {
        const readCount = Array.from(
          { length: book.chapters },
          (_, i) => readSet.has(`${book.abbrev}:${i}`)
        ).filter(Boolean).length;
        const percent = Math.round((readCount / book.chapters) * 100);
        const firstUnread = Array.from(
          { length: book.chapters },
          (_, i) => i
        ).find((i) => !readSet.has(`${book.abbrev}:${i}`));
        return {
          ...book,
          read: readCount,
          percent,
          remaining: book.chapters - readCount,
          openAt: firstUnread ?? 0,
        };
      }),
    [books, readSet]
  );

  const totalRead = items.reduce((sum, b) => sum + b.read, 0);
  const totalChapters = items.reduce((sum, b) => sum + b.chapters, 0);
  const totalPercent = totalChapters
    ? Math.round((totalRead / totalChapters) * 100)
    : 0;

  useEffect(() => {
    if (selectedBook) {
      barProgress.value = 0;
      barProgress.value = withTiming(selectedBook.percent / 100, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBook]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${barProgress.value * 100}%`,
  }));

  const openBook = (item) => {
    navigation.navigate('Início', {
      screen: 'Read',
      params: { book: { abbrev: item.abbrev, name: item.name, chapters: item.chapters }, chapter: item.openAt, verse: 0 },
    });
  };

  const reloadUpdate = async () => {
    if (checkingUpdate) return;
    setCheckingUpdate(true);
    try {
      const res = await Updates.checkForUpdateAsync();
      if (!res.isAvailable) {
        Alert.alert(
          t('progressUpToDateTitle'),
          t('progressUpToDateMsg', {
            id: Updates.updateId ? `id ${String(Updates.updateId).slice(0, 8)}` : 'sem id',
          })
        );
        return;
      }
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (e) {
      Alert.alert(t('progressUpdateErrorTitle'), String(e && e.message ? e.message : e));
    } finally {
      setCheckingUpdate(false);
    }
  };

  const renderItem = ({ item }) => (
    <Pressable
      style={[styles.card, { backgroundColor: theme.surface }]}
      onPress={() => setSelectedBook(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.bookName, { color: theme.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.readInfo, { color: theme.textMuted }]}>
          {item.read} de {item.chapters} · {item.percent}%
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.bar }]}>
        <View
          style={[
            styles.staticFill,
            { backgroundColor: theme.activeGreen, width: `${item.percent}%` },
          ]}
        />
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.summary}>
        <Text style={[styles.summaryTitle, { color: theme.text }]}>
          {t('progressChaptersRead', { read: totalRead, total: totalChapters })}
        </Text>
        <Text style={[styles.summaryPercent, { color: theme.activeGreen }]}>
          {t('progressOfBible', { p: totalPercent })}
        </Text>
        <Pressable
          style={styles.updateInfoRow}
          onPress={reloadUpdate}
          hitSlop={6}
        >
          <Ionicons
            name={checkingUpdate ? 'sync' : 'refresh'}
            size={12}
            color={theme.textMuted}
          />
          <Text style={[styles.updateInfo, { color: theme.textMuted }]}>
            {checkingUpdate
              ? t('progressCheckingUpdate')
              : `${Updates.runtimeVersion ? `v${Updates.runtimeVersion}` : 'v?'}${
                  Updates.channel ? ` · ${Updates.channel}` : ''
                }${Updates.updateId ? ` · ${String(Updates.updateId).slice(0, 8)}` : ''}${
                  Updates.isEmbeddedLaunch ? ` · ${t('progressEmbedded')}` : ''
                }`}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.abbrev}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 32 }]}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
      />

      <Modal
        visible={selectedBook !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedBook(null)}
      >
        <Pressable
          style={styles.modalRoot}
          onPress={() => setSelectedBook(null)}
        >
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.surface,
                paddingTop: insets.top + 12,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
              },
            ]}
            onPress={() => {}}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: theme.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedBook?.name}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedBook(null)}
                hitSlop={10}
              >
                <Ionicons
                  name="close"
                  size={26}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            </View>

            {selectedBook && (
              <>
                <View style={styles.modalBody}>
                  <View style={styles.percentRow}>
                    <Text
                      style={[styles.percentBig, { color: theme.activeGreen }]}
                    >
                      {selectedBook.percent}%
                    </Text>
                    <Text style={[styles.percentCaption, { color: theme.textMuted }]}>
                      {t('progressRead')}
                    </Text>
                  </View>

                  <View style={[styles.modalTrack, { backgroundColor: theme.bar }]}>
                    <Animated.View
                      style={[
                        styles.modalFill,
                        { backgroundColor: theme.activeGreen },
                        animatedBarStyle,
                      ]}
                    />
                  </View>

                  <View style={styles.statusRow}>
                    <View style={styles.statusItem}>
                      <Text style={[styles.statusValue, { color: theme.text }]}>
                        {selectedBook.read}
                      </Text>
                      <Text style={[styles.statusLabel, { color: theme.textMuted }]}>
                        {t('progressChaptersReadLabel')}
                      </Text>
                    </View>
                    <View style={[styles.statusDivider, { backgroundColor: theme.border }]} />
                    <View style={styles.statusItem}>
                      <Text style={[styles.statusValue, { color: theme.text }]}>
                        {selectedBook.remaining}
                      </Text>
                      <Text style={[styles.statusLabel, { color: theme.textMuted }]}>
                        {t('progressToFinish')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: theme.activeGreen }]}
                    onPress={() => openBook(selectedBook)}
                  >
                    <Text style={styles.primaryButtonText}>{t('progressContinueReading')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  summary: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryPercent: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  updateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  updateInfo: {
    fontSize: 11,
  },
  content: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 8,
  },
  readInfo: {
    fontSize: 12,
    flexShrink: 1,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  staticFill: {
    height: '100%',
    borderRadius: 4,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  percentBig: {
    fontSize: 56,
    fontWeight: '800',
  },
  percentCaption: {
    fontSize: 16,
    marginLeft: 8,
  },
  modalTrack: {
    width: '100%',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    marginTop: 16,
  },
  modalFill: {
    height: '100%',
    borderRadius: 7,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#cccccc',
  },
  statusValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statusLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  modalActions: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});