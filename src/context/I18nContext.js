import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const I18nContext = createContext();

const STORAGE_KEY = '@app_language';

const translations = {
  'pt-BR': {
    // Dashboard
    dashboard: 'Dashboard',
    overview: 'Visão Geral',
    today: 'Hoje',
    week: 'Semana',
    month: 'Mês',
    year: 'Ano',
    all: 'Todos',
    availableCash: 'Dinheiro em Caixa',
    myCards: 'Meus Cartões',
    topCategories: 'Top Categorias',
    recentExpenses: 'Gastos Recentes',
    seeAll: 'Ver Tudo',
    showAll: 'Ver Todos',
    showLess: 'Ver Menos',
    noExpenses: 'Nenhum gasto registrado',
    addFirstExpense: 'Adicione seu primeiro gasto',
    noCashEntries: 'Nenhuma entrada de caixa',
    goals: 'Metas',

    // Greetings
    morning: 'Bom dia!',
    afternoon: 'Boa tarde!',
    evening: 'Boa noite!',

    // Summary
    used: 'Usado',
    available: 'Disponível',
    limit: 'Limite',
    limitExceeded: 'Limite Excedido',
    nearLimit: 'Próximo do Limite',
    total: 'Total',
    transactions: 'Transações',

    // Expenses
    expenses: 'Gastos',
    addExpense: 'Adicionar Gasto',
    newExpense: 'Novo Gasto',
    expenseAdded: 'Gasto adicionado com sucesso!',
    expenseUpdated: 'Gasto atualizado com sucesso!',
    expenseDeleted: 'Gasto removido com sucesso!',
    editExpense: 'Editar Gasto',
    deleteExpense: 'Excluir Gasto',
    confirmDeleteExpense: 'Deseja excluir o gasto',
    amount: 'Valor',
    description: 'Descrição',
    category: 'Categoria',
    date: 'Data',
    invalidAmount: 'Valor inválido',
    invalidDescription: 'Descrição inválida',
    invalidDate: 'Data inválida',
    invalidCard: 'Selecione um cartão',

    // Expense Types
    expenseType: 'Tipo de Gasto',
    card: 'Cartão',
    standalone: 'Boleto/Avulso',
    credit: 'Crédito',
    debit: 'Débito',
    paymentMethod: 'Forma de Pagamento',
    selectCard: 'Selecionar Cartão',

    // Pay
    pay: 'Quitar',
    paid: 'Pago',
    confirmPay: 'Confirmar Pagamento',
    wantToPay: 'Deseja quitar',
    unpaidExpense: 'gasto pendente',
    unpaidExpenses: 'gastos pendentes',

    // Bill / Fatura
    bill: 'Fatura',
    dueDate: 'Dia de Vencimento',
    dueDateShort: 'Venc.',
    billAmount: 'Valor da Fatura',
    billCreated: 'Fatura criada com sucesso!',
    billPaid: 'Fatura quitada com sucesso!',
    currentBill: 'Fatura Atual',
    cardPaused: 'Cartão Pausado',
    cardPausedMessage: 'Este cartão está pausado. Quite a fatura atual para adicionar novos gastos.',
    cardUnpaused: 'Cartão liberado',
    generateBill: 'Gerar Fatura',

    // Cards
    addCard: 'Adicionar Cartão',
    newCard: 'Novo Cartão',
    editCard: 'Editar Cartão',
    cardAdded: 'Cartão adicionado com sucesso!',
    cardUpdated: 'Cartão atualizado com sucesso!',
    cardDeleted: 'Cartão removido com sucesso!',
    confirmDeleteCard: 'Deseja excluir o cartão',
    cardExpensesWarning: 'Os gastos associados a este cartão serão mantidos no histórico.',
    cardName: 'Nome do Cartão',
    cardNickname: 'Apelido do Cartão',
    cardLimit: 'Limite do Cartão',
    cardBank: 'Banco',
    selectBank: 'Selecionar Banco',
    noCardExpenses: 'Nenhum gasto neste cartão',
    viewExpenses: 'Ver Gastos',
    cardExpenses: 'Gastos do Cartão',

    // Cash
    cash: 'Caixa',
    addCash: 'Adicionar Caixa',
    editCash: 'Editar Caixa',
    previousValue: 'Valor Anterior',
    newValue: 'Novo Valor',

    // Categories
    categories: 'Categorias',
    addCategory: 'Adicionar Categoria',
    editCategory: 'Editar Categoria',
    categoryAdded: 'Categoria adicionada com sucesso!',
    categoryUpdated: 'Categoria atualizada com sucesso!',
    categoryDeleted: 'Categoria removida com sucesso!',
    confirmDeleteCategory: 'Deseja excluir a categoria',
    categoryName: 'Nome da Categoria',
    categoryColor: 'Cor da Categoria',
    categoryIcon: 'Ícone da Categoria',
    noCategories: 'Nenhuma categoria',

    // Planning
    planning: 'Planejamento',
    addGoal: 'Adicionar Meta',
    editGoal: 'Editar Meta',
    goalName: 'Nome da Meta',
    targetAmount: 'Valor Alvo',
    currentAmount: 'Valor Atual',
    goalAdded: 'Meta adicionada com sucesso!',
    goalUpdated: 'Meta atualizada com sucesso!',
    goalDeleted: 'Meta removida com sucesso!',
    confirmDeleteGoal: 'Deseja excluir a meta',
    noGoals: 'Nenhuma meta definida',
    addFirstGoal: 'Adicione sua primeira meta',
    feasibility: 'Viabilidade',
    dailyBudget: 'Orçamento Diário',
    weeklyBudget: 'Orçamento Semanal',
    remaining: 'Restante',

    // History
    history: 'Histórico',

    // Charts
    charts: 'Gráficos',
    expensesByCategory: 'Gastos por Categoria',
    expensesByCard: 'Gastos por Cartão',
    expensesByMonth: 'Gastos por Mês',
    noData: 'Sem dados',

    // More
    more: 'Mais',
    summary: 'Resumo',
    statistics: 'Estatísticas',
    exportData: 'Exportar Dados',
    importData: 'Importar Dados',
    clearData: 'Limpar Dados',
    clearDataWarning: 'Isso apagará TODOS os dados do aplicativo.',
    clearDataConfirm: 'Tem certeza? Esta ação não pode ser desfeita.',
    clearAll: 'Limpar Tudo',
    dataCleared: 'Dados limpos com sucesso!',
    about: 'Sobre',
    version: 'Versão 1.0.0',

    // Settings
    settings: 'Configurações',
    language: 'Idioma',
    theme: 'Tema',
    darkMode: 'Modo Escuro',
    lightMode: 'Modo Claro',
    notifications: 'Notificações',
    enableNotifications: 'Ativar Notificações',

    // Language
    selectLanguage: 'Selecionar Idioma',
    portuguese: 'Português',
    english: 'Inglês',

    // General
    success: 'Sucesso',
    error: 'Erro',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    save: 'Salvar',
    edit: 'Editar',
    add: 'Adicionar',
    yes: 'Sim',
    no: 'Não',
    done: 'Concluído',
    ok: 'OK',
    loading: 'Carregando...',
  },
  'en': {
    // Dashboard
    dashboard: 'Dashboard',
    overview: 'Overview',
    today: 'Today',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    all: 'All',
    availableCash: 'Cash Available',
    myCards: 'My Cards',
    topCategories: 'Top Categories',
    recentExpenses: 'Recent Expenses',
    seeAll: 'See All',
    showAll: 'Show All',
    showLess: 'Show Less',
    noExpenses: 'No expenses recorded',
    addFirstExpense: 'Add your first expense',
    noCashEntries: 'No cash entries',
    goals: 'Goals',

    // Greetings
    morning: 'Good morning!',
    afternoon: 'Good afternoon!',
    evening: 'Good evening!',

    // Summary
    used: 'Used',
    available: 'Available',
    limit: 'Limit',
    limitExceeded: 'Limit Exceeded',
    nearLimit: 'Near Limit',
    total: 'Total',
    transactions: 'Transactions',

    // Expenses
    expenses: 'Expenses',
    addExpense: 'Add Expense',
    newExpense: 'New Expense',
    expenseAdded: 'Expense added successfully!',
    expenseUpdated: 'Expense updated successfully!',
    expenseDeleted: 'Expense removed successfully!',
    editExpense: 'Edit Expense',
    deleteExpense: 'Delete Expense',
    confirmDeleteExpense: 'Do you want to delete the expense',
    amount: 'Amount',
    description: 'Description',
    category: 'Category',
    date: 'Date',
    invalidAmount: 'Invalid amount',
    invalidDescription: 'Invalid description',
    invalidDate: 'Invalid date',
    invalidCard: 'Select a card',

    // Expense Types
    expenseType: 'Expense Type',
    card: 'Card',
    standalone: 'Bill/Standalone',
    credit: 'Credit',
    debit: 'Debit',
    paymentMethod: 'Payment Method',
    selectCard: 'Select Card',

    // Pay
    pay: 'Pay',
    paid: 'Paid',
    confirmPay: 'Confirm Payment',
    wantToPay: 'Do you want to pay',
    unpaidExpense: 'unpaid expense',
    unpaidExpenses: 'unpaid expenses',

    // Bill / Invoice
    bill: 'Bill',
    dueDate: 'Due Date',
    dueDateShort: 'Due',
    billAmount: 'Bill Amount',
    billCreated: 'Bill created successfully!',
    billPaid: 'Bill paid successfully!',
    currentBill: 'Current Bill',
    cardPaused: 'Card Paused',
    cardPausedMessage: 'This card is paused. Pay the current bill to add new expenses.',
    cardUnpaused: 'Card unlocked',
    generateBill: 'Generate Bill',

    // Cards
    addCard: 'Add Card',
    newCard: 'New Card',
    editCard: 'Edit Card',
    cardAdded: 'Card added successfully!',
    cardUpdated: 'Card updated successfully!',
    cardDeleted: 'Card removed successfully!',
    confirmDeleteCard: 'Do you want to delete the card',
    cardExpensesWarning: 'Expenses associated with this card will be kept in history.',
    cardName: 'Card Name',
    cardNickname: 'Card Nickname',
    cardLimit: 'Card Limit',
    cardBank: 'Bank',
    selectBank: 'Select Bank',
    noCardExpenses: 'No expenses on this card',
    viewExpenses: 'View Expenses',
    cardExpenses: 'Card Expenses',

    // Cash
    cash: 'Cash',
    addCash: 'Add Cash',
    editCash: 'Edit Cash',
    previousValue: 'Previous Value',
    newValue: 'New Value',

    // Categories
    categories: 'Categories',
    addCategory: 'Add Category',
    editCategory: 'Edit Category',
    categoryAdded: 'Category added successfully!',
    categoryUpdated: 'Category updated successfully!',
    categoryDeleted: 'Category removed successfully!',
    confirmDeleteCategory: 'Do you want to delete the category',
    categoryName: 'Category Name',
    categoryColor: 'Category Color',
    categoryIcon: 'Category Icon',
    noCategories: 'No categories',

    // Planning
    planning: 'Planning',
    addGoal: 'Add Goal',
    editGoal: 'Edit Goal',
    goalName: 'Goal Name',
    targetAmount: 'Target Amount',
    currentAmount: 'Current Amount',
    goalAdded: 'Goal added successfully!',
    goalUpdated: 'Goal updated successfully!',
    goalDeleted: 'Goal removed successfully!',
    confirmDeleteGoal: 'Do you want to delete the goal',
    noGoals: 'No goals defined',
    addFirstGoal: 'Add your first goal',
    feasibility: 'Feasibility',
    dailyBudget: 'Daily Budget',
    weeklyBudget: 'Weekly Budget',
    remaining: 'Remaining',

    // History
    history: 'History',

    // Charts
    charts: 'Charts',
    expensesByCategory: 'Expenses by Category',
    expensesByCard: 'Expenses by Card',
    expensesByMonth: 'Expenses by Month',
    noData: 'No data',

    // More
    more: 'More',
    summary: 'Summary',
    statistics: 'Statistics',
    exportData: 'Export Data',
    importData: 'Import Data',
    clearData: 'Clear Data',
    clearDataWarning: 'This will erase ALL app data.',
    clearDataConfirm: 'Are you sure? This action cannot be undone.',
    clearAll: 'Clear All',
    dataCleared: 'Data cleared successfully!',
    about: 'About',
    version: 'Version 1.0.0',

    // Settings
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    notifications: 'Notifications',
    enableNotifications: 'Enable Notifications',

    // Language
    selectLanguage: 'Select Language',
    portuguese: 'Portuguese',
    english: 'English',

    // General
    success: 'Success',
    error: 'Error',
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    edit: 'Edit',
    add: 'Add',
    yes: 'Yes',
    no: 'No',
    done: 'Done',
    ok: 'OK',
    loading: 'Loading...',
  },
};

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState('pt-BR');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && translations[stored]) {
          setLanguage(stored);
        }
      } catch (e) {
        console.error('Error loading language:', e);
      } finally {
        setLoading(false);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {
        console.error('Error saving language:', e);
      }
    }
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    loading,
    availableLanguages: Object.keys(translations),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
