import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useApp } from '../context/AppContext';
import { TRANSLATIONS, getTranslation } from '../data/translations';
import {
  downloadTranslation,
  removeTranslation,
} from '../services/translationsService';
import { AUDIO_VERSIONS } from '../services/audioService';

export default function VersionList({ style, contentContainerStyle, listHeader }) {
  const { theme, t, activeVersion, selectVersion, installedVersions, setInstalledVersion } = useApp();
  const [downloading, setDownloading] = useState({});
  const [busy, setBusy] = useState(false);

  const isInstalled = (sigla) => installedVersions.includes(sigla);
  const isActive = (sigla) => activeVersion === sigla;
  const isEmbeddedActive = activeVersion === null;

  const handleDownload = async (sigla) => {
    if (busy) return;
    setBusy(true);
    setDownloading((prev) => ({ ...prev, [sigla]: true }));
    try {
      await downloadTranslation(sigla);
      setInstalledVersion(sigla, true);
      selectVersion(sigla);
      Alert.alert(t('versions.doneTitle'), t('versions.doneMsg', { name: getTranslation(sigla)?.name ?? sigla }));
    } catch (e) {
      Alert.alert(t('versions.errorTitle'), t('versions.errorMsg'));
    } finally {
      setDownloading((prev) => ({ ...prev, [sigla]: false }));
      setBusy(false);
    }
  };

  const handleDelete = (sigla) => {
    Alert.alert(t('versions.deleteTitle'), t('versions.deleteMsg'), [
      { text: t('favoritesCancel'), style: 'cancel' },
      {
        text: t('versions.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTranslation(sigla);
            setInstalledVersion(sigla, false);
          } catch (e) {
            // ignora falha ao remover
          }
        },
      },
    ]);
  };

  const handleUseEmbedded = () => {
    if (activeVersion !== null) {
      selectVersion(null);
    }
  };

  const renderItem = ({ item }) => {
    const { sigla, name, year, publisher, embedded, domainPublic } = item;
    const installed = isInstalled(sigla);
    const active = isActive(sigla);
    const isDown = !!downloading[sigla];
    const details = [year, publisher].filter(Boolean).join(' · ');
    const publicDomain = domainPublic ? ` · ${t('versions.publicDomain')}` : '';
    const audioTag = AUDIO_VERSIONS.includes(sigla) ? ` · ${t('audio.tag')}` : '';

    let actionArea;
    if (isDown) {
      actionArea = (
        <View style={[styles.badge, styles.badgeDownloading, { backgroundColor: theme.selection }]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.badgeText, { color: theme.primary }]}>{t('versions.downloading')}</Text>
        </View>
      );
    } else if (embedded) {
      actionArea = (
        <TouchableOpacity
          style={[styles.button, isEmbeddedActive ? styles.buttonDone : styles.buttonPrimary]}
          onPress={handleUseEmbedded}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isEmbeddedActive ? 'checkmark-circle' : 'arrow-undo-outline'}
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.buttonText}>
            {isEmbeddedActive ? t('versions.active') : t('versions.useEmbedded')}
          </Text>
        </TouchableOpacity>
      );
    } else if (installed) {
      actionArea = (
        <View style={styles.actionsRow}>
          {active ? (
            <View style={[styles.badge, { backgroundColor: theme.selection }]}>
              <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
              <Text style={[styles.badgeText, { color: theme.primary }]}>{t('versions.active')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={() => selectVersion(sigla)}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>{t('versions.use')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.background }]}
            onPress={() => handleDelete(sigla)}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={18} color={theme.dark ? '#EF9A9A' : '#DC2626'} />
          </TouchableOpacity>
        </View>
      );
    } else {
      actionArea = (
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, { backgroundColor: theme.primary }]}
          onPress={() => handleDownload(sigla)}
          activeOpacity={0.8}
        >
          <Ionicons name="download-outline" size={16} color="#FFFFFF" />
          <Text style={styles.buttonText}>{t('versions.download')}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
          active && { borderColor: theme.primary },
        ]}
      >
        <View style={styles.cardTop}>
          <View style={[styles.siglaBadge, { backgroundColor: active ? theme.primary : theme.selection }]}>
            <Text style={[styles.siglaText, { color: active ? '#FFFFFF' : theme.primary }]}>
              {sigla}
            </Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
            <Text style={[styles.details, { color: theme.textMuted }]}>
              {details.length > 0 ? details : '\u00A0'}
              {publicDomain}
              {audioTag}
              {embedded ? ` · ${t('versions.embedded')}` : ''}
            </Text>
          </View>
        </View>
        {actionArea}
      </View>
    );
  };

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }, style]}
      contentContainerStyle={contentContainerStyle}
      data={TRANSLATIONS}
      keyExtractor={(item) => item.sigla}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={listHeader ?? null}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  siglaBadge: {
    width: 52,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  siglaText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  nameBlock: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  details: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 110,
  },
  buttonPrimary: {
    backgroundColor: '#2f6f4f',
  },
  buttonDone: {
    backgroundColor: '#2E7D32',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  badgeDownloading: {
    minWidth: 110,
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});