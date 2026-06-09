import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const I18nContext = createContext();

const STORAGE_KEY = '@app_language';

// ============================================
// TRADUÇÕES
// ============================================
export const translations = {
  'pt-BR': {
    // Geral
    appName: 'Check Finances',
    loading: 'Carregando...',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    add: 'Adicionar',
    close: 'Fechar',
    confirm: 'Confirmar',
    yes: 'Sim',
    no: 'Não',
    ok: 'OK',
    error: 'Erro',
    success: 'Sucesso',
    warning: 'Aviso',

    // Navegação
    home: 'Início',
    addExpense: 'Adicionar',
    history: 'Histórico',
    charts: 'Gráficos',
    planning: 'Planejar',
    cards: 'Cartões',
    menu: 'Menu',
    settings: 'Configurações',

    // Home
    welcome: 'Bem-vindo',
    totalBalance: 'Saldo Total',
    monthlyExpenses: 'Gastos do Mês',
    availableCash: 'Caixa Disponível',
    quickActions: 'Ações Rápidas',
    recentExpenses: 'Gastos Recentes',
    viewAll: 'Ver Todos',
    noExpenses: 'Nenhum gasto registrado',
    addFirstExpense: 'Adicione seu primeiro gasto',

    // Gastos
    newExpense: 'Novo Gasto',
    editExpense: 'Editar Gasto',
    expenseType: 'Tipo de Gasto',
    card: 'Cartão',
    standalone: 'Boleto/Avulso',
    paymentMethod: 'Forma de Pagamento',
    credit: 'Crédito',
    debit: 'Débito',
    cash: 'Dinheiro',
    amount: 'Valor (R$)',
    description: 'Descrição',
    date: 'Data',
    category: 'Categoria',
    selectCard: 'Selecione um Cartão',
    addExpenseBtn: 'Salvar Gasto',
    expenseAdded: 'Gasto adicionado com sucesso!',
    expenseUpdated: 'Gasto atualizado com sucesso!',
    expenseDeleted: 'Gasto excluído com sucesso!',
    confirmDeleteExpense: 'Deseja excluir este gasto?',

    // Caixa
    addCash: 'Adicionar ao Caixa',
    cashAmount: 'Valor do Caixa',
    cashDescription: 'Descrição da Entrada',
    cashDate: 'Data da Entrada',
    cashAdded: 'Entrada adicionada ao caixa!',
    cashUpdated: 'Entrada atualizada!',
    cashDeleted: 'Entrada removida do caixa!',
    editCash: 'Editar Entrada',
    cashHistory: 'Histórico do Caixa',
    noCashEntries: 'Nenhuma entrada no caixa',

    // Cartões
    myCards: 'Meus Cartões',
    newCard: 'Novo Cartão',
    editCard: 'Editar Cartão',
    cardName: 'Nome do Cartão',
    cardLimit: 'Limite do Cartão',
    cardBank: 'Banco',
    selectBank: 'Selecionar Banco',
    cardNickname: 'Apelido (opcional)',
    cardAdded: 'Cartão adicionado!',
    cardUpdated: 'Cartão atualizado!',
    cardDeleted: 'Cartão excluído!',
    confirmDeleteCard: 'Deseja excluir este cartão?',
    cardExpensesWarning: 'Os gastos associados não serão excluídos.',
    used: 'Usado',
    available: 'Disponível',
    limit: 'Limite',
    limitExceeded: 'Limite excedido!',
    nearLimit: 'Quase no limite',
    viewExpenses: 'Ver Gastos',
    cardDetails: 'Detalhes do Cartão',
    cardExpenses: 'Gastos do Cartão',
    noCardExpenses: 'Nenhum gasto neste cartão',

    // Categorias
    categories: 'Categorias',
    newCategory: 'Nova Categoria',
    editCategory: 'Editar Categoria',
    categoryName: 'Nome da Categoria',
    categoryColor: 'Cor',
    categoryIcon: 'Ícone',
    categoryAdded: 'Categoria adicionada!',
    categoryUpdated: 'Categoria atualizada!',
    categoryDeleted: 'Categoria excluída!',
    confirmDeleteCategory: 'Deseja excluir esta categoria?',
    categoryFallback: 'Gastos migrados automaticamente para categoria similar.',
    noLimit: 'Sem limite',

    // Gráficos
    byCategory: 'Por Categoria',
    byPayment: 'Cartão/Avulso',
    totalPeriod: 'Total do Período',
    transactions: 'transações',
    insufficientCash: 'Caixa Insuficiente!',
    cashDeficit: 'Gastos {expenses} > Caixa {cash}. Faltam {deficit}.',
    detail: 'Detalhamento',
    tapToFilter: 'Toque na barra para filtrar',
    tapToClear: 'Toque na barra para ver todos',
    clearFilter: 'Limpar filtro',
    monthlySummary: 'Resumo por Mês',
    month: 'Mês',
    total: 'Total',
    yearPercent: '% do Ano',

    // Planejamento
    goals: 'Metas',
    newGoal: 'Nova Meta',
    editGoal: 'Editar Meta',
    goalName: 'Nome da Meta',
    goalAmount: 'Valor da Meta',
    goalDate: 'Data Alvo',
    goalAdded: 'Meta adicionada!',
    goalUpdated: 'Meta atualizada!',
    goalDeleted: 'Meta excluída!',
    goalCompleted: 'Meta concluída!',
    feasibility: 'Viabilidade',
    feasible: 'Compra tranquila!',
    feasibleWarning: 'Compra possível mas compromete caixa',
    notFeasible: 'Valor em caixa insuficiente',
    noCash: 'Sem dinheiro em caixa',
    dailyBudget: 'Orçamento Diário',
    weeklyBudget: 'Orçamento Semanal',

    // Configurações
    language: 'Idioma',
    selectLanguage: 'Selecionar Idioma',
    portuguese: 'Português (BR)',
    english: 'English',
    theme: 'Tema',
    darkMode: 'Modo Escuro',
    lightMode: 'Modo Claro',
    notifications: 'Notificações',
    exportData: 'Exportar Dados',
    importData: 'Importar Dados',
    about: 'Sobre',
    version: 'Versão',

    // Períodos
    today: 'Hoje',
    week: '7 Dias',
    month: 'Mês',
    year: 'Ano',
    all: 'Todos',

    // Erros
    invalidAmount: 'Digite um valor válido',
    invalidDescription: 'Digite uma descrição',
    invalidCategory: 'Selecione uma categoria',
    invalidCard: 'Selecione um cartão',
    invalidDate: 'Digite uma data válida',
    requiredField: 'Campo obrigatório',

    // Categorias padrão
    food: 'Alimentação',
    transport: 'Transporte',
    leisure: 'Lazer',
    health: 'Saúde',
    housing: 'Moradia',
    education: 'Educação',
    shopping: 'Compras',
    others: 'Outros',
  },

  'en': {
    // General
    appName: 'Check Finances',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',

    // Navigation
    home: 'Home',
    addExpense: 'Add',
    history: 'History',
    charts: 'Charts',
    planning: 'Planning',
    cards: 'Cards',
    menu: 'Menu',
    settings: 'Settings',

    // Home
    welcome: 'Welcome',
    totalBalance: 'Total Balance',
    monthlyExpenses: 'Monthly Expenses',
    availableCash: 'Available Cash',
    quickActions: 'Quick Actions',
    recentExpenses: 'Recent Expenses',
    viewAll: 'View All',
    noExpenses: 'No expenses registered',
    addFirstExpense: 'Add your first expense',

    // Expenses
    newExpense: 'New Expense',
    editExpense: 'Edit Expense',
    expenseType: 'Expense Type',
    card: 'Card',
    standalone: 'Bill/Standalone',
    paymentMethod: 'Payment Method',
    credit: 'Credit',
    debit: 'Debit',
    cash: 'Cash',
    amount: 'Amount (R$)',
    description: 'Description',
    date: 'Date',
    category: 'Category',
    selectCard: 'Select a Card',
    addExpenseBtn: 'Save Expense',
    expenseAdded: 'Expense added successfully!',
    expenseUpdated: 'Expense updated successfully!',
    expenseDeleted: 'Expense deleted successfully!',
    confirmDeleteExpense: 'Do you want to delete this expense?',

    // Cash
    addCash: 'Add to Cash',
    cashAmount: 'Cash Amount',
    cashDescription: 'Entry Description',
    cashDate: 'Entry Date',
    cashAdded: 'Cash entry added!',
    cashUpdated: 'Cash entry updated!',
    cashDeleted: 'Cash entry removed!',
    editCash: 'Edit Entry',
    cashHistory: 'Cash History',
    noCashEntries: 'No cash entries',

    // Cards
    myCards: 'My Cards',
    newCard: 'New Card',
    editCard: 'Edit Card',
    cardName: 'Card Name',
    cardLimit: 'Card Limit',
    cardBank: 'Bank',
    selectBank: 'Select Bank',
    cardNickname: 'Nickname (optional)',
    cardAdded: 'Card added!',
    cardUpdated: 'Card updated!',
    cardDeleted: 'Card deleted!',
    confirmDeleteCard: 'Do you want to delete this card?',
    cardExpensesWarning: 'Associated expenses will not be deleted.',
    used: 'Used',
    available: 'Available',
    limit: 'Limit',
    limitExceeded: 'Limit exceeded!',
    nearLimit: 'Near limit',
    viewExpenses: 'View Expenses',
    cardDetails: 'Card Details',
    cardExpenses: 'Card Expenses',
    noCardExpenses: 'No expenses on this card',

    // Categories
    categories: 'Categories',
    newCategory: 'New Category',
    editCategory: 'Edit Category',
    categoryName: 'Category Name',
    categoryColor: 'Color',
    categoryIcon: 'Icon',
    categoryAdded: 'Category added!',
    categoryUpdated: 'Category updated!',
    categoryDeleted: 'Category deleted!',
    confirmDeleteCategory: 'Do you want to delete this category?',
    categoryFallback: 'Expenses automatically migrated to similar category.',
    noLimit: 'No limit',

    // Charts
    byCategory: 'By Category',
    byPayment: 'Card/Standalone',
    totalPeriod: 'Period Total',
    transactions: 'transactions',
    insufficientCash: 'Insufficient Cash!',
    cashDeficit: 'Expenses {expenses} > Cash {cash}. Missing {deficit}.',
    detail: 'Details',
    tapToFilter: 'Tap bar to filter',
    tapToClear: 'Tap bar to see all',
    clearFilter: 'Clear filter',
    monthlySummary: 'Monthly Summary',
    month: 'Month',
    total: 'Total',
    yearPercent: '% of Year',

    // Planning
    goals: 'Goals',
    newGoal: 'New Goal',
    editGoal: 'Edit Goal',
    goalName: 'Goal Name',
    goalAmount: 'Goal Amount',
    goalDate: 'Target Date',
    goalAdded: 'Goal added!',
    goalUpdated: 'Goal updated!',
    goalDeleted: 'Goal deleted!',
    goalCompleted: 'Goal completed!',
    feasibility: 'Feasibility',
    feasible: 'Smooth purchase!',
    feasibleWarning: 'Purchase possible but affects cash',
    notFeasible: 'Insufficient cash balance',
    noCash: 'No money in cash',
    dailyBudget: 'Daily Budget',
    weeklyBudget: 'Weekly Budget',

    // Settings
    language: 'Language',
    selectLanguage: 'Select Language',
    portuguese: 'Portuguese (BR)',
    english: 'English',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    notifications: 'Notifications',
    exportData: 'Export Data',
    importData: 'Import Data',
    about: 'About',
    version: 'Version',

    // Periods
    today: 'Today',
    week: '7 Days',
    month: 'Month',
    year: 'Year',
    all: 'All',

    // Errors
    invalidAmount: 'Enter a valid amount',
    invalidDescription: 'Enter a description',
    invalidCategory: 'Select a category',
    invalidCard: 'Select a card',
    invalidDate: 'Enter a valid date',
    requiredField: 'Required field',

    // Default categories
    food: 'Food',
    transport: 'Transport',
    leisure: 'Leisure',
    health: 'Health',
    housing: 'Housing',
    education: 'Education',
    shopping: 'Shopping',
    others: 'Others',
  }
};

export const availableLanguages = [
  { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState('pt-BR');
  const [loading, setLoading] = useState(true);

  // Carregar idioma salvo
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedLang && translations[savedLang]) {
          setLanguage(savedLang);
        }
      } catch (error) {
        console.error('Erro ao carregar idioma:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLanguage();
  }, []);

  // Salvar idioma quando mudar
  const changeLanguage = useCallback(async (langCode) => {
    if (translations[langCode]) {
      setLanguage(langCode);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, langCode);
      } catch (error) {
        console.error('Erro ao salvar idioma:', error);
      }
    }
  }, []);

  // Função de tradução
  const t = useCallback((key, params = {}) => {
    const translation = translations[language]?.[key] || translations['en']?.[key] || key;

    // Substituir parâmetros {chave} por valores
    return Object.entries(params).reduce(
      (acc, [paramKey, paramValue]) => acc.replace(`{${paramKey}}`, paramValue),
      translation
    );
  }, [language]);

  const value = {
    language,
    changeLanguage,
    t,
    loading,
    availableLanguages,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
