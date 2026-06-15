import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

let soundEnabled = true;

// Initialize sound system
const initSounds = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.log('Audio init failed:', error);
  }
};

initSounds();

// Play haptic feedback (vibration)
const playHaptic = async (type) => {
  if (!soundEnabled) return;

  try {
    switch (type) {
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'click':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'delete':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    console.log('Haptic feedback failed:', error);
  }
};

// Play sound effect using system sounds
const playSound = async (type) => {
  if (!soundEnabled) return;

  try {
    const { sound } = await Audio.Sound.createAsync(
      getSoundSource(type),
      { shouldPlay: true, volume: 0.5 }
    );

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log('Sound playback failed:', error);
    // Fallback to haptic only
    playHaptic(type);
  }
};

// Get sound source based on type
const getSoundSource = (type) => {
  // Using default system sounds - in production, replace with custom sound files
  const soundMap = {
    'success': require('../../assets/sounds/success.mp3'),
    'error': require('../../assets/sounds/error.mp3'),
    'click': require('../../assets/sounds/click.mp3'),
    'delete': require('../../assets/sounds/delete.mp3'),
    'warning': require('../../assets/sounds/warning.mp3'),
  };

  return soundMap[type] || soundMap['click'];
};

// Toggle sound/vibration
export const toggleSound = (enabled) => {
  soundEnabled = enabled;
};

// Get sound status
export const isSoundEnabled = () => soundEnabled;

// Predefined feedback functions with both sound and haptic
export const playSuccess = () => {
  playSound('success');
  playHaptic('success');
};

export const playDelete = () => {
  playSound('delete');
  playHaptic('delete');
};

export const playWarning = () => {
  playSound('warning');
  playHaptic('warning');
};

export const playClick = () => {
  playSound('click');
  playHaptic('click');
};

export const playError = () => {
  playSound('error');
  playHaptic('error');
};

// Main play function (alias for compatibility)
export const playFeedback = (type) => {
  playSound(type);
  playHaptic(type);
};