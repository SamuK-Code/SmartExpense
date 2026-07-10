// HistoryScreen.js — Histórico Unificado com Círculos Financeiros (Arquivo 5/10)
// Agora mostra transações locais + compartilhadas com filtros por círculo e origem

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert, Animated
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { useCircle } from '../context/CircleContext';
import { formatCurrency, getCurrentMonth, getMonthYear } from '../utils/helpers';
import TransactionItem from '../components/TransactionItem';
import Toast from '../components/Toast';
import SplitExpenseItem from '../components/SplitExpenseItem';
import SplitExpenseModal from '../components/SplitExpenseModal';

const { width } = Dimensions.get('window');

const HistoryScreen = () => {
  const {
    transactions, categories, deleteTransaction,
    mergedTransactions, isSharedItem, getItemShareInfo,
    splitTransaction, markSplitPaid, removeSplit
  } = useApp();
  const { colors, darkMode } = useTheme();
  const { t } = useTranslate();
  const {
    currentCircle, myCircles, syncEnabled
  } = useCircle();

  // Estados
  const [chartType, setChartType] = useState('pie');
  const [filter, setFilter] = useState('all');         // all | expense | income | boleto
  const [originFilter, setOriginFilter] = useState('all'); // all | local | shared
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [circleFilter, setCircleFilter] = useState(null); // null = todos os círculos | 'local' = só local
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [showCircleFilter, setShowCircleFilter] = useState(false);
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // ── DETERMINAR POOL DE TRANSAÇÕES ──
  const txPool = useMemo(() => {
    if (!currentCircle) return transactions || [];
    // Se estiver em um círculo, usa mergedTransactions filtrado por círculo
    return (mergedTransactions || []).filter(tx => !tx._circleId || tx._circleId === currentCircle.id);
  }, [currentCircle, transactions, mergedTransactions]);

  // ── MÊS ATUAL ──
  const month = getCurrentMonth();

  // ── FILTRAR POR CÍRCULO/ORIGEM ──
  const originFiltered = useMemo(() => {
    let pool = [...(txPool || [])];

    // Filtro por origem (local vs compartilhado)
    if (originFilter === 'local') {
      pool = pool.filter(t => !t._circleId && !t._sharedBy);
    } else if (originFilter === 'shared') {
      pool = pool.filter(t => !!t._circleId || !!t._sharedBy);
    }

    // Filtro por círculo específico (quando não há currentCircle ativo)
    if (circleFilter === 'local') {
      pool = pool.filter(t => !t._circleId);
    } else if (circleFilter && circleFilter !== 'all') {
      pool = pool.filter(t => t._circleId === circleFilter);
    }

    return pool;
  }, [txPool, originFilter, circleFilter]);

  // ── TRANSAÇÕES DO MÊS (para gráficos) ──
  const monthTransactions = useMemo(() => {
    return (originFiltered || []).filter(t => (t.date || t.createdAt || '').startsWith(month));
  }, [originFiltered, month]);

  // ── TOTAL DO MÊS ──
  const monthTotal = useMemo(() => {
    return (monthTransactions || []).reduce((sum, t) => {
      return sum + (t.type === 'income' ? (t.amount || 0) : -(t.amount || 0));
    }, 0);
  }, [monthTransactions]);

  // ── TOTAIS POR CATEGORIA (apenas despesas do mês) ──
  const categoryTotals = useMemo(() => {
    const totals = {};
    (monthTransactions || [])
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const catName = t.categoryName || (t.category ? t.category.name : null) || t.category || t('common.other');
        totals[catName] = (totals[catName] || 0) + (t.amount || 0);
      });
    return totals;
  }, [monthTransactions]);

  const chartColors = useMemo(() => {
    return Object.keys(categoryTotals || {}).map(name => {
      const cat = (categories || []).find(c => c.name === name);
      return cat ? cat.color : colors.textMuted;
    });
  }, [categoryTotals, categories]);

  // ── LISTA DE TRANSAÇÕES FILTRADAS ──
  const filteredTransactions = useMemo(() => {
    return [...(originFiltered || [])]
      .sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0);
        const dateB = new Date(b.date || b.createdAt || 0);
        return dateB - dateA;
      })
      .filter(t => {
        if (categoryFilter) {
          const catName = t.categoryName || (t.category ? t.category.name : null) || t.category || '';
          return catName === categoryFilter;
        }
        if (filter === 'all') return true;
        return t.type === filter;
      });
  }, [originFiltered, categoryFilter, filter]);

  // ── ESTATÍSTICAS ──
  const stats = useMemo(() => {
    const income = (originFiltered || []).filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = (originFiltered || []).filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const boleto = (originFiltered || []).filter(t => t.paymentMethod === 'boleto' && !t.isPaid).reduce((s, t) => s + (t.amount || 0), 0);
    return { income, expense, boleto, count: (originFiltered || []).length };
  }, [originFiltered]);

  // ── HELPERS ──
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleDelete = useCallback((id) => {
    const tx = (originFiltered || []).find(t => t.id === id);
    const info = getItemShareInfo ? getItemShareInfo(tx) : null;

    // Não permite deletar itens compartilhados por outros
    if (tx && tx._sharedBy && !(info && info.canEdit)) {
      showToast(t('common.noPermission'), 'error');
      return;
    }

    Alert.alert(
      t('history.confirmDeleteTitle'),
      t('history.confirmDeleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteTransaction(id);
            showToast(t('history.transactionDeleted'), 'warning');
          }
        },
      ]
    );
  }, [originFiltered, getItemShareInfo, t, deleteTransaction]);

  const getSharedBadge = (item) => {
    if (!item) return null;
    const info = getItemShareInfo ? getItemShareInfo(item) : null;
    if (!info || !info.isShared) return null;
    return (
      <View style={[styles.sharedBadge, { backgroundColor: info.canEdit ? colors.success : colors.primary }]}>
        <Ionicons name={info.canEdit ? "create-outline" : "eye-outline"} size={10} color="#FFF" />
        <Text style={styles.sharedBadgeText}>{info.canEdit ? t('common.editPermission') : t('common.view')}</Text>
      </View>
    );
  };

  const handleOpenSplit = (tx) => {
    setSelectedTransaction(tx);
    setSplitModalVisible(true);
  };

  const handleSplitSave = (splitData) => {
    if (selectedTransaction) {
      splitTransaction(selectedTransaction.id, splitData);
      showToast(t('split.saved'), 'success');
    }
  };

  const handleMarkPaid = (txId, participantId) => {
    markSplitPaid(txId, participantId);
    showToast(t('split.paid'), 'success');
  };

  const getOriginBadge = (item) => {
    if (!item || (!item._circleId && !item._sharedBy)) return null;
    return (
      <View style={[styles.originBadge, { backgroundColor: colors.primary + '18' }]}>
        <Ionicons name="people-outline" size={10} color={colors.primary} />
        <Text style={[styles.originBadgeText, { color: colors.primary }]}>
          {item._sharedByName || item._sharedBy || t('common.shared')}
        </Text>
      </View>
    );
  };

  // ── RENDER ──
  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.bgCard }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('history.title')}</Text>
          {currentCircle && (
            <View style={[styles.circleChip, { backgroundColor: colors.primary + '15' }]}>
              <View style={[styles.onlineDot, { backgroundColor: syncEnabled ? colors.success : colors.danger }]} />
              <Text style={[styles.circleChipText, { color: colors.primary }]} numberOfLines={1}>
                {currentCircle.name}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════ SELETOR DE ORIGEM / CÍRCULO ═══════ */}
        <View style={styles.originBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Filtro de origem */}
            {[
              { key: 'all', label: t('history.all'), icon: 'layers-outline' },
              { key: 'local', label: t('common.private'), icon: 'person-outline' },
              { key: 'shared', label: t('common.shared'), icon: 'people-outline' },
            ].map(o => (
              <TouchableOpacity
                key={o.key}
                style={[
                  styles.originBtn,
                  {
                    backgroundColor: originFilter === o.key
                      ? colors.primary
                      : darkMode ? colors.bgCard : colors.bgTertiary,
                  }
                ]}
                onPress={() => {
                  setOriginFilter(o.key);
                  setCategoryFilter(null);
                }}
              >
                <Ionicons
                  name={o.icon}
                  size={14}
                  color={originFilter === o.key ? '#FFF' : colors.textMuted}
                />
                <Text style={{
                  color: originFilter === o.key ? '#FFF' : colors.textPrimary,
                  fontSize: 12, fontWeight: '600', marginLeft: 4
                }}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Separador */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Filtro por círculo (quando não há currentCircle ativo) */}
            {!currentCircle && (myCircles || []).length > 0 && (
              <>
                <TouchableOpacity
                  style={[
                    styles.originBtn,
                    {
                      backgroundColor: circleFilter === 'local'
                        ? colors.primary
                        : darkMode ? colors.bgCard : colors.bgTertiary,
                    }
                  ]}
                  onPress={() => setCircleFilter(circleFilter === 'local' ? null : 'local')}
                >
                  <Ionicons name="person-outline" size={14} color={circleFilter === 'local' ? '#FFF' : colors.textMuted} />
                  <Text style={{ color: circleFilter === 'local' ? '#FFF' : colors.textPrimary, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
                    {t('common.myData')}
                  </Text>
                </TouchableOpacity>
                {(myCircles || []).map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.originBtn,
                      {
                        backgroundColor: circleFilter === c.id
                          ? colors.primary
                          : darkMode ? colors.bgCard : colors.bgTertiary,
                      }
                    ]}
                    onPress={() => setCircleFilter(circleFilter === c.id ? null : c.id)}
                  >
                    <Ionicons name="people-outline" size={14} color={circleFilter === c.id ? '#FFF' : colors.textMuted} />
                    <Text style={{ color: circleFilter === c.id ? '#FFF' : colors.textPrimary, fontSize: 12, fontWeight: '600', marginLeft: 4 }} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        </View>

        {/* ═══════ ESTATÍSTICAS RÁPIDAS ═══════ */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: darkMode ? colors.bgCard : colors.success + '15' }]}>
            <Ionicons name="arrow-up-circle" size={18} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.success }]}>{formatCurrency(stats.income)}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('common.income')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: darkMode ? colors.bgCard : colors.danger + '10' }]}>
            <Ionicons name="arrow-down-circle" size={18} color={colors.danger} />
            <Text style={[styles.statValue, { color: colors.danger }]}>{formatCurrency(stats.expense)}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('common.expense')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: darkMode ? colors.bgCard : colors.warning + '15' }]}>
            <Ionicons name="document-text" size={18} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.warning }]}>{formatCurrency(stats.boleto)}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('add.boleto')}</Text>
          </View>
        </View>

        {/* ═══════ GRÁFICO ═══════ */}
        <View style={[styles.chartSection, { backgroundColor: colors.bgCard }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{t('history.expensesByCategory')}</Text>
            <View style={styles.chartTabs}>
              <TouchableOpacity
                style={[styles.chartTab, {
                  backgroundColor: chartType === 'pie' ? colors.primary : 'transparent'
                }]}
                onPress={() => setChartType('pie')}
              >
                <Text style={{
                  color: chartType === 'pie' ? '#FFF' : colors.textMuted,
                  fontSize: 12, fontWeight: '600'
                }}>{t('history.pie')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chartTab, {
                  backgroundColor: chartType === 'bar' ? colors.primary : 'transparent'
                }]}
                onPress={() => setChartType('bar')}
              >
                <Text style={{
                  color: chartType === 'bar' ? '#FFF' : colors.textMuted,
                  fontSize: 12, fontWeight: '600'
                }}>{t('history.bar')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {Object.keys(categoryTotals || {}).length > 0 ? (
            chartType === 'pie' ? (
              <PieChart
                data={Object.keys(categoryTotals || {}).map((name, i) => ({
                  name,
                  amount: (categoryTotals || {})[name],
                  color: chartColors[i],
                  legendFontColor: darkMode ? colors.textMuted : colors.textMuted,
                  legendFontSize: 11,
                }))}
                width={width - 48}
                height={200}
                chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                hasLegend={true}
              />
            ) : (
              <BarChart
                data={{
                  labels: Object.keys(categoryTotals || {}).map(n => n.length > 8 ? n.substring(0, 8) + '...' : n),
                  datasets: [{ data: Object.values(categoryTotals || {}) }],
                }}
                width={width - 48}
                height={200}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: colors.bgCard,
                  backgroundGradientTo: colors.bgCard,
                  color: (opacity = 1) => darkMode ? `rgba(203, 213, 225, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
                  labelColor: () => darkMode ? colors.textMuted : colors.textMuted,
                  barPercentage: 0.7,
                }}
                style={{ borderRadius: 16 }}
                showValuesOnTopOfBars
              />
            )
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="pie-chart-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyChartText, { color: colors.textMuted }]}>{t('history.noData')}</Text>
            </View>
          )}

          <Text style={[styles.chartHint, { color: colors.textMuted }]}>
            {t('history.tapSlice')}
          </Text>
        </View>

        {/* ═══════ FILTROS POR TIPO ═══════ */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: t('history.all') },
              { key: 'expense', label: t('history.expenses') },
              { key: 'income', label: t('history.incomes') },
              { key: 'boleto', label: t('history.boletos') },
            ].map(f => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: filter === f.key && !categoryFilter
                      ? colors.primary
                      : darkMode ? colors.bgCard : colors.bgTertiary,
                  }
                ]}
                onPress={() => {
                  setFilter(f.key);
                  setCategoryFilter(null);
                }}
              >
                <Text style={{
                  color: filter === f.key && !categoryFilter ? '#FFF' : colors.textPrimary,
                  fontSize: 12, fontWeight: '600'
                }}>
                  {categoryFilter && f.key === 'all' ? `${t('history.filter')}: ${categoryFilter}` : f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ═══════ RESUMO DO PERÍODO ═══════ */}
        <View style={styles.periodSummary}>
          <View style={[styles.periodCard, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}>
            <Text style={[styles.periodLabel, { color: colors.textMuted }]}>{t('history.period')}</Text>
            <Text style={[styles.periodValue, { color: colors.textPrimary }]}>{getMonthYear()}</Text>
          </View>
          <View style={[styles.periodCard, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}>
            <Text style={[styles.periodLabel, { color: colors.textMuted }]}>{t('history.total')}</Text>
            <Text style={[styles.periodValue, { color: monthTotal >= 0 ? colors.success : colors.danger }]}>
              {formatCurrency(monthTotal)}
            </Text>
          </View>
          <View style={[styles.periodCard, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}>
            <Text style={[styles.periodLabel, { color: colors.textMuted }]}>{t('groups.transactions')}</Text>
            <Text style={[styles.periodValue, { color: colors.textPrimary }]}>{stats.count}</Text>
          </View>
        </View>

        {/* ═══════ LISTA DE TRANSAÇÕES ═══════ */}
        <View style={styles.transactionsList}>
          {(filteredTransactions || []).length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}>
              <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {categoryFilter ? t('history.noCategoryTransactions') : t('history.noTransactions')}
              </Text>
            </View>
          ) : (
            (filteredTransactions || []).map((tx, index) => (
              <View key={tx.id}>
                <View style={styles.txRow}>
                  <View style={styles.txItemWrapper}>
                    <TransactionItem
                      transaction={tx}
                      onLongPress={() => handleDelete(tx.id)}
                    />
                  </View>
                  <View style={styles.txBadges}>
                    {tx.split && (
                      <SplitExpenseItem split={tx.split} compact={true} />
                    )}
                    {getSharedBadge(tx)}
                    {getOriginBadge(tx)}
                  </View>
                </View>

                {/* Detalhes da divisão (expandido) */}
                {tx.split && (
                  <View style={{ marginLeft: 12, marginRight: 4 }}>
                    <SplitExpenseItem
                      split={tx.split}
                      onPress={() => handleOpenSplit(tx)}
                    />
                  </View>
                )}

                {/* Botão Dividir (só para despesas sem split) */}
                {tx.type === 'expense' && !tx.split && (
                  <TouchableOpacity
                    style={[styles.splitBtn, { borderColor: colors.primary + '30' }]}
                    onPress={() => handleOpenSplit(tx)}
                  >
                    <Ionicons name="people-outline" size={14} color={colors.primary} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary, marginLeft: 6 }}>
                      {t('split.divideExpense')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <SplitExpenseModal
        visible={splitModalVisible}
        onClose={() => setSplitModalVisible(false)}
        transaction={selectedTransaction ? {
          desc: selectedTransaction.desc || selectedTransaction.description,
          amount: selectedTransaction.amount,
        } : null}
        onSplit={handleSplitSave}
      />

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  circleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    maxWidth: 160,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  circleChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Conteúdo
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  // Barra de Origem
  originBar: { marginBottom: 14 },
  originBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 6,
    alignSelf: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Gráfico
  chartSection: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: { fontSize: 16, fontWeight: '600' },
  chartTabs: { flexDirection: 'row', gap: 6, backgroundColor: 'rgba(0, 0, 0, 0.025)', borderRadius: 20, padding: 3 },
  chartTab: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 17 },
  emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyChartText: { fontSize: 14, fontWeight: '500' },
  chartHint: { textAlign: 'center', fontSize: 11, marginTop: 8, fontWeight: '500' },

  // Filtros
  filterBar: { marginBottom: 14 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },

  // Período
  periodSummary: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  periodCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: '600',
  },
  periodValue: { fontSize: 16, fontWeight: '700' },

  // Transações
  transactionsList: { gap: 8, marginBottom: 20 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txItemWrapper: { flex: 1 },
  txBadges: {
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 8,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sharedBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  originBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  originBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
  },
  emptyText: { fontSize: 15, fontWeight: '600', marginTop: 12 },

  splitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 6,
    marginBottom: 10,
    marginLeft: 12,
    marginRight: 12,
    alignSelf: 'flex-start',
  },
});

export default HistoryScreen;