import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const lightColors = {
  background: '#f5f6fa',
  card: '#ffffff',
  header: '#1a237e',
  headerText: '#ffffff',
  primary: '#4CAF50',
  secondary: '#FF9800',
  danger: '#e74c3c',
  text: '#2c3e50',
  textSecondary: '#5a6c7d',
  textLight: '#95a5a6',
  border: '#d5d8dc',
  tabInactive: '#7f8c8d',
  inputBg: '#ffffff',
  chartBg: '#ffffff',
  overlay: 'rgba(0,0,0,0.5)',
  success: '#2ecc71',
  warning: '#f39c12',
  info: '#3498db',
};

export const darkColors = {
  background: '#0d1117',
  card: '#161b22',
  header: '#0d1642',
  headerText: '#ffffff',
  primary: '#66bb6a',
  secondary: '#ffb74d',
  danger: '#ef5350',
  text: '#e6edf3',
  textSecondary: '#8b949e',
  textLight: '#484f58',
  border: '#30363d',
  tabInactive: '#6e7681',
  inputBg: '#21262d',
  chartBg: '#161b22',
  overlay: 'rgba(0,0,0,0.7)',
  success: '#4caf50',
  warning: '#ff9800',
  info: '#2196f3',
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('@darkMode');
      if (saved !== null) {
        setIsDark(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newValue = !isDark;
    setIsDark(newValue);
    try {
      await AsyncStorage.setItem('@darkMode', JSON.stringify(newValue));
    } catch (e) {
      console.error(e);
    }
  };

  const colors = isDark ? darkColors : lightColors;

  if (loading) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be inside ThemeProvider');
  return context;
}
