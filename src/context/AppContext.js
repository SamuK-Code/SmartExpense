import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState({
    add: true,
    delete: true,
    notif: true,
    achievement: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Audio players para SDK 56 (expo-audio)
  const addPlayer = useAudioPlayer(require('../assets/sounds/add.mp3'));
  const deletePlayer = useAudioPlayer(require('../assets/sounds/delete.mp3'));
  const notifPlayer = useAudioPlayer(require('../assets/sounds/notif.mp3'));
  const achievementPlayer = useAudioPlayer(require('../assets/sounds/achievement.mp3'));

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
    { name: 'Roxo', class: 'card-gradient-purple', color: '#8B5CF6' },
    { name: 'Azul', class: 'card-gradient-blue', color: '#3B82F6' },
    { name: 'Verde', class: 'card-gradient-green', color: '#10B981' },
    { name: 'Vermelho', class: 'card-gradient-red', color: '#EF4444' },
    { name: 'Laranja', class: 'card-gradient-orange', color: '#F59E0B' },
    { name: 'Rosa', class: 'card-gradient-pink', color: '#EC4899' },
    { name: 'Turquesa', class: 'card-gradient-teal', color: '#14B8A6' },
    { name: 'Índigo', class: 'card-gradient-indigo', color: '#6366F1' },
    { name: 'Rosa Claro', class: 'card-gradient-rose', color: '#FB7185' },
    { name: 'Ciano', class: 'card-gradient-cyan', color: '#06B6D4' },
    { name: 'Esmeralda', class: 'card-gradient-emerald', color: '#34D399' },
    { name: 'Violeta', class: 'card-gradient-violet', color: '#A78BFA' },
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
        setSoundEnabled(data.soundEnabled || { add: true, delete: true, notif: true, achievement: true });
      }
    } catch (e) {
      console.warn('Erro ao carregar:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('financas_pro_v3', JSON.stringify({
        cards,
        transactions,
        goals,
        soundEnabled,
      }));
    } catch (e) {
      console.warn('Erro ao salvar:', e);
    }
  };

  useEffect(() => {
    if (!isLoading) saveData();
  }, [cards, transactions, goals, soundEnabled]);

  const playSound = useCallback((type) => {
    if (!soundEnabled[type]) return;

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
  }, [soundEnabled, addPlayer, deletePlayer, notifPlayer, achievementPlayer]);

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

  const addCard = (card) => {
    setCards(prev => [...prev, { ...card, id: Date.now(), createdAt: new Date().toISOString() }]);
    playSound('add');
  };

  const deleteCard = (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    playSound('delete');
  };

  const addTransaction = (transaction) => {
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
    checkBudgetAlert();
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    playSound('delete');
  };

  const addGoal = (goal) => {
    setGoals(prev => [...prev, { ...goal, id: Date.now(), createdAt: new Date().toISOString(), completed: false }]);
    playSound('add');
  };

  const contributeGoal = (goalId, amount) => {
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
  };

  const checkBudgetAlert = () => {
    const month = new Date().toISOString().slice(0, 7);
    const income = transactions
      .filter(t => t.type === 'income' && t.date.startsWith(month))
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(month))
      .reduce((s, t) => s + t.amount, 0);

    if (expense > income * 0.8 && income > 0) {
      addNotification(
        'Alerta de Orçamento',
        `Você já gastou ${((expense / income) * 100).toFixed(0)}% da receita mensal`,
        'warning'
      );
    }
  };

  const checkGoalsProgress = () => {
    goals.forEach(goal => {
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
  };

  const checkCardDueDates = () => {
    const today = new Date();
    cards.forEach(card => {
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
  };

  const exportData = async () => {
    const data = { cards, transactions, goals, exportDate: new Date().toISOString() };
    return JSON.stringify(data, null, 2);
  };

  const importData = async (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.cards) setCards(data.cards);
      if (data.transactions) setTransactions(data.transactions);
      if (data.goals) setGoals(data.goals);
      playSound('add');
      return true;
    } catch (err) {
      return false;
    }
  };

  const clearAllData = () => {
    setCards([]);
    setTransactions([]);
    setGoals([]);
    setNotifications([]);
    playSound('delete');
  };

  const getBalance = () => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense' || t.type === 'boleto').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  };

  const getCardUsage = (cardId) => {
    return transactions
      .filter(t => t.cardId === cardId && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
  };

  const value = {
    cards,
    transactions,
    goals,
    notifications,
    categories,
    cardGradients,
    tags,
    soundEnabled,
    setSoundEnabled,
    addCard,
    deleteCard,
    addTransaction,
    deleteTransaction,
    addGoal,
    contributeGoal,
    addNotification,
    checkGoalsProgress,
    checkCardDueDates,
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
