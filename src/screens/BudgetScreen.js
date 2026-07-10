// BudgetScreen.js — Orçamento por Categoria com Progresso Visual

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Dimensions,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import Toast from '../components/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BudgetScreen = () => {
  const navigation = useNavigation();
  const {
    categories,
    budgets,
    setCategoryBudget,
    removeCategoryBudget,
    getCategorySpending,
    transactions,
  } = useApp();
  const { colors, darkMode } = useTheme();
  const { t } = useTranslate();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const currentMonth = new Date().toISOString().slice(0, 7);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  // Dados de orçamento com cálculos
  const budgetData = useMemo(() => {
    return categories.map(cat => {
      const budget = budgets[cat.id] || 0;
      const spent = getCategorySpending(cat.id, currentMonth);
      const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
      const remaining = Math.max(budget - spent, 0);
      const isOver = spent > budget && budget > 0;

      return {
        ...cat,
        budget,
        spent,
        percentage,
        remaining,
        isOver,
        hasBudget: budget > 0,
      };
    }).sort((a, b) => {
      // Ordenar: com orçamento primeiro, depois por porcentagem (mais crítico primeiro)
      if (a.hasBudget && !b.hasBudget) return -1;
      if (!a.hasBudget && b.hasBudget) return 1;
      return b.percentage - a.percentage;
    });
  }, [categories, budgets, getCategorySpending, currentMonth, transactions]);

  // Resumo geral
  const summary = useMemo(() => {
    const totalBudget = budgetData.reduce((s, b) => s + b.budget, 0);
    const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);
    const totalRemaining = Math.max(totalBudget - totalSpent, 0);
    const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    return { totalBudget, totalSpent, totalRemaining, overallPercentage };
  }, [budgetData]);

  const getProgressColor = (percentage, isOver) => {
    if (isOver) return colors.danger;
    if (percentage >= 90) return colors.danger;
    if (percentage >= 75) return colors.warning;
    return colors.success;
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setBudgetAmount(category.budget > 0 ? category.budget.toString() : '');
    setModalVisible(true);
  };

  const handleSaveBudget = () => {
    const amount = parseFloat(budgetAmount.replace(',', '.'));
    if (isNaN(amount) || amount < 0) {
      showToast('Valor inválido', 'error');
      return;
    }
    if (amount === 0) {
      removeCategoryBudget(selectedCategory.id);
      showToast('Orçamento removido', 'warning');
    } else {
      setCategoryBudget(selectedCategory.id, amount);
      showToast('Orçamento definido', 'success');
    }
    setModalVisible(false);
    setSelectedCategory(null);
    setBudgetAmount('');
  };

  const handleDeleteBudget = () => {
    Alert.alert(
      'Remover Orçamento',
      `Deseja remover o orçamento de ${selectedCategory.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            removeCategoryBudget(selectedCategory.id);
            setModalVisible(false);
            setSelectedCategory(null);
            setBudgetAmount('');
            showToast('Orçamento removido', 'warning');
          },
        },
      ]
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            <Ionicons name="wallet" size={20} color={colors.primary} />  Orçamentos
          </Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card de Resumo Geral */}
        <View style={[styles.summaryCard, { backgroundColor: colors.bgCard }]}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Resumo do Mês</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Orçado</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{formatCurrency(summary.totalBudget)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Gasto</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>{formatCurrency(summary.totalSpent)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Restante</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{formatCurrency(summary.totalRemaining)}</Text>
            </View>
          </View>
          {/* Barra geral */}
          <View style={styles.summaryProgressContainer}>
            <View style={[styles.summaryProgressTrack, { backgroundColor: darkMode ? colors.bgTertiary : colors.border }]}>
              <View style={[styles.summaryProgressFill, {
                width: `${Math.min(summary.overallPercentage, 100)}%`,
                backgroundColor: summary.overallPercentage >= 90 ? colors.danger : summary.overallPercentage >= 75 ? colors.warning : colors.success,
              }]} />
            </View>
            <Text style={[styles.summaryPercent, {
              color: summary.overallPercentage >= 90 ? colors.danger : summary.overallPercentage >= 75 ? colors.warning : colors.success,
            }]}>
              {summary.overallPercentage.toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Lista de Categorias */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CATEGORIAS</Text>

        {budgetData.map((item) => {
          const progressColor = getProgressColor(item.percentage, item.isOver);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.budgetItem, { backgroundColor: colors.bgCard }]}
              onPress={() => openEditModal(item)}
              activeOpacity={0.85}
            >
              <View style={styles.budgetItemTop}>
                <View style={styles.budgetItemLeft}>
                  <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View>
                    <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.categoryMeta, { color: colors.textMuted }]}>
                      {item.hasBudget
                        ? `${formatCurrency(item.spent)} / ${formatCurrency(item.budget)}`
                        : `${formatCurrency(item.spent)} gasto`}
                    </Text>
                  </View>
                </View>
                <View style={styles.budgetItemRight}>
                  {item.hasBudget && (
                    <Text style={[styles.percentText, { color: progressColor }]}>
                      {item.isOver ? `+${((item.spent / item.budget - 1) * 100).toFixed(0)}%` : `${item.percentage.toFixed(0)}%`}
                    </Text>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              </View>

              {/* Barra de progresso */}
              {item.hasBudget && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressTrack, { backgroundColor: darkMode ? colors.bgTertiary : colors.border }]}>
                    <View style={[styles.progressFill, {
                      width: `${Math.min(item.percentage, 100)}%`,
                      backgroundColor: progressColor,
                    }]} />
                  </View>
                  {item.isOver && (
                    <View style={[styles.overBadge, { backgroundColor: colors.danger + '15' }]}>
                      <Ionicons name="alert-circle" size={12} color={colors.danger} />
                      <Text style={[styles.overText, { color: colors.danger }]}>Estourado</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Sem orçamento definido */}
              {!item.hasBudget && item.spent > 0 && (
                <View style={[styles.noBudgetBadge, { backgroundColor: colors.warning + '15' }]}>
                  <Ionicons name="information-circle" size={12} color={colors.warning} />
                  <Text style={[styles.noBudgetText, { color: colors.warning }]}>Sem orçamento definido</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Edição */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="wallet" size={20} color={colors.primary} />  {selectedCategory?.name}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedCategory && (
              <View style={styles.modalBody}>
                {/* Info atual */}
                <View style={[styles.currentInfo, { backgroundColor: darkMode ? colors.bgTertiary : colors.bgTertiary }]}>
                  <Text style={[styles.currentLabel, { color: colors.textMuted }]}>Gasto este mês</Text>
                  <Text style={[styles.currentValue, { color: colors.textPrimary }]}>
                    {formatCurrency(selectedCategory.spent)}
                  </Text>
                  {selectedCategory.hasBudget && (
                    <>
                      <Text style={[styles.currentLabel, { color: colors.textMuted, marginTop: 8 }]}>Orçamento atual</Text>
                      <Text style={[styles.currentValue, { color: colors.primary }]}>
                        {formatCurrency(selectedCategory.budget)}
                      </Text>
                    </>
                  )}
                </View>

                {/* Input */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Novo Orçamento (R$)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: darkMode ? colors.bgTertiary : colors.bgTertiary, color: colors.textPrimary }]}
                  value={budgetAmount}
                  onChangeText={setBudgetAmount}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />

                {/* Botões */}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveBudget}
                >
                  <Ionicons name="save" size={18} color="#FFF" />
                  <Text style={styles.saveBtnText}>Salvar Orçamento</Text>
                </TouchableOpacity>

                {selectedCategory?.hasBudget && (
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: colors.danger + '15' }]}
                    onPress={handleDeleteBudget}
                  >
                    <Ionicons name="trash" size={18} color={colors.danger} />
                    <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Remover Orçamento</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  // Summary Card
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  summaryProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryProgressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryPercent: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },

  // Section
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Budget Items
  budgetItem: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  budgetItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: { fontSize: 15, fontWeight: '700' },
  categoryMeta: { fontSize: 12, marginTop: 2 },
  budgetItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  percentText: { fontSize: 15, fontWeight: '700' },

  // Progress
  progressContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  overBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  overText: { fontSize: 11, fontWeight: '700' },
  noBudgetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  noBudgetText: { fontSize: 11, fontWeight: '600' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { gap: 16 },

  currentInfo: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  currentLabel: { fontSize: 12, fontWeight: '600' },
  currentValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },

  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    padding: 14,
    borderRadius: 12,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
});

export default BudgetScreen;