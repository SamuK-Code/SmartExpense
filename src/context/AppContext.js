import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
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

  // Refs para acessar estado atual dentro de callbacks sem stale closure
  const transactionsRef = useRef(transactions);
  const cardsRef = useRef(cards);
  const goalsRef = useRef(goals);
  const soundEnabledRef = useRef(soundEnabled);
  const cashBalanceRef = useRef(cashBalance);

  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);
  useEffect(() => { cardsRef.current = cards; }, [cards]);
  useEffect(() => { goalsRef.current = goals; }, [goals]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { cashBalanceRef.current = cashBalance; }, [cashBalance]);

  // Audio players para SDK 56 (expo-audio)
  const addPlayer = useAudioPlayer(require('../../assets/sounds/add.mp3'));
  const deletePlayer = useAudioPlayer(require('../../assets/sounds/delete.mp3'));
  const notifPlayer = useAudioPlayer(require('../../assets/sounds/notif.mp3'));
  const achievementPlayer = useAudioPlayer(require('../../assets/sounds/achievement.mp3'));

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

  const cardGradients = [
    // ═══════ GRADIENTES (15) ═══════
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

    // ═══════ CORES SÓLIDAS (3) ═══════
    { name: 'Preto Fosco', class: 'card-solid-black', color: '#1C1917', type: 'solid' },
    { name: 'Branco Pérola', class: 'card-solid-white', color: '#F5F5F4', type: 'solid' },
    { name: 'Dourado', class: 'card-solid-gold', color: '#D4AF37', type: 'solid' },

    // ═══════ TEMPLATES COM IMAGEM (6) ═══════
    { name: 'Premium Dark', class: 'card-template-dark', color: '#1E1B4B', type: 'template' },
	{ name: 'Premium Color', class: 'card-template-color', color: '#D4AF37', type: 'template' },
    { name: 'Gold Metal', class: 'card-template-gold', color: '#D4AF37', type: 'template' },
    { name: 'Holográfico', class: 'card-template-holo', color: '#C084FC', type: 'template' },
    { name: 'Carbon Fiber', class: 'card-template-carbon', color: '#374151', type: 'template' },
    { name: 'Mármore', class: 'card-template-marble', color: '#F5F5F4', type: 'template' },
    { name: 'Glass', class: 'card-template-glass', color: '#A5B4FC', type: 'template' },
  ];

  const tags = ['Urgente', 'Parcelado', 'Fixo', 'Extra'];

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
        setCustomCategories(data.customCategories || []);
        setCashBalance(data.cashBalance || 0);
        setSoundEnabled(data.soundEnabled || { add: true, delete: true, notif: true, achievement: true });
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
        customCategories,
    cashBalance,
    setCashBalance,
        cashBalance: cashBalanceRef.current,
        soundEnabled: soundEnabledRef.current,
      }));
    } catch (e) {
      console.warn('Erro ao salvar:', e);
    }
  }, [customCategories]);

  useEffect(() => {
    if (!isLoading) saveData();
  }, [cards, transactions, goals, customCategories, soundEnabled, cashBalance, isLoading, saveData]);

  const playSound = useCallback((type) => {
    if (!soundEnabledRef.current[type]) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      switch (type) {
        case 'add':
          addPlayer.play();
          break;
        case 'delete':
          deletePlayer.play();
          break;
        case 'notif':
          notifPlayer.play();
          break;
        case 'achievement':
          achievementPlayer.play();
          break;
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

  const addCard = useCallback((card) => {
    setCards(prev => [...prev, { ...card, id: Date.now(), createdAt: new Date().toISOString() }]);
    playSound('add');
  }, [playSound]);

  const deleteCard = useCallback((id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    playSound('delete');
  }, [playSound]);
  const editCard = useCallback((id, updates) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
    playSound('add');
  }, [playSound]);


  const addTransaction = useCallback((transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    setTransactions(prev => [...prev, newTransaction]);

    if (transaction.type === 'income') {
      setGoals(prev => prev.map(g => ({
        ...g,
        current: Math.min(g.current + transaction.amount, g.target),
      })));
    }

    playSound('add');
  }, [playSound]);

  const deleteTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    playSound('delete');
  }, [playSound]);

  const addGoal = useCallback((goal) => {
    setGoals(prev => [...prev, { ...goal, id: Date.now(), createdAt: new Date().toISOString(), completed: false }]);
    playSound('add');
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

  // ✅ CORREÇÃO: checkBudgetAlert usando refs para acessar estado atual
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

  // ✅ CORREÇÃO: checkGoalsProgress usando refs
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

  // ✅ CORREÇÃO: checkCardDueDates usando refs
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

  // ✅ CORREÇÃO: checkCardLimitAlert usando refs
  const checkCardLimitAlert = useCallback(() => {
    const currentCards = cardsRef.current;
    const currentTransactions = transactionsRef.current;

    currentCards.forEach(card => {
      const used = currentTransactions
        .filter(t => t.cardId === card.id && t.type === 'expense')
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

  // ✅ NOVO: useEffect para rodar verificações quando dados mudam
  useEffect(() => {
    if (isLoading) return;
    checkBudgetAlert();
    checkGoalsProgress();
    checkCardDueDates();
    checkCardLimitAlert();
  }, [transactions, cards, goals, isLoading, checkBudgetAlert, checkGoalsProgress, checkCardDueDates, checkCardLimitAlert]);

  const exportData = useCallback(async () => {
    const data = { 
      cards: cardsRef.current, 
      transactions: transactionsRef.current, 
      goals: goalsRef.current, 
      exportDate: new Date().toISOString() 
    };
    return JSON.stringify(data, null, 2);
  }, []);

  const importData = useCallback(async (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.cards) setCards(data.cards);
      if (data.transactions) setTransactions(data.transactions);
      if (data.goals) setGoals(data.goals);
      if (data.customCategories) setCustomCategories(data.customCategories);
      playSound('add');
      return true;
    } catch (err) {
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
    setNotifications([]);
    setCustomCategories([]);
    setCashBalance(0);
    playSound('delete');
  }, [playSound]);

  const getBalance = useCallback(() => {
    const currentTransactions = transactionsRef.current;
    const income = currentTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = currentTransactions.filter(t => t.type === 'expense' || t.type === 'boleto').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense + cashBalanceRef.current };
  }, []);

  const getCardUsage = useCallback((cardId) => {
    return transactionsRef.current
      .filter(t => t.cardId === cardId && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
  }, []);

  // Combina categorias padrão + customizadas
  const mergedCategories = [...categories, ...customCategories];

  const addCustomCategory = useCallback((category) => {
    const newCat = { ...category, id: `custom_${Date.now()}` };
    setCustomCategories(prev => [...prev, newCat]);
    playSound('add');
    return newCat;
  }, [playSound]);

  const value = {
    cards,
    transactions,
    goals,
    notifications,
    categories: mergedCategories,
    customCategories,
    cashBalance,
    setCashBalance,
    addCustomCategory,
    cardGradients,
    tags,
    soundEnabled,
    setSoundEnabled,
    addCard,
    deleteCard,
    editCard,
    addTransaction,
    deleteTransaction,
    addGoal,
    contributeGoal,
    addNotification,
    checkGoalsProgress,
    checkCardDueDates,
    checkCardLimitAlert,
    markNotificationAsRead,
    clearAllNotifications,
    exportData,
    importData,
    clearAllData,
    getBalance,
    getCardUsage,
    playSound,
    isLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);