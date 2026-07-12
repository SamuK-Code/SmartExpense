// app.config.js — MÍNIMO para teste
export default () => ({
  name: 'SmartExpense',
  slug: 'smartexpense',
  version: '3.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['assets/**/*'],
  ios: {
    bundleIdentifier: 'com.samuk.smartexpense',
  },
  android: {
    package: 'com.samuk.smartexpense',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#8B5CF6',
    },
  },
  plugins: [
    ['expo-splash-screen', {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#8B5CF6',
    }],
  ],
  extra: {
    eas: { projectId: '47ff95c8-9aa9-4d0b-b858-850490d6e14b' },
  },
  owner: 'samuka48',
});