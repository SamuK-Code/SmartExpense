// SplashScreen.js — Otimizado: Easing suave, menos re-renders, transições fluidas
// ✨ REFINAMENTOS: Easing nativo, cleanup robusto, animação sequencial suave
// 🔧 CORREÇÃO: rotate usa radianos para native driver, gradiente único com animação de cores

import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Gradientes para animação cross-fade (índices 0→1→2→0)
const gradientSchemes = [
  ['#A78BFA', '#7C3AED', '#EC4899'],  // purple
  ['#1D4ED8', '#0D9488', '#BEF264'],  // blue
  ['#047857', '#10B981', '#F59E0B'],  // green
];

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const gradientIndex = useRef(new Animated.Value(0)).current;

  const timerRef = useRef(null);
  const animationsRef = useRef([]);

  const cleanup = useCallback(() => {
    animationsRef.current.forEach(anim => anim?.stop?.());
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      StatusBar.setHidden(false);
    } catch (e) {
      // ignorar
    }
  }, []);

  useEffect(() => {
    try {
      StatusBar.setHidden(true);
    } catch (e) {
      // ignorar em Expo Go
    }

    // Animação de entrada do conteúdo
    const contentAnim = Animated.timing(contentTranslateY, {
      toValue: 0,
      duration: 800,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animationsRef.current.push(contentAnim);
    contentAnim.start();

    // Animação de escala do logo
    const logoAnim = Animated.timing(logoScale, {
      toValue: 1,
      duration: 600,
      delay: 100,
      easing: Easing.out(Easing.back(1.7)),
      useNativeDriver: true,
    });
    animationsRef.current.push(logoAnim);
    logoAnim.start();

    // Animação de rotação sutil do logo — RADIANOS para native driver!
    const rotateAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animationsRef.current.push(rotateAnim);
    rotateAnim.start();

    // Animação cross-fade dos gradientes (índice 0→1→2→0)
    const gradientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientIndex, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false, // interpolação de índice não usa native
        }),
        Animated.timing(gradientIndex, {
          toValue: 2,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(gradientIndex, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );
    animationsRef.current.push(gradientLoop);
    gradientLoop.start();

    // Animação da Barra de Progresso
    const progressAnimation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    animationsRef.current.push(progressAnimation);
    progressAnimation.start();

    // Fade out de saída da tela
    timerRef.current = setTimeout(() => {
      const fadeOut = Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      });
      animationsRef.current.push(fadeOut);
      fadeOut.start(() => {
        cleanup();
        if (onFinish) onFinish();
      });
    }, 2800);

    return cleanup;
  }, [onFinish, cleanup]);

  // Interpolação para a barra de progresso
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Interpolação para rotação — RADIANOS! (3° = ~0.052 rad)
  const rotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-0.052rad', '0.052rad'],
  });

  // Interpolação para cores do gradiente (cross-fade via índice)
  const color1 = gradientIndex.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      gradientSchemes[0][0], gradientSchemes[1][0], gradientSchemes[2][0], gradientSchemes[0][0]
    ],
  });
  const color2 = gradientIndex.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      gradientSchemes[0][1], gradientSchemes[1][1], gradientSchemes[2][1], gradientSchemes[0][1]
    ],
  });
  const color3 = gradientIndex.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      gradientSchemes[0][2], gradientSchemes[1][2], gradientSchemes[2][2], gradientSchemes[0][2]
    ],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Gradiente único com cores animadas (mais leve que 3 sobrepostos) */}
      <Animated.View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[color1.__getValue ? color1.__getValue() : gradientSchemes[0][0], 
                   color2.__getValue ? color2.__getValue() : gradientSchemes[0][1], 
                   color3.__getValue ? color3.__getValue() : gradientSchemes[0][2]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[
        styles.content,
        {
          transform: [{ translateY: contentTranslateY }],
        }
      ]}>
        <Animated.View style={[
          styles.logoContainer,
          {
            transform: [
              { scale: logoScale },
              { rotate: rotateInterpolate },
            ]
          }
        ]}>
          <Ionicons name="wallet-outline" size={100} color="#FFFFFF" />
        </Animated.View>

        <Text style={styles.title}>SmartExpense</Text>
        <Text style={styles.subtitle}>Controle financeiro inteligente</Text>

        {/* Barra de Progresso */}
        <View style={styles.loaderContainer}>
          <Animated.View style={[styles.loaderBar, { width: progressWidth }]} />
        </View>

        <Text style={styles.version}>v3.0</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 99999,
    elevation: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SCREEN_WIDTH,
    position: 'absolute',
  },
  logoContainer: {
    marginBottom: 30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.6,
    marginBottom: 48,
    fontWeight: '500',
  },
  loaderContainer: {
    width: 220,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  loaderBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  version: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    letterSpacing: 1.2,
  },
});

export default SplashScreen;