// CardsScreen.js — Cartões com Círculos Financeiros (Arquivo 6/10)
// Suporte a cartões locais + compartilhados, filtros por origem/círculo, badges de permissão

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Dimensions, ImageBackground,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { useCircle } from '../context/CircleContext';
import {
  formatCurrency, getCardGradientColors, isCardTemplate,
  getCardTemplateImage, isCardSolid, getDaysUntilClosing
} from '../utils/helpers';
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
    cards, transactions, cardGradients,
    addCard, deleteCard, editCard,
    getCardUsage, cardInvoices, payInvoice,
    getCardPendingInvoices, getCardInvoices,
    mergedCards, mergedTransactions, isSharedItem, getItemShareInfo
  } = useApp();
  const { colors, darkMode } = useTheme();
  const { t } = useTranslate();
  const { currentCircle, myCircles, syncEnabled } = useCircle();

  const [originFilter, setOriginFilter] = useState('all');
  const [circleFilter, setCircleFilter] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [number, setNumber] = useState('');
  const [limit, setLimit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(cardGradients[0]?.class || 'card-gradient-purple');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBank, setEditBank] = useState(null);
  const [editLimit, setEditLimit] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editGradient, setEditGradient] = useState('');
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankModalMode, setBankModalMode] = useState('add');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const displayCards = useMemo(() => {
    let pool = currentCircle ? (mergedCards || []).filter(c => !c._circleId || c._circleId === currentCircle.id) : (cards || []);
    if (originFilter === 'local') pool = pool.filter(c => !c._circleId && !c._sharedBy);
    else if (originFilter === 'shared') pool = pool.filter(c => !!c._circleId || !!c._sharedBy);
    if (!currentCircle && circleFilter === 'local') pool = pool.filter(c => !c._circleId);
    else if (!currentCircle && circleFilter && circleFilter !== 'all') pool = pool.filter(c => c._circleId === circleFilter);
    return pool;
  }, [currentCircle, cards, mergedCards, originFilter, circleFilter]);

  const displayTransactions = useMemo(() => {
    return currentCircle ? (mergedTransactions || []).filter(tx => !tx._circleId || tx._circleId === currentCircle.id) : (transactions || []);
  }, [currentCircle, transactions, mergedTransactions]);

  const showToast = (message, type = 'success') => { setToast({ visible: true, message, type }); };

  const cardTransactions = useMemo(() => {
    if (!selectedCard) return [];
    return (displayTransactions || []).filter(t => t.cardId === selectedCard.id && t.type === 'expense' && !t.isInvoicePayment).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }, [selectedCard, displayTransactions]);

  const pendingInvoices = useMemo(() => { if (!selectedCard) return []; return getCardPendingInvoices(selectedCard.id); }, [selectedCard, getCardPendingInvoices, cardInvoices]);
  const allInvoices = useMemo(() => { if (!selectedCard) return []; return getCardInvoices(selectedCard.id); }, [selectedCard, getCardInvoices, cardInvoices]);

  const getCardProgress = (card) => { const used = getCardUsage(card.id); const available = card.limit - used; const percentage = card.limit > 0 ? (used / card.limit) * 100 : 0; const availablePercentage = card.limit > 0 ? (available / card.limit) * 100 : 0; return { used, available, percentage, availablePercentage }; };
  const getProgressColor = (availablePercentage) => { if (availablePercentage <= 10) return colors.danger; if (availablePercentage <= 25) return colors.warning; return colors.success; };

  const getSharedBadge = (item) => { if (!item) return null; const info = getItemShareInfo ? getItemShareInfo(item) : null; if (!info || !info.isShared) return null; return (<View style={[styles.sharedBadge, { backgroundColor: info.canEdit ? colors.success : colors.primary }]}><Ionicons name={info.canEdit ? "create-outline" : "eye-outline"} size={10} color="#FFF" /><Text style={styles.sharedBadgeText}>{info.canEdit ? t('common.editPermission') : t('common.view')}</Text></View>); };
  const getOriginBadge = (item) => { if (!item || (!item._circleId && !item._sharedBy)) return null; return (<View style={[styles.originBadge, { backgroundColor: colors.primary + '18' }]}><Ionicons name="people-outline" size={10} color={colors.primary} /><Text style={[styles.originBadgeText, { color: colors.primary }]}>{item._sharedByName || item._sharedBy || t('common.shared')}</Text></View>); };

  const canEditCard = (card) => { const info = getItemShareInfo ? getItemShareInfo(card) : null; return !card._sharedBy || (info && info.canEdit); };

  const handleAddCard = () => {
    if (!selectedBank || !limit || !dueDate) { showToast(t('add.fillRequired'), 'error'); return; }
    const selectedGradientObj = cardGradients.find(g => g.class === selectedGradient) || cardGradients[0];
    const dueDay = parseInt(dueDate, 10); let closeDay = dueDay - 7; if (closeDay <= 0) closeDay += 30; const closeDateStr = String(closeDay).padStart(2, '0');
    const card = { name: selectedBank.name, bankCode: selectedBank.code, shortName: selectedBank.shortName, number: number ? `**** ${number.padStart(4, '0')}` : '**** 0000', limit: parseFloat(limit), closeDate: closeDateStr, dueDate, gradientClass: selectedGradient, color: selectedGradientObj.color };
    addCard(card); setModalVisible(false); resetForm(); showToast(t('cards.added'));
  };

  const resetForm = () => { setSelectedBank(null); setNumber(''); setLimit(''); setDueDate(''); setSelectedGradient(cardGradients[0]?.class || 'card-gradient-purple'); setBankSearch(''); };

  const handleDeleteCard = useCallback((id) => {
    const card = displayCards.find(c => c.id === id);
    if (card && !canEditCard(card)) { showToast(t('common.noPermission'), 'error'); return; }
    Alert.alert(t('cards.confirmDeleteTitle'), t('cards.confirmDeleteMessage'), [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => { deleteCard(id); setDetailModalVisible(false); showToast(t('cards.deleted'), 'warning'); } }]);
  }, [displayCards, canEditCard, t, deleteCard]);

  const openCardDetail = (card) => { setSelectedCard(card); setDetailModalVisible(true); };
  const openEditModal = () => { if (!selectedCard) return; if (!canEditCard(selectedCard)) { showToast(t('common.noPermission'), 'error'); return; } const bank = BRAZILIAN_BANKS.find(b => b.code === selectedCard.bankCode) || BRAZILIAN_BANKS.find(b => b.name === selectedCard.name) || { code: '000', name: selectedCard.name, shortName: selectedCard.name }; setEditBank(bank); setEditLimit(selectedCard.limit.toString()); setEditDueDate(selectedCard.dueDate || ''); setEditGradient(selectedCard.gradientClass); setEditModalVisible(true); };

  const handleEditCard = () => {
    if (!editBank || !editLimit || !editDueDate) { showToast(t('add.fillRequired'), 'error'); return; }
    const selectedGradientObj = cardGradients.find(g => g.class === editGradient) || cardGradients[0]; const dueDay = parseInt(editDueDate, 10); let closeDay = dueDay - 7; if (closeDay <= 0) closeDay += 30; const closeDateStr = String(closeDay).padStart(2, '0');
    editCard(selectedCard.id, { name: editBank.name, bankCode: editBank.code, shortName: editBank.shortName, limit: parseFloat(editLimit), closeDate: closeDateStr, dueDate: editDueDate, gradientClass: editGradient, color: selectedGradientObj.color });
    setSelectedCard(prev => ({ ...prev, name: editBank.name, bankCode: editBank.code, shortName: editBank.shortName, limit: parseFloat(editLimit), closeDate: closeDateStr, dueDate: editDueDate, gradientClass: editGradient, color: selectedGradientObj.color }));
    setEditModalVisible(false); showToast(t('cards.updated'));
  };

  const handlePayInvoice = (invoice) => { Alert.alert(t('cards.payInvoice'), `${t('common.confirm')} ${t('cards.payInvoice').toLowerCase()} ${invoice.cardName} ${t('common.value').toLowerCase()} ${formatCurrency(invoice.totalAmount)}?`, [{ text: t('common.cancel'), style: 'cancel' }, { text: t('cards.payInvoice'), style: 'default', onPress: () => { const success = payInvoice(invoice.id); if (success) showToast(t('invoices.invoicePaidSuccess'), 'success'); else showToast(t('invoices.invoicePaidError'), 'error'); } }]); };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.bgCard }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('cards.title')}</Text>
          {currentCircle && (
            <View style={[styles.circleChip, { backgroundColor: colors.primary + '15' }]}>
              <View style={[styles.onlineDot, { backgroundColor: syncEnabled ? colors.success : colors.danger }]} />
              <Text style={[styles.circleChipText, { color: colors.primary }]} numberOfLines={1}>{currentCircle.name}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.originBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[{ key: 'all', label: t('history.all'), icon: 'layers-outline' }, { key: 'local', label: t('common.private'), icon: 'person-outline' }, { key: 'shared', label: t('common.shared'), icon: 'people-outline' }].map(o => (
              <TouchableOpacity key={o.key} style={[styles.originBtn, { backgroundColor: originFilter === o.key ? colors.primary : darkMode ? colors.bgCard : colors.bgTertiary }]} onPress={() => setOriginFilter(o.key)}>
                <Ionicons name={o.icon} size={14} color={originFilter === o.key ? '#FFF' : colors.textMuted} />
                <Text style={{ color: originFilter === o.key ? '#FFF' : colors.textPrimary, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>{o.label}</Text>
              </TouchableOpacity>
            ))}
            {!currentCircle && (myCircles || []).length > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={[styles.originBtn, { backgroundColor: circleFilter === 'local' ? colors.primary : darkMode ? colors.bgCard : colors.bgTertiary }]} onPress={() => setCircleFilter(circleFilter === 'local' ? null : 'local')}>
                  <Ionicons name="person-outline" size={14} color={circleFilter === 'local' ? '#FFF' : colors.textMuted} />
                  <Text style={{ color: circleFilter === 'local' ? '#FFF' : colors.textPrimary, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>{t('common.myData')}</Text>
                </TouchableOpacity>
                {(myCircles || []).map(c => (
                  <TouchableOpacity key={c.id} style={[styles.originBtn, { backgroundColor: circleFilter === c.id ? colors.primary : darkMode ? colors.bgCard : colors.bgTertiary }]} onPress={() => setCircleFilter(circleFilter === c.id ? null : c.id)}>
                    <Ionicons name="people-outline" size={14} color={circleFilter === c.id ? '#FFF' : colors.textMuted} />
                    <Text style={{ color: circleFilter === c.id ? '#FFF' : colors.textPrimary, fontSize: 12, fontWeight: '600', marginLeft: 4 }} numberOfLines={1}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        </View>

        <View style={styles.cardsList}>
          {(displayCards || []).length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}>
              <Ionicons name="card-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('cards.noCards')}</Text>
            </View>
          ) : (
            (displayCards || []).map(card => (
              <View key={card.id} style={styles.cardWrapper}>
                <TouchableOpacity onPress={() => openCardDetail(card)} onLongPress={() => canEditCard(card) && handleDeleteCard(card.id)} style={styles.cardItem} activeOpacity={0.85}>
                  <CreditCard card={card} usage={getCardUsage(card.id)} />
                </TouchableOpacity>
                <View style={styles.cardBadges}>
                  {getSharedBadge(card)}
                  {getOriginBadge(card)}
                  {(getCardPendingInvoices(card.id) || []).length > 0 && (
                    <View style={[styles.invoiceBadge, { backgroundColor: colors.danger }]}>
                      <Ionicons name="warning" size={12} color="#FFF" />
                      <Text style={styles.invoiceBadgeText}>{(getCardPendingInvoices(card.id) || []).length} {t('cards.invoiceCount')}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {(!currentCircle || (currentCircle && currentCircle.myRole === 'admin')) && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>{t('cards.details')}</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
            </View>
            {selectedCard && (
              <>
                <View style={styles.detailCardWrapper}>
                  <CreditCard card={selectedCard} usage={getCardUsage(selectedCard.id)} />
                  <View style={styles.detailBadges}>{getSharedBadge(selectedCard)}{getOriginBadge(selectedCard)}</View>
                </View>
                {selectedCard.closeDate && (
                  <View style={[styles.closingInfo, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}>
                    <View style={styles.closingRow}>
                      <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                      <Text style={[styles.closingText, { color: colors.textPrimary }]}>{t('cards.closing')}: {t('add.day')} {selectedCard.closeDate}</Text>
                    </View>
                    <Text style={[styles.closingText, { color: colors.textMuted, marginLeft: 28 }]}>{getDaysUntilClosing(selectedCard.closeDate) !== null ? `${t('cards.nextClosingDays')} ${getDaysUntilClosing(selectedCard.closeDate)} ${t('cards.daysUntilClosing')}` : t('cards.closingNotConfigured')}</Text>
                  </View>
                )}
                {(() => { const { used, available, percentage, availablePercentage } = getCardProgress(selectedCard); const progressColor = getProgressColor(availablePercentage); return (
                  <View style={[styles.progressSection, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}>
                    <View style={styles.progressHeader}>
                      <Text style={[styles.progressLabel, { color: colors.textPrimary }]}>{t('cards.limitUsed')}</Text>
                      <Text style={[styles.progressPercent, { color: progressColor }]}>{percentage.toFixed(1)}%</Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: darkMode ? colors.bgTertiary : colors.border }]}><View style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: progressColor }]} /></View>
                    <View style={styles.progressValues}>
                      <View><Text style={[styles.progressValueLabel, { color: colors.textMuted }]}>{t('cards.used')}</Text><Text style={[styles.progressValue, { color: colors.textPrimary }]}>{formatCurrency(used)}</Text></View>
                      <View style={{ alignItems: 'flex-end' }}><Text style={[styles.progressValueLabel, { color: colors.textMuted }]}>{t('cards.available')}</Text><Text style={[styles.progressValue, { color: progressColor }]}>{formatCurrency(available)}</Text></View>
                    </View>
                    {availablePercentage <= 10 && (<View style={styles.alertBox}><Ionicons name="alert-circle" size={16} color={colors.danger} /><Text style={styles.alertText}>{t('cards.limitAlert')} {availablePercentage.toFixed(1)}%</Text></View>)}
                  </View>
                ); })()}
                {(pendingInvoices || []).length > 0 && (
                  <View style={styles.invoicesSection}>
                    <Text style={[styles.invoicesTitle, { color: colors.textPrimary }]}>{t('cards.pendingInvoices')}</Text>
                    {(pendingInvoices || []).map(invoice => (
                      <View key={invoice.id} style={[styles.invoiceCard, { backgroundColor: darkMode ? colors.bgCard : colors.danger + '10' }]}>
                        <View style={styles.invoiceHeader}>
                          <View><Text style={[styles.invoiceMonth, { color: colors.textPrimary }]}>{String(invoice.month).padStart(2, '0')}/{invoice.year}</Text><Text style={[styles.invoiceAmount, { color: colors.danger }]}>{formatCurrency(invoice.totalAmount)}</Text></View>
                          <View style={[styles.invoiceStatus, { backgroundColor: colors.warning + '15' }]}><Text style={[styles.invoiceStatusText, { color: colors.warning }]}>{t('common.pending')}</Text></View>
                        </View>
                        <TouchableOpacity style={[styles.payButton, { backgroundColor: colors.primary }]} onPress={() => handlePayInvoice(invoice)}><Ionicons name="cash-outline" size={16} color="#FFF" /><Text style={styles.payButtonText}>{t('cards.payInvoice')}</Text></TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                {(allInvoices || []).filter(inv => inv.status === 'paid').length > 0 && (
                  <View style={styles.invoicesSection}>
                    <Text style={[styles.invoicesTitle, { color: colors.textPrimary }]}>{t('cards.paidInvoices')}</Text>
                    {(allInvoices || []).filter(inv => inv.status === 'paid').map(invoice => (
                      <View key={invoice.id} style={[styles.invoiceCard, { backgroundColor: darkMode ? colors.bgCard : colors.success + '15' }]}>
                        <View style={styles.invoiceHeader}>
                          <View><Text style={[styles.invoiceMonth, { color: colors.textPrimary }]}>{String(invoice.month).padStart(2, '0')}/{invoice.year}</Text><Text style={[styles.invoiceAmount, { color: colors.success }]}>{formatCurrency(invoice.totalAmount)}</Text></View>
                          <View style={[styles.invoiceStatus, { backgroundColor: colors.success + '20' }]}><Text style={[styles.invoiceStatusText, { color: colors.success }]}>{t('common.completed')}</Text></View>
                        </View>
                        {invoice.paidAt && <Text style={[styles.paidDate, { color: colors.textMuted }]}>{t('invoices.paidOn')} {new Date(invoice.paidAt).toLocaleDateString('pt-BR')}</Text>}
                      </View>
                    ))}
                  </View>
                )}
                <View style={[styles.infoSection, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}>
                  <View style={styles.infoRow}><Ionicons name="card-outline" size={18} color={colors.primary} /><Text style={[styles.infoText, { color: colors.textPrimary }]}>{t('cards.totalLimit')}: {formatCurrency(selectedCard.limit)}</Text></View>
                </View>
                <View style={styles.historySection}>
                  <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>{t('cards.expenseHistory')}</Text>
                  {(cardTransactions || []).length === 0 ? (
                    <View style={[styles.emptyHistory, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}><Ionicons name="receipt-outline" size={28} color={colors.textMuted} /><Text style={[styles.emptyHistoryText, { color: colors.textMuted }]}>{t('cards.noTransactions')}</Text></View>
                  ) : (
                    <View style={styles.transactionsList}>
                      {(cardTransactions || []).map(t => (
                        <View key={t.id} style={[styles.transactionRow, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}>
                          <View style={styles.transactionLeft}>
                            <View style={[styles.transactionIcon, { backgroundColor: colors.primary + '15' }]}><Ionicons name="pricetag-outline" size={16} color={colors.primary} /></View>
                            <View style={{ flex: 1 }}><Text style={[styles.transactionDesc, { color: colors.textPrimary }]} numberOfLines={1}>{t.desc || t.description}</Text><Text style={[styles.transactionDate, { color: colors.textMuted }]}>{t.date ? t.date.split('-').reverse().join('/') : ''}{t.isNextInvoice && <Text style={{ color: colors.primary, fontWeight: '700' }}> • {t('cards.purchaseNextInvoice')}</Text>}</Text></View>
                          </View>
                          <Text style={[styles.transactionAmount, { color: colors.danger }]}>- {formatCurrency(t.amount)}</Text>
                        </View>
                      ))}
                      <View style={[styles.totalRow, { borderTopColor: colors.border }]}><Text style={[styles.totalLabel, { color: colors.textPrimary }]}>{t('cards.totalSpent')}</Text><Text style={[styles.totalValue, { color: colors.danger }]}>{formatCurrency((cardTransactions || []).reduce((s, t) => s + (t.amount || 0), 0))}</Text></View>
                    </View>
                  )}
                </View>
                {canEditCard(selectedCard) && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.primary }]} onPress={openEditModal}><Ionicons name="create-outline" size={18} color="#FFF" /><Text style={styles.editBtnText}>{t('cards.editCard')}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.danger + '15' }]} onPress={() => handleDeleteCard(selectedCard.id)}><Ionicons name="trash-outline" size={18} color={colors.danger} /><Text style={[styles.deleteBtnText, { color: colors.danger }]}>{t('common.delete')}</Text></TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('cards.editCard')}</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>{t('cards.cardName')}</Text>
                  <TouchableOpacity style={[styles.bankSelector, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]} onPress={() => { setBankModalMode('edit'); setBankSearch(''); setBankModalVisible(true); }}>
                    {editBank ? <Text style={[styles.bankSelectorText, { color: colors.textPrimary }]}>{editBank.name}</Text> : <Text style={[styles.bankSelectorPlaceholder, { color: colors.textMuted }]}>{t('add.selectBank')}</Text>}
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>{t('cards.limit')}</Text>
                    <TextInput style={[styles.input, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary, color: colors.textPrimary }]} value={editLimit} onChangeText={setEditLimit} keyboardType="numeric" placeholder="R$ 0,00" placeholderTextColor={colors.textMuted} />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Dia de Vencimento</Text>
                    <TextInput style={[styles.input, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary, color: colors.textPrimary }]} value={editDueDate} onChangeText={(text) => { const numeric = text.replace(/[^0-9]/g, ''); const day = parseInt(numeric, 10); if (numeric === '') setEditDueDate(''); else if (day >= 1 && day <= 31) setEditDueDate(numeric); else if (numeric.length <= 2) setEditDueDate(numeric); }} keyboardType="numeric" maxLength={2} placeholder="DD" placeholderTextColor={colors.textMuted} />
                  </View>
                </View>
                {editDueDate && (
                  <View style={[styles.autoCloseInfo, { backgroundColor: darkMode ? colors.bgCard : colors.success + '15' }]}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.success} />
                    <Text style={[styles.autoCloseText, { color: colors.success }]}>{t('add.autoClose')}: {t('add.day')} {String((parseInt(editDueDate, 10) - 7 <= 0 ? parseInt(editDueDate, 10) - 7 + 30 : parseInt(editDueDate, 10) - 7)).padStart(2, '0')}</Text>
                  </View>
                )}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>{t('cards.cardColor')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorScrollContent}>
                    {(cardGradients || []).map((gradObj) => { const isSelected = editGradient === gradObj.class; const isTemplate = gradObj.type === 'template'; const isSolid = gradObj.type === 'solid'; const gradientColors = getCardGradientColors(gradObj.class); const templateImage = isTemplate ? getCardTemplateImage(gradObj.class) : null; return (
                      <TouchableOpacity key={gradObj.class} onPress={() => setEditGradient(gradObj.class)} style={[styles.colorCircle, isSelected && [styles.colorCircleSelected, { borderColor: colors.primary }]]} activeOpacity={0.8}>
                        {isTemplate && templateImage ? <ImageBackground source={templateImage} style={styles.colorCirclePreview} imageStyle={{ borderRadius: 24 }}><View style={styles.templateOverlayCircle}><Text style={styles.templateLabelCircle}>IMG</Text></View></ImageBackground> : isSolid ? <View style={[styles.colorCirclePreview, { backgroundColor: gradientColors[0] }]}><Text style={styles.solidLabelCircle}>S</Text></View> : <LinearGradient colors={gradientColors} style={styles.colorCirclePreview} />}
                        {isSelected && <View style={styles.checkOverlay}><Ionicons name="checkmark" size={18} color="#FFF" /></View>}
                      </TouchableOpacity>
                    ); })}
                  </ScrollView>
                </View>
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleEditCard}><Text style={styles.submitText}>{t('cards.saveChanges')}</Text></TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('cards.addCard')}</Text>
                <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>{t('cards.cardName')}</Text>
                  <TouchableOpacity style={[styles.bankSelector, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]} onPress={() => { setBankModalMode('add'); setBankSearch(''); setBankModalVisible(true); }}>
                    {selectedBank ? <Text style={[styles.bankSelectorText, { color: colors.textPrimary }]}>{selectedBank.name}</Text> : <Text style={[styles.bankSelectorPlaceholder, { color: colors.textMuted }]}>{t('add.selectBank')}</Text>}
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>{t('cards.cardNumber')}</Text>
                  <TextInput style={[styles.input, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary, color: colors.textPrimary }]} value={number} onChangeText={setNumber} keyboardType="numeric" maxLength={4} placeholder="0000" placeholderTextColor={colors.textMuted} />
                </View>
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>{t('cards.limit')}</Text>
                    <TextInput style={[styles.input, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary, color: colors.textPrimary }]} value={limit} onChangeText={setLimit} keyboardType="numeric" placeholder="R$ 0,00" placeholderTextColor={colors.textMuted} />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Dia de Vencimento</Text>
                    <TextInput style={[styles.input, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary, color: colors.textPrimary }]} value={dueDate} onChangeText={(text) => { const numeric = text.replace(/[^0-9]/g, ''); const day = parseInt(numeric, 10); if (numeric === '') setDueDate(''); else if (day >= 1 && day <= 31) setDueDate(numeric); else if (numeric.length <= 2) setDueDate(numeric); }} keyboardType="numeric" maxLength={2} placeholder="DD" placeholderTextColor={colors.textMuted} />
                  </View>
                </View>
                {dueDate && (
                  <View style={[styles.autoCloseInfo, { backgroundColor: darkMode ? colors.bgCard : colors.success + '15' }]}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.success} />
                    <Text style={[styles.autoCloseText, { color: colors.success }]}>{t('add.autoClose')}: {t('add.day')} {String((parseInt(dueDate, 10) - 7 <= 0 ? parseInt(dueDate, 10) - 7 + 30 : parseInt(dueDate, 10) - 7)).padStart(2, '0')}</Text>
                  </View>
                )}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>{t('cards.cardColor')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorScrollContent}>
                    {(cardGradients || []).map((gradObj) => { const isSelected = selectedGradient === gradObj.class; const isTemplate = gradObj.type === 'template'; const isSolid = gradObj.type === 'solid'; const gradientColors = getCardGradientColors(gradObj.class); const templateImage = isTemplate ? getCardTemplateImage(gradObj.class) : null; return (
                      <TouchableOpacity key={gradObj.class} onPress={() => setSelectedGradient(gradObj.class)} style={[styles.colorCircle, isSelected && [styles.colorCircleSelected, { borderColor: colors.primary }]]} activeOpacity={0.8}>
                        {isTemplate && templateImage ? <ImageBackground source={templateImage} style={styles.colorCirclePreview} imageStyle={{ borderRadius: 24 }}><View style={styles.templateOverlayCircle}><Text style={styles.templateLabelCircle}>IMG</Text></View></ImageBackground> : isSolid ? <View style={[styles.colorCirclePreview, { backgroundColor: gradientColors[0] }]}><Text style={styles.solidLabelCircle}>S</Text></View> : <LinearGradient colors={gradientColors} style={styles.colorCirclePreview} />}
                        {isSelected && <View style={styles.checkOverlay}><Ionicons name="checkmark" size={18} color="#FFF" /></View>}
                      </TouchableOpacity>
                    ); })}
                  </ScrollView>
                </View>
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleAddCard}><Text style={styles.submitText}>{t('cards.save')}</Text></TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bank Modal */}
      <Modal visible={bankModalVisible} animationType="slide" transparent onRequestClose={() => setBankModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Selecionar Banco</Text>
              <TouchableOpacity onPress={() => setBankModalVisible(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
            </View>
            <View style={[styles.bankSearchContainer, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput style={[styles.bankSearchInput, { color: colors.textPrimary }]} value={bankSearch} onChangeText={setBankSearch} placeholder={t('add.searchBank')} placeholderTextColor={colors.textMuted} />
              {bankSearch.length > 0 && <TouchableOpacity onPress={() => setBankSearch('')}><Ionicons name="close-circle" size={18} color={colors.textMuted} /></TouchableOpacity>}
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {BRAZILIAN_BANKS.filter(bank => bank.name.toLowerCase().includes(bankSearch.toLowerCase()) || bank.shortName.toLowerCase().includes(bankSearch.toLowerCase()) || bank.code.includes(bankSearch)).map(bank => { const isSelected = bankModalMode === 'add' ? selectedBank?.code === bank.code : editBank?.code === bank.code; return (
                <TouchableOpacity key={bank.code} style={[styles.bankOption, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary, borderColor: isSelected ? colors.primary : 'transparent' }]} onPress={() => { if (bankModalMode === 'add') setSelectedBank(bank); else setEditBank(bank); setBankModalVisible(false); setBankSearch(''); }}>
                  <View style={styles.bankOptionLeft}>
                    <View style={[styles.bankCodeBadge, { backgroundColor: colors.primary + '15' }]}><Ionicons name="card-outline" size={20} color={colors.primary} /></View>
                    <View><Text style={[styles.bankOptionName, { color: colors.textPrimary }]}>{bank.name}</Text><Text style={[styles.bankOptionShort, { color: colors.textMuted }]}>{bank.shortName}</Text></View>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </TouchableOpacity>
              ); })}
              {BRAZILIAN_BANKS.filter(bank => bank.name.toLowerCase().includes(bankSearch.toLowerCase()) || bank.shortName.toLowerCase().includes(bankSearch.toLowerCase()) || bank.code.includes(bankSearch)).length === 0 && (
                <View style={styles.bankEmpty}><Ionicons name="search-outline" size={32} color={colors.textMuted} /><Text style={[styles.bankEmptyText, { color: colors.textMuted }]}>{t('add.noBankFound')}</Text></View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  circleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, maxWidth: 160 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  circleChipText: { fontSize: 12, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  originBar: { marginBottom: 14 },
  originBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 8 },
  divider: { width: 1, height: 24, marginHorizontal: 6, alignSelf: 'center' },
  cardsList: { gap: 8 },
  cardWrapper: { marginBottom: 12, alignItems: 'center' },
  cardItem: { alignSelf: 'center', width: '100%' },
  cardBadges: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  sharedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  sharedBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  originBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  originBadgeText: { fontSize: 9, fontWeight: '600' },
  invoiceBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20 },
  invoiceBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: 16, marginTop: 20 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 14, borderRadius: 12, fontSize: 16 },
  colorScrollContent: { flexDirection: 'row', gap: 10, paddingRight: 20, paddingVertical: 4 },
  colorCircle: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  colorCircleSelected: { borderWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  colorCirclePreview: { width: '100%', height: '100%', borderRadius: 24 },
  solidLabelCircle: { color: '#FFF', fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 46 },
  templateOverlayCircle: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', borderRadius: 24 },
  templateLabelCircle: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  checkOverlay: { position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 24 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, marginTop: 8 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  detailModalContent: { flex: 1, marginTop: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  detailTitle: { fontSize: 18, fontWeight: '700' },
  detailCardWrapper: { alignItems: 'center', marginBottom: 20 },
  detailBadges: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  closingInfo: { borderRadius: 16, padding: 16, marginBottom: 16, gap: 10 },
  closingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  closingText: { fontSize: 14, fontWeight: '500' },
  progressSection: { borderRadius: 16, padding: 16, marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontSize: 13, fontWeight: '600' },
  progressPercent: { fontSize: 18, fontWeight: '700' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressValues: { flexDirection: 'row', justifyContent: 'space-between' },
  progressValueLabel: { fontSize: 11, marginBottom: 2 },
  progressValue: { fontSize: 15, fontWeight: '700' },
  alertBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: colors.danger + '15', padding: 10, borderRadius: 8 },
  alertText: { color: colors.danger, fontSize: 12, fontWeight: '600', flex: 1 },
  invoicesSection: { marginBottom: 16 },
  invoicesTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  invoiceCard: { borderRadius: 16, padding: 16, marginBottom: 10 },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  invoiceMonth: { fontSize: 14, fontWeight: '600' },
  invoiceAmount: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  invoiceStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  invoiceStatusText: { fontSize: 12, fontWeight: '600' },
  payButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12 },
  payButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  paidDate: { fontSize: 11, marginTop: 4 },
  infoSection: { borderRadius: 16, padding: 16, marginBottom: 16, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 14, fontWeight: '500' },
  historySection: { marginBottom: 16 },
  historyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  emptyHistory: { alignItems: 'center', padding: 30, borderRadius: 16 },
  emptyHistoryText: { fontSize: 14, fontWeight: '500', marginTop: 8 },
  transactionsList: { gap: 8 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  transactionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  transactionDesc: { fontSize: 14, fontWeight: '600' },
  transactionDate: { fontSize: 11, marginTop: 2 },
  transactionAmount: { fontSize: 14, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, marginTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '700' },
  actionButtons: { gap: 10, marginTop: 8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
  editBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
  deleteBtnText: { fontSize: 15, fontWeight: '700' },
  bankSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12 },
  bankSelectorText: { fontSize: 16, fontWeight: '600' },
  bankSelectorPlaceholder: { fontSize: 16 },
  autoCloseInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginBottom: 16 },
  autoCloseText: { fontSize: 13, fontWeight: '500' },
  bankSearchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 12, gap: 10 },
  bankSearchInput: { flex: 1, fontSize: 15, paddingVertical: 4 },
  bankOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  bankOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  bankCodeBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  bankOptionName: { fontSize: 15, fontWeight: '600' },
  bankOptionShort: { fontSize: 12, marginTop: 2 },
  bankEmpty: { alignItems: 'center', paddingVertical: 40 },
  bankEmptyText: { fontSize: 14, fontWeight: '500', marginTop: 8 },
});

export default CardsScreen;