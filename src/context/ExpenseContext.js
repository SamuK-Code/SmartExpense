import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import SupabaseService from '../services/SupabaseService';

const ExpenseContext = createContext();

const STORAGE_KEYS = {
  EXPENSES: '@expenses',
  CARDS: '@cards',
  CATEGORIES: '@categories',
  CASH_TRANSACTIONS: '@cash_transactions',
};

const DEFAULT_CATEGORIES = [
  { id: 'cat-food', name: 'Alimentação', color: '#FF6B6B', icon: 'restaurant' },
  { id: 'cat-transport', name: 'Transporte', color: '#4ECDC4', icon: 'car' },
  { id: 'cat-leisure', name: 'Lazer', color: '#45B7D1', icon: 'game-controller' },
  { id: 'cat-health', name: 'Saúde', color: '#96CEB4', icon: 'medical' },
  { id: 'cat-housing', name: 'Moradia', color: '#FFEAA7', icon: 'home' },
  { id: 'cat-education', name: 'Educação', color: '#DDA0DD', icon: 'school' },
  { id: 'cat-shopping', name: 'Compras', color: '#98D8C8', icon: 'cart' },
  { id: 'cat-others', name: 'Outros', color: '#F7DC6F', icon: 'ellipsis-horizontal' },
];

let _idCounter = 0;
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  const counter = (_idCounter++ % 1000).toString(36);
  return timestamp + random + counter;
};

const initialState = {
  expenses: [],
  cards: [],
  categories: [],
  cashTransactions: [],
  alerts: [],
};

function expenseReducer(state, action) {
  switch (action.type) {
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.payload, ...state.expenses] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(e => e.id === action.payload.id ? action.payload : e),
      };
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };
    case 'TOGGLE_EXPENSE_PAID':
      return {
        ...state,
        expenses: state.expenses.map(e => e.id === action.payload ? { ...e, paid: !e.paid } : e),
      };
    case 'SET_CARDS':
      return { ...state, cards: action.payload };
    case 'ADD_CARD':
      return { ...state, cards: [...state.cards, action.payload] };
    case 'UPDATE_CARD':
      return {
        ...state,
        cards: state.cards.map(c => c.id === action.payload.id ? action.payload : c),
      };
    case 'DELETE_CARD':
      return { ...state, cards: state.cards.filter(c => c.id !== action.payload) };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c),
      };
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
    case 'SET_CASH_TRANSACTIONS':
      return { ...state, cashTransactions: action.payload };
    case 'ADD_CASH_TRANSACTION':
      return { ...state, cashTransactions: [action.payload, ...state.cashTransactions] };
    case 'UPDATE_CASH_TRANSACTION':
      return {
        ...state,
        cashTransactions: state.cashTransactions.map(t => t.id === action.payload.id ? action.payload : t),
      };
    case 'DELETE_CASH_TRANSACTION':
      return { ...state, cashTransactions: state.cashTransactions.filter(t => t.id !== action.payload) };
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };
    case 'DISMISS_ALERT':
      return { ...state, alerts: state.alerts.filter(a => a.id !== action.payload) };
    case 'CLEAR_ALL_DATA':
      return { ...initialState };
    case 'GENERATE_BILL': {
      const { billExpense, cardId } = action.payload;
      return {
        ...state,
        expenses: [billExpense, ...state.expenses],
        cards: state.cards.map(c => c.id === cardId ? {
          ...c,
          isPaused: true,
          currentBillAmount: billExpense.amount,
          lastBillDate: billExpense.date,
        } : c),
      };
    }
    case 'PAY_BILL': {
      const { expenseId, cardId } = action.payload;
      return {
        ...state,
        expenses: state.expenses.map(e => e.id === expenseId ? { ...e, paid: true } : e),
        cards: state.cards.map(c => c.id === cardId ? {
          ...c,
          isPaused: false,
          currentBillAmount: 0,
        } : c),
      };
    }
    default:
      return state;
  }
}

