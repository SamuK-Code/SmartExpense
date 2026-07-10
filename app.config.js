// app.config.js — Configuração completa do Expo (SDK 56)
// Substitui o app.json — inclui TODOS os plugins do projeto original
// Variáveis de ambiente: .env (local) → eas.json (preview) → EAS Secrets (production)

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
    assetBundlePatterns: ['**/*'],

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
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
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
            extraProguardRules: '-keep class com.facebook.react.turbomodule.** { *; }',
          },
        },
      ],
      'expo-asset',
      'expo-secure-store',
      'expo-quick-actions',
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
        'expo-widgets',
        {
          widgets: [
            {
              name: 'FinanceWidget',
              description: 'Resumo financeiro do SmartExpense',
              widgetFamily: ['systemSmall', 'systemMedium', 'systemLarge'],
            },
          ],
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#8B5CF6',
          sounds: ['./assets/notification-sound.wav'],
        },
      ],
    ],

    extra: {
      // EAS Project ID (necessário para builds)
      eas: {
        projectId: '47ff95c8-9aa9-4d0b-b858-850490d6e14b',
      },
      // Variáveis de ambiente — preenchidas por .env, eas.json ou EAS Secrets
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
      GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY || '',
    },

    owner: 'samuka48',
  };
};