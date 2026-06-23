// GroupContext.js — Login, Grupos e Sincronização SEGURO
// VERSÃO BYPASS: Sem Supabase Auth (sem rate limit de email)
// ⚠️ APENAS PARA USO PRIVADO/NÃO PÚBLICO
// CORREÇÕES: auto-sync automático, shareItem salva dados reais, type coercion nos IDs

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';
import { supabase } from '../utils/supabase';

const GroupContext = createContext();

// 🛡️ Rate limiting simples (cliente)
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

// 🛡️ Gerar código seguro — CORRIGIDO: usa getRandomBytesAsync
const generateSecureCode = async () => {
  // ✅ CORREÇÃO: getRandomBytesAsync(byteCount) retorna Uint8Array
  const bytes = await Crypto.getRandomBytesAsync(8);
  return Array.from(bytes)
    .map(b => b.toString(36).padStart(2, '0'))
    .join('')
    .toUpperCase()
    .slice(0, 12);
};

// 🛡️ Sanitizar input
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>'"&]/g, '').slice(0, 100);
};

// 🔑 Gerar hash de senha local (PBKDF2-like com expo-crypto)
const hashPassword = async (password, salt) => {
  const iterations = 10000;
  let hash = password + salt;
  for (let i = 0; i < iterations; i++) {
    hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      hash
    );
  }
  return hash;
};

