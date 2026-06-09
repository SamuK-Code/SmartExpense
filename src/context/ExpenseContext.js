import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExpenseContext = createContext();

const STORAGE_KEYS = {
  EXPENSES: '@expenses',
  CARDS: '@cards',
  CATEGORIES: '@categories',
  CASH_TRANSACTIONS: '@cash_transactions',
};

// Categorias padrão — IDs fixos para evitar duplicatas
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

// Gerador de ID único
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
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

  // Verificar vencimentos de fatura quando os dados carregarem
  useEffect(() => {
    if (!loading && state.cards.length > 0) {
      checkDueDates();
    }
  }, [loading, state.cards.length]);

  // Salvar dados no AsyncStorage
  const saveData = useCallback(async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, []);

  // ─── Verificar Vencimentos ───
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
  }, [state.cards]);

  // ─── Gerar Fatura ───
  const generateBill = useCallback((cardId) => {
    const card = state.cards.find(c => c.id === cardId);
    if (!card || !card.dueDate) return;

    // Soma todos os gastos do cartão não quitados, não faturados e não são faturas
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

    // Marca os gastos antigos do cartão como billed
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
  }, [state.cards, state.expenses, saveData]);

  // ─── Quitar Fatura ───
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
    return true;
  }, [state.expenses, state.cards, saveData]);

  // ─── Expenses ───
  const addExpense = useCallback((expense) => {
    // Verifica se o cartão está pausado
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
    };
    const updated = [newExpense, ...state.expenses];
    dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
    saveData(STORAGE_KEYS.EXPENSES, updated);
    return { success: true, expense: newExpense };
  }, [state.expenses, state.cards, saveData]);

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
    const updated = state.expenses.map(e => e.id === id ? { ...e, paid: !e.paid } : e);
    dispatch({ type: 'SET_EXPENSES', payload: updated });
    saveData(STORAGE_KEYS.EXPENSES, updated);
  }, [state.expenses, saveData]);

  // ─── Cards ───
  const addCard = useCallback((card) => {
    const newCard = {
      ...card,
      id: generateId(),
      isPaused: false,
      currentBillAmount: 0,
      lastBillDate: null,
    };
    const updated = [...state.cards, newCard];
    dispatch({ type: 'ADD_CARD', payload: newCard });
    saveData(STORAGE_KEYS.CARDS, updated);
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
    const newCategory = { ...category, id: generateId() };
    const updated = [...state.categories, newCategory];
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    saveData(STORAGE_KEYS.CATEGORIES, updated);
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
      id: generateId(),
      amount,
      description,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    const updated = [newTransaction, ...state.cashTransactions];
    dispatch({ type: 'ADD_CASH_TRANSACTION', payload: newTransaction });
    saveData(STORAGE_KEYS.CASH_TRANSACTIONS, updated);
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

  // ─── Clear All Data ───
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
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }, []);

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

  // Categorias disponíveis
  const CATEGORIES = state.categories.length > 0 ? state.categories : DEFAULT_CATEGORIES;

  const value = {
    expenses: state.expenses,
    cards: state.cards,
    categories: state.categories,
    cashTransactions: state.cashTransactions,
    alerts: state.alerts,
    loading,
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
