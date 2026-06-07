import * as Haptics from 'expo-haptics';

let soundEnabled = true;

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

// Toggle sound/vibration
export const toggleSound = (enabled) => {
  soundEnabled = enabled;
};

// Get sound status
export const isSoundEnabled = () => soundEnabled;

// Predefined feedback functions
export const playSuccess = () => playHaptic('success');
export const playDelete = () => playHaptic('delete');
export const playWarning = () => playHaptic('warning');
export const playClick = () => playHaptic('click');
export const playError = () => playHaptic('error');

// Main play function (alias for compatibility)
export const playFeedback = (type) => playHaptic(type);