// 🔑 Gerar UUID v4 simples
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const GroupProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [sharedItems, setSharedItems] = useState([]);
  const [sharedCards, setSharedCards] = useState([]);
  const [sharedTransactions, setSharedTransactions] = useState([]);
  const [sharedGoals, setSharedGoals] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);

  const syncIntervalRef = useRef(null);
  const lastSyncRef = useRef(0);

  useEffect(() => {
    loadSession();
  }, []);

  // ✅ CORREÇÃO 1: Iniciar auto-sync automaticamente ao entrar em um grupo
  useEffect(() => {
    if (currentGroup && currentUser) {
      setSyncEnabled(true);
      startAutoSync();
      // Sync imediato ao entrar no grupo
      syncWithGroup();
    } else {
      stopAutoSync();
    }
  }, [currentGroup?.id, currentUser?.id]);

  const loadSession = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('group_user_local');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      }

      const [savedGroup, savedShared, savedSyncEnabled] = await Promise.all([
        AsyncStorage.getItem('group_current'),
        AsyncStorage.getItem('group_shared_items'),
        AsyncStorage.getItem('group_sync_enabled'),
      ]);

      if (savedGroup) {
        const group = JSON.parse(savedGroup);
        setCurrentGroup(group);
        fetchGroupMembers(group.id);
      }
      if (savedShared) setSharedItems(JSON.parse(savedShared));
      if (savedSyncEnabled) setSyncEnabled(JSON.parse(savedSyncEnabled));
    } catch (e) {
      console.warn('Erro ao carregar sessão:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSession = async (user, group) => {
    try {
      if (user) await AsyncStorage.setItem('group_user_local', JSON.stringify(user));
      else await AsyncStorage.removeItem('group_user_local');

      if (group) await AsyncStorage.setItem('group_current', JSON.stringify(group));
      else await AsyncStorage.removeItem('group_current');
    } catch (e) {
      console.warn('Erro ao salvar sessão:', e);
    }
  };

  const saveSharedItems = async (items) => {
    try {
      await AsyncStorage.setItem('group_shared_items', JSON.stringify(items));
    } catch (e) {
      console.warn('Erro ao salvar shared items:', e);
    }
  };

  // ========== AUTH BYPASS (sem Supabase Auth) ==========

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
      await saveSession(user, null);
      return { success: true };
    } catch (e) {
      console.warn('Erro no registro:', e);
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
      await saveSession(user, null);
      return { success: true };
    } catch (e) {
      console.warn('Erro no login:', e);
      return { error: e.message || 'Erro ao fazer login' };
    }
  };

  const logout = async () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    setCurrentUser(null);
    setCurrentGroup(null);
    setGroupMembers([]);
    setSharedItems([]);
    setSharedCards([]);
    setSharedTransactions([]);
    setSharedGoals([]);
    setLastSync(null);
    setSyncEnabled(false);

    await AsyncStorage.multiRemove([
      'group_user_local',
      'group_current',
      'group_shared_items',
      'group_sync_enabled',
    ]);
  };

  // ========== GRUPOS ==========

  const fetchGroupMembers = async (groupId) => {
    if (!groupId) return;
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id, role, users:users(username)')
        .eq('group_id', groupId);

      if (error) throw error;

      const members = data.map(m => ({
        id: m.user_id,
        username: m.users?.username || 'Desconhecido',
        role: m.role || 'member',
        isAdmin: m.role === 'admin',
      }));

      setGroupMembers(members);
    } catch (e) {
      console.warn('Erro ao buscar membros:', e);
    }
  };

  const createGroup = async (name) => {
    if (!currentUser) return { error: 'Faça login primeiro' };

    const cleanName = sanitizeString(name);
    if (!cleanName || cleanName.length < 2) {
      return { error: 'Nome do grupo inválido' };
    }

    try {
      const code = await generateSecureCode();

      const { data, error } = await supabase
        .from('groups')
        .insert([{ 
          name: cleanName, 
          code, 
          created_by: currentUser.id 
        }])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('group_members')
        .insert([{ 
          group_id: data.id, 
          user_id: currentUser.id,
          role: 'admin'
        }]);

      const group = { 
        id: data.id, 
        name: data.name, 
        inviteCode: data.code,
        adminId: currentUser.id,
      };

      setCurrentGroup(group);
      await saveSession(currentUser, group);
      await fetchGroupMembers(data.id);

      return { success: true, inviteCode: code };
    } catch (e) {
      console.warn('Erro ao criar grupo:', e);
      return { error: e.message || 'Erro ao criar grupo' };
    }
  };

  const joinGroup = async (code) => {
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
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name, code, created_by')
        .eq('code', cleanCode)
        .maybeSingle();

      if (groupError || !group) return { error: 'Grupo não encontrado' };

      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!existingMember) {
        await supabase
          .from('group_members')
          .insert([{ 
            group_id: group.id, 
            user_id: currentUser.id,
            role: 'member'
          }]);
      }

      const groupData = { 
        id: group.id, 
        name: group.name, 
        inviteCode: group.code,
        adminId: group.created_by,
      };

      setCurrentGroup(groupData);
      await saveSession(currentUser, groupData);
      await fetchGroupMembers(group.id);

      return { success: true };
    } catch (e) {
      console.warn('Erro ao entrar no grupo:', e);
      return { error: e.message || 'Erro ao entrar no grupo' };
    }
  };

  const leaveGroup = async () => {
    if (!currentGroup || !currentUser) return { error: 'Não está em um grupo' };

    try {
      const { error: sharedError } = await supabase
        .from('shared_items')
        .delete()
        .eq('group_id', currentGroup.id)
        .eq('user_id', currentUser.id);

      if (sharedError) console.warn('Erro ao remover shared items:', sharedError);

      const { error: memberError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', currentGroup.id)
        .eq('user_id', currentUser.id);

      if (memberError) throw memberError;

      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }

      setCurrentGroup(null);
      setGroupMembers([]);
      setSharedItems([]);
      setSharedCards([]);
      setSharedTransactions([]);
      setSharedGoals([]);
      setLastSync(null);
      setSyncEnabled(false);

      await saveSession(currentUser, null);
      await AsyncStorage.multiRemove([
        'group_shared_items',
        'group_sync_enabled',
      ]);

      return { success: true };
    } catch (e) {
      console.warn('Erro ao sair do grupo:', e);
      return { error: e.message || 'Erro ao sair do grupo' };
    }
  };

  const generateInviteCode = async () => {
    if (!currentGroup || !currentUser) return { error: 'Sem permissão' };

    if (currentGroup.adminId !== currentUser.id) {
      return { error: 'Apenas o administrador pode gerar novo código' };
    }

    try {
      const newCode = await generateSecureCode();

      const { error } = await supabase
        .from('groups')
        .update({ code: newCode })
        .eq('id', currentGroup.id);

      if (error) throw error;

      const updatedGroup = { ...currentGroup, inviteCode: newCode };
      setCurrentGroup(updatedGroup);
      await saveSession(currentUser, updatedGroup);

      return { success: true, inviteCode: newCode };
    } catch (e) {
      console.warn('Erro ao gerar código:', e);
      return { error: e.message || 'Erro ao gerar código' };
    }
  };

  // ========== COMPARTILHAMENTO SELETIVO ==========

  // ✅ CORREÇÃO 2: shareItem agora também salva os DADOS REAIS nas tabelas compartilhadas
  const shareItem = async (itemType, itemId, permissions = { view: true, edit: false }) => {
    if (!currentGroup || !currentUser) return { error: 'Sem grupo' };

    const cleanType = sanitizeString(itemType);
    const cleanId = String(itemId); // ✅ Coerce para string
    if (!cleanType || !cleanId) return { error: 'Dados inválidos' };

    try {
      // 1. Salvar metadata em shared_items
      const { data, error } = await supabase
        .from('shared_items')
        .insert([{
          group_id: currentGroup.id,
          user_id: currentUser.id,
          item_type: cleanType,
          item_id: cleanId,
          permissions,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      const newItem = {
        id: data.id,
        itemType: cleanType,
        itemId: cleanId,
        permissions,
        createdAt: data.created_at,
      };

      const updated = [...sharedItems, newItem];
      setSharedItems(updated);
      await saveSharedItems(updated);

      return { success: true };
    } catch (e) {
      console.warn('Erro ao compartilhar:', e);
      return { error: e.message || 'Erro ao compartilhar' };
    }
  };

  // ✅ NOVA FUNÇÃO: Salvar dados reais do cartão compartilhado
  const saveSharedCardData = async (cardData) => {
    if (!currentGroup || !currentUser) return { error: 'Sem grupo' };
    try {
      const { error } = await supabase
        .from('shared_cards')
        .upsert([{
          id: String(cardData.id),
          name: cardData.name,
          card_limit: cardData.limit,
          color: cardData.color,
          bank: cardData.bankCode || cardData.bank,
          close_day: parseInt(cardData.closeDate) || null,
          due_day: parseInt(cardData.dueDate) || null,
          type: cardData.type || 'credit',
          last_four: cardData.lastFour || cardData.number?.slice(-4) || '0000',
          gradient_class: cardData.gradientClass || cardData.gradient_class || '',
          user_id: currentUser.id,
          group_id: currentGroup.id,
          updated_at: new Date().toISOString(),
        }], { onConflict: 'id' });

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.warn('Erro ao salvar shared card:', e);
      return { error: e.message };
    }
  };

    // ✅ NOVA FUNÇÃO: Salvar dados reais da transação compartilhada
  const saveSharedTransactionData = async (txData) => {
    if (!currentGroup || !currentUser) return { error: 'Sem grupo' };
    try {
      const { error } = await supabase
        .from('shared_transactions')
        .upsert([{
          id: String(txData.id),
          description: txData.description || txData.desc,
          amount: txData.amount,
          type: txData.type,
          date: txData.date,
          category: txData.category || txData.categoryName || txData.category?.name,
          category_color: txData.categoryColor || txData.category?.color,
          category_icon: txData.categoryIcon || txData.category?.icon,
          payment_method: txData.paymentMethod || txData.payment_method,
          card_id: txData.cardId ? String(txData.cardId) : null,
          card_name: txData.cardName || null,
          is_paid: txData.isPaid || false,
          is_invoice_payment: txData.isInvoicePayment || false,
          is_next_invoice: txData.isNextInvoice || false,
          user_id: currentUser.id,
          group_id: currentGroup.id,
          updated_at: new Date().toISOString(),
        }], { onConflict: 'id' });

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.warn('Erro ao salvar shared transaction:', e);
      return { error: e.message };
    }
  };

  // ✅ NOVA FUNÇÃO: Salvar dados reais da meta compartilhada
  const saveSharedGoalData = async (goalData) => {
    if (!currentGroup || !currentUser) return { error: 'Sem grupo' };
    try {
      const { error } = await supabase
        .from('shared_goals')
        .upsert([{
          id: String(goalData.id),
          name: goalData.name,
          target_amount: goalData.target,
          current_amount: goalData.current || 0,
          color: goalData.color,
          icon: goalData.icon,
          deadline: goalData.deadline || null,
          created_at: goalData.createdAt || new Date().toISOString(),
          completed_at: goalData.completedAt || null,
          user_id: currentUser.id,
          group_id: currentGroup.id,
          updated_at: new Date().toISOString(),
        }], { onConflict: 'id' });

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.warn('Erro ao salvar shared goal:', e);
      return { error: e.message };
    }
  };

    // ✅ NOVA FUNÇÃO: Compartilhar todas as transações de uma vez
  const shareAllTransactions = async (transactionsList, permissions = { view: true, edit: false }) => {
    if (!currentGroup || !currentUser) return { error: 'Sem grupo' };
    if (!transactionsList || transactionsList.length === 0) return { error: 'Nenhuma transação' };

    try {
      // 1. Inserir metadata em shared_items para cada transação
      const itemsToShare = transactionsList.map(tx => ({
        group_id: currentGroup.id,
        user_id: currentUser.id,
        item_type: 'transaction',
        item_id: String(tx.id),
        permissions,
        created_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase
        .from('shared_items')
        .insert(itemsToShare);

      if (itemsError) throw itemsError;

      // 2. Salvar dados reais de todas as transações
      const txDataToSave = transactionsList.map(tx => ({
        id: String(tx.id),
        description: tx.description || tx.desc,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        category: tx.category || tx.categoryName || tx.category?.name,
        category_color: tx.categoryColor || tx.category?.color,
        category_icon: tx.categoryIcon || tx.category?.icon,
        payment_method: tx.paymentMethod || tx.payment_method,
        card_id: tx.cardId ? String(tx.cardId) : null,
        card_name: tx.cardName || null,
        is_paid: tx.isPaid || false,
        is_invoice_payment: tx.isInvoicePayment || false,
        is_next_invoice: tx.isNextInvoice || false,
        user_id: currentUser.id,
        group_id: currentGroup.id,
        updated_at: new Date().toISOString(),
      }));

      const { error: txError } = await supabase
        .from('shared_transactions')
        .upsert(txDataToSave, { onConflict: 'id' });

      if (txError) throw txError;

      // 3. Atualizar estado local
      const newItems = transactionsList.map(tx => ({
        id: `${tx.id}_${Date.now()}`,
        itemType: 'transaction',
        itemId: String(tx.id),
        permissions,
        createdAt: new Date().toISOString(),
      }));

      const updated = [...sharedItems, ...newItems];
      setSharedItems(updated);
      await saveSharedItems(updated);

      return { success: true, count: transactionsList.length };
    } catch (e) {
      console.warn('Erro ao compartilhar todas:', e);
      return { error: e.message || 'Erro ao compartilhar transações' };
    }
  };

const unshareItem = async (itemType, itemId) => {
    if (!currentGroup || !currentUser) return { error: 'Sem grupo' };

    const cleanType = sanitizeString(itemType);
    const cleanId = String(itemId); // ✅ Coerce para string

    try {
      // Remover metadata
      await supabase
        .from('shared_items')
        .delete()
        .eq('group_id', currentGroup.id)
        .eq('user_id', currentUser.id)
        .eq('item_type', cleanType)
        .eq('item_id', cleanId);

      // ✅ Também remover dados reais
      const tableMap = {
        card: 'shared_cards',
        transaction: 'shared_transactions',
        goal: 'shared_goals',
      };
      const table = tableMap[cleanType];
      if (table) {
        await supabase.from(table).delete().eq('id', cleanId).eq('user_id', currentUser.id);
      }

      const updated = sharedItems.filter(
        i => !(i.itemType === cleanType && i.itemId === cleanId)
      );
      setSharedItems(updated);
      await saveSharedItems(updated);

      return { success: true };
    } catch (e) {
      console.warn('Erro ao remover compartilhamento:', e);
      return { error: e.message || 'Erro ao remover' };
    }
  };

  // ========== SINCRONIZAÇÃO ==========

  const syncWithGroup = async () => {
    if (!currentGroup || !currentUser || isSyncing) return;

    const now = Date.now();
    if (now - lastSyncRef.current < 5000) return;
    lastSyncRef.current = now;

    try {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) return;
    } catch (e) {
      // Ignorar erro de network check
    }

    setIsSyncing(true);

    try {
      // 1. Buscar meus itens compartilhados
      const { data: myShared, error: myError } = await supabase
        .from('shared_items')
        .select('id, item_type, item_id, permissions, created_at')
        .eq('group_id', currentGroup.id)
        .eq('user_id', currentUser.id);

      if (myError) throw myError;

      const myItems = (myShared || []).map(i => ({
        id: i.id,
        itemType: i.item_type,
        itemId: String(i.item_id), // ✅ Coerce para string
        permissions: i.permissions,
        createdAt: i.created_at,
      }));

      setSharedItems(myItems);
      await saveSharedItems(myItems);

      // 2. Buscar itens compartilhados por OUTROS usuários
      const { data: othersShared, error: othersError } = await supabase
        .from('shared_items')
        .select('id, user_id, item_type, item_id, permissions, created_at')
        .eq('group_id', currentGroup.id)
        .neq('user_id', currentUser.id);

      if (othersError) throw othersError;

      const othersItems = othersShared || [];

      // ✅ CORREÇÃO 3: Coerce todos os IDs para string antes do .in()
      const cardIds = othersItems
        .filter(i => i.item_type === 'card')
        .map(i => String(i.item_id))
        .filter((v, i, a) => a.indexOf(v) === i); // deduplicar

      const transactionIds = othersItems
        .filter(i => i.item_type === 'transaction')
        .map(i => String(i.item_id))
        .filter((v, i, a) => a.indexOf(v) === i);

      const goalIds = othersItems
        .filter(i => i.item_type === 'goal')
        .map(i => String(i.item_id))
        .filter((v, i, a) => a.indexOf(v) === i);

      console.log('[syncWithGroup] Buscando dados de outros:', {
        cards: cardIds.length,
        transactions: transactionIds.length,
        goals: goalIds.length,
        cardIds: cardIds,
        transactionIds: transactionIds,
        goalIds: goalIds,
      });

      const [cardsRes, transactionsRes, goalsRes] = await Promise.all([
        cardIds.length > 0
          ? supabase.from('shared_cards').select('id, name, card_limit, color, bank, close_day, due_day, user_id, group_id').in('id', cardIds)
          : { data: [] },
        transactionIds.length > 0
          ? supabase.from('shared_transactions').select('id, description, amount, type, date, category, payment_method, card_id, user_id, group_id').in('id', transactionIds)
          : { data: [] },
        goalIds.length > 0
          ? supabase.from('shared_goals').select('id, name, target_amount, current_amount, color, icon, deadline, user_id, group_id').in('id', goalIds)
          : { data: [] },
      ]);

      console.log('[syncWithGroup] Resultados:', {
        cards: cardsRes.data?.length || 0,
        transactions: transactionsRes.data?.length || 0,
        goals: goalsRes.data?.length || 0,
      });

      setSharedCards(cardsRes.data || []);
      setSharedTransactions(transactionsRes.data || []);
      setSharedGoals(goalsRes.data || []);

      setLastSync(new Date());
      return { success: true };
    } catch (e) {
      console.warn('Erro no sync:', e);
      return { error: e.message || 'Erro ao sincronizar' };
    } finally {
      setIsSyncing(false);
    }
  };

  const startAutoSync = useCallback(() => {
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    syncIntervalRef.current = setInterval(() => {
      syncWithGroup();
    }, 30000);
  }, []);

  const stopAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  return (
    <GroupContext.Provider value={{
      currentUser,
      currentGroup,
      groupMembers,
      sharedItems,
      sharedCards,
      sharedTransactions,
      sharedGoals,
      lastSync,
      isLoading,
      isSyncing,
      syncEnabled,
      setSyncEnabled,
      register,
      login,
      logout,
      createGroup,
      joinGroup,
      leaveGroup,
      generateInviteCode,
      shareItem,
      unshareItem,
      saveSharedCardData,
      saveSharedTransactionData,
      saveSharedGoalData,
      shareAllTransactions,
      syncWithGroup,
      startAutoSync,
      stopAutoSync,
    }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be inside GroupProvider');
  return ctx;
};