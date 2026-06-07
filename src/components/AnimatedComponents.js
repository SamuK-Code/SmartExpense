import React, { useEffect } from 'react';
import { Animated, Easing } from 'react-native';

export function FadeInView({ children, duration = 500, delay = 0, style }) {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      {children}
    </Animated.View>
  );
}

export function SlideInView({ children, duration = 500, delay = 0, from = 'bottom', style }) {
  const translateY = new Animated.Value(from === 'bottom' ? 50 : -50);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function ScaleInView({ children, duration = 400, delay = 0, style }) {
  const scaleAnim = new Animated.Value(0.8);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function StaggeredList({ children, staggerDelay = 100, baseDelay = 0 }) {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <SlideInView delay={baseDelay + index * staggerDelay} duration={400}>
          {child}
        </SlideInView>
      ))}
    </>
  );
}

export function PulseView({ children, style }) {
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ scale: pulseAnim }] }, style]}>
      {children}
    </Animated.View>
  );
}
