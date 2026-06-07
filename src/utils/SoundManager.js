import { Audio } from 'expo-av';

let sounds = {};
let isInitialized = false;
let soundEnabled = true;

// Sound URLs (using simple beep tones)
const SOUND_URLS = {
  success: 'https://www.soundjay.com/buttons/sounds/button-09.mp3',
  delete: 'https://www.soundjay.com/buttons/sounds/button-10.mp3',
  warning: 'https://www.soundjay.com/buttons/sounds/button-2.mp3',
  click: 'https://www.soundjay.com/buttons/sounds/button-16.mp3',
  error: 'https://www.soundjay.com/buttons/sounds/button-8.mp3',
};

// Initialize sounds
export const initSounds = async () => {
  if (isInitialized) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    isInitialized = true;
  } catch (error) {
    console.error('Error initializing sounds:', error);
  }
};

// Play sound
export const playSound = async (type) => {
  if (!soundEnabled) return;

  try {
    await initSounds();

    const { sound } = await Audio.Sound.createAsync(
      { uri: SOUND_URLS[type] || SOUND_URLS.click },
      { shouldPlay: true, volume: 0.5 }
    );

    // Auto-unload after playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error(`Error playing sound ${type}:`, error);
  }
};

// Toggle sound
export const toggleSound = (enabled) => {
  soundEnabled = enabled;
};

// Get sound status
export const isSoundEnabled = () => soundEnabled;

// Predefined sounds
export const playSuccess = () => playSound('success');
export const playDelete = () => playSound('delete');
export const playWarning = () => playSound('warning');
export const playClick = () => playSound('click');
export const playError = () => playSound('error');
