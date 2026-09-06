import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

export default function CustomDrawerContent(props) {
  const { state, navigation } = props;
  const { theme, t } = useApp();
  const insets = useSafeAreaInsets();

  const activeIndex = state.index;
  const activeRouteName = state.routeNames[activeIndex];

  const mainItems = [
    { label: t('nav.home'), icon: 'home', color: theme.dark ? '#81C784' : '#2E7D32', bgColor: theme.dark ? '#1E3A2C' : '#E8F5E9', route: 'Início' },
    { label: t('nav.search'), icon: 'search', color: theme.dark ? '#64B5F6' : '#0288D1', bgColor: theme.dark ? '#1E3A52' : '#E1F5FE', route: 'Search' },
    { label: t('nav.favorites'), icon: 'star', color: theme.dark ? '#FFD54F' : '#F59E0B', bgColor: theme.dark ? '#4A3B12' : '#FEF3C7', route: 'Favoritos' },
    { label: t('nav.progress'), icon: 'checkmark-circle', color: theme.dark ? '#4DD0B2' : '#10B981', bgColor: theme.dark ? '#173E38' : '#D1FAE5', route: 'Progresso' },
  ];

  const resourceItems = [
    { label: t('nav.store'), icon: 'bag-handle', color: theme.dark ? '#B39DDB' : '#8B5CF6', bgColor: theme.dark ? '#342A54' : '#EDE9FE', route: 'Store' },
    { label: t('nav.quiz'), icon: 'game-controller', color: theme.dark ? '#FFB74D' : '#E65100', bgColor: theme.dark ? '#4A3310' : '#FFF3E0', route: 'Quiz' },
    { label: t('nav.donate'), icon: 'heart', color: theme.dark ? '#EF9A9A' : '#EF4444', bgColor: theme.dark ? '#4A2424' : '#FEE2E2', route: 'Donate' },
    { label: t('nav.settings'), icon: 'settings', color: theme.dark ? '#E5E7EB' : '#4B5563', bgColor: theme.dark ? '#2D3748' : '#F3F4F6', route: 'Configurações' },
  ];

  const renderItem = (item) => {
    const isActive = activeRouteName === item.route;
    return (
      <TouchableOpacity
        key={item.route}
        style={[
          styles.drawerItem,
          isActive && [
            styles.drawerItemActive,
            {
              backgroundColor: theme.dark ? 'rgba(76, 175, 125, 0.16)' : 'rgba(47, 111, 79, 0.10)',
            },
          ],
        ]}
        onPress={() => navigation.navigate(item.route)}
        activeOpacity={0.7}
      >
        {isActive ? (
          <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />
        ) : null}
        <View style={[styles.iconBadge, { backgroundColor: item.bgColor }]}>
          <Ionicons
            name={item.icon}
            size={20}
            color={item.color}
          />
        </View>
        <Text
          style={[
            styles.drawerLabel,
            { color: theme.dark ? '#D1D5DB' : '#1A1A1A' },
            isActive && [styles.drawerLabelActive, { color: theme.dark ? '#FFFFFF' : '#111827' }],
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 28 }]}
    >
      <View style={styles.headerTitleContainer}>
        <Text style={[styles.headerTitle, { color: theme.dark ? '#FFFFFF' : '#1A1A1A' }]}>
          {t('appTitle')}
        </Text>
      </View>

      <View style={styles.section}>
        {mainItems.map(renderItem)}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.dark ? '#333333' : '#E2E8F0' }]} />

      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: theme.dark ? '#888888' : '#718096' }]}>
          {t('nav.resources')}
        </Text>
        {resourceItems.map(renderItem)}
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  headerTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 3,
    overflow: 'hidden',
  },
  drawerItemActive: {
    // fundo com opacidade definido inline conforme o tema
  },
  activeIndicator: {
    position: 'absolute',
    left: 6,
    top: '26%',
    bottom: '26%',
    width: 4,
    borderRadius: 4,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 14,
  },
  drawerLabelActive: {
    color: '#111827',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 16,
  },
});
