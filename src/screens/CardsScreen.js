import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/helpers';
import CreditCard from '../components/CreditCard';
import Toast from '../components/Toast';

const CardsScreen = () => {
  const { cards, cardGradients, addCard, deleteCard, getCardUsage } = useApp();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [limit, setLimit] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(cardGradients[0]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  const totalUsed = cards.reduce((sum, c) => sum + getCardUsage(c.id), 0);
  const totalAvailable = totalLimit - totalUsed;

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleAddCard = () => {
    if (!name || !limit) {
      showToast('Preencha os campos obrigatórios', 'error');
      return;
    }

    const card = {
      name,
      number: number ? `**** ${number.padStart(4, '0')}` : '**** 0000',
      limit: parseFloat(limit),
      closeDate,
      dueDate,
      gradientClass: selectedGradient.class,
      color: selectedGradient.color,
    };

    addCard(card);
    setModalVisible(false);
    resetForm();
    showToast('Cartão adicionado!');
  };

  const resetForm = () => {
    setName('');
    setNumber('');
    setLimit('');
    setCloseDate('');
    setDueDate('');
    setSelectedGradient(cardGradients[0]);
  };

  const handleDeleteCard = (id) => {
    Alert.alert(
      'Confirmar exclusão',
      'Deseja excluir este cartão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            deleteCard(id);
            showToast('Cartão excluído', 'warning');
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          <Ionicons name="card" size={20} color={colors.primary} />  Meus Cartões
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cards Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsCarousel}>
          {cards.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.bgCard }]}>
              <Ionicons name="card" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhum cartão cadastrado</Text>
            </View>
          ) : (
            cards.map(card => (
              <TouchableOpacity key={card.id} onLongPress={() => handleDeleteCard(card.id)}>
                <View style={{ marginRight: 12 }}>
                  <CreditCard card={card} used={getCardUsage(card.id)} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Summary */}
        {cards.length > 0 && (
          <View style={styles.summary}>
            <View style={[styles.summaryCard, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Limite Total</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatCurrency(totalLimit)}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Disponível Total</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatCurrency(totalAvailable)}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Utilizado</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>{formatCurrency(totalUsed)}</Text>
            </View>
          </View>
        )}

        {/* Add Button */}
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Adicionar Cartão</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal */}
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
                <Ionicons name="card" size={20} color={colors.primary} />  Novo Cartão
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nome do Cartão</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="Ex: Nubank, Inter..."
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Número (últimos 4 dígitos)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="0000"
                  placeholderTextColor={colors.textMuted}
                  maxLength={4}
                  keyboardType="number-pad"
                  value={number}
                  onChangeText={setNumber}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Limite (R$)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    placeholder="0,00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={limit}
                    onChangeText={setLimit}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Fechamento</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    value={closeDate}
                    onChangeText={setCloseDate}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Vencimento</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Cor do Cartão</Text>
                <View style={styles.colorPicker}>
                  {cardGradients.map((g, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.colorOption,
                        { backgroundColor: g.color },
                        selectedGradient.class === g.class && styles.colorSelected
                      ]}
                      onPress={() => setSelectedGradient(g)}
                    />
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddCard}
              >
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Salvar Cartão</Text>
              </TouchableOpacity>
            </ScrollView>
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
  content: { flex: 1, paddingTop: 16 },
  cardsCarousel: { paddingHorizontal: 16, marginBottom: 20 },
  emptyCard: { width: 300, height: 180, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  emptyText: { fontSize: 14, marginTop: 8 },
  summary: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 20 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  summaryLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, padding: 16, borderRadius: 12 },
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
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOption: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: 'transparent' },
  colorSelected: { borderColor: '#1E293B', transform: [{ scale: 1.15 }] },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginTop: 8 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default CardsScreen;
