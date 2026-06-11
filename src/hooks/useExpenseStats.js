import { useMemo, useCallback } from 'react';

export function useExpenseStats(expenses, cards, categories) {
  // Totais por período (memoizados)
  const today = useMemo(() => new Date(), []);
  const weekAgo = useMemo(() => new Date(today - 7 * 24 * 60 * 60 * 1000), [today]);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const todayExpenses = useMemo(() =>
    expenses.filter(e => new Date(e.date).toDateString() === today.toDateString()),
  [expenses, today]);

  const weekExpenses = useMemo(() =>
    expenses.filter(e => new Date(e.date) >= weekAgo),
  [expenses, weekAgo]);

  const monthExpenses = useMemo(() =>
    expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }),
  [expenses, currentMonth, currentYear]);

  const todayTotal = useMemo(() =>
    todayExpenses.reduce((s, e) => s + parseFloat(e.amount), 0),
  [todayExpenses]);

  const weekTotal = useMemo(() =>
    weekExpenses.reduce((s, e) => s + parseFloat(e.amount), 0),
  [weekExpenses]);

  const monthTotal = useMemo(() =>
    monthExpenses.reduce((s, e) => s + parseFloat(e.amount), 0),
  [monthExpenses]);

  const unpaidExpenses = useMemo(() =>
    expenses.filter(e => !e.paid),
  [expenses]);

  const totalUnpaid = useMemo(() =>
    unpaidExpenses.reduce((s, e) => s + parseFloat(e.amount), 0),
  [unpaidExpenses]);

  const topCategories = useMemo(() => {
    const totals = {};
    monthExpenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + parseFloat(e.amount);
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [monthExpenses]);

  const cardUsage = useMemo(() =>
    cards.map(card => {
      const usage = expenses
        .filter(e => e.cardId === card.id && !e.billed && !e.isBill)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      return {
        ...card,
        usage,
        percentage: card.limit > 0 ? (usage / card.limit) * 100 : 0,
      };
    }),
  [cards, expenses]);

  const getCategoryInfo = useCallback((categoryId) => {
    if (!categoryId) return { name: 'Outros', color: '#999', icon: 'ellipsis-horizontal' };
    const cat = categories.find(c => c.id === categoryId);
    if (cat) return cat;
    // Fallback para categorias padrão conhecidas
    const DEFAULT_ICON_MAP = {
      'cat-food': { name: 'Alimentação', color: '#FF6B6B', icon: 'restaurant' },
      'cat-transport': { name: 'Transporte', color: '#4ECDC4', icon: 'car' },
      'cat-leisure': { name: 'Lazer', color: '#45B7D1', icon: 'game-controller' },
      'cat-health': { name: 'Saúde', color: '#96CEB4', icon: 'medical' },
      'cat-housing': { name: 'Moradia', color: '#FFEAA7', icon: 'home' },
      'cat-education': { name: 'Educação', color: '#DDA0DD', icon: 'school' },
      'cat-shopping': { name: 'Compras', color: '#98D8C8', icon: 'cart' },
      'cat-others': { name: 'Outros', color: '#F7DC6F', icon: 'ellipsis-horizontal' },
      'food': { name: 'Alimentação', color: '#FF6B6B', icon: 'restaurant' },
      'transport': { name: 'Transporte', color: '#4ECDC4', icon: 'car' },
      'leisure': { name: 'Lazer', color: '#45B7D1', icon: 'game-controller' },
      'health': { name: 'Saúde', color: '#96CEB4', icon: 'medical' },
      'housing': { name: 'Moradia', color: '#FFEAA7', icon: 'home' },
      'education': { name: 'Educação', color: '#DDA0DD', icon: 'school' },
      'shopping': { name: 'Compras', color: '#98D8C8', icon: 'cart' },
      'others': { name: 'Outros', color: '#F7DC6F', icon: 'ellipsis-horizontal' },
    };
    return DEFAULT_ICON_MAP[categoryId] || { name: 'Outros', color: '#999', icon: 'help-circle-outline' };
  }, [categories]);

  return {
    todayTotal, weekTotal, monthTotal,
    unpaidExpenses, totalUnpaid,
    topCategories, cardUsage,
    getCategoryInfo,
    todayExpenses, weekExpenses, monthExpenses,
  };
}
