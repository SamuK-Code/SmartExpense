import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,  // ← ADICIONADO
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { FadeInView, SlideInView, StaggeredList } from '../components/AnimatedComponents';
import PeriodFilter from '../components/PeriodFilter';

export default function HistoryScreen({ navigation }) {
  const { expenses, deleteExpense, getFilteredExpenses, cards, CATEGORIES } = useExpenses();
  const { colors, isDark } = useTheme();
  const [period, setPeriod] = useState('all');
  const [filter, setFilter] = useState('all');

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

  const finalExpenses = filter === 'all' 
    ? filteredExpenses 
    : filteredExpenses.filter(e => e.category === filter);

  const handleDelete = (expense) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir "${expense.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => deleteExpense(expense.id)
        },
      ]
    );
  };

  const renderItem = ({ item, index }) => {
    const category = getCategoryInfo(item.category);
    const card = cards.find(c => c.id === item.cardId);
    return (
      <SlideInView delay={index * 50}>
        <TouchableOpacity 
          style={[styles.expenseItem, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('EditExpense', { expenseId: item.id })}
          onLongPress={() => handleDelete(item)}
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
              {card && (
                <View style={[styles.cardBadge, { backgroundColor: card.color + '20' }]}>
                  <Text style={[styles.cardBadgeText, { color: card.color }]}>{card.name}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.expenseDate, { color: colors.textLight }]}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.expenseRight}>
            <Text style={[styles.expenseAmount, { color: colors.danger }]}>
              {formatCurrency(parseFloat(item.amount))}
            </Text>
            <Ionicons name="create-outline" size={14} color={colors.textLight} />
          </View>
        </TouchableOpacity>
      </SlideInView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PeriodFilter selected={period} onSelect={setPeriod} />

      {/* Category Filter */}
      <View style={[styles.filterContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && { backgroundColor: colors.header }]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && { color: '#fff' }, { color: colors.textSecondary }]}>
              Todos
            </Text>
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

      {finalExpenses.length === 0 ? (
        <FadeInView>
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum gasto encontrado</Text>
          </View>
        </FadeInView>
      ) : (
        <FlatList
          data={finalExpenses}
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
  filterContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterScroll: { paddingHorizontal: 12 },
  filterButton: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, marginRight: 6,
  },
  filterText: { fontSize: 12 },
  listContent: { padding: 16 },
  expenseItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  categoryIcon: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseDescription: { fontSize: 15, fontWeight: '600' },
  expenseMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' },
  categoryBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, marginRight: 6, marginBottom: 4,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '500' },
  cardBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, marginBottom: 4,
  },
  cardBadgeText: { fontSize: 11, fontWeight: '500' },
  expenseDate: { fontSize: 12, marginTop: 4 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 15, fontWeight: 'bold' },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40,
  },
  emptyText: { fontSize: 14, marginTop: 12 },
});
