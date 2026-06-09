import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const CashContext = createContext();

const STORAGE_KEYS = {
  CASH_BALANCE: '@cash_balance',
  CASH_TRANSACTIONS: '@cash_transactions',
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

export function CashProvider({ children }) {
  const [cashBalance, setCashBalance] = useState(0);
  const [cashTransactions, setCashTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) saveData(); }, [cashBalance, cashTransactions]);

  const loadData = async () => {
    try {
      const [storedCash, storedTx] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CASH_BALANCE),
        AsyncStorage.getItem(STORAGE_KEYS.CASH_TRANSACTIONS),
      ]);
      if (storedCash !== null) setCashBalance(parseFloat(storedCash));
      if (storedTx !== null) setCashTransactions(JSON.parse(storedTx));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CASH_BALANCE, cashBalance.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.CASH_TRANSACTIONS, JSON.stringify(cashTransactions)),
      ]);
    } catch (e) { console.error(e); }
  };

  const addCashTransaction = useCallback((amount, type = 'income', transactionData = {}) => {
    let numAmount;
    if (typeof amount === 'string') {
      numAmount = parseFloat(amount);
    } else if (typeof amount === 'number') {
      numAmount = amount;
    } else {
      console.error('[CashContext] Tipo de amount inválido:', typeof amount);
      return null;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      console.error('[CashContext] Valor inválido:', numAmount, 'do input:', amount);
      return null;
    }

    const newBalance = type === 'income'
      ? cashBalance + numAmount
      : cashBalance - numAmount;

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

    return transaction;
  }, [cashBalance]);

  const updateCashTransaction = useCallback((id, updates) => {
    const transaction = cashTransactions.find(t => t.id === id);
    if (!transaction) {
      console.error('[CashContext] Transação não encontrada:', id);
      return null;
    }

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

    const newBalance = cashBalance + amountDiff;

    setCashBalance(newBalance);
    setCashTransactions(updatedTransactions);

    return updatedTransaction;
  }, [cashBalance, cashTransactions]);

  const deleteCashTransaction = useCallback((id) => {
    const transaction = cashTransactions.find(t => t.id === id);
    if (!transaction) {
      console.error('[CashContext] Transação não encontrada:', id);
      return false;
    }

    const newBalance = transaction.type === 'income'
      ? cashBalance - transaction.amount
      : cashBalance + transaction.amount;

    setCashBalance(newBalance);
    setCashTransactions(prev => prev.filter(t => t.id !== id));

    return true;
  }, [cashBalance, cashTransactions]);

  const clearCash = useCallback(async () => {
    setCashBalance(0);
    setCashTransactions([]);
    // Garantir que o AsyncStorage também seja limpo
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CASH_BALANCE, '0'),
        AsyncStorage.setItem(STORAGE_KEYS.CASH_TRANSACTIONS, JSON.stringify([])),
      ]);
    } catch (e) { console.error('Error clearing cash storage:', e); }
  }, []);

  const value = {
    cashBalance,
    cashTransactions,
    loading,
    addCashTransaction,
    updateCashTransaction,
    deleteCashTransaction,
    clearCash,
  };

  return <CashContext.Provider value={value}>{children}</CashContext.Provider>;
}

export function useCash() {
  const context = useContext(CashContext);
  if (!context) throw new Error('useCash must be inside CashProvider');
  return context;
}
