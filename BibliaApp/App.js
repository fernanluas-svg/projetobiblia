import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppProvider, useApp } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import BookListScreen from './src/screens/BookListScreen';
import ReadScreen from './src/screens/ReadScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SearchScreen from './src/screens/SearchScreen';
import StubScreen from './src/screens/StubScreen';
import QuizScreen from './src/screens/QuizScreen';
import CustomDrawerContent from './src/components/CustomDrawer';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const webFrameStyle =
  Platform.OS === 'web'
    ? {
        width: '100%',
        maxWidth: 480,
        marginHorizontal: 'auto',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
      }
    : {};

function Hamburger({ onPress, color, backgroundColor }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.menuCircle, { backgroundColor: backgroundColor ?? '#FFFFFF' }]}
      hitSlop={8}
    >
      <View style={[styles.menuBar, { backgroundColor: color }]} />
      <View style={[styles.menuBar, { backgroundColor: color }]} />
      <View style={[styles.menuBar, { backgroundColor: color }]} />
    </Pressable>
  );
}

function HomeStack() {
  const { theme, t } = useApp();
  return (
    <Stack.Navigator initialRouteName="Welcome">
      <Stack.Screen
        name="Welcome"
        component={HomeScreen}
        options={({ navigation, theme }) => ({
          headerShown: false,
          headerLeft: () => (
            <Hamburger onPress={() => navigation.getParent()?.openDrawer()} color={theme.colors.text} backgroundColor={theme.colors.card} />
          ),
        })}
      />
      <Stack.Screen
        name="Livros"
        component={BookListScreen}
        options={({ navigation, theme }) => ({
          title: t('nav.bible'),
          headerTitleAlign: 'center',
          headerLeft: () => (
            <Hamburger onPress={() => navigation.getParent()?.openDrawer()} color={theme.colors.text} backgroundColor={theme.colors.card} />
          ),
        })}
      />
      <Stack.Screen
        name="Read"
        component={ReadScreen}
        options={({ navigation, theme }) => ({
          title: t('nav.reading'),
          headerTitleAlign: 'center',
          headerLeft: () => (
            <Hamburger onPress={() => navigation.getParent()?.openDrawer()} color={theme.colors.text} backgroundColor={theme.colors.card} />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { theme, t } = useApp();
  const navigationTheme = {
    ...DefaultTheme,
    dark: theme.dark,
    colors: {
      primary: theme.primary,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      notification: theme.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Drawer.Navigator
        initialRouteName="Início"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerType: 'front',
          drawerPosition: 'left',
          drawerStyle: {
            backgroundColor: theme.background,
            width: 290,
          },
        }}
      >
        <Drawer.Screen
          name="Início"
          component={HomeStack}
          options={{
            headerShown: false,
            title: t('nav.home'),
            drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Favoritos"
          component={FavoritesScreen}
          options={({ navigation, theme }) => ({
title: t('nav.favorites'),
          headerTitleAlign: 'center',
          drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'star' : 'star-outline'} color="#FFC107" size={size} />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} backgroundColor={theme.colors.card} />
            ),
          })}
        />
        <Drawer.Screen
          name="Progresso"
          component={ProgressScreen}
          options={({ navigation, theme }) => ({
title: t('nav.progress'),
          headerTitleAlign: 'center',
          drawerIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'}
                color={color}
                size={size}
              />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} backgroundColor={theme.colors.card} />
            ),
          })}
        />
        <Drawer.Screen
          name="Configurações"
          component={SettingsScreen}
          options={({ navigation, theme }) => ({
            title: t('nav.settings'),
            headerTitleAlign: 'center',
            drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} color={color} size={size} />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} backgroundColor={theme.colors.card} />
            ),
          })}
        />
        <Drawer.Screen
          name="Search"
          component={SearchScreen}
          options={({ navigation, theme }) => ({
            title: t('nav.search'),
            headerTitleAlign: 'center',
            drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'search' : 'search-outline'} color={color} size={size} />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} backgroundColor={theme.colors.card} />
            ),
          })}
        />
        <Drawer.Screen
          name="Store"
          component={StubScreen}
          initialParams={{ title: t('nav.store'), icon: 'bag-handle-outline', message: t('stubStoreMessage') }}
          options={({ navigation, theme }) => ({
            title: t('nav.store'),
            headerTitleAlign: 'center',
            drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'bag-handle' : 'bag-handle-outline'} color={color} size={size} />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} backgroundColor={theme.colors.card} />
            ),
          })}
        />
        <Drawer.Screen
          name="Quiz"
          component={QuizScreen}
          options={({ navigation, theme }) => ({
            title: t('nav.quiz'),
            headerTitleAlign: 'center',
            drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'help-circle' : 'help-circle-outline'} color={color} size={size} />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} backgroundColor={theme.colors.card} />
            ),
          })}
        />
        <Drawer.Screen
          name="Donate"
          component={StubScreen}
          initialParams={{ title: t('nav.donate'), icon: 'heart-outline', message: t('stubDonateMessage') }}
          options={({ navigation, theme }) => ({
            title: t('nav.donate'),
            headerTitleAlign: 'center',
            drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'heart' : 'heart-outline'} color={color} size={size} />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} backgroundColor={theme.colors.card} />
            ),
          })}
        />
      </Drawer.Navigator>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

function AppFrame() {
  const { theme } = useApp();
  return (
    <View style={[styles.frame, { backgroundColor: theme.background }, webFrameStyle]}>
      <RootNavigator />
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppFrame />
      </AppProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
  },
  menuCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginLeft: 12,
  },
  menuBar: {
    width: 16,
    height: 2.5,
    borderRadius: 1.25,
    marginVertical: 1.5,
  },
});
