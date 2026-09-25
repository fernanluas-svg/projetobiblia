import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { useApp } from '../context/AppContext';
import { getTranslation } from '../data/translations';
import {
  buildAudioUrl,
  downloadAudio,
  deleteAudio,
  hasLocalAudio,
  localAudioFile,
} from '../services/audioService';

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ChapterAudio({ versionSigla, abbrev, chapterNumber, compact = false }) {
  const { theme, t } = useApp();
  const [uri, setUri] = useState(null);
  const [isLocal, setIsLocal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  const resolveUri = () => {
    if (hasLocalAudio(versionSigla, abbrev, chapterNumber)) {
      return localAudioFile(versionSigla, abbrev, chapterNumber).uri;
    }
    return buildAudioUrl(versionSigla, abbrev, chapterNumber);
  };

  // Carrega o capítulo atual: local (offline) quando disponível, senão streaming.
  useEffect(() => {
    let cancelled = false;
    setUri(null);
    Promise.resolve().then(() => {
      if (!cancelled) {
        setIsLocal(hasLocalAudio(versionSigla, abbrev, chapterNumber));
        setUri(resolveUri());
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionSigla, abbrev, chapterNumber]);

  useEffect(() => {
    if (uri) {
      player.pause();
      player.replace(uri);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  if (Platform.OS === 'web') {
    return null;
  }

  const isPlaying = status.playing;

  const handleTogglePlay = () => {
    if (!uri) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadAudio(versionSigla, abbrev, chapterNumber);
      setIsLocal(true);
      setUri(localAudioFile(versionSigla, abbrev, chapterNumber).uri);
    } catch (e) {
      Alert.alert(t('audio.errorTitle'), t('audio.errorMsg'));
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t('audio.deleteTitle'), t('audio.deleteMsg'), [
      { text: t('favoritesCancel'), style: 'cancel' },
      {
        text: t('audio.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAudio(versionSigla, abbrev, chapterNumber);
            setIsLocal(false);
            setUri(buildAudioUrl(versionSigla, abbrev, chapterNumber));
          } catch (e) {
            // ignora falha ao remover
          }
        },
      },
    ]);
  };

  const translation = getTranslation(versionSigla);
  const subtitle = translation?.name ?? versionSigla;

  if (compact) {
    return (
      <View
        style={[styles.compactPill, { backgroundColor: theme.surface, borderColor: theme.border }]}
        accessibilityLabel={t('audio.label', { sigla: versionSigla })}
      >
        <TouchableOpacity
          style={[styles.compactPlay, { backgroundColor: theme.primary }]}
          onPress={handleTogglePlay}
          disabled={!uri}
          hitSlop={6}
          activeOpacity={0.7}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={14} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.compactTime, { color: theme.textMuted }]} numberOfLines={1}>
          {formatTime(status.currentTime)}
        </Text>
        {downloading ? (
          <ActivityIndicator size="small" color={theme.primary} style={styles.compactAction} />
        ) : isLocal ? (
          <TouchableOpacity
            onPress={handleDelete}
            hitSlop={6}
            style={styles.compactAction}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={18} color={theme.activeGreen} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleDownload}
            hitSlop={6}
            style={styles.compactAction}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: theme.primary }]}
        onPress={handleTogglePlay}
        disabled={!uri}
        activeOpacity={0.8}
      >
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {t('audio.label', { sigla: versionSigla })}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.statusArea}>
        <Text style={[styles.time, { color: theme.textMuted }]}>
          {formatTime(status.currentTime)} / {formatTime(status.duration)}
        </Text>
        <TouchableOpacity
          onPress={isLocal ? handleDelete : handleDownload}
          disabled={downloading}
          hitSlop={8}
          activeOpacity={0.7}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : isLocal ? (
            <View style={[styles.downloadedBadge, { backgroundColor: theme.selection }]}>
              <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
              <Text style={[styles.downloadedText, { color: theme.primary }]}>
                {t('audio.downloaded')}
              </Text>
            </View>
          ) : (
            <Ionicons name="download-outline" size={24} color={theme.primary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  statusArea: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 11,
    marginBottom: 6,
  },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  downloadedText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  compactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1,
    paddingVertical: 4,
    paddingLeft: 5,
    paddingRight: 9,
  },
  compactPlay: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 7,
  },
  compactTime: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    minWidth: 34,
  },
  compactAction: {
    marginLeft: 8,
  },
});