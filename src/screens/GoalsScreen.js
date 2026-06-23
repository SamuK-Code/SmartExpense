// GoalsScreen.js — COM TRADUÇÕES COMPLETAS E LISTAS HORIZONTAIS
// CORREÇÃO: Ícones e cores agora usam ScrollView horizontal para melhor UX

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import GoalCard, { GOAL_ICONS } from '../components/GoalCard';
import InvestModal from '../components/InvestModal';
import CompletedGoalsModal from '../components/CompletedGoalsModal';
import Toast from '../components/Toast';

const GoalsScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslate();
  const { 
    goals, 
    completedGoals, 
    cashBalance,
    investInGoal, 
    completeGoal, 
    addGoal,
    deleteGoal,
  } = useApp();

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Modal de adicionar meta
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [completedModalVisible, setCompletedModalVisible] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  const [newGoalIcon, setNewGoalIcon] = useState('flag');
  const [newGoalColor, setNewGoalColor] = useState('#6366F1');
  
  // Modal de investir/retirar
  const [investModalVisible, setInvestModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [investType, setInvestType] = useState('deposit');

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleAddGoal = () => {
    if (!newGoalName.trim() || !newGoalTarget.trim()) {
      showToast(t('goals.fillRequired'), 'error');
      return;
    }

    addGoal({
      name: newGoalName.trim(),
      target: parseFloat(newGoalTarget),
      icon: newGoalIcon,
      color: newGoalColor,
    });

    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalIcon('flag');
    setNewGoalColor('#6366F1');
    setAddModalVisible(false);
    showToast(t('goals.goalCreatedSuccess'));
  };

  const handleInvest = (goal, type) => {
    setSelectedGoal(goal);
    setInvestType(type);
    setInvestModalVisible(true);
  };

  const handleInvestConfirm = (goalId, amount, type) => {
    investInGoal(goalId, amount, type);
    const action = type === 'deposit' ? t('goals.invest').toLowerCase() : t('goals.withdraw').toLowerCase();
    showToast(`R$ ${amount.toFixed(2)} ${action} ${t('goals.fromGoal') || 'da meta'}!`);
  };

  const handleComplete = (goal) => {
    const success = completeGoal(goal.id);
    if (success) {
      showToast(`🎉 ${t('goals.goalCreated')?.replace('Meta', `"${goal.name}"`)}`, 'success');
    }
  };

  const handleDelete = (goalId) => {
    deleteGoal(goalId);
    showToast(t('goals.goalDeleted'), 'warning');
  };

  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E',
    '#78716C', '#475569', '#1E293B',
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          <Ionicons name="flag" size={20} color={colors.primary} />  {t('goals.myGoals')}
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16 }}
      >
        {/* Resumo */}
        <View style={styles.summary}>
          <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.summaryLabel}>{t('goals.inProgressShort')}</Text>
            <Text style={styles.summaryValue}>{goals.length}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.success }]}>
            <Text style={styles.summaryLabel}>{t('goals.completedShort')}</Text>
            <Text style={styles.summaryValue}>{completedGoals.length}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.summaryCard, { backgroundColor: colors.warning }]}
            onPress={() => completedGoals.length > 0 && setCompletedModalVisible(true)}
          >
            <Text style={styles.summaryLabel}>{t('goals.view')}</Text>
            <Ionicons name="trophy" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Metas ativas */}
        {goals.length === 0 ? (
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
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onInvest={handleInvest}
                onComplete={handleComplete}
                colors={colors}
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Adicionar Meta (COM KEYBOARDAVOIDINGVIEW) */}
      <Modal
        animationType="slide"
        transparent
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="flag" size={20} color={colors.primary} />  {t('goals.newGoalTitle')}
              </Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
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

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('goals.value')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="0,00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={newGoalTarget}
                  onChangeText={setNewGoalTarget}
                />
              </View>

              {/* Ícone - Lista horizontal direta */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('goals.icon')}</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.iconGridHorizontal}
                >
                  {GOAL_ICONS.map(icon => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconOptionHorizontal,
                        { 
                          backgroundColor: newGoalIcon === icon ? (newGoalColor || colors.primary) + '20' : colors.bgTertiary,
                          borderColor: newGoalIcon === icon ? (newGoalColor || colors.primary) : 'transparent'
                        },
                      ]}
                      onPress={() => setNewGoalIcon(icon)}
                    >
                      <Ionicons 
                        name={icon} 
                        size={20} 
                        color={newGoalIcon === icon ? (newGoalColor || colors.primary) : colors.textMuted} 
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Cor - Lista horizontal em círculos */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('goals.color')}</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.colorScrollContent}
                >
                  {colorOptions.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        newGoalColor === color && styles.colorCircleSelected
                      ]}
                      onPress={() => setNewGoalColor(color)}
                      activeOpacity={0.8}
                    >
                      {newGoalColor === color && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Investir/Retirar */}
      <InvestModal
        visible={investModalVisible}
        onClose={() => setInvestModalVisible(false)}
        goal={selectedGoal}
        type={investType}
        balance={cashBalance}
        onConfirm={handleInvestConfirm}
        colors={colors}
      />

      {/* Modal de Metas Concluídas */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={completedModalVisible}
        onRequestClose={() => setCompletedModalVisible(false)}
      >
        <CompletedGoalsModal 
          completedGoals={completedGoals}
          onClose={() => setCompletedModalVisible(false)}
          colors={colors}
        />
      </Modal>

      <Toast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  content: { flex: 1, paddingHorizontal: 16 },

  summary: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: 20 
  },
  summaryCard: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  summaryLabel: { 
    color: '#FFFFFF', 
    fontSize: 12, 
    fontWeight: '600', 
    opacity: 0.9, 
    marginBottom: 4 
  },
  summaryValue: { 
    color: '#FFFFFF', 
    fontSize: 22, 
    fontWeight: '700' 
  },

  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 80, 
    paddingHorizontal: 32 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginTop: 16, 
    marginBottom: 8 
  },
  emptySub: { 
    fontSize: 14, 
    textAlign: 'center', 
    lineHeight: 20 
  },

  goalsList: { gap: 12 },

  // Modal
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    paddingBottom: 40, 
    maxHeight: '90%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },

  modalBody: { maxHeight: 400 },

  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 14, borderRadius: 12, fontSize: 16 },

  // Cores em círculos horizontais
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
    borderColor: '#FFFFFF',
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
    marginTop: 8 
  },
  submitText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '700' 
  },

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
});

export default GoalsScreen;