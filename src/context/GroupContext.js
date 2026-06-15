import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import SupabaseService from '../services/SupabaseService';

const GroupContext = createContext();

const ACTIVE_GROUP_KEY = '@checkfinances_active_group';
const GROUPS_STORAGE_KEY = '@checkfinances_groups_local';

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

      // Try Supabase first
      if (SupabaseService.isConfigured) {
        const result = await SupabaseService.getUserGroups(user.id);
        if (result && result.length > 0) {
          setGroups(result);
          await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(result));

          const activeId = await AsyncStorage.getItem(ACTIVE_GROUP_KEY);
          if (activeId) {
            const active = result.find(g => g.id === activeId);
            if (active) setActiveGroup(active);
          }
          setIsLoading(false);
          return;
        }
      }

      // Fallback: load from AsyncStorage
      const stored = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      if (stored) {
        const localGroups = JSON.parse(stored);
        setGroups(localGroups);

        const activeId = await AsyncStorage.getItem(ACTIVE_GROUP_KEY);
        if (activeId) {
          const active = localGroups.find(g => g.id === activeId);
          if (active) setActiveGroup(active);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      try {
        const stored = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
        if (stored) {
          const localGroups = JSON.parse(stored);
          setGroups(localGroups);
        }
      } catch (e) {
        console.error('Fallback error:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Accept individual parameters to match GroupScreen calls
  const createGroup = useCallback(async (name, description = '', userId, username, displayName) => {
    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const groupData = {
        name: name.trim(),
        description: description.trim(),
        created_by: userId || user.id,
        creator_username: username || user.username,
        creator_display_name: displayName || user.displayName || user.username,
      };

      let newGroup;

      // Try Supabase first
      if (SupabaseService.isConfigured) {
        const result = await SupabaseService.createGroup(
          groupData.name,
          groupData.description,
          groupData.created_by,
          groupData.creator_username,
          groupData.creator_display_name
        );

        if (result.success) {
          newGroup = result.group;
        } else {
          return result;
        }
      } else {
        // Local fallback
        newGroup = {
          id: `local_group_${Date.now()}`,
          name: groupData.name,
          description: groupData.description,
          invite_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
          created_by: groupData.created_by,
          members_count: 1,
          created_at: new Date().toISOString(),
        };
      }

      const updatedGroups = [...groups, newGroup];
      setGroups(updatedGroups);
      setActiveGroup(newGroup);
      await AsyncStorage.setItem(ACTIVE_GROUP_KEY, newGroup.id);
      await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));

      return { success: true, group: newGroup };
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      return { success: false, error: 'Erro ao criar grupo: ' + error.message };
    }
  }, [user, groups]);

  // Accept individual parameters to match GroupScreen calls
  const joinGroup = useCallback(async (inviteCode, userId, username, displayName) => {
    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const joinData = {
        invite_code: inviteCode.trim().toUpperCase(),
        user_id: userId || user.id,
        username: username || user.username,
        display_name: displayName || user.displayName || user.username,
      };

      let group;

      // Try Supabase first
      if (SupabaseService.isConfigured) {
        const result = await SupabaseService.joinGroup(
          joinData.invite_code,
          joinData.user_id,
          joinData.username,
          joinData.display_name
        );

        if (result.success) {
          group = result.group;
        } else {
          return result;
        }
      } else {
        // Local fallback - find group by invite code
        const stored = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
        const allGroups = stored ? JSON.parse(stored) : [];
        const foundGroup = allGroups.find(g => g.invite_code === joinData.invite_code);

        if (!foundGroup) {
          return { success: false, error: 'Código de convite inválido' };
        }

        group = foundGroup;
      }

      // Check if already in group
      if (groups.find(g => g.id === group.id)) {
        return { success: false, error: 'Você já está neste grupo' };
      }

      const updatedGroups = [...groups, group];
      setGroups(updatedGroups);
      setActiveGroup(group);
      await AsyncStorage.setItem(ACTIVE_GROUP_KEY, group.id);
      await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));

      return { success: true, group };
    } catch (error) {
      console.error('Erro ao entrar no grupo:', error);
      return { success: false, error: 'Erro ao entrar no grupo: ' + error.message };
    }
  }, [user, groups]);

  const leaveGroup = useCallback(async (groupId) => {
    try {
      if (SupabaseService.isConfigured) {
        await SupabaseService.leaveGroup(groupId, user.id);
      }

      const updatedGroups = groups.filter(g => g.id !== groupId);
      setGroups(updatedGroups);

      if (activeGroup?.id === groupId) {
        setActiveGroup(null);
        await AsyncStorage.removeItem(ACTIVE_GROUP_KEY);
      }

      await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, activeGroup, groups]);

  const selectActiveGroup = useCallback(async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setActiveGroup(group);
      await AsyncStorage.setItem(ACTIVE_GROUP_KEY, groupId);
    }
  }, [groups]);

  const updateGroupSettings = useCallback(async (groupId, settings) => {
    return { success: true };
  }, []);

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

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error('useGroup deve ser usado dentro de GroupProvider');
  return context;
};