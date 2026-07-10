// ThemeContext.js — 3 Temas Customizáveis (Roxo, Azul, Verde)

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEMES = {
  purple: {
    key: 'purple',
    name: 'Roxo',
    nameEn: 'Purple',
    nameEs: 'Púrpura',
    primary: '#8B5CF6',
    primaryLight: '#A78BFA',
    primaryDark: '#7C3AED',
    gradientStart: '#7C3AED',
    gradientEnd: '#C4B5FD',
    accent: '#A78BFA',
    bgPrimary: '#F8F7FC',
    bgCard: '#FFFFFF',
    bgTertiary: '#F3F0FF',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    shadow: '#000000',
  },
  blue: {
    key: 'blue',
    name: 'Azul',
    nameEn: 'Blue',
    nameEs: 'Azul',
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    gradientStart: '#1D4ED8',
    gradientEnd: '#93C5FD',
    accent: '#60A5FA',
    bgPrimary: '#F0F5FF',
    bgCard: '#FFFFFF',
    bgTertiary: '#EBF2FF',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    shadow: '#000000',
  },
  green: {
    key: 'green',
    name: 'Verde',
    nameEn: 'Green',
    nameEs: 'Verde',
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    gradientStart: '#047857',
    gradientEnd: '#6EE7B7',
    accent: '#34D399',
    bgPrimary: '#F0FDF4',
    bgCard: '#FFFFFF',
    bgTertiary: '#ECFDF5',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    shadow: '#000000',
  },
  red: {
    key: 'red',
    name: 'Vermelho',
    nameEn: 'Red',
    nameEs: 'Rojo',
    primary: '#EF4444',
    primaryLight: '#F87171',
    primaryDark: '#DC2626',
    gradientStart: '#B91C1C',
    gradientEnd: '#FCA5A5',
    accent: '#F87171',
    bgPrimary: '#FEF2F2',
    bgCard: '#FFFFFF',
    bgTertiary: '#FEE2E2',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    shadow: '#000000',
  },
  orange: {
    key: 'orange',
    name: 'Laranja',
    nameEn: 'Orange',
    nameEs: 'Naranja',
    primary: '#F97316',
    primaryLight: '#FB923C',
    primaryDark: '#EA580C',
    gradientStart: '#C2410C',
    gradientEnd: '#FDBA74',
    accent: '#FB923C',
    bgPrimary: '#FFF7ED',
    bgCard: '#FFFFFF',
    bgTertiary: '#FFEDD5',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    shadow: '#000000',
  },
  pink: {
    key: 'pink',
    name: 'Rosa',
    nameEn: 'Pink',
    nameEs: 'Rosa',
    primary: '#EC4899',
    primaryLight: '#F472B6',
    primaryDark: '#DB2777',
    gradientStart: '#BE185D',
    gradientEnd: '#FBCFE8',
    accent: '#F472B6',
    bgPrimary: '#FDF2F8',
    bgCard: '#FFFFFF',
    bgTertiary: '#FCE7F3',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    shadow: '#000000',
  },
  teal: {
    key: 'teal',
    name: 'Turquesa',
    nameEn: 'Teal',
    nameEs: 'Turquesa',
    primary: '#14B8A6',
    primaryLight: '#2DD4BF',
    primaryDark: '#0D9488',
    gradientStart: '#0F766E',
    gradientEnd: '#99F6E4',
    accent: '#2DD4BF',
    bgPrimary: '#F0FDFA',
    bgCard: '#FFFFFF',
    bgTertiary: '#CCFBF1',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    shadow: '#000000',
  },
  indigo: {
    key: 'indigo',
    name: 'Índigo',
    nameEn: 'Indigo',
    nameEs: 'Índigo',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    gradientStart: '#4338CA',
    gradientEnd: '#A5B4FC',
    accent: '#818CF8',
    bgPrimary: '#EEF2FF',
    bgCard: '#FFFFFF',
    bgTertiary: '#E0E7FF',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    shadow: '#000000',
  },
  slate: {
    key: 'slate',
    name: 'Grafite',
    nameEn: 'Graphite',
    nameEs: 'Grafito',
    primary: '#475569',
    primaryLight: '#64748B',
    primaryDark: '#334155',
    gradientStart: '#1E293B',
    gradientEnd: '#94A3B8',
    accent: '#64748B',
    bgPrimary: '#F8FAFC',
    bgCard: '#FFFFFF',
    bgTertiary: '#F1F5F9',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    shadow: '#000000',
  },
  amber: {
    key: 'amber',
    name: 'Âmbar',
    nameEn: 'Amber',
    nameEs: 'Ámbar',
    primary: '#D97706',
    primaryLight: '#F59E0B',
    primaryDark: '#B45309',
    gradientStart: '#92400E',
    gradientEnd: '#FCD34D',
    accent: '#F59E0B',
    bgPrimary: '#FFFBEB',
    bgCard: '#FFFFFF',
    bgTertiary: '#FEF3C7',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#D97706',
    shadow: '#000000',
  },
};

const darkOverrides = {
  bgPrimary: '#0F0F1A',
  bgCard: '#1A1A2E',
  bgTertiary: '#252542',
  textPrimary: '#F3F4F6',
  textSecondary: '#D1D5DB',
  textMuted: '#6B7280',
  border: '#2D2D4A',
  shadow: '#000000',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeKey, setThemeKey] = useState('purple');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@smartexpense_theme');
        const savedDark = await AsyncStorage.getItem('@smartexpense_darkmode');
        if (savedTheme && THEMES[savedTheme]) setThemeKey(savedTheme);
        if (savedDark !== null) setDarkMode(savedDark === 'true');
      } catch (e) {
        console.warn('Erro ao carregar tema:', e);
      } finally {
        setLoading(false);
      }
    };
    loadTheme();
  }, []);

  const baseColors = THEMES[themeKey];
  const colors = darkMode
    ? { ...baseColors, ...darkOverrides, primary: baseColors.primary, primaryLight: baseColors.primaryLight, primaryDark: baseColors.primaryDark, gradientStart: baseColors.gradientStart, gradientEnd: baseColors.gradientEnd, accent: baseColors.accent }
    : baseColors;

  const toggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    try {
      await AsyncStorage.setItem('@smartexpense_darkmode', String(next));
    } catch (e) {}
  };

  const changeTheme = async (key) => {
    if (THEMES[key]) {
      setThemeKey(key);
      try {
        await AsyncStorage.setItem('@smartexpense_theme', key);
      } catch (e) {}
    }
  };

  return (
    <ThemeContext.Provider value={{ colors, darkMode, toggleDarkMode, themeKey, changeTheme, THEMES, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};