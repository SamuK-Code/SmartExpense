// AddScreen.js — Abas inferiores: Despesa | Receita | Boleto

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { useCircle } from '../context/CircleContext';
import { formatCurrency, isAfterClosingDate, getInvoiceMonth, formatInvoiceMonth } from '../utils/helpers';
import Toast from '../components/Toast';
import SplitExpenseModal from '../components/SplitExpenseModal';
import OCRScanner from '../components/OCRScanner';

const TABS = [
  { key: 'expense', label: 'Despesa', icon: 'remove-circle', colorKey: 'danger' },
  { key: 'income', label: 'Receita', icon: 'add-circle', colorKey: 'success' },
  { key: 'boleto', label: 'Boleto', icon: 'barcode', colorKey: 'warning' },
];

const AddScreen = () => {
  const { categories, cards, transactions, addTransaction, getCardUsage, cashBalance, updateCashBalance, editTransaction, mergedCards, mergedTransactions } = useApp();
  const navigation = useNavigation();
  const { colors, darkMode } = useTheme();
  const { t } = useTranslate();
  const { currentCircle } = useCircle();

  const [activeTab, setActiveTab] = useState('expense');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardId, setCardId] = useState(null);
  const [cardType, setCardType] = useState('credit');
  const [boletoDue, setBoletoDue] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [splitData, setSplitData] = useState(null);
  const [ocrModalVisible, setOcrModalVisible] = useState(false);

  const displayCards = useMemo(() => {
    return currentCircle
      ? (mergedCards || []).filter(c => !c._circleId || c._circleId === currentCircle.id)
      : cards;
  }, [currentCircle, cards, mergedCards]);

  const displayTransactions = useMemo(() => {
    return currentCircle
      ? (mergedTransactions || []).filter(t => !t._circleId || t._circleId === currentCircle.id)
      : transactions;
  }, [currentCircle, transactions, mergedTransactions]);

  const typeConfig = {
    expense: { title: t('add.newExpense'), color: colors.danger, icon: 'remove-circle', submit: t('add.registerExpense') },
    income: { title: t('add.newIncome'), color: colors.success, icon: 'add-circle', submit: t('add.registerIncome') },
    boleto: { title: t('add.newBoleto'), color: colors.warning, icon: 'barcode', submit: t('add.registerBoleto') },
  };

  const formatCurrencyInput = (value) => {
    let cleaned = value.replace(/[^\d.,]/g, '');
    let normalized = cleaned.replace(',', '.');
    const parts = normalized.split('.');
    if (parts.length > 2) {
      normalized = parts[0] + '.' + parts.slice(1).join('');
    }
    const displayValue = normalized.replace('.', ',');
    return displayValue;
  };

  const parseCurrencyToNumber = (value) => {
    if (!value) return 0;
    const normalized = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  const handleAmountChange = (text) => {
    const formatted = formatCurrencyInput(text);
    setAmount(formatted);
  };

  const topCards = useMemo(() => {
    return displayCards
      .map(card => ({ ...card, used: getCardUsage(card.id) }))
      .filter(card => card.used > 0)
      .sort((a, b) => b.used - a.used)
      .slice(0, 3);
  }, [displayCards, displayTransactions, getCardUsage]);

  const topCategories = useMemo(() => {
    const catTotals = {};
    displayTransactions
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
  }, [displayTransactions, t]);

  const pendingBoletos = useMemo(() => {
    return displayTransactions
      .filter(t => t.paymentMethod === 'boleto' && !t.isPaid)
      .sort((a, b) => new Date(a.boletoDue || a.date) - new Date(b.boletoDue || b.date));
  }, [displayTransactions]);

  const handlePayBoleto = (boleto) => {
    if (cashBalance < boleto.amount) {
      showToast(`Saldo em caixa insuficiente. Disponível: ${formatCurrency(cashBalance)}`, 'error');
      return;
    }

    updateCashBalance(-boleto.amount);

    editTransaction(boleto.id, {
      isPaid: true,
      paidAt: new Date().toISOString(),
      desc: boleto.desc.includes('(Quitado)') ? boleto.desc : boleto.desc + ' (Quitado)',
    });

    showToast(`Boleto "${boleto.desc}" quitado! ${formatCurrency(boleto.amount)} deduzido do caixa.`, 'success');
  };

  const getInvoiceWarning = () => {
    if (activeTab !== 'expense' || paymentMethod !== 'card' || cardType !== 'credit' || !cardId) return null;

    const selectedCard = displayCards.find(c => c.id.toString() === cardId.toString());
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

  const handleOCRResult = (result) => {
    if (result.amount) {
      setAmount(result.amount.toString().replace('.', ','));
    }
    if (result.date) {
      setDate(result.date);
    }
    if (result.description && !desc) {
      setDesc(result.description);
    }
    showToast(t('ocr.success'), 'success');
  };

  const switchTab = (tabKey) => {
    setActiveTab(tabKey);
    setDesc('');
    setAmount('');
    setCategoryId('');
    setCardType('credit');
    setPaymentMethod(tabKey === 'income' ? 'pix' : tabKey === 'boleto' ? 'boleto' : 'card');
    setCardId('');
    setBoletoDue('');
    setSplitData(null);
    Keyboard.dismiss();
  };

  const handleSubmit = () => {
    const numericAmount = parseCurrencyToNumber(amount);
    if (!desc || !numericAmount || (activeTab !== 'income' && !categoryId)) {
      showToast(t('add.fillRequired'), 'error');
      return;
    }

    const category = activeTab === 'income'
      ? { id: 'income', name: 'Receita', icon: 'cash', color: colors.success }
      : categories.find(c => c.id === categoryId);

    const selectedCard = displayCards.find(c => c.id.toString() === cardId?.toString());

    const isCreditCard = paymentMethod === 'card' && cardType === 'credit';
    const isDebitCard = paymentMethod === 'card' && cardType === 'debit';

    if (isDebitCard && cashBalance < numericAmount) {
      showToast(`Saldo em caixa insuficiente. Disponível: ${formatCurrency(cashBalance)}`, 'error');
      return;
    }

    const transaction = {
      type: activeTab,
      desc,
      amount: numericAmount,
      date,
      category: categoryId || 'income',
      categoryName: category ? category.name : t('categories.other'),
      categoryIcon: category ? category.icon : 'pricetag',
      categoryColor: category ? category.color : '#94A3B8',
      paymentMethod,
      cardId: paymentMethod === 'card' ? parseInt(cardId, 10) : null,
      cardType: paymentMethod === 'card' ? cardType : null,
      boletoDue: activeTab === 'boleto' ? boletoDue : null,
      isPaid: activeTab === 'boleto' ? false : undefined,
      isNextInvoice: isCreditCard && selectedCard ? isAfterClosingDate(date, selectedCard.closeDate) : false,
      invoiceMonth: isCreditCard && selectedCard ? getInvoiceMonth(date, selectedCard.closeDate) : null,
      split: splitData || null,
    };

    addTransaction(transaction);
    setDesc('');
    setAmount('');
    setCategoryId('');
    setCardId('');
    setBoletoDue('');
    setSplitData(null);
    showToast(`${typeConfig[activeTab].title} ${t('add.success')}`, 'success');
  };

  const handlePayBoletoDirect = () => {
    const numericAmount = parseCurrencyToNumber(amount);
    if (!desc || !numericAmount || !categoryId || !boletoDue) {
      showToast(t('add.fillRequired'), 'error');
      return;
    }
    if (cashBalance < numericAmount) {
      showToast(`Saldo em caixa insuficiente. Disponível: ${formatCurrency(cashBalance)}`, 'error');
      return;
    }
    const category = categories.find(c => c.id === categoryId);
    addTransaction({
      type: 'expense',
      desc: desc + ' (Quitado)',
      amount: numericAmount,
      date,
      category: categoryId,
      categoryName: category?.name || t('categories.other'),
      categoryIcon: category?.icon || 'pricetag',
      categoryColor: category?.color || '#94A3B8',
      paymentMethod: 'boleto',
      cardId: null,
      cardType: null,
      boletoDue,
      isPaid: true,
      paidAt: new Date().toISOString(),
    });
    updateCashBalance(-numericAmount);
    setDesc('');
    setAmount('');
    setCategoryId('');
    setBoletoDue('');
    showToast('Boleto quitado com sucesso!', 'success');
  };

  const paymentMethods = activeTab === 'income'
    ? [
        { key: 'pix', label: t('add.pix'), icon: 'qr-code', color: '#10B981' },
        { key: 'cash', label: t('add.cash'), icon: 'cash', color: '#F59E0B' },
      ]
    : activeTab === 'boleto'
    ? [
        { key: 'boleto', label: t('add.boleto'), icon: 'barcode', color: colors.warning },
      ]
    : [
        { key: 'card', label: t('add.card'), icon: 'card', color: '#8B5CF6' },
        { key: 'pix', label: t('add.pix'), icon: 'qr-code', color: '#10B981' },
      ];

  const cardTypes = [
    { key: 'credit', label: t('add.credit'), icon: 'card', color: '#8B5CF6' },
    { key: 'debit', label: t('add.debit'), icon: 'card', color: '#3B82F6' },
  ];

  const renderInput = (label, value, onChange, placeholder, keyboardType = 'default', props = {}) => (
    <View style={styles.formGroup}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: darkMode ? colors.bgTertiary : '#F1F5F9', color: colors.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        {...props}
      />
    </View>
  );

  const renderForm = () => (
    <View style={{ paddingBottom: 20 }}>
      {renderInput(t('add.description'), desc, setDesc, t('common.descriptionPlaceholder') || 'Ex: Supermercado Extra')}

      <View style={styles.formRow}>
        {renderInput(t('add.amount'), amount, handleAmountChange, '0,00', 'decimal-pad')}
        {renderInput(t('add.date'), date, setDate, 'YYYY-MM-DD')}
      </View>

      {/* Categorias */}
      {activeTab !== 'income' && (
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
                style={[styles.categoryChip, {
                  backgroundColor: categoryId === c.id ? c.color + '18' : darkMode ? colors.bgTertiary : '#F1F5F9',
                  borderColor: categoryId === c.id ? c.color + '50' : 'transparent',
                  borderWidth: categoryId === c.id ? 1.5 : 1,
                }]}
                onPress={() => { Keyboard.dismiss(); setCategoryId(c.id); }}
              >
                <View style={[styles.categoryChipIcon, { backgroundColor: c.color + '15' }]}>
                  <Ionicons name={c.icon} size={14} color={c.color} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: categoryId === c.id ? c.color : colors.textPrimary }}>
                  {c.name}
                </Text>
                {categoryId === c.id && (
                  <View style={[styles.checkBadge, { backgroundColor: c.color }]}>
                    <Ionicons name="checkmark" size={9} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Métodos de pagamento */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('add.paymentMethod')}</Text>
        <View style={styles.paymentGrid}>
          {paymentMethods.map(method => (
            <TouchableOpacity
              key={method.key}
              activeOpacity={0.7}
              style={[styles.paymentOption, {
                backgroundColor: paymentMethod === method.key ? method.color + '12' : darkMode ? colors.bgTertiary : '#F1F5F9',
                borderColor: paymentMethod === method.key ? method.color + '50' : 'transparent',
                borderWidth: paymentMethod === method.key ? 1.5 : 1,
              }]}
              onPress={() => { Keyboard.dismiss(); setPaymentMethod(method.key); if (method.key === 'card') setCardType('credit'); }}
            >
              <View style={[styles.paymentIcon, { backgroundColor: method.color + '15' }]}>
                <Ionicons name={method.icon} size={14} color={method.color} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: paymentMethod === method.key ? method.color : colors.textPrimary }}>
                {method.label}
              </Text>
              {paymentMethod === method.key && (
                <View style={[styles.checkBadgeSmall, { backgroundColor: method.color }]}>
                  <Ionicons name="checkmark" size={8} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cartão */}
      {activeTab !== 'income' && paymentMethod === 'card' && displayCards.length > 0 && (
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('add.card')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardScroll}
            keyboardShouldPersistTaps="handled"
          >
            {displayCards.map(c => (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.7}
                style={[styles.cardChip, {
                  backgroundColor: String(cardId) === String(c.id) ? (c.color || colors.primary) + '12' : darkMode ? colors.bgTertiary : '#F1F5F9',
                  borderColor: String(cardId) === String(c.id) ? (c.color || colors.primary) + '60' : 'transparent',
                  borderWidth: String(cardId) === String(c.id) ? 2 : 1,
                }]}
                onPress={() => { Keyboard.dismiss(); setCardId(c.id); }}
              >
                <View style={[styles.cardChipIcon, { backgroundColor: (c.color || colors.primary) + '15' }]}>
                  <Ionicons name="card" size={14} color={c.color || colors.primary} />
                </View>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: String(cardId) === String(c.id) ? (c.color || colors.primary) : colors.textPrimary }}>
                    {c.name}
                  </Text>
                  <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 1 }}>{c.number}</Text>
                </View>
                {String(cardId) === String(c.id) && (
                  <View style={[styles.cardCheckBadge, { backgroundColor: c.color || colors.primary }]}>
                    <Ionicons name="checkmark" size={10} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {invoiceWarning && (
            <View style={[styles.invoiceWarning, { backgroundColor: invoiceWarning.color + '10', borderColor: invoiceWarning.color + '30' }]}>
              <Ionicons name="calendar" size={14} color={invoiceWarning.color} />
              <Text style={[styles.invoiceWarningText, { color: invoiceWarning.color }]}>{invoiceWarning.message}</Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('add.cardType')}</Text>
            <View style={styles.paymentGrid}>
              {cardTypes.map(type => (
                <TouchableOpacity
                  key={type.key}
                  activeOpacity={0.7}
                  style={[styles.paymentOption, {
                    backgroundColor: cardType === type.key ? type.color + '12' : darkMode ? colors.bgTertiary : '#F1F5F9',
                    borderColor: cardType === type.key ? type.color + '50' : 'transparent',
                    borderWidth: cardType === type.key ? 1.5 : 1,
                  }]}
                  onPress={() => { Keyboard.dismiss(); setCardType(type.key); }}
                >
                  <View style={[styles.paymentIcon, { backgroundColor: type.color + '15' }]}>
                    <Ionicons name={type.icon} size={14} color={type.color} />
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: cardType === type.key ? type.color : colors.textPrimary }}>
                    {type.label}
                  </Text>
                  {cardType === type.key && (
                    <View style={[styles.checkBadgeSmall, { backgroundColor: type.color }]}>
                      <Ionicons name="checkmark" size={8} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Boleto Due */}
      {activeTab === 'boleto' && (
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('add.boletoDue') || 'Data de Vencimento'}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: darkMode ? colors.bgTertiary : '#F1F5F9', color: colors.textPrimary }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={boletoDue}
            onChangeText={setBoletoDue}
          />
          <Text style={[styles.inputHint, { color: colors.textMuted }]}>
            O boleto será listado como pendente até ser quitado.
          </Text>
        </View>
      )}

      {/* Ações do Boleto */}
      {activeTab === 'boleto' && (
        <View style={styles.boletoActions}>
          <TouchableOpacity
            style={[styles.boletoActionBtn, { backgroundColor: colors.warning }]}
            onPress={() => { Keyboard.dismiss(); handleSubmit(); }}
          >
            <Ionicons name="document-text" size={16} color="#FFF" />
            <Text style={styles.boletoActionText}>Salvar como Pendente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.boletoActionBtn, { backgroundColor: colors.success }]}
            onPress={() => { Keyboard.dismiss(); handlePayBoletoDirect(); }}
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFF" />
            <Text style={styles.boletoActionText}>Salvar e Quitar Agora</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'boleto' && (
        <View style={styles.boletoInfoBox}>
          <Ionicons name="information-circle" size={14} color={colors.primary} />
          <Text style={[styles.boletoInfoText, { color: colors.textMuted }]}>
            Salvar como pendente: o boleto aparecerá na lista de boletos pendentes.
Quitar agora: o valor será deduzido do saldo em caixa imediatamente.
          </Text>
        </View>
      )}

      {/* Scanner OCR */}
      {activeTab === 'expense' && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}
          onPress={() => { Keyboard.dismiss(); setOcrModalVisible(true); }}
        >
          <View style={[styles.actionBtnIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="scan" size={16} color={colors.primary} />
          </View>
          <View style={styles.actionBtnTextBox}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>{t('ocr.scanReceipt')}</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>Preencha automaticamente</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Dividir Despesa */}
      {activeTab === 'expense' && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}
          onPress={() => {
            Keyboard.dismiss();
            const parsed = parseCurrencyToNumber(amount);
            if (!desc || parsed <= 0) { showToast(t('add.fillRequired'), 'error'); return; }
            setSplitModalVisible(true);
          }}
        >
          <View style={[styles.actionBtnIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="people" size={16} color={colors.primary} />
          </View>
          <View style={styles.actionBtnTextBox}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>
              {splitData ? t('split.editSplit') : t('split.divideExpense')}
            </Text>
            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
              {splitData ? `${splitData.participants?.length || 0} participantes` : 'Divida com amigos ou círculo'}
            </Text>
          </View>
          {splitData && (
            <View style={[styles.splitBadge, { backgroundColor: colors.success }]}>
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>{splitData.participants?.length || 0}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Hint income */}
      {activeTab === 'income' && (
        <View style={styles.incomeHint}>
          <Ionicons name="information-circle" size={14} color={colors.primary} />
          <Text style={[styles.incomeHintText, { color: colors.textMuted }]}>
            Receitas são registradas automaticamente sem categoria.
          </Text>
        </View>
      )}

      {/* Submit: expense e income */}
      {activeTab !== 'boleto' && (
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: typeConfig[activeTab].color }]}
          onPress={() => { Keyboard.dismiss(); handleSubmit(); }}
        >
          <Ionicons name="save" size={16} color="#FFF" />
          <Text style={styles.submitText}>{typeConfig[activeTab].submit}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border + '30' }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleBox}>
            <View style={[styles.headerIconBox, { backgroundColor: colors.primary + '12' }]}>
              <Ionicons name="add-circle" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('add.title')}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: colors.primary + '10' }]}
              onPress={() => navigation.navigate('Budget')}
            >
              <Ionicons name="wallet" size={16} color={colors.primary} />
            </TouchableOpacity>
            {currentCircle && (
              <View style={[styles.circleChip, { backgroundColor: colors.primary + '10' }]}>
                <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.circleChipText, { color: colors.primary }]} numberOfLines={1}>
                  {currentCircle.name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* SCROLL PRINCIPAL */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingTop: 16 }} />

        {/* QUICK SUMMARY */}
        <View style={styles.quickSummary}>
          <View style={[styles.summaryCard, { backgroundColor: darkMode ? colors.bgCard : '#FFF' }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.success + '12' }]}>
                  <Ionicons name="wallet" size={16} color={colors.success} />
                </View>
                <View>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Saldo em Caixa</Text>
                  <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatCurrency(cashBalance)}</Text>
                </View>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border + '30' }]} />
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.warning + '12' }]}>
                  <Ionicons name="document-text" size={16} color={colors.warning} />
                </View>
                <View>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Boletos Pendentes</Text>
                  <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{pendingBoletos.length}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* TOP CARDS */}
        {topCards.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                <Ionicons name="card" size={14} color={colors.primary} />  {t('add.topCards')}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardScroll}>
              {topCards.map(card => (
                <View key={card.id} style={[styles.topCard, { backgroundColor: darkMode ? colors.bgCard : '#FFF' }]}>
                  <View style={[styles.topCardBar, { backgroundColor: card.color || colors.primary }]} />
                  <View style={styles.topCardHeader}>
                    <View style={[styles.topCardIcon, { backgroundColor: (card.color || colors.primary) + '12' }]}>
                      <Ionicons name="card" size={14} color={card.color || colors.primary} />
                    </View>
                    <Text style={[styles.topCardName, { color: colors.textPrimary }]} numberOfLines={1}>{card.name}</Text>
                  </View>
                  <Text style={[styles.topCardNumber, { color: colors.textMuted }]}>{card.number}</Text>
                  <Text style={[styles.topCardValue, { color: colors.danger }]}>{formatCurrency(card.used)}</Text>
                  <Text style={[styles.topCardLabel, { color: colors.textMuted }]}>{t('cards.used')}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* TOP CATEGORIES */}
        {topCategories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                <Ionicons name="pie-chart" size={14} color={colors.primary} />  Top Categorias
              </Text>
            </View>
            <View style={[styles.categoryList, { backgroundColor: darkMode ? colors.bgCard : '#FFF' }]}>
              {topCategories.map((cat, index) => (
                <View key={cat.name} style={styles.categoryRow}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryRank, {
                      backgroundColor: index === 0 ? '#F59E0B18' : index === 1 ? '#6B728018' : '#92400E18'
                    }]}>
                      <Text style={[styles.categoryRankText, {
                        color: index === 0 ? '#F59E0B' : index === 1 ? '#6B7280' : '#92400E'
                      }]}>{index + 1}</Text>
                    </View>
                    <View style={[styles.categoryIconBg, { backgroundColor: cat.color + '12' }]}>
                      <Ionicons name={cat.icon} size={14} color={cat.color} />
                    </View>
                    <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{cat.name}</Text>
                  </View>
                  <Text style={[styles.categoryValue, { color: colors.danger }]}>{formatCurrency(cat.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* BOLETOS PENDENTES */}
        {pendingBoletos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                <Ionicons name="barcode" size={14} color={colors.warning} />  Boletos Pendentes
              </Text>
            </View>
            <View style={[styles.boletoList, { backgroundColor: darkMode ? colors.bgCard : '#FFF' }]}>
              {pendingBoletos.map(boleto => (
                <View key={boleto.id} style={styles.boletoRow}>
                  <View style={styles.boletoLeft}>
                    <View style={[styles.boletoIconBg, { backgroundColor: colors.warning + '12' }]}>
                      <Ionicons name="document-text" size={16} color={colors.warning} />
                    </View>
                    <View style={styles.boletoInfo}>
                      <Text style={[styles.boletoName, { color: colors.textPrimary }]} numberOfLines={1}>{boleto.desc}</Text>
                      <Text style={[styles.boletoDue, { color: colors.textMuted }]}>Vence: {boleto.boletoDue || 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={styles.boletoRight}>
                    <Text style={[styles.boletoValue, { color: colors.danger }]}>{formatCurrency(boleto.amount)}</Text>
                    <TouchableOpacity
                      style={[styles.payBtn, { backgroundColor: cashBalance >= boleto.amount ? colors.success : colors.textMuted + '60' }]}
                      onPress={() => handlePayBoleto(boleto)}
                      disabled={cashBalance < boleto.amount}
                    >
                      <Ionicons name="checkmark-circle" size={10} color="#FFF" />
                      <Text style={styles.payBtnText}>Quitar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* EMPTY STATE */}
        {topCards.length === 0 && topCategories.length === 0 && pendingBoletos.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.primary + '10' }]}>
              <Ionicons name="hand-left" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('add.hint')}</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>{t('add.subHint')}</Text>
          </View>
        )}

        {/* SEPARADOR */}
        <View style={[styles.separator, { backgroundColor: colors.border + '20' }]} />

        {/* TÍTULO DO FORMULÁRIO */}
        <View style={styles.formHeader}>
          <View style={[styles.formHeaderIcon, { backgroundColor: typeConfig[activeTab].color + '15' }]}>
            <Ionicons name={typeConfig[activeTab].icon} size={18} color={typeConfig[activeTab].color} />
          </View>
          <Text style={[styles.formHeaderTitle, { color: colors.textPrimary }]}>
            {typeConfig[activeTab].title}
          </Text>
        </View>

        {/* FORMULÁRIO */}
        {renderForm()}
      </ScrollView>

      {/* TABS INFERIORES */}
      <View style={[styles.tabBar, { backgroundColor: colors.bgCard, borderTopColor: colors.border + '30' }]}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const tabColor = colors[tab.colorKey];
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              style={[styles.tabItem, isActive && { backgroundColor: tabColor + '12' }]}
              onPress={() => switchTab(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={isActive ? tabColor : colors.textMuted}
              />
              <Text style={[styles.tabLabel, { color: isActive ? tabColor : colors.textMuted }]}>
                {tab.label}
              </Text>
              {isActive && (
                <View style={[styles.tabIndicator, { backgroundColor: tabColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <SplitExpenseModal
        visible={splitModalVisible}
        onClose={() => setSplitModalVisible(false)}
        transaction={{ desc, amount: parseCurrencyToNumber(amount) }}
        onSplit={(data) => { setSplitData(data); showToast(t('split.saved'), 'success'); }}
      />

      <OCRScanner
        visible={ocrModalVisible}
        onClose={() => setOcrModalVisible(false)}
        onResult={handleOCRResult}
      />

      <Toast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { paddingTop: 44, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerActionBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  circleChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, maxWidth: 140 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  circleChipText: { fontSize: 10, fontWeight: '600' },

  scroll: { flex: 1, paddingHorizontal: 16 },

  // Quick Summary
  quickSummary: { marginBottom: 20 },
  summaryCard: { borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  summaryLabel: { fontSize: 10, fontWeight: '500', letterSpacing: 0.2, textTransform: 'uppercase' },
  summaryValue: { fontSize: 16, fontWeight: '700', marginTop: 1 },
  summaryDivider: { width: 1, height: 40, marginHorizontal: 12 },

  // Sections
  section: { marginBottom: 16 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },

  // Top Cards
  cardScroll: { paddingRight: 12, gap: 8 },
  topCard: { width: 150, padding: 10, borderRadius: 14, marginRight: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  topCardBar: { width: 32, height: 3, borderRadius: 2, marginBottom: 8 },
  topCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  topCardIcon: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  topCardName: { fontSize: 12, fontWeight: '600', flex: 1 },
  topCardNumber: { fontSize: 10, marginBottom: 6 },
  topCardValue: { fontSize: 14, fontWeight: '700' },
  topCardLabel: { fontSize: 9, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 1 },

  // Categories
  categoryList: { borderRadius: 14, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryRank: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  categoryRankText: { fontSize: 10, fontWeight: '800' },
  categoryIconBg: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  categoryName: { fontSize: 12, fontWeight: '600' },
  categoryValue: { fontSize: 12, fontWeight: '700' },

  // Boletos
  boletoList: { borderRadius: 14, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  boletoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  boletoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  boletoIconBg: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  boletoInfo: { flex: 1 },
  boletoName: { fontSize: 12, fontWeight: '600' },
  boletoDue: { fontSize: 10, fontWeight: '400', marginTop: 1 },
  boletoRight: { alignItems: 'flex-end', gap: 6 },
  boletoValue: { fontSize: 12, fontWeight: '700' },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  payBtnText: { color: '#FFF', fontSize: 10, fontWeight: '600' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIconBox: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  emptySub: { fontSize: 11, fontWeight: '400' },

  // Separator
  separator: { height: 8, marginVertical: 20, borderRadius: 4 },

  // Form Header
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  formHeaderIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  formHeaderTitle: { fontSize: 18, fontWeight: '700' },

  // Form
  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 14, borderRadius: 12, fontSize: 16 },
  inputHint: { fontSize: 11, fontWeight: '500', marginTop: 6, lineHeight: 16 },

  // Category Selector
  categoryScroll: { paddingRight: 16, gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, marginRight: 5 },
  categoryChipIcon: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  checkBadge: { width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },

  // Payment Grid
  paymentGrid: { flexDirection: 'row', gap: 10 },
  paymentOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  paymentIcon: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  checkBadgeSmall: { width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 6, right: 6 },

  // Card Selector
  cardScroll: { paddingRight: 16, gap: 8 },
  cardChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, marginRight: 5, position: 'relative' },
  cardChipIcon: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  cardCheckBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },

  // Invoice Warning
  invoiceWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, marginTop: 6, borderWidth: 1 },
  invoiceWarningText: { fontSize: 11, fontWeight: '600', flex: 1 },

  // Action Buttons (Scanner / Split)
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderStyle: 'dashed' },
  actionBtnIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  actionBtnTextBox: { flex: 1 },
  splitBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // Submit
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, marginTop: 6 },
  submitText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Income Hint
  incomeHint: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, backgroundColor: 'rgba(129,140,248,0.08)', marginBottom: 8 },
  incomeHintText: { fontSize: 11, fontWeight: '500', flex: 1, lineHeight: 16 },

  // Boleto Actions
  boletoActions: { gap: 10, marginBottom: 14 },
  boletoActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 12 },
  boletoActionText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  boletoInfoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, backgroundColor: 'rgba(129,140,248,0.06)' },
  boletoInfoText: { fontSize: 10, fontWeight: '400', flex: 1, lineHeight: 14 },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingBottom: 28,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
});

export default AddScreen;