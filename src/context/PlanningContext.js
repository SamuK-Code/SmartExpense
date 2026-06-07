import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const PlanningContext = createContext();

// Função segura para gerar UUID com fallback
const generateUUID = () => {
  try {
    if (Crypto && Crypto.randomUUID) {
      return Crypto.randomUUID();
    }
  } catch (e) {
    console.log('expo-crypto não disponível, usando fallback');
  }

  // Fallback manual (UUID v4)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export function PlanningProvider({ children }) {
  const [cashBalance, setCashBalance] = useState(0);  // Valor em caixa
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) saveData(); }, [cashBalance, goals]);

  const loadData = async () => {
    try {
      const [storedCash, storedGoals] = await Promise.all([
        AsyncStorage.getItem('@cashBalance'),
        AsyncStorage.getItem('@goals'),
      ]);
      if (storedCash) setCashBalance(parseFloat(storedCash));
      if (storedGoals) setGoals(JSON.parse(storedGoals));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('@cashBalance', cashBalance.toString()),
        AsyncStorage.setItem('@goals', JSON.stringify(goals)),
      ]);
    } catch (e) { console.error(e); }
  };

  const updateCashBalance = (amount) => setCashBalance(parseFloat(amount) || 0);

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

  // Check if goal is achievable with current cash balance
  const checkGoalFeasibility = (goalAmount, cashBalance, monthlyExpenses) => {
    const availableAfterExpenses = cashBalance - monthlyExpenses;

    if (cashBalance <= 0) return { feasible: false, reason: 'Sem dinheiro em caixa', severity: 'danger' };
    if (goalAmount > cashBalance) return { feasible: false, reason: 'Valor em caixa insuficiente', severity: 'danger' };
    if (goalAmount > availableAfterExpenses * 0.8) return { feasible: true, warning: true, reason: 'Compra possivel mas compromete caixa', severity: 'warning' };
    return { feasible: true, warning: false, reason: 'Compra tranquila!', severity: 'success' };
  };

  // Calculate how much you can spend daily/weekly based on cash
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
    cashBalance, goals, loading,
    updateCashBalance, addGoal, updateGoal, deleteGoal, toggleGoalComplete,
    checkGoalFeasibility, calculateDailyBudget,
  };

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
}

export function usePlanning() {
  const context = useContext(PlanningContext);
  if (!context) throw new Error('usePlanning must be inside PlanningProvider');
  return context;
}
