import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const PRODUCTS_DATA = [
  {
    id: '1',
    title: 'Bíblia de Estudo Aplicada',
    description: 'Aprofunde sua leitura diária com notas detalhadas.',
    buttonText: 'Ver Oferta',
  },
  {
    id: '2',
    title: 'Devocional Diário 365 Dias',
    description: 'Mensagens de fé e inspiração para cada manhã.',
    buttonText: 'Ver Oferta',
  },
  {
    id: '3',
    title: 'Teologia Sistemática',
    description: 'Compreenda as doutrinas fundamentais da Palavra.',
    buttonText: 'Ver Oferta',
  },
  {
    id: '4',
    title: 'O Peregrino (Edição Especial)',
    description: 'O clássico cristão sobre a jornada da fé.',
    buttonText: 'Ver Oferta',
  },
];

export default function StoreScreen({ navigation }) {
  const { theme, t } = useApp();
  const isDark = theme.dark;

  const handlePressProduct = (item) => {
    // Ação ao clicar no produto/oferta
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Loja</Text>
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
          <Ionicons name="basket-outline" size={24} color={theme.primary} style={styles.bannerIcon} />
          <Text style={[styles.bannerText, { color: theme.text }]}>
            Melhores produtos do nicho evangélico pra você.
          </Text>
        </View>

        <View style={styles.gridContainer}>
          {PRODUCTS_DATA.map((item) => (
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
                  styles.imagePlaceholder,
                  {
                    backgroundColor: isDark ? '#262626' : '#EAEAEA',
                  },
                ]}
              >
                <Ionicons name="book-outline" size={32} color={theme.textMuted} />
                <Text style={[styles.imagePlaceholderText, { color: theme.textMuted }]}>Capa do Produto</Text>
              </View>

              <View style={styles.infoContainer}>
                <Text style={[styles.productTitle, { color: theme.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.productDescription, { color: theme.textMuted }]} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
                onPress={() => handlePressProduct(item)}
              >
                <Text style={styles.actionButtonText}>{item.buttonText}</Text>
              </TouchableOpacity>
            </View>
          ))}
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
  imagePlaceholder: {
    width: '100%',
    height: 130,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePlaceholderText: {
    fontSize: 12,
    marginTop: 4,
  },
  infoContainer: {
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 'bold',
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
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
