// AddScreen.js — COM INDICADOR DE PRÓXIMA FATURA

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { formatCurrency, isAfterClosingDate, getInvoiceMonth, formatInvoiceMonth } from '../utils/helpers';
import Toast from '../components/Toast';

const AddScreen = () => {
  const { categories, cards, transactions, addTransaction, getCardUsage, cashBalance, updateCashBalance, editTransaction } = useApp();
  const { colors } = useTheme();
  const { t } = useTranslate();
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
    expense: { title: t('add.newExpense'), color: '#EF4444', icon: 'remove-circle' },
    income: { title: t('add.newIncome'), color: '#10B981', icon: 'add-circle' },
    boleto: { title: t('add.newBoleto'), color: '#F59E0B', icon: 'barcode' },
  };

  // Calcular cartões mais utilizados (top 3 por valor gasto)
  const topCards = useMemo(() => {
    return cards
      .map(card => ({ ...card, used: getCardUsage(card.id) }))
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
        const key = t.categoryName || t('categories.other');
        catTotals[key] = (catTotals[key] || { amount: 0, icon: t.categoryIcon || 'pricetag', color: t.categoryColor || '#94A3B8' });
        catTotals[key].amount += t.amount;
      });

    return Object.entries(catTotals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, t]);

  // Boletos pendentes (não pagos)
  const pendingBoletos = useMemo(() => {
    return transactions
      .filter(t => t.paymentMethod === 'boleto' && !t.isPaid)
      .sort((a, b) => new Date(a.boletoDue || a.date) - new Date(b.boletoDue || b.date));
  }, [transactions]);

  // Função para quitar boleto usando cashBalance
  const handlePayBoleto = (boleto) => {
    if (cashBalance < boleto.amount) {
      showToast(`Saldo em caixa insuficiente. Disponível: ${formatCurrency(cashBalance)}`, 'error');
      return;
    }

    // Deduz do cashBalance
    updateCashBalance(-boleto.amount);

    // Marca o boleto como pago via editTransaction
    editTransaction(boleto.id, {
      isPaid: true,
      paidAt: new Date().toISOString(),
      desc: boleto.desc.includes('(Quitado)') ? boleto.desc : boleto.desc + ' (Quitado)',
    });

    showToast(`Boleto "${boleto.desc}" quitado! ${formatCurrency(boleto.amount)} deduzido do caixa.`, 'success');
  };

  // NOVO: Verificar se a compra no cartão vai para a próxima fatura
  const getInvoiceWarning = () => {
    if (transactionType !== 'expense' || paymentMethod !== 'card' || !cardId) return null;

    const selectedCard = cards.find(c => c.id.toString() === cardId.toString());
    if (!selectedCard || !selectedCard.closeDate) return null;

    const isNextInvoice = isAfterClosingDate(date, selectedCard.closeDate);
    if (isNextInvoice) {
      const invoiceMonth = getInvoiceMonth(date, selectedCard.closeDate);
      return {
        message: `Esta compra irá para a fatura de ${formatInvoiceMonth(invoiceMonth)}`,
        color: colors.warning,
      };
    }
    return null;
  };

  const invoiceWarning = getInvoiceWarning();

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
      showToast(t('add.fillRequired'), 'error');
      return;
    }

    const category = categories.find(c => c.id === categoryId);
    const selectedCard = cards.find(c => c.id.toString() === cardId?.toString());

    const transaction = {
      type: transactionType,
      desc,
      amount: parseFloat(amount),
      date,
      category: categoryId,
      categoryName: category ? category.name : t('categories.other'),
      categoryIcon: category ? category.icon : 'pricetag',
      categoryColor: category ? category.color : '#94A3B8',
      paymentMethod,
      cardId: paymentMethod === 'card' ? parseInt(cardId, 10) : null,
      cardType: paymentMethod === 'card' ? cardType : null,
      boletoDue: transactionType === 'boleto' ? boletoDue : null,
      // NOVO: Flag para identificar se vai para próxima fatura
      isNextInvoice: selectedCard ? isAfterClosingDate(date, selectedCard.closeDate) : false,
      invoiceMonth: selectedCard ? getInvoiceMonth(date, selectedCard.closeDate) : null,
    };

    addTransaction(transaction);
    setModalVisible(false);
    setFabOpen(false);
    showToast(`${typeConfig[transactionType].title} ${t('add.success')}`, 'success');
  };

  const paymentMethods = transactionType === 'income'
    ? [
        { key: 'pix', label: t('add.pix'), icon: 'qr-code' },
        { key: 'cash', label: t('add.cash'), icon: 'cash' },
      ]
    : [
        { key: 'card', label: t('add.card'), icon: 'card' },
        { key: 'pix', label: t('add.pix'), icon: 'qr-code' },
        { key: 'boleto', label: t('add.boleto'), icon: 'barcode' },
      ];

  const cardTypes = [
    { key: 'credit', label: t('add.credit'), icon: 'card' },
    { key: 'debit', label: t('add.debit'), icon: 'card' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          <Ionicons name="add-circle" size={20} color={colors.primary} />  {t('add.title')}
        </Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16 }}>
        {/* Resumo - Cartões Mais Utilizados */}
        {topCards.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              <Ionicons name="card" size={14} color={colors.primary} />  {t('add.topCards')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardScroll}>
              {topCards.map(card => (
                <View key={card.id} style={[styles.topCard, { backgroundColor: colors.bgCard }]}>
                  <View style={[styles.topCardBar, { backgroundColor: card.color || colors.primary }]} />
                  <Text style={[styles.topCardName, { color: colors.textPrimary }]} numberOfLines={1}>{card.name}</Text>
                  <Text style={[styles.topCardNumber, { color: colors.textMuted }]}>{card.number}</Text>
                  <Text style={[styles.topCardValue, { color: colors.danger }]}>{formatCurrency(card.used)}</Text>
                  <Text style={[styles.topCardLabel, { color: colors.textMuted }]}>{t('cards.used')}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Resumo - Categorias Mais Utilizadas */}
        {topCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              <Ionicons name="pie-chart" size={14} color={colors.primary} />  {t('add.topCategories')}
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

        {/* Boletos Pendentes */}
        {pendingBoletos.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              <Ionicons name="barcode" size={14} color={colors.warning} />  Boletos Pendentes
            </Text>
            <View style={[styles.boletoList, { backgroundColor: colors.bgCard }]}>
              {pendingBoletos.map(boleto => (
                <View key={boleto.id} style={styles.boletoRow}>
                  <View style={styles.boletoLeft}>
                    <View style={[styles.boletoIconBg, { backgroundColor: colors.warning + '15' }]}>
                      <Ionicons name="barcode" size={16} color={colors.warning} />
                    </View>
                    <View>
                      <Text style={[styles.boletoName, { color: colors.textPrimary }]} numberOfLines={1}>{boleto.desc}</Text>
                      <Text style={[styles.boletoDue, { color: colors.textMuted }]}>Vence: {boleto.boletoDue || 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={styles.boletoRight}>
                    <Text style={[styles.boletoValue, { color: colors.danger }]}>{formatCurrency(boleto.amount)}</Text>
                    <TouchableOpacity
                      style={[styles.payBoletoBtnSmall, { backgroundColor: cashBalance >= boleto.amount ? colors.success : colors.textMuted }]}
                      onPress={() => handlePayBoleto(boleto)}
                      disabled={cashBalance < boleto.amount}
                    >
                      <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                      <Text style={styles.payBoletoBtnSmallText}>Quitar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mensagem quando vazio */}
        {topCards.length === 0 && topCategories.length === 0 && pendingBoletos.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="hand-left" size={48} color={colors.textMuted} />
            <Text style={[styles.hint, { color: colors.textMuted }]}>{t('add.hint')}</Text>
            <Text style={[styles.subHint, { color: colors.textMuted }]}>{t('add.subHint')}</Text>
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

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('add.description')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder={t('add.description')}
                  placeholderTextColor={colors.textMuted}
                  value={desc}
                  onChangeText={setDesc}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('add.amount')}</Text>
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
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('add.date')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
              </View>

              {/* Categorias - Scroll Horizontal (apenas para expense e boleto) */}
              {transactionType !== 'income' && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('add.category')}</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                    keyboardShouldPersistTaps="handled"
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
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('add.paymentMethod')}</Text>
                <View style={styles.paymentOptions}>
                  {paymentMethods.map(method => (
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
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('add.card')}</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.cardScroll}
                      keyboardShouldPersistTaps="handled"
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

                  {/* NOVO: Aviso de próxima fatura */}
                  {invoiceWarning && (
                    <View style={[styles.invoiceWarning, { backgroundColor: invoiceWarning.color + '15', borderColor: invoiceWarning.color + '40' }]}>
                      <Ionicons name="calendar" size={16} color={invoiceWarning.color} />
                      <Text style={[styles.invoiceWarningText, { color: invoiceWarning.color }]}>
                        {invoiceWarning.message}
                      </Text>
                    </View>
                  )}

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('add.cardType')}</Text>
                    <View style={styles.paymentOptions}>
                      {cardTypes.map(type => (
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
                <>
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('add.boletoDue')}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textMuted}
                      value={boletoDue}
                      onChangeText={setBoletoDue}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.payBoletoBtn, { backgroundColor: colors.success }]}
                    onPress={() => {
                      if (!desc || !amount) {
                        showToast(t('add.fillRequired'), 'error');
                        return;
                      }
                      const category = categories.find(c => c.id === categoryId);
                      const transaction = {
                        type: 'expense',
                        desc: desc + ' (Boleto Quitado)',
                        amount: parseFloat(amount),
                        date,
                        category: categoryId,
                        categoryName: category ? category.name : t('categories.other'),
                        categoryIcon: category ? category.icon : 'pricetag',
                        categoryColor: category ? category.color : '#94A3B8',
                        paymentMethod: 'boleto',
                        cardId: null,
                        cardType: null,
                        boletoDue,
                        isPaid: true,
                        paidAt: new Date().toISOString(),
                      };
                      addTransaction(transaction);
                      setModalVisible(false);
                      setFabOpen(false);
                      showToast('Boleto quitado com sucesso!', 'success');
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.payBoletoText}>Quitar Boleto</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: typeConfig[transactionType].color }]}
                onPress={handleSubmit}
              >
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>
                  {transactionType === 'expense' ? t('add.registerExpense') : 
                   transactionType === 'income' ? t('add.registerIncome') : t('add.registerBoleto')}
                </Text>
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
  header: { 
    paddingTop: 50, 
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  cardScroll: { paddingRight: 16, gap: 10 },
  topCard: { width: 160, padding: 14, borderRadius: 16, marginRight: 10 },
  topCardBar: { width: 40, height: 4, borderRadius: 2, marginBottom: 10 },
  topCardName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  topCardNumber: { fontSize: 11, marginBottom: 8 },
  topCardValue: { fontSize: 16, fontWeight: '700' },
  topCardLabel: { fontSize: 10, textTransform: 'uppercase', marginTop: 2 },

  categoryList: { borderRadius: 16, padding: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  categoryLeft: { flexDirection: 'row', alignItems: 'center' },
  categoryRank: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  categoryRankText: { fontSize: 12, fontWeight: '700' },
  categoryIconBg: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  categoryName: { fontSize: 14, fontWeight: '600' },
  categoryValue: { fontSize: 14, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 100 },
  hint: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  subHint: { fontSize: 13, marginTop: 4 },

  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabMenu: { position: 'absolute', right: 20, bottom: 96, alignItems: 'center', gap: 12 },
  fabItem: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700' },

  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 14, borderRadius: 12, fontSize: 16 },

  categoryScroll: { paddingRight: 16, gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginRight: 8 },

  paymentOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },

  cardChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginRight: 8 },

  // NOVO: Estilos do aviso de próxima fatura
  invoiceWarning: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 16,
    borderWidth: 1,
  },
  invoiceWarningText: { 
    fontSize: 13, 
    fontWeight: '600', 
    flex: 1,
  },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, marginTop: 8 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  payBoletoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  payBoletoText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Estilos da lista de boletos pendentes
  boletoList: { borderRadius: 16, padding: 12 },
  boletoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  boletoLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  boletoIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  boletoName: { fontSize: 14, fontWeight: '600', maxWidth: 160 },
  boletoDue: { fontSize: 11, marginTop: 2 },
  boletoRight: { alignItems: 'flex-end' },
  boletoValue: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  payBoletoBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  payBoletoBtnSmallText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});

export default AddScreen;