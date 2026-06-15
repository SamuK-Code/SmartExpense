import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

const STORAGE_KEY = '@auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário salvo ao iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('[Auth] Erro ao carregar usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Login simples (local)
  const login = useCallback(async (username, password) => {
    try {
      // Verifica se existe usuário cadastrado
      const savedUser = await AsyncStorage.getItem(STORAGE_KEY);
      if (!savedUser) {
        return { success: false, error: 'Usuário não encontrado. Crie uma conta primeiro.' };
      }

      const parsed = JSON.parse(savedUser);
      if (parsed.username !== username) {
        return { success: false, error: 'Usuário ou senha incorretos.' };
      }
      if (parsed.password !== password) {
        return { success: false, error: 'Usuário ou senha incorretos.' };
      }

      setUser(parsed);
      setIsAuthenticated(true);
      return { success: true, user: parsed };
    } catch (error) {
      console.error('[Auth] Erro no login:', error);
      return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
    }
  }, []);

  // Registro simples (local)
  const register = useCallback(async (username, password, displayName) => {
    try {
      // Verifica se usuário já existe
      const savedUser = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.username === username) {
          return { success: false, error: 'Este usuário já existe. Faça login.' };
        }
      }

      const newUser = {
        id: `user_${Date.now()}`,
        username,
        password, // ⚠️ Em produção, use hash!
        displayName: displayName || username,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('[Auth] Erro no registro:', error);
      return { success: false, error: 'Erro ao criar conta. Tente novamente.' };
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error('[Auth] Erro no logout:', error);
      return { success: false, error: 'Erro ao sair.' };
    }
  }, []);

  // Atualizar perfil
  const updateProfile = useCallback(async (updates) => {
    try {
      const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('[Auth] Erro ao atualizar perfil:', error);
      return { success: false, error: 'Erro ao atualizar perfil.' };
    }
  }, [user]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
