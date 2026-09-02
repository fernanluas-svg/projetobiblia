import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../context/AppContext';

export default function CustomDrawerContent(props) {
  const { state, navigation } = props;
  const { darkMode } = useApp();

  const activeIndex = state.index;
  const activeRouteName = state.routeNames[activeIndex];

  const mainItems = [
    { label: 'Início', icon: 'home', color: '#2E7D32', bgColor: '#E8F5E9', route: 'Início' },
    { label: 'Pesquisar', icon: 'search', color: '#0288D1', bgColor: '#E1F5FE', route: 'Search' },
    { label: 'Favoritos', icon: 'star', color: '#F59E0B', bgColor: '#FEF3C7', route: 'Favoritos' },
    { label: 'Progresso de Leitura', icon: 'checkmark-circle', color: '#10B981', bgColor: '#D1FAE5', route: 'Progresso' },
  ];

  const resourceItems = [
    { label: 'Loja', icon: 'bag-handle', color: '#8B5CF6', bgColor: '#EDE9FE', route: 'Store' },
    { label: 'Quiz da Bíblia', icon: 'game-controller', color: '#E65100', bgColor: '#FFF3E0', route: 'Quiz' },
    { label: 'Colaborações', icon: 'heart', color: '#EF4444', bgColor: '#FEE2E2', route: 'Donate' },
    { label: 'Configurações', icon: 'settings', color: '#4B5563', bgColor: darkMode ? '#2D3748' : '#F3F4F6', route: 'Configurações' },
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
            { backgroundColor: darkMode ? '#1F2937' : '#F3F4F6', borderLeftColor: darkMode ? '#F9FAFB' : '#111827' }
          ]
        ]}
        onPress={() => navigation.navigate(item.route)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBadge, { backgroundColor: darkMode && item.route === 'Configurações' ? '#374151' : item.bgColor }]}>
          <Ionicons
            name={item.icon}
            size={20}
            color={item.color}
          />
        </View>
        <Text
          style={[
            styles.drawerLabel,
            { color: darkMode ? '#D1D5DB' : '#1A1A1A' },
            isActive && [styles.drawerLabelActive, { color: darkMode ? '#FFFFFF' : '#111827' }],
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <View style={styles.headerTitleContainer}>
        <Text style={[styles.headerTitle, { color: darkMode ? '#FFFFFF' : '#1A1A1A' }]}>
          Bíblia Sagrada
        </Text>
      </View>

      <View style={styles.section}>
        {mainItems.map(renderItem)}
      </View>

      <View style={[styles.divider, { backgroundColor: darkMode ? '#333333' : '#E2E8F0' }]} />

      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: darkMode ? '#888888' : '#718096' }]}>
          Recursos & Mais
        </Text>
        {resourceItems.map(renderItem)}
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
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
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  drawerItemActive: {
    backgroundColor: '#F3F4F6',
    borderLeftWidth: 4,
    borderLeftColor: '#111827',
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
