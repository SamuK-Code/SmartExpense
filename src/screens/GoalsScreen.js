import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/helpers';
import GoalCard from '../components/GoalCard';
import Toast from '../components/Toast';

const goalIcons = [
  { icon: 'airplane', name: 'Avião' },
  { icon: 'car', name: 'Carro' },
  { icon: 'home', name: 'Casa' },
  { icon: 'school', name: 'Educação' },
  { icon: 'heart', name: 'Saúde' },
  { icon: 'briefcase', name: 'Trabalho' },
  { icon: 'game-controller', name: 'Lazer' },
  { icon: 'gift', name: 'Presente' },
];

const goalColors = [
  '#8B5CF6', '#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#EC4899'
];

const GoalsScreen = () => {
  const { goals, addGoal, contributeGoal } = useApp();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('active');
  const [modalVisible, setModalVisible] = useState(false);
  const [contributeModal, setContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(goalIcons[0]);
  const [selectedColor, setSelectedColor] = useState(goalColors[0]);
  const [contributeAmount, setContributeAmount] = useState('');

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);
  const totalSaved = goals.reduce((sum, g) => sum + g.current, 0);

  const filteredGoals = activeTab === 'active' ? activeGoals : completedGoals;

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleAddGoal = () => {
    if (!name || !target || !deadline) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    const goal = {
      name,
      target: parseFloat(target),
      current: parseFloat(current) || 0,
      deadline,
      icon: selectedIcon.icon,
      color: selectedColor,
    };

    addGoal(goal);
    setModalVisible(false);
    resetForm();
    showToast('Meta criada!');
  };

  const handleContribute = () => {
    if (!contributeAmount || !selectedGoal) return;

    contributeGoal(selectedGoal.id, parseFloat(contributeAmount));
    setContributeModal(false);
    setContributeAmount('');
    setSelectedGoal(null);
    showToast('Contribuição registrada!');
  };

  const resetForm = () => {
    setName('');
    setTarget('');
    setCurrent('0');
    setDeadline('');
    setSelectedIcon(goalIcons[0]);
    setSelectedColor(goalColors[0]);
  };

  const openContribute = (goalId) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setSelectedGoal(goal);
      setContributeModal(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          <Ionicons name="flag" size={20} color={colors.primary} />  Metas Financeiras
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={[styles.summaryCard, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{activeGoals.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Ativas</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{completedGoals.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Concluídas</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>R$ {(totalSaved / 1000).toFixed(1)}k</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Economizado</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={activeTab === 'active' ? { color: '#FFFFFF' } : { color: colors.textSecondary }}>
              Em Andamento
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={activeTab === 'completed' ? { color: '#FFFFFF' } : { color: colors.textSecondary }}>
              Concluídas
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.goalsList}>
          {filteredGoals.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.bgCard }]}>
              <Ionicons name="flag" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {activeTab === 'active' ? 'Nenhuma meta em andamento' : 'Nenhuma meta concluída'}
              </Text>
            </View>
          ) : (
            filteredGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                colors={colors}
                onContribute={openContribute}
              />
            ))
          )}
        </View>

        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Nova Meta</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="flag" size={20} color={colors.primary} />  Nova Meta
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nome da Meta</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="Ex: Viagem para Paris"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Valor Alvo (R$)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    placeholder="0,00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={target}
                    onChangeText={setTarget}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Valor Inicial (R$)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    placeholder="0,00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={current}
                    onChangeText={setCurrent}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Prazo Final</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={deadline}
                  onChangeText={setDeadline}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Ícone</Text>
                <View style={styles.iconPicker}>
                  {goalIcons.map((item, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.iconOption,
                        selectedIcon.icon === item.icon && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                      ]}
                      onPress={() => setSelectedIcon(item)}
                    >
                      <Ionicons name={item.icon} size={20} color={selectedIcon.icon === item.icon ? colors.primary : colors.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Cor</Text>
                <View style={styles.colorPicker}>
                  {goalColors.map((color, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorSelected
                      ]}
                      onPress={() => setSelectedColor(color)}
                    />
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddGoal}
              >
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Criar Meta</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={contributeModal}
        onRequestClose={() => setContributeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="cash" size={20} color={colors.primary} />  Contribuir
              </Text>
              <TouchableOpacity onPress={() => setContributeModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedGoal && (
                <View style={[styles.goalPreview, { backgroundColor: colors.bgTertiary }]}>
                  <Text style={[styles.previewName, { color: colors.textMuted }]}>{selectedGoal.name}</Text>
                  <Text style={[styles.previewProgress, { color: colors.primary }]}>
                    {formatCurrency(selectedGoal.current)} / {formatCurrency(selectedGoal.target)}
                  </Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Valor da Contribuição (R$)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="0,00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={contributeAmount}
                  onChangeText={setContributeAmount}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleContribute}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  summary: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryValue: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  summaryLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  tabs: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  tab: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  goalsList: { gap: 12 },
  emptyState: { padding: 32, borderRadius: 16, alignItems: 'center' },
  emptyText: { fontSize: 14, marginTop: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, padding: 16, borderRadius: 12 },
  addBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalBody: { padding: 20 },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 12, borderRadius: 12, fontSize: 15, borderWidth: 2, borderColor: 'transparent' },
  iconPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  iconOption: { width: 48, height: 48, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOption: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: 'transparent' },
  colorSelected: { borderColor: '#1E293B', transform: [{ scale: 1.15 }] },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginTop: 8 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  goalPreview: { padding: 16, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  previewName: { fontSize: 14, marginBottom: 4 },
  previewProgress: { fontSize: 18, fontWeight: '700' },
});

export default GoalsScreen;
