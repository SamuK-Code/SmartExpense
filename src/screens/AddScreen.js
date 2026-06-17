import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/helpers';
import Toast from '../components/Toast';

const AddScreen = () => {
  const { categories, cards, transactions, addTransaction, getCardUsage } = useApp();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardId, setCardId] = useState(null);
  const [cardType, setCardType] = useState('credit');
  const [boletoDue, setBoletoDue] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [fabOpen, setFabOpen] = useState(false);

  const typeConfig = {
    expense: { title: 'Nova Despesa', color: '#EF4444', icon: 'remove-circle' },
    income: { title: 'Nova Receita', color: '#10B981', icon: 'add-circle' },
    boleto: { title: 'Novo Boleto', color: '#F59E0B', icon: 'barcode' },
  };

  // Calcular cartões mais utilizados (top 3 por valor gasto)
  const topCards = useMemo(() => {
    return cards
      .map(card => ({
        ...card,
        used: getCardUsage(card.id),
      }))
      .filter(card => card.used > 0)
      .sort((a, b) => b.used - a.used)
      .slice(0, 3);
  }, [cards, transactions, getCardUsage]);

  // Calcular categorias mais utilizadas (top 5 por valor gasto)
  const topCategories = useMemo(() => {
    const catTotals = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const key = t.categoryName || 'Outros';
        catTotals[key] = (catTotals[key] || { amount: 0, icon: t.categoryIcon || 'pricetag', color: t.categoryColor || '#94A3B8' });
        catTotals[key].amount += t.amount;
      });

    return Object.entries(catTotals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const openModal = (type) => {
    setTransactionType(type);
    setModalVisible(true);
    setDesc('');
    setAmount('');
    setCategoryId('');
    setPaymentMethod(type === 'income' ? 'pix' : 'card');
    setCardId('');
    setCardType('credit');
    setBoletoDue('');
    setFabOpen(false);
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
      categoryName: category ? category.name : 'Customizado',
      categoryIcon: category ? category.icon : 'pricetag',
      categoryColor: category ? category.color : '#94A3B8',
      paymentMethod,
      cardId: paymentMethod === 'card' ? parseInt(cardId, 10) : null,
      cardType: paymentMethod === 'card' ? cardType : null,
      boletoDue: transactionType === 'boleto' ? boletoDue : null,
    };

    addTransaction(transaction);
    setModalVisible(false);
    setFabOpen(false);
    showToast(`${typeConfig[transactionType].title} registrada!`, 'success');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          <Ionicons name="add-circle" size={20} color={colors.primary} />  Adicionar
        </Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16 }}>
        {/* Resumo - Cartões Mais Utilizados */}
        {topCards.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              <Ionicons name="card" size={14} color={colors.primary} />  Cartões Mais Usados
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardScroll}>
              {topCards.map(card => (
                <View key={card.id} style={[styles.topCard, { backgroundColor: colors.bgCard }]}>
                  <View style={[styles.topCardBar, { backgroundColor: card.color || colors.primary }]} />
                  <Text style={[styles.topCardName, { color: colors.textPrimary }]} numberOfLines={1}>{card.name}</Text>
                  <Text style={[styles.topCardNumber, { color: colors.textMuted }]}>{card.number}</Text>
                  <Text style={[styles.topCardValue, { color: colors.danger }]}>{formatCurrency(card.used)}</Text>
                  <Text style={[styles.topCardLabel, { color: colors.textMuted }]}>utilizado</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Resumo - Categorias Mais Utilizadas */}
        {topCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              <Ionicons name="pie-chart" size={14} color={colors.primary} />  Categorias Top
            </Text>
            <View style={[styles.categoryList, { backgroundColor: colors.bgCard }]}>
              {topCategories.map((cat, index) => (
                <View key={cat.name} style={styles.categoryRow}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryRank, { backgroundColor: index < 3 ? cat.color + '20' : colors.bgTertiary }]}>
                      <Text style={[styles.categoryRankText, { color: index < 3 ? cat.color : colors.textMuted }]}>{index + 1}</Text>
                    </View>
                    <View style={[styles.categoryIconBg, { backgroundColor: cat.color + '15' }]}>
                      <Ionicons name={cat.icon} size={16} color={cat.color} />
                    </View>
                    <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{cat.name}</Text>
                  </View>
                  <Text style={[styles.categoryValue, { color: colors.danger }]}>{formatCurrency(cat.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mensagem quando vazio */}
        {topCards.length === 0 && topCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="hand-left" size={48} color={colors.textMuted} />
            <Text style={[styles.hint, { color: colors.textMuted }]}>Toque no botão + para adicionar</Text>
            <Text style={[styles.subHint, { color: colors.textMuted }]}>Despesas, receitas ou boletos</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB Menu */}
      {fabOpen && (
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
        </View>
      )}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]} 
        onPress={() => setFabOpen(!fabOpen)}
      >
        <Ionicons name={fabOpen ? 'close' : 'add'} size={28} color="#FFFFFF" />
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

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
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
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Data</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
              </View>

              {/* Categorias - Scroll Horizontal */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Categoria</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {categories.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      activeOpacity={0.7}
                      style={[
                        styles.categoryChip,
                        { backgroundColor: categoryId === c.id ? c.color + '20' : colors.bgTertiary },
                      ]}
                      onPress={() => setCategoryId(c.id)}
                    >
                      <Ionicons name={c.icon} size={18} color={categoryId === c.id ? c.color : colors.textMuted} />
                      <Text style={{ fontSize: 12, color: categoryId === c.id ? c.color : colors.textPrimary, marginLeft: 6 }}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Forma de Pagamento</Text>
                <View style={styles.paymentOptions}>
                  {(transactionType === 'income' 
                    ? [
                        { key: 'pix', label: 'PIX', icon: 'qr-code' },
                        { key: 'cash', label: 'Dinheiro', icon: 'cash' },
                      ]
                    : [
                        { key: 'card', label: 'Cartão', icon: 'card' },
                        { key: 'pix', label: 'PIX', icon: 'qr-code' },
                        { key: 'boleto', label: 'Boleto', icon: 'barcode' },
                        { key: 'cash', label: 'Dinheiro', icon: 'cash' },
                      ]
                  ).map(method => (
                    <TouchableOpacity
                      key={method.key}
                      activeOpacity={0.7}
                      style={[
                        styles.paymentOption,
                        { backgroundColor: paymentMethod === method.key ? colors.primary + '10' : colors.bgTertiary },
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

              {/* Cartão selecionado → Scroll horizontal estilo categorias */}
              {transactionType !== 'income' && paymentMethod === 'card' && cards.length > 0 && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Cartão</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.cardScroll}
                    >
                      {cards.map(c => (
                        <TouchableOpacity
                          key={c.id}
                          activeOpacity={0.7}
                          style={[
                            styles.cardChip,
                            { backgroundColor: cardId === c.id.toString() ? colors.primary + '20' : colors.bgTertiary },
                          ]}
                          onPress={() => setCardId(c.id)}
                        >
                          <Ionicons name="card" size={16} color={cardId === c.id.toString() ? colors.primary : colors.textMuted} />
                          <Text style={{ fontSize: 11, color: cardId === c.id.toString() ? colors.primary : colors.textPrimary, marginLeft: 4 }}>
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo do Cartão</Text>
                    <View style={styles.paymentOptions}>
                      {[
                        { key: 'credit', label: 'Crédito', icon: 'card' },
                        { key: 'debit', label: 'Débito', icon: 'card' },
                      ].map(type => (
                        <TouchableOpacity
                          key={type.key}
                          activeOpacity={0.7}
                          style={[
                            styles.paymentOption,
                            { backgroundColor: cardType === type.key ? colors.primary + '10' : colors.bgTertiary },
                          ]}
                          onPress={() => setCardType(type.key)}
                        >
                          <Ionicons 
                            name={type.icon} 
                            size={16} 
                            color={cardType === type.key ? colors.primary : colors.textMuted} 
                          />
                          <Text style={{ fontSize: 12, color: cardType === type.key ? colors.primary : colors.textSecondary }}>
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
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

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: typeConfig[transactionType].color }]}
                onPress={handleSubmit}
              >
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Registrar {typeConfig[transactionType].title.split(' ')[1]}</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
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
  scroll: { flex: 1 },

  // Resumo - Cartões
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  cardScroll: { paddingVertical: 4, gap: 8 },
  topCard: { 
    width: 140, 
    padding: 16, 
    borderRadius: 16, 
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topCardBar: { 
    width: 40, 
    height: 4, 
    borderRadius: 2, 
    marginBottom: 12 
  },
  topCardName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  topCardNumber: { fontSize: 11, marginBottom: 8 },
  topCardValue: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  topCardLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Resumo - Categorias
  categoryList: { 
    borderRadius: 16, 
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 10, 
    paddingHorizontal: 8 
  },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryRank: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  categoryRankText: { fontSize: 11, fontWeight: '700' },
  categoryIconBg: { 
    width: 32, 
    height: 32, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  categoryName: { fontSize: 14, fontWeight: '500' },
  categoryValue: { fontSize: 14, fontWeight: '700' },

  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  hint: { fontSize: 16, marginBottom: 8, marginTop: 16 },
  subHint: { fontSize: 12 },

  // FAB
  fab: { position: 'absolute', bottom: 90, right: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, zIndex: 500 },
  fabMenu: { position: 'absolute', bottom: 160, right: 25, gap: 12, zIndex: 400 },
  fabItem: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalBody: { padding: 20 },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 12, borderRadius: 12, fontSize: 15, borderWidth: 2, borderColor: 'transparent' },
  categoryScroll: { paddingVertical: 4, gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 8 },
  paymentOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, borderRadius: 12, minWidth: 80, justifyContent: 'center' },
  cardChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginRight: 8 },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginTop: 8 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default AddScreen;