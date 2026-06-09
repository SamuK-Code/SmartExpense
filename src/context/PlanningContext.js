import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

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

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) saveData(); }, [goals]);

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
    const newGoal = { id: generateUUID(), ...goal, createdAt: new Date().toISOString() };
    setGoals(prev => [newGoal, ...prev]);
  };

  const updateGoal = (id, updates) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGoal = (id) => setGoals(prev => prev.filter(g => g.id !== id));

  const toggleGoalComplete = (id) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed, completedAt: !g.completed ? new Date().toISOString() : null } : g));
  };

  const clearGoals = useCallback(() => {
    setGoals([]);
  }, []);

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
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoalComplete,
    clearGoals,
    checkGoalFeasibility,
    calculateDailyBudget,
  };

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
}

export function usePlanning() {
  const context = useContext(PlanningContext);
  if (!context) throw new Error('usePlanning must be inside PlanningProvider');
  return context;
}
