// GoalsScreen.js — Metas com Círculos Financeiros (Arquivo 7/10)
// Suporte a metas locais + compartilhadas, filtros por origem/círculo, permissões

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { useCircle } from '../context/CircleContext';
import { formatCurrency } from '../utils/helpers';
import GoalCard, { GOAL_ICONS } from '../components/GoalCard';
import InvestModal from '../components/InvestModal';
import CompletedGoalsModal from '../components/CompletedGoalsModal';
import Toast from '../components/Toast';

const GoalsScreen = () => {
  const navigation = useNavigation();
  const { colors, darkMode } = useTheme();
  const { t } = useTranslate();
  const {
    goals, completedGoals, cashBalance,
    investInGoal, completeGoal, addGoal, deleteGoal,
    mergedGoals, mergedTransactions, isSharedItem, getItemShareInfo
  } = useApp();
  const { currentCircle, myCircles, syncEnabled } = useCircle();

  // ── FILTROS ──
  const [originFilter, setOriginFilter] = useState('all'); // all | local | shared
  const [circleFilter, setCircleFilter] = useState(null);  // null | 'local' | circleId

  // ── POOL DE METAS ──
  const displayGoals = useMemo(() => {
    let pool = currentCircle
      ? (mergedGoals || []).filter(g => !g._circleId || g._circleId === currentCircle.id)
      : (goals || []);

    if (originFilter === 'local') {
      pool = pool.filter(g => !g._circleId && !g._sharedBy);
    } else if (originFilter === 'shared') {
      pool = pool.filter(g => !!g._circleId || !!g._sharedBy);
    }

    if (!currentCircle && circleFilter === 'local') {
      pool = pool.filter(g => !g._circleId);
    } else if (!currentCircle && circleFilter && circleFilter !== 'all') {
      pool = pool.filter(g => g._circleId === circleFilter);
    }

    return pool.filter(g => !g.completed);
  }, [currentCircle, goals, mergedGoals, originFilter, circleFilter]);

  const displayCompleted = useMemo(() => {
    let pool = currentCircle
      ? (mergedGoals || []).filter(g => !g._circleId || g._circleId === currentCircle.id)
      : [...(completedGoals || [])];

    if (originFilter === 'local') {
      pool = pool.filter(g => !g._circleId && !g._sharedBy);
    } else if (originFilter === 'shared') {
      pool = pool.filter(g => !!g._circleId || !!g._sharedBy);
    }

    return pool.filter(g => g.completed);
  }, [currentCircle, completedGoals, mergedGoals, originFilter, circleFilter]);

  // ── MODAIS ──
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [completedModalVisible, setCompletedModalVisible] = useState(false);
  const [investModalVisible, setInvestModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [investType, setInvestType] = useState('deposit');

  // ── FORM NOVA META ──
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalInitial, setNewGoalInitial] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [newGoalIcon, setNewGoalIcon] = useState('flag');
  const [newGoalColor, setNewGoalColor] = useState('#6366F1');

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  // ── PERMISSÕES ──
  const canEditGoal = (goal) => {
    const info = getItemShareInfo ? getItemShareInfo(goal) : null;
    return !goal._sharedBy || (info && info.canEdit);
  };

  const canAddGoal = () => {
    return !currentCircle || (currentCircle && currentCircle.myRole === 'admin');
  };

  // ── HANDLERS ──
  const handleAddGoal = () => {
    if (!newGoalName.trim() || !newGoalTarget.trim()) {
      showToast(t('goals.fillRequired'), 'error');
      return;
    }
    addGoal({
      name: newGoalName.trim(),
      target: parseFloat(newGoalTarget),
      currentAmount: parseFloat(newGoalInitial) || 0,
      deadline: newGoalDeadline || null,
      icon: newGoalIcon,
      color: newGoalColor,
    });
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalInitial('');
    setNewGoalDeadline('');
    setNewGoalIcon('flag');
    setNewGoalColor('#6366F1');
    setAddModalVisible(false);
    showToast(t('goals.goalCreatedSuccess'));
  };

  const handleInvest = (goal, type) => {
    if (!canEditGoal(goal)) {
      showToast(t('common.noPermission'), 'error');
      return;
    }
    setSelectedGoal(goal);
    setInvestType(type);
    setInvestModalVisible(true);
  };

  const handleInvestConfirm = (goalId, amount, type) => {
    investInGoal(goalId, amount, type);
    const action = type === 'deposit' ? t('goals.invest').toLowerCase() : t('goals.withdraw').toLowerCase();
    showToast(`${formatCurrency(amount)} ${action} ${t('goals.fromGoal') || 'da meta'}!`);
  };

  const handleComplete = (goal) => {
    if (!canEditGoal(goal)) {
      showToast(t('common.noPermission'), 'error');
      return;
    }
    const success = completeGoal(goal.id);
    if (success) {
      showToast(`🎉 "${goal.name}" ${t('goals.completedShort').toLowerCase()}!`, 'success');
    }
  };

  const handleDelete = (goalId) => {
    const goal = (displayGoals || []).find(g => g.id === goalId) || (displayCompleted || []).find(g => g.id === goalId);
    if (goal && !canEditGoal(goal)) {
      showToast(t('common.noPermission'), 'error');
      return;
    }
    deleteGoal(goalId);
    showToast(t('goals.goalDeleted'), 'warning');
  };

  // ── BADGES ──
  const getSharedBadge = (item) => {
    if (!item) return null;
    const info = getItemShareInfo ? getItemShareInfo(item) : null;
    if (!info || !info.isShared) return null;
    return (
      <View style={[styles.sharedBadge, { backgroundColor: info.canEdit ? colors.success : colors.primary }]}>
        <Ionicons name={info.canEdit ? "create-outline" : "eye-outline"} size={10} color="#FFF" />
        <Text style={styles.sharedBadgeText}>{info.canEdit ? t('common.editPermission') : t('common.view')}</Text>
      </View>
    );
  };

  const getOriginBadge = (item) => {
    if (!item || (!item._circleId && !item._sharedBy)) return null;
    return (
      <View style={[styles.originBadge, { backgroundColor: colors.primary + '18' }]}>
        <Ionicons name="people-outline" size={10} color={colors.primary} />
        <Text style={[styles.originBadgeText, { color: colors.primary }]}>
          {item._sharedByName || item._sharedBy || t('common.shared')}
        </Text>
      </View>
    );
  };

  // ── CORES ──
  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E',
    '#78716C', '#475569', '#1E293B',
  ];

  // ── RENDER ──
  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.bgCard }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('goals.myGoals')}</Text>
          <View style={styles.headerRight}>
            {currentCircle && (
              <View style={[styles.circleChip, { backgroundColor: colors.primary + '15' }]}>
                <View style={[styles.onlineDot, { backgroundColor: syncEnabled ? colors.success : colors.danger }]} />
                <Text style={[styles.circleChipText, { color: colors.primary }]} numberOfLines={1}>
                  {currentCircle.name}
                </Text>
              </View>
            )}
            {canAddGoal() && (
              <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
                <Ionicons name="add-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════ FILTROS DE ORIGEM / CÍRCULO ═══════ */}
        <View style={styles.originBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: t('history.all'), icon: 'layers-outline' },
              { key: 'local', label: t('common.private'), icon: 'person-outline' },
              { key: 'shared', label: t('common.shared'), icon: 'people-outline' },
            ].map(o => (
              <TouchableOpacity
                key={o.key}
                style={[styles.originBtn, {
                  backgroundColor: originFilter === o.key
                    ? colors.primary : darkMode ? colors.bgCard : colors.bgTertiary,
                }]}
                onPress={() => setOriginFilter(o.key)}
              >
                <Ionicons name={o.icon} size={14} color={originFilter === o.key ? '#FFF' : colors.textMuted} />
                <Text style={{ color: originFilter === o.key ? '#FFF' : colors.textPrimary, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}

            {!currentCircle && (myCircles || []).length > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  style={[styles.originBtn, {
                    backgroundColor: circleFilter === 'local'
                      ? colors.primary : darkMode ? colors.bgCard : colors.bgTertiary,
                  }]}
                  onPress={() => setCircleFilter(circleFilter === 'local' ? null : 'local')}
                >
                  <Ionicons name="person-outline" size={14} color={circleFilter === 'local' ? '#FFF' : colors.textMuted} />
                  <Text style={{ color: circleFilter === 'local' ? '#FFF' : colors.textPrimary, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
                    {t('common.myData')}
                  </Text>
                </TouchableOpacity>
                {(myCircles || []).map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.originBtn, {
                      backgroundColor: circleFilter === c.id
                        ? colors.primary : darkMode ? colors.bgCard : colors.bgTertiary,
                    }]}
                    onPress={() => setCircleFilter(circleFilter === c.id ? null : c.id)}
                  >
                    <Ionicons name="people-outline" size={14} color={circleFilter === c.id ? '#FFF' : colors.textMuted} />
                    <Text style={{ color: circleFilter === c.id ? '#FFF' : colors.textPrimary, fontSize: 12, fontWeight: '600', marginLeft: 4 }} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        </View>

        {/* ═══════ RESUMO ═══════ */}
        <View style={styles.summary}>
          <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.summaryLabel}>{t('goals.inProgressShort')}</Text>
            <Text style={styles.summaryValue}>{(displayGoals || []).length}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.success }]}>
            <Text style={styles.summaryLabel}>{t('goals.completedShort')}</Text>
            <Text style={styles.summaryValue}>{(displayCompleted || []).length}</Text>
          </View>
          {(displayCompleted || []).length > 0 && (
            <TouchableOpacity
              style={[styles.summaryCard, { backgroundColor: colors.primary }]}
              onPress={() => setCompletedModalVisible(true)}
            >
              <Text style={styles.summaryLabel}>{t('goals.view')}</Text>
              <Ionicons name="trophy" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* ═══════ METAS ATIVAS ═══════ */}
        {(displayGoals || []).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('goals.noActiveGoals')}</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>{t('goals.createFirst')}</Text>
          </View>
        ) : (
          <View style={styles.goalsList}>
            {(displayGoals || []).map(goal => (
              <View key={goal.id} style={styles.goalWrapper}>
                <GoalCard
                  goal={goal}
                  onInvest={(g) => handleInvest(g, 'deposit')}
                  onWithdraw={(g) => handleInvest(g, 'withdraw')}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  canEdit={canEditGoal(goal)}
                />
                <View style={styles.goalBadges}>
                  {getSharedBadge(goal)}
                  {getOriginBadge(goal)}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ═══════ MODAL ADICIONAR META ═══════ */}
      <Modal visible={addModalVisible} animationType="slide" transparent onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('goals.newGoalTitle')}</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>{t('goals.goalNameLabel')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary, color: colors.textPrimary }]}
                    value={newGoalName}
                    onChangeText={setNewGoalName}
                    placeholder={t('goals.goalName')}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>{t('goals.targetAmount')}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary, color: colors.textPrimary }]}
                      value={newGoalTarget}
                      onChangeText={setNewGoalTarget}
                      keyboardType="numeric"
                      placeholder="R$ 0,00"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>{t('goals.initialAmount')}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary, color: colors.textPrimary }]}
                      value={newGoalInitial}
                      onChangeText={setNewGoalInitial}
                      keyboardType="numeric"
                      placeholder="R$ 0,00"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>{t('goals.deadline')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary, color: colors.textPrimary }]}
                    value={newGoalDeadline}
                    onChangeText={setNewGoalDeadline}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Ícones */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>{t('goals.icon')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconGridHorizontal}>
                    {(GOAL_ICONS || []).map(icon => (
                      <TouchableOpacity
                        key={icon}
                        onPress={() => setNewGoalIcon(icon)}
                        style={[
                          styles.iconOptionHorizontal,
                          {
                            backgroundColor: newGoalIcon === icon ? newGoalColor : darkMode ? colors.bgCard : colors.bgTertiary,
                            borderColor: newGoalIcon === icon ? newGoalColor : 'transparent',
                          }
                        ]}
                      >
                        <Ionicons name={icon} size={20} color={newGoalIcon === icon ? '#FFF' : colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Cores */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>{t('goals.color')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorScrollContent}>
                    {colorOptions.map(color => (
                      <TouchableOpacity
                        key={color}
                        onPress={() => setNewGoalColor(color)}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: color },
                          newGoalColor === color && styles.colorCircleSelected
                        ]}
                        activeOpacity={0.8}
                      >
                        {newGoalColor === color && (
                          <Ionicons name="checkmark" size={18} color="#FFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleAddGoal}>
                  <Text style={styles.submitText}>{t('goals.createGoalBtn')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══════ MODAL INVESTIR/RETIRAR ═══════ */}
      <InvestModal
        visible={investModalVisible}
        onClose={() => setInvestModalVisible(false)}
        goal={selectedGoal}
        type={investType}
        balance={cashBalance}
        onConfirm={handleInvestConfirm}
        colors={colors}
      />

      {/* ═══════ MODAL METAS CONCLUÍDAS ═══════ */}
      <CompletedGoalsModal
        visible={completedModalVisible}
        onClose={() => setCompletedModalVisible(false)}
        goals={displayCompleted}
        colors={colors}
        onDelete={handleDelete}
      />

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    maxWidth: 140,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  circleChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  // Conteúdo
  content: { flex: 1, paddingHorizontal: 16 },

  // Barra de Origem
  originBar: { marginVertical: 14 },
  originBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 6,
    alignSelf: 'center',
  },

  // Resumo
  summary: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Metas
  goalsList: { gap: 12 },
  goalWrapper: {
    marginBottom: 4,
  },
  goalBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginLeft: 4,
    flexWrap: 'wrap',
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sharedBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  originBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  originBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },

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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },

  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 14, borderRadius: 12, fontSize: 16 },

  // Ícones
  iconGridHorizontal: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
  iconOptionHorizontal: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 6,
  },

  // Cores
  colorScrollContent: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
    paddingVertical: 4,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default GoalsScreen;