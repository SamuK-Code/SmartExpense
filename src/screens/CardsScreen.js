// CardsScreen.js — COM SISTEMA DE FATURAS E QUITAÇÃO + KEYBOARDAVOIDINGVIEW
// CORREÇÃO: Adicionado KeyboardAvoidingView nos modais de add/edit

import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert, 
  Dimensions, 
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { formatCurrency, getCardGradientColors, isCardTemplate, getCardTemplateImage, isCardSolid, getDaysUntilClosing } from '../utils/helpers';
import CreditCard from '../components/CreditCard';
import Toast from '../components/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BRAZILIAN_BANKS = [
  { code: '001', name: 'Banco do Brasil', shortName: 'Banco do Brasil' },
  { code: '104', name: 'Caixa Econômica Federal', shortName: 'Caixa' },
  { code: '237', name: 'Bradesco', shortName: 'Bradesco' },
  { code: '341', name: 'Itaú Unibanco', shortName: 'Itaú' },
  { code: '033', name: 'Santander', shortName: 'Santander' },
  { code: '077', name: 'Banco Inter', shortName: 'Inter' },
  { code: '260', name: 'Nubank', shortName: 'Nubank' },
  { code: '336', name: 'C6 Bank', shortName: 'C6 Bank' },
  { code: '212', name: 'Banco Original', shortName: 'Original' },
  { code: '422', name: 'Banco Safra', shortName: 'Safra' },
  { code: '745', name: 'Citibank', shortName: 'Citi' },
  { code: '623', name: 'Banco PAN', shortName: 'PAN' },
  { code: '707', name: 'Banco Daycoval', shortName: 'Daycoval' },
  { code: '655', name: 'Banco Votorantim', shortName: 'BV' },
  { code: '318', name: 'Banco BMG', shortName: 'BMG' },
  { code: '070', name: 'Banco de Brasília (BRB)', shortName: 'BRB' },
  { code: '041', name: 'Banrisul', shortName: 'Banrisul' },
  { code: '047', name: 'Banese', shortName: 'Banese' },
  { code: '004', name: 'Banco do Nordeste', shortName: 'BNB' },
  { code: '003', name: 'Banco da Amazônia', shortName: 'Basa' },
  { code: '021', name: 'Banestes', shortName: 'Banestes' },
  { code: '748', name: 'Sicredi', shortName: 'Sicredi' },
  { code: '756', name: 'Sicoob', shortName: 'Sicoob' },
  { code: '121', name: 'Agibank', shortName: 'Agibank' },
  { code: '380', name: 'PicPay', shortName: 'PicPay' },
  { code: '290', name: 'PagBank', shortName: 'PagBank' },
  { code: '254', name: 'Paraná Banco', shortName: 'Paraná Banco' },
  { code: '208', name: 'BTG Pactual', shortName: 'BTG' },
  { code: '376', name: 'Banco JP Morgan', shortName: 'JP Morgan' },
  { code: '064', name: 'Goldman Sachs', shortName: 'Goldman Sachs' },
];