export function ExpenseProvider({ children }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // ========== NOVO: Hooks de Auth e Group ==========
  const { user, isAuthenticated } = useAuth();
  const { activeGroup, addSyncListener } = useGroup();

  // Carregar dados do AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const [expensesData, cardsData, categoriesData, cashData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
          AsyncStorage.getItem(STORAGE_KEYS.CARDS),
          AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES),
          AsyncStorage.getItem(STORAGE_KEYS.CASH_TRANSACTIONS),
        ]);

        if (expensesData) {
          let parsed = JSON.parse(expensesData);
          const seen = new Set();
          const deduped = parsed.filter(item => {
            if (!item.id || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });

          let needsMigration = false;
          const allCategories = [...DEFAULT_CATEGORIES, ...(categoriesData ? JSON.parse(categoriesData) : [])];
          const migrated = deduped.map(item => {
            if (!item.categoryIcon || !item.categoryColor) {
              needsMigration = true;
              const cat = allCategories.find(c => c.id === item.category);
              if (cat) {
                return { ...item, categoryIcon: cat.icon, categoryColor: cat.color, categoryName: cat.name };
              }
            }
            return item;
          });

          if (needsMigration || deduped.length !== parsed.length) {
            await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(migrated));
          }
          dispatch({ type: 'SET_EXPENSES', payload: migrated });
        }
        if (cardsData) dispatch({ type: 'SET_CARDS', payload: JSON.parse(cardsData) });

        if (categoriesData) {
          dispatch({ type: 'SET_CATEGORIES', payload: JSON.parse(categoriesData) });
        } else {
          dispatch({ type: 'SET_CATEGORIES', payload: DEFAULT_CATEGORIES });
          await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        }

        if (cashData) dispatch({ type: 'SET_CASH_TRANSACTIONS', payload: JSON.parse(cashData) });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ========== NOVO: Sincronização com Supabase ==========
  const syncWithGroup = useCallback(async () => {
    if (!activeGroup || !user) return;

    setIsSyncing(true);
    try {
      const result = await SupabaseService.fullSync(
        activeGroup.id,
        {
          expenses: state.expenses,
          categories: state.categories,
          cards: state.cards,
          cashTransactions: state.cashTransactions,
        },
        user.id
      );

      if (result.success && result.data) {
        // Mescla dados recebidos com os locais
        if (result.data.expenses?.length > 0) {
          const merged = mergeData(state.expenses, result.data.expenses);
          dispatch({ type: 'SET_EXPENSES', payload: merged });
          await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(merged));
        }
        if (result.data.categories?.length > 0) {
          const merged = mergeData(state.categories, result.data.categories);
          dispatch({ type: 'SET_CATEGORIES', payload: merged });
          await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(merged));
        }
        if (result.data.cards?.length > 0) {
          const merged = mergeData(state.cards, result.data.cards);
          dispatch({ type: 'SET_CARDS', payload: merged });
          await AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(merged));
        }
        if (result.data.cashTransactions?.length > 0) {
          const merged = mergeData(state.cashTransactions, result.data.cashTransactions);
          dispatch({ type: 'SET_CASH_TRANSACTIONS', payload: merged });
          await AsyncStorage.setItem(STORAGE_KEYS.CASH_TRANSACTIONS, JSON.stringify(merged));
        }
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [activeGroup, user, state.expenses, state.categories, state.cards, state.cashTransactions]);

  // Helper: mescla dados mantendo o mais recente
  const mergeData = (local, remote) => {
    const map = new Map();
    local.forEach(item => map.set(item.id, item));
    remote.forEach(item => {
      const existing = map.get(item.id);
      if (!existing || (item.updatedAt && existing.updatedAt < item.updatedAt)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  };

  // Escuta eventos de sync do GroupContext
  useEffect(() => {
    if (!addSyncListener) return;
    const unsubscribe = addSyncListener((event) => {
      if (event.type === 'data_received') {
        // Dados recebidos via outro mecanismo (Bluetooth, etc)
        if (event.data.expenses) {
          const merged = mergeData(state.expenses, event.data.expenses);
          dispatch({ type: 'SET_EXPENSES', payload: merged });
        }
      }
    });
    return unsubscribe;
  }, [addSyncListener, state.expenses]);

  // Auto-sync quando muda o grupo ativo
  useEffect(() => {
    if (activeGroup && user) {
      syncWithGroup();
    }
  }, [activeGroup?.id]);

  useEffect(() => {
    if (!loading && state.cards.length > 0) {
      checkDueDates();
    }
  }, [loading, state.cards.length]);

  const saveData = useCallback(async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, []);

  // ========== TODAS AS FUNÇÕES EXISTENTES + SYNC ==========

  const generateBill = useCallback((cardId) => {
    const card = state.cards.find(c => c.id === cardId);
    if (!card || !card.dueDate) return;

    const cardExpenses = state.expenses.filter(
      e => e.cardId === cardId && !e.paid && !e.isBill && !e.billed
    );
    const total = cardExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    if (total <= 0) return;

    const billExpense = {
      id: generateId(),
      amount: total,
      description: `Fatura ${card.customName || card.name}`,
      category: 'cat-others',
      cardId: null,
      parentCardId: cardId,
      isBill: true,
      paid: false,
      billed: false,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    const updatedExpenses = state.expenses.map(e =>
      e.cardId === cardId && !e.paid && !e.isBill ? { ...e, billed: true } : e
    );

    const updatedCards = state.cards.map(c =>
      c.id === cardId ? {
        ...c,
        isPaused: true,
        currentBillAmount: total,
        lastBillDate: billExpense.date,
      } : c
    );

    dispatch({ type: 'GENERATE_BILL', payload: { billExpense, cardId } });
    saveData(STORAGE_KEYS.EXPENSES, [billExpense, ...updatedExpenses]);
    saveData(STORAGE_KEYS.CARDS, updatedCards);

    // Sync após gerar fatura
    syncWithGroup();
  }, [state.cards, state.expenses, saveData, syncWithGroup]);

  const checkDueDates = useCallback(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    state.cards.forEach(card => {
      if (!card.dueDate || card.isPaused) return;

      if (card.dueDate === currentDay) {
        const lastBill = card.lastBillDate ? new Date(card.lastBillDate) : null;
        const alreadyGenerated = lastBill &&
          lastBill.getMonth() === currentMonth &&
          lastBill.getFullYear() === currentYear;

        if (!alreadyGenerated) {
          generateBill(card.id);
        }
      }
    });
  }, [state.cards, generateBill]);

  const payBill = useCallback((expenseId) => {
    const billExpense = state.expenses.find(e => e.id === expenseId);
    if (!billExpense || !billExpense.isBill) return false;

    const cardId = billExpense.parentCardId;
    const updatedExpenses = state.expenses.map(e => e.id === expenseId ? { ...e, paid: true } : e);
    const updatedCards = state.cards.map(c =>
      c.id === cardId ? { ...c, isPaused: false, currentBillAmount: 0 } : c
    );

    dispatch({ type: 'PAY_BILL', payload: { expenseId, cardId } });
    saveData(STORAGE_KEYS.EXPENSES, updatedExpenses);
    saveData(STORAGE_KEYS.CARDS, updatedCards);
    syncWithGroup();
    return true;
  }, [state.expenses, state.cards, saveData, syncWithGroup]);

  // ========== EXPENSES COM SYNC ==========
  const addExpense = useCallback((expense) => {
    if (expense.cardId) {
      const card = state.cards.find(c => c.id === expense.cardId);
      if (card && card.isPaused) {
        return { success: false, error: 'CARD_PAUSED', cardName: card.customName || card.name };
      }
    }

    const newExpense = {
      ...expense,
      id: generateId(),
      paid: false,
      billed: false,
      isBill: false,
      originalAmount: expense.amount,
      createdAt: new Date().toISOString(),
      updatedAt: Date.now(),
    };
    const updated = [newExpense, ...state.expenses];
    dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
    saveData(STORAGE_KEYS.EXPENSES, updated);

    // Sincroniza com o grupo
    syncWithGroup();

    return { success: true, expense: newExpense };
  }, [state.expenses, state.cards, saveData, syncWithGroup]);

  const updateExpense = useCallback((id, updates) => {
    const updated = state.expenses.map(e => e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e);
    dispatch({ type: 'SET_EXPENSES', payload: updated });
    saveData(STORAGE_KEYS.EXPENSES, updated);
    syncWithGroup();
  }, [state.expenses, saveData, syncWithGroup]);

  const deleteExpense = useCallback((id) => {
    const filtered = state.expenses.filter(e => e.id !== id);
    dispatch({ type: 'DELETE_EXPENSE', payload: id });
    saveData(STORAGE_KEYS.EXPENSES, filtered);
    syncWithGroup();
  }, [state.expenses, saveData, syncWithGroup]);

  const toggleExpensePaid = useCallback((id) => {
    const updated = state.expenses.map(e => e.id === id ? { ...e, paid: !e.paid, updatedAt: Date.now() } : e);
    dispatch({ type: 'SET_EXPENSES', payload: updated });
    saveData(STORAGE_KEYS.EXPENSES, updated);
    syncWithGroup();
  }, [state.expenses, saveData, syncWithGroup]);

  // ========== CARDS COM SYNC ==========
  const addCard = useCallback((card) => {
    const newCard = {
      ...card,
      id: generateId(),
      isPaused: false,
      currentBillAmount: 0,
      lastBillDate: null,
      updatedAt: Date.now(),
    };
    const updated = [...state.cards, newCard];
    dispatch({ type: 'ADD_CARD', payload: newCard });
    saveData(STORAGE_KEYS.CARDS, updated);
    syncWithGroup();
  }, [state.cards, saveData, syncWithGroup]);

  const updateCard = useCallback((id, updates) => {
    const updated = state.cards.map(c => c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c);
    dispatch({ type: 'SET_CARDS', payload: updated });
    saveData(STORAGE_KEYS.CARDS, updated);
    syncWithGroup();
  }, [state.cards, saveData, syncWithGroup]);

  const deleteCard = useCallback((id) => {
    const filtered = state.cards.filter(c => c.id !== id);
    dispatch({ type: 'DELETE_CARD', payload: id });
    saveData(STORAGE_KEYS.CARDS, filtered);
    syncWithGroup();
  }, [state.cards, saveData, syncWithGroup]);

  // ========== CATEGORIES COM SYNC ==========
  const addCategory = useCallback((category) => {
    const newCategory = { ...category, id: generateId(), updatedAt: Date.now() };
    const updated = [...state.categories, newCategory];
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    saveData(STORAGE_KEYS.CATEGORIES, updated);
    syncWithGroup();
  }, [state.categories, saveData, syncWithGroup]);

  const updateCategory = useCallback((id, updates) => {
    const updated = state.categories.map(c => c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c);
    dispatch({ type: 'SET_CATEGORIES', payload: updated });
    saveData(STORAGE_KEYS.CATEGORIES, updated);
    syncWithGroup();
  }, [state.categories, saveData, syncWithGroup]);

  const deleteCategory = useCallback((id) => {
    const filtered = state.categories.filter(c => c.id !== id);
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
    saveData(STORAGE_KEYS.CATEGORIES, filtered);
    syncWithGroup();
  }, [state.categories, saveData, syncWithGroup]);

  // ========== CASH TRANSACTIONS COM SYNC ==========
  const addCashTransaction = useCallback((amount, description) => {
    const newTransaction = {
      id: generateId(),
      amount,
      description,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: Date.now(),
    };
    const updated = [newTransaction, ...state.cashTransactions];
    dispatch({ type: 'ADD_CASH_TRANSACTION', payload: newTransaction });
    saveData(STORAGE_KEYS.CASH_TRANSACTIONS, updated);
    syncWithGroup();
    return newTransaction;
  }, [state.cashTransactions, saveData, syncWithGroup]);

  const updateCashTransaction = useCallback((id, updates) => {
    const updated = state.cashTransactions.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t);
    dispatch({ type: 'SET_CASH_TRANSACTIONS', payload: updated });
    saveData(STORAGE_KEYS.CASH_TRANSACTIONS, updated);
    syncWithGroup();
  }, [state.cashTransactions, saveData, syncWithGroup]);

  const deleteCashTransaction = useCallback((id) => {
    const filtered = state.cashTransactions.filter(t => t.id !== id);
    dispatch({ type: 'DELETE_CASH_TRANSACTION', payload: id });
    saveData(STORAGE_KEYS.CASH_TRANSACTIONS, filtered);
    syncWithGroup();
  }, [state.cashTransactions, saveData, syncWithGroup]);

  // ========== CLEAR ALL ==========
  const clearAllData = useCallback(async () => {
    dispatch({ type: 'CLEAR_ALL_DATA' });
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([])),
        AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify([])),
        AsyncStorage.setItem(STORAGE_KEYS.CASH_TRANSACTIONS, JSON.stringify([])),
        AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES)),
      ]);
      dispatch({ type: 'SET_CATEGORIES', payload: DEFAULT_CATEGORIES });
      syncWithGroup();
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }, [syncWithGroup]);

  // ========== ALERTS ==========
  const addAlert = useCallback((alert) => {
    dispatch({ type: 'SET_ALERTS', payload: [...state.alerts, alert] });
  }, [state.alerts]);

  const dismissAlert = useCallback((id) => {
    dispatch({ type: 'DISMISS_ALERT', payload: id });
  }, []);

  // ========== FILTERS ==========
  const getFilteredExpenses = useCallback((period) => {
    const now = new Date();
    return state.expenses.filter(e => {
      const d = new Date(e.date);
      if (period === 'today') return d.toDateString() === now.toDateString();
      if (period === 'week') return d >= new Date(now - 7 * 24 * 60 * 60 * 1000);
      if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === 'year') return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [state.expenses]);

  const getMonthlyTotal = useCallback((expenses) => {
    return expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  }, []);

  const getTotalByCategory = useCallback((expenses) => {
    return expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
      return acc;
    }, {});
  }, []);

  const getTotalByCard = useCallback((expenses) => {
    return expenses.reduce((acc, e) => {
      const key = e.cardId || 'no-card';
      acc[key] = (acc[key] || 0) + parseFloat(e.amount);
      return acc;
    }, {});
  }, []);

  const getExpensesByMonth = useCallback(() => {
    return state.expenses.reduce((acc, e) => {
      const month = new Date(e.date).toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + parseFloat(e.amount);
      return acc;
    }, {});
  }, [state.expenses]);

  const getCardUsage = useCallback((cardId) => {
    return state.expenses
      .filter(e => e.cardId === cardId && !e.billed && !e.isBill)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  }, [state.expenses]);

  const getCardBillAmount = useCallback((cardId) => {
    const card = state.cards.find(c => c.id === cardId);
    return card ? card.currentBillAmount || 0 : 0;
  }, [state.cards]);

  const isCardPaused = useCallback((cardId) => {
    const card = state.cards.find(c => c.id === cardId);
    return card ? card.isPaused || false : false;
  }, [state.cards]);

  const CATEGORIES = state.categories.length > 0 ? state.categories : DEFAULT_CATEGORIES;

  const value = {
    expenses: state.expenses,
    cards: state.cards,
    categories: state.categories,
    cashTransactions: state.cashTransactions,
    alerts: state.alerts,
    loading,
    isSyncing,
    CATEGORIES,
    addExpense,
    updateExpense,
    deleteExpense,
    toggleExpensePaid,
    addCard,
    updateCard,
    deleteCard,
    addCategory,
    updateCategory,
    deleteCategory,
    addCashTransaction,
    updateCashTransaction,
    deleteCashTransaction,
    clearAllData,
    generateBill,
    payBill,
    checkDueDates,
    getCardBillAmount,
    isCardPaused,
    addAlert,
    dismissAlert,
    getFilteredExpenses,
    getMonthlyTotal,
    getTotalByCategory,
    getTotalByCard,
    getExpensesByMonth,
    getCardUsage,
    syncWithGroup,
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpenses must be used within ExpenseProvider');
  return context;
}
