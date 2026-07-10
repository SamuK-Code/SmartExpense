import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Definição de cores vibrantes (Aurora/Neon)
const gradientSchemes = {
  purple: ['#A78BFA', '#7C3AED', '#EC4899'],
  blue: ['#1D4ED8', '#0D9488', '#BEF264'],
  green: ['#047857', '#10B981', '#F59E0B'],
};

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current; // Trocado para progressAnim
  const contentTranslateY = useRef(new Animated.Value(40)).current;

  // Animações de opacidade para o cross-fade
  const opacityScheme1 = useRef(new Animated.Value(1)).current;
  const opacityScheme2 = useRef(new Animated.Value(0)).current;
  const opacityScheme3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setHidden(true);

    Animated.timing(contentTranslateY, {
      toValue: 0,
      duration: 1000,
      delay: 200,
      useNativeDriver: true,
    }).start();

    const startGradientAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(opacityScheme1, { toValue: 0, duration: 3000, useNativeDriver: true }),
            Animated.timing(opacityScheme2, { toValue: 1, duration: 3000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(opacityScheme2, { toValue: 0, duration: 3000, useNativeDriver: true }),
            Animated.timing(opacityScheme3, { toValue: 1, duration: 3000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(opacityScheme3, { toValue: 0, duration: 3000, useNativeDriver: true }),
            Animated.timing(opacityScheme1, { toValue: 1, duration: 3000, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };

    startGradientAnimation();

    // Animação da Barra de Progresso (deve ser false para animar 'width')
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false, 
    }).start();

    // Fade out de saída da tela
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        StatusBar.setHidden(false);
        if (onFinish) onFinish();
      });
    }, 2800);

    return () => {
      StatusBar.setHidden(false);
      clearTimeout(timer);
    };
  }, []);

  // Interpolação para a barra de progresso linear
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityScheme1 }]}>
        <LinearGradient colors={gradientSchemes.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient} />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityScheme2 }]}>
        <LinearGradient colors={gradientSchemes.blue} start={{ x: 0.1, y: 0.2 }} end={{ x: 0.9, y: 0.8 }} style={styles.gradient} />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityScheme3 }]}>
        <LinearGradient colors={gradientSchemes.green} start={{ x: 0.2, y: 0.1 }} end={{ x: 0.8, y: 0.9 }} style={styles.gradient} />
      </Animated.View>

      <Animated.View style={[styles.content, { transform: [{ translateY: contentTranslateY }] }]}>
        <View style={styles.logoContainer}>
          <Ionicons name="wallet-outline" size={100} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>SmartExpense</Text>
        <Text style={styles.subtitle}>Controle financeiro inteligente</Text>

        {/* Barra de Progresso Corrigida */}
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
  gradient: {
    flex: 1,
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
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
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
    alignItems: 'flex-start', // Garante que a barra preencha da esquerda para a direita
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