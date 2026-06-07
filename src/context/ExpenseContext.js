import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { safeGetItem, safeSetItem, safeRemoveItem, STORAGE_KEYS } from '../utils/SafeStorage';
import * as Crypto from 'expo-crypto';

const ExpenseContext = createContext();

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

export const DEFAULT_CATEGORIES = [
  { id: 'alimentacao', name: 'Alimentação', color: '#FF6B6B', icon: 'restaurant-outline', limit: 800 },
  { id: 'transporte', name: 'Transporte', color: '#4ECDC4', icon: 'car-outline', limit: 500 },
  { id: 'lazer', name: 'Lazer', color: '#45B7D1', icon: 'game-controller-outline', limit: 400 },
  { id: 'saude', name: 'Saúde', color: '#96CEB4', icon: 'medical-outline', limit: 300 },
  { id: 'moradia', name: 'Moradia', color: '#FFEAA7', icon: 'home-outline', limit: 1500 },
  { id: 'educacao', name: 'Educação', color: '#DDA0DD', icon: 'school-outline', limit: 300 },
  { id: 'compras', name: 'Compras', color: '#FDCB6E', icon: 'cart-outline', limit: 600 },
  { id: 'outros', name: 'Outros', color: '#B2BEC3', icon: 'ellipsis-horizontal-outline', limit: 200 },
];

