import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { usePlanning } from '../context/PlanningContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { useCashManager } from '../hooks/useCashManager';
import { FadeInView, SlideInView, ScaleInView } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';

export default function AddExpenseScreen({ navigation }) {
  const {
    addExpense,
    expenses,
    cards,
    CATEGORIES,
    deleteExpense,
    cashTransactions: ctxCashTransactions,
  } = useExpenses();

  const { cashBalance } = usePlanning();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();

  // Hook de gerenciamento de caixa (centraliza toda lógica)
  const cashManager = useCashManager();

  // Estados da tela
  const [showForm, setShowForm] = useState(false);
  const [showCashForm, setShowCashForm] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('expenses');

  // Estados do formulário de despesa
  const [amount, setAmount] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]?.id || 'outros');
  const [selectedCard, setSelectedCard] = useState(null);
  const [expenseType, setExpenseType] = useState('card');
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [date, setDate] = useState(getTodayDate());

  // Filtros
  const [filterDate, setFilterDate] = useState('all');
  const [filterCard, setFilterCard] = useState('all');
  const [filterType, setFilterType] = useState('all');

  function getTodayDate() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[7];
  };

  // ─── Handlers de Despesa ───

  const handleAmountChange = (text) => {
    const numeric = text.replace(/\D/g, '');
    setAmount(numeric);
    const number = parseInt(numeric) / 100;
    setAmountDisplay(
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number || 0)
    );
  };

  const handleSubmit = () => {
    if (!amount || !description) {
      Alert.alert(t('error'), t('invalidAmount') + ' / ' + t('invalidDescription'));
      return;
    }

    const numericAmount = parseInt(amount) / 100;
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert(t('error'), t('invalidAmount'));
      return;
    }

    if (expenseType === 'card' && cards.length > 0 && !selectedCard) {
      Alert.alert(t('error'), t('invalidCard'));
      return;
    }

    try {
      addExpense({
        amount: numericAmount,
        description,
        category: selectedCategory,
        cardId: expenseType === 'standalone' ? null : selectedCard,
        date,
        paymentMethod: expenseType === 'card' ? paymentMethod : null,
      });

      Alert.alert(t('success'), t('expenseAdded'), [
        { text: t('ok'), onPress: () => {
          setShowForm(false);
          setAmount('');
          setAmountDisplay('');
          setDescription('');
          setSelectedCategory(CATEGORIES[0]?.id || 'outros');
          setSelectedCard(null);
          setExpenseType('card');
          setDate(getTodayDate());
        }}
      ]);
    } catch (error) {
      Alert.alert(t('error'), t('error'));
    }
  };

  const handleDeleteExpense = (expense) => {
    Alert.alert(
      t('confirm') + ' ' + t('delete'),
      t('confirmDeleteExpense') + ' "' + expense.description + '"?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteExpense(expense.id) },
      ]
    );
  };

  // ─── Handlers de Caixa (delegados ao hook) ───

  const handleCashSubmit = () => {
    cashManager.submitCash(() => setShowCashForm(false));
  };

  const handleUpdateCash = () => {
    cashManager.updateCash();
  };

  const handleDeleteCash = (cashItem) => {
    cashManager.deleteCash(cashItem);
  };

  const handleEditCash = (cashItem) => {
    cashManager.startEditing(cashItem);
  };

  // ─── Renderização ───

  const renderExpenseItem = ({ item }) => {
    const category = getCategoryInfo(item.category);
    const card = cards.find(c => c.id === item.cardId);
    const isStandalone = !item.cardId;

    return (
      <TouchableOpacity
        style={[styles.expenseItem, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('EditExpense', { expenseId: item.id })}
        onLongPress={() => handleDeleteExpense(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
          <Ionicons name={category.icon} size={22} color={category.color} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseDescription, { color: colors.text }]}>{item.description}</Text>
          <View style={styles.expenseMeta}>
            <Text style={[styles.expenseCategory, { color: category.color }]}>{category.name}</Text>
            {isStandalone ? (
              <View style={[styles.standaloneBadge, { backgroundColor: colors.warning + '15' }]}>
                <Ionicons name="receipt-outline" size={10} color={colors.warning} />
                <Text style={[styles.standaloneText, { color: colors.warning }]}>{t('standalone')}</Text>
              </View>
            ) : card ? (
              <View style={[styles.cardBadge, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="card-outline" size={10} color={colors.primary} />
                <Text style={[styles.cardBadgeText, { color: colors.primary }]}>{card.name}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.expenseDate, { color: colors.textLight }]}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={[styles.expenseAmount, { color: colors.danger }]}>{formatCurrency(parseFloat(item.amount))}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCashItem = ({ item }) => {
    const isEditing = cashManager.editingCashId === item.id;

    if (isEditing) {
      return (
        <View style={[styles.editCashForm, { backgroundColor: colors.card }]}>
          <Text style={[styles.editTitle, { color: colors.text }]}>{t('editCash')}</Text>
          <TextInput
            style={[styles.amountInput, { backgroundColor: colors.background, color: colors.text }]}
            value={cashManager.editCashAmountDisplay}
            onChangeText={cashManager.handleEditCashAmountChange}
            placeholder={t('amount')}
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            value={cashManager.editCashDescription}
            onChangeText={cashManager.setEditCashDescription}
            placeholder={t('description')}
            placeholderTextColor={colors.textLight}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            value={cashManager.editCashDate}
            onChangeText={cashManager.setEditCashDate}
            placeholder={t('date')}
            placeholderTextColor={colors.textLight}
          />
          <View style={styles.editButtonsRow}>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.success }]}
              onPress={handleUpdateCash}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.editButtonText}>{t('save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.danger }]}
              onPress={cashManager.cancelEditing}
            >
              <Ionicons name="close" size={18} color="#fff" />
              <Text style={styles.editButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.expenseItem, { backgroundColor: colors.card }]}
        onPress={() => handleEditCash(item)}
        onLongPress={() => handleDeleteCash(item)}
        activeOpacity={0.7}
      >
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseDescription, { color: colors.text }]}>{item.description}</Text>
          <Text style={[styles.expenseCategory, { color: colors.textLight }]}>{t('cash')}</Text>
          <Text style={[styles.expenseDate, { color: colors.textLight }]}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={[styles.cashAmount, { color: colors.success }]}>+ {formatCurrency(parseFloat(item.amount))}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCashForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppHeader title={t('addCash')} />
        <Text style={[styles.title, { color: colors.text }]}>{t('addCash')}</Text>

        <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.balanceLabel, { color: colors.textLight }]}>{t('availableCash')}</Text>
          <Text style={[styles.balanceValue, { color: colors.primary }]}>{formatCurrency(cashBalance)}</Text>
        </View>

        <TextInput
          style={[styles.amountInput, { backgroundColor: colors.card, color: colors.text }]}
          value={cashManager.cashAmountDisplay}
          onChangeText={cashManager.handleCashAmountChange}
          placeholder={t('amount')}
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={cashManager.cashDescription}
          onChangeText={cashManager.setCashDescription}
          placeholder={t('description')}
          placeholderTextColor={colors.textLight}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={cashManager.cashDate}
          onChangeText={cashManager.setCashDate}
          placeholder={t('date')}
          placeholderTextColor={colors.textLight}
        />
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.success }]}
          onPress={handleCashSubmit}
        >
          <Ionicons name="add-circle" size={22} color="#fff" />
          <Text style={styles.submitText}>{t('addCash')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.danger + '15' }]}
          onPress={() => {
            setShowCashForm(false);
            cashManager.resetCashForm();
          }}
        >
          <Text style={[styles.submitText, { color: colors.danger }]}>{t('cancel')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppHeader title={t('newExpense')} />
        <Text style={[styles.title, { color: colors.text }]}>{t('newExpense')}</Text>

        <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.balanceLabel, { color: colors.textLight }]}>{t('availableCash')}</Text>
          <Text style={[styles.balanceValue, { color: colors.primary }]}>{formatCurrency(cashBalance)}</Text>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>{t('expenseType')}</Text>
        <View style={styles.typeToggleContainer}>
          <TouchableOpacity
            style={[styles.typeToggleButton, { backgroundColor: expenseType === 'card' ? colors.primary : colors.card }]}
            onPress={() => { setExpenseType('card'); setSelectedCard(null); }}
          >
            <Ionicons name="card" size={18} color={expenseType === 'card' ? '#fff' : colors.text} />
            <Text style={[styles.typeToggleText, { color: expenseType === 'card' ? '#fff' : colors.text }]}>{t('card')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeToggleButton, { backgroundColor: expenseType === 'standalone' ? colors.warning : colors.card }]}
            onPress={() => { setExpenseType('standalone'); setSelectedCard(null); }}
          >
            <Ionicons name="receipt" size={18} color={expenseType === 'standalone' ? '#fff' : colors.text} />
            <Text style={[styles.typeToggleText, { color: expenseType === 'standalone' ? '#fff' : colors.text }]}>{t('standalone')}</Text>
          </TouchableOpacity>
        </View>

        {expenseType === 'card' && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>{t('paymentMethod')}</Text>
            <View style={styles.typeToggleContainer}>
              <TouchableOpacity
                style={[styles.typeToggleButton, { backgroundColor: paymentMethod === 'credit' ? colors.primary : colors.card }]}
                onPress={() => setPaymentMethod('credit')}
              >
                <Text style={[styles.typeToggleText, { color: paymentMethod === 'credit' ? '#fff' : colors.text }]}>{t('credit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeToggleButton, { backgroundColor: paymentMethod === 'debit' ? colors.primary : colors.card }]}
                onPress={() => setPaymentMethod('debit')}
              >
                <Text style={[styles.typeToggleText, { color: paymentMethod === 'debit' ? '#fff' : colors.text }]}>{t('debit')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <TextInput
          style={[styles.amountInput, { backgroundColor: colors.card, color: colors.text }]}
          value={amountDisplay}
          onChangeText={handleAmountChange}
          placeholder={t('amount')}
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('description')}
          placeholderTextColor={colors.textLight}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={date}
          onChangeText={setDate}
          placeholder={t('date')}
          placeholderTextColor={colors.textLight}
        />

        {expenseType === 'card' && cards.length > 0 && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>{t('selectCard')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {cards.map(card => (
                <TouchableOpacity
                  key={card.id}
                  style={[styles.cardButton, { 
                    backgroundColor: selectedCard === card.id ? colors.primary + '15' : colors.card,
                    borderColor: selectedCard === card.id ? colors.primary : 'transparent'
                  }]}
                  onPress={() => setSelectedCard(card.id)}
                >
                  <Ionicons name="card" size={16} color={selectedCard === card.id ? colors.primary : colors.textLight} />
                  <Text style={[styles.cardText, { color: selectedCard === card.id ? colors.primary : colors.text }]}>{card.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <Text style={[styles.label, { color: colors.text }]}>{t('category')}</Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryButton, { 
                backgroundColor: selectedCategory === category.id ? category.color + '15' : colors.card,
                borderColor: selectedCategory === category.id ? category.color : 'transparent'
              }]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons name={category.icon} size={16} color={category.color} />
              <Text style={[styles.categoryText, { color: selectedCategory === category.id ? category.color : colors.text }]}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
        >
          <Ionicons name="save" size={22} color="#fff" />
          <Text style={styles.submitText}>{t('addExpenseBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.danger + '15' }]}
          onPress={() => setShowForm(false)}
        >
          <Text style={[styles.submitText, { color: colors.danger }]}>{t('cancel')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const getFilteredExpensesList = () => {
    let filtered = expenses;
    if (filterDate !== 'all') {
      const now = new Date();
      filtered = filtered.filter(e => {
        const d = new Date(e.date);
        if (filterDate === 'today') return d.toDateString() === now.toDateString();
        if (filterDate === 'week') return d >= new Date(now - 7 * 24 * 60 * 60 * 1000);
        if (filterDate === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
      });
    }
    if (filterCard !== 'all') filtered = filtered.filter(e => e.cardId === filterCard);
    if (filterType !== 'all') {
      if (filterType === 'card') filtered = filtered.filter(e => e.cardId);
      else if (filterType === 'standalone') filtered = filtered.filter(e => !e.cardId);
    }
    return filtered;
  };

  const getFilteredCashList = () => {
    let filtered = ctxCashTransactions || [];
    if (filterDate !== 'all') {
      const now = new Date();
      filtered = filtered.filter(e => {
        const d = new Date(e.date);
        if (filterDate === 'today') return d.toDateString() === now.toDateString();
        if (filterDate === 'week') return d >= new Date(now - 7 * 24 * 60 * 60 * 1000);
        if (filterDate === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
      });
    }
    return filtered;
  };

  const renderList = () => (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('addExpense')} />

      <View style={styles.viewModeContainer}>
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.viewModeButton, { backgroundColor: viewMode === 'expenses' ? colors.primary : colors.card }]}
            onPress={() => setViewMode('expenses')}
          >
            <Ionicons name="receipt" size={16} color={viewMode === 'expenses' ? '#fff' : colors.text} />
            <Text style={[styles.viewModeText, { color: viewMode === 'expenses' ? '#fff' : colors.text }]}>{t('expenses')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, { backgroundColor: viewMode === 'cash' ? colors.success : colors.card }]}
            onPress={() => setViewMode('cash')}
          >
            <Ionicons name="cash" size={16} color={viewMode === 'cash' ? '#fff' : colors.text} />
            <Text style={[styles.viewModeText, { color: viewMode === 'cash' ? '#fff' : colors.text }]}>{t('cash')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'expenses' && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textLight }]}>{t('date')}</Text>
              <View style={styles.filterButtons}>
                {['all', 'today', 'week', 'month'].map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterBtn, { 
                      backgroundColor: filterDate === f ? colors.primary + '15' : colors.card,
                      borderColor: filterDate === f ? colors.primary : colors.border
                    }]}
                    onPress={() => setFilterDate(f)}
                  >
                    <Text style={[styles.filterBtnText, { color: filterDate === f ? colors.primary : colors.text }]}>
                      {f === 'all' ? t('all') : f === 'today' ? t('today') : f === 'week' ? t('week') : t('month')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textLight }]}>{t('expenseType')}</Text>
              <View style={styles.filterButtons}>
                {['all', 'card', 'standalone'].map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterBtn, { 
                      backgroundColor: filterType === f ? colors.primary + '15' : colors.card,
                      borderColor: filterType === f ? colors.primary : colors.border
                    }]}
                    onPress={() => setFilterType(f)}
                  >
                    <Text style={[styles.filterBtnText, { color: filterType === f ? colors.primary : colors.text }]}>
                      {f === 'all' ? t('all') : f === 'card' ? t('card') : t('standalone')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textLight }]}>{t('card')}</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterBtn, { 
                    backgroundColor: filterCard === 'all' ? colors.primary + '15' : colors.card,
                    borderColor: filterCard === 'all' ? colors.primary : colors.border
                  }]}
                  onPress={() => setFilterCard('all')}
                >
                  <Text style={[styles.filterBtnText, { color: filterCard === 'all' ? colors.primary : colors.text }]}>{t('all')}</Text>
                </TouchableOpacity>
                {cards.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.filterBtn, { 
                      backgroundColor: filterCard === c.id ? colors.primary + '15' : colors.card,
                      borderColor: filterCard === c.id ? colors.primary : colors.border
                    }]}
                    onPress={() => setFilterCard(c.id)}
                  >
                    <Text style={[styles.filterBtnText, { color: filterCard === c.id ? colors.primary : colors.text }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {viewMode === 'expenses' && expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noExpenses')}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>{t('addFirstExpense')}</Text>
        </View>
      ) : viewMode === 'cash' && (ctxCashTransactions || []).length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cash-outline" size={48} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noCashEntries')}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>{t('addFirstExpense')}</Text>
        </View>
      ) : (
        <FlatList
          data={viewMode === 'expenses' ? getFilteredExpensesList() : getFilteredCashList()}
          renderItem={viewMode === 'expenses' ? renderExpenseItem : renderCashItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {fabMenuOpen && (
        <>
          <View style={styles.fabMenuOverlay}>
            <TouchableOpacity style={styles.fabMenuOverlayTouchable} onPress={() => setFabMenuOpen(false)} />
          </View>
          <View style={[styles.fabMenu, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => { setFabMenuOpen(false); setShowForm(true); }}
            >
              <View style={[styles.fabMenuIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="receipt" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.fabMenuTitle, { color: colors.text }]}>{t('newExpense')}</Text>
                <Text style={[styles.fabMenuSubtitle, { color: colors.textLight }]}>{t('addExpense')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => { setFabMenuOpen(false); setShowCashForm(true); }}
            >
              <View style={[styles.fabMenuIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="cash" size={20} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.fabMenuTitle, { color: colors.text }]}>{t('addCash')}</Text>
                <Text style={[styles.fabMenuSubtitle, { color: colors.textLight }]}>{t('cash')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setFabMenuOpen(!fabMenuOpen)}
      >
        <Ionicons name={fabMenuOpen ? 'close' : 'add'} size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  if (showCashForm) return renderCashForm();
  return showForm ? renderForm() : renderList();
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  balanceCard: { padding: 16, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  balanceLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  balanceValue: { fontSize: 24, fontWeight: 'bold' },
  viewModeContainer: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  viewModeToggle: { flexDirection: 'row', gap: 10 },
  viewModeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, gap: 6 },
  viewModeText: { fontSize: 13, fontWeight: '600' },
  typeToggleContainer: { flexDirection: 'row', gap: 10 },
  typeToggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  typeToggleText: { fontSize: 13, fontWeight: '600' },
  amountInput: { borderRadius: 16, padding: 18, fontSize: 32, fontWeight: 'bold', textAlign: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  input: { borderRadius: 14, padding: 16, fontSize: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cardButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  cardText: { marginLeft: 6, fontSize: 13 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  categoryText: { marginLeft: 6, fontSize: 13 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  cancelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, marginTop: 12 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  editCashForm: { padding: 16, borderRadius: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  editTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  editButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  editButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 6 },
  editButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  listContent: { padding: 16, paddingBottom: 80 },
  expenseItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseDescription: { fontSize: 15, fontWeight: '600' },
  expenseMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 6 },
  expenseCategory: { fontSize: 12 },
  expenseDate: { fontSize: 11, marginTop: 4 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 15, fontWeight: 'bold' },
  cashAmount: { fontSize: 15, fontWeight: 'bold' },
  standaloneBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 3 },
  standaloneText: { fontSize: 10, fontWeight: '600' },
  cardBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 3 },
  cardBadgeText: { fontSize: 10, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', padding: 40, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  filtersContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  filtersScroll: { paddingHorizontal: 12, gap: 16 },
  filterGroup: { marginRight: 16 },
  filterLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  filterButtons: { flexDirection: 'row', gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  filterBtnText: { fontSize: 12, fontWeight: '500' },
  fabMenuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 },
  fabMenuOverlayTouchable: { flex: 1 },
  fabMenu: { position: 'absolute', right: 20, bottom: 80, width: 220, borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, zIndex: 999 },
  fabMenuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  fabMenuIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  fabMenuTitle: { fontSize: 15, fontWeight: '600' },
  fabMenuSubtitle: { fontSize: 12, marginTop: 2 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
});
