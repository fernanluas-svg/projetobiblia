import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const OFFER_BUTTON_COLOR = '#E53935';

const CATEGORIES = [
  { key: 'livros', label: '📚 Livros' },
  { key: 'infantil', label: '👶 Infantil' },
  { key: 'camisas', label: '👕 Camisas' },
];

const PRODUCTS_DATA = [
  {
    id: '1',
    category: 'livros',
    title: 'Ferido pelo Processo Curado Pelo Propósito',
    image:
      'https://down-br.img.susercontent.com/file/br-11134207-81z1k-mggnr9f2t9mo0b@resize_w900_nl.webp',
    url: 'https://s.shopee.com.br/7AdQdtQpEO',
    buttonText: 'Ver Oferta',
  },
  {
    id: '2',
    category: 'livros',
    title: 'Eu, Minhas Lutas Internas e Deus',
    image:
      'https://down-br.img.susercontent.com/file/sg-11134201-7rdym-mcf6qan1x2rbd2@resize_w900_nl.webp',
    url: 'https://s.shopee.com.br/8pled5dFQe',
    buttonText: 'Ver Oferta',
  },
  {
    id: '3',
    category: 'livros',
    title: 'Café com Deus Pai',
    image:
      'https://down-br.img.susercontent.com/file/br-11134207-7r98o-m283cuc4b629fd@resize_w900_nl.webp',
    url: 'https://s.shopee.com.br/9AOV3OUtpz',
    buttonText: 'Ver Oferta',
  },
  {
    id: '4',
    category: 'livros',
    title: 'Kit Casal Cristão 2 Biblias',
    image:
      'https://down-br.img.susercontent.com/file/br-11134207-7r98o-lygmkt5s0jxh5c@resize_w900_nl.webp',
    url: 'https://s.shopee.com.br/1gIU7jCIAE',
    buttonText: 'Ver Oferta',
  },
  {
    id: '5',
    category: 'infantil',
    title: 'Bíblia Infantil Ilustrada | Promessas de Amor',
    image:
      'https://down-br.img.susercontent.com/file/sg-11134201-8227i-mhmajmnn55vmb1@resize_w900_nl.webp',
    url: 'https://s.shopee.com.br/2gB1MLzzVd',
    buttonText: 'Ver Oferta',
  },
  {
    id: '6',
    category: 'infantil',
    title: 'Livro Devocional Café com Deus Pai Kids Infantil',
    image:
      'https://down-br.img.susercontent.com/file/sg-11134201-7rbki-lmywv17ps2mx0f@resize_w900_nl.webp',
    url: 'https://s.shopee.com.br/3g3YYJSYRI',
    buttonText: 'Ver Oferta',
  },
  {
    id: '7',
    category: 'infantil',
    title: 'Livro Infantil Devocional Tempo com Deus',
    image:
      'https://down-br.img.susercontent.com/file/br-11134207-820mh-mpr5e9ojdiwyf5@resize_w900_nl.webp',
    url: 'https://s.shopee.com.br/2BEkm8sv7e',
    buttonText: 'Ver Oferta',
  },
  {
    id: '8',
    category: 'infantil',
    title: '365 Histórias bíblicas narradas com carinho',
    image:
      'https://down-br.img.susercontent.com/file/br-11134207-7r98o-mcv3pzkr854x94@resize_w900_nl.webp',
    url: 'https://s.shopee.com.br/7AdQjOlfxN',
    buttonText: 'Ver Oferta',
  },
  {
    id: '9',
    category: 'camisas',
    title: 'Blusa Tshirt Estampada Gospel Feminina',
    image:
      'https://down-br.img.susercontent.com/file/br-11134207-7r98o-m0eruiwivpmp50@resize_w900_nl.webp',
    url: 'https://s.shopee.com.br/2LYAyInOfl',
    buttonText: 'Ver Oferta',
  },
  {
    id: '10',
    category: 'camisas',
    title: 'T-shirt Linda Até Que Ele Venha',
    image:
      'https://down-br.img.susercontent.com/file/br-11134207-7r98o-m3wkwef65al7ee@resize_w900_nl.webp',
    url: 'https://s.shopee.com.br/6q0aLMlbOq',
    buttonText: 'Ver Oferta',
  },
  {
    id: '11',
    category: 'camisas',
    title: 'Camiseta T-shirt Feminina Deus Te Quer Sorrindo',
    image:
      'https://down-br.img.susercontent.com/file/0ad2c4ed5284872e7ae1e1fbb025832e@resize_w900_nl.webp',
    url: 'https://s.shopee.com.br/5AsMMPkidw',
    buttonText: 'Ver Oferta',
  },
  {
    id: '12',
    category: 'camisas',
    title: 'Camisa Camiseta T-Shirt Cristã "Ele nos amou primeiro"',
    image:
      'https://down-br.img.susercontent.com/file/br-11134207-820mh-mqxnp9w35czob4@resize_w900_nl.webp',
    url: 'https://s.shopee.com.br/3g3Ya2XjHy',
    buttonText: 'Ver Oferta',
  },
];

