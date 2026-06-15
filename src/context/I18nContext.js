import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const I18nContext = createContext();

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
    clear: 'Limpar',
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
    none: 'Nenhum',
    done: 'Concluído',

    // Componentes / Geral
    understood: 'Entendi',
    bill: 'Fatura',
    billCreated: 'Fatura criada!',
    dueDateShort: 'Venc.',
    billAmount: 'Valor da fatura',
    cardPaused: 'Cartão pausado',
    morning: 'Bom dia!',
    afternoon: 'Boa tarde!',
    evening: 'Boa noite!',
    overview: 'Visão geral',
    unpaidExpense: 'despesa pendente',
    unpaidExpenses: 'despesas pendentes',
    seeAll: 'Ver todos',
    topCategories: 'Top Categorias',
    showLess: 'Ver menos',
    dueDate: 'Vencimento',
    billPaid: 'Fatura paga!',
    searchPlaceholder: 'Buscar banco...',
    mostUsed: 'Mais usados',
    popular: 'Populares',
    allBanks: 'Todos os bancos',
    results: 'Resultados',
    noBankFound: 'Nenhum banco encontrado',
    errorLoadingBanks: 'Erro ao carregar bancos',
    chooseBank: 'Escolher Banco',
    noItem: 'Nenhum item',
    addFirstItem: 'Adicione o primeiro item',
    tapToClear: 'Toque para limpar filtro',
    tapToFilter: 'Toque para filtrar',
    noExpenseFound: 'Nenhum gasto encontrado',
    avgPerExpense: 'Média por gasto',
    maxExpense: 'Maior gasto',
    minExpense: 'Menor gasto',
    registeredExpenses: 'gastos registrados',
    resetCategories: 'Resetar Categorias',
    resetCategoriesDesc: 'Deseja restaurar as categorias padrões? Isso removerá todas as categorias atuais.',
    reset: 'Resetar',
    languageInfo: 'O idioma selecionado será aplicado em todo o aplicativo.',
    soon: 'Em breve',
    developedIn: 'Desenvolvido com ❤️ no Brasil',
    tryAgain: 'Tentar Novamente',
    appError: 'O aplicativo encontrou um erro inesperado. Tente reiniciar ou entre em contato.',
    dayOfMonth: 'Dia do mês (1-31)',
    expensePaid: 'Gasto quitado',
    valueChanged: 'Valor alterado',
    previousValue: 'Valor anterior',
    newValue: 'Novo valor',

    // Navegação
    home: 'Início',
    dashboard: 'Dashboard',
    addExpense: 'Adicionar',
    history: 'Histórico',
    charts: 'Gráficos',
    planning: 'Planejar',
    cards: 'Cartões',
    menu: 'Menu',
    settings: 'Configurações',
    group: 'Grupo',
    sync: 'Sync',

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
    balance: 'Saldo',
    mostUsed: 'Mais usado',

    // Gastos
    newExpense: 'Novo Gasto',
    editExpense: 'Editar Gasto',
    expenseType: 'Tipo de Gasto',
    expenses: 'Despesas',
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
    expenseNotFound: 'Gasto não encontrado',
    fillValueAndDesc: 'Preencha o valor e a descrição',
    enterValidValue: 'Digite um valor válido',
    confirmDelete: 'Confirmar exclusão',
    wantToDelete: 'Deseja excluir',
    deleted: 'Excluído',
    expenseRemoved: 'Gasto removido com sucesso',
    updateExpense: 'Atualizar Gasto',
    deleteExpenseBtn: 'Excluir Gasto',

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
    tapToUpdate: 'Toque para atualizar',

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
    noGoals: 'Nenhuma meta cadastrada',
    addFirstGoal: 'Adicione sua primeira meta',
    addGoal: 'Adicionar Meta',
    cashStatus: 'Status do Caixa',
    remaining: 'Restante',
    cashCommitted: 'do caixa comprometido',
    missing: 'Faltam',
    canBuyNow: 'Pode comprar agora!',
    purchaseMade: 'Compra realizada!',
    perDay: 'por dia',
    perWeek: 'por semana',
    howMuchCash: 'Quanto dinheiro em caixa?',
    whatToBuy: 'O que deseja comprar?',
    totalValue: 'Valor total',

    // Configurações / Menu
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
    options: 'Opções',
    totalSpent: 'Total Gasto',
    totalExpenses: 'Total de Gastos',
    totalAmount: 'Valor Total',
    summary: 'Resumo',
    shareError: 'Erro ao compartilhar',
    clearData: 'Limpar Dados',
    clearDataWarning: 'Todos os dados serão apagados. Esta ação não pode ser desfeita.',
    clearAll: 'Limpar Tudo',
    clearDataConfirm: 'Tem certeza?',
    dataCleared: 'Dados apagados!',
    appDescription: 'App completo para controle de gastos do cartão de crédito e caixa.',
    statistics: 'Estatísticas',
    viewFullSummary: 'Ver resumo completo',
    sendSummary: 'Enviar resumo',
    configureBudget: 'Configurar orçamento',
    expenseSpreadsheet: 'Planilha de gastos',
    enabled: 'Ativado',
    disabled: 'Desativado',
    sound: 'Som',
    alerts: 'Alertas',
    share: 'Compartilhar',
    limits: 'Limites',
    exportCSV: 'Exportar CSV',
    deleteAll: 'Excluir tudo',
    avgExpense: 'Média por Gasto',
    cardExpensesCount: 'Gastos em Cartões',
    standaloneCount: 'Gastos Avulsos',

    // Dívidas / Pagamento
    pendingDebts: 'Dívidas Pendentes',
    pay: 'Quitar',
    paid: 'Pago',
    unpaid: 'Pendente',
    markAsPaid: 'Marcar como Pago',
    markAsUnpaid: 'Marcar como Pendente',
    confirmPay: 'Confirmar Pagamento',
    wantToPay: 'Deseja quitar esta despesa?',
    expensePaid: 'Despesa quitada!',
    expenseUnpaid: 'Despesa marcada como pendente',
    debts: 'Dívidas',
    totalDebts: 'Total em Dívidas',

    // Edição de Caixa
    previousValue: 'Valor Anterior',
    newValue: 'Novo Valor',
    valueChanged: 'Valor Alterado',

    // Menu
    categories: 'Categorias',
    manageCategories: 'Gerenciar Categorias',

    // Gráficos
    chartTitle: 'Gráficos',

    // Histórico - Filtros
    filterAll: 'Todos',

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
    clear: 'Clear',
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
    none: 'None',
    done: 'Done',

    // Components / General
    understood: 'Understood',
    bill: 'Bill',
    billCreated: 'Bill created!',
    dueDateShort: 'Due',
    billAmount: 'Bill amount',
    cardPaused: 'Card paused',
    morning: 'Good morning!',
    afternoon: 'Good afternoon!',
    evening: 'Good evening!',
    overview: 'Overview',
    unpaidExpense: 'pending expense',
    unpaidExpenses: 'pending expenses',
    seeAll: 'See all',
    topCategories: 'Top Categories',
    showLess: 'Show less',
    dueDate: 'Due date',
    billPaid: 'Bill paid!',
    searchPlaceholder: 'Search bank...',
    mostUsed: 'Most used',
    popular: 'Popular',
    allBanks: 'All banks',
    results: 'Results',
    noBankFound: 'No bank found',
    errorLoadingBanks: 'Error loading banks',
    chooseBank: 'Choose Bank',
    noItem: 'No items',
    addFirstItem: 'Add the first item',
    tapToClear: 'Tap to clear filter',
    tapToFilter: 'Tap to filter',
    noExpenseFound: 'No expense found',
    avgPerExpense: 'Avg per expense',
    maxExpense: 'Max expense',
    minExpense: 'Min expense',
    registeredExpenses: 'expenses registered',
    resetCategories: 'Reset Categories',
    resetCategoriesDesc: 'Restore default categories? This will remove all current categories.',
    reset: 'Reset',
    languageInfo: 'Selected language will be applied throughout the app.',
    soon: 'Coming soon',
    developedIn: 'Developed with ❤️ in Brazil',
    tryAgain: 'Try Again',
    appError: 'The app encountered an unexpected error. Try restarting or contact support.',
    dayOfMonth: 'Day of month (1-31)',
    expensePaid: 'Expense paid',
    valueChanged: 'Value changed',
    previousValue: 'Previous value',
    newValue: 'New value',

    // Navigation
    home: 'Home',
    dashboard: 'Dashboard',
    addExpense: 'Add',
    history: 'History',
    charts: 'Charts',
    planning: 'Planning',
    cards: 'Cards',
    menu: 'Menu',
    settings: 'Settings',
    group: 'Group',
    sync: 'Sync',

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
    balance: 'Balance',
    mostUsed: 'Most used',

    // Expenses
    newExpense: 'New Expense',
    editExpense: 'Edit Expense',
    expenseType: 'Expense Type',
    expenses: 'Expenses',
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
    expenseNotFound: 'Expense not found',
    fillValueAndDesc: 'Fill value and description',
    enterValidValue: 'Enter a valid amount',
    confirmDelete: 'Confirm deletion',
    wantToDelete: 'Do you want to delete',
    deleted: 'Deleted',
    expenseRemoved: 'Expense removed successfully',
    updateExpense: 'Update Expense',
    deleteExpenseBtn: 'Delete Expense',

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
    tapToUpdate: 'Tap to update',

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
    noGoals: 'No goals registered',
    addFirstGoal: 'Add your first goal',
    addGoal: 'Add Goal',
    cashStatus: 'Cash Status',
    remaining: 'Remaining',
    cashCommitted: 'of cash committed',
    missing: 'Missing',
    canBuyNow: 'Can buy now!',
    purchaseMade: 'Purchase made!',
    perDay: 'per day',
    perWeek: 'per week',
    howMuchCash: 'How much cash?',
    whatToBuy: 'What do you want to buy?',
    totalValue: 'Total value',

    // Settings / Menu
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
    options: 'Options',
    totalSpent: 'Total Spent',
    totalExpenses: 'Total Expenses',
    totalAmount: 'Total Amount',
    summary: 'Summary',
    shareError: 'Error sharing',
    clearData: 'Clear Data',
    clearDataWarning: 'All data will be erased. This cannot be undone.',
    clearAll: 'Clear All',
    clearDataConfirm: 'Are you sure?',
    dataCleared: 'Data cleared!',
    appDescription: 'Complete app for credit card and cash expense control.',
    statistics: 'Statistics',
    viewFullSummary: 'View full summary',
    sendSummary: 'Send summary',
    configureBudget: 'Configure budget',
    expenseSpreadsheet: 'Expense spreadsheet',
    enabled: 'Enabled',
    disabled: 'Disabled',
    sound: 'Sound',
    alerts: 'Alerts',
    share: 'Share',
    limits: 'Limits',
    exportCSV: 'Export CSV',
    deleteAll: 'Delete all',
    avgExpense: 'Avg per Expense',
    cardExpensesCount: 'Card Expenses',
    standaloneCount: 'Standalone Expenses',

    // Debts / Payment
    pendingDebts: 'Pending Debts',
    pay: 'Pay',
    paid: 'Paid',
    unpaid: 'Pending',
    markAsPaid: 'Mark as Paid',
    markAsUnpaid: 'Mark as Unpaid',
    confirmPay: 'Confirm Payment',
    wantToPay: 'Do you want to pay this expense?',
    expensePaid: 'Expense paid!',
    expenseUnpaid: 'Expense marked as pending',
    debts: 'Debts',
    totalDebts: 'Total Debts',

    // Cash Edit
    previousValue: 'Previous Value',
    newValue: 'New Value',
    valueChanged: 'Value Changed',

    // Menu
    categories: 'Categories',
    manageCategories: 'Manage Categories',

    // Charts
    chartTitle: 'Charts',

    // History - Filters
    filterAll: 'All',

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

  // ✅ CORREÇÃO: Return com JSX wrapper correto
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
