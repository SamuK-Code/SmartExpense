// GoalsScreen.js — Metas com Círculos Financeiros + Design Visual Recuperado
// Suporte a metas locais + compartilhadas, filtros por origem/círculo, permissões

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { useCircle } from '../context/CircleContext';
import { formatCurrency } from '../utils/helpers';
import GoalCard, { GOAL_ICONS } from '../utils/helpers';
import InvestModal from '../components/InvestModal';
import CompletedGoalsModal from '../components/CompletedGoalsModal';
import Toast from '../components/Toast';
import ModalContent from '../components/ModalKeyboardSafe';

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

    const parseCurrencyToNumber = (value) => {
      if (!value) return 0;
      const normalized = value.replace(/\./g, '').replace(',', '.');
      return parseFloat(normalized) || 0;
    };

    const targetValue = parseCurrencyToNumber(newGoalTarget);
    const initialValue = parseCurrencyToNumber(newGoalInitial);

    if (targetValue <= 0) {
      showToast(t('goals.invalidTarget'), 'error');
      return;
    }

    addGoal({
      name: newGoalName.trim(),
      target: targetValue,
      currentAmount: initialValue,
      icon: newGoalIcon,
      color: newGoalColor,
    });
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalInitial('');

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
    const success = completeGoal(goal.id, { completedAt: new Date().toISOString() });
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
      {/* Header — Design da versão anterior + funcionalidade nova */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            <Ionicons name="flag" size={20} color={colors.primary} />  {t('goals.myGoals')}
          </Text>
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
                <Ionicons name="add" size={24} color={colors.primary} />
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

        {/* ═══════ RESUMO — Design da versão anterior ═══════ */}
        <View style={styles.summary}>
          <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.summaryLabel}>{t('goals.inProgressShort')}</Text>
            <Text style={styles.summaryValue}>{(displayGoals || []).length}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.success }]}>
            <Text style={styles.summaryLabel}>{t('goals.completedShort')}</Text>
            <Text style={styles.summaryValue}>{(displayCompleted || []).length}</Text>
          </View>
          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: colors.warning }]}
            onPress={() => (displayCompleted || []).length > 0 && setCompletedModalVisible(true)}
          >
            <Text style={styles.summaryLabel}>{t('goals.view')}</Text>
            <Ionicons name="trophy" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ═══════ METAS ATIVAS — Design da versão anterior ═══════ */}
        {(displayGoals || []).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>
              {t('goals.noActiveGoals')}
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              {t('goals.createFirst')}
            </Text>
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
                  colors={colors}
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

      {/* ═══════ MODAL ADICIONAR META — CORREÇÃO: ModalContent em vez de KeyboardAvoidingView ═══════ */}
      <Modal visible={addModalVisible} animationType="slide" transparent onRequestClose={() => setAddModalVisible(false)}>
        <ModalContent scroll={true}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="flag" size={20} color={colors.primary} />  {t('goals.newGoalTitle')}
              </Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('goals.goalNameLabel')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder={t('goals.goalName')}
                  placeholderTextColor={colors.textMuted}
                  value={newGoalName}
                  onChangeText={setNewGoalName}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('goals.targetAmount')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    value={newGoalTarget}
                    onChangeText={setNewGoalTarget}
                    keyboardType="decimal-pad"
                    placeholder="0,00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('goals.initialAmount')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    value={newGoalInitial}
                    onChangeText={setNewGoalInitial}
                    keyboardType="decimal-pad"
                    placeholder="0,00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* Ícone — Lista horizontal inline */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('goals.icon')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.iconRowInline}
                >
                  {GOAL_ICONS.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconOptionInline,
                        {
                          backgroundColor: newGoalIcon === icon ? (newGoalColor || colors.primary) + '20' : colors.bgTertiary,
                          borderColor: newGoalIcon === icon ? (newGoalColor || colors.primary) : 'transparent'
                        },
                      ]}
                      onPress={() => setNewGoalIcon(icon)}
                    >
                      <Ionicons
                        name={icon}
                        size={22}
                        color={newGoalIcon === icon ? (newGoalColor || colors.primary) : colors.textMuted}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Cor — Lista horizontal (design anterior) */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('goals.color')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.colorScroll}
                  contentContainerStyle={styles.colorScrollContent}
                >
                  {colorOptions.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircleHorizontal,
                        { backgroundColor: color },
                        newGoalColor === color && styles.colorSelectedHorizontal
                      ]}
                      onPress={() => setNewGoalColor(color)}
                    />
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddGoal}
              >
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>{t('goals.createGoalBtn')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </ModalContent>
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
// ESTILOS — Mesclados: funcionais da nova + visuais da anterior
// ═══════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header — Visual da versão anterior + layout da nova
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

  // Resumo — Visual da versão anterior
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
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },

  // Empty — Visual da versão anterior
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

  // Modal — Visual da versão anterior
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

  modalBody: { maxHeight: 400 },

  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 14, borderRadius: 12, fontSize: 16 },

  // Preview de Ícone — Visual da versão anterior
  iconPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },

  // Cores — Visual da versão anterior
  colorScroll: {
    flexDirection: 'row',
  },
  colorScrollContent: {
    gap: 10,
    paddingRight: 20,
  },
  colorCircleHorizontal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 10,
  },
  colorSelectedHorizontal: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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

  // Ícones inline no modal principal
  iconRowInline: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  iconOptionInline: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
});

export default GoalsScreen;