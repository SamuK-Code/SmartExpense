import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { FadeInView, SlideInView } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';
import SimpleList from '../components/SimpleList';
import PeriodFilter from '../components/PeriodFilter';

export default function HistoryScreen({ navigation }) {
  const { expenses, deleteExpense, getFilteredExpenses, cards, CATEGORIES, getMonthlyTotal, cashTransactions, addCashTransaction } = useExpenses();
  const { colors, isDark } = useTheme();
  const [period, setPeriod] = useState('all');
  const [filter, setFilter] = useState('all');
  const [historyTab, setHistoryTab] = useState('expenses'); // 'expenses' or 'cash'

  const filteredExpenses = getFilteredExpenses(period);

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[7];
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const monthlyTotal = getMonthlyTotal(getFilteredExpenses('month'));

  const getExpenseSeverity = (amount) => {
    if (monthlyTotal === 0) return { level: 'normal', color: colors.textSecondary, label: '', icon: '', bgColor: 'transparent' };
    const percentage = (amount / monthlyTotal) * 100;
    if (percentage >= 20) {
      return { level: 'high', color: colors.danger, label: 'Muito caro', icon: 'alert-circle', bgColor: colors.danger + (isDark ? '25' : '15') };
    } else if (percentage >= 10) {
      return { level: 'medium', color: colors.warning, label: 'Médio', icon: 'trending-up', bgColor: colors.warning + (isDark ? '25' : '15') };
    } else if (percentage >= 5) {
      return { level: 'low', color: colors.info, label: 'Simples', icon: 'checkmark-circle', bgColor: colors.info + (isDark ? '25' : '15') };
    }
    return { level: 'normal', color: colors.textSecondary, label: '', icon: '', bgColor: 'transparent' };
  };

  const finalExpenses = filter === 'all' 
    ? filteredExpenses 
    : filteredExpenses.filter(e => e.category === filter);

  const handleDelete = (expense) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir "${expense.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteExpense(expense.id) },
      ]
    );
  };

  const renderCashItem = (item) => {
    return (
      <TouchableOpacity 
        style={[styles.expenseItem, { backgroundColor: colors.card }]}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIcon, { backgroundColor: colors.success + (isDark ? '30' : '20') }]}>
          <Ionicons name="cash-outline" size={22} color={colors.success} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseDescription, { color: colors.text }]}>{item.description}</Text>
          <View style={styles.expenseMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.success + (isDark ? '30' : '20') }]}>
              <Text style={[styles.categoryBadgeText, { color: colors.success }]}>Entrada</Text>
            </View>
          </View>
          <Text style={[styles.expenseDate, { color: colors.textLight }]}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={[styles.expenseAmount, { color: colors.success }]}>
            + {formatCurrency(parseFloat(item.amount))}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderExpenseItem = (item) => {
    const category = getCategoryInfo(item.category);
    const card = cards.find(c => c.id === item.cardId);
    const isStandalone = !item.cardId;
    const severity = getExpenseSeverity(parseFloat(item.amount));

    return (
      <TouchableOpacity 
        style={[styles.expenseItem, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('EditExpense', { expenseId: item.id })}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIcon, { backgroundColor: category.color + (isDark ? '30' : '20') }]}>
          <Ionicons name={category.icon} size={22} color={category.color} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseDescription, { color: colors.text }]}>{item.description}</Text>
          <View style={styles.expenseMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: category.color + (isDark ? '30' : '20') }]}>
              <Text style={[styles.categoryBadgeText, { color: category.color }]}>{category.name}</Text>
            </View>
            {isStandalone ? (
              <View style={[styles.standaloneBadge, { backgroundColor: colors.info + (isDark ? '30' : '20') }]}>
                <Ionicons name="receipt-outline" size={10} color={colors.info} />
                <Text style={[styles.standaloneText, { color: colors.info }]}>Boleto/Avulso</Text>
              </View>
            ) : card ? (
              <View style={[styles.cardBadge, { backgroundColor: card.color + '20' }]}>
                <Ionicons name="card-outline" size={10} color={card.color} />
                <Text style={[styles.cardBadgeText, { color: card.color }]}>{card.name}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.expenseBottomRow}>
            <Text style={[styles.expenseDate, { color: colors.textLight }]}>{formatDate(item.date)}</Text>
            {severity.label ? (
              <View style={[styles.severityBadge, { backgroundColor: severity.bgColor }]}>
                <Ionicons name={severity.icon} size={10} color={severity.color} />
                <Text style={[styles.severityText, { color: severity.color }]}>{severity.label}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.expenseRight}>
          <Text style={[styles.expenseAmount, { color: colors.danger }]}>
            {formatCurrency(parseFloat(item.amount))}
          </Text>
          <Ionicons name="create-outline" size={14} color={colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Histórico" />

      <PeriodFilter selected={period} onSelect={setPeriod} />

      <View style={[styles.filterContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && { backgroundColor: colors.header }]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && { color: '#fff' }, { color: colors.textSecondary }]}>Todos</Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterButton, filter === cat.id && { backgroundColor: cat.color + '30' }]}
              onPress={() => setFilter(cat.id)}
            >
              <Text style={[styles.filterText, filter === cat.id && { color: cat.color, fontWeight: 'bold' }, { color: colors.textSecondary }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* History Tabs */}
      <View style={[styles.historyTabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.historyTab, historyTab === 'expenses' && { backgroundColor: colors.primary }]}
          onPress={() => setHistoryTab('expenses')}
        >
          <Ionicons name="receipt-outline" size={16} color={historyTab === 'expenses' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.historyTabText, { color: historyTab === 'expenses' ? '#fff' : colors.textSecondary }]}>
            Gastos ({finalExpenses.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.historyTab, historyTab === 'cash' && { backgroundColor: colors.success }]}
          onPress={() => setHistoryTab('cash')}
        >
          <Ionicons name="cash-outline" size={16} color={historyTab === 'cash' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.historyTabText, { color: historyTab === 'cash' ? '#fff' : colors.textSecondary }]}>
            Entradas ({cashTransactions.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {historyTab === 'cash' ? (
          <SimpleList
            data={cashTransactions}
            renderItem={renderCashItem}
            keyExtractor={(item) => item.id}
            emptyTitle="Nenhuma entrada registrada"
            emptySubtitle="Adicione dinheiro ao caixa na aba Gastos"
            emptyIcon="cash-outline"
          />
        ) : (
          <SimpleList
          data={finalExpenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          emptyTitle="Nenhum gasto encontrado"
          emptySubtitle="Adicione seu primeiro gasto para começar"
          emptyIcon="receipt-outline"
          onAddPress={() => navigation.navigate('AddExpense')}
          addButtonText="Adicionar Gasto"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  historyTabs: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  historyTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  historyTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  container: { flex: 1 },
  content: { flex: 1 },
  filterContainer: { paddingVertical: 10, borderBottomWidth: 1 },
  filterScroll: { paddingHorizontal: 12 },
  filterButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 6 },
  filterText: { fontSize: 12 },
  expenseItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderRadius: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  categoryIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseDescription: { fontSize: 15, fontWeight: '600' },
  expenseMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 6 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryBadgeText: { fontSize: 11, fontWeight: '500' },
  // Standalone badge
  standaloneBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, gap: 3 },
  standaloneText: { fontSize: 11, fontWeight: '500' },
  // Card badge
  cardBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, gap: 3 },
  cardBadgeText: { fontSize: 11, fontWeight: '500' },
  expenseBottomRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, justifyContent: 'space-between' },
  expenseDate: { fontSize: 12 },
  severityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  severityText: { fontSize: 10, fontWeight: '600', marginLeft: 3 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 15, fontWeight: 'bold' },
});
