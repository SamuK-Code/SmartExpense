import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { usePlanning } from '../context/PlanningContext';
import { useCash } from '../context/CashContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { FadeInView, StaggeredList } from '../components/AnimatedComponents';
import Toast, { showToast } from '../components/Toast';
import { safeGetItem, STORAGE_KEYS } from '../utils/SafeStorage';
import PeriodFilter from '../components/PeriodFilter';
import { getBankById } from '../utils/BanksData';

export default function HomeScreen({ navigation }) {
  const { expenses, cards, alerts, dismissAlert, getFilteredExpenses, getMonthlyTotal, CATEGORIES, toggleExpensePaid } = useExpenses();
  const { cashBalance } = useCash();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const [period, setPeriod] = useState('month');

  const filteredExpenses = getFilteredExpenses(period);
  const monthlyTotal = getMonthlyTotal(filteredExpenses);
  const recentExpenses = filteredExpenses.slice(0, 5);

  // Dívidas pendentes = gastos não pagos
  const pendingExpenses = expenses.filter(e => e.paid !== true);
  const totalPendingDebts = pendingExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const isCashInsufficient = cashBalance > 0 && cashBalance < monthlyTotal;
  const cashDeficit = monthlyTotal - cashBalance;

  useEffect(() => {
    const checkAlertsEnabled = async () => {
      const enabled = await safeGetItem(STORAGE_KEYS.ALERTS_ENABLED, true);
      if (enabled && alerts.length > 0) {
        const dangerAlert = alerts.find(a => a.type === 'danger');
        const warningAlert = alerts.find(a => a.type === 'warning');
        const alertToShow = dangerAlert || warningAlert || alerts[0];
        if (alertToShow) {
          const typeMap = { danger: 'danger', warning: 'warning', info: 'info' };
          showToast(alertToShow.message, typeMap[alertToShow.type] || 'info', 4000);
          setTimeout(() => dismissAlert(alertToShow.id), 4500);
        }
      }
    };
    checkAlertsEnabled();
  }, [alerts]);

  const getCategoryInfo = (categoryId) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[7];
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR');

  const handlePayExpense = (expense) => {
    Alert.alert(
      t('confirmPay'),
      t('wantToPay') + ' "' + expense.description + '" (' + formatCurrency(parseFloat(expense.amount)) + ')?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('pay'), style: 'default', onPress: () => {
          toggleExpensePaid(expense.id);
          showToast(t('expensePaid'), 'success', 2000);
        }},
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cash Balance Header */}
        <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
          <Text style={[styles.headerTitle, { color: '#fff' }]}>{t('availableCash')}</Text>
          <Text style={[styles.headerAmount, { color: '#fff' }]}>{formatCurrency(cashBalance)}</Text>
          <Text style={[styles.headerSubtitle, { color: '#fff' }]}>
            {filteredExpenses.length} {t('transactions')} {t('totalPeriod')}
          </Text>
        </View>

        {/* Pending Debts Card */}
        {totalPendingDebts > 0 && (
          <FadeInView style={[styles.debtsCard, { backgroundColor: colors.danger + '10' }]}>
            <View style={styles.debtsRow}>
              <Ionicons name="alert-circle" size={24} color={colors.danger} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.debtsLabel, { color: colors.danger }]}>{t('pendingDebts')}</Text>
                <Text style={[styles.debtsValue, { color: colors.danger }]}>{formatCurrency(totalPendingDebts)}</Text>
              </View>
              <View style={[styles.debtsBadge, { backgroundColor: colors.danger + '15' }]}>
                <Text style={[styles.debtsBadgeText, { color: colors.danger }]}>{pendingExpenses.length} {t('transactions')}</Text>
              </View>
            </View>
          </FadeInView>
        )}

        {/* Insufficient Cash Alert */}
        {isCashInsufficient && (
          <FadeInView style={[styles.cashAlert, { backgroundColor: colors.danger + '10' }]}>
            <Ionicons name="warning" size={20} color={colors.danger} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[styles.cashAlertTitle, { color: colors.danger }]}>{t('insufficientCash')}</Text>
              <Text style={[styles.cashAlertText, { color: colors.danger }]}>
                {t('cashDeficit', { expenses: formatCurrency(monthlyTotal), cash: formatCurrency(cashBalance), deficit: formatCurrency(cashDeficit) })}
              </Text>
            </View>
          </FadeInView>
        )}

        {cashBalance <= 0 && (
          <View style={[styles.cashAlert, { backgroundColor: colors.warning + '10' }]}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[styles.cashAlertTitle, { color: colors.warning }]}>{t('noCash')}</Text>
              <Text style={[styles.cashAlertText, { color: colors.warning }]}>{t('addFirstExpense')}</Text>
            </View>
          </View>
        )}

        {/* Period Filter */}
        <PeriodFilter period={period} onChange={setPeriod} />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AddTab')}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="add" size={24} color="#fff" />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>{t('newExpense')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ChartsTab')}>
            <View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="stats-chart" size={24} color="#fff" />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>{t('charts')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('CardsTab')}>
            <View style={[styles.actionIcon, { backgroundColor: colors.info }]}>
              <Ionicons name="card" size={24} color="#fff" />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>{t('cards')}</Text>
          </TouchableOpacity>
        </View>

        {/* Cards Summary */}
        {cards.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('myCards')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cards.map(card => {
                const cardUsage = expenses.filter(e => e.cardId === card.id).reduce((sum, e) => sum + parseFloat(e.amount), 0);
                const pct = card.limit > 0 ? (cardUsage / card.limit) * 100 : 0;
                const bank = getBankById(card.bankId);
                return (
                  <View key={card.id} style={[styles.cardSummary, { backgroundColor: colors.card, borderLeftColor: bank?.color || colors.primary }]}>
                    <View style={[styles.cardColorBar, { backgroundColor: bank?.color || colors.primary }]} />
                    <View style={styles.cardBankRow}>
                      <View style={[styles.cardBankIcon, { backgroundColor: (bank?.color || colors.primary) + '15' }]}>
                        <Ionicons name={bank?.icon || 'card'} size={14} color={bank?.color || colors.primary} />
                      </View>
                      <Text style={[styles.cardBankName, { color: colors.textLight }]}>{bank?.name || card.name}</Text>
                    </View>
                    <Text style={[styles.cardCustomName, { color: colors.text }]}>{card.customName || card.name}</Text>
                    <Text style={[styles.cardUsage, { color: colors.danger }]}>{formatCurrency(cardUsage)}</Text>
                    <Text style={[styles.cardLimit, { color: colors.textLight }]}>{t('limit')}: {formatCurrency(card.limit)}</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 100 ? colors.danger : pct >= 80 ? colors.warning : colors.primary }]} />
                    </View>
                    <Text style={[styles.cardPct, { color: pct >= 100 ? colors.danger : pct >= 80 ? colors.warning : colors.primary }]}>
                      {pct.toFixed(0)}% {t('used')}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Recent Expenses */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recentExpenses')}</Text>
          {recentExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textLight }]}>{t('noExpenses')}</Text>
              <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AddTab')}>
                <Text style={styles.emptyButtonText}>{t('addFirstExpense')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <StaggeredList>
              {recentExpenses.map((expense) => {
                const category = getCategoryInfo(expense.category);
                const card = cards.find(c => c.id === expense.cardId);
                const bank = card ? getBankById(card.bankId) : null;
                const isPaid = expense.paid === true;
                return (
                  <TouchableOpacity key={expense.id} style={[styles.expenseItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('EditExpense', { expenseId: expense.id })}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
                      <Ionicons name={category.icon} size={22} color={category.color} />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={[styles.expenseDescription, { color: colors.text, textDecorationLine: isPaid ? 'line-through' : 'none', opacity: isPaid ? 0.6 : 1 }]}>
                        {expense.description}
                      </Text>
                      <Text style={[styles.expenseCategory, { color: colors.textLight }]}>
                        {category.name} {card ? `• ${bank?.name || card.name}` : ''}
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
                        {formatCurrency(parseFloat(expense.amount))}
                      </Text>
                      {!isPaid && (
                        <TouchableOpacity
                          style={[styles.payButton, { backgroundColor: colors.success }]} 
                          onPress={() => handlePayExpense(expense)}
                        >
                          <Text style={styles.payButtonText}>{t('pay')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </StaggeredList>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCard: { padding: 24, paddingTop: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  headerTitle: { fontSize: 16, opacity: 0.8 },
  headerAmount: { fontSize: 36, fontWeight: 'bold', marginTop: 8 },
  headerSubtitle: { fontSize: 14, opacity: 0.7, marginTop: 4 },
  debtsCard: { marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  debtsRow: { flexDirection: 'row', alignItems: 'center' },
  debtsLabel: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  debtsValue: { fontSize: 22, fontWeight: 'bold' },
  debtsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  debtsBadgeText: { fontSize: 11, fontWeight: '600' },
  cashAlert: { flexDirection: 'row', alignItems: 'center', margin: 16, marginTop: 12, padding: 14, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cashAlertTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  cashAlertText: { fontSize: 12 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, marginTop: -10 },
  actionButton: { alignItems: 'center' },
  actionIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  actionText: { marginTop: 8, fontSize: 12, fontWeight: '500' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  cardSummary: { width: 170, padding: 14, borderRadius: 16, marginRight: 10, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cardColorBar: { width: 40, height: 4, borderRadius: 2, marginBottom: 8 },
  cardBankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardBankIcon: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  cardBankName: { fontSize: 10 },
  cardCustomName: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  cardUsage: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  cardLimit: { fontSize: 11, marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  cardPct: { fontSize: 11, fontWeight: '600' },
  expenseItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseDescription: { fontSize: 15, fontWeight: '600' },
  expenseCategory: { fontSize: 13, marginTop: 2 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 15, fontWeight: 'bold' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, gap: 3, alignSelf: 'flex-start' },
  paidText: { fontSize: 10, fontWeight: '600' },
  payButton: { marginTop: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  payButtonText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, marginTop: 12 },
  emptyButton: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  emptyButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
