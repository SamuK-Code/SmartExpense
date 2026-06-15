import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import SupabaseService from '../services/SupabaseService';

const PlanningContext = createContext();

const STORAGE_KEYS = {
  GOALS: '@goals',
};

const generateUUID = () => {
  try {
    if (Crypto && Crypto.randomUUID) {
      return Crypto.randomUUID();
    }
  } catch (e) {
    console.log('expo-crypto não disponível, usando fallback');
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export function PlanningProvider({ children }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // ========== NOVO: Auth e Group ==========
  const { user } = useAuth();
  const { activeGroup } = useGroup();

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) saveData(); }, [goals]);

  // ========== NOVO: Sync com grupo ==========
  const syncWithGroup = useCallback(async () => {
    if (!activeGroup || !user) return;

    setIsSyncing(true);
    try {
      // Goals são armazenadas como JSON no Supabase
      // Usamos a tabela group_expenses com um flag especial
      const goalData = goals.map(g => ({
        ...g,
        _type: 'goal',
      }));

      await SupabaseService.syncExpenses(activeGroup.id, goalData, user.id);

      // Busca dados atualizados
      const result = await SupabaseService.fetchGroupData(activeGroup.id);
      if (result.success && result.data.expenses) {
        const remoteGoals = result.data.expenses.filter(e => e._type === 'goal');
        if (remoteGoals.length > 0) {
          const merged = mergeGoals(goals, remoteGoals);
          setGoals(merged);
          await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(merged));
        }
      }
    } catch (error) {
      console.error('[PlanningContext] Erro no sync:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [activeGroup, user, goals]);

  // Helper: mescla goals mantendo o mais recente
  const mergeGoals = (local, remote) => {
    const map = new Map();
    local.forEach(g => map.set(g.id, g));
    remote.forEach(g => {
      if (g._type !== 'goal') return;
      const cleanGoal = { ...g };
      delete cleanGoal._type;
      const existing = map.get(g.id);
      if (!existing || (g.updatedAt && existing.updatedAt < g.updatedAt)) {
        map.set(g.id, cleanGoal);
      }
    });
    return Array.from(map.values());
  };

  // Sync quando muda o grupo ativo
  useEffect(() => {
    if (activeGroup && user && !loading) {
      syncWithGroup();
    }
  }, [activeGroup?.id]);

  const loadData = async () => {
    try {
      const storedGoals = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
      if (storedGoals !== null) setGoals(JSON.parse(storedGoals));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) { console.error(e); }
  };

  const addGoal = (goal) => {
    const newGoal = { 
      id: generateUUID(), 
      ...goal, 
      createdAt: new Date().toISOString(),
      updatedAt: Date.now(),
    };
    setGoals(prev => [newGoal, ...prev]);
    setTimeout(() => syncWithGroup(), 100);
  };

  const updateGoal = (id, updates) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates, updatedAt: Date.now() } : g));
    setTimeout(() => syncWithGroup(), 100);
  };

  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    setTimeout(() => syncWithGroup(), 100);
  };

  const toggleGoalComplete = (id) => {
    setGoals(prev => prev.map(g => g.id === id ? { 
      ...g, 
      completed: !g.completed, 
      completedAt: !g.completed ? new Date().toISOString() : null,
      updatedAt: Date.now(),
    } : g));
    setTimeout(() => syncWithGroup(), 100);
  };

  const clearGoals = useCallback(() => {
    setGoals([]);
    setTimeout(() => syncWithGroup(), 100);
  }, [syncWithGroup]);

  const checkGoalFeasibility = (goalAmount, cashBalance, monthlyExpenses) => {
    const availableAfterExpenses = cashBalance - monthlyExpenses;
    if (cashBalance <= 0) return { feasible: false, reason: 'Sem dinheiro em caixa', severity: 'danger' };
    if (goalAmount > cashBalance) return { feasible: false, reason: 'Valor em caixa insuficiente', severity: 'danger' };
    if (goalAmount > availableAfterExpenses * 0.8) return { feasible: true, warning: true, reason: 'Compra possivel mas compromete caixa', severity: 'warning' };
    return { feasible: true, warning: false, reason: 'Compra tranquila!', severity: 'success' };
  };

  const calculateDailyBudget = (cashBalance, monthlyExpenses) => {
    const remaining = cashBalance - monthlyExpenses;
    if (remaining <= 0) return { daily: 0, weekly: 0, message: 'Sem margem para gastos' };
    const daysInMonth = 30;
    return {
      daily: remaining / daysInMonth,
      weekly: (remaining / daysInMonth) * 7,
      message: 'Margem disponivel',
    };
  };

  const value = {
    goals,
    loading,
    isSyncing,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoalComplete,
    clearGoals,
    checkGoalFeasibility,
    calculateDailyBudget,
    syncWithGroup,
  };

  return (
    <PlanningContext.Provider value={value}>
      {children}
    </PlanningContext.Provider>
  );
}

export function usePlanning() {
  const context = useContext(PlanningContext);
  if (!context) throw new Error('usePlanning must be inside PlanningProvider');
  return context;
}
