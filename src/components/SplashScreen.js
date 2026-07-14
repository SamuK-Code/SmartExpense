import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import Svg, { Circle } from 'react-native-svg';
import Constants from 'expo-constants';
import { useTheme } from '../context/ThemeContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');
const CIRCLE_RADIUS = 42;
const CIRCLE_STROKE = 5;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SplashScreen = ({ onFinish }) => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(true);

  const bgColor = colors?.primary || '#8B5CF6';
  const trackColor = 'rgba(255,255,255,0.15)';
  const indicatorColor = '#FFFFFF';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const appVersion = useMemo(() => {
    return (
      Constants.expoConfig?.version ||
      Constants.expoConfig?.android?.versionCode ||
      Constants.nativeAppVersion ||
      '3.0.0'
    );
  }, []);

  useEffect(() => {
    StatusBar.setHidden(true);

    // Entrada suave
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Progresso do anel
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2600,
      useNativeDriver: true,
    }).start();

    // Rotação contínua
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      })
    ).start();

    // Pulso sutil no logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade out e finalização
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Notifica o app que pode renderizar
        if (onFinish) onFinish();

        // Só desmonta o Modal após dar tempo do app por baixo renderizar
        // evitando o flash branco
        setTimeout(() => {
          StatusBar.setHidden(false);
          setVisible(false);
        }, 150);
      });
    }, 3000);

    return () => {
      StatusBar.setHidden(false);
      clearTimeout(timer);
    };
  }, []);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCLE_CIRCUMFERENCE, 0],
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => {}}
    >
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, backgroundColor: bgColor },
        ]}
      >
        {/* Padrão de fundo sutil */}
        <View style={styles.bgPattern} pointerEvents="none">
          <View
            style={[
              styles.bgCircle,
              {
                backgroundColor: 'rgba(255,255,255,0.04)',
                top: -80,
                right: -60,
                width: 280,
                height: 280,
              },
            ]}
          />
          <View
            style={[
              styles.bgCircle,
              {
                backgroundColor: 'rgba(255,255,255,0.03)',
                bottom: -40,
                left: -80,
                width: 220,
                height: 220,
              },
            ]}
          />
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: contentTranslateY },
              ],
            },
          ]}
        >
          {/* Logo — sombra bem sutil */}
          <Animated.View
            style={[
              styles.logoContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Ionicons name="wallet-outline" size={72} color="#FFFFFF" />
          </Animated.View>

          <Text style={styles.title}>SmartExpense</Text>
          <Text style={styles.subtitle}>Controle financeiro inteligente</Text>

          {/* Progress Ring estilo Windows */}
          <View style={styles.ringContainer}>
            <Animated.View
              style={{ transform: [{ rotate: rotateInterpolate }] }}
            >
              <Svg
                width={CIRCLE_RADIUS * 2 + CIRCLE_STROKE * 2}
                height={CIRCLE_RADIUS * 2 + CIRCLE_STROKE * 2}
                viewBox={`0 0 ${(CIRCLE_RADIUS + CIRCLE_STROKE) * 2} ${(CIRCLE_RADIUS + CIRCLE_STROKE) * 2}`}
              >
                <Circle
                  cx={CIRCLE_RADIUS + CIRCLE_STROKE}
                  cy={CIRCLE_RADIUS + CIRCLE_STROKE}
                  r={CIRCLE_RADIUS}
                  fill="none"
                  stroke={trackColor}
                  strokeWidth={CIRCLE_STROKE}
                  strokeLinecap="round"
                />
                <AnimatedCircle
                  cx={CIRCLE_RADIUS + CIRCLE_STROKE}
                  cy={CIRCLE_RADIUS + CIRCLE_STROKE}
                  r={CIRCLE_RADIUS}
                  fill="none"
                  stroke={indicatorColor}
                  strokeWidth={CIRCLE_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={CIRCLE_CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  rotation={-90}
                  originX={CIRCLE_RADIUS + CIRCLE_STROKE}
                  originY={CIRCLE_RADIUS + CIRCLE_STROKE}
                />
              </Svg>
            </Animated.View>
          </View>

          <Text style={styles.version}>v{appVersion}</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SCREEN_WIDTH,
  },
  logoContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    // Sombra bem sutil
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.4,
    marginBottom: 40,
    fontWeight: '500',
  },
  ringContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  version: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

export default SplashScreen;