function PulseButton({ children, style, activeOpacity = 0.85, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.06,
          duration: 650,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 650,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={style} activeOpacity={activeOpacity} onPress={onPress}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function StoreScreen({ navigation }) {
  const { theme, t } = useApp();
  const isDark = theme.dark;
  const [activeCategory, setActiveCategory] = useState('livros');
  const gridOpacity = useRef(new Animated.Value(1)).current;

  const filteredProducts = PRODUCTS_DATA.filter((item) => item.category === activeCategory);

  const handlePressProduct = (item) => {
    if (item.url) {
      Linking.openURL(item.url).catch(() => {});
    }
  };

  const switchCategory = (category) => {
    if (category === activeCategory) return;
    Animated.timing(gridOpacity, {
      toValue: 0,
      duration: 120,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setActiveCategory(category);
      gridOpacity.setValue(0);
      Animated.timing(gridOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
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
          onPress={() => navigation.openDrawer()}
          hitSlop={8}
          style={[styles.menuCircle, { backgroundColor: theme.background }]}
        >
          <Ionicons name="menu" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('nav.storeTitle')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.bannerContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="storefront-outline" size={24} color={theme.primary} style={styles.bannerIcon} />
          <Text style={[styles.bannerText, { color: theme.text }]}>
            Melhores produtos do nicho evangélico pra você.
          </Text>
        </View>

        <View style={styles.categoriesRow}>
          {CATEGORIES.map((category) => {
            const active = category.key === activeCategory;
            return (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: active ? theme.primary : theme.surface,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => switchCategory(category.key)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: active ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Animated.View style={[styles.gridContainer, { opacity: gridOpacity }]}>
          {filteredProducts.map((item) => (
            <View
              key={item.id}
              style={[
                styles.cardContainer,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.imageContainer,
                  {
                    backgroundColor: isDark ? '#262626' : '#EAEAEA',
                  },
                ]}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <Ionicons name="book-outline" size={32} color={theme.textMuted} />
                    <Text style={[styles.imagePlaceholderText, { color: theme.textMuted }]}>
                      Capa do Produto
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.infoContainer}>
                <Text style={[styles.productTitle, { color: theme.text }]} numberOfLines={3}>
                  {item.title}
                </Text>
                <Text style={[styles.productDescription, { color: theme.textMuted }]} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>

              <PulseButton
                style={[styles.actionButton, { backgroundColor: OFFER_BUTTON_COLOR }]}
                onPress={() => handlePressProduct(item)}
              >
                <Text style={styles.actionButtonText}>{item.buttonText}</Text>
              </PulseButton>
            </View>
          ))}
        </Animated.View>
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
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  bannerIcon: {
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  categoriesRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  categoryChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: (width - 44) / 2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '100%',
    height: 130,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholderText: {
    fontSize: 12,
    marginTop: 4,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 18,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: OFFER_BUTTON_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
