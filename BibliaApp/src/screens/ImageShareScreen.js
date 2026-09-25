import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
let ViewShot;
let Sharing;
let FileSystem;
try {
  ViewShot = require('react-native-view-shot').default;
} catch (e) {
  ViewShot = null;
}
try {
  Sharing = require('expo-sharing');
} catch (e) {
  Sharing = null;
}
try {
  FileSystem = require('expo-file-system');
} catch (e) {
  FileSystem = null;
}

import { useApp } from '../context/AppContext';
import { fetchInspiringBatch, fetchPixabayImages } from '../services/pixabayService';

const FALLBACK_IMAGE = null; // fundo neutro se sem rede
const APP_SIGNATURE = 'Bíblia Sagrada';
const APP_LINK = 'bibliaapp.com'; // espaço para link

export default function ImageShareScreen({ navigation, route }) {
  const { theme } = useApp();
  const insets = useSafeAreaInsets();
  const shotRef = useRef(null);

  const verses = route?.params?.verses || [];
  const title = route?.params?.title || '';
  // verses: [{ reference, text }]
  const displayText = verses
    .map((v) => (v.reference ? `${v.text}` : v.text))
    .join('\n\n');
  const displayRef = verses.length === 1 ? verses[0].reference : verses.map((v) => v.reference).join(' • ');
  const displayTitle = title || displayRef;

  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loadingImages, setLoadingImages] = useState(true);
  const [sharing, setSharing] = useState(false);

  const loadImages = useCallback(async (forceQuery) => {
    setLoadingImages(true);
    try {
      const batch = forceQuery
        ? await fetchPixabayImages({ query: forceQuery, perPage: 12 })
        : await fetchInspiringBatch(12);
      setImages(batch);
      if (batch.length && !selectedImage) {
        setSelectedImage(batch[0].largeURL);
      }
    } finally {
      setLoadingImages(false);
    }
  }, [selectedImage]);

  useEffect(() => {
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    // busca novas opções com query aleatória
    loadImages();
  };

  const handleShare = async () => {
    if (sharing) return;
    // fallback se ViewShot nativo não estiver no binary (OTA sem rebuild)
    if (!ViewShot || !shotRef.current || typeof shotRef.current.capture !== 'function') {
      Alert.alert(
        'Atualização necessária',
        'O recurso de imagem precisa de uma nova build nativa. Por enquanto, o versículo foi copiado como texto para compartilhar.'
      );
      try {
        const text = verses.map((v) => `${v.reference}\n${v.text}`).join('\n\n') + `\n\n— ${APP_SIGNATURE}`;
        const { Share } = require('react-native');
        await Share.share({ message: text });
      } catch {}
      return;
    }
    if (!Sharing || !FileSystem) {
      Alert.alert('Compartilhamento indisponível', 'Módulo de compartilhamento não disponível nesta build.');
      return;
    }
    setSharing(true);
    try {
      const uri = await shotRef.current.capture();
      let shareUri = uri;
      if (Platform.OS !== 'web') {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert('Compartilhamento indisponível', 'Não é possível compartilhar neste dispositivo.');
          return;
        }
        if (!uri.endsWith('.jpg') && !uri.endsWith('.png')) {
          const newUri = (FileSystem.cacheDirectory || FileSystem.documentDirectory) + `share-${Date.now()}.jpg`;
          await FileSystem.copyAsync({ from: uri, to: newUri });
          shareUri = newUri;
        }
        await Sharing.shareAsync(shareUri, {
          mimeType: 'image/jpeg',
          dialogTitle: displayRef || 'Compartilhar versículo',
        });
      } else {
        if (uri) window.open(uri, '_blank');
      }
    } catch (e) {
      Alert.alert('Erro ao compartilhar', String(e?.message || e));
    } finally {
      setSharing(false);
    }
  };

  const renderThumb = ({ item }) => {
    const active = selectedImage === item.largeURL;
    return (
      <Pressable
        onPress={() => setSelectedImage(item.largeURL)}
        style={[styles.thumbWrap, active && styles.thumbActive]}
      >
        <ImageBackground
          source={{ uri: item.previewURL }}
          style={styles.thumbImage}
          imageStyle={styles.thumbImageRadius}
        />
        {active ? (
          <View style={styles.thumbCheck}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          Imagem do Versículo
        </Text>
        <TouchableOpacity onPress={handleRefresh} hitSlop={8} style={styles.headerIcon}>
          <Ionicons name="refresh" size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Preview Card - área capturável + FAB */}
      <View style={styles.previewContainer}>
        <View style={styles.shotWrapper}>
          {ViewShot ? (
            <ViewShot
              ref={shotRef}
              options={{ format: 'jpg', quality: 0.92, result: 'tmpfile' }}
              style={styles.shot}
            >
              <ImageBackground
                source={selectedImage ? { uri: selectedImage } : undefined}
                style={styles.card}
                imageStyle={styles.cardImage}
                resizeMode="cover"
              >
                {!selectedImage ? (
                  <LinearGradient
                    colors={[theme.cardVerseBg || '#2f6f4f', '#1a1a1a']}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
                <LinearGradient
                  colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.62)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardText} numberOfLines={10}>
                    “{displayText}”
                  </Text>
                  <Text style={styles.cardRef}>{displayRef}</Text>
                  <View style={styles.signatureRow}>
                    <Ionicons name="book" size={12} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.signatureText}>{APP_SIGNATURE} • {APP_LINK}</Text>
                  </View>
                </View>
              </ImageBackground>
            </ViewShot>
          ) : (
            <View ref={shotRef} style={styles.shot}>
              <ImageBackground
                source={selectedImage ? { uri: selectedImage } : undefined}
                style={styles.card}
                imageStyle={styles.cardImage}
                resizeMode="cover"
              >
                {!selectedImage ? (
                  <LinearGradient
                    colors={[theme.cardVerseBg || '#2f6f4f', '#1a1a1a']}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
                <LinearGradient
                  colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.62)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardText} numberOfLines={10}>
                    “{displayText}”
                  </Text>
                  <Text style={styles.cardRef}>{displayRef}</Text>
                  <View style={styles.signatureRow}>
                    <Ionicons name="book" size={12} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.signatureText}>{APP_SIGNATURE} • {APP_LINK}</Text>
                  </View>
                </View>
              </ImageBackground>
            </View>
          )}
          {/* FAB circular sobre a pré-visualização */}
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.primary }]}
            onPress={handleShare}
            disabled={sharing}
            activeOpacity={0.85}
          >
            {sharing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="paper-plane" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={[styles.hint, { color: theme.textMuted }]}>
          Toque nas miniaturas abaixo para trocar o fundo
        </Text>
      </View>

      {/* Seletor de Imagens - expandido */}
      <View style={[styles.selectorHeader, { borderTopColor: theme.border }]}>
        <Text style={[styles.selectorTitle, { color: theme.text }]}>Paisagens inspiradoras</Text>
        <TouchableOpacity onPress={handleRefresh} style={[styles.refreshBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Ionicons name="sync" size={14} color={theme.primary} />
          <Text style={[styles.refreshText, { color: theme.primary }]}>Novas imagens</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.thumbArea}>
        {loadingImages ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Buscando imagens no Pixabay...</Text>
          </View>
        ) : (
          <FlatList
            data={images}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderThumb}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbList}
            style={styles.thumbFlatList}
            ListEmptyComponent={
              <View style={styles.emptyThumb}>
                <Ionicons name="image-outline" size={22} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>Sem conexão — usando fundo neutro</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  previewContainer: { padding: 16, alignItems: 'center' },
  shotWrapper: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  shot: { width: '100%', borderRadius: 18, overflow: 'hidden' },
  fab: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  card: {
    width: '100%',
    aspectRatio: 0.78,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: '#2f6f4f',
  },
  cardImage: { borderRadius: 18 },
  cardContent: { padding: 22, alignItems: 'center', justifyContent: 'center', flex: 1 },
  cardText: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  cardRef: {
    marginTop: 14,
    color: '#E8F5E9',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  signatureText: { color: 'rgba(255,255,255,0.95)', fontSize: 11, fontWeight: '600' },
  hint: { fontSize: 11, marginTop: 8, textAlign: 'center' },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  selectorTitle: { fontSize: 13, fontWeight: '700' },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshText: { fontSize: 12, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  loadingText: { fontSize: 12 },
  thumbArea: { flex: 1, paddingBottom: 12 },
  thumbFlatList: { flexGrow: 0 },
  thumbList: { paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 8,
  },
  thumbActive: { borderColor: '#2f6f4f' },
  thumbImage: { width: '100%', height: '100%' },
  thumbImageRadius: { borderRadius: 10 },
  thumbCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
  },
  emptyThumb: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  emptyText: { fontSize: 12 },
});
