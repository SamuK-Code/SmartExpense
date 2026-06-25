import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { UserProvider } from './src/context/UserContext';
import { AppProvider } from './src/context/AppContext';
import { CircleProvider } from './src/context/CircleContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { darkMode } = useTheme();

  const navigationTheme = darkMode
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: '#0F172A', card: '#1E293B', text: '#F1F5F9', border: '#334155' } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#F8FAFC', card: '#FFFFFF', text: '#0F172A', border: '#E2E8F0' } };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LanguageProvider>
          <UserProvider>
            <AppProvider>
              <CircleProvider>
                <AppContent />
              </CircleProvider>
            </AppProvider>
          </UserProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}