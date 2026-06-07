import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { usePlanning } from '../context/PlanningContext';
import { useTheme } from '../context/ThemeContext';
import { FadeInView, SlideInView, ScaleInView, StaggeredList } from '../components/AnimatedComponents';
import { getBankById } from '../utils/BanksData';

export default function PlanningScreen() {
  const { expenses, getFilteredExpenses, getMonthlyTotal, cards, CATEGORIES } = useExpenses();
  const { cashBalance, goals, updateCashBalance, addGoal, updateGoal, deleteGoal, toggleGoalComplete, checkGoalFeasibility, calculateDailyBudget } = usePlanning();
  const { colors, isDark } = useTheme();

  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [cashInput, setCashInput] = useState(cashBalance.toString());
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalCategory, setGoalCategory] = useState('outros');

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Calculate current month expenses
  const currentMonthExpenses = getFilteredExpenses('month');
  const totalExpenses = getMonthlyTotal(currentMonthExpenses);
  const remaining = cashBalance - totalExpenses;
  const expensePercent = cashBalance > 0 ? (totalExpenses / cashBalance) * 100 : 0;

  // Daily budget calculation
  const dailyBudget = calculateDailyBudget(cashBalance, totalExpenses);

  // Check if cash is sufficient for all expenses
  const isCashSufficient = cashBalance >= totalExpenses;

  const handleSaveCash = () => {
    const amount = parseFloat(cashInput.replace(',', '.'));
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Erro', 'Digite um valor valido');
      return;
    }
    updateCashBalance(amount);
    setCashModalVisible(false);
  };

  const openAddGoal = () => {
    setEditingGoal(null);
    setGoalName('');
    setGoalAmount('');
    setGoalCategory('outros');
    setGoalModalVisible(true);
  };

  const openEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalAmount(goal.amount.toString());
    setGoalCategory(goal.category || 'outros');
    setGoalModalVisible(true);
  };

  const handleSaveGoal = () => {
    if (!goalName || !goalAmount) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    const amount = parseFloat(goalAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erro', 'Valor invalido');
      return;
    }

    const goalData = { name: goalName, amount, category: goalCategory };
    if (editingGoal) updateGoal(editingGoal.id, goalData);
    else addGoal(goalData);
    setGoalModalVisible(false);
  };

  const handleDeleteGoal = (goal) => {
    Alert.alert('Confirmar', `Excluir "${goal.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteGoal(goal.id) },
    ]);
  };

  const getCategoryInfo = (catId) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[7];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.header }]}>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>Planejamento</Text>
          <TouchableOpacity style={styles.cashButton} onPress={() => setCashModalVisible(true)}>
            <Ionicons name="wallet-outline" size={20} color={colors.headerText} />
          </TouchableOpacity>
        </View>

        {/* Cash Balance Card */}
        <FadeInView>
          <TouchableOpacity style={[styles.cashCard, { backgroundColor: colors.card }]} onPress={() => setCashModalVisible(true)}>
            <View style={styles.cashRow}>
              <View>
                <Text style={[styles.cashLabel, { color: colors.textSecondary }]}>Valor em Caixa</Text>
                <Text style={[styles.cashValue, { color: colors.text }]}>{formatCurrency(cashBalance)}</Text>
              </View>
              <View style={[styles.cashIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="cash" size={24} color={colors.primary} />
              </View>
            </View>
            <Text style={[styles.cashHint, { color: colors.textLight }]}>Toque para atualizar</Text>
          </TouchableOpacity>
        </FadeInView>

        {/* Budget Overview */}
        <SlideInView delay={100}>
          <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.budgetTitle, { color: colors.text }]}>Situacao do Caixa</Text>

            <View style={styles.budgetRow}>
              <View style={styles.budgetItem}>
                <Text style={[styles.budgetItemLabel, { color: colors.textSecondary }]}>Em Caixa</Text>
                <Text style={[styles.budgetItemValue, { color: colors.primary }]}>{formatCurrency(cashBalance)}</Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={[styles.budgetItemLabel, { color: colors.textSecondary }]}>Gastos Mes</Text>
                <Text style={[styles.budgetItemValue, { color: colors.danger }]}>{formatCurrency(totalExpenses)}</Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={[styles.budgetItemLabel, { color: colors.textSecondary }]}>Sobra</Text>
                <Text style={[styles.budgetItemValue, { color: remaining >= 0 ? colors.primary : colors.danger }]}>
                  {formatCurrency(remaining)}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.budgetProgressContainer}>
              <View style={[styles.budgetProgressBar, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]}>
                <View style={[styles.budgetProgressFill, {
                  width: `${Math.min(expensePercent, 100)}%`,
                  backgroundColor: expensePercent >= 100 ? colors.danger : expensePercent >= 80 ? colors.warning : colors.primary,
                }]} />
              </View>
              <Text style={[styles.budgetProgressText, { color: colors.textSecondary }]}>
                {expensePercent.toFixed(1)}% do caixa comprometido
              </Text>
            </View>

            {/* Insufficient Cash Alert */}
            {!isCashSufficient && cashBalance > 0 && (
              <View style={[styles.insufficientAlert, { backgroundColor: colors.danger + '20' }]}>
                <Ionicons name="warning" size={16} color={colors.danger} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={[styles.insufficientTitle, { color: colors.danger }]}>Caixa Insuficiente!</Text>
                  <Text style={[styles.insufficientText, { color: colors.danger }]}>
                    Faltam {formatCurrency(totalExpenses - cashBalance)} para cobrir os gastos
                  </Text>
                </View>
              </View>
            )}
            {cashBalance <= 0 && (
              <View style={[styles.insufficientAlert, { backgroundColor: colors.danger + '20' }]}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={[styles.insufficientTitle, { color: colors.danger }]}>Sem dinheiro em caixa!</Text>
              </View>
            )}
          </View>
        </SlideInView>

        {/* Daily Budget */}
        {remaining > 0 && (
          <SlideInView delay={150}>
            <View style={[styles.dailyBudgetCard, { backgroundColor: colors.card }]}>
              <View style={styles.dailyBudgetHeader}>
                <Ionicons name="trending-up" size={20} color={colors.info} />
                <Text style={[styles.dailyBudgetTitle, { color: colors.text }]}>Margem Diaria</Text>
              </View>
              <View style={styles.dailyBudgetRow}>
                <View style={styles.dailyBudgetItem}>
                  <Text style={[styles.dailyBudgetValue, { color: colors.primary }]}>{formatCurrency(dailyBudget.daily)}</Text>
                  <Text style={[styles.dailyBudgetLabel, { color: colors.textSecondary }]}>por dia</Text>
                </View>
                <View style={styles.dailyBudgetItem}>
                  <Text style={[styles.dailyBudgetValue, { color: colors.primary }]}>{formatCurrency(dailyBudget.weekly)}</Text>
                  <Text style={[styles.dailyBudgetLabel, { color: colors.textSecondary }]}>por semana</Text>
                </View>
              </View>
            </View>
          </SlideInView>
        )}

        {/* Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Metas e Compras</Text>
            <TouchableOpacity style={[styles.addGoalButton, { backgroundColor: colors.primary }]} onPress={openAddGoal}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <FadeInView>
              <View style={styles.emptyState}>
                <Ionicons name="flag-outline" size={48} color={colors.textLight} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma meta cadastrada</Text>
                <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={openAddGoal}>
                  <Text style={styles.emptyButtonText}>Adicionar primeira meta</Text>
                </TouchableOpacity>
              </View>
            </FadeInView>
          ) : (
            <StaggeredList staggerDelay={80}>
              {goals.map(goal => {
                const feasibility = checkGoalFeasibility(goal.amount, cashBalance, totalExpenses);
                const category = getCategoryInfo(goal.category);
                const canBuyNow = goal.amount <= cashBalance && feasibility.feasible;

                return (
                  <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.card, borderLeftColor: category.color }]}>
                    <View style={styles.goalHeader}>
                      <View style={styles.goalTitleRow}>
                        <View style={[styles.goalCategoryIcon, { backgroundColor: category.color + '20' }]}>
                          <Ionicons name={category.icon} size={18} color={category.color} />
                        </View>
                        <View style={styles.goalTitleInfo}>
                          <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                          <Text style={[styles.goalAmount, { color: colors.text }]}>{formatCurrency(goal.amount)}</Text>
                        </View>
                      </View>
                      <View style={styles.goalActions}>
                        <TouchableOpacity onPress={() => toggleGoalComplete(goal.id)}>
                          <Ionicons name={goal.completed ? "checkbox" : "square-outline"} size={22} color={goal.completed ? colors.primary : colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openEditGoal(goal)}>
                          <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteGoal(goal)}>
                          <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {!goal.completed && (
                      <View style={styles.goalAnalysis}>
                        {/* Feasibility badge */}
                        <View style={[styles.feasibilityBadge, {
                          backgroundColor: feasibility.severity === 'success' ? colors.primary + '20' : 
                                          feasibility.severity === 'warning' ? colors.warning + '20' : colors.danger + '20'
                        }]}>
                          <Ionicons 
                            name={feasibility.severity === 'success' ? "checkmark-circle" : 
                                  feasibility.severity === 'warning' ? "alert-circle" : "close-circle"} 
                            size={14} 
                            color={feasibility.severity === 'success' ? colors.primary : 
                                   feasibility.severity === 'warning' ? colors.warning : colors.danger} 
                          />
                          <Text style={[styles.feasibilityText, {
                            color: feasibility.severity === 'success' ? colors.primary : 
                                   feasibility.severity === 'warning' ? colors.warning : colors.danger
                          }]}>
                            {feasibility.reason}
                          </Text>
                        </View>

                        {/* Can buy now indicator */}
                        {canBuyNow && (
                          <View style={[styles.buyNowBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="cart" size={14} color={colors.primary} />
                            <Text style={[styles.buyNowText, { color: colors.primary }]}>
                              Pode comprar agora! Caixa cobre
                            </Text>
                          </View>
                        )}
                        {!canBuyNow && goal.amount > cashBalance && (
                          <View style={[styles.buyNowBadge, { backgroundColor: colors.danger + '20' }]}>
                            <Ionicons name="time" size={14} color={colors.danger} />
                            <Text style={[styles.buyNowText, { color: colors.danger }]}>
                              Faltam {formatCurrency(goal.amount - cashBalance)} em caixa
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {goal.completed && (
                      <View style={[styles.completedBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="checkmark-done" size={14} color={colors.primary} />
                        <Text style={[styles.completedText, { color: colors.primary }]}>Compra realizada!</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </StaggeredList>
          )}
        </View>
      </ScrollView>

      {/* Cash Modal */}
      <Modal visible={cashModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScaleInView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Valor em Caixa</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Quanto dinheiro voce tem disponivel agora?
              </Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="R$ 5.000,00"
                keyboardType="decimal-pad"
                value={cashInput}
                onChangeText={setCashInput}
                placeholderTextColor={colors.textLight}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setCashModalVisible(false)}>
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSaveCash}>
                  <Text style={styles.modalButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScaleInView>
        </View>
      </Modal>

      {/* Goal Modal */}
      <Modal visible={goalModalVisible} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScaleInView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingGoal ? 'Editar Meta' : 'Nova Meta'}
              </Text>

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>O que quer comprar/fazer?</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="Ex: Viagem para SP"
                value={goalName}
                onChangeText={setGoalName}
                placeholderTextColor={colors.textLight}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Valor total</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="R$ 2.000,00"
                keyboardType="decimal-pad"
                value={goalAmount}
                onChangeText={setGoalAmount}
                placeholderTextColor={colors.textLight}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      goalCategory === cat.id && {
                        backgroundColor: cat.color + (isDark ? '30' : '20'),
                        borderColor: cat.color,
                        borderWidth: 2,
                      },
                      { backgroundColor: colors.inputBg },
                    ]}
                    onPress={() => setGoalCategory(cat.id)}
                  >
                    <Ionicons name={cat.icon} size={16} color={cat.color} />
                    <Text style={[styles.categoryOptionText, { color: colors.text }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setGoalModalVisible(false)}>
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSaveGoal}>
                  <Text style={styles.modalButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScaleInView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 50,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  cashButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  cashCard: {
    margin: 16, padding: 20, borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  cashRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cashLabel: { fontSize: 14, marginBottom: 4 },
  cashValue: { fontSize: 28, fontWeight: 'bold' },
  cashIcon: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  cashHint: { fontSize: 12, marginTop: 8, textAlign: 'right' },
  budgetCard: {
    marginHorizontal: 16, marginBottom: 12, padding: 20, borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  budgetTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetItem: { alignItems: 'center', flex: 1 },
  budgetItemLabel: { fontSize: 12, marginBottom: 4 },
  budgetItemValue: { fontSize: 16, fontWeight: 'bold' },
  budgetProgressContainer: { marginTop: 16 },
  budgetProgressBar: {
    height: 10, borderRadius: 5, overflow: 'hidden',
  },
  budgetProgressFill: { height: '100%', borderRadius: 5 },
  budgetProgressText: { fontSize: 12, marginTop: 6, textAlign: 'center' },
  insufficientAlert: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 10, marginTop: 12,
  },
  insufficientTitle: { fontSize: 13, fontWeight: 'bold' },
  insufficientText: { fontSize: 12, marginTop: 2 },
  dailyBudgetCard: {
    marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  dailyBudgetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dailyBudgetTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  dailyBudgetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dailyBudgetItem: { alignItems: 'center', flex: 1 },
  dailyBudgetValue: { fontSize: 16, fontWeight: 'bold' },
  dailyBudgetLabel: { fontSize: 12, marginTop: 4 },
  section: { padding: 16 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  addGoalButton: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  goalCard: {
    marginBottom: 12, padding: 16, borderRadius: 18,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  goalTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  goalCategoryIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  goalTitleInfo: { flex: 1 },
  goalName: { fontSize: 15, fontWeight: 'bold' },
  goalAmount: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  goalActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalAnalysis: { marginTop: 12 },
  feasibilityBadge: {
    flexDirection: 'row', alignItems: 'center',
    padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 6,
  },
  feasibilityText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  buyNowBadge: {
    flexDirection: 'row', alignItems: 'center',
    padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4,
  },
  buyNowText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  completedBadge: {
    flexDirection: 'row', alignItems: 'center',
    padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8,
  },
  completedText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, marginTop: 12 },
  emptyButton: {
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10,
  },
  emptyButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalContent: {
    width: '100%', maxWidth: 340, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalInput: {
    borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 14,
  },
  categoryScroll: { marginBottom: 16 },
  categoryOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, marginRight: 8,
    borderWidth: 1, borderColor: 'transparent',
  },
  categoryOptionText: { marginLeft: 6, fontSize: 12 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalButton: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
  },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
