import { useEffect, useRef } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import Ionicons from '@expo/vector-icons/Ionicons';

import { HOME_THEMES, useApp } from '../context/AppContext';

function ShimmerTitle({ isDark }) {
  const animatedValue = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 150,
        duration: 3500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [-150, 150],
    outputRange: [-150, 150],
  });

  const baseTextColor = isDark ? '#FFFFFF' : '#1A1A1A';

  return (
    <View style={styles.shimmerContainer}>
      {/* Texto base de fundo (garante o título visível e o contraste) */}
      <Text style={[styles.shimmerTitleText, { color: baseTextColor }]}>
        Bíblia Sagrada
      </Text>

      {/* Brilho reluzente (katana) recortado nas letras */}
      <MaskedView
        style={StyleSheet.absoluteFillObject}
        androidRenderingMode="software"
        maskElement={
          <Text style={[styles.shimmerTitleText, { color: 'black' }]}>
            Bíblia Sagrada
          </Text>
        }
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateX }] },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.95)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>
      </MaskedView>
    </View>
  );
}

const startReadingMeta = { abbrev: 'gn', name: 'Gênesis', chapters: 50 };

const verseOfTheDayMeta = { abbrev: 'gn', name: 'Gênesis', chapters: 50 };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) return 'Bom dia!';
  if (hour >= 12 && hour < 19) return 'Boa tarde!';
  return 'Boa noite!';
}

export default function HomeScreen({ navigation }) {
  const { lastRead, loaded, homeTheme } = useApp();

  const homeThemeMeta = HOME_THEMES[homeTheme] || HOME_THEMES.creme;
  const homeBg = homeThemeMeta.bg;
  const isDarkBg = homeThemeMeta.dark;
  const textColor = isDarkBg ? '#eeeeee' : '#222222';
  const textMutedColor = isDarkBg ? '#aaaaaa' : '#666666';
  const barColor = isDarkBg ? '#222222' : '#e0e0e0';
  const cardColor = isDarkBg ? '#1e1e1e' : '#ffffff';
  const accentColor = isDarkBg ? '#4ADE80' : '#1B4D3E';
  const subtitleColor = isDarkBg ? '#E2E8F0' : '#666666';

  const openVerseOfTheDay = () => {
    navigation.navigate('Read', {
      book: verseOfTheDayMeta,
      chapter: 0,
      verse: 0,
    });
  };

  const openSettings = () => {
    navigation.getParent()?.navigate('Configurações');
  };

  const hasProgress = loaded && lastRead?.book;

  const continueTitle = hasProgress ? lastRead.book.name : 'Comece sua leitura';
  const continueChapter = hasProgress
    ? `Capítulo ${lastRead.chapter + 1}`
    : 'Inicie por Gênesis 1';
  const continueBookMeta = hasProgress ? lastRead.book : startReadingMeta;
  const continueChapterIndex = hasProgress ? lastRead.chapter : 0;

  const continuePercent = hasProgress && lastRead.book.chapters
    ? Math.min(100, Math.round(((lastRead.chapter + 1) / lastRead.book.chapters) * 100))
    : 0;

  const openContinueReading = () => {
    navigation.navigate('Read', {
      book: continueBookMeta,
      chapter: continueChapterIndex,
    });
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: homeBg }]}>
      <View style={[styles.header, { borderBottomColor: barColor }]}>
        <TouchableOpacity
          onPress={() => navigation.getParent()?.openDrawer()}
          hitSlop={8}
          style={[styles.menuCircle, { backgroundColor: cardColor }]}
        >
          <Ionicons name="menu" size={24} color={textColor} />
        </TouchableOpacity>

        <ShimmerTitle isDark={isDarkBg} />

        <TouchableOpacity onPress={openSettings} hitSlop={8} style={[styles.menuCircle, { backgroundColor: cardColor }]}>
          <Ionicons name="settings-outline" size={22} color={textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={[styles.greeting, { color: accentColor }]}>{getGreeting()}</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            {'Que a paz do Senhor esteja com você hoje.\nTenha uma boa leitura!'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.verseCard}
          activeOpacity={0.85}
          onPress={openVerseOfTheDay}
        >
          <View style={styles.verseHeader}>
            <Ionicons name="bookmark" size={18} color="#2f6f4f" />
            <Text style={styles.verseLabel}>Versículo do Dia</Text>
            <Ionicons name="chevron-forward" size={16} color="#cde8da" style={styles.verseChevron} />
          </View>
          <Text style={styles.verseQuote}>
            “No princípio, criou Deus os céus e a terra.”
          </Text>
          <Text style={styles.verseRef}>Gênesis 1:1</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Continue a sua leitura
          </Text>
          <TouchableOpacity hitSlop={8}>
            <Text style={[styles.seeAll, { color: accentColor }]}>Ver tudo</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.continueCard, { backgroundColor: cardColor }]}
          activeOpacity={0.85}
          onPress={openContinueReading}
        >
          <View style={styles.continueRow}>
            <View style={styles.continueIcon}>
              <Ionicons name="book" size={22} color="#2f6f4f" />
            </View>
            <View style={styles.continueInfo}>
              <Text style={[styles.continueTitle, { color: textColor }]}>
                {continueTitle}
              </Text>
              <Text style={[styles.continueChapter, { color: textMutedColor }]}>
                {continueChapter}
                {hasProgress ? ` • ${continuePercent}% concluído` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={textMutedColor} />
          </View>
          {hasProgress ? (
            <View style={[styles.progressTrack, { backgroundColor: isDarkBg ? '#333' : '#e5e5e5' }]}>
              <View style={styles.progressFill} />
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Acesso rápido
          </Text>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: cardColor }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Livros')}
          >
            <View style={[styles.quickIconBg, { backgroundColor: isDarkBg ? '#274b3a' : '#E8F5E9' }]}>
              <Image source={require('../../assets/LivroIcon.png')} style={styles.quickIcon} />
            </View>
            <Text style={[styles.quickLabel, { color: textColor }]}>Bíblia</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: cardColor }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Search')}
          >
            <View style={[styles.quickIconBg, { backgroundColor: isDarkBg ? '#1e3a5f' : '#E1F5FE' }]}>
              <Image source={require('../../assets/PesquisaIcon.png')} style={styles.quickIcon} />
            </View>
            <Text style={[styles.quickLabel, { color: textColor }]}>Pesquisa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: cardColor }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Favoritos')}
          >
            <View style={[styles.quickIconBg, { backgroundColor: isDarkBg ? '#5a4a20' : '#FEF3C7' }]}>
              <Image source={require('../../assets/favoritoicon.png')} style={styles.quickIcon} />
            </View>
            <Text style={[styles.quickLabel, { color: textColor }]}>Favoritos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  menuCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  shimmerContainer: {
    width: 200,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  shimmerGradient: {
    width: 100,
    height: '100%',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
  },
  headerBlock: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2f6f4f',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
  },
  verseCard: {
    backgroundColor: '#2f6f4f',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verseChevron: {
    marginLeft: 'auto',
  },
  verseLabel: {
    color: '#eafff2',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  verseQuote: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '500',
  },
  verseRef: {
    color: '#cde8da',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  seeAll: {
    color: '#2f6f4f',
    fontSize: 14,
    fontWeight: '600',
  },
  continueCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  continueInfo: {
    flex: 1,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  continueChapter: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e5e5',
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    width: '38%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#2f6f4f',
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  quickIconBg: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickIcon: {
    width: 38,
    height: 38,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },
});
