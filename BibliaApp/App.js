import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppProvider, useApp } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import ReadScreen from './src/screens/ReadScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SearchScreen from './src/screens/SearchScreen';
import StubScreen from './src/screens/StubScreen';
import CustomDrawerContent from './src/components/CustomDrawer';

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

function Hamburger({ onPress, color }) {
  return (
    <Pressable onPress={onPress} style={styles.hamburger} hitSlop={8}>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={[styles.bar, { backgroundColor: color }]} />
    </Pressable>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Livros"
        component={HomeScreen}
        options={({ navigation, theme }) => ({
          title: 'Bíblia',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <Hamburger onPress={() => navigation.getParent()?.openDrawer()} color={theme.colors.text} />
          ),
        })}
      />
      <Stack.Screen
        name="Read"
        component={ReadScreen}
        options={({ navigation, theme }) => ({
          title: 'Leitura',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <Hamburger onPress={() => navigation.getParent()?.openDrawer()} color={theme.colors.text} />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { darkMode } = useApp();
  const navigationTheme = darkMode ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navigationTheme}>
      <Drawer.Navigator
        initialRouteName="Início"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerType: 'front',
          drawerPosition: 'left',
          drawerStyle: {
            backgroundColor: darkMode ? '#121212' : '#FFFFFF',
            width: 290,
          },
        }}
      >
        <Drawer.Screen
          name="Início"
          component={HomeStack}
          options={{
            headerShown: false,
            title: 'Início',
            drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Favoritos"
          component={FavoritesScreen}
          options={({ navigation, theme }) => ({
title: 'Favoritos',
          headerTitleAlign: 'center',
          drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'star' : 'star-outline'} color="#FFC107" size={size} />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} />
            ),
          })}
        />
        <Drawer.Screen
          name="Progresso"
          component={ProgressScreen}
          options={({ navigation, theme }) => ({
title: 'Progresso de Leitura',
          headerTitleAlign: 'center',
          drawerIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'}
                color={color}
                size={size}
              />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} />
            ),
          })}
        />
        <Drawer.Screen
          name="Configurações"
          component={SettingsScreen}
          options={({ navigation, theme }) => ({
            title: 'Configurações',
            headerTitleAlign: 'center',
            drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} color={color} size={size} />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} />
            ),
          })}
        />
        <Drawer.Screen
          name="Search"
          component={SearchScreen}
          options={({ navigation, theme }) => ({
            title: 'Pesquisar',
            headerTitleAlign: 'center',
            drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'search' : 'search-outline'} color={color} size={size} />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} />
            ),
          })}
        />
        <Drawer.Screen
          name="Store"
          component={StubScreen}
          initialParams={{ title: 'Loja', icon: 'bag-handle-outline', message: 'Loja em breve.' }}
          options={({ navigation, theme }) => ({
            title: 'Loja',
            headerTitleAlign: 'center',
            drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'bag-handle' : 'bag-handle-outline'} color={color} size={size} />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} />
            ),
          })}
        />
        <Drawer.Screen
          name="Quiz"
          component={StubScreen}
          initialParams={{ title: 'Mini Quiz da Bíblia', icon: 'help-circle-outline', message: 'Quiz da Bíblia em breve.' }}
          options={({ navigation, theme }) => ({
            title: 'Mini Quiz da Bíblia',
            headerTitleAlign: 'center',
            drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'help-circle' : 'help-circle-outline'} color={color} size={size} />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} />
            ),
          })}
        />
        <Drawer.Screen
          name="Donate"
          component={StubScreen}
          initialParams={{ title: 'Colaborações', icon: 'heart-outline', message: 'Área de apoio e Pix em breve.' }}
          options={({ navigation, theme }) => ({
            title: 'Colaborações',
            headerTitleAlign: 'center',
            drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'heart' : 'heart-outline'} color={color} size={size} />
            ),
            headerLeft: () => (
              <Hamburger onPress={() => navigation.openDrawer()} color={theme.colors.text} />
            ),
          })}
        />
      </Drawer.Navigator>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <View style={[styles.frame, { backgroundColor: '#f5f5f5' }, webFrameStyle]}>
        <RootNavigator />
      </View>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
  },
  hamburger: {
    width: 26,
    height: 20,
    justifyContent: 'space-between',
    marginLeft: 6,
  },
  bar: {
    height: 3,
    borderRadius: 1.5,
  },
});