const CardsScreen = () => {
  const { 
    cards, 
    transactions, 
    cardGradients, 
    addCard, 
    deleteCard, 
    editCard, 
    getCardUsage,
    cardInvoices,
    payInvoice,
    getCardPendingInvoices,
    getCardInvoices,
  } = useApp();
  const { colors } = useTheme();
  const { t } = useTranslate();

  // Modal de adicionar cartão
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [number, setNumber] = useState('');
  const [limit, setLimit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(cardGradients[0]?.class || 'card-gradient-purple');

  // Modal de detalhes do cartão
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // Modal de editar cartão
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBank, setEditBank] = useState(null);
  const [editLimit, setEditLimit] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editGradient, setEditGradient] = useState('');

  // Modal de seleção de banco
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankModalMode, setBankModalMode] = useState('add'); // 'add' ou 'edit'

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  // Filtrar transações do cartão selecionado
  const cardTransactions = useMemo(() => {
    if (!selectedCard) return [];
    return transactions
      .filter(t => t.cardId === selectedCard.id && t.type === 'expense' && !t.isInvoicePayment)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedCard, transactions]);

  // NOVO: Pegar faturas pendentes do cartão selecionado
  const pendingInvoices = useMemo(() => {
    if (!selectedCard) return [];
    return getCardPendingInvoices(selectedCard.id);
  }, [selectedCard, getCardPendingInvoices, cardInvoices]);

  // NOVO: Pegar todas as faturas do cartão
  const allInvoices = useMemo(() => {
    if (!selectedCard) return [];
    return getCardInvoices(selectedCard.id);
  }, [selectedCard, getCardInvoices, cardInvoices]);

  // Calcular uso e progresso
  const getCardProgress = (card) => {
    const used = getCardUsage(card.id);
    const available = card.limit - used;
    const percentage = (used / card.limit) * 100;
    const availablePercentage = (available / card.limit) * 100;
    return { used, available, percentage, availablePercentage };
  };

  const getProgressColor = (availablePercentage) => {
    if (availablePercentage <= 10) return '#EF4444';
    if (availablePercentage <= 25) return '#F59E0B';
    return '#10B981';
  };

  const handleAddCard = () => {
    if (!selectedBank || !limit || !dueDate) {
      showToast(t('add.fillRequired'), 'error');
      return;
    }

    const selectedGradientObj = cardGradients.find(g => g.class === selectedGradient) || cardGradients[0];
    // Fechamento é calculado: 7 dias antes do vencimento
    const dueDay = parseInt(dueDate, 10);
    let closeDay = dueDay - 7;
    if (closeDay <= 0) closeDay += 30;
    const closeDateStr = String(closeDay).padStart(2, '0');

    const card = {
      name: selectedBank.name,
      bankCode: selectedBank.code,
      shortName: selectedBank.shortName,
      number: number ? `**** ${number.padStart(4, '0')}` : '**** 0000',
      limit: parseFloat(limit),
      closeDate: closeDateStr,
      dueDate,
      gradientClass: selectedGradient,
      color: selectedGradientObj.color,
    };

    addCard(card);
    setModalVisible(false);
    resetForm();
    showToast(t('cards.added'));
  };

  const resetForm = () => {
    setSelectedBank(null);
    setNumber('');
    setLimit('');
    setDueDate('');
    setSelectedGradient(cardGradients[0]?.class || 'card-gradient-purple');
    setBankSearch('');
  };

  const handleDeleteCard = (id) => {
    Alert.alert(
      t('cards.confirmDeleteTitle'),
      t('cards.confirmDeleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: () => {
            deleteCard(id);
            setDetailModalVisible(false);
            showToast(t('cards.deleted'), 'warning');
          }
        },
      ]
    );
  };

  const openCardDetail = (card) => {
    setSelectedCard(card);
    setDetailModalVisible(true);
  };

  const openEditModal = () => {
    if (!selectedCard) return;
    const bank = BRAZILIAN_BANKS.find(b => b.code === selectedCard.bankCode) || 
                 BRAZILIAN_BANKS.find(b => b.name === selectedCard.name) ||
                 { code: '000', name: selectedCard.name, shortName: selectedCard.name };
    setEditBank(bank);
    setEditLimit(selectedCard.limit.toString());
    setEditDueDate(selectedCard.dueDate || '');
    setEditGradient(selectedCard.gradientClass);
    setEditModalVisible(true);
  };

  const handleEditCard = () => {
    if (!editBank || !editLimit || !editDueDate) {
      showToast(t('add.fillRequired'), 'error');
      return;
    }

    const selectedGradientObj = cardGradients.find(g => g.class === editGradient) || cardGradients[0];
    // Fechamento é calculado: 7 dias antes do vencimento
    const dueDay = parseInt(editDueDate, 10);
    let closeDay = dueDay - 7;
    if (closeDay <= 0) closeDay += 30;
    const closeDateStr = String(closeDay).padStart(2, '0');

    editCard(selectedCard.id, {
      name: editBank.name,
      bankCode: editBank.code,
      shortName: editBank.shortName,
      limit: parseFloat(editLimit),
      closeDate: closeDateStr,
      dueDate: editDueDate,
      gradientClass: editGradient,
      color: selectedGradientObj.color,
    });

    setSelectedCard(prev => ({
      ...prev,
      name: editBank.name,
      bankCode: editBank.code,
      shortName: editBank.shortName,
      limit: parseFloat(editLimit),
      closeDate: closeDateStr,
      dueDate: editDueDate,
      gradientClass: editGradient,
      color: selectedGradientObj.color,
    }));

    setEditModalVisible(false);
    showToast(t('cards.updated'));
  };

  // NOVO: Handler para quitar fatura
  const handlePayInvoice = (invoice) => {
    Alert.alert(
      t('cards.payInvoice'),
      `${t('common.confirm')} ${t('cards.payInvoice').toLowerCase()} ${invoice.cardName} ${t('common.value').toLowerCase()} ${formatCurrency(invoice.totalAmount)}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('cards.payInvoice'),
          style: 'default',
          onPress: () => {
            const success = payInvoice(invoice.id);
            if (success) {
              showToast(t('invoices.invoicePaidSuccess'), 'success');
            } else {
              showToast(t('invoices.invoicePaidError'), 'error');
            }
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          <Ionicons name="card" size={20} color={colors.primary} />  {t('cards.title')}
        </Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Cards List - Vertical */}
        <View style={styles.cardsList}>
          {cards.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.bgCard }]}>
              <Ionicons name="card" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('cards.noCards')}</Text>
            </View>
          ) : (
            cards.map(card => (
              <TouchableOpacity 
                key={card.id} 
                onPress={() => openCardDetail(card)}
                onLongPress={() => handleDeleteCard(card.id)}
                style={styles.cardItem}
                activeOpacity={0.85}
              >
                <CreditCard card={card} used={getCardUsage(card.id)} />
                {/* Badge de fatura pendente */}
                {getCardPendingInvoices(card.id).length > 0 && (
                  <View style={[styles.invoiceBadge, { backgroundColor: colors.danger }]}>
                    <Ionicons name="document-text" size={12} color="#FFFFFF" />
                    <Text style={styles.invoiceBadgeText}>
                      {getCardPendingInvoices(card.id).length} {t('cards.invoiceCount')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* FAB Add Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ========== MODAL DE DETALHES DO CARTÃO ========== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModalContent, { backgroundColor: colors.bgCard }]}>
            {/* Header */}
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>{t('cards.details')}</Text>
              <TouchableOpacity onPress={openEditModal}>
                <Ionicons name="create" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedCard && (
                <>
                  {/* Cartão Visual */}
                  <View style={styles.detailCardWrapper}>
                    <CreditCard card={selectedCard} used={getCardUsage(selectedCard.id)} />
                  </View>

                  {/* Próximo fechamento */}
                  {selectedCard.closeDate && (
                    <View style={[styles.closingInfo, { backgroundColor: colors.bgTertiary }]}>
                      <View style={styles.closingRow}>
                        <Ionicons name="calendar" size={16} color={colors.primary} />
                        <Text style={[styles.closingText, { color: colors.textSecondary }]}>
                          {t('cards.closing')}: {t('add.day')} {selectedCard.closeDate}
                        </Text>
                      </View>
                      <View style={styles.closingRow}>
                        <Ionicons name="time" size={16} color={colors.warning} />
                        <Text style={[styles.closingText, { color: colors.textSecondary }]}>
                          {getDaysUntilClosing(selectedCard.closeDate) !== null 
                            ? `${t('cards.nextClosingDays')} ${getDaysUntilClosing(selectedCard.closeDate)} ${t('cards.daysUntilClosing')}`
                            : t('cards.closingNotConfigured')
                          }
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Barra de Progresso */}
                  {(() => {
                    const { used, available, percentage, availablePercentage } = getCardProgress(selectedCard);
                    const progressColor = getProgressColor(availablePercentage);

                    return (
                      <View style={[styles.progressSection, { backgroundColor: colors.bgTertiary }]}>
                        <View style={styles.progressHeader}>
                          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>{t('cards.limitUsed')}</Text>
                          <Text style={[styles.progressPercent, { color: progressColor }]}>
                            {percentage.toFixed(1)}%
                          </Text>
                        </View>

                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: `${Math.min(percentage, 100)}%`,
                                backgroundColor: progressColor 
                              }
                            ]} 
                          />
                        </View>

                        <View style={styles.progressValues}>
                          <View>
                            <Text style={[styles.progressValueLabel, { color: colors.textMuted }]}>{t('cards.used')}</Text>
                            <Text style={[styles.progressValue, { color: colors.danger }]}>{formatCurrency(used)}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.progressValueLabel, { color: colors.textMuted }]}>{t('cards.available')}</Text>
                            <Text style={[styles.progressValue, { color: availablePercentage <= 10 ? colors.danger : colors.success }]}>
                              {formatCurrency(available)}
                            </Text>
                          </View>
                        </View>

                        {availablePercentage <= 10 && (
                          <View style={styles.alertBox}>
                            <Ionicons name="warning" size={16} color="#EF4444" />
                            <Text style={styles.alertText}>
                              {t('cards.limitAlert')} {availablePercentage.toFixed(1)}%
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })()}

                  {/* Seção de Faturas Pendentes */}
                  {pendingInvoices.length > 0 && (
                    <View style={styles.invoicesSection}>
                      <Text style={[styles.invoicesTitle, { color: colors.textPrimary }]}>
                        <Ionicons name="document-text" size={16} color={colors.danger} />  {t('cards.pendingInvoices')}
                      </Text>
                      {pendingInvoices.map(invoice => (
                        <View key={invoice.id} style={[styles.invoiceCard, { backgroundColor: colors.bgTertiary }]}>
                          <View style={styles.invoiceHeader}>
                            <View>
                              <Text style={[styles.invoiceMonth, { color: colors.textPrimary }]}>
                                {String(invoice.month).padStart(2, '0')}/{invoice.year}
                              </Text>
                              <Text style={[styles.invoiceAmount, { color: colors.danger }]}>
                                {formatCurrency(invoice.totalAmount)}
                              </Text>
                            </View>
                            <View style={[styles.invoiceStatus, { backgroundColor: colors.danger + '15' }]}>
                              <Text style={[styles.invoiceStatusText, { color: colors.danger }]}>{t('common.pending')}</Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={[styles.payButton, { backgroundColor: colors.success }]}
                            onPress={() => handlePayInvoice(invoice)}
                          >
                            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                            <Text style={styles.payButtonText}>{t('cards.payInvoice')}</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Histórico de Faturas Pagas */}
                  {allInvoices.filter(inv => inv.status === 'paid').length > 0 && (
                    <View style={styles.invoicesSection}>
                      <Text style={[styles.invoicesTitle, { color: colors.textPrimary }]}>
                        <Ionicons name="checkmark-done" size={16} color={colors.success} />  {t('cards.paidInvoices')}
                      </Text>
                      {allInvoices
                        .filter(inv => inv.status === 'paid')
                        .map(invoice => (
                          <View key={invoice.id} style={[styles.invoiceCard, { backgroundColor: colors.bgTertiary, opacity: 0.7 }]}>
                            <View style={styles.invoiceHeader}>
                              <View>
                                <Text style={[styles.invoiceMonth, { color: colors.textPrimary }]}>
                                  {String(invoice.month).padStart(2, '0')}/{invoice.year}
                                </Text>
                                <Text style={[styles.invoiceAmount, { color: colors.success }]}>
                                  {formatCurrency(invoice.totalAmount)}
                                </Text>
                              </View>
                              <View style={[styles.invoiceStatus, { backgroundColor: colors.success + '15' }]}>
                                <Text style={[styles.invoiceStatusText, { color: colors.success }]}>{t('common.completed')}</Text>
                              </View>
                            </View>
                            {invoice.paidAt && (
                              <Text style={[styles.paidDate, { color: colors.textMuted }]}>
                                {t('invoices.paidOn')} {new Date(invoice.paidAt).toLocaleDateString('pt-BR')}
                              </Text>
                            )}
                          </View>
                        ))}
                    </View>
                  )}

                  {/* Info do Cartão — Limite Total (fechamento removido pois já aparece acima) */}
                  <View style={[styles.infoSection, { backgroundColor: colors.bgTertiary }]}>
                    <View style={styles.infoRow}>
                      <Ionicons name="cash" size={16} color={colors.textMuted} />
                      <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        {t('cards.totalLimit')}: {formatCurrency(selectedCard.limit)}
                      </Text>
                    </View>
                  </View>

                  {/* Histórico de Gastos */}
                  <View style={styles.historySection}>
                    <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
                      <Ionicons name="receipt" size={16} color={colors.primary} />  {t('cards.expenseHistory')}
                    </Text>

                    {cardTransactions.length === 0 ? (
                      <View style={[styles.emptyHistory, { backgroundColor: colors.bgTertiary }]}>
                        <Ionicons name="receipt" size={32} color={colors.textMuted} />
                        <Text style={[styles.emptyHistoryText, { color: colors.textMuted }]}>
                          {t('cards.noTransactions')}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.transactionsList}>
                        {cardTransactions.map(t => (
                          <View key={t.id} style={[styles.transactionRow, { backgroundColor: colors.bgTertiary }]}>
                            <View style={styles.transactionLeft}>
                              <View style={[styles.transactionIcon, { backgroundColor: (t.categoryColor || '#94A3B8') + '15' }]}>
                                <Ionicons name={t.categoryIcon || 'receipt'} size={16} color={t.categoryColor || '#94A3B8'} />
                              </View>
                              <View>
                                <Text style={[styles.transactionDesc, { color: colors.textPrimary }]} numberOfLines={1}>
                                  {t.desc}
                                </Text>
                                <Text style={[styles.transactionDate, { color: colors.textMuted }]}>
                                  {t.date ? t.date.split('-').reverse().join('/') : ''}
                                  {t.isNextInvoice && (
                                    <Text style={{ color: colors.warning }}> • Próxima fatura</Text>
                                  )}
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.transactionAmount, { color: colors.danger }]}>
                              - {formatCurrency(t.amount)}
                            </Text>
                          </View>
                        ))}

                        {/* Total */}
                        <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>{t('cards.totalSpent')}</Text>
                          <Text style={[styles.totalValue, { color: colors.danger }]}>
                            {formatCurrency(cardTransactions.reduce((s, t) => s + t.amount, 0))}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Botões de Ação */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.editBtn, { backgroundColor: colors.primary }]}
                      onPress={openEditModal}
                    >
                      <Ionicons name="create" size={18} color="#FFFFFF" />
                      <Text style={styles.editBtnText}>{t('cards.editCard')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.deleteBtn, { backgroundColor: colors.danger + '15' }]}
                      onPress={() => handleDeleteCard(selectedCard.id)}
                    >
                      <Ionicons name="trash" size={18} color={colors.danger} />
                      <Text style={[styles.deleteBtnText, { color: colors.danger }]}>{t('common.delete')}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========== MODAL DE EDITAR CARTÃO (COM KEYBOARDAVOIDINGVIEW) ========== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="create" size={20} color={colors.primary} />  {t('cards.editCard')}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Seleção de Banco */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('cards.cardName')}</Text>
                <TouchableOpacity
                  style={[styles.bankSelector, { backgroundColor: colors.bgTertiary }]}
                  onPress={() => {
                    setBankModalMode('edit');
                    setBankSearch('');
                    setBankModalVisible(true);
                  }}
                >
                  {editBank ? (
                    <Text style={[styles.bankSelectorText, { color: colors.textPrimary }]}>
                      {editBank.name}
                    </Text>
                  ) : (
                    <Text style={[styles.bankSelectorPlaceholder, { color: colors.textMuted }]}>
                      {t('add.selectBank')}
                    </Text>
                  )}
                  <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('cards.limit')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    placeholder="0,00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={editLimit}
                    onChangeText={setEditLimit}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Dia de Vencimento</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    placeholder="DD"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={editDueDate}
                    onChangeText={(text) => {
                      const numeric = text.replace(/[^0-9]/g, '');
                      const day = parseInt(numeric, 10);
                      if (numeric === '') {
                        setEditDueDate('');
                      } else if (day >= 1 && day <= 31) {
                        setEditDueDate(numeric);
                      } else if (numeric.length <= 2) {
                        setEditDueDate(numeric);
                      }
                    }}
                  />
                </View>
              </View>

              {/* Info de fechamento automático */}
              {editDueDate && (
                <View style={[styles.autoCloseInfo, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="information-circle" size={16} color={colors.primary} />
                  <Text style={[styles.autoCloseText, { color: colors.textSecondary }]}>
                    {t('add.autoClose')}: {t('add.day')} {String((parseInt(editDueDate, 10) - 7 <= 0 ? parseInt(editDueDate, 10) - 7 + 30 : parseInt(editDueDate, 10) - 7)).padStart(2, '0')}
                  </Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('cards.cardColor')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPickerHorizontal}>
                  {cardGradients.map((gradObj) => {
                    const isSelected = editGradient === gradObj.class;
                    const isTemplate = gradObj.type === 'template';
                    const isSolid = gradObj.type === 'solid';
                    const gradientColors = getCardGradientColors(gradObj.class);
                    const templateImage = isTemplate ? getCardTemplateImage(gradObj.class) : null;

                    return (
                      <TouchableOpacity
                        key={gradObj.class}
                        onPress={() => setEditGradient(gradObj.class)}
                        style={[
                          styles.colorOptionHorizontal,
                          isSelected && styles.colorSelectedHorizontal,
                          isTemplate && styles.templateOptionHorizontal
                        ]}
                        activeOpacity={0.8}
                      >
                        {isTemplate && templateImage ? (
                          <ImageBackground
                            source={templateImage}
                            style={styles.gradientPreviewHorizontal}
                            imageStyle={{ borderRadius: 12 }}
                          >
                            <View style={styles.templateOverlay}>
                              <Text style={styles.templateLabel}>IMG</Text>
                            </View>
                          </ImageBackground>
                        ) : isSolid ? (
                          <View style={[styles.gradientPreviewHorizontal, { backgroundColor: gradObj.color, borderRadius: 12 }]}>
                            <Text style={styles.solidLabelHorizontal}>S</Text>
                          </View>
                        ) : (
                          <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientPreviewHorizontal}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleEditCard}
              >
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>{t('cards.saveChanges')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========== MODAL DE ADICIONAR CARTÃO (COM KEYBOARDAVOIDINGVIEW) ========== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="add-circle" size={20} color={colors.primary} />  {t('cards.addCard')}
              </Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                resetForm();
              }}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Seleção de Banco */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('cards.cardName')}</Text>
                <TouchableOpacity
                  style={[styles.bankSelector, { backgroundColor: colors.bgTertiary }]}
                  onPress={() => {
                    setBankModalMode('add');
                    setBankSearch('');
                    setBankModalVisible(true);
                  }}
                >
                  {selectedBank ? (
                    <Text style={[styles.bankSelectorText, { color: colors.textPrimary }]}>
                      {selectedBank.name}
                    </Text>
                  ) : (
                    <Text style={[styles.bankSelectorPlaceholder, { color: colors.textMuted }]}>
                      {t('add.selectBank')}
                    </Text>
                  )}
                  <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('cards.cardNumber')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="1234"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={number}
                  onChangeText={setNumber}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('cards.limit')}</Text>
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
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Dia de Vencimento</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    placeholder="DD"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={dueDate}
                    onChangeText={(text) => {
                      const numeric = text.replace(/[^0-9]/g, '');
                      const day = parseInt(numeric, 10);
                      if (numeric === '') {
                        setDueDate('');
                      } else if (day >= 1 && day <= 31) {
                        setDueDate(numeric);
                      } else if (numeric.length <= 2) {
                        setDueDate(numeric);
                      }
                    }}
                  />
                </View>
              </View>

              {/* Info de fechamento automático */}
              {dueDate && (
                <View style={[styles.autoCloseInfo, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="information-circle" size={16} color={colors.primary} />
                  <Text style={[styles.autoCloseText, { color: colors.textSecondary }]}>
                    {t('add.autoClose')}: {t('add.day')} {String((parseInt(dueDate, 10) - 7 <= 0 ? parseInt(dueDate, 10) - 7 + 30 : parseInt(dueDate, 10) - 7)).padStart(2, '0')}
                  </Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('cards.cardColor')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPickerHorizontal}>
                  {cardGradients.map((gradObj) => {
                    const isSelected = selectedGradient === gradObj.class;
                    const isTemplate = gradObj.type === 'template';
                    const isSolid = gradObj.type === 'solid';
                    const gradientColors = getCardGradientColors(gradObj.class);
                    const templateImage = isTemplate ? getCardTemplateImage(gradObj.class) : null;

                    return (
                      <TouchableOpacity
                        key={gradObj.class}
                        onPress={() => setSelectedGradient(gradObj.class)}
                        style={[
                          styles.colorOptionHorizontal,
                          isSelected && styles.colorSelectedHorizontal,
                          isTemplate && styles.templateOptionHorizontal
                        ]}
                        activeOpacity={0.8}
                      >
                        {isTemplate && templateImage ? (
                          <ImageBackground
                            source={templateImage}
                            style={styles.gradientPreviewHorizontal}
                            imageStyle={{ borderRadius: 12 }}
                          >
                            <View style={styles.templateOverlay}>
                              <Text style={styles.templateLabel}>IMG</Text>
                            </View>
                          </ImageBackground>
                        ) : isSolid ? (
                          <View style={[styles.gradientPreviewHorizontal, { backgroundColor: gradObj.color, borderRadius: 12 }]}>
                            <Text style={styles.solidLabelHorizontal}>S</Text>
                          </View>
                        ) : (
                          <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientPreviewHorizontal}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddCard}
              >
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>{t('cards.save')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========== MODAL DE SELEÇÃO DE BANCO ========== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={bankModalVisible}
        onRequestClose={() => setBankModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="business" size={20} color={colors.primary} />  Selecionar Banco
              </Text>
              <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Barra de busca */}
            <View style={[styles.bankSearchContainer, { backgroundColor: colors.bgTertiary }]}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.bankSearchInput, { color: colors.textPrimary }]}
                placeholder={t('add.searchBank')}
                placeholderTextColor={colors.textMuted}
                value={bankSearch}
                onChangeText={setBankSearch}
                autoFocus
              />
              {bankSearch.length > 0 && (
                <TouchableOpacity onPress={() => setBankSearch('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {BRAZILIAN_BANKS
                .filter(bank => 
                  bank.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
                  bank.shortName.toLowerCase().includes(bankSearch.toLowerCase()) ||
                  bank.code.includes(bankSearch)
                )
                .map(bank => {
                  const isSelected = bankModalMode === 'add' 
                    ? selectedBank?.code === bank.code 
                    : editBank?.code === bank.code;
                  return (
                    <TouchableOpacity
                      key={bank.code}
                      style={[
                        styles.bankOption,
                        { backgroundColor: isSelected ? colors.primary + '15' : colors.bgTertiary },
                        isSelected && { borderColor: colors.primary }
                      ]}
                      onPress={() => {
                        if (bankModalMode === 'add') {
                          setSelectedBank(bank);
                        } else {
                          setEditBank(bank);
                        }
                        setBankModalVisible(false);
                        setBankSearch('');
                      }}
                    >
                      <View style={styles.bankOptionLeft}>
                        <View style={[styles.bankCodeBadge, { backgroundColor: colors.primary + '20' }]}>
                          <Ionicons name="card-outline" size={22} color={colors.primary} />
                        </View>
                        <View>
                          <Text style={[styles.bankOptionName, { color: colors.textPrimary }]}>{bank.name}</Text>
                          <Text style={[styles.bankOptionShort, { color: colors.textMuted }]}>{bank.shortName}</Text>
                        </View>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}

              {BRAZILIAN_BANKS.filter(bank => 
                bank.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
                bank.shortName.toLowerCase().includes(bankSearch.toLowerCase()) ||
                bank.code.includes(bankSearch)
              ).length === 0 && (
                <View style={styles.bankEmpty}>
                  <Ionicons name="search-outline" size={32} color={colors.textMuted} />
                  <Text style={[styles.bankEmptyText, { color: colors.textMuted }]}>
                    {t('add.noBankFound')}
                  </Text>
                </View>
              )}
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
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  cardsList: { gap: 8 },
  emptyCard: { 
    alignItems: 'center', 
    padding: 40, 
    borderRadius: 16, 
    marginTop: 20 
  },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12 },

  cardItem: { alignSelf: 'center', width: '100%' },

  // NOVO: Badge de fatura pendente
  invoiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: -8,
    marginBottom: 8,
    alignSelf: 'center',
  },
  invoiceBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  fab: { 
    position: 'absolute', 
    right: 20, 
    bottom: 30, 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 6 
  },

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

  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 14, borderRadius: 12, fontSize: 16 },

  colorPicker: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10 
  },
  colorOption: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    overflow: 'hidden', 
    borderWidth: 2, 
    borderColor: 'transparent' 
  },
  colorSelected: { 
    borderColor: '#8B5CF6', 
    borderWidth: 3 
  },
  templateOption: { 
    width: 70, 
    height: 50, 
    borderRadius: 12 
  },
  gradientPreview: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 20 
  },
  templateOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 20 
  },
  templateLabel: { 
    color: '#FFF', 
    fontSize: 10, 
    fontWeight: '700' 
  },
  solidLabel: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: '700', 
    textAlign: 'center', 
    lineHeight: 46 
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

  // Detail Modal
  detailModalContent: { 
    flex: 1, 
    marginTop: 40, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24 
  },
  detailHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  detailTitle: { fontSize: 18, fontWeight: '700' },
  detailCardWrapper: { alignItems: 'center', marginBottom: 20 },

  // NOVO: Info de fechamento
  closingInfo: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  closingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  closingText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Progress
  progressSection: { 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16 
  },
  progressHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  progressLabel: { fontSize: 13, fontWeight: '600' },
  progressPercent: { fontSize: 18, fontWeight: '700' },
  progressBar: { 
    height: 8, 
    borderRadius: 4, 
    overflow: 'hidden', 
    marginBottom: 12 
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressValues: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  progressValueLabel: { fontSize: 11, marginBottom: 2 },
  progressValue: { fontSize: 15, fontWeight: '700' },

  alertBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 12, 
    backgroundColor: '#FEE2E2', 
    padding: 10, 
    borderRadius: 8 
  },
  alertText: { 
    color: '#EF4444', 
    fontSize: 12, 
    fontWeight: '600', 
    flex: 1 
  },

  // NOVO: Seção de Faturas
  invoicesSection: { marginBottom: 16 },
  invoicesTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  invoiceCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceMonth: {
    fontSize: 14,
    fontWeight: '600',
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  invoiceStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  invoiceStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  paidDate: {
    fontSize: 11,
    marginTop: 4,
  },

  // Info
  infoSection: { 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    gap: 10 
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  infoText: { fontSize: 14, fontWeight: '500' },

  // History
  historySection: { marginBottom: 16 },
  historyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  emptyHistory: { 
    alignItems: 'center', 
    padding: 30, 
    borderRadius: 16 
  },
  emptyHistoryText: { fontSize: 14, fontWeight: '500', marginTop: 8 },

  transactionsList: { gap: 8 },
  transactionRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 12, 
    borderRadius: 12 
  },
  transactionLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    flex: 1 
  },
  transactionIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  transactionDesc: { fontSize: 14, fontWeight: '600' },
  transactionDate: { fontSize: 11, marginTop: 2 },
  transactionAmount: { fontSize: 14, fontWeight: '700' },

  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingTop: 12, 
    borderTopWidth: 1, 
    marginTop: 4 
  },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '700' },

  // Action Buttons
  actionButtons: { gap: 10, marginTop: 8 },
  editBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    padding: 14, 
    borderRadius: 12 
  },
  editBtnText: { 
    color: '#FFFFFF', 
    fontSize: 15, 
    fontWeight: '700' 
  },
  deleteBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    padding: 14, 
    borderRadius: 12 
  },
  deleteBtnText: { fontSize: 15, fontWeight: '700' },

  // Seletor de banco
  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
  },
  bankSelectorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bankSelectorPlaceholder: {
    fontSize: 16,
  },

  // Info de fechamento automático
  autoCloseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  autoCloseText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Color picker horizontal
  colorPickerHorizontal: {
    flexDirection: 'row',
  },
  colorOptionHorizontal: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 10,
  },
  colorSelectedHorizontal: {
    borderColor: '#8B5CF6',
    borderWidth: 3,
  },
  templateOptionHorizontal: {
    width: 80,
    height: 56,
    borderRadius: 12,
  },
  gradientPreviewHorizontal: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  solidLabelHorizontal: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 52,
  },

  // Modal de bancos
  bankSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  bankSearchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
  },
  bankOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bankOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bankCodeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankOptionName: {
    fontSize: 15,
    fontWeight: '600',
  },
  bankOptionShort: {
    fontSize: 12,
    marginTop: 2,
  },
  bankEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  bankEmptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
});

export default CardsScreen;