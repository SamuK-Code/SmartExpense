import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useCash } from '../context/CashContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { useFilteredExpenses, useFilteredCash } from '../hooks/useFilteredData';
import AppHeader from '../components/AppHeader';
import PeriodFilter from '../components/PeriodFilter';
import ExpenseListItem from '../components/ExpenseListItem';
import CashListItem from '../components/CashListItem';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const ViewModeToggle = React.memo(function ViewModeToggle({ viewMode, setViewMode, colors, t }) {
  const modes = [
    { id: 'all', icon: 'list', label: t('all') },
    { id: 'card', icon: 'card', label: t('card') },
    { id: 'standalone', icon: 'receipt', label: t('standalone') },
    { id: 'bill', icon: 'document-text', label: t('bill') },
    { id: 'cash', icon: 'cash', label: t('cash') },
  ];
  return (
    <View style={styles.viewModeRow}>
      {modes.map(mode => (
        <TouchableOpacity
          key={mode.id}
          style={[styles.viewModeBtn, {
            backgroundColor: viewMode === mode.id ? colors.primary + '15' : colors.card,
            borderColor: viewMode === mode.id ? colors.primary : colors.border,
          }]}
          onPress={() => setViewMode(mode.id)}
        >
          <Ionicons name={mode.icon} size={16} color={viewMode === mode.id ? colors.primary : colors.text} />
          <Text style={[styles.viewModeText, { color: viewMode === mode.id ? colors.primary : colors.text }]}>{mode.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

export default function HistoryScreen({ navigation }) {
  const { expenses, cards, CATEGORIES, deleteExpense, toggleExpensePaid, payBill } = useExpenses();
  const { cashTransactions, addCashTransaction } = useCash();
  const { colors } = useTheme();
  const { t } = useI18n();

  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [viewMode, setViewMode] = useState('all');

  const filteredExpenses = useFilteredExpenses(expenses, selectedPeriod, viewMode === 'cash' ? 'all' : viewMode);
  const filteredCash = useFilteredCash(cashTransactions, selectedPeriod);

  const getCategoryInfo = useCallback((categoryId) => {
    if (!categoryId) return { name: 'Outros', color: '#999', icon: 'ellipsis-horizontal' };
    const cat = CATEGORIES.find(c => c.id === categoryId);
    if (cat) return cat;
    // Fallback para categorias padrão
    const DEFAULT_MAP = {
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
    return DEFAULT_MAP[categoryId] || { name: 'Outros', color: '#999', icon: 'help-circle-outline' };
  }, [CATEGORIES]);

  const handleDelete = useCallback((expense) => {
    // Alert.alert(t('confirm') + ' ' + t('delete'), t('confirmDeleteExpense') + ' "' + expense.description + '"?', [
    //   { text: t('cancel'), style: 'cancel' },
    //   { text: t('delete'), style: 'destructive', onPress: () => deleteExpense(expense.id) },
    // ]);
    deleteExpense(expense.id);
  }, [deleteExpense]);

  const handlePay = useCallback((expense) => {
    if (expense.isBill) {
      addCashTransaction(expense.amount, 'expense', {
        description: 'Pagamento: ' + expense.description,
        date: new Date().toISOString().split('T')[0],
      });
      payBill(expense.id);
    } else if (!expense.cardId) {
      toggleExpensePaid(expense.id);
    }
  }, [addCashTransaction, payBill, toggleExpensePaid]);

  const total = useMemo(() => {
    if (viewMode === 'cash') return (cashTransactions || []).reduce((s, e) => s + parseFloat(e.amount), 0);
    return filteredExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  }, [viewMode, cashTransactions, filteredExpenses]);

  const data = viewMode === 'cash' ? filteredCash : filteredExpenses;

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
      onPress={() => {}}
    />
  ), [colors, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('history')} />

      <View style={styles.filtersContainer}>
        <PeriodFilter selected={selectedPeriod} onSelect={setSelectedPeriod} />
      </View>

      <View style={styles.viewModeContainer}>
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} colors={colors} t={t} />
      </View>

      <View style={[styles.totalContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.totalLabel, { color: colors.textLight }]}>{t('total')}</Text>
        <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(total)}</Text>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
          <Text style={[styles.emptyText, { color: colors.textLight }]}>{t('noExpenses')}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={viewMode === 'cash' ? renderCash : renderExpense}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  viewModeContainer: { paddingVertical: 12, paddingHorizontal: 16 },
  viewModeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  viewModeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 6 },
  viewModeText: { fontSize: 13, fontWeight: '500' },
  totalContainer: { marginHorizontal: 16, marginVertical: 12, padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: 'bold' },
  listContent: { padding: 16, paddingBottom: 30 },
  emptyState: { alignItems: 'center', padding: 40, paddingTop: 80 },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
});
