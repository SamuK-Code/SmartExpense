import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { usePlanning } from '../context/PlanningContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { FadeInView, SlideInView, ScaleInView, StaggeredList } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';

export default function PlanningScreen() {
  const { expenses, getFilteredExpenses, getMonthlyTotal, cards, CATEGORIES } = useExpenses();
  const { cashBalance, goals, updateCashBalance, addGoal, updateGoal, deleteGoal, toggleGoalComplete, checkGoalFeasibility, calculateDailyBudget } = usePlanning();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();

  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [cashInput, setCashInput] = useState(cashBalance.toString());
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalCategory, setGoalCategory] = useState(CATEGORIES[0]?.id || 'outros');

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const currentMonthExpenses = getFilteredExpenses('month');
  const totalExpenses = getMonthlyTotal(currentMonthExpenses);
  const remaining = cashBalance - totalExpenses;
  const expensePercent = cashBalance > 0 ? (totalExpenses / cashBalance) * 100 : 0;
  const dailyBudget = calculateDailyBudget(cashBalance, totalExpenses);
  const isCashSufficient = cashBalance >= totalExpenses;

  const handleSaveCash = () => {
    const amount = parseFloat(cashInput.replace(',', '.'));
    if (isNaN(amount) || amount < 0) {
      Alert.alert(t('error'), t('invalidAmount'));
      return;
    }
    updateCashBalance(amount);
    setCashModalVisible(false);
  };

  const openAddGoal = () => {
    setEditingGoal(null);
    setGoalName('');
    setGoalAmount('');
    setGoalCategory(CATEGORIES[0]?.id || 'outros');
    setGoalModalVisible(true);
  };

  const openEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalAmount(goal.amount.toString());
    setGoalCategory(goal.category || (CATEGORIES[0]?.id || 'outros'));
    setGoalModalVisible(true);
  };

  const handleSaveGoal = () => {
    if (!goalName || !goalAmount) {
      Alert.alert(t('error'), t('requiredField'));
      return;
    }
    const amount = parseFloat(goalAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('error'), t('invalidAmount'));
      return;
    }

    const goalData = { name: goalName, amount, category: goalCategory };
    if (editingGoal) updateGoal(editingGoal.id, goalData);
    else addGoal(goalData);
    setGoalModalVisible(false);
  };

  const handleDeleteGoal = (goal) => {
    Alert.alert(t('confirm'), t('delete') + ' "' + goal.name + '"?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteGoal(goal.id) },
    ]);
  };

  const getCategoryInfo = (catId) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[7];

  const renderGoalItem = (goal) => {
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
              <Ionicons name={goal.completed ? "checkmark-circle" : "ellipse-outline"} size={24} color={goal.completed ? colors.success : colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openEditGoal(goal)}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteGoal(goal)}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.goalAnalysis}>
          {!goal.completed && (
            <>
              <View style={[styles.feasibilityBadge, { backgroundColor: feasibility.severity === 'success' ? colors.success + '20' : feasibility.severity === 'warning' ? colors.warning + '20' : colors.danger + '20' }]}>
                <Ionicons name={feasibility.severity === 'success' ? "checkmark-circle" : feasibility.severity === 'warning' ? "alert-circle" : "close-circle"} size={14} color={feasibility.severity === 'success' ? colors.success : feasibility.severity === 'warning' ? colors.warning : colors.danger} />
                <Text style={[styles.feasibilityText, { color: feasibility.severity === 'success' ? colors.success : feasibility.severity === 'warning' ? colors.warning : colors.danger }]}>
                  {feasibility.reason}
                </Text>
              </View>
              {canBuyNow && (
                <View style={[styles.buyNowBadge, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="checkmark" size={14} color={colors.success} />
                  <Text style={[styles.buyNowText, { color: colors.success }]}>{t('canBuyNow')}</Text>
                </View>
              )}
              {!canBuyNow && goal.amount > cashBalance && (
                <View style={[styles.buyNowBadge, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="time-outline" size={14} color={colors.warning} />
                  <Text style={[styles.buyNowText, { color: colors.warning }]}>{t('missing')} {formatCurrency(goal.amount - cashBalance)}</Text>
                </View>
              )}
            </>
          )}
          {goal.completed && (
            <View style={[styles.completedBadge, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="checkmark-done" size={14} color={colors.success} />
              <Text style={[styles.completedText, { color: colors.success }]}>{t('purchaseMade')}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('planning')} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cash Balance Card */}
        <FadeInView>
          <TouchableOpacity style={[styles.cashCard, { backgroundColor: colors.card }]} onPress={() => setCashModalVisible(true)}>
            <View style={styles.cashRow}>
              <View>
                <Text style={[styles.cashLabel, { color: colors.textSecondary }]}>{t('availableCash')}</Text>
                <Text style={[styles.cashValue, { color: colors.text }]}>{formatCurrency(cashBalance)}</Text>
              </View>
              <View style={[styles.cashIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="cash-outline" size={24} color={colors.success} />
              </View>
            </View>
            <Text style={[styles.cashHint, { color: colors.textSecondary }]}>{t('tapToUpdate')}</Text>
          </TouchableOpacity>
        </FadeInView>

        {/* Budget Overview */}
        <SlideInView delay={100}>
          <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.budgetTitle, { color: colors.text }]}>{t('cashStatus')}</Text>
            <View style={styles.budgetRow}>
              <View style={styles.budgetItem}>
                <Text style={[styles.budgetItemLabel, { color: colors.textSecondary }]}>{t('availableCash')}</Text>
                <Text style={[styles.budgetItemValue, { color: colors.text }]}>{formatCurrency(cashBalance)}</Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={[styles.budgetItemLabel, { color: colors.textSecondary }]}>{t('monthlyExpenses')}</Text>
                <Text style={[styles.budgetItemValue, { color: colors.danger }]}>{formatCurrency(totalExpenses)}</Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={[styles.budgetItemLabel, { color: colors.textSecondary }]}>{t('remaining')}</Text>
                <Text style={[styles.budgetItemValue, { color: remaining >= 0 ? colors.primary : colors.danger }]}>{formatCurrency(remaining)}</Text>
              </View>
            </View>
            <View style={styles.budgetProgressContainer}>
              <View style={[styles.budgetProgressBar, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]}>
                <View style={[styles.budgetProgressFill, { width: `${Math.min(expensePercent, 100)}%`, backgroundColor: expensePercent >= 100 ? colors.danger : expensePercent >= 80 ? colors.warning : colors.primary }]} />
              </View>
              <Text style={[styles.budgetProgressText, { color: expensePercent >= 100 ? colors.danger : expensePercent >= 80 ? colors.warning : colors.primary }]}>
                {expensePercent.toFixed(1)}% {t('cashCommitted')}
              </Text>
            </View>

            {!isCashSufficient && cashBalance > 0 && (
              <View style={[styles.insufficientAlert, { backgroundColor: colors.danger + '20' }]}>
                <Ionicons name="warning" size={16} color={colors.danger} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={[styles.insufficientTitle, { color: colors.danger }]}>{t('insufficientCash')}</Text>
                  <Text style={[styles.insufficientText, { color: colors.danger }]}>{t('missing')} {formatCurrency(totalExpenses - cashBalance)}</Text>
                </View>
              </View>
            )}
            {cashBalance <= 0 && (
              <View style={[styles.insufficientAlert, { backgroundColor: colors.warning + '20' }]}>
                <Ionicons name="cash-outline" size={16} color={colors.warning} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={[styles.insufficientTitle, { color: colors.warning }]}>{t('noCash')}</Text>
                </View>
              </View>
            )}
          </View>
        </SlideInView>

        {/* Daily Budget */}
        {remaining > 0 && (
          <SlideInView delay={200}>
            <View style={[styles.dailyBudgetCard, { backgroundColor: colors.card }]}>
              <View style={styles.dailyBudgetHeader}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={[styles.dailyBudgetTitle, { color: colors.text }]}>{t('dailyBudget')}</Text>
              </View>
              <View style={styles.dailyBudgetRow}>
                <View style={styles.dailyBudgetItem}>
                  <Text style={[styles.dailyBudgetValue, { color: colors.text }]}>{formatCurrency(dailyBudget.daily)}</Text>
                  <Text style={[styles.dailyBudgetLabel, { color: colors.textSecondary }]}>{t('perDay')}</Text>
                </View>
                <View style={styles.dailyBudgetItem}>
                  <Text style={[styles.dailyBudgetValue, { color: colors.text }]}>{formatCurrency(dailyBudget.weekly)}</Text>
                  <Text style={[styles.dailyBudgetLabel, { color: colors.textSecondary }]}>{t('perWeek')}</Text>
                </View>
              </View>
            </View>
          </SlideInView>
        )}

        {/* Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('goals')}</Text>
            <TouchableOpacity style={[styles.addGoalButton, { backgroundColor: colors.primary }]} onPress={openAddGoal}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View style={styles.emptyGoals}>
              <Ionicons name="flag-outline" size={48} color={colors.textLight} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noGoals')}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t('addFirstGoal')}</Text>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={openAddGoal}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addButtonText}>{t('addGoal')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <StaggeredList staggerDelay={80}>
              {goals.map((goal, index) => (
                <SlideInView key={goal.id} delay={index * 80}>
                  {renderGoalItem(goal)}
                </SlideInView>
              ))}
            </StaggeredList>
          )}
        </View>
      </ScrollView>

      {/* Cash Modal */}
      <Modal visible={cashModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScaleInView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('availableCash')}</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{t('howMuchCash')}</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                keyboardType="numeric"
                value={cashInput}
                onChangeText={setCashInput}
                placeholder="0,00"
                placeholderTextColor={colors.textLight}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setCashModalVisible(false)}>
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSaveCash}>
                  <Text style={styles.modalButtonText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScaleInView>
        </View>
      </Modal>

      {/* Goal Modal */}
      <Modal visible={goalModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <ScaleInView>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingGoal ? t('editGoal') : t('newGoal')}
                </Text>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('whatToBuy')}</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                  value={goalName}
                  onChangeText={setGoalName}
                  placeholder={t('goalName')}
                  placeholderTextColor={colors.textLight}
                />
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('totalValue')}</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                  value={goalAmount}
                  onChangeText={setGoalAmount}
                  keyboardType="numeric"
                  placeholder="0,00"
                  placeholderTextColor={colors.textLight}
                />
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('category')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryOption, { backgroundColor: goalCategory === cat.id ? cat.color + '25' : colors.inputBg, borderColor: goalCategory === cat.id ? cat.color : 'transparent' }]}
                      onPress={() => setGoalCategory(cat.id)}
                    >
                      <Ionicons name={cat.icon} size={16} color={cat.color} />
                      <Text style={[styles.categoryOptionText, { color: goalCategory === cat.id ? cat.color : colors.textSecondary }]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setGoalModalVisible(false)}>
                    <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSaveGoal}>
                    <Text style={styles.modalButtonText}>{t('save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScaleInView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  cashCard: { margin: 16, padding: 20, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cashRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cashLabel: { fontSize: 14, marginBottom: 4 },
  cashValue: { fontSize: 28, fontWeight: 'bold' },
  cashIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cashHint: { fontSize: 12, marginTop: 8, textAlign: 'right' },
  budgetCard: { marginHorizontal: 16, marginBottom: 12, padding: 20, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  budgetTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetItem: { alignItems: 'center', flex: 1 },
  budgetItemLabel: { fontSize: 12, marginBottom: 4 },
  budgetItemValue: { fontSize: 16, fontWeight: 'bold' },
  budgetProgressContainer: { marginTop: 16 },
  budgetProgressBar: { height: 10, borderRadius: 5, overflow: 'hidden' },
  budgetProgressFill: { height: '100%', borderRadius: 5 },
  budgetProgressText: { fontSize: 12, marginTop: 6, textAlign: 'center' },
  insufficientAlert: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginTop: 12 },
  insufficientTitle: { fontSize: 13, fontWeight: 'bold' },
  insufficientText: { fontSize: 12, marginTop: 2 },
  dailyBudgetCard: { marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  dailyBudgetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dailyBudgetTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  dailyBudgetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dailyBudgetItem: { alignItems: 'center', flex: 1 },
  dailyBudgetValue: { fontSize: 16, fontWeight: 'bold' },
  dailyBudgetLabel: { fontSize: 12, marginTop: 4 },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  addGoalButton: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  goalCard: { marginBottom: 12, padding: 16, borderRadius: 18, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  goalTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  goalCategoryIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  goalTitleInfo: { flex: 1 },
  goalName: { fontSize: 15, fontWeight: 'bold' },
  goalAmount: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  goalActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalAnalysis: { marginTop: 12 },
  feasibilityBadge: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 6 },
  feasibilityText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  buyNowBadge: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 },
  buyNowText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
  completedText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 340, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalInput: { borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 14 },
  categoryScroll: { marginBottom: 16 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  categoryOptionText: { marginLeft: 6, fontSize: 12 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyGoals: { alignItems: 'center', padding: 40, paddingTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubtitle: { fontSize: 13, marginTop: 6, textAlign: 'center' },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 12, gap: 6 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
