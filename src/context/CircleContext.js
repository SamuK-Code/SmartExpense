// CircleContext.js — Sistema de Círculos Financeiros
// Substitui completamente o GroupContext.js
// Features: tempo real, permissões granulares, notificações de atividade, dados merged

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';
import { supabase } from '../utils/supabase';

const CircleContext = createContext();

// ========== UTILITÁRIOS ==========

const generateSecureCode = async () => {
  const bytes = await Crypto.getRandomBytesAsync(8);
  return Array.from(bytes)
    .map(b => b.toString(36).padStart(2, '0'))
    .join('')
    .toUpperCase()
    .slice(0, 12);
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>'"&]/g, '').slice(0, 100);
};

const hashPassword = async (password, salt) => {
  const iterations = 10000;
  let hash = password + salt;
  for (let i = 0; i < iterations; i++) {
    hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, hash);
  }
  return hash;
};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Rate limiting
const rateLimitStore = new Map();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60 * 1000;

const checkRateLimit = (key) => {
  const now = Date.now();
  const attempts = rateLimitStore.get(key) || [];
  const valid = attempts.filter(t => now - t < RATE_LIMIT_WINDOW);
  rateLimitStore.set(key, valid);
  return valid.length < RATE_LIMIT_MAX;
};

const addRateLimitAttempt = (key) => {
  const attempts = rateLimitStore.get(key) || [];
  attempts.push(Date.now());
  rateLimitStore.set(key, attempts);
};

// ========== PROVIDER ==========

