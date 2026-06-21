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