export const AVAILABLE_ICONS = [
  'restaurant-outline',
  'car-outline',
  'game-controller-outline',
  'medical-outline',
  'home-outline',
  'school-outline',
  'cart-outline',
  'ellipsis-horizontal-outline',
  'airplane-outline',
  'barbell-outline',
  'beer-outline',
  'book-outline',
  'briefcase-outline',
  'brush-outline',
  'bus-outline',
  'cafe-outline',
  'call-outline',
  'camera-outline',
  'card-outline',
  'cash-outline',
  'chatbubble-outline',
  'checkmark-circle-outline',
  'clipboard-outline',
  'cloud-outline',
  'code-outline',
  'color-palette-outline',
  'desktop-outline',
  'diamond-outline',
  'earth-outline',
  'egg-outline',
  'eye-outline',
  'film-outline',
  'fitness-outline',
  'flame-outline',
  'flash-outline',
  'flower-outline',
  'football-outline',
  'gift-outline',
  'glasses-outline',
  'globe-outline',
  'golf-outline',
  'grid-outline',
  'hammer-outline',
  'happy-outline',
  'headset-outline',
  'heart-outline',
  'help-circle-outline',
  'ice-cream-outline',
  'image-outline',
  'laptop-outline',
  'leaf-outline',
  'library-outline',
  'link-outline',
  'lock-closed-outline',
  'log-out-outline',
  'mail-outline',
  'map-outline',
  'mic-outline',
  'moon-outline',
  'musical-note-outline',
  'navigate-outline',
  'notifications-outline',
  'nutrition-outline',
  'paw-outline',
  'pencil-outline',
  'people-outline',
  'person-outline',
  'phone-portrait-outline',
  'pizza-outline',
  'planet-outline',
  'pricetag-outline',
  'print-outline',
  'pulse-outline',
  'rainy-outline',
  'rocket-outline',
  'rose-outline',
  'sad-outline',
  'save-outline',
  'search-outline',
  'send-outline',
  'settings-outline',
  'shield-checkmark-outline',
  'shirt-outline',
  'snow-outline',
  'sparkles-outline',
  'star-outline',
  'storefront-outline',
  'subway-outline',
  'sunny-outline',
  'sync-outline',
  'tennisball-outline',
  'thumbs-up-outline',
  'ticket-outline',
  'time-outline',
  'train-outline',
  'trash-outline',
  'trophy-outline',
  'umbrella-outline',
  'videocam-outline',
  'wallet-outline',
  'warning-outline',
  'water-outline',
  'wifi-outline',
  'wine-outline',
  'woman-outline',
  'bicycle-outline',
  'boat-outline',
  'bonfire-outline',
  'bowling-ball-outline',
  'basketball-outline',
  'bed-outline',
  'beaker-outline',
  'build-outline',
  'bug-outline',
  'business-outline',
  'calculator-outline',
  'calendar-outline',
  'camera-reverse-outline',
  'car-sport-outline',
  'cellular-outline',
  'chatbox-outline',
  'cloud-circle-outline',
  'cloud-done-outline',
  'compass-outline',
  'construct-outline',
  'copy-outline',
  'cube-outline',
  'cut-outline',
  'disc-outline',
  'document-outline',
  'documents-outline',
  'download-outline',
  'ear-outline',
  'easel-outline',
  'exit-outline',
  'expand-outline',
  'extension-puzzle-outline',
  'eyedrop-outline',
  'fast-food-outline',
  'female-outline',
  'file-tray-full-outline',
  'finger-print-outline',
  'fish-outline',
  'flag-outline',
  'flask-outline',
  'folder-open-outline',
  'footsteps-outline',
  'funnel-outline',
  'hand-left-outline',
  'hardware-chip-outline',
  'hourglass-outline',
  'id-card-outline',
  'infinite-outline',
  'information-circle-outline',
  'journal-outline',
  'key-outline',
  'language-outline',
  'layers-outline',
  'list-outline',
  'location-outline',
  'magnet-outline',
  'mail-open-outline',
  'male-outline',
  'man-outline',
  'medal-outline',
  'mic-off-outline',
  'move-outline',
  'newspaper-outline',
  'open-outline',
  'options-outline',
  'paper-plane-outline',
  'partly-sunny-outline',
  'phone-landscape-outline',
  'pie-chart-outline',
  'pin-outline',
  'pint-outline',
  'play-circle-outline',
  'power-outline',
  'pricetags-outline',
  'qr-code-outline',
  'radio-outline',
  'reader-outline',
  'receipt-outline',
  'reload-outline',
  'remove-circle-outline',
  'ribbon-outline',
  'scan-outline',
  'search-circle-outline',
  'server-outline',
  'share-outline',
  'shield-outline',
  'shuffle-outline',
  'skull-outline',
  'speedometer-outline',
  'square-outline',
  'stats-chart-outline',
  'stopwatch-outline',
  'sync-circle-outline',
  'tablet-landscape-outline',
  'tablet-portrait-outline',
  'telescope-outline',
  'thermometer-outline',
  'thunderstorm-outline',
  'timer-outline',
  'today-outline',
  'trail-sign-outline',
  'transgender-outline',
  'trash-bin-outline',
  'trending-down-outline',
  'trending-up-outline',
  'triangle-outline',
  'tv-outline',
  'videocam-off-outline',
  'volume-high-outline',
  'volume-low-outline',
  'volume-medium-outline',
  'volume-mute-outline',
  'walk-outline',
  'watch-outline'
];

