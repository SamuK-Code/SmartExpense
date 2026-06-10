import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert,
  KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useCash } from '../context/CashContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { useCashManager } from '../hooks/useCashManager';
import { useFilteredExpenses, useFilteredCash } from '../hooks/useFilteredData';
import AppHeader from '../components/AppHeader';
import ExpenseListItem from '../components/ExpenseListItem';
import CashListItem from '../components/CashListItem';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getTodayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const ViewToggle = React.memo(function ViewToggle({ viewMode, setViewMode, colors, t }) {
  return (
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
  );
});

const FilterBar = React.memo(function FilterBar({ filterDate, setFilterDate, filterType, setFilterType, filterCard, setFilterCard, cards, colors, t }) {
  const dateOpts = ['all', 'today', 'week', 'month'];
  const typeOpts = ['all', 'card', 'standalone'];
  return (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: colors.textLight }]}>{t('date')}</Text>
          <View style={styles.filterButtons}>
            {dateOpts.map(f => (
              <TouchableOpacity key={f} style={[styles.filterBtn, {
                backgroundColor: filterDate === f ? colors.primary + '15' : colors.card,
                borderColor: filterDate === f ? colors.primary : colors.border,
              }]} onPress={() => setFilterDate(f)}>
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
            {typeOpts.map(f => (
              <TouchableOpacity key={f} style={[styles.filterBtn, {
                backgroundColor: filterType === f ? colors.primary + '15' : colors.card,
                borderColor: filterType === f ? colors.primary : colors.border,
              }]} onPress={() => setFilterType(f)}>
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
            <TouchableOpacity style={[styles.filterBtn, {
              backgroundColor: filterCard === 'all' ? colors.primary + '15' : colors.card,
              borderColor: filterCard === 'all' ? colors.primary : colors.border,
            }]} onPress={() => setFilterCard('all')}>
              <Text style={[styles.filterBtnText, { color: filterCard === 'all' ? colors.primary : colors.text }]}>{t('all')}</Text>
            </TouchableOpacity>
            {cards.map(c => (
              <TouchableOpacity key={c.id} style={[styles.filterBtn, {
                backgroundColor: filterCard === c.id ? colors.primary + '15' : colors.card,
                borderColor: filterCard === c.id ? colors.primary : colors.border,
              }]} onPress={() => setFilterCard(c.id)}>
                <Text style={[styles.filterBtnText, { color: filterCard === c.id ? colors.primary : colors.text }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
});

export default function AddExpenseScreen({ navigation }) {
  const { addExpense, expenses, cards, CATEGORIES, deleteExpense, toggleExpensePaid } = useExpenses();
  const { cashBalance, cashTransactions, addCashTransaction: cashAddTransaction } = useCash();
  const { colors } = useTheme();
  const { t } = useI18n();
  const cashManager = useCashManager();

  const [showForm, setShowForm] = useState(false);
  const [showCashForm, setShowCashForm] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('expenses');

  const [amount, setAmount] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]?.id || 'outros');
  const [selectedCard, setSelectedCard] = useState(null);
  const [expenseType, setExpenseType] = useState('card');
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [date, setDate] = useState(getTodayDate());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filterDate, setFilterDate] = useState('all');
  const [filterCard, setFilterCard] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const filteredExpenses = useFilteredExpenses(expenses, filterDate, filterType, filterCard);
  const filteredCash = useFilteredCash(cashTransactions || [], filterDate);

  const getCategoryInfo = useCallback((categoryId) => {
    if (!categoryId) return { name: 'Outros', color: '#999', icon: 'ellipsis-horizontal' };
    return CATEGORIES.find(c => c.id === categoryId) || { name: 'Outros', color: '#999', icon: 'ellipsis-horizontal' };
  }, [CATEGORIES]);

  const handleAmountChange = useCallback((text) => {
    const numeric = text.replace(/\D/g, '');
    setAmount(numeric);
    const number = parseInt(numeric) / 100;
    setAmountDisplay(formatCurrency(number || 0));
  }, []);

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!amount || !description) {
      setIsSubmitting(false);
      Alert.alert(t('error'), t('invalidAmount') + ' / ' + t('invalidDescription'));
      return;
    }
    const numericAmount = parseInt(amount) / 100;
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setIsSubmitting(false);
      Alert.alert(t('error'), t('invalidAmount'));
      return;
    }
    if (expenseType === 'card' && cards.length > 0 && !selectedCard) {
      setIsSubmitting(false);
      Alert.alert(t('error'), t('invalidCard'));
      return;
    }
    // Validação de caixa para débito apenas
    if (expenseType === 'card' && paymentMethod === 'debit' && cashBalance < numericAmount) {
      setIsSubmitting(false);
      Alert.alert(t('error'), t('insufficientCash'));
      return;
    }

    try {
      addExpense({
        amount: numericAmount, description, category: selectedCategory,
        cardId: expenseType === 'standalone' ? null : selectedCard,
        date, paymentMethod: expenseType === 'card' ? paymentMethod : null,
      });
      if (expenseType === 'card' && paymentMethod === 'debit') {
        cashAddTransaction(numericAmount, 'expense', { description: 'Débito: ' + description, date });
      }
      Alert.alert(t('success'), t('expenseAdded'), [
        { text: t('ok'), onPress: () => {
          setIsSubmitting(false);
          setShowForm(false);
          setAmount(''); setAmountDisplay(''); setDescription('');
          setSelectedCategory(CATEGORIES[0]?.id || 'outros');
          setSelectedCard(null); setExpenseType('card'); setDate(getTodayDate());
        }}
      ]);
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert(t('error'), t('error'));
    }
  }, [isSubmitting, amount, description, expenseType, cards, selectedCard, selectedCategory, date, paymentMethod, addExpense, cashAddTransaction, CATEGORIES, t]);

  const handleDelete = useCallback((expense) => {
    Alert.alert(t('confirm') + ' ' + t('delete'), t('confirmDeleteExpense') + ' "' + expense.description + '"?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteExpense(expense.id) },
    ]);
  }, [deleteExpense, t]);

  const handlePay = useCallback((expense) => {
    if (!expense.cardId) toggleExpensePaid(expense.id);
  }, [toggleExpensePaid]);

  const handleCashSubmit = useCallback(() => {
    cashManager.submitCash(() => setShowCashForm(false));
  }, [cashManager]);

  const handleEditCash = useCallback((item) => cashManager.startEditing(item), [cashManager]);
  const handleDeleteCash = useCallback((item) => cashManager.deleteCash(item), [cashManager]);
  const handleUpdateCash = useCallback(() => cashManager.updateCash(), [cashManager]);

  const renderExpense = useCallback(({ item }) => (
    <ExpenseListItem
      item={item}
      card={cards.find(c => c.id === item.cardId)}
      category={getCategoryInfo(item.category)}
      colors={colors}
      t={t}
      onPress={(id) => navigation.navigate('EditExpense', { expenseId: id })}
      onLongPress={handleDelete}
      onPay={handlePay}
    />
  ), [cards, colors, t, getCategoryInfo, navigation, handleDelete, handlePay]);

  const renderCash = useCallback(({ item }) => (
    <CashListItem
      item={item}
      colors={colors}
      t={t}
      isEditing={cashManager.editingCashId === item.id}
      editAmountDisplay={cashManager.editCashAmountDisplay}
      editDesc={cashManager.editCashDescription}
      editDate={cashManager.editCashDate}
      onPress={handleEditCash}
      onLongPress={handleDeleteCash}
      onSave={handleUpdateCash}
      onCancel={cashManager.cancelEditing}
      onAmountChange={cashManager.handleEditCashAmountChange}
      onDescChange={cashManager.setEditCashDescription}
      onDateChange={cashManager.setEditCashDate}
    />
  ), [colors, t, cashManager, handleEditCash, handleDeleteCash, handleUpdateCash]);

  const data = viewMode === 'expenses' ? filteredExpenses : filteredCash;
  const isEmpty = viewMode === 'expenses' ? expenses.length === 0 : (cashTransactions || []).length === 0;

  if (showCashForm) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <AppHeader title={t('addCash')} />
          <Text style={[styles.title, { color: colors.text }]}>{t('addCash')}</Text>
          <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.balanceLabel, { color: colors.textLight }]}>{t('availableCash')}</Text>
            <Text style={[styles.balanceValue, { color: colors.primary }]}>{formatCurrency(cashBalance)}</Text>
          </View>
          <TextInput style={[styles.inputCompact, { backgroundColor: colors.card, color: colors.text }]} value={cashManager.cashAmountDisplay} onChangeText={cashManager.handleCashAmountChange} placeholder={t('amount')} placeholderTextColor={colors.textLight} keyboardType="numeric" />
          <TextInput style={[styles.inputCompact, { backgroundColor: colors.card, color: colors.text }]} value={cashManager.cashDescription} onChangeText={cashManager.setCashDescription} placeholder={t('description')} placeholderTextColor={colors.textLight} />
          <TextInput style={[styles.inputCompact, { backgroundColor: colors.card, color: colors.text }]} value={cashManager.cashDate} onChangeText={cashManager.setCashDate} placeholder={t('date')} placeholderTextColor={colors.textLight} />
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.success }]} onPress={handleCashSubmit}>
            <Ionicons name="add-circle" size={22} color="#fff" />
            <Text style={styles.submitText}>{t('addCash')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.danger + '15' }]} onPress={() => { setShowCashForm(false); cashManager.resetCashForm(); }}>
            <Text style={[styles.submitText, { color: colors.danger }]}>{t('cancel')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (showForm) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <AppHeader title={t('newExpense')} />
          <Text style={[styles.title, { color: colors.text }]}>{t('newExpense')}</Text>
          <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.balanceLabel, { color: colors.textLight }]}>{t('availableCash')}</Text>
            <Text style={[styles.balanceValue, { color: colors.primary }]}>{formatCurrency(cashBalance)}</Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>{t('expenseType')}</Text>
          <View style={styles.typeToggleContainer}>
            <TouchableOpacity style={[styles.typeToggleButton, { backgroundColor: expenseType === 'card' ? colors.primary : colors.card }]} onPress={() => { setExpenseType('card'); setSelectedCard(null); }}>
              <Ionicons name="card" size={18} color={expenseType === 'card' ? '#fff' : colors.text} />
              <Text style={[styles.typeToggleText, { color: expenseType === 'card' ? '#fff' : colors.text }]}>{t('card')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeToggleButton, { backgroundColor: expenseType === 'standalone' ? colors.warning : colors.card }]} onPress={() => { setExpenseType('standalone'); setSelectedCard(null); }}>
              <Ionicons name="receipt" size={18} color={expenseType === 'standalone' ? '#fff' : colors.text} />
              <Text style={[styles.typeToggleText, { color: expenseType === 'standalone' ? '#fff' : colors.text }]}>{t('standalone')}</Text>
            </TouchableOpacity>
          </View>

          {expenseType === 'card' && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>{t('paymentMethod')}</Text>
              <View style={[styles.typeToggleContainer, { marginBottom: 20 }]}>
                <TouchableOpacity style={[styles.typeToggleButton, { backgroundColor: paymentMethod === 'credit' ? colors.primary : colors.card }]} onPress={() => setPaymentMethod('credit')}>
                  <Text style={[styles.typeToggleText, { color: paymentMethod === 'credit' ? '#fff' : colors.text }]}>{t('credit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeToggleButton, { backgroundColor: paymentMethod === 'debit' ? colors.primary : colors.card }]} onPress={() => setPaymentMethod('debit')}>
                  <Text style={[styles.typeToggleText, { color: paymentMethod === 'debit' ? '#fff' : colors.text }]}>{t('debit')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TextInput style={[styles.inputCompact, { backgroundColor: colors.card, color: colors.text }]} value={amountDisplay} onChangeText={handleAmountChange} placeholder={t('amount')} placeholderTextColor={colors.textLight} keyboardType="numeric" />
          <TextInput style={[styles.inputCompact, { backgroundColor: colors.card, color: colors.text }]} value={description} onChangeText={setDescription} placeholder={t('description')} placeholderTextColor={colors.textLight} />
          <TextInput style={[styles.inputCompact, { backgroundColor: colors.card, color: colors.text }]} value={date} onChangeText={setDate} placeholder={t('date')} placeholderTextColor={colors.textLight} />

          {expenseType === 'card' && cards.length > 0 && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>{t('selectCard')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {cards.map(card => (
                  <TouchableOpacity key={card.id} style={[styles.cardButton, {
                    backgroundColor: selectedCard === card.id ? colors.primary + '15' : colors.card,
                    borderColor: selectedCard === card.id ? colors.primary : 'transparent'
                  }]} onPress={() => setSelectedCard(card.id)}>
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
              <TouchableOpacity key={category.id} style={[styles.categoryButton, {
                backgroundColor: selectedCategory === category.id ? category.color + '15' : colors.card,
                borderColor: selectedCategory === category.id ? category.color : 'transparent'
              }]} onPress={() => setSelectedCategory(category.id)}>
                <Ionicons name={category.icon} size={16} color={category.color} />
                <Text style={[styles.categoryText, { color: selectedCategory === category.id ? category.color : colors.text }]}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.6 : 1 }]} onPress={handleSubmit} disabled={isSubmitting}>
            <Ionicons name="save" size={22} color="#fff" />
            <Text style={styles.submitText}>{t('addExpenseBtn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.danger + '15' }]} onPress={() => setShowForm(false)}>
            <Text style={[styles.submitText, { color: colors.danger }]}>{t('cancel')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('addExpense')} />
      <View style={styles.viewModeContainer}>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} colors={colors} t={t} />
      </View>

      {viewMode === 'expenses' && (
        <FilterBar
          filterDate={filterDate} setFilterDate={setFilterDate}
          filterType={filterType} setFilterType={setFilterType}
          filterCard={filterCard} setFilterCard={setFilterCard}
          cards={cards} colors={colors} t={t}
        />
      )}

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Ionicons name={viewMode === 'expenses' ? 'receipt-outline' : 'cash-outline'} size={48} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{viewMode === 'expenses' ? t('noExpenses') : t('noCashEntries')}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>{t('addFirstExpense')}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={viewMode === 'expenses' ? renderExpense : renderCash}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={5}
        />
      )}

      {fabMenuOpen && (
        <>
          <View style={styles.fabMenuOverlay}>
            <TouchableOpacity style={styles.fabMenuOverlayTouchable} onPress={() => setFabMenuOpen(false)} />
          </View>
          <View style={[styles.fabMenu, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabMenuOpen(false); setShowForm(true); }}>
              <View style={[styles.fabMenuIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="receipt" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.fabMenuTitle, { color: colors.text }]}>{t('newExpense')}</Text>
                <Text style={[styles.fabMenuSubtitle, { color: colors.textLight }]}>{t('addExpense')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabMenuOpen(false); setShowCashForm(true); }}>
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

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setFabMenuOpen(!fabMenuOpen)}>
        <Ionicons name={fabMenuOpen ? 'close' : 'add'} size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
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
  typeToggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, gap: 6 },
  typeToggleText: { fontSize: 13, fontWeight: '600' },
  inputCompact: { borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 },
  cardButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  cardText: { marginLeft: 6, fontSize: 13 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  categoryText: { marginLeft: 6, fontSize: 13 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, marginTop: 12 },
  cancelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, marginTop: 12 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  listContent: { padding: 16, paddingBottom: 80 },
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
  fabMenu: { position: 'absolute', right: 20, bottom: 80, width: 220, borderRadius: 16, padding: 12, zIndex: 999 },
  fabMenuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  fabMenuIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  fabMenuTitle: { fontSize: 15, fontWeight: '600' },
  fabMenuSubtitle: { fontSize: 12, marginTop: 2 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
});
