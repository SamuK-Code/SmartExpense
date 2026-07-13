import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    name: 'SmartExpense',
    slug: 'smartexpense',
    version: '3.5.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',

    // ✅ assetBundlePatterns otimizado
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
      ],
    },

    plugins: [
      'expo-audio',
      'expo-sharing',
      'expo-status-bar',
      'expo-asset',
      'expo-secure-store',
      'expo-local-authentication',
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