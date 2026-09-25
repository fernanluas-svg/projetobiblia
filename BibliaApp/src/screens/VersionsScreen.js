import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useApp } from '../context/AppContext';
import VersionList from '../components/VersionList';

export default function VersionsScreen() {
  const { theme, t } = useApp();

  return (
    <VersionList
      contentContainerStyle={styles.content}
      listHeader={
        <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="albums-outline" size={24} color={theme.primary} style={styles.headerIcon} />
          <Text style={[styles.headerText, { color: theme.text }]}>{t('versions.intro')}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});