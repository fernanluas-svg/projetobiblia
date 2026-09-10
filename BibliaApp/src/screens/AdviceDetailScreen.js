import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useApp } from '../context/AppContext';

export default function AdviceDetailScreen({ route, navigation }) {
  const { theme, t } = useApp();
  const { title = '', icon = 'book-outline', emoji, color = '#81C784', bgColor = '#2E5C44' } =
    route?.params ?? {};

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
              <Text style={{ fontSize: 40 }}>{emoji}</Text>
            ) : (
              <Ionicons name={icon} size={40} color={color} />
            )}
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textMuted }]}>{t('stubSoon')}</Text>
          <Text style={[styles.message, { color: theme.textMuted }]}>
            {t('advice.detailPlaceholder')}
          </Text>
        </View>
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
    flexGrow: 1,
    padding: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});