import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExpenseContext = createContext();

const STORAGE_KEYS = {
  EXPENSES: '@expenses',
  CARDS: '@cards',
  CATEGORIES: '@categories',
  CASH_TRANSACTIONS: '@cash_transactions',
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
    default:
      return state;
  }
}

export function ExpenseProvider({ children }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState);

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

        if (expensesData) dispatch({ type: 'SET_EXPENSES', payload: JSON.parse(expensesData) });
        if (cardsData) dispatch({ type: 'SET_CARDS', payload: JSON.parse(cardsData) });
        if (categoriesData) dispatch({ type: 'SET_CATEGORIES', payload: JSON.parse(categoriesData) });
        if (cashData) dispatch({ type: 'SET_CASH_TRANSACTIONS', payload: JSON.parse(cashData) });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Salvar dados no AsyncStorage
  const saveData = useCallback(async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, []);

  // ─── Expenses ───
  const addExpense = useCallback((expense) => {
    const newExpense = { ...expense, id: Date.now().toString(), paid: false, createdAt: new Date().toISOString() };
    dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
    saveData(STORAGE_KEYS.EXPENSES, [...state.expenses, newExpense]);
  }, [state.expenses, saveData]);

  const updateExpense = useCallback((id, updates) => {
    const updated = state.expenses.map(e => e.id === id ? { ...e, ...updates } : e);
    dispatch({ type: 'SET_EXPENSES', payload: updated });
    saveData(STORAGE_KEYS.EXPENSES, updated);
  }, [state.expenses, saveData]);

  const deleteExpense = useCallback((id) => {
    const filtered = state.expenses.filter(e => e.id !== id);
    dispatch({ type: 'DELETE_EXPENSE', payload: id });
    saveData(STORAGE_KEYS.EXPENSES, filtered);
  }, [state.expenses, saveData]);

  const toggleExpensePaid = useCallback((id) => {
    dispatch({ type: 'TOGGLE_EXPENSE_PAID', payload: id });
    const updated = state.expenses.map(e => e.id === id ? { ...e, paid: !e.paid } : e);
    saveData(STORAGE_KEYS.EXPENSES, updated);
  }, [state.expenses, saveData]);

  // ─── Cards ───
  const addCard = useCallback((card) => {
    const newCard = { ...card, id: Date.now().toString() };
    dispatch({ type: 'ADD_CARD', payload: newCard });
    saveData(STORAGE_KEYS.CARDS, [...state.cards, newCard]);
  }, [state.cards, saveData]);

  const updateCard = useCallback((id, updates) => {
    const updated = state.cards.map(c => c.id === id ? { ...c, ...updates } : c);
    dispatch({ type: 'SET_CARDS', payload: updated });
    saveData(STORAGE_KEYS.CARDS, updated);
  }, [state.cards, saveData]);

  const deleteCard = useCallback((id) => {
    const filtered = state.cards.filter(c => c.id !== id);
    dispatch({ type: 'DELETE_CARD', payload: id });
    saveData(STORAGE_KEYS.CARDS, filtered);
  }, [state.cards, saveData]);

  // ─── Categories ───
  const addCategory = useCallback((category) => {
    const newCategory = { ...category, id: Date.now().toString() };
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    saveData(STORAGE_KEYS.CATEGORIES, [...state.categories, newCategory]);
  }, [state.categories, saveData]);

  const updateCategory = useCallback((id, updates) => {
    const updated = state.categories.map(c => c.id === id ? { ...c, ...updates } : c);
    dispatch({ type: 'SET_CATEGORIES', payload: updated });
    saveData(STORAGE_KEYS.CATEGORIES, updated);
  }, [state.categories, saveData]);

  const deleteCategory = useCallback((id) => {
    const filtered = state.categories.filter(c => c.id !== id);
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
    saveData(STORAGE_KEYS.CATEGORIES, filtered);
  }, [state.categories, saveData]);

  // ─── Cash Transactions ───
  const addCashTransaction = useCallback((amount, description) => {
    const newTransaction = {
      id: Date.now().toString(),
      amount,
      description,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CASH_TRANSACTION', payload: newTransaction });
    saveData(STORAGE_KEYS.CASH_TRANSACTIONS, [...state.cashTransactions, newTransaction]);
    return newTransaction;
  }, [state.cashTransactions, saveData]);

  const updateCashTransaction = useCallback((id, updates) => {
    const updated = state.cashTransactions.map(t => t.id === id ? { ...t, ...updates } : t);
    dispatch({ type: 'SET_CASH_TRANSACTIONS', payload: updated });
    saveData(STORAGE_KEYS.CASH_TRANSACTIONS, updated);
  }, [state.cashTransactions, saveData]);

  const deleteCashTransaction = useCallback((id) => {
    const filtered = state.cashTransactions.filter(t => t.id !== id);
    dispatch({ type: 'DELETE_CASH_TRANSACTION', payload: id });
    saveData(STORAGE_KEYS.CASH_TRANSACTIONS, filtered);
  }, [state.cashTransactions, saveData]);

  // ─── Alerts ───
  const addAlert = useCallback((alert) => {
    dispatch({ type: 'SET_ALERTS', payload: [...state.alerts, alert] });
  }, [state.alerts]);

  const dismissAlert = useCallback((id) => {
    dispatch({ type: 'DISMISS_ALERT', payload: id });
  }, []);

  // ─── Filters ───
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
      .filter(e => e.cardId === cardId)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  }, [state.expenses]);

  // Categorias padrão
  const CATEGORIES = state.categories.length > 0 ? state.categories : [
    { id: 'food', name: 'Alimentação', color: '#FF6B6B', icon: 'restaurant' },
    { id: 'transport', name: 'Transporte', color: '#4ECDC4', icon: 'car' },
    { id: 'leisure', name: 'Lazer', color: '#45B7D1', icon: 'game-controller' },
    { id: 'health', name: 'Saúde', color: '#96CEB4', icon: 'medical' },
    { id: 'housing', name: 'Moradia', color: '#FFEAA7', icon: 'home' },
    { id: 'education', name: 'Educação', color: '#DDA0DD', icon: 'school' },
    { id: 'shopping', name: 'Compras', color: '#98D8C8', icon: 'cart' },
    { id: 'others', name: 'Outros', color: '#F7DC6F', icon: 'ellipsis-horizontal' },
  ];

  const value = {
    expenses: state.expenses,
    cards: state.cards,
    categories: state.categories,
    cashTransactions: state.cashTransactions,
    alerts: state.alerts,
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
    addAlert,
    dismissAlert,
    getFilteredExpenses,
    getMonthlyTotal,
    getTotalByCategory,
    getTotalByCard,
    getExpensesByMonth,
    getCardUsage,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpenses must be used within ExpenseProvider');
  return context;
}
