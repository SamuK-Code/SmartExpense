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

const lightColors = {
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  secondary: '#6366F1',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  bgPrimary: '#F8FAFC',
  bgSecondary: '#FFFFFF',
  bgTertiary: '#F1F5F9',
  bgCard: '#FFFFFF',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  gradientPrimary: ['#8B5CF6', '#6366F1'],
  shadow: 'rgba(0,0,0,0.1)',
};

const darkColors = {
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  secondary: '#6366F1',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  bgPrimary: '#0F172A',
  bgSecondary: '#1E293B',
  bgTertiary: '#334155',
  bgCard: '#1E293B',
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  border: '#334155',
  borderLight: '#1E293B',
  gradientPrimary: ['#8B5CF6', '#6366F1'],
  shadow: 'rgba(0,0,0,0.4)',
};
