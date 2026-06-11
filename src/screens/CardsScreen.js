import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, FlatList, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import AppHeader from '../components/AppHeader';
import SimpleList from '../components/SimpleList';
import CardItem from '../components/CardItem';
import BankSelectorModal from '../components/BankSelectorModal';
import { getBankById } from '../utils/BanksData';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

export default function CardsScreen() {
  const { cards, expenses, addCard, updateCard, deleteCard, getCardUsage, getCardBillAmount, generateBill } = useExpenses();
  const { colors } = useTheme();
  const { t } = useI18n();

  const [modalVisible, setModalVisible] = useState(false);
  const [bankSelectorVisible, setBankSelectorVisible] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [cardLimit, setCardLimit] = useState('');
  const [cardLimitDisplay, setCardLimitDisplay] = useState('');
  const [customName, setCustomName] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState(null);

  const handleLimitChange = useCallback((text) => {
    const numeric = text.replace(/\D/g, '');
    setCardLimit(numeric);
    const number = parseInt(numeric) / 100;
    setCardLimitDisplay(formatCurrency(number || 0));
  }, []);

  const handleDueDateChange = useCallback((text) => {
    const numeric = text.replace(/\D/g, '');
    const day = parseInt(numeric);
    if (day > 31) return;
    setDueDate(numeric);
  }, []);

  const openAddModal = useCallback(() => {
    setEditingCard(null);
    setSelectedBank(null);
    setCardLimit('');
    setCardLimitDisplay('');
    setCustomName('');
    setDueDate('');
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((card) => {
    setEditingCard(card);
    const bank = getBankById(card.bankId);
    setSelectedBank(bank);
    const limitInCents = Math.round(card.limit * 100);
    setCardLimit(limitInCents.toString());
    setCardLimitDisplay(formatCurrency(card.limit));
    setCustomName(card.customName || '');
    setDueDate(card.dueDate ? card.dueDate.toString() : '');
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedBank) { Alert.alert(t('error'), t('selectBank')); return; }
    if (!cardLimit || cardLimit === '0') { Alert.alert(t('error'), t('cardLimit')); return; }
    const limit = parseInt(cardLimit) / 100;
    if (isNaN(limit) || limit <= 0) { Alert.alert(t('error'), t('invalidAmount')); return; }
    const dueDay = dueDate ? parseInt(dueDate) : null;
    if (dueDate && (isNaN(dueDay) || dueDay < 1 || dueDay > 31)) { Alert.alert(t('error'), t('invalidDate')); return; }

    const cardData = {
      bankId: selectedBank.id, name: selectedBank.name,
      customName: customName.trim() || selectedBank.name,
      limit, color: selectedBank.color, icon: selectedBank.icon, dueDate: dueDay,
    };

    if (editingCard) {
      updateCard(editingCard.id, { ...cardData, isPaused: editingCard.isPaused, currentBillAmount: editingCard.currentBillAmount, lastBillDate: editingCard.lastBillDate });
      Alert.alert(t('success'), t('cardUpdated'));
    } else {
      addCard(cardData);
      Alert.alert(t('success'), t('cardAdded'));
    }
    setModalVisible(false);
    setEditingCard(null);
    setSelectedBank(null);
    setCardLimit('');
    setCardLimitDisplay('');
    setCustomName('');
    setDueDate('');
  }, [selectedBank, cardLimit, customName, dueDate, editingCard, addCard, updateCard, t]);

  const handleDelete = useCallback((card) => {
    Alert.alert(t('confirm') + ' ' + t('delete'), `${t('confirmDeleteCard')} "${card.customName || card.name}"?\n\n${t('cardExpensesWarning')}`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteCard(card.id) },
    ]);
  }, [deleteCard, t]);

  const openDetailModal = useCallback((card) => {
    setSelectedCardForDetail(card);
    setDetailModalVisible(true);
  }, []);

  const cardExpenses = useMemo(() => {
    if (!selectedCardForDetail) return [];
    return expenses
      .filter(e => e.cardId === selectedCardForDetail.id && !e.billed && !e.isBill)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, selectedCardForDetail]);

  const cardTotal = useMemo(() => {
    if (!selectedCardForDetail) return 0;
    return expenses
      .filter(e => e.cardId === selectedCardForDetail.id && !e.billed && !e.isBill)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  }, [expenses, selectedCardForDetail]);

  const renderCard = useCallback((item) => (
    <CardItem
      card={item}
      usage={getCardUsage(item.id)}
      colors={colors}
      t={t}
      onPress={openDetailModal}
      onEdit={openEditModal}
      onDelete={handleDelete}
    />
  ), [colors, t, getCardUsage, openDetailModal, openEditModal, handleDelete]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('myCards')} />
      <SimpleList
        data={cards}
        renderItem={(item) => renderCard(item)}
        keyExtractor={item => item.id}
        emptyTitle={t('noCardExpenses')}
        emptySubtitle={t('addFirstExpense')}
        emptyIcon="card-outline"
        onAddPress={openAddModal}
        addButtonText={t('add') + ' ' + t('card')}
      />

      {/* Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent onRequestClose={() => setDetailModalVisible(false)}>
        {selectedCardForDetail && (
          <View style={styles.detailOverlay}>
            <View style={[styles.detailModal, { backgroundColor: colors.background }]}>
              <View style={[styles.detailHeader, { backgroundColor: colors.card }]}>
                <View style={styles.detailHeaderLeft}>
                  <View style={[styles.detailIcon, { backgroundColor: (selectedCardForDetail.color || colors.primary) + '15' }]}>
                    <Ionicons name={selectedCardForDetail.icon || 'card'} size={28} color={selectedCardForDetail.color || colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.detailTitle, { color: colors.text }]}>{selectedCardForDetail.customName || selectedCardForDetail.name}</Text>
                    <Text style={[styles.detailSubtitle, { color: colors.textLight }]}>{getBankById(selectedCardForDetail.bankId)?.name || t('cardBank')}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={[styles.detailSummary, { backgroundColor: colors.card }]}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryItemLabel, { color: colors.textLight }]}>{t('limit')}</Text>
                    <Text style={[styles.summaryItemValue, { color: colors.text }]}>{formatCurrency(selectedCardForDetail.limit)}</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryItemLabel, { color: colors.textLight }]}>{t('used')}</Text>
                    <Text style={[styles.summaryItemValue, { color: colors.danger }]}>{formatCurrency(cardTotal)}</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryItemLabel, { color: colors.textLight }]}>{t('available')}</Text>
                    <Text style={[styles.summaryItemValue, { color: colors.primary }]}>{formatCurrency(Math.max(0, selectedCardForDetail.limit - cardTotal))}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailActions}>
                <TouchableOpacity style={[styles.detailActionBtn, { backgroundColor: colors.primary }]} onPress={() => { setDetailModalVisible(false); openEditModal(selectedCardForDetail); }}>
                  <Ionicons name="create" size={18} color="#fff" />
                  <Text style={styles.detailActionText}>{t('editCard')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.detailActionBtn, { backgroundColor: colors.danger }]} onPress={() => { handleDelete(selectedCardForDetail); setDetailModalVisible(false); }}>
                  <Ionicons name="trash" size={18} color="#fff" />
                  <Text style={styles.detailActionText}>{t('delete') + ' ' + t('card')}</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.expensesSectionTitle, { color: colors.text }]}>{t('cardExpenses')}</Text>
              {cardExpenses.length === 0 ? (
                <View style={styles.noExpenses}>
                  <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
                  <Text style={[styles.noExpensesText, { color: colors.textLight }]}>{t('noCardExpenses')}</Text>
                </View>
              ) : (
                <FlatList
                  data={cardExpenses}
                  renderItem={({ item }) => (
                    <View style={[styles.expenseRow, { backgroundColor: colors.card }]}>
                      <View style={styles.expenseLeft}>
                        <Text style={[styles.expenseDesc, { color: colors.text }]}>{item.description}</Text>
                        <Text style={[styles.expenseDate, { color: colors.textLight }]}>{formatDate(item.date)}</Text>
                      </View>
                      <Text style={[styles.expenseAmount, { color: colors.danger }]}>{formatCurrency(parseFloat(item.amount))}</Text>
                    </View>
                  )}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  style={styles.expensesList}
                  contentContainerStyle={styles.expensesListContent}
                  removeClippedSubviews={true}
                />
              )}
            </View>
          </View>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingCard ? t('editCard') : t('newCard')}</Text>
            <TouchableOpacity style={[styles.bankSelector, { backgroundColor: colors.background }]} onPress={() => setBankSelectorVisible(true)}>
              {selectedBank ? (
                <View style={styles.selectedBankRow}>
                  <View style={[styles.selectedBankIcon, { backgroundColor: selectedBank.color + '15' }]}>
                    <Ionicons name={selectedBank.icon} size={22} color={selectedBank.color} />
                  </View>
                  <View>
                    <Text style={[styles.selectedBankName, { color: colors.text }]}>{selectedBank.name}</Text>
                    <Text style={[styles.selectedBankType, { color: colors.textLight }]}>{selectedBank.type}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.selectBankPlaceholder}>
                  <Ionicons name="business-outline" size={22} color={colors.textLight} />
                  <Text style={[styles.selectBankText, { color: colors.textLight }]}>{t('selectBank')}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>

            <Text style={[styles.modalLabel, { color: colors.text }]}>{t('cardNickname')}</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]} value={customName} onChangeText={setCustomName} placeholder={t('cardName')} placeholderTextColor={colors.textLight} />

            <Text style={[styles.modalLabel, { color: colors.text }]}>{t('cardLimit')}</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]} value={cardLimitDisplay} onChangeText={handleLimitChange} placeholder="R$ 0,00" placeholderTextColor={colors.textLight} keyboardType="numeric" />

            <Text style={[styles.modalLabel, { color: colors.text }]}>{t('dueDate')}</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]} value={dueDate} onChangeText={handleDueDateChange} placeholder={t('dayOfMonth')} placeholderTextColor={colors.textLight} keyboardType="numeric" maxLength={2} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.danger + '15' }]} onPress={() => { setModalVisible(false); setEditingCard(null); }}>
                <Text style={[styles.modalButtonText, { color: colors.danger }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
                <Text style={styles.modalButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BankSelectorModal visible={bankSelectorVisible} onSelect={setSelectedBank} onClose={() => setBankSelectorVisible(false)} selectedBankId={selectedBank?.id} />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={openAddModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  detailOverlay: { flex: 1, justifyContent: 'flex-end' },
  detailModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', minHeight: '60%', paddingBottom: 30 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  detailHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  detailTitle: { fontSize: 20, fontWeight: 'bold' },
  detailSubtitle: { fontSize: 14, marginTop: 2, opacity: 0.7 },
  detailSummary: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryItemLabel: { fontSize: 11, marginBottom: 4, opacity: 0.7 },
  summaryItemValue: { fontSize: 15, fontWeight: 'bold' },
  summaryDivider: { width: 1, height: 40 },
  detailActions: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 20 },
  detailActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  detailActionText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  expensesSectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 16, marginBottom: 12 },
  expensesList: { maxHeight: 350, marginHorizontal: 16 },
  expensesListContent: { paddingBottom: 20 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8 },
  expenseLeft: { flex: 1 },
  expenseDesc: { fontSize: 14, fontWeight: '500' },
  expenseDate: { fontSize: 11, marginTop: 2, opacity: 0.7 },
  expenseAmount: { fontSize: 14, fontWeight: 'bold', marginLeft: 12 },
  noExpenses: { alignItems: 'center', padding: 40 },
  noExpensesText: { fontSize: 14, marginTop: 12, opacity: 0.7 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 340, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  bankSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, marginBottom: 16 },
  selectedBankRow: { flexDirection: 'row', alignItems: 'center' },
  selectedBankIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  selectedBankName: { fontSize: 15, fontWeight: '600' },
  selectedBankType: { fontSize: 12, marginTop: 2 },
  selectBankPlaceholder: { flexDirection: 'row', alignItems: 'center' },
  selectBankText: { marginLeft: 10, fontSize: 15 },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalInput: { borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
