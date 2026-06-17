import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';

import { AppProvider } from './src/context/AppContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          
          {/* Splash Screen em primeiro plano absoluto */}
          {showSplash && (
            <View style={StyleSheet.absoluteFillObject} pointerEvents="auto">
              <SplashScreen onFinish={() => setShowSplash(false)} />
            </View>
          )}

          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>

          {!showSplash && <StatusBar style="auto" />}
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});