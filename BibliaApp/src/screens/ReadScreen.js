import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated as NativeAnimated, Easing, FlatList, Modal, PanResponder, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  cancelAnimation,
} from 'react-native-reanimated';

import { useApp, HIGHLIGHT_COLORS, HIGHLIGHT_ORDER } from '../context/AppContext';
import { getBook, getChapter, getBooks } from '../data/books';
import { getBookMeta } from '../data/bookMeta';
import { makeChapterKey } from '../utils/chapterKey';

const PALETA_CONFETI = ['#FFD700', '#FF4081', '#00E676', '#29B6F6', '#AB47BC', '#FF9100', '#00BFFF', '#9B59B6', '#2ECC71', '#FF4757'];
const TOTAL_PARTICULAS = 24;

function CompletionButton({ chapterRead, onToggle, theme }) {
  // Partículas de confete com posições radiais em 360 graus
  const particlesData = useRef(
    [...Array(TOTAL_PARTICULAS)].map(() => ({
      anim: new NativeAnimated.Value(0),
      angle: Math.random() * Math.PI * 2,
      distance: 60 + Math.random() * 90,
      color: PALETA_CONFETI[Math.floor(Math.random() * PALETA_CONFETI.length)],
      size: Math.floor(Math.random() * 6) + 8,
    }))
  ).current;

  // Animação de Onda Circular (Ripple)
  const rippleScale = useRef(new NativeAnimated.Value(0)).current;
  const rippleOpacity = useRef(new NativeAnimated.Value(0)).current;

  const triggerRippleAndSparkles = () => {
    // Reseta e dispara as partículas
    particlesData.forEach(p => p.anim.setValue(0));
    const particleAnimations = particlesData.map(p =>
      NativeAnimated.timing(p.anim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );

    // Reseta e dispara a onda circular
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.4);
    const rippleAnimation = NativeAnimated.parallel([
      NativeAnimated.timing(rippleScale, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      NativeAnimated.timing(rippleOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);

    NativeAnimated.parallel([
      NativeAnimated.parallel(particleAnimations),
      rippleAnimation,
    ]).start();
  };

  // compartilhamento de valores novos por montagem (key por capítulo)
  const progress = useSharedValue(chapterRead ? 1 : 0);
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(chapterRead ? 1 : 0);
  const checkRotate = useSharedValue(0);

  const animatedBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.surface, theme.activeGreen]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.border, theme.activeGreen]
    ),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [theme.text, '#fff']
    ),
  }));

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedCheckStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: checkScale.value },
      { rotate: `${checkRotate.value}deg` },
    ],
  }));

  useEffect(() => {
    cancelAnimation(progress);
    cancelAnimation(checkScale);
    cancelAnimation(checkRotate);
    progress.value = chapterRead ? 1 : 0;
    checkScale.value = chapterRead ? 1 : 0;
    checkRotate.value = 0;
  }, [chapterRead]);

  const handlePress = () => {
    const next = !chapterRead;
    if (!chapterRead) {
      triggerRippleAndSparkles();
    }
    onToggle();
    scale.value = withSpring(0.9, { damping: 12, stiffness: 300 });
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    if (next) {
      checkScale.value = 0;
      checkRotate.value = -20;
      progress.value = withTiming(1, { duration: 250 });
      checkScale.value = withSpring(1, { damping: 9, stiffness: 220 });
      checkRotate.value = withSpring(0, { damping: 12, stiffness: 180 });
    } else {
      checkScale.value = withSpring(0, { damping: 10, stiffness: 200 });
      checkRotate.value = withSpring(0, { damping: 12, stiffness: 180 });
      progress.value = withTiming(0, { duration: 250 });
    }
  };

  return (
    <View style={styles.completionWrapper}>
      {/* Renderização das partículas em 360 graus FORA do botão */}
      <View style={styles.sparkleLayer} pointerEvents="none">
        {particlesData.map((p, index) => {
          const cos = Math.cos(p.angle);
          const sin = Math.sin(p.angle);

          const translateX = p.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, cos * p.distance],
          });

          const translateY = p.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, sin * p.distance],
          });

          const scale = p.anim.interpolate({
            inputRange: [0, 0.15, 0.8, 1],
            outputRange: [0, 1.4, 1, 0.2],
          });

          const opacity = p.anim.interpolate({
            inputRange: [0, 0.1, 0.7, 1],
            outputRange: [0, 1, 1, 0],
          });

          const rotate = p.anim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${(index % 2 === 0 ? 1 : -1) * 360}deg`],
          });

          return (
            <NativeAnimated.View
              key={index}
              style={[
                styles.sparkle,
                {
                  opacity,
                  transform: [
                    { translateX },
                    { translateY },
                    { rotate },
                    { scale },
                  ],
                },
              ]}
            >
              <View
                style={{
                  width: p.size,
                  height: p.size,
                  borderRadius: p.size / 2,
                  backgroundColor: p.color,
                }}
              />
            </NativeAnimated.View>
          );
        })}
      </View>

      <Animated.View
        style={[styles.completionButton, animatedBgStyle, animatedScaleStyle, { overflow: 'hidden' }]}
      >
        {/* Onda Circular (Ripple Effect) em tom verde DENTRO do botão */}
        <NativeAnimated.View
          pointerEvents="none"
          style={[
            styles.rippleCircle,
            {
              opacity: rippleOpacity,
              transform: [{ scale: rippleScale }],
            },
          ]}
        />

        <TouchableOpacity
          style={styles.completionPressable}
          onPress={handlePress}
        >
          <Animated.View style={styles.completionLabelRow}>
            <Animated.Text style={[styles.completionText, animatedTextStyle]}>
              {chapterRead ? 'Capítulo lido ' : 'Leitura concluída? '}
            </Animated.Text>
            {chapterRead ? (
              <Animated.Text style={[styles.check, animatedCheckStyle]}>✓</Animated.Text>
            ) : null}
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function ReadScreen({ navigation, route }) {
  const metaRaw = route?.params?.book;
  const meta = metaRaw?.name
    ? metaRaw
    : getBooks().find((b) => b.abbrev === metaRaw?.abbrev) ?? metaRaw;
  const insets = useSafeAreaInsets();
  const {
    theme,
    fontSize,
    isFavorite,
    toggleFavorite,
    isChapterRead,
    toggleChapterRead,
    getHighlight,
    setHighlight,
    setLastRead,
  } = useApp();

  const isReaderDark = theme.dark;
  const verseNumColor = isReaderDark ? '#FFFFFF' : '#4A5568';
  const sectionTitleColor = isReaderDark ? '#FFFFFF' : '#2D3748';
  const [chapterIndex, setChapterIndex] = useState(route?.params?.chapter ?? 0);
  const chapterIndexRef = useRef(chapterIndex);
  useEffect(() => {
    chapterIndexRef.current = chapterIndex;
  }, [chapterIndex]);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState('chapters');
  const [modalBookIndex, setModalBookIndex] = useState(0);
  const [modalChapterIndex, setModalChapterIndex] = useState(0);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [copied, setCopied] = useState(false);
  const [fullBook, setFullBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrollToVerse, setScrollToVerse] = useState(route?.params?.verse ?? null);
  const [scrollNonce, setScrollNonce] = useState(0);
  const scrollViewRef = useRef(null);
  const verseRefs = useRef([]);
  const lastOffsetY = useRef(0);
  const fabOpacity = useSharedValue(1);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fabOpacity.value,
  }));

  const handleScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastOffsetY.current;
    lastOffsetY.current = y;
    if (dy > 4) {
      fabOpacity.value = withTiming(0, { duration: 250 });
    } else if (dy < -2) {
      fabOpacity.value = withTiming(1, { duration: 250 });
    }
  };

  const showFabs = () => {
    fabOpacity.value = withTiming(1, { duration: 250 });
  };

  // Gesto de swipe horizontal para trocar de capítulo
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gs) =>
        Math.abs(gs.dx) > 12 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.2,
      onPanResponderRelease: (evt, gs) => {
        if (Math.abs(gs.dx) > 60) {
          if (gs.dx < 0) {
            changeChapter(chapterIndexRef.current + 1);
          } else {
            changeChapter(chapterIndexRef.current - 1);
          }
        }
      },
    })
  ).current;

  const totalChapters = meta?.chapters ?? fullBook?.chapters?.length ?? 0;
  const chapter = getChapter(fullBook, chapterIndex);
  const chapterKey = meta ? makeChapterKey(meta.abbrev, chapterIndex) : null;
  const chapterRead = isChapterRead(chapterKey);
  const books = getBooks();
  const selectedMeta = books[modalBookIndex];
  const selectedBookMeta = selectedMeta ? getBookMeta(selectedMeta.abbrev) : null;
  const modalChapterCount = selectedBookMeta?.chaptersCount ?? 0;
  const modalVerseCount =
    selectedBookMeta?.versesPerChapter?.[modalChapterIndex] ?? 0;

  // Índice onde começa o Novo Testamento (Mateus)
  const NT_START = books.findIndex((b) => b.abbrev === 'mt');
  const oldTestament = NT_START >= 0 ? books.slice(0, NT_START) : [];
  const newTestament = NT_START >= 0 ? books.slice(NT_START) : [];
  const booksSections = [
    { key: 'antigo', title: 'Antigo Testamento', items: oldTestament },
    { key: 'novo', title: 'Novo Testamento', items: newTestament },
  ].filter((s) => s.items.length > 0);

  const goToPrevModalBook = () => {
    if (modalBookIndex > 0) {
      setSelectedIndexes([]);
      setModalStep('chapters');
      setModalChapterIndex(0);
      setModalBookIndex((i) => i - 1);
    }
  };
  const goToNextModalBook = () => {
    if (modalBookIndex < books.length - 1) {
      setSelectedIndexes([]);
      setModalStep('chapters');
      setModalChapterIndex(0);
      setModalBookIndex((i) => i + 1);
    }
  };

  const openChapterModal = () => {
    const idx = books.findIndex((b) => b.abbrev === meta?.abbrev);
    const start = idx >= 0 ? idx : 0;
    setModalBookIndex(start);
    setModalChapterIndex(chapterIndex);
    setModalStep('chapters');
    setChapterModalVisible(true);
  };

  const selectModalChapter = (chapterIdx) => {
    setModalChapterIndex(chapterIdx);
    setModalStep('verses');
  };

  const goBackModalChapters = () => {
    setModalStep('chapters');
  };

  const goToBooksList = () => {
    setModalStep((step) => (step === 'books' ? 'chapters' : 'books'));
  };

  const selectModalBook = (bookIndex) => {
    setModalBookIndex(bookIndex);
    setModalChapterIndex(0);
    setModalStep('chapters');
  };

  const selectModalVerse = (verseIdx) => {
    const chosenMeta = books[modalBookIndex];
    const sameBook = chosenMeta?.abbrev === meta?.abbrev;
    if (!sameBook) {
      navigation.navigate('Read', {
        book: chosenMeta,
        chapter: modalChapterIndex,
        verse: verseIdx,
      });
    } else {
      setChapterIndex(modalChapterIndex);
      setScrollToVerse(verseIdx);
      setScrollNonce((n) => n + 1);
    }
    setChapterModalVisible(false);
  };

  useEffect(() => {
    let active = true;
    if (meta) {
      setLoading(true);
      getBook(meta.abbrev).then((book) => {
        if (active) {
          setFullBook(book);
          setLoading(false);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [meta]);

  useLayoutEffect(() => {
    if (navigation) {
      navigation.setOptions({
        headerShown: false,
      });
    }
  }, [navigation, meta]);

  useEffect(() => {
    if (meta && !loading) {
      setLastRead({
        book: meta,
        chapter: chapterIndex,
        verse: route?.params?.verse ?? 0,
      });
    }
  }, [meta, chapterIndex, loading]);

  const buildVerse = (verseIndex) => ({
    key: `${chapterKey}:${verseIndex}`,
    bookName: meta.name,
    bookAbbrev: meta.abbrev,
    chapterIndex,
    verseIndex,
    text: chapter[verseIndex],
    reference: `${meta.name} ${chapterIndex + 1}:${verseIndex + 1}`,
  });

  const changeChapter = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= totalChapters) return;
    setChapterIndex(nextIndex);
    setSelectedIndexes([]);
    setCopied(false);
    setScrollToVerse(null);
    setScrollNonce((n) => n + 1);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const goToPreviousChapter = () => changeChapter(chapterIndex - 1);
  const goToNextChapter = () => changeChapter(chapterIndex + 1);

  useEffect(() => {
    const verseToScroll = scrollToVerse ?? null;
    if (verseToScroll == null || verseToScroll < 0) return;
    const targetY = verseRefs.current[verseToScroll];
    if (targetY == null || !scrollViewRef.current) return;
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
    }, 120);
    return () => clearTimeout(timer);
  }, [scrollToVerse, scrollNonce, fullBook, chapterIndex]);

  const exitSelection = () => {
    setSelectedIndexes([]);
    setCopied(false);
  };

  const toggleSelection = (verseIndex) => {
    setSelectedIndexes((prev) =>
      prev.includes(verseIndex)
        ? prev.filter((i) => i !== verseIndex)
        : [...prev, verseIndex]
    );
  };

  const buildSelectedVerses = () =>
    [...selectedIndexes]
      .sort((a, b) => a - b)
      .map((verseIndex) => buildVerse(verseIndex));

  const handleMultiFavorite = () => {
    if (selectedIndexes.length === 0) return;
    buildSelectedVerses().forEach((verse) => toggleFavorite(verse));
  };

  const handleMultiCopy = async () => {
    if (selectedIndexes.length === 0) return;
    const text = buildSelectedVerses()
      .map((verse) => `${verse.reference}\n${verse.text}`)
      .join('\n\n');
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleMultiShare = async () => {
    if (selectedIndexes.length === 0) return;
    const message = buildSelectedVerses()
      .map((verse) => `${verse.reference}\n${verse.text}`)
      .join('\n\n');
    try {
      await Share.share({ message });
    } catch (e) {
      // usuário cancelou o compartilhamento
    }
  };

  const handleMultiHighlight = (colorName) => {
    if (selectedIndexes.length === 0) return;
    const remove = selectedHighlightColor === colorName;
    selectedIndexes.forEach((idx) => {
      setHighlight(`${chapterKey}:${idx}`, remove ? null : colorName);
    });
  };

  const sectionTitle = meta ? `Capítulo ${chapterIndex + 1}` : '';
  const selectedCount = selectedIndexes.length;
  const allSelectedFavorite =
    selectedCount > 0 &&
    selectedIndexes.every((idx) => isFavorite(`${chapterKey}:${idx}`));

  const selectedHighlights = selectedIndexes.map((idx) =>
    getHighlight(`${chapterKey}:${idx}`)
  );
  const selectedHighlightColor =
    selectedCount > 0 && selectedHighlights[0]
      ? selectedHighlights.every((c) => c === selectedHighlights[0])
        ? selectedHighlights[0]
        : null
      : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]} {...panResponder.panHandlers}>
      {/* Cabeçalho customizado: seletor de livro/capítulo + slots para ícones futuros */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.bar,
            borderBottomColor: theme.border,
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.headerRow}>
          {/* Slot esquerdo: menu lateral (futuros ícones podem ocupar este espaço) */}
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => navigation.getParent()?.openDrawer()}
            hitSlop={8}
          >
            <Ionicons name="menu" size={24} color={theme.text} />
          </TouchableOpacity>

          {/* Seletor principal: nome do livro + capítulo atual */}
          <TouchableOpacity
            style={[
              styles.headerTitleButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={openChapterModal}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerTitleText, { color: theme.text }]} numberOfLines={1}>
              {meta ? `${meta.name}` : ''}
            </Text>
          </TouchableOpacity>

          {/* Slot direito: reserva de espaço para futuros ícones (versão, busca, etc.) */}
          <View style={styles.headerIcon} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Carregando capítulo...
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={[styles.content, selectedCount > 0 && styles.selectionBottomPadding]}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          removeClippedSubviews
          onScroll={handleScroll}
          onScrollEndDrag={showFabs}
          onMomentumScrollEnd={showFabs}
          scrollEventThrottle={16}
        >
          {chapter.map((verseItem, index) => {
            const verseKey = `${chapterKey}:${index}`;
            const highlightName = getHighlight(verseKey);
            const highlight = highlightName ? HIGHLIGHT_COLORS[highlightName] : null;
            const selected = selectedIndexes.includes(index);
            const verseText = typeof verseItem === 'object' ? verseItem.text : verseItem;
            const verseTitle = typeof verseItem === 'object' ? verseItem.title : null;

            // Se for o primeiro versículo ou houver título de perícope, exibe o título editorial
            const displayTitle = index === 0 ? (verseTitle || `Capítulo ${chapterIndex + 1}`) : verseTitle;

            return (
              <View
                key={index}
                onLayout={(e) => {
                  verseRefs.current[index] = e.nativeEvent.layout.y;
                }}
              >
                {displayTitle ? (
                  <Text style={[styles.pericopeTitle, { color: theme.text, marginTop: index === 0 ? 4 : 24, marginBottom: 12 }]}>
                    {displayTitle}
                  </Text>
                ) : null}
                <TouchableOpacity
                  style={[
                    styles.verseContainer,
                    highlight && { backgroundColor: highlight.bg },
                    selected && { backgroundColor: theme.selection },
                  ]}
                  onPress={() => toggleSelection(index)}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.verseNumber, { color: verseNumColor }]}>{index + 1}</Text>
                  <Text style={[styles.verseText, { color: theme.text, fontSize }]}>
                    {verseText}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={styles.completionWrap}>
            <CompletionButton
              key={chapterKey}
              chapterRead={chapterRead}
              onToggle={() => toggleChapterRead(chapterKey)}
              theme={theme}
            />
          </View>
        </ScrollView>
      )}

      {/* Botões flutuantes circulares de navegação de capítulo */}
      <Animated.View pointerEvents="box-none" style={[styles.fabRow, fabAnimatedStyle]}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: isReaderDark ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.9)' }, chapterIndex === 0 && styles.fabDisabled]}
          onPress={goToPreviousChapter}
          disabled={chapterIndex === 0}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color={theme.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: isReaderDark ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.9)' }, chapterIndex === totalChapters - 1 && styles.fabDisabled]}
          onPress={goToNextChapter}
          disabled={chapterIndex === totalChapters - 1}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={26} color={theme.primary} />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={chapterModalVisible}
        animationType="slide"
        onRequestClose={() => setChapterModalVisible(false)}
      >
        <View style={[styles.fullModal, { backgroundColor: theme.background }]}>
          <View
            style={[
              styles.fullModalHeader,
              {
                backgroundColor: theme.surface,
                borderBottomColor: theme.border,
                paddingTop: insets.top,
              },
            ]}
          >
            <View style={styles.fullModalHeaderRow}>
              <TouchableOpacity
                style={[
                  styles.modalNavButton,
                  { borderColor: theme.border },
                  theme.dark && styles.modalNavButtonDark,
                  modalBookIndex === 0 && styles.modalNavButtonDisabled,
                ]}
                onPress={goToPrevModalBook}
                disabled={modalBookIndex === 0}
              >
                <Text style={[styles.modalNavText, { color: theme.dark ? '#FFFFFF' : theme.primary }]}>{'<'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.fullModalTitleButton,
                  { borderColor: theme.dark ? '#333333' : theme.border },
                  theme.dark && styles.fullModalTitleButtonDark,
                ]}
                onPress={goToBooksList}
                activeOpacity={0.7}
              >
                <Text style={[styles.fullModalTitle, { color: theme.dark ? '#FFFFFF' : theme.text }]} numberOfLines={1}>
                  {selectedMeta?.name}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalNavButton,
                  { borderColor: theme.border },
                  theme.dark && styles.modalNavButtonDark,
                  modalBookIndex === books.length - 1 && styles.modalNavButtonDisabled,
                ]}
                onPress={goToNextModalBook}
                disabled={modalBookIndex === books.length - 1}
              >
                <Text style={[styles.modalNavText, { color: theme.dark ? '#FFFFFF' : theme.primary }]}>{'>'}</Text>
              </TouchableOpacity>
            </View>
            {modalStep === 'verses' ? (
              <TouchableOpacity
                style={[
                  styles.backChaptersButton,
                  { backgroundColor: theme.bar, borderColor: theme.border },
                ]}
                onPress={goBackModalChapters}
              >
                <Ionicons name="arrow-back" size={16} color={theme.text} />
                <Text style={[styles.backChaptersText, { color: theme.text }]}>
                  Voltar para Capítulos
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {modalStep === 'books' ? (
            <FlatList
              data={booksSections}
              keyExtractor={(section) => section.key}
              contentContainerStyle={[styles.booksListContent, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
              renderItem={({ item: section }) => (
                <View style={styles.booksSection}>
                  <Text style={[styles.booksSectionTitle, { color: theme.textMuted }]}>
                    {section.title}
                  </Text>
                  <View style={styles.booksGrid}>
                    {section.items.map((book, i) => {
                      const bookIndex = books.findIndex((b) => b.abbrev === book.abbrev);
                      const isActive = book.abbrev === meta?.abbrev;
                      return (
                        <TouchableOpacity
                          key={book.abbrev}
                          style={[
                            styles.bookCell,
                            { borderColor: theme.border },
                            isActive && styles.bookCellActive,
                          ]}
                          onPress={() => selectModalBook(bookIndex)}
                        >
                          <Text
                            style={[
                              styles.bookCellText,
                              { color: theme.text },
                              isActive && styles.bookCellTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {book.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            />
          ) : null}

          {modalStep === 'chapters' ? (
            <FlatList
              data={Array.from({ length: modalChapterCount }, (_, i) => i)}
              keyExtractor={(item) => String(item)}
              numColumns={5}
              contentContainerStyle={[
                styles.fullModalGrid,
                { paddingBottom: Math.max(insets.bottom, 16) + 40 },
              ]}
              columnWrapperStyle={styles.fullModalGridRow}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.chapterCell,
                    { borderColor: theme.dark ? '#CCCCCC' : theme.border },
                    selectedMeta?.abbrev === meta?.abbrev &&
                      index === chapterIndex &&
                      styles.chapterCellActive,
                  ]}
                  onPress={() => selectModalChapter(index)}
                >
                  <Text
                    style={[
                      styles.chapterCellText,
                      { color: theme.dark ? '#333333' : theme.text },
                      selectedMeta?.abbrev === meta?.abbrev &&
                        index === chapterIndex &&
                        styles.chapterCellTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ) : null}

          {modalStep === 'verses' ? (
            <FlatList
              data={Array.from({ length: modalVerseCount }, (_, i) => i)}
              keyExtractor={(item) => String(item)}
              numColumns={5}
              contentContainerStyle={[
                styles.fullModalGrid,
                { paddingBottom: Math.max(insets.bottom, 16) + 40 },
              ]}
              columnWrapperStyle={styles.fullModalGridRow}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[styles.chapterCell, { borderColor: theme.dark ? '#CCCCCC' : theme.border }]}
                  onPress={() => selectModalVerse(index)}
                >
                  <Text style={[styles.chapterCellText, { color: theme.dark ? '#333333' : theme.text }]}>
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ) : null}
        </View>
      </Modal>

      {selectedCount > 0 ? (
        <View
          style={[
            styles.selectionBar,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 20) + 10,
            },
          ]}
        >
          <View style={styles.selectionHeader}>
            <Text style={[styles.selectionCount, { color: theme.textMuted }]}>
              {selectedCount} selecionado{selectedCount === 1 ? '' : 's'}
            </Text>
            <TouchableOpacity
              onPress={exitSelection}
              hitSlop={8}
              style={styles.selectionCancel}
            >
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.selectionActions}>
            <TouchableOpacity style={styles.selectionAction} onPress={handleMultiFavorite}>
              <Ionicons name={allSelectedFavorite ? 'star' : 'star-outline'} size={24} color="#FFC107" />
              <Text style={[styles.selectionActionLabel, { color: theme.textMuted }]}>
                {allSelectedFavorite ? 'Desfavoritar' : 'Favoritar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.selectionAction} onPress={handleMultiCopy}>
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={24}
                color={copied ? theme.activeGreen : theme.text}
              />
              <Text style={[styles.selectionActionLabel, { color: copied ? theme.activeGreen : theme.textMuted }]}>
                {copied ? 'Copiado!' : 'Copiar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.selectionAction} onPress={handleMultiShare}>
              <Ionicons name="share-social-outline" size={24} color={theme.text} />
              <Text style={[styles.selectionActionLabel, { color: theme.textMuted }]}>Compartilhar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paletteRow}>
            <View style={[styles.paletteDivider, { backgroundColor: theme.border }]} />
            <View style={styles.highlightRow}>
              {HIGHLIGHT_ORDER.map((colorName) => {
                const active = selectedHighlightColor === colorName;
                const swatch = HIGHLIGHT_COLORS[colorName].swatch;
                return (
                  <TouchableOpacity
                    key={colorName}
                    style={[
                      styles.swatch,
                      { backgroundColor: swatch },
                      active && styles.swatchActive,
                    ]}
                    onPress={() => handleMultiHighlight(colorName)}
                  >
                    {active ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
  },
  fabRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: '35%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  fabDisabled: {
    opacity: 0.35,
  },
  scroll: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  content: {
    padding: 16,
    paddingBottom: 220,
  },
  sectionTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    display: 'none',
  },
  pericopeTitle: {
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  verseContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  verseNumber: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
    marginTop: 2,
  },
  verseText: {
    flex: 1,
    lineHeight: 26,
  },
  completionWrap: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
  },
  completionButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  rippleCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#00E676',
    alignSelf: 'center',
    top: -95,
  },
  sparkleLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    zIndex: 10,
  },
  completionPressable: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  check: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 2,
  },
  fullModal: {
    flex: 1,
  },
  fullModalHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fullModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fullModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fullModalTitleButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  fullModalTitleButtonDark: {
    backgroundColor: '#2A2A2A',
  },
  backChaptersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'center',
  },
  backChaptersText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalNavButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  modalNavButtonDark: {
    backgroundColor: '#2A2A2A',
  },
  modalNavButtonDisabled: {
    opacity: 0.3,
  },
  modalNavText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  fullModalGrid: {
    padding: 16,
    paddingBottom: 40,
  },
  fullModalGridRow: {
    justifyContent: 'flex-start',
  },
  chapterCell: {
    flex: 1,
    minWidth: 48,
    margin: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  chapterCellActive: {
    backgroundColor: '#2f6f4f',
    borderColor: '#2f6f4f',
  },
  chapterCellText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  chapterCellTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  booksListContent: {
    padding: 16,
    paddingBottom: 40,
  },
  booksSection: {
    marginBottom: 20,
  },
  booksSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bookCell: {
    width: '31%',
    margin: '1%',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  bookCellActive: {
    backgroundColor: '#2f6f4f',
    borderColor: '#2f6f4f',
  },
  bookCellText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  bookCellTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 2,
    borderColor: '#333',
  },
  selectionBottomPadding: {
    paddingBottom: 240,
  },
  selectionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectionCount: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  selectionCancel: {
    padding: 4,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  selectionAction: {
    alignItems: 'center',
  },
  selectionActionLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  paletteRow: {
    marginTop: 4,
  },
  paletteDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
});