import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { usePlanning } from '../context/PlanningContext';
import { useTheme } from '../context/ThemeContext';
import { FadeInView, SlideInView, ScaleInView, StaggeredList } from '../components/AnimatedComponents';
import AlertPopup from '../components/AlertPopup';
import PeriodFilter from '../components/PeriodFilter';
import { getBankById } from '../utils/BanksData';

export default function HomeScreen({ navigation }) {
  const { expenses, cards, alerts, dismissAlert, getFilteredExpenses, getMonthlyTotal, CATEGORIES } = useExpenses();
  const { cashBalance } = usePlanning();
  const { colors, isDark } = useTheme();
  const [period, setPeriod] = useState('month');
  const [activeAlert, setActiveAlert] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const filteredExpenses = getFilteredExpenses(period);
  const monthlyTotal = getMonthlyTotal(filteredExpenses);
  const recentExpenses = filteredExpenses.slice(0, 5);

  // Check if cash is insufficient for expenses
  const isCashInsufficient = cashBalance > 0 && cashBalance < monthlyTotal;
  const cashDeficit = monthlyTotal - cashBalance;

  useEffect(() => {
    if (alerts.length > 0) {
      const dangerAlert = alerts.find(a => a.type === 'danger');
      const warningAlert = alerts.find(a => a.type === 'warning');
      const alertToShow = dangerAlert || warningAlert || alerts[0];
      if (alertToShow) { setActiveAlert(alertToShow); setShowAlertModal(true); }
    }
  }, [alerts]);

  const getCategoryInfo = (categoryId) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[7];
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR');

  const handleDismissAlert = () => { if (activeAlert) dismissAlert(activeAlert.id); setShowAlertModal(false); setActiveAlert(null); };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cash Balance Header */}
        <FadeInView>
          <View style={[styles.headerCard, { backgroundColor: colors.header }]}>
            <Text style={[styles.headerTitle, { color: colors.headerText }]}>Valor em Caixa</Text>
            <Text style={[styles.headerAmount, { color: colors.headerText }]}>{formatCurrency(cashBalance)}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.headerText }]}>
              {filteredExpenses.length} {filteredExpenses.length === 1 ? 'transacao' : 'transacoes'} no periodo
            </Text>
          </View>
        </FadeInView>

        {/* Insufficient Cash Alert */}
        {isCashInsufficient && (
          <SlideInView delay={50}>
            <View style={[styles.cashAlert, { backgroundColor: colors.danger + '20' }]}>
              <Ionicons name="warning" size={20} color={colors.danger} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.cashAlertTitle, { color: colors.danger }]}>Caixa Insuficiente!</Text>
                <Text style={[styles.cashAlertText, { color: colors.danger }]}>
                  Gastos de {formatCurrency(monthlyTotal)} ultrapassam o caixa de {formatCurrency(cashBalance)}. Faltam {formatCurrency(cashDeficit)}.
                </Text>
              </View>
            </View>
          </SlideInView>
        )}

        {cashBalance <= 0 && (
          <SlideInView delay={50}>
            <View style={[styles.cashAlert, { backgroundColor: colors.danger + '20' }]}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.cashAlertTitle, { color: colors.danger }]}>Sem Dinheiro em Caixa!</Text>
                <Text style={[styles.cashAlertText, { color: colors.danger }]}>
                  Adicione seu valor em caixa para acompanhar seus gastos.
                </Text>
              </View>
            </View>
          </SlideInView>
        )}

        {/* Period Filter */}
        <PeriodFilter selected={period} onSelect={setPeriod} />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <StaggeredList staggerDelay={100} baseDelay={200}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AddExpense')}>
              <ScaleInView><View style={[styles.actionIcon, { backgroundColor: colors.primary }]}><Ionicons name="add" size={24} color="#fff" /></View></ScaleInView>
              <Text style={[styles.actionText, { color: colors.text }]}>Novo Gasto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Gráficos')}>
              <ScaleInView><View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}><Ionicons name="pie-chart" size={24} color="#fff" /></View></ScaleInView>
              <Text style={[styles.actionText, { color: colors.text }]}>Análise</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Cartões')}>
              <ScaleInView><View style={[styles.actionIcon, { backgroundColor: colors.info }]}><Ionicons name="card" size={24} color="#fff" /></View></ScaleInView>
              <Text style={[styles.actionText, { color: colors.text }]}>Cartões</Text>
            </TouchableOpacity>
          </StaggeredList>
        </View>

        {/* Cards Summary */}
        {cards.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumo dos Cartões</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <StaggeredList staggerDelay={80}>
                {cards.map(card => {
                  const cardUsage = expenses.filter(e => e.cardId === card.id).reduce((sum, e) => sum + parseFloat(e.amount), 0);
                  const pct = card.limit > 0 ? (cardUsage / card.limit) * 100 : 0;
                  const bank = getBankById(card.bankId);
                  return (
                    <View key={card.id} style={[styles.cardSummary, { backgroundColor: colors.card, borderColor: card.color }]}>
                      <View style={[styles.cardColorBar, { backgroundColor: card.color }]} />
                      <View style={styles.cardBankRow}>
                        <View style={[styles.cardBankIcon, { backgroundColor: (bank?.color || card.color) + '20' }]}>
                          <Ionicons name={bank?.icon || 'card'} size={16} color={bank?.color || card.color} />
                        </View>
                        <Text style={[styles.cardBankName, { color: colors.textSecondary }]}>{bank?.name || card.name}</Text>
                      </View>
                      <Text style={[styles.cardCustomName, { color: colors.text }]}>{card.customName || card.name}</Text>
                      <Text style={[styles.cardUsage, { color: colors.text }]}>{formatCurrency(cardUsage)}</Text>
                      <Text style={[styles.cardLimit, { color: colors.textSecondary }]}>Limite: {formatCurrency(card.limit)}</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 100 ? colors.danger : pct >= 80 ? colors.warning : colors.primary }]} />
                      </View>
                      <Text style={[styles.cardPct, { color: pct >= 100 ? colors.danger : pct >= 80 ? colors.warning : colors.primary }]}>{pct.toFixed(0)}% usado</Text>
                    </View>
                  );
                })}
              </StaggeredList>
            </ScrollView>
          </View>
        )}

        {/* Recent Expenses */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Gastos Recentes</Text>
          {recentExpenses.length === 0 ? (
            <ScaleInView>
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum gasto registrado</Text>
                <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AddExpense')}>
                  <Text style={styles.emptyButtonText}>Adicionar primeiro gasto</Text>
                </TouchableOpacity>
              </View>
            </ScaleInView>
          ) : (
            <StaggeredList staggerDelay={80}>
              {recentExpenses.map((expense) => {
                const category = getCategoryInfo(expense.category);
                const card = cards.find(c => c.id === expense.cardId);
                const bank = card ? getBankById(card.bankId) : null;
                return (
                  <TouchableOpacity key={expense.id} style={[styles.expenseItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('EditExpense', { expenseId: expense.id })}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color + (isDark ? '30' : '20') }]}>
                      <Ionicons name={category.icon} size={20} color={category.color} />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={[styles.expenseDescription, { color: colors.text }]}>{expense.description}</Text>
                      <Text style={[styles.expenseCategory, { color: colors.textSecondary }]}>
                        {category.name} {card ? `• ${bank?.name || card.name}` : ''}
                      </Text>
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={[styles.expenseAmount, { color: colors.danger }]}>{formatCurrency(parseFloat(expense.amount))}</Text>
                      <Text style={[styles.expenseDate, { color: colors.textLight }]}>{formatDate(expense.date)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </StaggeredList>
          )}
        </View>
      </ScrollView>

      <AlertPopup visible={showAlertModal} alert={activeAlert} onDismiss={handleDismissAlert} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCard: { padding: 24, paddingTop: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  headerTitle: { fontSize: 16, opacity: 0.8 },
  headerAmount: { fontSize: 36, fontWeight: 'bold', marginTop: 8 },
  headerSubtitle: { fontSize: 14, opacity: 0.7, marginTop: 4 },
  cashAlert: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, marginTop: 12, padding: 14, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
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
  expenseDate: { fontSize: 12, marginTop: 2 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, marginTop: 12 },
  emptyButton: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  emptyButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