export const CircleProvider = ({ children }) => {
  // ─── Auth State ───
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Circle State ───
  const [currentCircle, setCurrentCircle] = useState(null);
  const [myCircles, setMyCircles] = useState([]);
  const [circleMembers, setCircleMembers] = useState([]);

  // ─── Shared Data (merged) ───
  const [sharedCards, setSharedCards] = useState([]);
  const [sharedTransactions, setSharedTransactions] = useState([]);
  const [sharedGoals, setSharedGoals] = useState([]);

  // ─── Activity & Notifications ───
  const [activityLog, setActivityLog] = useState([]);
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);

  // ─── Sync State ───
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncEnabled, setSyncEnabled] = useState(false);

  // ─── Real-time Subscriptions ───
  const subscriptionsRef = useRef([]);
  const syncIntervalRef = useRef(null);
  const lastSyncRef = useRef(0);

  // ========== PERSISTÊNCIA LOCAL ==========

  const STORAGE_KEYS = {
    user: 'circle_user_local',
    currentCircle: 'circle_current',
    myCircles: 'circle_my_circles',
    sharedCards: 'circle_shared_cards',
    sharedTransactions: 'circle_shared_transactions',
    sharedGoals: 'circle_shared_goals',
    activityLog: 'circle_activity_log',
    lastSync: 'circle_last_sync',
    unreadCount: 'circle_unread_count',
  };

  const saveToStorage = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`[CircleContext] Erro ao salvar ${key}:`, e);
    }
  };

  const loadFromStorage = async (key, defaultValue = null) => {
    try {
      const saved = await AsyncStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      console.warn(`[CircleContext] Erro ao carregar ${key}:`, e);
      return defaultValue;
    }
  };

  // ========== INIT ==========

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const user = await loadFromStorage(STORAGE_KEYS.user);
      if (user) setCurrentUser(user);

      const circle = await loadFromStorage(STORAGE_KEYS.currentCircle);
      if (circle) setCurrentCircle(circle);

      const circles = await loadFromStorage(STORAGE_KEYS.myCircles, []);
      setMyCircles(circles);

      const cards = await loadFromStorage(STORAGE_KEYS.sharedCards, []);
      setSharedCards(cards);

      const transactions = await loadFromStorage(STORAGE_KEYS.sharedTransactions, []);
      setSharedTransactions(transactions);

      const goals = await loadFromStorage(STORAGE_KEYS.sharedGoals, []);
      setSharedGoals(goals);

      const log = await loadFromStorage(STORAGE_KEYS.activityLog, []);
      setActivityLog(log);

      const last = await loadFromStorage(STORAGE_KEYS.lastSync);
      if (last) setLastSync(new Date(last));

      const unread = await loadFromStorage(STORAGE_KEYS.unreadCount, 0);
      setUnreadActivityCount(unread);
    } catch (e) {
      console.warn('[CircleContext] Erro ao carregar sessão:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== AUTO-SYNC & REAL-TIME ==========

  useEffect(() => {
    if (currentCircle && currentUser) {
      setSyncEnabled(true);
      startRealTimeSubscriptions();
      startAutoSync();
      syncWithCircle();
    } else {
      stopRealTimeSubscriptions();
      stopAutoSync();
    }

    return () => {
      stopRealTimeSubscriptions();
      stopAutoSync();
    };
  }, [currentCircle?.id, currentUser?.id]);

  const startRealTimeSubscriptions = useCallback(() => {
    if (!currentCircle?.id) return;

    stopRealTimeSubscriptions();

    const itemsChannel = supabase
      .channel(`circle_items_${currentCircle.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'circle_items',
          filter: `circle_id=eq.${currentCircle.id}`,
        },
        (payload) => {
          console.log('[Realtime] circle_items change:', payload.eventType);
          handleRealtimeItemChange(payload);
        }
      )
      .subscribe();

    const membersChannel = supabase
      .channel(`circle_members_${currentCircle.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'circle_members',
          filter: `circle_id=eq.${currentCircle.id}`,
        },
        (payload) => {
          console.log('[Realtime] circle_members change:', payload.eventType);
          fetchCircleMembers(currentCircle.id);
        }
      )
      .subscribe();

    const activityChannel = supabase
      .channel(`circle_activity_${currentCircle.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'circle_activity_log',
          filter: `circle_id=eq.${currentCircle.id}`,
        },
        (payload) => {
          console.log('[Realtime] new activity:', payload.new);
          handleNewActivity(payload.new);
        }
      )
      .subscribe();

    subscriptionsRef.current = [itemsChannel, membersChannel, activityChannel];
  }, [currentCircle?.id]);

  const stopRealTimeSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach(sub => {
      try {
        supabase.removeChannel(sub);
      } catch (e) {
        // ignore
      }
    });
    subscriptionsRef.current = [];
  }, []);

  const handleRealtimeItemChange = (payload) => {
    const { eventType, new: newData, old: oldData } = payload;

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const itemData = newData.item_data || {};
      const enrichedItem = {
        ...itemData,
        _sharedBy: newData.shared_by,
        _sharedByName: newData.shared_by_name,
        _permissions: newData.permissions,
        _circleItemId: newData.id,
        _sharedAt: newData.created_at,
      };

      switch (newData.item_type) {
        case 'card':
          setSharedCards(prev => {
            const filtered = prev.filter(c => String(c.id) !== String(itemData.id));
            return [...filtered, enrichedItem];
          });
          break;
        case 'transaction':
          setSharedTransactions(prev => {
            const filtered = prev.filter(t => String(t.id) !== String(itemData.id));
            return [...filtered, enrichedItem];
          });
          break;
        case 'goal':
          setSharedGoals(prev => {
            const filtered = prev.filter(g => String(g.id) !== String(itemData.id));
            return [...filtered, enrichedItem];
          });
          break;
      }
    } else if (eventType === 'DELETE') {
      const itemId = oldData?.item_data?.id || oldData?.item_id;
      switch (oldData?.item_type) {
        case 'card':
          setSharedCards(prev => prev.filter(c => String(c.id) !== String(itemId)));
          break;
        case 'transaction':
          setSharedTransactions(prev => prev.filter(t => String(t.id) !== String(itemId)));
          break;
        case 'goal':
          setSharedGoals(prev => prev.filter(g => String(g.id) !== String(itemId)));
          break;
      }
    }
  };

  const handleNewActivity = (activity) => {
    if (activity.user_id === currentUser?.id) return;

    const newLogItem = {
      id: activity.id,
      userId: activity.user_id,
      userName: activity.user_name,
      action: activity.action,
      itemType: activity.item_type,
      itemName: activity.item_name,
      message: activity.message,
      createdAt: activity.created_at,
      read: false,
    };

    setActivityLog(prev => {
      const updated = [newLogItem, ...prev].slice(0, 100);
      saveToStorage(STORAGE_KEYS.activityLog, updated);
      return updated;
    });

    setUnreadActivityCount(prev => {
      const newCount = prev + 1;
      saveToStorage(STORAGE_KEYS.unreadCount, newCount);
      return newCount;
    });
  };

  const startAutoSync = useCallback(() => {
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    syncIntervalRef.current = setInterval(() => {
      syncWithCircle();
    }, 30000);
  }, []);

  const stopAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // ========== AUTH ==========

  const register = async (username, password) => {
    const rateKey = `register:${username.toLowerCase()}`;
    if (!checkRateLimit(rateKey)) {
      return { error: 'Muitas tentativas. Aguarde 1 minuto.' };
    }
    addRateLimitAttempt(rateKey);

    const cleanUsername = sanitizeString(username);
    if (!cleanUsername || cleanUsername.length < 3) {
      return { error: 'Nome de usuário inválido (mín. 3 caracteres)' };
    }
    if (!password || password.length < 6) {
      return { error: 'Senha deve ter pelo menos 6 caracteres' };
    }

    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existing) return { error: 'Usuário já existe' };

      const userId = generateUUID();
      const salt = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Date.now().toString() + Math.random().toString()
      );
      const passwordHash = await hashPassword(password, salt);

      const { error } = await supabase
        .from('users')
        .insert([{
          id: userId,
          username: cleanUsername,
          password_hash: passwordHash,
          salt: salt,
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      const user = {
        id: userId,
        username: cleanUsername,
        token: passwordHash.slice(0, 32),
      };

      setCurrentUser(user);
      await saveToStorage(STORAGE_KEYS.user, user);
      return { success: true };
    } catch (e) {
      console.warn('[CircleContext] Erro no registro:', e);
      return { error: e.message || 'Erro ao cadastrar' };
    }
  };

  const login = async (username, password) => {
    const rateKey = `login:${username.toLowerCase()}`;
    if (!checkRateLimit(rateKey)) {
      return { error: 'Muitas tentativas. Aguarde 1 minuto.' };
    }
    addRateLimitAttempt(rateKey);

    const cleanUsername = sanitizeString(username);
    if (!cleanUsername || !password) {
      return { error: 'Preencha usuário e senha' };
    }

    try {
      const { data: userRecord, error } = await supabase
        .from('users')
        .select('id, username, password_hash, salt')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (error || !userRecord) {
        return { error: 'Usuário ou senha incorretos' };
      }

      const passwordHash = await hashPassword(password, userRecord.salt);
      if (passwordHash !== userRecord.password_hash) {
        return { error: 'Usuário ou senha incorretos' };
      }

      const user = {
        id: userRecord.id,
        username: userRecord.username,
        token: passwordHash.slice(0, 32),
      };

      setCurrentUser(user);
      await saveToStorage(STORAGE_KEYS.user, user);
      await loadUserCircles(user.id);

      return { success: true };
    } catch (e) {
      console.warn('[CircleContext] Erro no login:', e);
      return { error: e.message || 'Erro ao fazer login' };
    }
  };

  const logout = async () => {
    stopRealTimeSubscriptions();
    stopAutoSync();

    setCurrentUser(null);
    setCurrentCircle(null);
    setCircleMembers([]);
    setMyCircles([]);
    setSharedCards([]);
    setSharedTransactions([]);
    setSharedGoals([]);
    setActivityLog([]);
    setUnreadActivityCount(0);
    setLastSync(null);
    setSyncEnabled(false);

    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  };

  // ========== CÍRCULOS ==========

  const loadUserCircles = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('circle_members')
        .select(`
          circle_id,
          role,
          circles:circle_id(id, name, created_by, invite_code, created_at)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const circles = (data || []).map(m => ({
        id: m.circles.id,
        name: m.circles.name,
        inviteCode: m.circles.invite_code,
        createdBy: m.circles.created_by,
        myRole: m.role,
        joinedAt: m.circles.created_at,
      }));

      setMyCircles(circles);
      await saveToStorage(STORAGE_KEYS.myCircles, circles);

      const savedCircle = await loadFromStorage(STORAGE_KEYS.currentCircle);
      if (savedCircle && circles.find(c => c.id === savedCircle.id)) {
        setCurrentCircle(savedCircle);
      } else if (circles.length > 0) {
        setCurrentCircle(circles[0]);
        await saveToStorage(STORAGE_KEYS.currentCircle, circles[0]);
      }
    } catch (e) {
      console.warn('[CircleContext] Erro ao carregar círculos:', e);
    }
  };

  const createCircle = async (name) => {
    if (!currentUser) return { error: 'Faça login primeiro' };

    const cleanName = sanitizeString(name);
    if (!cleanName || cleanName.length < 2) {
      return { error: 'Nome do círculo inválido' };
    }

    try {
      const code = await generateSecureCode();

      const { data, error } = await supabase
        .from('circles')
        .insert([{
          name: cleanName,
          invite_code: code,
          created_by: currentUser.id,
        }])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('circle_members')
        .insert([{
          circle_id: data.id,
          user_id: currentUser.id,
          role: 'admin',
        }]);

      const circle = {
        id: data.id,
        name: data.name,
        inviteCode: data.invite_code,
        createdBy: currentUser.id,
        myRole: 'admin',
      };

      setCurrentCircle(circle);
      setMyCircles(prev => [...prev, circle]);
      await saveToStorage(STORAGE_KEYS.currentCircle, circle);
      await saveToStorage(STORAGE_KEYS.myCircles, [...myCircles, circle]);

      return { success: true, inviteCode: code };
    } catch (e) {
      console.warn('[CircleContext] Erro ao criar círculo:', e);
      return { error: e.message || 'Erro ao criar círculo' };
    }
  };

  const joinCircle = async (code) => {
    if (!currentUser) return { error: 'Faça login primeiro' };

    const rateKey = `join:${currentUser.id}`;
    if (!checkRateLimit(rateKey)) {
      return { error: 'Muitas tentativas. Aguarde 1 minuto.' };
    }
    addRateLimitAttempt(rateKey);

    const cleanCode = sanitizeString(code).toUpperCase();
    if (!cleanCode || cleanCode.length < 6) {
      return { error: 'Código inválido' };
    }

    try {
      const { data: circle, error: circleError } = await supabase
        .from('circles')
        .select('id, name, invite_code, created_by')
        .eq('invite_code', cleanCode)
        .maybeSingle();

      if (circleError || !circle) return { error: 'Círculo não encontrado' };

      const { data: existingMember } = await supabase
        .from('circle_members')
        .select('id')
        .eq('circle_id', circle.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (existingMember) {
        return { error: 'Você já é membro deste círculo' };
      }

      await supabase
        .from('circle_members')
        .insert([{
          circle_id: circle.id,
          user_id: currentUser.id,
          role: 'member',
        }]);

      const circleData = {
        id: circle.id,
        name: circle.name,
        inviteCode: circle.invite_code,
        createdBy: circle.created_by,
        myRole: 'member',
      };

      setCurrentCircle(circleData);
      setMyCircles(prev => [...prev, circleData]);
      await saveToStorage(STORAGE_KEYS.currentCircle, circleData);
      await saveToStorage(STORAGE_KEYS.myCircles, [...myCircles, circleData]);

      return { success: true };
    } catch (e) {
      console.warn('[CircleContext] Erro ao entrar no círculo:', e);
      return { error: e.message || 'Erro ao entrar no círculo' };
    }
  };

  const leaveCircle = async (circleId = null) => {
    const targetCircleId = circleId || currentCircle?.id;
    if (!targetCircleId || !currentUser) return { error: 'Não está em um círculo' };

    try {
      await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', targetCircleId)
        .eq('user_id', currentUser.id);

      await supabase
        .from('circle_items')
        .delete()
        .eq('circle_id', targetCircleId)
        .eq('shared_by', currentUser.id);

      const updatedCircles = myCircles.filter(c => c.id !== targetCircleId);
      setMyCircles(updatedCircles);
      await saveToStorage(STORAGE_KEYS.myCircles, updatedCircles);

      if (currentCircle?.id === targetCircleId) {
        setCurrentCircle(updatedCircles.length > 0 ? updatedCircles[0] : null);
        if (updatedCircles.length > 0) {
          await saveToStorage(STORAGE_KEYS.currentCircle, updatedCircles[0]);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.currentCircle);
        }
      }

      return { success: true };
    } catch (e) {
      console.warn('[CircleContext] Erro ao sair do círculo:', e);
      return { error: e.message || 'Erro ao sair do círculo' };
    }
  };

  const switchCircle = async (circleId) => {
    if (circleId === null) {
      setCurrentCircle(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.currentCircle);
      stopRealTimeSubscriptions();
      stopAutoSync();
      setSyncEnabled(false);
      return { success: true };
    }

    const circle = myCircles.find(c => c.id === circleId);
    if (!circle) return { error: 'Círculo não encontrado' };

    setCurrentCircle(circle);
    await saveToStorage(STORAGE_KEYS.currentCircle, circle);

    setSharedCards([]);
    setSharedTransactions([]);
    setSharedGoals([]);
    await syncWithCircle();

    return { success: true };
  };

  const generateNewInviteCode = async () => {
    if (!currentCircle || !currentUser) return { error: 'Sem permissão' };
    if (currentCircle.createdBy !== currentUser.id) {
      return { error: 'Apenas o administrador pode gerar novo código' };
    }

    try {
      const newCode = await generateSecureCode();

      const { error } = await supabase
        .from('circles')
        .update({ invite_code: newCode })
        .eq('id', currentCircle.id);

      if (error) throw error;

      const updated = { ...currentCircle, inviteCode: newCode };
      setCurrentCircle(updated);
      setMyCircles(prev => prev.map(c => c.id === updated.id ? updated : c));
      await saveToStorage(STORAGE_KEYS.currentCircle, updated);

      return { success: true, inviteCode: newCode };
    } catch (e) {
      console.warn('[CircleContext] Erro ao gerar código:', e);
      return { error: e.message || 'Erro ao gerar código' };
    }
  };

  const updateCircleName = async (circleId, newName) => {
    if (!currentUser || !circleId) return { error: 'Sem permissão' };

    const circle = myCircles.find(c => c.id === circleId);
    if (!circle) return { error: 'Círculo não encontrado' };
    if (circle.myRole !== 'admin') {
      return { error: 'Apenas administradores podem editar o nome do círculo' };
    }

    const cleanName = sanitizeString(newName);
    if (!cleanName || cleanName.length < 2) {
      return { error: 'Nome do círculo inválido' };
    }

    try {
      const { error } = await supabase
        .from('circles')
        .update({ name: cleanName })
        .eq('id', circleId);

      if (error) throw error;

      const updatedCircle = { ...currentCircle, name: cleanName };
      if (currentCircle?.id === circleId) {
        setCurrentCircle(updatedCircle);
        await saveToStorage(STORAGE_KEYS.currentCircle, updatedCircle);
      }

      const updatedCircles = myCircles.map(c =>
        c.id === circleId ? { ...c, name: cleanName } : c
      );
      setMyCircles(updatedCircles);
      await saveToStorage(STORAGE_KEYS.myCircles, updatedCircles);

      return { success: true };
    } catch (e) {
      console.warn('[CircleContext] Erro ao atualizar nome:', e);
      return { error: e.message || 'Erro ao atualizar nome' };
    }
  };

  const fetchCircleMembers = async (circleId) => {
    if (!circleId) return;
    try {
      const { data, error } = await supabase
        .from('circle_members')
        .select(`
          user_id,
          role,
          users:user_id(username)
        `)
        .eq('circle_id', circleId);

      if (error) throw error;

      const members = (data || []).map(m => ({
        id: m.user_id,
        username: m.users?.username || 'Desconhecido',
        role: m.role || 'member',
        isAdmin: m.role === 'admin',
      }));

      setCircleMembers(members);
    } catch (e) {
      console.warn('[CircleContext] Erro ao buscar membros:', e);
    }
  };

  // ========== COMPARTILHAMENTO ==========

  const shareItem = async (itemType, itemData, permissions = { view: true, edit: false }) => {
    if (!currentCircle || !currentUser) return { error: 'Sem círculo ativo' };

    const cleanType = sanitizeString(itemType);
    const itemId = String(itemData.id);
    if (!cleanType || !itemId) return { error: 'Dados inválidos' };

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', currentUser.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from('circle_items')
        .upsert([{
          circle_id: currentCircle.id,
          item_type: cleanType,
          item_id: itemId,
          shared_by: currentUser.id,
          shared_by_name: userData?.username || currentUser.username,
          permissions,
          item_data: itemData,
          updated_at: new Date().toISOString(),
        }], { onConflict: 'circle_id,item_type,item_id' });

      if (error) throw error;

      await logActivity('share', cleanType, itemData.name || itemData.desc || 'Item', itemId);

      const enrichedItem = {
        ...itemData,
        _sharedBy: currentUser.id,
        _sharedByName: userData?.username || currentUser.username,
        _permissions: permissions,
        _circleItemId: data?.[0]?.id,
      };

      switch (cleanType) {
        case 'card':
          setSharedCards(prev => {
            const filtered = prev.filter(c => String(c.id) !== itemId);
            return [...filtered, enrichedItem];
          });
          await saveToStorage(STORAGE_KEYS.sharedCards, [...sharedCards.filter(c => String(c.id) !== itemId), enrichedItem]);
          break;
        case 'transaction':
          setSharedTransactions(prev => {
            const filtered = prev.filter(t => String(t.id) !== itemId);
            return [...filtered, enrichedItem];
          });
          await saveToStorage(STORAGE_KEYS.sharedTransactions, [...sharedTransactions.filter(t => String(t.id) !== itemId), enrichedItem]);
          break;
        case 'goal':
          setSharedGoals(prev => {
            const filtered = prev.filter(g => String(g.id) !== itemId);
            return [...filtered, enrichedItem];
          });
          await saveToStorage(STORAGE_KEYS.sharedGoals, [...sharedGoals.filter(g => String(g.id) !== itemId), enrichedItem]);
          break;
      }

      return { success: true };
    } catch (e) {
      console.warn('[CircleContext] Erro ao compartilhar:', e);
      return { error: e.message || 'Erro ao compartilhar' };
    }
  };

  const unshareItem = async (itemType, itemId) => {
    if (!currentCircle || !currentUser) return { error: 'Sem círculo' };

    const cleanType = sanitizeString(itemType);
    const cleanId = String(itemId);

    try {
      await supabase
        .from('circle_items')
        .delete()
        .eq('circle_id', currentCircle.id)
        .eq('item_type', cleanType)
        .eq('item_id', cleanId)
        .eq('shared_by', currentUser.id);

      switch (cleanType) {
        case 'card':
          setSharedCards(prev => prev.filter(c => String(c.id) !== cleanId));
          await saveToStorage(STORAGE_KEYS.sharedCards, sharedCards.filter(c => String(c.id) !== cleanId));
          break;
        case 'transaction':
          setSharedTransactions(prev => prev.filter(t => String(t.id) !== cleanId));
          await saveToStorage(STORAGE_KEYS.sharedTransactions, sharedTransactions.filter(t => String(t.id) !== cleanId));
          break;
        case 'goal':
          setSharedGoals(prev => prev.filter(g => String(g.id) !== cleanId));
          await saveToStorage(STORAGE_KEYS.sharedGoals, sharedGoals.filter(g => String(g.id) !== cleanId));
          break;
      }

      return { success: true };
    } catch (e) {
      console.warn('[CircleContext] Erro ao remover compartilhamento:', e);
      return { error: e.message || 'Erro ao remover' };
    }
  };

  const shareAllItems = async (itemType, itemsList, permissions = { view: true, edit: false }) => {
    if (!currentCircle || !currentUser) return { error: 'Sem círculo' };
    if (!itemsList || itemsList.length === 0) return { error: 'Nenhum item' };

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', currentUser.id)
        .maybeSingle();

      const itemsToUpsert = itemsList.map(item => ({
        circle_id: currentCircle.id,
        item_type: itemType,
        item_id: String(item.id),
        shared_by: currentUser.id,
        shared_by_name: userData?.username || currentUser.username,
        permissions,
        item_data: item,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('circle_items')
        .upsert(itemsToUpsert, { onConflict: 'circle_id,item_type,item_id' });

      if (error) throw error;

      await logActivity('share_all', itemType, `${itemsList.length} itens`, null);

      const enrichedItems = itemsList.map(item => ({
        ...item,
        _sharedBy: currentUser.id,
        _sharedByName: userData?.username || currentUser.username,
        _permissions: permissions,
      }));

      switch (itemType) {
        case 'card':
          setSharedCards(prev => {
            const existingIds = new Set(enrichedItems.map(i => String(i.id)));
            const filtered = prev.filter(c => !existingIds.has(String(c.id)));
            return [...filtered, ...enrichedItems];
          });
          break;
        case 'transaction':
          setSharedTransactions(prev => {
            const existingIds = new Set(enrichedItems.map(i => String(i.id)));
            const filtered = prev.filter(t => !existingIds.has(String(t.id)));
            return [...filtered, ...enrichedItems];
          });
          break;
        case 'goal':
          setSharedGoals(prev => {
            const existingIds = new Set(enrichedItems.map(i => String(i.id)));
            const filtered = prev.filter(g => !existingIds.has(String(g.id)));
            return [...filtered, ...enrichedItems];
          });
          break;
      }

      return { success: true, count: itemsList.length };
    } catch (e) {
      console.warn('[CircleContext] Erro ao compartilhar todos:', e);
      return { error: e.message || 'Erro ao compartilhar itens' };
    }
  };

  // ========== SINCRONIZAÇÃO ==========

  const syncWithCircle = async () => {
    if (!currentCircle || !currentUser || isSyncing) return;

    const now = Date.now();
    if (now - lastSyncRef.current < 5000) return;
    lastSyncRef.current = now;

    try {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) return;
    } catch (e) {
      // Ignorar erro de network
    }

    setIsSyncing(true);

    try {
      const { data: allItems, error: itemsError } = await supabase
        .from('circle_items')
        .select('id, item_type, item_id, shared_by, shared_by_name, permissions, item_data, created_at')
        .eq('circle_id', currentCircle.id);

      if (itemsError) throw itemsError;

      const cards = [];
      const transactions = [];
      const goals = [];

      (allItems || []).forEach(item => {
        const enriched = {
          ...(item.item_data || {}),
          _sharedBy: item.shared_by,
          _sharedByName: item.shared_by_name,
          _permissions: item.permissions,
          _circleItemId: item.id,
          _sharedAt: item.created_at,
        };

        switch (item.item_type) {
          case 'card': cards.push(enriched); break;
          case 'transaction': transactions.push(enriched); break;
          case 'goal': goals.push(enriched); break;
        }
      });

      setSharedCards(cards);
      setSharedTransactions(transactions);
      setSharedGoals(goals);

      await saveToStorage(STORAGE_KEYS.sharedCards, cards);
      await saveToStorage(STORAGE_KEYS.sharedTransactions, transactions);
      await saveToStorage(STORAGE_KEYS.sharedGoals, goals);

      const { data: recentActivity, error: activityError } = await supabase
        .from('circle_activity_log')
        .select('*')
        .eq('circle_id', currentCircle.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!activityError && recentActivity) {
        const formattedLog = recentActivity.map(a => ({
          id: a.id,
          userId: a.user_id,
          userName: a.user_name,
          action: a.action,
          itemType: a.item_type,
          itemName: a.item_name,
          message: a.message,
          createdAt: a.created_at,
          read: a.user_id === currentUser.id,
        }));

        setActivityLog(formattedLog);
        await saveToStorage(STORAGE_KEYS.activityLog, formattedLog);

        const unread = formattedLog.filter(a => !a.read).length;
        setUnreadActivityCount(unread);
        await saveToStorage(STORAGE_KEYS.unreadCount, unread);
      }

      await fetchCircleMembers(currentCircle.id);

      const syncTime = new Date();
      setLastSync(syncTime);
      await saveToStorage(STORAGE_KEYS.lastSync, syncTime.toISOString());

      return { success: true };
    } catch (e) {
      console.warn('[CircleContext] Erro no sync:', e);
      return { error: e.message || 'Erro ao sincronizar' };
    } finally {
      setIsSyncing(false);
    }
  };

  // ========== LOG DE ATIVIDADE ==========

  const logActivity = async (action, itemType, itemName, itemId) => {
    if (!currentCircle || !currentUser) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', currentUser.id)
        .maybeSingle();

      const messages = {
        share: `compartilhou ${itemType === 'card' ? 'um cartão' : itemType === 'transaction' ? 'uma transação' : 'uma meta'}`,
        share_all: `compartilhou ${itemName}`,
        unshare: `removeu o compartilhamento de ${itemType === 'card' ? 'um cartão' : itemType === 'transaction' ? 'uma transação' : 'uma meta'}`,
        edit: `editou ${itemType === 'card' ? 'um cartão' : itemType === 'transaction' ? 'uma transação' : 'uma meta'}`,
        delete: `excluiu ${itemType === 'card' ? 'um cartão' : itemType === 'transaction' ? 'uma transação' : 'uma meta'}`,
        join: `entrou no círculo`,
        leave: `saiu do círculo`,
      };

      await supabase
        .from('circle_activity_log')
        .insert([{
          circle_id: currentCircle.id,
          user_id: currentUser.id,
          user_name: userData?.username || currentUser.username,
          action,
          item_type: itemType,
          item_name: itemName,
          item_id: itemId,
          message: messages[action] || action,
          created_at: new Date().toISOString(),
        }]);
    } catch (e) {
      console.warn('[CircleContext] Erro ao logar atividade:', e);
    }
  };

  const markActivityAsRead = async (activityId = null) => {
    if (activityId) {
      setActivityLog(prev => {
        const updated = prev.map(a => a.id === activityId ? { ...a, read: true } : a);
        saveToStorage(STORAGE_KEYS.activityLog, updated);
        return updated;
      });
    } else {
      setActivityLog(prev => {
        const updated = prev.map(a => ({ ...a, read: true }));
        saveToStorage(STORAGE_KEYS.activityLog, updated);
        return updated;
      });
      setUnreadActivityCount(0);
      await saveToStorage(STORAGE_KEYS.unreadCount, 0);
    }
  };

  // ========== HELPERS DE PERMISSÃO ==========

  const canEditItem = (item) => {
    if (!item._sharedBy || !currentUser) return true;
    if (item._sharedBy === currentUser.id) return true;
    return item._permissions?.edit === true;
  };

  const isItemFromCircle = (item) => {
    return !!item._sharedBy && item._sharedBy !== currentUser?.id;
  };

  const getItemOwnerName = (item) => {
    return item._sharedByName || 'Membro';
  };

  // ========== VALUE ==========

  const value = {
    currentUser,
    isLoading,
    login,
    register,
    logout,

    currentCircle,
    myCircles,
    circleMembers,
    createCircle,
    joinCircle,
    leaveCircle,
    switchCircle,
    generateNewInviteCode,
    updateCircleName,
    fetchCircleMembers,

    sharedCards,
    sharedTransactions,
    sharedGoals,

    shareItem,
    unshareItem,
    shareAllItems,

    activityLog,
    unreadActivityCount,
    markActivityAsRead,
    logActivity,

    isSyncing,
    lastSync,
    syncEnabled,
    syncWithCircle,

    canEditItem,
    isItemFromCircle,
    getItemOwnerName,
  };

  return (
    <CircleContext.Provider value={value}>
      {children}
    </CircleContext.Provider>
  );
};

export const useCircle = () => {
  const ctx = useContext(CircleContext);
  if (!ctx) throw new Error('useCircle must be inside CircleProvider');
  return ctx;
};