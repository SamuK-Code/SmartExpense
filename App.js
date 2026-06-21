// App.js — SmartExpense v3.0 — COM THEME SPLASH E GROUP PROVIDER

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { View } from 'react-native';

import { AppProvider } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { UserProvider } from './src/context/UserContext';
import { GroupProvider } from './src/context/GroupContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/components/SplashScreen';

function AppContent() {
  const { colors, darkMode } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      {showSplash && (
        <SplashScreen 
          onFinish={() => setShowSplash(false)} 
          themeColors={colors}
        />
      )}

      {!showSplash && (
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      )}

      {!showSplash && (
        <StatusBar 
          style={darkMode ? 'light' : 'dark'} 
          backgroundColor={colors.bgPrimary}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <UserProvider>
            <GroupProvider>
              <AppProvider>
                <AppContent />
              </AppProvider>
            </GroupProvider>
          </UserProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}