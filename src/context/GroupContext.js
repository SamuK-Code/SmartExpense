import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import SupabaseService from '../services/SupabaseService';

const GroupContext = createContext();

const ACTIVE_GROUP_KEY = '@checkfinances_active_group';

export const GroupProvider = ({ children }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const syncListeners = useRef([]);

  // Carrega grupos ao logar
  useEffect(() => {
    if (user) {
      loadGroups();
    } else {
      setGroups([]);
      setActiveGroup(null);
      setIsLoading(false);
    }
  }, [user]);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const result = await SupabaseService.getUserGroups(user.id);
      setGroups(result);

      const activeId = await AsyncStorage.getItem(ACTIVE_GROUP_KEY);
      if (activeId) {
        const active = result.find(g => g.id === activeId);
        if (active) setActiveGroup(active);
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      // Fallback: tenta carregar do AsyncStorage
      const stored = await AsyncStorage.getItem('@checkfinances_groups_local');
      if (stored) {
        const localGroups = JSON.parse(stored);
        setGroups(localGroups);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createGroup = useCallback(async (groupData) => {
    try {
      const result = await SupabaseService.createGroup(
        groupData.name,
        groupData.description,
        user.id,
        user.username,
        user.displayName
      );

      if (result.success) {
        const newGroup = result.group;
        setGroups(prev => [...prev, newGroup]);
        setActiveGroup(newGroup);
        await AsyncStorage.setItem(ACTIVE_GROUP_KEY, newGroup.id);
        return { success: true, group: newGroup };
      }
      return result;
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      return { success: false, error: 'Erro ao criar grupo' };
    }
  }, [user]);

  const joinGroup = useCallback(async (inviteCode) => {
    try {
      const result = await SupabaseService.joinGroup(
        inviteCode,
        user.id,
        user.username,
        user.displayName
      );

      if (result.success) {
        const group = result.group;
        setGroups(prev => [...prev, group]);
        setActiveGroup(group);
        await AsyncStorage.setItem(ACTIVE_GROUP_KEY, group.id);
        return { success: true, group };
      }
      return result;
    } catch (error) {
      console.error('Erro ao entrar no grupo:', error);
      return { success: false, error: 'Erro ao entrar no grupo' };
    }
  }, [user]);

  const leaveGroup = useCallback(async (groupId) => {
    try {
      await SupabaseService.leaveGroup(groupId, user.id);

      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (activeGroup?.id === groupId) {
        setActiveGroup(null);
        await AsyncStorage.removeItem(ACTIVE_GROUP_KEY);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, activeGroup]);

  const selectActiveGroup = useCallback(async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setActiveGroup(group);
      await AsyncStorage.setItem(ACTIVE_GROUP_KEY, groupId);
    }
  }, [groups]);

  const updateGroupSettings = useCallback(async (groupId, settings) => {
    // Placeholder - pode ser implementado no Supabase depois
    return { success: true };
  }, []);

  // Sincronização: recebe dados de outro dispositivo
  const receiveSyncData = useCallback(async (syncPayload) => {
    try {
      setSyncStatus('syncing');

      syncListeners.current.forEach(listener => {
        listener({
          type: 'data_received',
          data: syncPayload,
        });
      });

      setLastSyncTime(Date.now());
      setSyncStatus('synced');

      return { success: true };
    } catch (error) {
      setSyncStatus('error');
      return { success: false, error: error.message };
    }
  }, []);

  const addSyncListener = useCallback((callback) => {
    syncListeners.current.push(callback);
    return () => {
      syncListeners.current = syncListeners.current.filter(l => l !== callback);
    };
  }, []);

  const value = {
    groups,
    activeGroup,
    isLoading,
    syncStatus,
    lastSyncTime,
    createGroup,
    joinGroup,
    leaveGroup,
    selectActiveGroup,
    updateGroupSettings,
    receiveSyncData,
    addSyncListener,
    loadGroups,
  };

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error('useGroup deve ser usado dentro de GroupProvider');
  return context;
};
