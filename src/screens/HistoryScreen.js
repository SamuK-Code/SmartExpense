import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useCash } from '../context/CashContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import AppHeader from '../components/AppHeader';
import PeriodFilter from '../components/PeriodFilter';

export default function HistoryScreen({ navigation }) {
  const {
    expenses,
    cards,
    CATEGORIES,
    deleteExpense,
    toggleExpensePaid,
    payBill,
  } = useExpenses();

  const { cashTransactions, addCashTransaction: cashAddTransaction } = useCash();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();

  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [viewMode, setViewMode] = useState('all');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getCategoryInfo = (categoryId) => {
    if (!categoryId) return { name: 'Outros', color: '#999', icon: 'ellipsis-horizontal' };
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat || { name: 'Outros', color: '#999', icon: 'ellipsis-horizontal' };
  };

  const filterExpenses = () => {
    let filtered = expenses;
    const now = new Date();

    if (selectedPeriod !== 'all') {
      filtered = filtered.filter(e => {
        const d = new Date(e.date);
        if (selectedPeriod === 'today') return d.toDateString() === now.toDateString();
        if (selectedPeriod === 'week') return d >= new Date(now - 7 * 24 * 60 * 60 * 1000);
        if (selectedPeriod === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (selectedPeriod === 'year') return d.getFullYear() === now.getFullYear();
        return true;
      });
    }

    if (viewMode === 'card') filtered = filtered.filter(e => e.cardId && !e.isBill);
    if (viewMode === 'standalone') filtered = filtered.filter(e => !e.cardId && !e.isBill);
    if (viewMode === 'bill') filtered = filtered.filter(e => e.isBill);
    if (viewMode === 'cash') filtered = [];

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const filterCash = () => {
    let filtered = cashTransactions || [];
    const now = new Date();

    if (selectedPeriod !== 'all') {
      filtered = filtered.filter(e => {
        const d = new Date(e.date);
        if (selectedPeriod === 'today') return d.toDateString() === now.toDateString();
        if (selectedPeriod === 'week') return d >= new Date(now - 7 * 24 * 60 * 60 * 1000);
        if (selectedPeriod === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (selectedPeriod === 'year') return d.getFullYear() === now.getFullYear();
        return true;
      });
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
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

  // Quitar: apenas para boletos/standalone e faturas
  const handlePayExpense = (expense) => {
    if (expense.isBill) {
      // Fatura: subtrai do caixa + paga fatura + despausa cartão
      Alert.alert(
        t('confirmPay'),
        t('wantToPay') + ' "' + expense.description + '" (' + formatCurrency(parseFloat(expense.amount)) + ')?',
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('pay'),
            style: 'default',
            onPress: () => {
              cashAddTransaction(expense.amount, 'expense', {
                description: 'Pagamento: ' + expense.description,
                date: new Date().toISOString().split('T')[0],
              });
              payBill(expense.id);
              Alert.alert(t('success'), t('billPaid'));
            }
          },
        ]
      );
    } else if (!expense.cardId) {
      // Boleto/standalone: apenas marca como pago
      Alert.alert(
        t('confirmPay'),
        t('wantToPay') + ' "' + expense.description + '" (' + formatCurrency(parseFloat(expense.amount)) + ')?',
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('pay'), style: 'default', onPress: () => toggleExpensePaid(expense.id) },
        ]
      );
    }
  };

  const renderExpenseItem = ({ item }) => {
    const category = getCategoryInfo(item.category);
    const card = cards.find(c => c.id === item.cardId);
    const isPaid = item.paid === true;
    const isBill = item.isBill === true;
    const canPay = !isPaid && (isBill || !item.cardId);

    return (
      <TouchableOpacity
        style={[styles.expenseItem, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('EditExpense', { expenseId: item.id })}
        onLongPress={() => handleDeleteExpense(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
          <Ionicons name={category.icon} size={20} color={category.color} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseDescription, { color: colors.text, textDecorationLine: isPaid ? 'line-through' : 'none', opacity: isPaid ? 0.6 : 1 }]}>
            {item.description}
          </Text>
          <View style={styles.expenseMeta}>
            <Text style={[styles.expenseCategory, { color: category.color }]}>{category.name}</Text>
            {isBill ? (
              <View style={[styles.billBadge, { backgroundColor: colors.warning + '15' }]}>
                <Ionicons name="document-text-outline" size={10} color={colors.warning} />
                <Text style={[styles.billText, { color: colors.warning }]}>{t('bill')}</Text>
              </View>
            ) : card ? (
              <View style={[styles.cardBadge, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="card-outline" size={10} color={colors.primary} />
                <Text style={[styles.cardBadgeText, { color: colors.primary }]}>{card.name}</Text>
              </View>
            ) : (
              <View style={[styles.standaloneBadge, { backgroundColor: colors.warning + '15' }]}>
                <Ionicons name="receipt-outline" size={10} color={colors.warning} />
                <Text style={[styles.standaloneText, { color: colors.warning }]}>{t('standalone')}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.expenseDate, { color: colors.textLight }]}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={[styles.expenseAmount, { color: isPaid ? colors.textLight : colors.danger, textDecorationLine: isPaid ? 'line-through' : 'none' }]}>
            {formatCurrency(parseFloat(item.amount))}
          </Text>
          {canPay && (
            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: colors.success }]}
              onPress={() => handlePayExpense(item)}
            >
              <Text style={styles.payButtonText}>{t('pay')}</Text>
            </TouchableOpacity>
          )}
          {isPaid && (
            <View style={[styles.paidBadge, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={10} color={colors.success} />
              <Text style={[styles.paidText, { color: colors.success }]}>{t('paid')}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCashItem = ({ item }) => {
    return (
      <View style={[styles.expenseItem, { backgroundColor: colors.card }]}>
        <View style={[styles.categoryIcon, { backgroundColor: colors.success + '15' }]}>
          <Ionicons name="cash" size={20} color={colors.success} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseDescription, { color: colors.text }]}>{item.description}</Text>
          <Text style={[styles.expenseCategory, { color: colors.textLight }]}>{t('cash')}</Text>
          <Text style={[styles.expenseDate, { color: colors.textLight }]}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={[styles.cashAmount, { color: colors.success }]}>+ {formatCurrency(parseFloat(item.amount))}</Text>
        </View>
      </View>
    );
  };

  const getTotal = () => {
    if (viewMode === 'cash') {
      return (cashTransactions || []).reduce((sum, e) => sum + parseFloat(e.amount), 0);
    }
    return filterExpenses().reduce((sum, e) => sum + parseFloat(e.amount), 0);
  };

  const getData = () => {
    if (viewMode === 'cash') return filterCash();
    return filterExpenses();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('history')} />

      <View style={styles.filtersContainer}>
        <PeriodFilter
          selectedPeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
          colors={colors}
        />
      </View>

      <View style={styles.viewModeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.viewModeScroll}>
          {['all', 'card', 'standalone', 'bill', 'cash'].map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.viewModeBtn, {
                backgroundColor: viewMode === mode ? colors.primary + '15' : colors.card,
                borderColor: viewMode === mode ? colors.primary : colors.border,
              }]}
              onPress={() => setViewMode(mode)}
            >
              <Ionicons
                name={mode === 'all' ? 'list' : mode === 'card' ? 'card' : mode === 'standalone' ? 'receipt' : mode === 'bill' ? 'document-text' : 'cash'}
                size={16}
                color={viewMode === mode ? colors.primary : colors.text}
              />
              <Text style={[styles.viewModeText, { color: viewMode === mode ? colors.primary : colors.text }]}>
                {mode === 'all' ? t('all') : mode === 'card' ? t('card') : mode === 'standalone' ? t('standalone') : mode === 'bill' ? t('bill') : t('cash')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.totalContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.totalLabel, { color: colors.textLight }]}>{t('total')}</Text>
        <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(getTotal())}</Text>
      </View>

      {getData().length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
          <Text style={[styles.emptyText, { color: colors.textLight }]}>{t('noExpenses')}</Text>
        </View>
      ) : (
        <FlatList
          data={getData()}
          renderItem={viewMode === 'cash' ? renderCashItem : renderExpenseItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  viewModeContainer: { paddingVertical: 12, paddingHorizontal: 16 },
  viewModeScroll: { gap: 8 },
  viewModeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 6 },
  viewModeText: { fontSize: 13, fontWeight: '500' },
  totalContainer: { marginHorizontal: 16, marginVertical: 12, padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: 'bold' },
  listContent: { padding: 16, paddingBottom: 30 },
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
  payButton: { marginTop: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  payButtonText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, gap: 3 },
  paidText: { fontSize: 10, fontWeight: '600' },
  standaloneBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 3 },
  standaloneText: { fontSize: 10, fontWeight: '600' },
  billBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 3 },
  billText: { fontSize: 10, fontWeight: '600' },
  cardBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 3 },
  cardBadgeText: { fontSize: 10, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40, paddingTop: 80 },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
});
