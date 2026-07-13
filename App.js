import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import { useQuickActions, navigationRef } from './src/config/QuickActionsConfig';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { UserProvider } from './src/context/UserContext';
import { AppProvider } from './src/context/AppContext';
import { CircleProvider } from './src/context/CircleContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/components/SplashScreen';
import LockScreen from './src/components/LockScreen';
import { useApp } from './src/context/AppContext';

// Configuração de notificações (só em development builds, não no Expo Go)
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.log('[Notifications] expo-notifications não disponível');
}

// Configuração global de notificações (só se não for Expo Go)
const isExpoGo = Constants.appOwnership === 'expo';

if (Notifications && !isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function AppContent() {
  const { darkMode } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const { securitySettings, isLocked, unlockApp, lockApp, enableDevMode } = useApp();
  const [appStateVisible, setAppStateVisible] = useState('active');

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Quick Actions (atalhos no ícone) - agora seguro fora do NavigationContainer
  useQuickActions();

  // Solicita permissão de notificações na inicialização (só em development builds)
  useEffect(() => {
    if (isExpoGo || !Notifications) return;

    const requestNotificationPermission = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permission not granted');
        }
      } catch (e) {
        console.log('[Notifications] Erro ao solicitar permissão:', e.message);
      }
    };
    requestNotificationPermission();
  }, []);

  // Listener de notificações (deep link quando tocar na notificação)
  useEffect(() => {
    if (isExpoGo || !Notifications) return;

    try {
      const subscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;
          if (data?.screen && navigationRef.isReady()) {
            navigationRef.navigate(data.screen);
          }
        }
      );
      return () => subscription.remove();
    } catch (e) {
      console.log('[Notifications] Erro no listener:', e.message);
      return () => {};
    }
  }, []);

  // Bloquear app ao voltar do background
  useEffect(() => {
    if (showSplash) return;
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appStateVisible === 'background' && nextAppState === 'active') {
        if (securitySettings?.lockOnBackground && securitySettings?.pinEnabled) {
          lockApp();
        }
      }
      setAppStateVisible(nextAppState);
    });
    return () => subscription.remove();
  }, [appStateVisible, showSplash, securitySettings, lockApp]);

  const navigationTheme = darkMode
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: '#0F172A', card: '#1E293B', text: '#F1F5F9', border: '#334155' } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#F8FAFC', card: '#FFFFFF', text: '#0F172A', border: '#E2E8F0' } };

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      {isLocked && <LockScreen onUnlock={unlockApp} onDevMode={enableDevMode} />}
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <StatusBar style={darkMode ? 'light' : 'dark'} />
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </NavigationContainer>
    </>
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