// AppContext.js — COM SISTEMA DE CÍRCULOS FINANCEIROS
// VERSÃO REFORMULADA: Dados locais + compartilhados merged automaticamente
// Adiciona: sharedCards, sharedTransactions, sharedGoals do CircleContext
// Badge de compartilhamento visível em todos os dados

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // ═══════════════════════════════════════════════════════════
  // ESTADO LOCAL (mesmo de antes)
  // ═══════════════════════════════════════════════════════════
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState({
    add: true,
    delete: true,
    notif: true,
    achievement: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [cardInvoices, setCardInvoices] = useState([]);

  // ═══════════════════════════════════════════════════════════
  // ESTADO DE CÍRCULOS (dados compartilhados recebidos)
  // ═══════════════════════════════════════════════════════════
  const [sharedCards, setSharedCards] = useState([]);
  const [sharedTransactions, setSharedTransactions] = useState([]);
  const [sharedGoals, setSharedGoals] = useState([]);

  // ═══════════════════════════════════════════════════════════
  // REFS (anti-stale)
  // ═══════════════════════════════════════════════════════════
  const transactionsRef = useRef(transactions);
  const cardsRef = useRef(cards);
  const goalsRef = useRef(goals);
  const completedGoalsRef = useRef(completedGoals);
  const soundEnabledRef = useRef(soundEnabled);
  const cashBalanceRef = useRef(cashBalance);
  const cardInvoicesRef = useRef(cardInvoices);
  const sharedCardsRef = useRef(sharedCards);
  const sharedTransactionsRef = useRef(sharedTransactions);
  const sharedGoalsRef = useRef(sharedGoals);

  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);
  useEffect(() => { cardsRef.current = cards; }, [cards]);
  useEffect(() => { goalsRef.current = goals; }, [goals]);
  useEffect(() => { completedGoalsRef.current = completedGoals; }, [completedGoals]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { cashBalanceRef.current = cashBalance; }, [cashBalance]);
  useEffect(() => { cardInvoicesRef.current = cardInvoices; }, [cardInvoices]);
  useEffect(() => { sharedCardsRef.current = sharedCards; }, [sharedCards]);
  useEffect(() => { sharedTransactionsRef.current = sharedTransactions; }, [sharedTransactions]);
  useEffect(() => { sharedGoalsRef.current = sharedGoals; }, [sharedGoals]);

  // ═══════════════════════════════════════════════════════════
  // ÁUDIO
  // ═══════════════════════════════════════════════════════════
  const addPlayer = useAudioPlayer(require('../../assets/sounds/add.mp3'));
  const deletePlayer = useAudioPlayer(require('../../assets/sounds/delete.mp3'));
  const notifPlayer = useAudioPlayer(require('../../assets/sounds/notif.mp3'));
  const achievementPlayer = useAudioPlayer(require('../../assets/sounds/achievement.mp3'));

  // ═══════════════════════════════════════════════════════════
  // CATEGORIAS PADRÃO
  // ═══════════════════════════════════════════════════════════
  const categories = [
    { id: 'food', name: 'Alimentação', icon: 'restaurant', color: '#EF4444' },
    { id: 'transport', name: 'Transporte', icon: 'car', color: '#3B82F6' },
    { id: 'shopping', name: 'Compras', icon: 'bag', color: '#F59E0B' },
    { id: 'health', name: 'Saúde', icon: 'heart', color: '#10B981' },
    { id: 'entertainment', name: 'Lazer', icon: 'game-controller', color: '#8B5CF6' },
    { id: 'bills', name: 'Contas', icon: 'document-text', color: '#6366F1' },
    { id: 'education', name: 'Educação', icon: 'school', color: '#EC4899' },
    { id: 'other', name: 'Outros', icon: 'ellipsis-horizontal', color: '#94A3B8' },
  ];

  // ═══════════════════════════════════════════════════════════
  // GRADIENTES DE CARTÃO
  // ═══════════════════════════════════════════════════════════
  const cardGradients = [
    { name: 'Roxo Real', class: 'card-gradient-purple', color: '#8B5CF6', type: 'gradient' },
    { name: 'Azul Oceano', class: 'card-gradient-blue', color: '#3B82F6', type: 'gradient' },
    { name: 'Verde Floresta', class: 'card-gradient-green', color: '#10B981', type: 'gradient' },
    { name: 'Vermelho Fúria', class: 'card-gradient-red', color: '#EF4444', type: 'gradient' },
    { name: 'Laranja Sol', class: 'card-gradient-orange', color: '#F59E0B', type: 'gradient' },
    { name: 'Rosa Choque', class: 'card-gradient-pink', color: '#EC4899', type: 'gradient' },
    { name: 'Ciano Glacial', class: 'card-gradient-cyan', color: '#06B6D4', type: 'gradient' },
    { name: 'Lima Elétrico', class: 'card-gradient-lime', color: '#84CC16', type: 'gradient' },
    { name: 'Holográfico', class: 'card-gradient-holo', color: '#C084FC', type: 'gradient' },
    { name: 'Dark Premium', class: 'card-gradient-dark', color: '#7C3AED', type: 'gradient' },
    { name: 'Synthwave', class: 'card-gradient-synth', color: '#7C3AED', type: 'gradient' },
    { name: 'Sunset', class: 'card-gradient-sunset', color: '#F59E0B', type: 'gradient' },
    { name: 'Midnight', class: 'card-gradient-midnight', color: '#4338CA', type: 'gradient' },
    { name: 'Aurora', class: 'card-gradient-aurora', color: '#0EA5E9', type: 'gradient' },
    { name: 'Fogo', class: 'card-gradient-fire', color: '#EA580C', type: 'gradient' },
    { name: 'Preto Fosco', class: 'card-solid-black', color: '#1C1917', type: 'solid' },
    { name: 'Branco Pérola', class: 'card-solid-white', color: '#F5F5F4', type: 'solid' },
    { name: 'Dourado', class: 'card-solid-gold', color: '#D4AF37', type: 'solid' },
    { name: 'Premium Dark', class: 'card-template-dark', color: '#1E1B4B', type: 'template' },
    { name: 'Premium Color', class: 'card-template-color', color: '#D4AF37', type: 'template' },
    { name: 'Gold Metal', class: 'card-template-gold', color: '#D4AF37', type: 'template' },
    { name: 'Holográfico', class: 'card-template-holo', color: '#C084FC', type: 'template' },
    { name: 'Carbon Fiber', class: 'card-template-carbon', color: '#374151', type: 'template' },
    { name: 'Mármore', class: 'card-template-marble', color: '#F5F5F4', type: 'template' },
    { name: 'Glass', class: 'card-template-glass', color: '#A5B4FC', type: 'template' },
  ];

  const tags = ['Urgente', 'Parcelado', 'Fixo', 'Extra'];

  // ═══════════════════════════════════════════════════════════
  // HELPERS DE CÍRCULOS (para integração com CircleContext)
  // ═══════════════════════════════════════════════════════════

  const updateSharedCards = useCallback((newSharedCards) => {
    setSharedCards(newSharedCards);
  }, []);

  const updateSharedTransactions = useCallback((newSharedTransactions) => {
    setSharedTransactions(newSharedTransactions);
  }, []);

  const updateSharedGoals = useCallback((newSharedGoals) => {
    setSharedGoals(newSharedGoals);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // DADOS MERGED (locais + compartilhados)
  // ═══════════════════════════════════════════════════════════

  const mergedCards = useMemo(() => {
    // Adicionar flag _isLocal aos cards locais
    const localWithFlag = cards.map(c => ({ ...c, _isLocal: true }));
    // Shared cards já têm _sharedBy, _sharedByName, etc.
    return [...localWithFlag, ...sharedCards];
  }, [cards, sharedCards]);

  const mergedTransactions = useMemo(() => {
    const localWithFlag = transactions.map(t => ({ ...t, _isLocal: true }));
    return [...localWithFlag, ...sharedTransactions];
  }, [transactions, sharedTransactions]);

  const mergedGoals = useMemo(() => {
    const localWithFlag = goals.map(g => ({ ...g, _isLocal: true }));
    return [...localWithFlag, ...sharedGoals];
  }, [goals, sharedGoals]);

  // ═══════════════════════════════════════════════════════════
  // HELPERS DE IDENTIFICAÇÃO
  // ═══════════════════════════════════════════════════════════

  const isSharedItem = (item) => {
    return !!item._sharedBy && !item._isLocal;
  };

  const getItemShareInfo = (item) => {
    if (!isSharedItem(item)) return null;
    return {
      sharedBy: item._sharedBy,
      sharedByName: item._sharedByName,
      permissions: item._permissions,
      sharedAt: item._sharedAt,
    };
  };

  const canEditLocalOrShared = (item, currentUserId) => {
    if (item._isLocal) return true; // Seu item local sempre editável
    if (!item._sharedBy) return true; // Item sem origem de círculo
    if (item._sharedBy === currentUserId) return true; // Seu item compartilhado
    return item._permissions?.edit === true; // Permissão de edição concedida
  };

  // ═══════════════════════════════════════════════════════════
  // CARREGAR / SALVAR DADOS LOCAIS
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem('financas_pro_v3');
      if (saved) {
        const data = JSON.parse(saved);
        setCards(data.cards || []);
        setTransactions(data.transactions || []);
        setGoals(data.goals || []);
        setCompletedGoals(data.completedGoals || []);
        setCustomCategories(data.customCategories || []);
        setCashBalance(data.cashBalance || 0);
        setSoundEnabled(data.soundEnabled || { add: true, delete: true, notif: true, achievement: true });
        setCardInvoices(data.cardInvoices || []);
      }
    } catch (e) {
      console.warn('Erro ao carregar:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = useCallback(async () => {
    try {
      await AsyncStorage.setItem('financas_pro_v3', JSON.stringify({
        cards: cardsRef.current,
        transactions: transactionsRef.current,
        goals: goalsRef.current,
        completedGoals: completedGoalsRef.current,
        customCategories,
        cashBalance: cashBalanceRef.current,
        soundEnabled: soundEnabledRef.current,
        cardInvoices: cardInvoicesRef.current,
      }));
    } catch (e) {
      console.warn('Erro ao salvar:', e);
    }
  }, [customCategories]);

  useEffect(() => {
    if (!isLoading) saveData();
  }, [cards, transactions, goals, completedGoals, customCategories, soundEnabled, cashBalance, cardInvoices, isLoading, saveData]);

  // ═══════════════════════════════════════════════════════════
  // ÁUDIO & NOTIFICAÇÕES
  // ═══════════════════════════════════════════════════════════

  const playSound = useCallback((type) => {
    if (!soundEnabledRef.current[type]) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      switch (type) {
        case 'add': addPlayer.play(); break;
        case 'delete': deletePlayer.play(); break;
        case 'notif': notifPlayer.play(); break;
        case 'achievement': achievementPlayer.play(); break;
      }
    } catch (e) {
      console.warn('Erro ao tocar som:', e);
    }
  }, [addPlayer, deletePlayer, notifPlayer, achievementPlayer]);

  const addNotification = useCallback((title, message, type = 'info') => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      type,
      date: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
    playSound('notif');
  }, [playSound]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    playSound('delete');
  }, [playSound]);

  // ═══════════════════════════════════════════════════════════
  // FATURAS DE CARTÃO
  // ═══════════════════════════════════════════════════════════

  const createInvoice = useCallback((cardId, month, year, totalAmount, transactions) => {
    const card = cardsRef.current.find(c => c.id === cardId);
    if (!card) return null;

    const invoice = {
      id: `inv_${Date.now()}_${cardId}`,
      cardId,
      cardName: card.name,
      month,
      year,
      totalAmount,
      transactions: transactions.map(t => t.id),
      status: 'pending',
      createdAt: new Date().toISOString(),
      paidAt: null,
      dueDate: card.dueDate || null,
    };

    setCardInvoices(prev => [...prev, invoice]);
    return invoice;
  }, []);

  const payInvoice = useCallback((invoiceId) => {
    const invoice = cardInvoicesRef.current.find(inv => inv.id === invoiceId);
    if (!invoice || invoice.status === 'paid') return false;

    if (cashBalanceRef.current < invoice.totalAmount) {
      addNotification(
        'Saldo Insuficiente',
        `Você precisa de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.totalAmount)} para quitar a fatura do ${invoice.cardName}`,
        'warning'
      );
      return false;
    }

    setCashBalance(prev => prev - invoice.totalAmount);

    setCardInvoices(prev => prev.map(inv =>
      inv.id === invoiceId
        ? { ...inv, status: 'paid', paidAt: new Date().toISOString() }
        : inv
    ));

    const paymentTransaction = {
      type: 'expense',
      desc: `Pagamento Fatura ${invoice.cardName} - ${String(invoice.month).padStart(2, '0')}/${invoice.year}`,
      amount: invoice.totalAmount,
      date: new Date().toISOString().split('T')[0],
      category: 'bills',
      categoryName: 'Contas',
      categoryIcon: 'document-text',
      categoryColor: '#6366F1',
      paymentMethod: 'cash',
      cardId: null,
      isInvoicePayment: true,
      invoiceId: invoice.id,
    };

    setTransactions(prev => [...prev, { ...paymentTransaction, id: Date.now(), createdAt: new Date().toISOString() }]);

    addNotification(
      '💳 Fatura Quitada',
      `Fatura do ${invoice.cardName} quitada no valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.totalAmount)}`,
      'success'
    );
    playSound('achievement');
    return true;
  }, [addNotification, playSound]);

  const checkCardClosings = useCallback(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    cardsRef.current.forEach(card => {
      if (!card.closeDate) return;

      const closingDay = parseInt(card.closeDate);

      if (currentDay === closingDay) {
        const existingInvoice = cardInvoicesRef.current.find(inv =>
          inv.cardId === card.id &&
          inv.month === currentMonth &&
          inv.year === currentYear
        );

        if (!existingInvoice) {
          const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
          const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
          const lastMonthStr = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`;

          const invoiceTransactions = transactionsRef.current.filter(t =>
            t.cardId === card.id &&
            t.type === 'expense' &&
            t.date.startsWith(lastMonthStr) &&
            !t.isInvoicePayment
          );

          const totalAmount = invoiceTransactions.reduce((sum, t) => sum + t.amount, 0);

          if (totalAmount > 0) {
            createInvoice(card.id, currentMonth, currentYear, totalAmount, invoiceTransactions);

            addNotification(
              '📋 Nova Fatura Gerada',
              `Fatura do ${card.name} - ${String(currentMonth).padStart(2, '0')}/${currentYear}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}`,
              'info'
            );
            playSound('notif');
          }
        }
      }
    });
  }, [createInvoice, addNotification, playSound]);

  useEffect(() => {
    if (!isLoading) {
      checkCardClosings();
    }
  }, [isLoading, checkCardClosings]);

  useEffect(() => {
    if (isLoading) return;
    const interval = setInterval(() => {
      checkCardClosings();
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoading, checkCardClosings]);

  // ═══════════════════════════════════════════════════════════
  // CRUD: CARTÕES
  // ═══════════════════════════════════════════════════════════

  const addCard = useCallback((card) => {
    setCards(prev => [...prev, { ...card, id: Date.now(), createdAt: new Date().toISOString() }]);
    playSound('add');
  }, [playSound]);

  const deleteCard = useCallback((id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    setCardInvoices(prev => prev.filter(inv => inv.cardId !== id));
    playSound('delete');
  }, [playSound]);

  const editCard = useCallback((id, updates) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
    playSound('add');
  }, [playSound]);

  // ═══════════════════════════════════════════════════════════
  // CRUD: TRANSAÇÕES
  // ═══════════════════════════════════════════════════════════

  const addTransaction = useCallback((transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    setTransactions(prev => [...prev, newTransaction]);

    if (transaction.type === 'income') {
      setCashBalance(prev => prev + transaction.amount);
    } else if (transaction.type === 'expense' || transaction.type === 'boleto') {
      setCashBalance(prev => prev - transaction.amount);
    }

    playSound('add');
  }, [playSound]);

  const deleteTransaction = useCallback((id) => {
    const transaction = transactionsRef.current.find(t => t.id === id);
    if (transaction) {
      if (transaction.type === 'income') {
        setCashBalance(prev => prev - transaction.amount);
      } else if (transaction.type === 'expense' || transaction.type === 'boleto') {
        setCashBalance(prev => prev + transaction.amount);
      }
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
    playSound('delete');
  }, [playSound]);

  const editTransaction = useCallback((id, updatedData) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
  }, []);

  const updateCashBalance = useCallback((amount) => {
    setCashBalance(prev => prev + amount);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // CRUD: METAS
  // ═══════════════════════════════════════════════════════════

  const addGoal = useCallback((goal) => {
    const newGoal = {
      ...goal,
      id: Date.now().toString(),
      name: goal.name,
      target: parseFloat(goal.target),
      current: 0,
      deadline: goal.deadline || null,
      icon: goal.icon || 'flag',
      color: goal.color || '#6366F1',
      createdAt: new Date().toISOString(),
      completed: false,
    };
    setGoals(prev => [...prev, newGoal]);
    playSound('add');
  }, [playSound]);

  const investInGoal = useCallback((goalId, amount, type = 'deposit') => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return false;

    const goal = goalsRef.current.find(g => g.id === goalId);
    if (!goal) return false;

    if (type === 'deposit') {
      if (value > cashBalanceRef.current) {
        console.warn('Saldo insuficiente:', cashBalanceRef.current, 'necessário:', value);
        return false;
      }
      setCashBalance(prev => prev - value);
      setGoals(prev => prev.map(g => {
        if (g.id !== goalId) return g;
        const newCurrent = Math.min(g.current + value, g.target);
        return { ...g, current: newCurrent };
      }));
    } else {
      if (value > goal.current) return false;
      setCashBalance(prev => prev + value);
      setGoals(prev => prev.map(g => {
        if (g.id !== goalId) return g;
        return { ...g, current: Math.max(g.current - value, 0) };
      }));
    }

    playSound('add');
    return true;
  }, [playSound]);

  const completeGoal = useCallback((goalId) => {
    const goal = goalsRef.current.find(g => g.id === goalId);
    if (!goal || goal.current < goal.target) return false;

    const completedGoal = {
      ...goal,
      completedAt: new Date().toISOString(),
    };

    setCompletedGoals(prev => [...prev, completedGoal]);
    setGoals(prev => prev.filter(g => g.id !== goalId));

    addNotification(
      '🎉 Meta Concluída!',
      `Parabéns! Você completou "${goal.name}"`,
      'success'
    );
    playSound('achievement');
    return true;
  }, [addNotification, playSound]);

  const deleteGoal = useCallback((goalId) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    setCompletedGoals(prev => prev.filter(g => g.id !== goalId));
    playSound('delete');
  }, [playSound]);

  const contributeGoal = useCallback((goalId, amount) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const newCurrent = Math.min(g.current + amount, g.target);
      const completed = newCurrent >= g.target && !g.completed;

      if (completed) {
        addNotification('🎉 Meta Alcançada!', `Parabéns! Você atingiu "${g.name}"`, 'success');
        playSound('achievement');
      }

      return { ...g, current: newCurrent, completed: completed || g.completed };
    }));
    playSound('add');
  }, [addNotification, playSound]);

  // ═══════════════════════════════════════════════════════════
  // ALERTAS AUTOMÁTICOS
  // ═══════════════════════════════════════════════════════════

  const checkBudgetAlert = useCallback(() => {
    const currentTransactions = transactionsRef.current;
    const month = new Date().toISOString().slice(0, 7);
    const income = currentTransactions
      .filter(t => t.type === 'income' && t.date.startsWith(month))
      .reduce((s, t) => s + t.amount, 0);
    const expense = currentTransactions
      .filter(t => t.type === 'expense' && t.date.startsWith(month))
      .reduce((s, t) => s + t.amount, 0);

    if (expense > income * 0.8 && income > 0) {
      addNotification(
        'Alerta de Orçamento',
        `Você já gastou ${((expense / income) * 100).toFixed(0)}% da receita mensal`,
        'warning'
      );
    }
  }, [addNotification]);

  const checkGoalsProgress = useCallback(() => {
    const currentGoals = goalsRef.current;
    currentGoals.forEach(goal => {
      const progress = (goal.current / goal.target) * 100;
      const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

      if (progress >= 100 && !goal.completed) {
        setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, completed: true } : g));
        addNotification('🎉 Meta Alcançada!', `Parabéns! Você atingiu "${goal.name}"`, 'success');
        playSound('achievement');
      }

      if (daysLeft === 7 && progress < 100) {
        addNotification(
          'Meta próxima do prazo',
          `Faltam 7 dias para "${goal.name}". Progresso: ${progress.toFixed(0)}%`,
          'warning'
        );
      }
    });
  }, [addNotification, playSound]);

  const checkCardDueDates = useCallback(() => {
    const currentCards = cardsRef.current;
    const today = new Date();
    currentCards.forEach(card => {
      if (!card.dueDate) return;
      const due = new Date(card.dueDate);
      const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff <= 3) {
        addNotification(
          'Cartão próximo do vencimento',
          `O cartão ${card.name} vence em ${diff === 0 ? 'hoje' : diff + ' dias'}`,
          'warning'
        );
      }
    });
  }, [addNotification]);

  const checkCardLimitAlert = useCallback(() => {
    const currentCards = cardsRef.current;
    const currentTransactions = transactionsRef.current;

    currentCards.forEach(card => {
      const used = currentTransactions
        .filter(t => t.cardId === card.id && t.type === 'expense' && !t.isInvoicePayment)
        .reduce((s, t) => s + t.amount, 0);
      const percentage = (used / card.limit) * 100;

      if (percentage >= 80 && percentage < 100) {
        addNotification(
          '⚠️ Limite do Cartão',
          `Você usou ${percentage.toFixed(0)}% do limite do ${card.name}`,
          'warning'
        );
      } else if (percentage >= 100) {
        addNotification(
          '🚨 Limite Excedido!',
          `O cartão ${card.name} atingiu ${percentage.toFixed(0)}% do limite!`,
          'error'
        );
      }
    });
  }, [addNotification]);

  useEffect(() => {
    if (isLoading) return;
    checkBudgetAlert();
    checkGoalsProgress();
    checkCardDueDates();
    checkCardLimitAlert();
  }, [transactions, cards, goals, isLoading, checkBudgetAlert, checkGoalsProgress, checkCardDueDates, checkCardLimitAlert]);

  // ═══════════════════════════════════════════════════════════
  // EXPORTAR / IMPORTAR
  // ═══════════════════════════════════════════════════════════

  const exportData = useCallback(async () => {
    const data = {
      version: '3.0',
      exportDate: new Date().toISOString(),
      cards: cardsRef.current,
      transactions: transactionsRef.current,
      goals: goalsRef.current,
      completedGoals: completedGoalsRef.current,
      customCategories,
      cardInvoices: cardInvoicesRef.current,
      cashBalance: cashBalanceRef.current,
      soundEnabled: soundEnabledRef.current,
    };
    return JSON.stringify(data, null, 2);
  }, [customCategories]);

  const importData = useCallback(async (jsonData) => {
    try {
      let data;
      try {
        data = JSON.parse(jsonData);
      } catch (e) {
        console.warn('Import: JSON inválido');
        return false;
      }

      if (!data || typeof data !== 'object') {
        console.warn('Import: dados inválidos');
        return false;
      }

      if (!data.version || data.version !== '3.0') {
        console.warn('Import: versão incompatível');
        return false;
      }

      const sanitizeString = (str, maxLen = 200) => {
        if (typeof str !== 'string') return '';
        return str.replace(/[<>'"&]/g, '').slice(0, maxLen);
      };

      const sanitizeArray = (arr, validator, sanitizer) => {
        if (!Array.isArray(arr)) return [];
        return arr.filter(item => {
          const valid = validator(item);
          if (!valid) console.warn('Import: item inválido ignorado');
          return valid;
        }).map(sanitizer);
      };

      const isValidCard = (c) => c && typeof c === 'object' &&
        (typeof c.id === 'string' || typeof c.id === 'number') &&
        typeof c.name === 'string' && c.name.length <= 50;

      const isValidTransaction = (t) => t && typeof t === 'object' &&
        (typeof t.id === 'string' || typeof t.id === 'number') &&
        typeof t.description === 'string' && t.description.length <= 200 &&
        typeof t.amount === 'number' && t.amount >= 0 &&
        ['income', 'expense', 'boleto'].includes(t.type);

      const isValidGoal = (g) => g && typeof g === 'object' &&
        typeof g.id === 'string' &&
        typeof g.name === 'string' && g.name.length <= 50 &&
        typeof g.target === 'number' && g.target >= 0;

      const isValidCategory = (c) => c && typeof c === 'object' &&
        typeof c.name === 'string' && c.name.length <= 30 &&
        typeof c.color === 'string';

      const isValidInvoice = (i) => i && typeof i === 'object' &&
        (typeof i.id === 'string' || typeof i.id === 'number') &&
        (typeof i.cardId === 'string' || typeof i.cardId === 'number');

      const sanitizeCard = (c) => ({
        ...c,
        name: sanitizeString(c.name, 50),
        bank: sanitizeString(c.bank, 50),
      });

      const sanitizeTransaction = (t) => ({
        ...t,
        description: sanitizeString(t.description, 200),
        category: sanitizeString(t.category, 30),
        paymentMethod: sanitizeString(t.paymentMethod, 20),
      });

      const sanitizeGoal = (g) => ({
        ...g,
        name: sanitizeString(g.name, 50),
      });

      if (data.cards) {
        const validCards = sanitizeArray(data.cards, isValidCard, sanitizeCard);
        setCards(validCards);
      }

      if (data.transactions) {
        const validTrans = sanitizeArray(data.transactions, isValidTransaction, sanitizeTransaction);
        setTransactions(validTrans);
      }

      if (data.goals) {
        const validGoals = sanitizeArray(data.goals, isValidGoal, sanitizeGoal);
        setGoals(validGoals);
      }

      if (data.completedGoals) {
        const validCompleted = sanitizeArray(data.completedGoals, isValidGoal, sanitizeGoal);
        setCompletedGoals(validCompleted);
      }

      if (data.customCategories) {
        const validCats = sanitizeArray(data.customCategories, isValidCategory, (c) => c);
        setCustomCategories(validCats);
      }

      if (data.cardInvoices) {
        const validInvoices = sanitizeArray(data.cardInvoices, isValidInvoice, (i) => i);
        setCardInvoices(validInvoices);
      }

      if (typeof data.cashBalance === 'number' && data.cashBalance >= 0) {
        setCashBalance(data.cashBalance);
      } else if (data.transactions) {
        const income = data.transactions
          .filter(t => t && t.type === 'income' && typeof t.amount === 'number')
          .reduce((s, t) => s + t.amount, 0);
        const expense = data.transactions
          .filter(t => t && (t.type === 'expense' || t.type === 'boleto') && typeof t.amount === 'number')
          .reduce((s, t) => s + t.amount, 0);
        setCashBalance(Math.max(0, income - expense));
      }

      if (data.soundEnabled && typeof data.soundEnabled === 'object') {
        const validSounds = {
          add: !!data.soundEnabled.add,
          delete: !!data.soundEnabled.delete,
          notif: !!data.soundEnabled.notif,
          achievement: !!data.soundEnabled.achievement,
        };
        setSoundEnabled(validSounds);
      }

      playSound('add');
      return true;
    } catch (err) {
      console.warn('Erro ao importar dados:', err);
      return false;
    }
  }, [playSound]);

  const markNotificationAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAllData = useCallback(() => {
    setCards([]);
    setTransactions([]);
    setGoals([]);
    setCompletedGoals([]);
    setNotifications([]);
    setCustomCategories([]);
    setCashBalance(0);
    setCardInvoices([]);
    setSharedCards([]);
    setSharedTransactions([]);
    setSharedGoals([]);
    playSound('delete');
  }, [playSound]);

  // ═══════════════════════════════════════════════════════════
  // HELPERS DE BALANCE E USO
  // ═══════════════════════════════════════════════════════════

  const getBalance = useCallback(() => {
    const currentTransactions = transactionsRef.current;
    const income = currentTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = currentTransactions.filter(t => t.type === 'expense' || t.type === 'boleto').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: cashBalanceRef.current };
  }, []);

  const getCardUsage = useCallback((cardId) => {
    return transactionsRef.current
      .filter(t => t.cardId === cardId && t.type === 'expense' && !t.isInvoicePayment)
      .reduce((s, t) => s + t.amount, 0);
  }, []);

  const getCardPendingInvoices = useCallback((cardId) => {
    return cardInvoicesRef.current
      .filter(inv => inv.cardId === cardId && inv.status === 'pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, []);

  const getCardInvoices = useCallback((cardId) => {
    return cardInvoicesRef.current
      .filter(inv => inv.cardId === cardId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, []);

  const mergedCategories = [...categories, ...customCategories];

  const addCustomCategory = useCallback((category) => {
    const newCat = { ...category, id: `custom_${Date.now()}` };
    setCustomCategories(prev => [...prev, newCat]);
    playSound('add');
    return newCat;
  }, [playSound]);

  // ═══════════════════════════════════════════════════════════
  // VALUE (tudo exposto)
  // ═══════════════════════════════════════════════════════════

  const value = {
    // ─── Dados Locais ───
    cards,
    transactions,
    goals,
    completedGoals,
    notifications,
    categories: mergedCategories,
    customCategories,
    cashBalance,
    setCashBalance,
    addCustomCategory,
    setCustomCategories,
    updateCashBalance,
    editTransaction,
    cardGradients,
    tags,
    soundEnabled,
    setSoundEnabled,
    isLoading,

    // ─── Faturas ───
    cardInvoices,
    createInvoice,
    payInvoice,
    getCardPendingInvoices,
    getCardInvoices,
    checkCardClosings,

    // ─── CRUD Locais ───
    addCard,
    deleteCard,
    editCard,
    addTransaction,
    deleteTransaction,
    addGoal,
    investInGoal,
    completeGoal,
    deleteGoal,
    contributeGoal,

    // ─── Notificações ───
    addNotification,
    checkGoalsProgress,
    checkCardDueDates,
    checkCardLimitAlert,
    markNotificationAsRead,
    clearAllNotifications,

    // ─── Export/Import ───
    exportData,
    importData,
    clearAllData,
    getBalance,
    getCardUsage,
    playSound,

    // ─── Dados Compartilhados (do CircleContext) ───
    sharedCards,
    sharedTransactions,
    sharedGoals,
    updateSharedCards,
    updateSharedTransactions,
    updateSharedGoals,

    // ─── Dados Merged (locais + compartilhados) ───
    mergedCards,
    mergedTransactions,
    mergedGoals,

    // ─── Helpers de Identificação ───
    isSharedItem,
    getItemShareInfo,
    canEditLocalOrShared,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);