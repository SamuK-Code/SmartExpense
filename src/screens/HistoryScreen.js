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
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { FadeInView, SlideInView, StaggeredList } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';
import PeriodFilter from '../components/PeriodFilter';

export default function HistoryScreen({ navigation }) {
  const { expenses, deleteExpense, getFilteredExpenses, CATEGORIES } = useExpenses();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const [period, setPeriod] = useState('month');
  const [filterType, setFilterType] = useState('all'); // 'all', 'expenses', 'cash'

  const filteredExpenses = getFilteredExpenses(period);
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });

  const getCategoryInfo = (categoryId) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[7];

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

  const renderExpenseItem = ({ item, index }) => {
    const category = getCategoryInfo(item.category);
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
          <Text style={[styles.expenseDescription, { color: colors.text }]}>{item.description}</Text>
          <Text style={[styles.expenseCategory, { color: colors.textLight }]}>{category.name} • {formatDate(item.date)}</Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={[styles.expenseAmount, { color: colors.danger }]}>{formatCurrency(parseFloat(item.amount))}</Text>
          {item.cardId ? (
            <View style={[styles.cardBadge, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="card" size={10} color={colors.primary} />
              <Text style={[styles.cardBadgeText, { color: colors.primary }]}>{t('card')}</Text>
            </View>
          ) : (
            <View style={[styles.cardBadge, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="receipt" size={10} color={colors.warning} />
              <Text style={[styles.cardBadgeText, { color: colors.warning }]}>{t('standalone')}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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

      {filteredExpenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noExpenses')}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>{t('addFirstExpense')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          renderItem={renderExpenseItem}
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
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 15, fontWeight: 'bold' },
  cardBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, gap: 3 },
  cardBadgeText: { fontSize: 10, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
