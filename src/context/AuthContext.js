import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const AuthContext = createContext();

const AUTH_STORAGE_KEY = '@checkfinances_auth';
const USER_STORAGE_KEY = '@checkfinances_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hashPassword = async (password, salt) => {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + salt
    );
    return digest;
  };

  const register = useCallback(async (username, password, displayName) => {
    try {
      const existingUsers = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      const users = existingUsers ? JSON.parse(existingUsers) : {};

      if (users[username]) {
        return { success: false, error: 'Usuário já existe' };
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const salt = Math.random().toString(36).substr(2, 16);
      const passwordHash = await hashPassword(password, salt);

      const newUser = {
        id: userId,
        username,
        displayName: displayName || username,
        passwordHash,
        salt,
        createdAt: Date.now(),
      };

      users[username] = newUser;
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));

      const sessionUser = { ...newUser };
      delete sessionUser.passwordHash;
      delete sessionUser.salt;

      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      setIsAuthenticated(true);

      return { success: true, user: sessionUser };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, error: 'Erro ao criar conta' };
    }
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const existingUsers = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      const users = existingUsers ? JSON.parse(existingUsers) : {};

      const storedUser = users[username];
      if (!storedUser) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      const passwordHash = await hashPassword(password, storedUser.salt);
      if (passwordHash !== storedUser.passwordHash) {
        return { success: false, error: 'Senha incorreta' };
      }

      const sessionUser = { ...storedUser };
      delete sessionUser.passwordHash;
      delete sessionUser.salt;

      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      setIsAuthenticated(true);

      return { success: true, user: sessionUser };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro ao fazer login' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem('@checkfinances_active_group');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    try {
      const updatedUser = { ...user, ...updates, updatedAt: Date.now() };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    register,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
