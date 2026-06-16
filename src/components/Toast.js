import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const Toast = ({ message, type = 'success', visible, onHide }) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onHide && onHide());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const iconName = type === 'error' ? 'alert-circle' : type === 'warning' ? 'warning' : 'checkmark-circle';
  const iconColor = type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#10B981';

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Ionicons name={iconName} size={20} color={iconColor} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 2000,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    flex: 1,
  },
});

export default Toast;
