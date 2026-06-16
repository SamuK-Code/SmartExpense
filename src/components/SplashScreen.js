import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => onFinish && onFinish());
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoContainer}>
          <Ionicons name="wallet" size={64} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Finanças Pro</Text>
        <View style={styles.loader}>
          <Animated.View style={[styles.loaderBar, { width: progressWidth }]} />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 32,
  },
  loader: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loaderBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
});

export default SplashScreen;
