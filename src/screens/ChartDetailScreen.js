import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { FadeInView, SlideInView, StaggeredList } from '../components/AnimatedComponents';
import { getBankById } from '../utils/BanksData';

export default function ChartDetailScreen({ navigation, route }) {
  const { type, id, name, period, customStart, customEnd } = route.params;
  const { expenses, cards, getFilteredExpenses, CATEGORIES } = useExpenses();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();

  // Filter expenses based on type
  let filteredExpenses = [];
  let total = 0;
  let count = 0;

  if (type === 'category') {
    filteredExpenses = expenses.filter(e => e.category === id);
    total = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    count = filteredExpenses.length;
  } else if (type === 'card') {
    filteredExpenses = expenses.filter(e => e.cardId === id);
    total = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    count = filteredExpenses.length;
  } else if (type === 'month') {
    const [year, month] = id.split('-');
    filteredExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === parseInt(year) && d.getMonth() === parseInt(month) - 1;
    });
    total = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    count = filteredExpenses.length;
  }

  // Sort by date (newest first)
  filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

    const getCategoryInfo = (categoryId) => {
      const cat = CATEGORIES.find(c => c.id === categoryId);
      if (cat) return cat;
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
    };

  // Set header title
  useEffect(() => {
    navigation.setOptions({ title: `${name} (${count})` });
  }, [name, count]);

  const renderItem = ({ item, index }) => {
    const category = getCategoryInfo(item.category);
    const card = cards.find(c => c.id === item.cardId);
    const bank = card ? getBankById(card.bankId) : null;

    return (
      <SlideInView delay={index * 50}>
        <TouchableOpacity 
          style={[styles.expenseItem, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('EditExpense', { expenseId: item.id })}
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
                <View style={[styles.cardBadge, { backgroundColor: (bank?.color || card.color) + '20' }]}>
                  <Text style={[styles.cardBadgeText, { color: bank?.color || card.color }]}>{bank?.name || card.name}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.expenseDate, { color: colors.textLight }]}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.expenseRight}>
            <Text style={[styles.expenseAmount, { color: colors.danger }]}>{formatCurrency(parseFloat(item.amount))}</Text>
            <Ionicons name="create-outline" size={14} color={colors.textLight} />
          </View>
        </TouchableOpacity>
      </SlideInView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Summary Header */}
      <FadeInView>
        <View style={[styles.summaryHeader, { backgroundColor: colors.header }]}>
          <Text style={[styles.summaryTitle, { color: colors.headerText }]}>{name}</Text>
          <Text style={[styles.summaryTotal, { color: colors.headerText }]}>{formatCurrency(total)}</Text>
          <Text style={[styles.summaryCount, { color: colors.headerText }]}>
            {count} {t('registeredExpenses')}
          </Text>
        </View>
      </FadeInView>

      {/* Stats Row */}
      <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{formatCurrency(total / (count || 1))}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Media por gasto</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {formatCurrency(Math.max(...filteredExpenses.map(e => parseFloat(e.amount)), 0))}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Maior gasto</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {formatCurrency(Math.min(...filteredExpenses.map(e => parseFloat(e.amount)), Infinity))}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Menor gasto</Text>
        </View>
      </View>

      {/* List */}
      {filteredExpenses.length === 0 ? (
        <FadeInView>
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum gasto encontrado</Text>
          </View>
        </FadeInView>
      ) : (
        <FlatList
          data={filteredExpenses}
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
  summaryHeader: {
    padding: 24, paddingTop: 50,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  summaryTitle: { fontSize: 16, opacity: 0.8 },
  summaryTotal: { fontSize: 32, fontWeight: 'bold', marginVertical: 8 },
  summaryCount: { fontSize: 14, opacity: 0.7 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    margin: 16, padding: 16, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, backgroundColor: '#e0e0e0', marginHorizontal: 8 },
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
