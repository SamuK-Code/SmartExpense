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
  const { cards, expenses, addCard, updateCard, deleteCard, getCardUsage } = useExpenses();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();

  const [modalVisible, setModalVisible] = useState(false);
  const [bankSelectorVisible, setBankSelectorVisible] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [cardLimit, setCardLimit] = useState('');
  const [cardLimitDisplay, setCardLimitDisplay] = useState('');
  const [customName, setCustomName] = useState('');

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

  const openAddModal = () => {
    setEditingCard(null);
    setSelectedBank(null);
    setCardLimit('');
    setCardLimitDisplay('');
    setCustomName('');
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

    const cardData = {
      bankId: selectedBank.id,
      name: selectedBank.name,
      customName: customName.trim() || selectedBank.name,
      limit: limit,
      color: selectedBank.color,
      icon: selectedBank.icon,
    };

    if (editingCard) {
      updateCard(editingCard.id, cardData);
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
      .filter(e => e.cardId === cardId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getCardTotal = (cardId) => {
    return expenses
      .filter(e => e.cardId === cardId)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  };

  const renderExpenseItem = ({ item, index }) => {
    return (
      <SlideInView delay={index * 40}>
        <View style={[styles.expenseRow, { backgroundColor: colors.inputBg }]}>
          <View style={styles.expenseLeft}>
            <Text style={[styles.expenseDesc, { color: colors.text }]}>{item.description}</Text>
            <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>{formatDate(item.date)}</Text>
          </View>
          <Text style={[styles.expenseAmount, { color: colors.danger }]}>
            {formatCurrency(parseFloat(item.amount))}
          </Text>
        </View>
      </SlideInView>
    );
  };

  const renderCardItem = (card) => {
    const usage = getCardUsage(card.id);
    const pct = card.limit > 0 ? (usage / card.limit) * 100 : 0;
    const remaining = card.limit - usage;

    return (
      <View style={[styles.cardItem, { backgroundColor: colors.card, borderLeftColor: card.color }]}>
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.cardTitleRow}
            onPress={() => openDetailModal(card)}
            activeOpacity={0.7}
          >
            <View style={[styles.cardIcon, { backgroundColor: card.color + '20' }]}>
              <Ionicons name={card.icon || 'card-outline'} size={22} color={card.color} />
            </View>
            <View style={styles.cardTitleInfo}>
              <Text style={[styles.cardName, { color: colors.text }]}>{card.customName || card.name}</Text>
              <Text style={[styles.cardLimit, { color: colors.textSecondary }]}>
                {t('limit')}: {formatCurrency(card.limit)}
              </Text>
            </View>
          </TouchableOpacity>

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

        <TouchableOpacity onPress={() => openDetailModal(card)} activeOpacity={0.7}>
          <View style={styles.usageSection}>
            <View style={styles.usageRow}>
              <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>{t('used')}</Text>
              <Text style={[styles.usageValue, { color: colors.text }]}>{formatCurrency(usage)}</Text>
            </View>
            <View style={styles.usageRow}>
              <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>{t('available')}</Text>
              <Text style={[styles.usageValue, { color: remaining < 0 ? colors.danger : colors.primary }]}>
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]}>
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
            <View style={[styles.alertBadge, { backgroundColor: colors.danger + '20' }]}>
              <Ionicons name="warning-outline" size={14} color={colors.danger} />
              <Text style={[styles.alertText, { color: colors.danger }]}>{t('limitExceeded')}</Text>
            </View>
          )}
          {pct >= 80 && pct < 100 && (
            <View style={[styles.alertBadge, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
              <Text style={[styles.alertText, { color: colors.warning }]}>{t('nearLimit')}</Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
              {t('viewExpenses')} <Ionicons name="chevron-forward" size={12} color={colors.primary} />
            </Text>
            <Text style={[styles.expenseCount, { color: colors.textSecondary }]}>
              {getCardExpenses(card.id).length} {t('transactions')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('myCards')} />

      <View style={styles.content}>
        <SimpleList
          data={cards}
          renderItem={renderCardItem}
          keyExtractor={(item) => item.id}
          emptyTitle={t('noCardExpenses')}
          emptySubtitle={t('addFirstExpense')}
          emptyIcon="card-outline"
          onAddPress={openAddModal}
          addButtonText={t('add') + ' ' + t('card')}
        />
      </View>

      {cards.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={openAddModal}
        >
          <Ionicons name="add-outline" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal de Detalhes */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDetailModal}
      >
        <View style={[styles.detailOverlay, { backgroundColor: colors.overlay || 'rgba(0,0,0,0.6)' }]}>
          <SlideInView>
            <View style={[styles.detailModal, { backgroundColor: colors.background }]}>
              {selectedCardForDetail && (
                <>
                  <View style={[styles.detailHeader, { backgroundColor: colors.card }]}>
                    <View style={styles.detailHeaderLeft}>
                      <View style={[styles.detailIcon, { backgroundColor: selectedCardForDetail.color + '20' }]}>
                        <Ionicons name={selectedCardForDetail.icon || 'card-outline'} size={28} color={selectedCardForDetail.color} />
                      </View>
                      <View>
                        <Text style={[styles.detailTitle, { color: colors.text }]}>
                          {selectedCardForDetail.customName || selectedCardForDetail.name}
                        </Text>
                        <Text style={[styles.detailSubtitle, { color: colors.textSecondary }]}>
                          {getBankById(selectedCardForDetail.bankId)?.name || t('cardBank')}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={closeDetailModal}>
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.detailSummary, { backgroundColor: colors.card }]}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryItemLabel, { color: colors.textSecondary }]}>{t('limit')}</Text>
                        <Text style={[styles.summaryItemValue, { color: colors.text }]}>
                          {formatCurrency(selectedCardForDetail.limit)}
                        </Text>
                      </View>
                      <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryItemLabel, { color: colors.textSecondary }]}>{t('used')}</Text>
                        <Text style={[styles.summaryItemValue, { color: colors.danger }]}>
                          {formatCurrency(getCardTotal(selectedCardForDetail.id))}
                        </Text>
                      </View>
                      <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryItemLabel, { color: colors.textSecondary }]}>{t('available')}</Text>
                        <Text style={[styles.summaryItemValue, { color: colors.success }]}>
                          {formatCurrency(Math.max(0, selectedCardForDetail.limit - getCardTotal(selectedCardForDetail.id)))}
                        </Text>
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
                      <Ionicons name="create-outline" size={20} color="#fff" />
                      <Text style={styles.detailActionText}>{t('editCard')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.detailActionBtn, { backgroundColor: colors.danger }]} 
                      onPress={() => {
                        handleDelete(selectedCardForDetail);
                        closeDetailModal();
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                      <Text style={styles.detailActionText}>{t('delete') + ' ' + t('card')}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.expensesSectionTitle, { color: colors.text }]}>
                    {t('cardExpenses')}
                  </Text>

                  {getCardExpenses(selectedCardForDetail.id).length === 0 ? (
                    <View style={styles.noExpenses}>
                      <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
                      <Text style={[styles.noExpensesText, { color: colors.textSecondary }]}>
                        {t('noCardExpenses')}
                      </Text>
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
                </>
              )}
            </View>
          </SlideInView>
        </View>
      </Modal>

      {/* Modal de Adicionar/Editar */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScaleInView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCard ? t('editCard') : t('newCard')}
              </Text>

              <TouchableOpacity
                style={[styles.bankSelector, { backgroundColor: colors.inputBg }]}
                onPress={() => setBankSelectorVisible(true)}
              >
                {selectedBank ? (
                  <View style={styles.selectedBankRow}>
                    <View style={[styles.selectedBankIcon, { backgroundColor: selectedBank.color + '20' }]}>
                      <Ionicons name={selectedBank.icon} size={24} color={selectedBank.color} />
                    </View>
                    <View>
                      <Text style={[styles.selectedBankName, { color: colors.text }]}>{selectedBank.name}</Text>
                      <Text style={[styles.selectedBankType, { color: colors.textSecondary }]}>
                        {t('selectBank')}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.selectBankPlaceholder}>
                    <Ionicons name="card-outline" size={24} color={colors.textLight} />
                    <Text style={[styles.selectBankText, { color: colors.textLight }]}>{t('selectBank')}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward-outline" size={20} color={colors.textLight} />
              </TouchableOpacity>

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('cardNickname')}</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="Ex: Meu Nubank"
                value={customName}
                onChangeText={setCustomName}
                placeholderTextColor={colors.textLight}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('cardLimit')}</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="R$ 0,00"
                keyboardType="numeric"
                value={cardLimitDisplay}
                onChangeText={handleLimitChange}
                placeholderTextColor={colors.textLight}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => {
                  setModalVisible(false);
                  setEditingCard(null);
                  setSelectedBank(null);
                  setCardLimit('');
                  setCardLimitDisplay('');
                  setCustomName('');
                }}>
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
                  <Text style={styles.modalButtonText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScaleInView>
        </View>
      </Modal>

      <BankSelectorModal
        visible={bankSelectorVisible}
        onSelect={handleSelectBank}
        onClose={() => setBankSelectorVisible(false)}
        selectedBankId={selectedBank?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },

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
  },
  alertText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },

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
