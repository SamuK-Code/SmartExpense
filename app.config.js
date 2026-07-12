// app.config.js — Configuração corrigida para Expo SDK 57
// REMOVIDO: expo-widgets (sem código nativo), expo-quick-actions
// CORRIGIDO: assetBundlePatterns mais específico

import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    name: 'SmartExpense',
    slug: 'smartexpense',
    version: '3.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',

    // ✅ CORRIGIDO: assetBundlePatterns específico
    assetBundlePatterns: [
      'assets/**/*',
      'src/assets/**/*',
    ],

    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.samuk.smartexpense',
      deploymentTarget: '16.4',
    },

    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#8B5CF6',
      },
      package: 'com.samuk.smartexpense',
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
        'android.permission.CAMERA',
        // ✅ REMOVIDO: permissões de storage obsoletas no Android 13+
        // Usar expo-file-system ou expo-media-library no lugar
      ],
    },

    plugins: [
      'expo-audio',
      'expo-sharing',
      [
        'expo-splash-screen',
        {
          image: './assets/splash.png',
          resizeMode: 'contain',
          backgroundColor: '#8B5CF6',
        },
      ],
      'expo-status-bar',
      [
        'expo-build-properties',
        {
          android: {
            // ✅ REMOVIDO: extraProguardRules (só necessário com New Architecture)
          },
        },
      ],
      'expo-asset',
      'expo-secure-store',
      'expo-local-authentication',
      [
        'expo-camera',
        {
          cameraPermission: 'Permitir que o SmartExpense acesse sua câmera para escanear comprovantes.',
          microphonePermission: 'Permitir que o SmartExpense acesse o microfone para gravações.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Permitir que o SmartExpense acesse suas fotos para escanear comprovantes.',
          cameraPermission: 'Permitir que o SmartExpense acesse sua câmera para tirar fotos.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification_icon.png',
          color: '#8B5CF6',
          sounds: ['./assets/notification_sound.mp3'],
        },
      ],
      // ✅ REMOVIDO: expo-widgets (sem implementação nativa)
      // ✅ REMOVIDO: expo-quick-actions (sem configuração completa)
    ],

    extra: {
      eas: {
        projectId: '47ff95c8-9aa9-4d0b-b858-850490d6e14b',
      },
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
      GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY || '',
    },

    owner: 'samuka48',
  };
};