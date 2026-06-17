import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('darkMode');
      if (saved !== null) {
        setDarkMode(JSON.parse(saved));
      } else {
        setDarkMode(systemTheme === 'dark');
      }
    } catch (e) {
      console.warn('Erro ao carregar tema:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    try {
      await AsyncStorage.setItem('darkMode', JSON.stringify(newValue));
    } catch (e) {
      console.warn('Erro ao salvar tema:', e);
    }
  };

  const colors = darkMode ? darkColors : lightColors;

  if (isLoading) return null;

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

// ═══════════════════════════════════════════════════════════
// 🌞 MODO CLARO — Paleta vibrante, limpa e moderna
// ═══════════════════════════════════════════════════════════
const lightColors = {
  // Primárias
  primary: '#7C3AED',           // Roxo vibrante
  primaryLight: '#A78BFA',      // Roxo claro
  primaryDark: '#5B21B6',       // Roxo profundo
  primaryMuted: '#EDE9FE',      // Roxo muito suave (fundo de chips)

  // Secundárias
  secondary: '#0EA5E9',         // Azul ciano
  secondaryLight: '#7DD3FC',
  secondaryMuted: '#E0F2FE',

  // Estados
  success: '#059669',           // Verde esmeralda
  successLight: '#6EE7B7',
  successMuted: '#D1FAE5',

  danger: '#DC2626',            // Vermelho coral
  dangerLight: '#FCA5A5',
  dangerMuted: '#FEE2E2',

  warning: '#D97706',           // Âmbar/dourado
  warningLight: '#FCD34D',
  warningMuted: '#FEF3C7',

  info: '#2563EB',              // Azul royal
  infoLight: '#93C5FD',
  infoMuted: '#DBEAFE',

  // Backgrounds
  bgPrimary: '#F8FAFC',         // Quase branco, levemente azulado
  bgSecondary: '#FFFFFF',       // Branco puro
  bgTertiary: '#F1F5F9',        // Cinza muito claro
  bgCard: '#FFFFFF',            // Cards brancos
  bgElevated: '#FFFFFF',        // Elementos elevados

  // Textos
  textPrimary: '#0F172A',       // Quase preto
  textSecondary: '#475569',     // Cinza escuro
  textMuted: '#94A3B8',         // Cinza médio
  textInverse: '#FFFFFF',       // Branco
  textPlaceholder: '#CBD5E1',   // Placeholder

  // Bordas
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#7C3AED',

  // Gradientes
  gradientPrimary: ['#7C3AED', '#6366F1'],
  gradientSuccess: ['#059669', '#10B981'],
  gradientDanger: ['#DC2626', '#EF4444'],
  gradientWarning: ['#D97706', '#F59E0B'],

  // Sombras
  shadow: 'rgba(15, 23, 42, 0.08)',
  shadowStrong: 'rgba(15, 23, 42, 0.15)',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.5)',
};

// ═══════════════════════════════════════════════════════════
// 🌙 MODO ESCURO — Paleta neon, profunda e imersiva
// ═══════════════════════════════════════════════════════════
const darkColors = {
  // Primárias — azul elétrico no lugar do roxo
  primary: '#818CF8',           // Índigo neon
  primaryLight: '#A5B4FC',      // Índigo claro
  primaryDark: '#4F46E5',       // Índigo profundo
  primaryMuted: '#312E81',      // Índigo muito escuro (fundo de chips)

  // Secundárias
  secondary: '#22D3EE',         // Ciano neon
  secondaryLight: '#67E8F9',
  secondaryMuted: '#164E63',

  // Estados — tons neon para destacar no escuro
  success: '#34D399',           // Verde neon
  successLight: '#6EE7B7',
  successMuted: '#064E3B',

  danger: '#FB7185',            // Rosa/vermelho neon
  dangerLight: '#FDA4AF',
  dangerMuted: '#881337',

  warning: '#FBBF24',           // Amarelo neon
  warningLight: '#FDE68A',
  warningMuted: '#78350F',

  info: '#60A5FA',              // Azul neon
  infoLight: '#93C5FD',
  infoMuted: '#1E3A8A',

  // Backgrounds — azul-acinzentado profundo
  bgPrimary: '#0B1120',         // Azul muito escuro
  bgSecondary: '#151E32',         // Azul escuro
  bgTertiary: '#1E293B',        // Azul acinzentado
  bgCard: '#1A2332',            // Cards com leve elevação
  bgElevated: '#243447',        // Elementos elevados

  // Textos
  textPrimary: '#F8FAFC',         // Quase branco
  textSecondary: '#CBD5E1',       // Cinza claro
  textMuted: '#64748B',           // Cinza médio-escuro
  textInverse: '#0F172A',         // Preto
  textPlaceholder: '#475569',     // Placeholder

  // Bordas
  border: '#334155',
  borderLight: '#1E293B',
  borderFocus: '#818CF8',

  // Gradientes — tons mais saturados para o escuro
  gradientPrimary: ['#818CF8', '#6366F1'],
  gradientSuccess: ['#34D399', '#10B981'],
  gradientDanger: ['#FB7185', '#EF4444'],
  gradientWarning: ['#FBBF24', '#F59E0B'],

  // Sombras — mais sutis no escuro
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowStrong: 'rgba(0, 0, 0, 0.5)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
};