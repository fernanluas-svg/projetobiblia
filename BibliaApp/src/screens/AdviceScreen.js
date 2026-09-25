import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useApp } from '../context/AppContext';

const EMOTIONS = [
  { key: 'anxiety', icon: 'pulse', dark: ['#4DD0B2', '#2B5F55'], light: ['#10B981', '#C9F0E0'] },
  { key: 'guilt', icon: 'sad', dark: ['#EF9A9A', '#4A2424'], light: ['#EF4444', '#FEE2E2'] },
  { key: 'worried', icon: 'help-circle', dark: ['#FFD54F', '#4A3E10'], light: ['#F59E0B', '#FEF3C7'] },
  { key: 'fear', icon: 'alert-circle', dark: ['#9575CD', '#3E2C54'], light: ['#7C3AED', '#EDE9FE'] },
  { key: 'tired', icon: 'battery-dead', emoji: '😮‍💨', dark: ['#90A4AE', '#2D3748'], light: ['#607D8B', '#ECEFF1'] },
  { key: 'anger', icon: 'flame', dark: ['#FFB74D', '#4A3310'], light: ['#E65100', '#FFF3E0'] },
  { key: 'loneliness', icon: 'person', dark: ['#64B5F6', '#2A4A6B'], light: ['#0288D1', '#D8EAFB'] },
  { key: 'sick', icon: 'thermometer', dark: ['#F48FB1', '#4A2C38'], light: ['#DB2777', '#FCE7F3'] },
  { key: 'grief', icon: 'ribbon', emoji: '🎗️', dark: ['#94A3B8', '#2D3748'], light: ['#4B5563', '#F3F4F6'] },
  { key: 'envy', icon: 'eye', dark: ['#81C784', '#2E5C44'], light: ['#2E7D32', '#DCEFE2'] },
  { key: 'temptation', icon: 'flash', dark: ['#F06292', '#4A2440'], light: ['#DB2777', '#FCE7F3'] },
  { key: 'guidance', icon: 'compass', dark: ['#4FC3F7', '#1E4A5E'], light: ['#0EA5E9', '#CFFAFE'] },
  { key: 'decisions', icon: 'git-branch', dark: ['#7986CB', '#333A66'], light: ['#3949AB', '#E0E3F5'] },
  { key: 'prayer', icon: 'hand-left', emoji: '🙏', dark: ['#FFD54F', '#4A3E10'], light: ['#D4A017', '#FEF3C7'] },
  { key: 'gratitude', icon: 'heart-circle', dark: ['#B39DDB', '#342A54'], light: ['#8B5CF6', '#EDE9FE'] },
];

function EmotionCard({ item, theme, t, onPress }) {
  const [color, bgColor] = theme.dark ? item.dark : item.light;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => onPress(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: bgColor, borderColor: color },
          animatedStyle,
        ]}
      >
        <View style={[styles.cardIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          {item.emoji ? (
            <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
          ) : (
            <Ionicons name={item.icon} size={26} color={'#FFFFFF'} />
          )}
        </View>
        <Text style={styles.cardLabel}>
          {t(`advice.${item.key}`)}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={'rgba(255,255,255,0.6)'} />
      </View>
    </TouchableOpacity>
  );
}

export default function AdviceScreen({ navigation }) {
  const { theme, t } = useApp();

  const openDetail = (item) => {
    const [color, bgColor] = theme.dark ? item.dark : item.light;
    navigation.navigate('ConselhosDetalhe', {
      title: t(`advice.${item.key}`),
      icon: item.icon,
      emoji: item.emoji,
      category: item.key,
      color,
      bgColor,
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
          onPress={() => navigation.getParent()?.openDrawer()}
          hitSlop={8}
          style={[styles.menuCircle, { backgroundColor: theme.background }]}
        >
          <Ionicons name="menu" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('nav.advice')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headline, { color: theme.text }]}>{t('advice.ask')}</Text>

        {EMOTIONS.map((item) => (
          <EmotionCard
            key={item.key}
            item={item}
            theme={theme}
            t={t}
            onPress={openDetail}
          />
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
  headline: {
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 30,
    marginTop: 8,
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 12,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },
});