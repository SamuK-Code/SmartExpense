import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';

export default function AlertPopup({ visible, alert, onDismiss }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (!alert) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'danger': return 'warning-outline';
      case 'warning': return 'alert-circle-outline';
      case 'success': return 'checkmark-circle-outline';
      case 'info': return 'information-circle-outline';
      default: return 'information-circle-outline';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'danger': return colors.danger;
      case 'warning': return colors.warning;
      case 'success': return colors.success;
      case 'info': return colors.info;
      default: return colors.info;
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.popup, { backgroundColor: colors.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: getColor(alert.type) + '20' }]}>
            <Ionicons name={getIcon(alert.type)} size={32} color={getColor(alert.type)} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{alert.title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{alert.message}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: getColor(alert.type) }]}
            onPress={onDismiss}
          >
            <Text style={styles.buttonText}>{t('understood')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});