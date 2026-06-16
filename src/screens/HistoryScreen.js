import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { useCash } from '../contexts/CashContext';
import { useExpense } from '../contexts/ExpenseContext';
import { AppHeader, BackButton } from '../components/Navigation';
import { PeriodFilter, SimpleList } from '../components/UtilsComponents';
import { CashListItem, ExpenseListItem } from '../components/ListItems';
import { SearchBar } from '../components/Forms';
import { Screen, SectionHeader, EmptyState } from '../components/Layout';
import { LoadingSpinner } from '../components/Indicators';

const ExpenseItem = ({ item, colors, onToggle, onDelete }) => {
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount);
  return (
    <View style={[styles.expenseItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.expenseInfo}>
        <Text style={[styles.expenseDesc, { color: colors.text }]}>{item.description}</Text>
        <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>{item.date}</Text>
      </View>
      <Text style={[styles.expenseAmount, { color: colors.text }]}>{fmt}</Text>
      <View style={styles.expenseActions}>
        <TouchableOpacity onPress={() => onToggle(item.id)}>
          <Ionicons 
            name={item.paid ? "checkmark-circle" : "ellipse-outline"} 
            size={24} 
            color={item.paid ? colors.success : colors.textSecondary} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function HistoryScreen() {
  const { expenses, toggleExpensePaid, deleteExpense, getFilteredExpenses } = useExpenses();
  const { colors } = useTheme();
  const { t } = useI18n();

  const [period, setPeriod] = useState('all');

  const filteredExpenses = useMemo(() => {
    return getFilteredExpenses(period);
  }, [expenses, period, getFilteredExpenses]);

  const handleToggle = useCallback((id) => {
    toggleExpensePaid(id);
  }, [toggleExpensePaid]);

  const handleDelete = useCallback((id) => {
    Alert.alert(
      t('confirmDelete'),
      t('wantToDelete'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteExpense(id) },
      ]
    );
  }, [deleteExpense, t]);

  const total = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  }, [filteredExpenses]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('history')}</Text>
        <Text style={[styles.headerTotal, { color: colors.primary }]}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
        </Text>
      </View>

      <PeriodFilter current={period} onChange={setPeriod} colors={colors} t={t} />

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseItem 
            item={item} 
            colors={colors} 
            onToggle={handleToggle} 
            onDelete={handleDelete} 
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noExpenses')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerTotal: { fontSize: 18, fontWeight: '600' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16 },
  expenseItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1 },
  expenseInfo: { flex: 1 },
  expenseDesc: { fontSize: 15, fontWeight: '600' },
  expenseDate: { fontSize: 12, marginTop: 2 },
  expenseAmount: { fontSize: 15, fontWeight: 'bold', marginRight: 12 },
  expenseActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteButton: { padding: 4 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16 },
});