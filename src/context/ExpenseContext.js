import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export const CATEGORIES = [
  { id: 'alimentacao', name: 'Alimentação', color: '#FF6B6B', icon: 'restaurant-outline', limit: 800 },
  { id: 'transporte', name: 'Transporte', color: '#4ECDC4', icon: 'car-outline', limit: 500 },
  { id: 'lazer', name: 'Lazer', color: '#45B7D1', icon: 'game-controller-outline', limit: 400 },
  { id: 'saude', name: 'Saúde', color: '#96CEB4', icon: 'medical-outline', limit: 300 },
  { id: 'moradia', name: 'Moradia', color: '#FFEAA7', icon: 'home-outline', limit: 1500 },
  { id: 'educacao', name: 'Educação', color: '#DDA0DD', icon: 'school-outline', limit: 300 },
  { id: 'compras', name: 'Compras', color: '#FDCB6E', icon: 'cart-outline', limit: 600 },
  { id: 'outros', name: 'Outros', color: '#B2BEC3', icon: 'ellipsis-horizontal-outline', limit: 200 },
];

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [cards, setCards] = useState([]);
  const [categoryLimits, setCategoryLimits] = useState({});
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) { saveData(); checkAlerts(); } }, [expenses, cards, categoryLimits]);

  const loadData = async () => {
    try {
      const [storedExpenses, storedCards, storedLimits] = await Promise.all([
        AsyncStorage.getItem('@expenses'),
        AsyncStorage.getItem('@cards'),
        AsyncStorage.getItem('@categoryLimits'),
      ]);
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
      if (storedCards) setCards(JSON.parse(storedCards));
      if (storedLimits) setCategoryLimits(JSON.parse(storedLimits));
    } catch (error) { console.error('Erro ao carregar:', error); }
    finally { setLoading(false); }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('@expenses', JSON.stringify(expenses)),
        AsyncStorage.setItem('@cards', JSON.stringify(cards)),
        AsyncStorage.setItem('@categoryLimits', JSON.stringify(categoryLimits)),
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

  const addExpense = (expense) => {
    const newExpense = { id: generateUUID(), ...expense, createdAt: new Date().toISOString() };
    setExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  };
  const updateExpense = (id, updates) => { setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e)); };
  const deleteExpense = (id) => { setExpenses(prev => prev.filter(e => e.id !== id)); };
  const addCard = (card) => { const newCard = { id: generateUUID(), ...card }; setCards(prev => [...prev, newCard]); };
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

  const value = {
    expenses, cards, categoryLimits, alerts, loading,
    addExpense, updateExpense, deleteExpense,
    addCard, updateCard, deleteCard,
    setCategoryLimit, dismissAlert,
    getFilteredExpenses, getTotalByCategory, getTotalByCard,
    getMonthlyTotal, getExpensesByMonth, getCardUsage, getCategoryUsage,
    CATEGORIES,
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
