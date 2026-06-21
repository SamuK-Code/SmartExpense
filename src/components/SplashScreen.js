import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(40)).current;

  // Animações de opacidade para cada esquema de cor (perfeitas para Native Driver)
  const opacityScheme1 = useRef(new Animated.Value(1)).current;
  const opacityScheme2 = useRef(new Animated.Value(0)).current;
  const opacityScheme3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setHidden(true);

    // Animações de entrada do conteúdo
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Loop do degradê móvel via transição de opacidade (Cross-fade)
    const startGradientAnimation = () => {
      Animated.loop(
        Animated.sequence([
          // Transição para o Esquema 2
          Animated.parallel([
            Animated.timing(opacityScheme1, { toValue: 0, duration: 2500, useNativeDriver: true }),
            Animated.timing(opacityScheme2, { toValue: 1, duration: 2500, useNativeDriver: true }),
          ]),
          // Transição para o Esquema 3
          Animated.parallel([
            Animated.timing(opacityScheme2, { toValue: 0, duration: 2500, useNativeDriver: true }),
            Animated.timing(opacityScheme3, { toValue: 1, duration: 2500, useNativeDriver: true }),
          ]),
          // Voltar para o Esquema 1
          Animated.parallel([
            Animated.timing(opacityScheme3, { toValue: 0, duration: 2500, useNativeDriver: true }),
            Animated.timing(opacityScheme1, { toValue: 1, duration: 2500, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };

    startGradientAnimation();

    // Barra de progresso
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: false, // Necessário false pois anima 'width' em %
    }).start();

    // Fade out de saída da tela inteira
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }).start(() => {
        StatusBar.setHidden(false);
        if (onFinish) onFinish();
      });
    }, 2600);

    return () => {
      StatusBar.setHidden(false);
      clearTimeout(timer);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      
      {/* Camada do Esquema 1 (Roxo) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityScheme1 }]}>
        <LinearGradient colors={['#7C3AED', '#C4B5FD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient} />
      </Animated.View>

      {/* Camada do Esquema 2 (Azul) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityScheme2 }]}>
        <LinearGradient colors={['#2563EB', '#7DD3FC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient} />
      </Animated.View>

      {/* Camada do Esquema 3 (Verde) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityScheme3 }]}>
        <LinearGradient colors={['#10B981', '#6EE7B7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient} />
      </Animated.View>

      {/* Conteúdo Centralizado */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <Ionicons name="wallet" size={90} color="#FFFFFF" />
          </Animated.View>
        </View>

        <Text style={styles.title}>SmartExpense</Text>
        <Text style={styles.subtitle}>Controle financeiro inteligente</Text>

        <View style={styles.loader}>
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
    position: 'absolute', // Garante que fique acima dos backgrounds absolutados
  },
  logoContainer: {
    marginBottom: 24,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
    marginBottom: 36,
    fontWeight: '500',
  },
  loader: {
    width: 160,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loaderBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  version: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default SplashScreen;