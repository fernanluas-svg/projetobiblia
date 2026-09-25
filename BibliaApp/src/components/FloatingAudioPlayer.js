import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated as NativeAnimated,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import { getTranslation } from '../data/translations';
import {
  buildAudioUrl,
  downloadAudio,
  deleteAudio,
  hasLocalAudio,
  localAudioFile,
} from '../services/audioService';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const SKIP_SECONDS = 10;
const COLLAPSE_THRESHOLD = 60;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function FloatingAudioPlayer({ versionSigla, abbrev, chapterNumber, visible = false, onCollapse }) {
  const { theme, t } = useApp();
  const insets = useSafeAreaInsets();
  const [uri, setUri] = useState(null);
  const [isLocal, setIsLocal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [rate, setRate] = useState(1);
  const [seekValue, setSeekValue] = useState(null);
  const [cardHeight, setCardHeight] = useState(0);

  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  const translateY = useRef(new NativeAnimated.Value(1000)).current;
  const opacityAnim = useRef(new NativeAnimated.Value(0)).current;

  const hiddenOffset = cardHeight > 0 ? cardHeight + insets.bottom + 100 : 700;

  useEffect(() => {
    if (visible) {
      NativeAnimated.parallel([
        NativeAnimated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 180,
          mass: 0.9,
          useNativeDriver: true,
        }),
        NativeAnimated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      NativeAnimated.parallel([
        NativeAnimated.timing(translateY, {
          toValue: hiddenOffset,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        NativeAnimated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const slideBack = () => {
    NativeAnimated.spring(translateY, {
      toValue: 0,
      damping: 18,
      stiffness: 180,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  };

  // Handle bar: tocá-la ou arrastá-la para baixo recolhe o player.
  const collapsePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy >= COLLAPSE_THRESHOLD || (g.dy < 8 && g.moveY > 0)) {
          onCollapse?.();
        } else if (g.dy > 0) {
          slideBack();
        }
      },
    })
  ).current;

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
  const duration = status.duration > 0 ? status.duration : 0;
  const progress = seekValue != null ? seekValue : Math.min(status.currentTime, duration);

  const handleTogglePlay = () => {
    if (!uri) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleSkip = (delta) => {
    if (!uri) return;
    player.seekTo(Math.min(Math.max(status.currentTime + delta, 0), duration));
  };

  const handleChangeRate = (r) => {
    try {
      player.shouldCorrectPitch = true;
    } catch (e) {
      // propriedade somente leitura em algumas plataformas: ignora
    }
    player.setPlaybackRate(r, 'high');
    setRate(r);
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

  return (
    <NativeAnimated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.floating,
        {
          backgroundColor: theme.bar,
          borderColor: theme.border,
          bottom: insets.bottom + 12,
          transform: [{ translateY }],
          opacity: opacityAnim,
        },
      ]}
      onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
      accessibilityLabel={t('audio.label', { sigla: versionSigla })}
    >
      {/* Barra de recolhimento (handle) */}
      <View
        style={styles.handleArea}
        {...collapsePan.panHandlers}
        accessibilityRole="button"
        accessibilityLabel={t('audio.collapse')}
      >
        <View style={[styles.handleBar, { backgroundColor: theme.border }]} />
      </View>

      {/* Título + download/offline */}
      <View style={styles.titleRow}>
        <View style={styles.titleInfo}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {t('audio.label', { sigla: versionSigla })}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {downloading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : isLocal ? (
          <TouchableOpacity onPress={handleDelete} hitSlop={8} activeOpacity={0.7} accessibilityLabel={t('audio.deleteTitle')}>
            <Ionicons name="checkmark-circle" size={22} color={theme.activeGreen} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleDownload} hitSlop={8} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={22} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Barra de progresso */}
      <View style={styles.progressRow}>
        <Text style={[styles.time, { color: theme.textMuted }]}>{formatTime(progress)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={Math.min(progress, duration || 1)}
          onSlidingStart={() => setSeekValue(status.currentTime)}
          onValueChange={(v) => setSeekValue(v)}
          onSlidingComplete={(v) => {
            player.seekTo(v);
            setSeekValue(null);
          }}
          minimumTrackTintColor={theme.primary}
          maximumTrackTintColor={theme.border}
          thumbTintColor={theme.primary}
          disabled={!uri}
        />
        <Text style={[styles.time, { color: theme.textMuted }]}>{formatTime(duration)}</Text>
      </View>

      {/* Controles centrais */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.skipButton, { borderColor: theme.border }]}
          onPress={() => handleSkip(-SKIP_SECONDS)}
          disabled={!uri}
          hitSlop={6}
          activeOpacity={0.7}
          accessibilityLabel={t('audio.skipBack')}
        >
          <Ionicons name="play-back-outline" size={20} color={theme.text} />
          <Text style={[styles.skipLabel, { color: theme.textMuted }]}>{SKIP_SECONDS}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: theme.primary }]}
          onPress={handleTogglePlay}
          disabled={!uri}
          activeOpacity={0.8}
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          {status.isBuffering ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.skipButton, { borderColor: theme.border }]}
          onPress={() => handleSkip(SKIP_SECONDS)}
          disabled={!uri}
          hitSlop={6}
          activeOpacity={0.7}
          accessibilityLabel={t('audio.skipForward')}
        >
          <Ionicons name="play-forward-outline" size={20} color={theme.text} />
          <Text style={[styles.skipLabel, { color: theme.textMuted }]}>{SKIP_SECONDS}</Text>
        </TouchableOpacity>
      </View>

      {/* Controles de velocidade */}
      <View style={styles.speedRow}>
        {SPEEDS.map((s) => {
          const active = rate === s;
          return (
            <TouchableOpacity
              key={s}
              style={[
                styles.speedChip,
                { borderColor: active ? theme.primary : theme.border },
                active && { backgroundColor: theme.selection },
              ]}
              onPress={() => handleChangeRate(s)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.speedText,
                  { color: active ? theme.primary : theme.textMuted },
                  active && styles.speedTextActive,
                ]}
              >
                {s}x
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </NativeAnimated.View>
  );
}

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingTop: 4,
    paddingHorizontal: 14,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  handleArea: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 40,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleInfo: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 30,
    marginHorizontal: 4,
  },
  time: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    minWidth: 36,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  skipButton: {
    width: 46,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  skipLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: -2,
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  speedChip: {
    minWidth: 52,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  speedText: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  speedTextActive: {
    fontWeight: 'bold',
  },
});