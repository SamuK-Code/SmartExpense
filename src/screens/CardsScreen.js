import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { FadeInView, SlideInView, ScaleInView } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';
import SimpleList from '../components/SimpleList';
import BankSelectorModal from '../components/BankSelectorModal';
import { getBankById } from '../utils/BanksData';

export default function CardsScreen() {
  const { cards, expenses, addCard, updateCard, deleteCard, getCardUsage, getCardBillAmount, generateBill, payBill } = useExpenses();
  const { colors, isDark } = useTheme();
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const handleLimitChange = (text) => {
    const numeric = text.replace(/\D/g, '');
    setCardLimit(numeric);
    const number = parseInt(numeric) / 100;
    setCardLimitDisplay(
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(number || 0)
    );
  };

  const handleDueDateChange = (text) => {
    const numeric = text.replace(/\D/g, '');
    const day = parseInt(numeric);
    if (day > 31) return;
    setDueDate(numeric);
  };

  const openAddModal = () => {
    setEditingCard(null);
    setSelectedBank(null);
    setCardLimit('');
    setCardLimitDisplay('');
    setCustomName('');
    setDueDate('');
    setModalVisible(true);
  };

  const openEditModal = (card) => {
    setEditingCard(card);
    const bank = getBankById(card.bankId);
    setSelectedBank(bank);
    const limitInCents = Math.round(card.limit * 100);
    setCardLimit(limitInCents.toString());
    setCardLimitDisplay(formatCurrency(card.limit));
    setCustomName(card.customName || '');
    setDueDate(card.dueDate ? card.dueDate.toString() : '');
    setModalVisible(true);
  };

  const handleSelectBank = (bank) => {
    setSelectedBank(bank);
    setBankSelectorVisible(false);
  };

  const handleSave = () => {
    if (!selectedBank) {
      Alert.alert(t('error'), t('selectBank'));
      return;
    }

    if (!cardLimit || cardLimit === '0') {
      Alert.alert(t('error'), t('cardLimit'));
      return;
    }

    const numericValue = parseInt(cardLimit);
    const limit = numericValue / 100;

    if (isNaN(limit) || limit <= 0) {
      Alert.alert(t('error'), t('invalidAmount'));
      return;
    }

    const dueDay = dueDate ? parseInt(dueDate) : null;
    if (dueDate && (isNaN(dueDay) || dueDay < 1 || dueDay > 31)) {
      Alert.alert(t('error'), t('invalidDate'));
      return;
    }

    const cardData = {
      bankId: selectedBank.id,
      name: selectedBank.name,
      customName: customName.trim() || selectedBank.name,
      limit: limit,
      color: selectedBank.color,
      icon: selectedBank.icon,
      dueDate: dueDay,
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
  };

  const handleDelete = (card) => {
    Alert.alert(
      t('confirm') + ' ' + t('delete'),
      t('confirmDeleteCard') + ' "' + (card.customName || card.name) + '"?\n\n' + t('cardExpensesWarning'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteCard(card.id) },
      ]
    );
  };

  const handleGenerateBill = (card) => {
    Alert.alert(
      t('bill'),
      `Gerar fatura de ${card.customName || card.name}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('yes'), onPress: () => {
          generateBill(card.id);
          Alert.alert(t('success'), t('billCreated'));
        }},
      ]
    );
  };

  const openDetailModal = (card) => {
    setSelectedCardForDetail(card);
    setDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedCardForDetail(null);
  };

  const getCardExpenses = (cardId) => {
    return expenses
      .filter(e => e.cardId === cardId && !e.billed && !e.isBill)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getCardTotal = (cardId) => {
    return expenses
      .filter(e => e.cardId === cardId && !e.billed && !e.isBill)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  };

  const renderExpenseItem = ({ item, index }) => {
    return (
      <TouchableOpacity style={[styles.expenseRow, { backgroundColor: colors.card }]}>
        <View style={styles.expenseLeft}>
          <Text style={[styles.expenseDesc, { color: colors.text }]}>{item.description}</Text>
          <Text style={[styles.expenseDate, { color: colors.textLight }]}>{formatDate(item.date)}</Text>
        </View>
        <Text style={[styles.expenseAmount, { color: colors.danger }]}>{formatCurrency(parseFloat(item.amount))}</Text>
      </TouchableOpacity>
    );
  };

  const renderCardItem = (card) => {
    const usage = getCardUsage(card.id);
    const billAmount = getCardBillAmount(card.id);
    const pct = card.limit > 0 ? (usage / card.limit) * 100 : 0;
    const remaining = card.limit - usage;
    const isPaused = card.isPaused || false;

    return (
      <TouchableOpacity
        style={[styles.cardItem, {
          backgroundColor: colors.card,
          borderLeftColor: isPaused ? colors.warning : card.color || colors.primary,
        }]}
        onPress={() => openDetailModal(card)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardIcon, { backgroundColor: (card.color || colors.primary) + '15' }]}>
              <Ionicons name={card.icon || 'card'} size={22} color={card.color || colors.primary} />
            </View>
            <View style={styles.cardTitleInfo}>
              <Text style={[styles.cardName, { color: colors.text }]}>{card.customName || card.name}</Text>
              <Text style={[styles.cardLimit, { color: colors.textLight }]}>
                {t('limit')}: {formatCurrency(card.limit)}
                {card.dueDate ? ` • ${t('dueDateShort')}: ${card.dueDate}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
              onPress={() => openEditModal(card)}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.danger + '15' }]}
              onPress={() => handleDelete(card)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {isPaused && (
          <View style={[styles.pausedBadge, { backgroundColor: colors.warning + '15' }]}>
            <Ionicons name="pause-circle" size={14} color={colors.warning} />
            <Text style={[styles.pausedText, { color: colors.warning }]}>
              {t('cardPaused')} • {t('billAmount')}: {formatCurrency(billAmount)}
            </Text>
          </View>
        )}

        <View style={styles.usageSection}>
          <View style={styles.usageRow}>
            <Text style={[styles.usageLabel, { color: colors.textLight }]}>{t('used')}</Text>
            <Text style={[styles.usageValue, { color: colors.text }]}>{formatCurrency(usage)}</Text>
          </View>
          <View style={styles.usageRow}>
            <Text style={[styles.usageLabel, { color: colors.textLight }]}>{t('available')}</Text>
            <Text style={[styles.usageValue, { color: colors.text }]}>{formatCurrency(remaining)}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, {
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: pct >= 100 ? colors.danger : pct >= 80 ? colors.warning : colors.primary,
            }]} />
          </View>
          <Text style={[styles.progressText, {
            color: pct >= 100 ? colors.danger : pct >= 80 ? colors.warning : colors.primary,
          }]}>
            {pct.toFixed(1)}% {t('used')}
          </Text>
        </View>

        {pct >= 100 && (
          <View style={[styles.alertBadge, { backgroundColor: colors.danger + '15' }]}>
            <Ionicons name="warning" size={12} color={colors.danger} />
            <Text style={[styles.alertText, { color: colors.danger }]}>{t('limitExceeded')}</Text>
          </View>
        )}
        {pct >= 80 && pct < 100 && (
          <View style={[styles.alertBadge, { backgroundColor: colors.warning + '15' }]}>
            <Ionicons name="alert-circle" size={12} color={colors.warning} />
            <Text style={[styles.alertText, { color: colors.warning }]}>{t('nearLimit')}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <TouchableOpacity onPress={() => openDetailModal(card)}>
            <Text style={[styles.viewDetailsText, { color: colors.primary }]}>{t('viewExpenses')}</Text>
          </TouchableOpacity>
          <Text style={[styles.expenseCount, { color: colors.textLight }]}>
            {getCardExpenses(card.id).length} {t('transactions')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('myCards')} />
      <SimpleList
        data={cards}
        renderItem={(item) => renderCardItem(item)}
        keyExtractor={item => item.id}
        emptyTitle={t('noCardExpenses')}
        emptySubtitle={t('addFirstExpense')}
        emptyIcon="card-outline"
        onAddPress={openAddModal}
        addButtonText={t('add') + ' ' + t('card')}
      />

      {cards.length > 0 && (
        <View style={styles.cardsList}>
          {cards.map(card => (
            <View key={card.id} style={{ marginHorizontal: 16, marginBottom: 12 }}>
              {renderCardItem(card)}
            </View>
          ))}
        </View>
      )}

      {/* Modal de Detalhes */}
      <Modal visible={detailModalVisible} animationType="slide" transparent onRequestClose={closeDetailModal}>
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
                <TouchableOpacity onPress={closeDetailModal}>
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
                    <Text style={[styles.summaryItemValue, { color: colors.danger }]}>{formatCurrency(getCardTotal(selectedCardForDetail.id))}</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryItemLabel, { color: colors.textLight }]}>{t('available')}</Text>
                    <Text style={[styles.summaryItemValue, { color: colors.primary }]}>{formatCurrency(Math.max(0, selectedCardForDetail.limit - getCardTotal(selectedCardForDetail.id)))}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.detailActionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    closeDetailModal();
                    openEditModal(selectedCardForDetail);
                  }}
                >
                  <Ionicons name="create" size={18} color="#fff" />
                  <Text style={styles.detailActionText}>{t('editCard')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailActionBtn, { backgroundColor: colors.danger }]}
                  onPress={() => {
                    handleDelete(selectedCardForDetail);
                    closeDetailModal();
                  }}
                >
                  <Ionicons name="trash" size={18} color="#fff" />
                  <Text style={styles.detailActionText}>{t('delete') + ' ' + t('card')}</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.expensesSectionTitle, { color: colors.text }]}>{t('cardExpenses')}</Text>

              {getCardExpenses(selectedCardForDetail.id).length === 0 ? (
                <View style={styles.noExpenses}>
                  <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
                  <Text style={[styles.noExpensesText, { color: colors.textLight }]}>{t('noCardExpenses')}</Text>
                </View>
              ) : (
                <FlatList
                  data={getCardExpenses(selectedCardForDetail.id)}
                  renderItem={renderExpenseItem}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  style={styles.expensesList}
                  contentContainerStyle={styles.expensesListContent}
                />
              )}
            </View>
          </View>
        )}
      </Modal>

      {/* Modal de Adicionar/Editar */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingCard ? t('editCard') : t('newCard')}</Text>

            <TouchableOpacity
              style={[styles.bankSelector, { backgroundColor: colors.background }]}
              onPress={() => setBankSelectorVisible(true)}
            >
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
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
              value={customName}
              onChangeText={setCustomName}
              placeholder={t('cardName')}
              placeholderTextColor={colors.textLight}
            />

            <Text style={[styles.modalLabel, { color: colors.text }]}>{t('cardLimit')}</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
              value={cardLimitDisplay}
              onChangeText={handleLimitChange}
              placeholder="R$ 0,00"
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
            />

            <Text style={[styles.modalLabel, { color: colors.text }]}>{t('dueDate')}</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
              value={dueDate}
              onChangeText={handleDueDateChange}
              placeholder="Dia do mês (1-31)"
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
              maxLength={2}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.danger + '15' }]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingCard(null);
                  setSelectedBank(null);
                  setCardLimit('');
                  setCardLimitDisplay('');
                  setCustomName('');
                  setDueDate('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.danger }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.modalButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BankSelectorModal
        visible={bankSelectorVisible}
        onSelect={handleSelectBank}
        onClose={() => setBankSelectorVisible(false)}
        selectedBankId={selectedBank?.id}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={openAddModal}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  cardsList: { paddingTop: 8 },

  cardItem: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: 'bold' },
  cardLimit: { fontSize: 12, marginTop: 2 },

  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pausedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  pausedText: { fontSize: 12, fontWeight: '600' },

  usageSection: { marginBottom: 10 },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  usageLabel: { fontSize: 13 },
  usageValue: { fontSize: 13, fontWeight: '600' },
  progressSection: { marginTop: 4 },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  alertText: { fontSize: 12, fontWeight: '600' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  viewDetailsText: { fontSize: 13, fontWeight: '600' },
  expenseCount: { fontSize: 12 },

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

  detailOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  detailModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
    paddingBottom: 30,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailTitle: { fontSize: 20, fontWeight: 'bold' },
  detailSubtitle: { fontSize: 14, marginTop: 2, opacity: 0.7 },

  detailSummary: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryItemLabel: { fontSize: 11, marginBottom: 4, opacity: 0.7 },
  summaryItemValue: { fontSize: 15, fontWeight: 'bold' },
  summaryDivider: {
    width: 1,
    height: 40,
  },

  detailActions: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  detailActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  detailActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  expensesSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  expensesList: {
    maxHeight: 350,
    marginHorizontal: 16,
  },
  expensesListContent: {
    paddingBottom: 20,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  expenseLeft: { flex: 1 },
  expenseDesc: { fontSize: 14, fontWeight: '500' },
  expenseDate: { fontSize: 11, marginTop: 2, opacity: 0.7 },
  expenseAmount: { fontSize: 14, fontWeight: 'bold', marginLeft: 12 },

  noExpenses: {
    alignItems: 'center',
    padding: 40,
  },
  noExpensesText: {
    fontSize: 14,
    marginTop: 12,
    opacity: 0.7,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  selectedBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedBankIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedBankName: { fontSize: 15, fontWeight: '600' },
  selectedBankType: { fontSize: 12, marginTop: 2 },
  selectBankPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectBankText: { marginLeft: 10, fontSize: 15 },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
