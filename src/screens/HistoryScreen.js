import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useCash } from '../context/CashContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { FadeInView, SlideInView, StaggeredList } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';
import PeriodFilter from '../components/PeriodFilter';

export default function HistoryScreen({ navigation }) {
  const { expenses, deleteExpense, getFilteredExpenses, CATEGORIES, toggleExpensePaid } = useExpenses();
  const { cashTransactions } = useCash();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const [period, setPeriod] = useState('month');
  const [filterType, setFilterType] = useState('all'); // 'all', 'expenses', 'cash'

  const filteredExpenses = getFilteredExpenses(period);
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });

  const getCategoryInfo = (categoryId) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[7] || { name: 'Outros', color: '#999', icon: 'ellipsis-horizontal' };

  const handleDelete = (expense) => {
    Alert.alert(
      t('confirm') + ' ' + t('delete'),
      t('confirmDeleteExpense') + ' "' + expense.description + '"?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteExpense(expense.id) },
      ]
    );
  };

  const handlePayExpense = (expense) => {
    Alert.alert(
      t('confirmPay'),
      t('wantToPay') + ' "' + expense.description + '" (' + formatCurrency(parseFloat(expense.amount)) + ')?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('pay'), style: 'default', onPress: () => toggleExpensePaid(expense.id) },
      ]
    );
  };

  const renderExpenseItem = ({ item }) => {
    const category = getCategoryInfo(item.category);
    const isPaid = item.paid === true;
    return (
      <TouchableOpacity
        style={[styles.expenseItem, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('EditExpense', { expenseId: item.id })}
        onLongPress={() => handleDelete(item)}
      >
        <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
          <Ionicons name={category.icon} size={22} color={category.color} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseDescription, { color: colors.text, textDecorationLine: isPaid ? 'line-through' : 'none', opacity: isPaid ? 0.6 : 1 }]}>
            {item.description}
          </Text>
          <Text style={[styles.expenseCategory, { color: colors.textLight }]}>
            {category.name} • {formatDate(item.date)}
          </Text>
          {isPaid && (
            <View style={[styles.paidBadge, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={10} color={colors.success} />
              <Text style={[styles.paidText, { color: colors.success }]}>{t('paid')}</Text>
            </View>
          )}
        </View>
        <View style={styles.expenseRight}>
          <Text style={[styles.expenseAmount, { color: isPaid ? colors.textLight : colors.danger, textDecorationLine: isPaid ? 'line-through' : 'none' }]}>
            {formatCurrency(parseFloat(item.amount))}
          </Text>
          {!isPaid && (
            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: colors.success }]}
              onPress={() => handlePayExpense(item)}
            >
              <Text style={styles.payButtonText}>{t('pay')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCashItem = ({ item }) => (
    <View style={[styles.expenseItem, { backgroundColor: colors.card }]}>
      <View style={[styles.categoryIcon, { backgroundColor: colors.success + '15' }]}>
        <Ionicons name="cash" size={22} color={colors.success} />
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

  const getDisplayData = () => {
    if (filterType === 'cash') {
      return { data: cashTransactions || [], renderItem: renderCashItem, emptyKey: 'noCashEntries' };
    }
    if (filterType === 'expenses') {
      return { data: filteredExpenses, renderItem: renderExpenseItem, emptyKey: 'noExpenses' };
    }
    // 'all' - mesclar gastos e caixa, ordenados por data
    const allItems = [
      ...filteredExpenses.map(e => ({ ...e, _type: 'expense' })),
      ...(cashTransactions || []).map(c => ({ ...c, _type: 'cash' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    return { data: allItems, renderItem: renderAllItem, emptyKey: 'noExpenses' };
  };

  const renderAllItem = ({ item }) => {
    if (item._type === 'cash') {
      return (
        <View style={[styles.expenseItem, { backgroundColor: colors.card }]}>
          <View style={[styles.categoryIcon, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="cash" size={22} color={colors.success} />
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
    }
    const category = getCategoryInfo(item.category);
    const isPaid = item.paid === true;
    return (
      <TouchableOpacity
        style={[styles.expenseItem, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('EditExpense', { expenseId: item.id })}
        onLongPress={() => handleDelete(item)}
      >
        <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
          <Ionicons name={category.icon} size={22} color={category.color} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseDescription, { color: colors.text, textDecorationLine: isPaid ? 'line-through' : 'none', opacity: isPaid ? 0.6 : 1 }]}>
            {item.description}
          </Text>
          <Text style={[styles.expenseCategory, { color: colors.textLight }]}>
            {category.name} • {formatDate(item.date)}
          </Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={[styles.expenseAmount, { color: isPaid ? colors.textLight : colors.danger, textDecorationLine: isPaid ? 'line-through' : 'none' }]}>
            {formatCurrency(parseFloat(item.amount))}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const { data, renderItem, emptyKey } = getDisplayData();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('history')} />
      <PeriodFilter period={period} onChange={setPeriod} />

      <View style={[styles.filterContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: filterType === 'all' ? colors.primary + '15' : 'transparent' }]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, { color: filterType === 'all' ? colors.primary : colors.text }]}>{t('all')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: filterType === 'expenses' ? colors.primary + '15' : 'transparent' }]}
          onPress={() => setFilterType('expenses')}
        >
          <Text style={[styles.filterText, { color: filterType === 'expenses' ? colors.primary : colors.text }]}>{t('expenses')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: filterType === 'cash' ? colors.success + '15' : 'transparent' }]}
          onPress={() => setFilterType('cash')}
        >
          <Text style={[styles.filterText, { color: filterType === 'cash' ? colors.success : colors.text }]}>{t('cash')}</Text>
        </TouchableOpacity>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t(emptyKey)}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>{t('addFirstExpense')}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
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
  filterContainer: { flexDirection: 'row', padding: 12, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, gap: 8 },
  filterButton: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  filterText: { fontSize: 12, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 80 },
  expenseItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseDescription: { fontSize: 15, fontWeight: '600' },
  expenseCategory: { fontSize: 12, marginTop: 2 },
  expenseDate: { fontSize: 11, marginTop: 4 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 15, fontWeight: 'bold' },
  cashAmount: { fontSize: 15, fontWeight: 'bold' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, gap: 3, alignSelf: 'flex-start' },
  paidText: { fontSize: 10, fontWeight: '600' },
  payButton: { marginTop: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  payButtonText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
