import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import Toast from '../components/Toast';

const AddScreen = () => {
  const { categories, cards, addTransaction } = useApp();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardId, setCardId] = useState('');
  const [boletoDue, setBoletoDue] = useState('');
  const [transactionTags, setTransactionTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const typeConfig = {
    expense: { title: 'Nova Despesa', color: '#EF4444', icon: 'remove-circle' },
    income: { title: 'Nova Receita', color: '#10B981', icon: 'add-circle' },
    boleto: { title: 'Novo Boleto', color: '#F59E0B', icon: 'barcode' },
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const openModal = (type) => {
    setTransactionType(type);
    setModalVisible(true);
    setDesc('');
    setAmount('');
    setCategoryId('');
    setPaymentMethod('card');
    setCardId('');
    setBoletoDue('');
    setTransactionTags([]);
    setTagInput('');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !transactionTags.includes(tagInput.trim())) {
      setTransactionTags([...transactionTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setTransactionTags(transactionTags.filter(t => t !== tag));
  };

  const handleSubmit = () => {
    if (!desc || !amount || !categoryId) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    const category = categories.find(c => c.id === categoryId);

    const transaction = {
      type: transactionType,
      desc,
      amount: parseFloat(amount),
      date,
      category: categoryId,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
      paymentMethod,
      cardId: paymentMethod === 'card' ? cardId : null,
      boletoDue: transactionType === 'boleto' ? boletoDue : null,
      tags: transactionTags,
    };

    addTransaction(transaction);
    setModalVisible(false);
    showToast(`${typeConfig[transactionType].title} registrada!`, 'success');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.content}>
        <Ionicons name="hand-left" size={48} color={colors.textMuted} />
        <Text style={[styles.hint, { color: colors.textMuted }]}>Toque no botão + para adicionar</Text>
        <Text style={[styles.subHint, { color: colors.textMuted }]}>Despesas, receitas ou boletos</Text>
      </View>

      {/* FAB Menu */}
      <View style={styles.fabMenu}>
        <TouchableOpacity 
          style={[styles.fabItem, { backgroundColor: '#EF4444' }]} 
          onPress={() => openModal('expense')}
        >
          <Ionicons name="remove" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.fabItem, { backgroundColor: '#10B981' }]} 
          onPress={() => openModal('income')}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.fabItem, { backgroundColor: '#F59E0B' }]} 
          onPress={() => openModal('boleto')}
        >
          <Ionicons name="barcode" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => {}}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name={typeConfig[transactionType].icon} size={20} color={typeConfig[transactionType].color} />
                {'  '}{typeConfig[transactionType].title}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Descrição</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="Ex: Supermercado"
                  placeholderTextColor={colors.textMuted}
                  value={desc}
                  onChangeText={setDesc}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Valor (R$)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="0,00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Data</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Categoria</Text>
                  <ScrollView style={[styles.picker, { backgroundColor: colors.bgTertiary }]}>
                    {categories.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.categoryOption,
                          categoryId === c.id && { backgroundColor: c.color + '20', borderColor: c.color }
                        ]}
                        onPress={() => setCategoryId(c.id)}
                      >
                        <Ionicons name={c.icon} size={16} color={c.color} />
                        <Text style={{ fontSize: 12, color: colors.textPrimary }}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Forma de Pagamento</Text>
                <View style={styles.paymentOptions}>
                  {[
                    { key: 'card', label: 'Cartão', icon: 'card' },
                    { key: 'pix', label: 'PIX', icon: 'qr-code' },
                    { key: 'boleto', label: 'Boleto', icon: 'barcode' },
                    { key: 'cash', label: 'Dinheiro', icon: 'cash' },
                  ].map(method => (
                    <TouchableOpacity
                      key={method.key}
                      style={[
                        styles.paymentOption,
                        paymentMethod === method.key && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                      ]}
                      onPress={() => setPaymentMethod(method.key)}
                    >
                      <Ionicons 
                        name={method.icon} 
                        size={16} 
                        color={paymentMethod === method.key ? colors.primary : colors.textMuted} 
                      />
                      <Text style={{ fontSize: 12, color: paymentMethod === method.key ? colors.primary : colors.textSecondary }}>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {paymentMethod === 'card' && cards.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Cartão</Text>
                  <View style={styles.cardsList}>
                    {cards.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.cardOption,
                          cardId === c.id.toString() && { borderColor: colors.primary }
                        ]}
                        onPress={() => setCardId(c.id.toString())}
                      >
                        <Text style={{ color: colors.textPrimary }}>{c.name} - {c.number}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {transactionType === 'boleto' && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Vencimento do Boleto</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    value={boletoDue}
                    onChangeText={setBoletoDue}
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Tags (opcional)</Text>
                <View style={[styles.tagsInput, { backgroundColor: colors.bgTertiary }]}>
                  <TextInput
                    style={{ flex: 1, color: colors.textPrimary }}
                    placeholder="Digite e pressione Enter"
                    placeholderTextColor={colors.textMuted}
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={handleAddTag}
                  />
                </View>
                <View style={styles.tagsList}>
                  {transactionTags.map(tag => (
                    <View key={tag} style={[styles.tagChip, { backgroundColor: colors.primary }]}>
                      <Text style={styles.tagText}>{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(tag)}>
                        <Ionicons name="close" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: typeConfig[transactionType].color }]}
                onPress={handleSubmit}
              >
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Registrar {typeConfig[transactionType].title.split(' ')[1]}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Toast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: { fontSize: 16, marginBottom: 8, marginTop: 16 },
  subHint: { fontSize: 12 },
  fab: { position: 'absolute', bottom: 100, right: 24, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, zIndex: 500 },
  fabMenu: { position: 'absolute', bottom: 170, right: 29, gap: 12, zIndex: 400 },
  fabItem: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalBody: { padding: 20 },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 12, borderRadius: 12, fontSize: 15, borderWidth: 2, borderColor: 'transparent' },
  picker: { borderRadius: 12, padding: 8, maxHeight: 200 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', marginBottom: 4 },
  paymentOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', minWidth: 80, justifyContent: 'center' },
  cardsList: { gap: 8 },
  cardOption: { padding: 12, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', backgroundColor: '#F1F5F9' },
  tagsInput: { flexDirection: 'row', padding: 8, borderRadius: 12 },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  tagText: { color: '#FFFFFF', fontSize: 12, fontWeight: '500' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginTop: 8 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default AddScreen;
