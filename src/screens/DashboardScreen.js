import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useCash } from '../context/CashContext';
import { usePlanning } from '../context/PlanningContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { FadeInView, SlideInView, ScaleInView } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const {
    expenses,
    cards,
    CATEGORIES,
    getFilteredExpenses,
    getMonthlyTotal,
    getTotalByCategory,
    getTotalByCard,
    getCardUsage,
    toggleExpensePaid,
    payBill,
  } = useExpenses();

  const { cashBalance, addCashTransaction: cashAddTransaction } = useCash();
  const { goals } = usePlanning();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();

  const [showAll, setShowAll] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getCategoryInfo = (categoryId) => {
    if (!categoryId) return { name: 'Outros', color: '#999', icon: 'ellipsis-horizontal' };
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat || { name: 'Outros', color: '#999', icon: 'ellipsis-horizontal' };
  };

  const todayExpenses = getFilteredExpenses('today');
  const weekExpenses = getFilteredExpenses('week');
  const monthExpenses = getFilteredExpenses('month');

  const todayTotal = getMonthlyTotal(todayExpenses);
  const weekTotal = getMonthlyTotal(weekExpenses);
  const monthTotal = getMonthlyTotal(monthExpenses);

  const unpaidExpenses = expenses.filter(e => !e.paid);
  const totalUnpaid = unpaidExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const recentExpenses = expenses.slice(0, 5);
  const displayedExpenses = showAll ? expenses : recentExpenses;

  const categoryTotals = getTotalByCategory(monthExpenses);
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const cardTotals = getTotalByCard(monthExpenses);
  const cardUsage = cards.map(card => ({
    ...card,
    usage: getCardUsage(card.id),
    percentage: card.limit > 0 ? (getCardUsage(card.id) / card.limit) * 100 : 0,
  }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('morning');
    if (hour < 18) return t('afternoon');
    return t('evening');
  };

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
    // Cartões: não faz nada (não tem botão)
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('dashboard')} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.greetingContainer}>
          <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting()}</Text>
          <Text style={[styles.greetingSub, { color: colors.textLight }]}>{t('overview')}</Text>
        </View>

        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="today" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textLight }]}>{t('today')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(todayTotal)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="calendar" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textLight }]}>{t('week')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(weekTotal)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.danger + '15' }]}>
              <Ionicons name="calendar-number" size={20} color={colors.danger} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textLight }]}>{t('month')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(monthTotal)}</Text>
          </View>
        </View>

        <View style={[styles.cashCard, { backgroundColor: colors.primary }]}>
          <View style={styles.cashCardContent}>
            <View>
              <Text style={styles.cashLabel}>{t('availableCash')}</Text>
              <Text style={styles.cashValue}>{formatCurrency(cashBalance)}</Text>
            </View>
            <View style={styles.cashIcon}>
              <Ionicons name="wallet" size={28} color="#fff" />
            </View>
          </View>
        </View>

        {unpaidExpenses.length > 0 && (
          <View style={[styles.unpaidCard, { backgroundColor: colors.danger + '10' }]}>
            <View style={styles.unpaidHeader}>
              <Ionicons name="warning" size={20} color={colors.danger} />
              <Text style={[styles.unpaidTitle, { color: colors.danger }]}>
                {unpaidExpenses.length} {unpaidExpenses.length === 1 ? t('unpaidExpense') : t('unpaidExpenses')}
              </Text>
            </View>
            <Text style={[styles.unpaidAmount, { color: colors.danger }]}>
              {t('total')}: {formatCurrency(totalUnpaid)}
            </Text>
          </View>
        )}

        {cards.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('myCards')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Cards')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>{t('seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
              {cardUsage.map(card => (
                <View key={card.id} style={[styles.cardItem, { backgroundColor: colors.card }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIcon, { backgroundColor: (card.color || colors.primary) + '15' }]}>
                      <Ionicons name={card.icon || 'card'} size={22} color={card.color || colors.primary} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.cardName, { color: colors.text }]}>{card.customName || card.name}</Text>
                      <Text style={[styles.cardLimit, { color: colors.textLight }]}>{t('limit')}: {formatCurrency(card.limit)}</Text>
                    </View>
                  </View>
                  <View style={styles.cardUsage}>
                    <View style={styles.cardUsageRow}>
                      <Text style={[styles.cardUsageLabel, { color: colors.textLight }]}>{t('used')}</Text>
                      <Text style={[styles.cardUsageValue, { color: colors.text }]}>{formatCurrency(card.usage)}</Text>
                    </View>
                    <View style={styles.cardUsageRow}>
                      <Text style={[styles.cardUsageLabel, { color: colors.textLight }]}>{t('available')}</Text>
                      <Text style={[styles.cardUsageValue, { color: colors.primary }]}>{formatCurrency(Math.max(0, card.limit - card.usage))}</Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, {
                      width: `${Math.min(card.percentage, 100)}%`,
                      backgroundColor: card.percentage >= 100 ? colors.danger : card.percentage >= 80 ? colors.warning : colors.primary,
                    }]} />
                  </View>
                  <Text style={[styles.progressText, {
                    color: card.percentage >= 100 ? colors.danger : card.percentage >= 80 ? colors.warning : colors.primary,
                  }]}>
                    {card.percentage.toFixed(1)}% {t('used')}
                  </Text>
                  {card.percentage >= 100 && (
                    <View style={[styles.cardAlert, { backgroundColor: colors.danger + '15' }]}>
                      <Ionicons name="warning" size={12} color={colors.danger} />
                      <Text style={[styles.cardAlertText, { color: colors.danger }]}>{t('limitExceeded')}</Text>
                    </View>
                  )}
                  {card.percentage >= 80 && card.percentage < 100 && (
                    <View style={[styles.cardAlert, { backgroundColor: colors.warning + '15' }]}>
                      <Ionicons name="alert-circle" size={12} color={colors.warning} />
                      <Text style={[styles.cardAlertText, { color: colors.warning }]}>{t('nearLimit')}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {topCategories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('topCategories')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Charts')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>{t('seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.categoriesList}>
              {topCategories.map(([catId, amount]) => {
                const cat = getCategoryInfo(catId);
                return (
                  <View key={catId} style={[styles.categoryItem, { backgroundColor: colors.card }]}>
                    <View style={[styles.categoryIcon, { backgroundColor: cat.color + '15' }]}>
                      <Ionicons name={cat.icon} size={18} color={cat.color} />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                      <Text style={[styles.categoryAmount, { color: colors.textLight }]}>{formatCurrency(amount)}</Text>
                    </View>
                    <View style={styles.categoryBar}>
                      <View style={[styles.categoryBarFill, {
                        width: `${Math.min((amount / monthTotal) * 100, 100)}%`,
                        backgroundColor: cat.color,
                      }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recentExpenses')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>
          {displayedExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textLight }]}>{t('noExpenses')}</Text>
            </View>
          ) : (
            <View>
              {displayedExpenses.map(item => (
                <View key={item.id}>
                  {renderExpenseItem({ item })}
                </View>
              ))}
              {expenses.length > 5 && (
                <TouchableOpacity
                  style={[styles.showAllButton, { backgroundColor: colors.primary + '15' }]}
                  onPress={() => setShowAll(!showAll)}
                >
                  <Text style={[styles.showAllText, { color: colors.primary }]}>
                    {showAll ? t('showLess') : t('showAll')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {goals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('goals')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Planning')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>{t('seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.goalsList}>
              {goals.slice(0, 3).map(goal => (
                <View key={goal.id} style={[styles.goalItem, { backgroundColor: colors.card }]}>
                  <View style={styles.goalHeader}>
                    <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                    <Text style={[styles.goalAmount, { color: colors.textLight }]}>
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </Text>
                  </View>
                  <View style={styles.goalProgress}>
                    <View style={[styles.goalProgressBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.goalProgressFill, {
                        width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`,
                        backgroundColor: goal.completed ? colors.success : colors.primary,
                      }]} />
                    </View>
                    <Text style={[styles.goalProgressText, { color: colors.textLight }]}>
                      {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30 },
  greetingContainer: { marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold' },
  greetingSub: { fontSize: 14, marginTop: 4 },
  summaryCards: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, padding: 14, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  summaryIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 12, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: 'bold' },
  cashCard: { borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  cashCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cashLabel: { color: '#fff', fontSize: 14, opacity: 0.8 },
  cashValue: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  cashIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  unpaidCard: { borderRadius: 16, padding: 16, marginBottom: 20 },
  unpaidHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unpaidTitle: { fontSize: 14, fontWeight: '600' },
  unpaidAmount: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  cardsScroll: { paddingRight: 16, gap: 12 },
  cardItem: { width: width * 0.75, padding: 16, borderRadius: 18, marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: 'bold' },
  cardLimit: { fontSize: 12, marginTop: 2 },
  cardUsage: { marginBottom: 8 },
  cardUsageRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardUsageLabel: { fontSize: 12 },
  cardUsageValue: { fontSize: 12, fontWeight: '600' },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: '#e0e0e0', overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: '600', textAlign: 'right' },
  cardAlert: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8, gap: 4 },
  cardAlertText: { fontSize: 11, fontWeight: '600' },
  categoriesList: { gap: 8 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14 },
  categoryIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: '600' },
  categoryAmount: { fontSize: 12, marginTop: 2 },
  categoryBar: { width: 60, height: 6, borderRadius: 3, backgroundColor: '#e0e0e0', overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 3 },
  expenseItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseDescription: { fontSize: 15, fontWeight: '600' },
  expenseMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 6 },
  expenseCategory: { fontSize: 12 },
  expenseDate: { fontSize: 11, marginTop: 4 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 15, fontWeight: 'bold' },
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
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, marginTop: 12 },
  showAllButton: { padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  showAllText: { fontSize: 14, fontWeight: '600' },
  goalsList: { gap: 8 },
  goalItem: { padding: 14, borderRadius: 14 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  goalName: { fontSize: 14, fontWeight: '600' },
  goalAmount: { fontSize: 12 },
  goalProgress: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalProgressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  goalProgressFill: { height: '100%', borderRadius: 3 },
  goalProgressText: { fontSize: 12, fontWeight: '600' },
});
