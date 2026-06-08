import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { safeGetItem, safeSetItem, STORAGE_KEYS } from '../utils/SafeStorage';
import * as Crypto from 'expo-crypto';

const PlanningContext = createContext();

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
  const [cashBalance, setCashBalance] = useState(0);
  const [cashTransactions, setCashTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) saveData(); }, [cashBalance, cashTransactions, goals]);

  const loadData = async () => {
    try {
      const [storedCash, storedCashTx, storedGoals] = await Promise.all([
        safeGetItem(STORAGE_KEYS.CASH_BALANCE, 0),
        safeGetItem(STORAGE_KEYS.CASH_TRANSACTIONS, []),
        safeGetItem(STORAGE_KEYS.GOALS, []),
      ]);
      if (storedCash) setCashBalance(parseFloat(storedCash));
      if (storedCashTx) setCashTransactions(storedCashTx);
      if (storedGoals) setGoals(storedGoals);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        safeSetItem(STORAGE_KEYS.CASH_BALANCE, cashBalance),
        safeSetItem(STORAGE_KEYS.CASH_TRANSACTIONS, cashTransactions),
        safeSetItem(STORAGE_KEYS.GOALS, goals),
      ]);
    } catch (e) { console.error(e); }
  };

  const updateCashBalance = (amount) => {
    const parsed = parseFloat(amount);
    if (!isNaN(parsed) && parsed >= 0) {
      setCashBalance(Math.min(parsed, 999999.99));
    }
  };

  const addCashTransaction = useCallback((amount, type = 'income', transactionData = {}) => {
    console.log('[PlanningContext] addCashTransaction chamado:', { amount, type, transactionData });

    let numAmount;
    if (typeof amount === 'string') {
      numAmount = parseFloat(amount);
    } else if (typeof amount === 'number') {
      numAmount = amount;
    } else {
      console.error('[PlanningContext] Tipo de amount inválido:', typeof amount);
      return null;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      console.error('[PlanningContext] Valor inválido:', numAmount, 'do input:', amount);
      return null;
    }

    const newBalance = type === 'income'
      ? cashBalance + numAmount
      : cashBalance - numAmount;

    console.log('[PlanningContext] Atualizando caixa:', {
      previousBalance: cashBalance,
      newBalance,
      type,
      amount: numAmount,
    });

    const transaction = {
      id: generateUUID(),
      amount: numAmount,
      type,
      description: transactionData.description || (type === 'income' ? 'Entrada de caixa' : 'Saída de caixa'),
      date: transactionData.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      ...transactionData,
    };

    setCashBalance(newBalance);
    setCashTransactions(prev => [transaction, ...prev]);

    console.log('[PlanningContext] Transação criada:', transaction);
    return transaction;
  }, [cashBalance]);

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

  const updateCashTransaction = useCallback((id, updates) => {
    console.log('[PlanningContext] updateCashTransaction:', { id, updates });

    const transaction = cashTransactions.find(t => t.id === id);
    if (!transaction) {
      console.error('[PlanningContext] Transação não encontrada:', id);
      return null;
    }

    // Calcular diferença no valor para ajustar o saldo
    const oldAmount = transaction.amount;
    const newAmount = updates.amount ? parseFloat(updates.amount) : oldAmount;
    const amountDiff = newAmount - oldAmount;

    const updatedTransaction = {
      ...transaction,
      ...updates,
      amount: newAmount,
      updatedAt: new Date().toISOString(),
    };

    const updatedTransactions = cashTransactions.map(t => 
      t.id === id ? updatedTransaction : t
    );

    // Ajustar saldo se o valor mudou
    const newBalance = cashBalance + amountDiff;

    console.log('[PlanningContext] Atualizando transação:', {
      oldAmount,
      newAmount,
      amountDiff,
      newBalance,
    });

    setCashBalance(newBalance);
    setCashTransactions(updatedTransactions);

    return updatedTransaction;
  }, [cashBalance, cashTransactions]);

  const deleteCashTransaction = useCallback((id) => {
    console.log('[PlanningContext] deleteCashTransaction:', id);

    const transaction = cashTransactions.find(t => t.id === id);
    if (!transaction) {
      console.error('[PlanningContext] Transação não encontrada:', id);
      return false;
    }

    // Reverter o valor do saldo
    const newBalance = transaction.type === 'income'
      ? cashBalance - transaction.amount
      : cashBalance + transaction.amount;

    console.log('[PlanningContext] Deletando transação:', {
      transaction,
      newBalance,
    });

    setCashBalance(newBalance);
    setCashTransactions(prev => prev.filter(t => t.id !== id));

    return true;
  }, [cashBalance, cashTransactions]);

  const value = {
    cashBalance,
    cashTransactions,
    goals,
    loading,
    updateCashBalance,
    addCashTransaction,
    updateCashTransaction,
    deleteCashTransaction,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoalComplete,
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
