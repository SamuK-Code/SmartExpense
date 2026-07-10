// UserContext.js — Perfil do Usuário (nome + foto) — CORRIGIDO

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState({
    name: 'Usuário',
    email: 'usuario@email.com',
    avatar: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const saved = await AsyncStorage.getItem('user_profile');
      if (saved) {
        setUserProfile(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Erro ao carregar perfil:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (profile) => {
    const updated = { ...userProfile, ...profile };
    setUserProfile(updated);
    try {
      await AsyncStorage.setItem('user_profile', JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar perfil:', e);
    }
  };

  const updateName = (name) => saveProfile({ name });
  const updateAvatar = (avatar) => saveProfile({ avatar });
  const clearAvatar = () => saveProfile({ avatar: null });

  if (isLoading) return null;

  return (
    <UserContext.Provider value={{ userProfile, updateName, updateAvatar, clearAvatar }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);