export const AVAILABLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FDCB6E', '#B2BEC3',
  '#FF9F43', '#10AC84', '#EE5A24', '#009432', '#0652DD', '#9980FA', '#833471', '#F79F1F',
  '#A3CB38', '#1289A7', '#D980FA', '#B53471', '#45AAF2', '#FD79A8', '#FDCB6E', '#6C5CE7',
  '#A29BFE', '#74B9FF', '#00B894', '#00CEC9', '#FDCB6E', '#E17055', '#D63031', '#E84393',
  '#2D3436', '#636E72', '#B2BEC3', '#DFE6E9', '#FF7675', '#FAB1A0', '#FD79A8', '#FDCB6E',
  '#FDCB6E', '#55A3FF', '#26DE81', '#FC5C65', '#FD9644', '#F8B500', '#4B7BEC', '#A55EEA',
  '#45AAF2', '#2BCBCA', '#778CA3', '#2D98DA', '#F7B731', '#8854D0', '#20BF6B', '#EB3B5A',
  '#3867D6', '#0FB9B1', '#FA8231', '#FDCB6E', '#2BCBCA', '#45AAF2', '#4B6584', '#D1D8E0'
];

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [cards, setCards] = useState([]);
  const [categoryLimits, setCategoryLimits] = useState({});
  const [customCategories, setCustomCategories] = useState([]);
  const [completedExpenses, setCompletedExpenses] = useState([]);
  const [cashTransactions, setCashTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  // Combine default + custom categories
  const CATEGORIES = useMemo(() => [...DEFAULT_CATEGORIES, ...customCategories], [customCategories]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) { saveData(); checkAlerts(); } }, [expenses, cards, categoryLimits]);

  const loadData = async () => {
    try {
      const [storedExpenses, storedCards, storedLimits, storedCustomCategories, storedCompleted, storedCashTx] = await Promise.all([
        safeGetItem(STORAGE_KEYS.EXPENSES, []),
        safeGetItem(STORAGE_KEYS.CARDS, []),
        safeGetItem(STORAGE_KEYS.CATEGORY_LIMITS, {}),
        safeGetItem(STORAGE_KEYS.CUSTOM_CATEGORIES, []),
        safeGetItem(STORAGE_KEYS.COMPLETED_EXPENSES, []),
        safeGetItem(STORAGE_KEYS.CASH_TRANSACTIONS, []),
      ]);

      // Validate loaded data
      if (Array.isArray(storedExpenses)) setExpenses(storedExpenses);
      if (Array.isArray(storedCards)) setCards(storedCards);
      if (storedLimits && typeof storedLimits === 'object') setCategoryLimits(storedLimits);
      if (Array.isArray(storedCustomCategories)) setCustomCategories(storedCustomCategories);
      if (Array.isArray(storedCompleted)) setCompletedExpenses(storedCompleted);
      if (Array.isArray(storedCashTx)) setCashTransactions(storedCashTx);
    } catch (error) { 
      console.error('Erro ao carregar:', error); 
    }
    finally { setLoading(false); }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        safeSetItem(STORAGE_KEYS.EXPENSES, expenses),
        safeSetItem(STORAGE_KEYS.CARDS, cards),
        safeSetItem(STORAGE_KEYS.CATEGORY_LIMITS, categoryLimits),
        safeSetItem(STORAGE_KEYS.CUSTOM_CATEGORIES, customCategories),
        safeSetItem(STORAGE_KEYS.COMPLETED_EXPENSES, completedExpenses),
        safeSetItem(STORAGE_KEYS.CASH_TRANSACTIONS, cashTransactions),
      ]);
    } catch (error) { console.error('Erro ao salvar:', error); }
  };

  const checkAlerts = useCallback(() => {
    const newAlerts = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    cards.forEach(card => {
      const cardTotal = expenses
        .filter(e => {
          const d = new Date(e.date);
          return e.cardId === card.id && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const pct = card.limit > 0 ? (cardTotal / card.limit) * 100 : 0;
      if (pct >= 100) {
        newAlerts.push({ id: `card-${card.id}-over`, type: 'danger', title: `Limite excedido: ${card.customName || card.name}`, message: `Você gastou ${formatCurrency(cardTotal)} do limite de ${formatCurrency(card.limit)}`, cardId: card.id });
      } else if (pct >= 80) {
        newAlerts.push({ id: `card-${card.id}-warning`, type: 'warning', title: `Quase no limite: ${card.customName || card.name}`, message: `Você já usou ${pct.toFixed(0)}% do limite`, cardId: card.id });
      }
    });

    CATEGORIES.forEach(cat => {
      const catLimit = categoryLimits[cat.id] !== undefined ? categoryLimits[cat.id] : cat.limit;
      const catTotal = expenses.filter(e => { const d = new Date(e.date); return e.category === cat.id && d.getMonth() === currentMonth && d.getFullYear() === currentYear; }).reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const pct = catLimit > 0 ? (catTotal / catLimit) * 100 : 0;
      if (pct >= 100) {
        newAlerts.push({ id: `cat-${cat.id}-over`, type: 'danger', title: `Excesso: ${cat.name}`, message: `Gasto ${formatCurrency(catTotal)} ultrapassou o limite de ${formatCurrency(catLimit)}`, categoryId: cat.id });
      } else if (pct >= 80) {
        newAlerts.push({ id: `cat-${cat.id}-warning`, type: 'warning', title: `Atenção: ${cat.name}`, message: `Usou ${pct.toFixed(0)}% do orçamento`, categoryId: cat.id });
      } else if (pct <= 20 && catTotal > 0) {
        newAlerts.push({ id: `cat-${cat.id}-low`, type: 'info', title: `Economia: ${cat.name}`, message: `Só usou ${pct.toFixed(0)}% do orçamento. Ótimo controle!`, categoryId: cat.id });
      }
    });

    setAlerts(newAlerts);
  }, [expenses, cards, categoryLimits]);

  const completeExpense = (expenseId) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    const completedExpense = {
      ...expense,
      completedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h from now
    };

    setCompletedExpenses(prev => [completedExpense, ...prev]);
    deleteExpense(expenseId);
  };

  const getActiveCompletedExpenses = () => {
    const now = new Date().toISOString();
    return completedExpenses.filter(e => e.expiresAt > now);
  };

  const getExpiredCompletedExpenses = () => {
    const now = new Date().toISOString();
    return completedExpenses.filter(e => e.expiresAt <= now);
  };

  const addCashTransaction = (amount, description = 'Entrada de caixa') => {
    console.log('addCashTransaction called with:', amount, typeof amount, description);

    // Handle both string and number inputs
    let numAmount;
    if (typeof amount === 'string') {
      numAmount = parseFloat(amount);
    } else if (typeof amount === 'number') {
      numAmount = amount;
    } else {
      console.error('Invalid amount type:', typeof amount);
      return null;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      console.error('Invalid cash transaction amount:', numAmount, 'from input:', amount);
      return null;
    }

    const transaction = {
      id: generateUUID(),
      amount: numAmount,
      description,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      type: 'cash_in',
    };

    setCashTransactions(prev => [transaction, ...prev]);
    console.log('Transaction created:', transaction);
    return transaction;
  };

  const addExpense = (expense) => {
    // Validate required fields
    if (!expense || typeof expense !== 'object') {
      console.error('Invalid expense object');
      return null;
    }
    if (!expense.amount || isNaN(parseFloat(expense.amount))) {
      console.error('Invalid expense amount');
      return null;
    }
    if (!expense.description || !expense.description.trim()) {
      console.error('Invalid expense description');
      return null;
    }
    if (!expense.category) {
      console.error('Invalid expense category');
      return null;
    }

    // Sanitize data
    const sanitizedExpense = {
      ...expense,
      description: expense.description.trim().substring(0, 100),
      amount: parseFloat(expense.amount),
      date: expense.date || new Date().toISOString().split('T')[0],
      cardId: expense.cardId || null,
    };

    const newExpense = { 
      id: generateUUID(), 
      ...sanitizedExpense, 
      createdAt: new Date().toISOString() 
    };
    setExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  };
  const updateExpense = (id, updates) => { setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e)); };
  const deleteExpense = (id) => { setExpenses(prev => prev.filter(e => e.id !== id)); };
  const addCard = (card) => { 
    if (!card || !card.bankId || !card.name) {
      console.error('Invalid card data');
      return null;
    }
    const newCard = { 
      id: generateUUID(), 
      ...card,
      limit: parseFloat(card.limit) || 0,
    }; 
    setCards(prev => [...prev, newCard]); 
    return newCard;
  };
  const updateCard = (id, updates) => { setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c)); };
  const deleteCard = (id) => { setCards(prev => prev.filter(c => c.id !== id)); setExpenses(prev => prev.map(e => e.cardId === id ? { ...e, cardId: null } : e)); };
  const setCategoryLimit = (categoryId, limit) => { setCategoryLimits(prev => ({ ...prev, [categoryId]: limit })); };
  const dismissAlert = (alertId) => { setAlerts(prev => prev.filter(a => a.id !== alertId)); };

  const getFilteredExpenses = (period = 'all', customStart = null, customEnd = null) => {
    const now = new Date(); let startDate, endDate;
    switch (period) {
      case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); break;
      case 'week': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); endDate = now; break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); break;
      case 'year': startDate = new Date(now.getFullYear(), 0, 1); endDate = new Date(now.getFullYear() + 1, 0, 0); break;
      case 'custom': startDate = customStart ? new Date(customStart) : new Date(0); endDate = customEnd ? new Date(customEnd) : now; break;
      default: return expenses;
    }
    return expenses.filter(e => { const d = new Date(e.date); return d >= startDate && d <= endDate; });
  };

  const getTotalByCategory = (filteredExpenses = expenses) => {
    const totals = {}; filteredExpenses.forEach(e => { if (!totals[e.category]) totals[e.category] = 0; totals[e.category] += parseFloat(e.amount); }); return totals;
  };
  const getTotalByCard = (filteredExpenses = expenses) => {
    const totals = {}; filteredExpenses.forEach(e => { const cardId = e.cardId || 'no-card'; if (!totals[cardId]) totals[cardId] = 0; totals[cardId] += parseFloat(e.amount); }); return totals;
  };
  const getMonthlyTotal = (filteredExpenses = expenses) => filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const getExpensesByMonth = () => {
    const grouped = {}; expenses.forEach(e => { const d = new Date(e.date); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; if (!grouped[key]) grouped[key] = 0; grouped[key] += parseFloat(e.amount); }); return grouped;
  };
  const getCardUsage = (cardId) => {
    const now = new Date(); return expenses.filter(e => { const d = new Date(e.date); return e.cardId === cardId && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((sum, e) => sum + parseFloat(e.amount), 0);
  };
  const getCategoryUsage = (categoryId) => {
    const now = new Date(); return expenses.filter(e => { const d = new Date(e.date); return e.category === categoryId && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((sum, e) => sum + parseFloat(e.amount), 0);
  };

  const addCategory = (category) => {
    const newCategory = { id: generateUUID(), ...category };
    setCustomCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const deleteCategory = (categoryId) => {
    // Check if category is used in any expense
    const isUsed = expenses.some(e => e.category === categoryId);
    if (isUsed) {
      throw new Error('Cannot delete category that is used in expenses');
    }
    setCustomCategories(prev => prev.filter(c => c.id !== categoryId));
    // Also remove any limit for this category
    setCategoryLimits(prev => {
      const newLimits = { ...prev };
      delete newLimits[categoryId];
      return newLimits;
    });
  };

  const updateCategory = (categoryId, updates) => {
    setCustomCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...updates } : c));
  };

  const value = {
    expenses, cards, categoryLimits, customCategories, alerts, loading,
    addExpense, updateExpense, deleteExpense,
    addCard, updateCard, deleteCard,
    setCategoryLimit, dismissAlert,
    addCategory, deleteCategory, updateCategory,
    getFilteredExpenses, getTotalByCategory, getTotalByCard,
    getMonthlyTotal, getExpensesByMonth, getCardUsage, getCategoryUsage,
    completeExpense, getActiveCompletedExpenses, getExpiredCompletedExpenses,
    addCashTransaction, cashTransactions,
    CATEGORIES, DEFAULT_CATEGORIES, AVAILABLE_ICONS, AVAILABLE_COLORS,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpenses must be inside ExpenseProvider');
  return context;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
