// HomeScreen.js — Resumo Unificado com Círculos Financeiros + UI Refinada
// ✨ REFINAMENTOS: Shimmer loading, Glassmorphism header, animações suaves, haptic feedback

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl, Animated, Easing, ActivityIndicator
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { useCircle } from '../context/CircleContext';
import { formatCurrency, getGreeting } from '../utils/helpers';
import CreditCard from '../components/CreditCard';
import TransactionItem from '../components/TransactionItem';
import Toast from '../components/Toast';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════
// SHIMMER COMPONENT
// ═══════════════════════════════════════════════════════════
const Shimmer = ({ width: w, height: h, borderRadius = 8, style }) => {
  const shimmerAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-w, w],
  });

  return (
    <View style={[{ width: w, height: h, borderRadius, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          width: '40%',
          height: '100%',
          backgroundColor: 'rgba(255,255,255,0.15)',
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

const SkeletonHome = ({ colors }) => (
  <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
    <View style={[styles.header, { backgroundColor: colors.primary }]}>
      <Shimmer width={44} height={44} borderRadius={22} />
      <Shimmer width={180} height={36} borderRadius={12} style={{ marginTop: 16 }} />
      <Shimmer width={120} height={20} borderRadius={8} style={{ marginTop: 8 }} />
      <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
        <Shimmer width={width / 2 - 30} height={60} borderRadius={14} />
        <Shimmer width={width / 2 - 30} height={60} borderRadius={14} />
      </View>
    </View>
    <View style={{ padding: 16, gap: 16 }}>
      <Shimmer width={width - 32} height={120} borderRadius={20} />
      <Shimmer width={width - 32} height={180} borderRadius={20} />
      <Shimmer width={width - 32} height={200} borderRadius={20} />
    </View>
  </View>
);

const HomeScreen = () => {
  const navigation = useNavigation();
  const {
    cards, transactions, getBalance, getCardUsage,
    notifications, cardInvoices, getCardPendingInvoices,
    mergedCards, mergedTransactions, mergedGoals,
    isSharedItem, getItemShareInfo,
    cashBalance, goals, isLoading,
  } = useApp();
  const { colors, darkMode } = useTheme();
  const { t } = useTranslate();
  const {
    currentCircle,
    myCircles,
    unreadActivityCount,
    syncEnabled,
    switchCircle,
  } = useCircle();

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [refreshing, setRefreshing] = useState(false);
  const [showCircleSelector, setShowCircleSelector] = useState(false);

  // ✅ CORREÇÃO: Timeout de segurança para isLoading (máx 3s)
  const [showSkeleton, setShowSkeleton] = useState(true);
  useEffect(() => {
    if (!isLoading) {
      setShowSkeleton(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Pulse animation para o indicador de círculo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── DADOS UNIFICADOS ──
  const displayCards = useMemo(() => {
    if (!currentCircle) return cards || [];
    return (mergedCards || []).filter(c => !c._circleId || c._circleId === currentCircle.id);
  }, [currentCircle, cards, mergedCards]);

  const displayTransactions = useMemo(() => {
    if (!currentCircle) return transactions || [];
    return (mergedTransactions || []).filter(tx => !tx._circleId || tx._circleId === currentCircle.id);
  }, [currentCircle, transactions, mergedTransactions]);

  const displayGoals = useMemo(() => {
    if (!currentCircle) return goals || [];
    return (mergedGoals || []).filter(g => !g._circleId || g._circleId === currentCircle.id);
  }, [currentCircle, goals, mergedGoals]);

  // ── BALANÇO UNIFICADO ──
  const unifiedBalance = useMemo(() => {
    const allTx = displayTransactions || [];
    const income = allTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = allTx
      .filter(t => t.type === 'expense' && !(t.paymentMethod === 'card' && t.cardType === 'credit'))
      .reduce((s, t) => s + (t.amount || 0), 0);
    return { income, expense, balance: cashBalance };
  }, [displayTransactions, cashBalance]);

  const { income, expense, balance } = unifiedBalance;

  // ── NOTIFICAÇÕES ──
  const unreadCount = (notifications || []).filter(n => !n.read).length;

  // ── FATURAS PENDENTES ──
  const pendingInvoices = useMemo(() => {
    return (cardInvoices || []).filter(inv => inv.status === 'pending');
  }, [cardInvoices]);
  const totalPendingInvoices = pendingInvoices.length;
  const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  // ── BOLETOS PENDENTES ──
  const pendingBoletos = useMemo(() => {
    return (displayTransactions || []).filter(t => t.type === 'expense' && t.paymentMethod === 'boleto' && !t.isPaid);
  }, [displayTransactions]);

  // ── METAS DO CÍRCULO ──
  const activeGoals = useMemo(() => {
    return (displayGoals || []).filter(g => {
      const current = g.currentAmount || g.current || 0;
      const target = g.targetAmount || g.target || 0;
      return !g.completed && current < target;
    });
  }, [displayGoals]);

  // ── ÚLTIMAS TRANSAÇÕES ──
  const recentTransactions = useMemo(() => {
    return [...(displayTransactions || [])]
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 5);
  }, [displayTransactions]);

  // ── CARTÕES DO CÍRCULO ──
  const circleCards = useMemo(() => {
    return (displayCards || []).slice(0, 3);
  }, [displayCards]);

  // ── HELPERS ──
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

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

  const handleSwitchCircle = (circleId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switchCircle(circleId);
    setShowCircleSelector(false);
  };

  const handleNavigate = (screen, params) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(screen, params);
  };

  // ── SHIMMER LOADING COM TIMEOUT ──
  if (showSkeleton) {
    return <SkeletonHome colors={colors} />;
  }

  // ── RENDER ──
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      refreshControl={(
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
          tintColor={colors.primary} colors={[colors.primary]} />
      )}
    >
      {/* ═══════════════════════════════════════
          HEADER COM GLASSMORPHISM
          ═══════════════════════════════════════ */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          {/* Avatar / Círculo */}
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowCircleSelector(!showCircleSelector);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="people-circle-outline" size={22} color="#FFF" />
            {currentCircle && (
              <Animated.View style={[styles.circleIndicator, { transform: [{ scale: pulseAnim }] }]}>
                <View style={[styles.circleDot, { backgroundColor: syncEnabled ? colors.success : colors.danger }]} />
              </Animated.View>
            )}
          </TouchableOpacity>

          {/* Seletor de Círculo (expandível) */}
          {showCircleSelector && (myCircles || []).length > 0 && (
            <Animated.View style={[styles.circleSelector, { 
              backgroundColor: darkMode ? colors.bgCard : colors.bgCard, 
              shadowColor: colors.shadow,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }]}>
              <TouchableOpacity
                style={[styles.circleOption, !currentCircle && styles.circleOptionActive]}
                onPress={() => handleSwitchCircle(null)}
              >
                <Ionicons name="person-outline" size={18} color={!currentCircle ? colors.primary : colors.textPrimary} />
                <Text style={[styles.circleOptionText, { color: !currentCircle ? colors.primary : colors.textPrimary }]}>
                  {t('common.myData')}
                </Text>
                {!currentCircle && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </TouchableOpacity>
              {(myCircles || []).map(circle => (
                <TouchableOpacity
                  key={circle.id}
                  style={[styles.circleOption, currentCircle?.id === circle.id && styles.circleOptionActive]}
                  onPress={() => handleSwitchCircle(circle.id)}
                >
                  <Ionicons name="people-outline" size={18} color={currentCircle?.id === circle.id ? colors.primary : colors.textPrimary} />
                  <Text style={[styles.circleOptionText, { color: currentCircle?.id === circle.id ? colors.primary : colors.textPrimary }]}>
                    {circle.name}
                  </Text>
                  {currentCircle?.id === circle.id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {/* Ações do Header */}
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => handleNavigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFF" />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => handleNavigate('Settings')}
            >
              <Ionicons name="settings-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nome do Círculo Ativo */}
        {currentCircle && (
          <TouchableOpacity 
            style={styles.circleNameRow} 
            onPress={() => setShowCircleSelector(!showCircleSelector)}
          >
            <Ionicons name="people" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.circleNameText}>{currentCircle.name}</Text>
            <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.6)" />
            {unreadActivityCount > 0 && (
              <View style={[styles.activityBadge, { backgroundColor: colors.warning }]}>
                <Text style={styles.activityBadgeText}>{unreadActivityCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Saldo em Caixa Unificado */}
        <Animated.View style={[styles.balanceBox, { 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }] 
        }]}>
          <Text style={[styles.balanceLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('home.balance')}</Text>
          <Text style={[styles.balanceValue, { color: balance >= 0 ? '#FFF' : colors.danger }]}>
            {formatCurrency(balance)}
          </Text>
        </Animated.View>

        {/* Resumo Rápido: Receitas / Despesas */}
        <View style={styles.quickStats}>
          <TouchableOpacity 
            style={styles.quickStatItem}
            onPress={() => handleNavigate('History', { filter: 'income' })}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-up-circle" size={16} color={colors.success} />
            <Text style={[styles.quickStatLabel, { color: 'rgba(255,255,255,0.6)' }]}>{t('common.income')}</Text>
            <Text style={[styles.quickStatValue, { color: '#FFF' }]}>{formatCurrency(income)}</Text>
          </TouchableOpacity>
          <View style={styles.quickStatDivider} />
          <TouchableOpacity 
            style={styles.quickStatItem}
            onPress={() => handleNavigate('History', { filter: 'expense' })}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-down-circle" size={16} color={colors.danger} />
            <Text style={[styles.quickStatLabel, { color: 'rgba(255,255,255,0.6)' }]}>{t('common.expense')}</Text>
            <Text style={[styles.quickStatValue, { color: '#FFF' }]}>{formatCurrency(expense)}</Text>
          </TouchableOpacity>
        </View>

        {/* Alerta de Faturas Pendentes */}
        {totalPendingInvoices > 0 && (
          <TouchableOpacity
            style={[styles.invoiceAlert, { backgroundColor: colors.danger }]}
            onPress={() => handleNavigate('Cards')}
            activeOpacity={0.9}
          >
            <Ionicons name="warning" size={18} color="#FFF" />
            <Text style={styles.invoiceAlertText}>
              {totalPendingInvoices} {t('cards.invoiceCount')}: {formatCurrency(totalPendingAmount)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Alerta de Boletos Pendentes */}
        {pendingBoletos.length > 0 && (
          <TouchableOpacity
            style={[styles.boletoAlert, { backgroundColor: colors.warning }]}
            onPress={() => handleNavigate('Add')}
            activeOpacity={0.9}
          >
            <Ionicons name="document-text" size={18} color="#FFF" />
            <Text style={styles.invoiceAlertText}>
              {pendingBoletos.length} {t('add.pendingBoletos').toLowerCase()}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Saudação */}
        <View style={styles.greetingBox}>
          <Text style={[styles.greetingText, { color: '#FFF' }]}>{getGreeting()}</Text>
          <Text style={[styles.greetingSub, { color: 'rgba(255,255,255,0.65)' }]}>{t('greetingSub')}</Text>
        </View>
      </View>

      {/* ═══════════════════════════════════════
          CONTEÚDO PRINCIPAL
          ═══════════════════════════════════════ */}
      <Animated.View style={[styles.content, { 
        backgroundColor: colors.bgPrimary,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>

        {/* ── SEÇÃO: TOP 3 CATEGORIAS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              <Ionicons name="pie-chart" size={16} color={colors.primary} />  Top Categorias
            </Text>
            <TouchableOpacity onPress={() => handleNavigate('Budget')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Ver Orçamentos</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.topCategoriesPreview, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}>
            {(() => {
              const month = new Date().toISOString().slice(0, 7);
              const catTotals = {};
              (displayTransactions || [])
                .filter(t => t.type === 'expense' && t.date && t.date.startsWith(month))
                .forEach(t => {
                  const key = t.categoryName || 'Outros';
                  if (!catTotals[key]) {
                    catTotals[key] = { amount: 0, icon: t.categoryIcon || 'pricetag', color: t.categoryColor || '#94A3B8', id: t.category };
                  }
                  catTotals[key].amount += t.amount || 0;
                });

              const top3 = Object.entries(catTotals)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 3);

              if (top3.length === 0) {
                return (
                  <View style={styles.emptyTopCategories}>
                    <Ionicons name="pie-chart-outline" size={24} color={colors.textMuted} />
                    <Text style={[styles.emptyTopCategoriesText, { color: colors.textMuted }]}>Nenhuma despesa este mês</Text>
                  </View>
                );
              }

              const totalMonth = top3.reduce((s, c) => s + c.amount, 0);

              return top3.map((cat, index) => (
                <View key={cat.name} style={styles.topCategoryItem}>
                  <View style={styles.topCategoryLeft}>
                    <View style={[styles.topCategoryRank, { backgroundColor: index === 0 ? '#F59E0B20' : index === 1 ? '#9CA3B820' : '#B4530920' }]}>
                      <Text style={[styles.topCategoryRankText, { color: index === 0 ? '#F59E0B' : index === 1 ? '#6B7280' : '#B45309' }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={[styles.topCategoryIcon, { backgroundColor: (cat.color || colors.primary) + '15' }]}>
                      <Ionicons name={cat.icon} size={16} color={cat.color || colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.topCategoryName, { color: colors.textPrimary }]}>{cat.name}</Text>
                      <Text style={[styles.topCategoryPercent, { color: colors.textMuted }]}>
                        {((cat.amount / totalMonth) * 100).toFixed(0)}% do total
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.topCategoryValue, { color: colors.danger }]}>{formatCurrency(cat.amount)}</Text>
                </View>
              ));
            })()}
          </View>
        </View>

        {/* ── SEÇÃO: CARTÕES ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('home.myCards')}
              {currentCircle && (
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  {' '}({(displayCards || []).length})
                </Text>
              )}
            </Text>
            <TouchableOpacity onPress={() => handleNavigate('Cards')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t('home.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardScroll}>
            {(circleCards || []).length > 0 ? (
              (circleCards || []).map((card, index) => (
                <Animated.View 
                  key={card.id} 
                  style={[styles.cardItem, {
                    transform: [{ scale: scaleAnim }],
                    opacity: fadeAnim,
                  }]}
                >
                  <CreditCard card={card} usage={getCardUsage(card.id)} />
                  {getSharedBadge(card)}
                </Animated.View>
              ))
            ) : (
              <View style={[styles.emptyCard, { borderColor: colors.border }]}>
                <Ionicons name="card-outline" size={28} color={colors.textMuted} />
                <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>{t('home.noCards')}</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* ── SEÇÃO: METAS ATIVAS ── */}
        {(activeGoals || []).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('goals.title')}
              </Text>
              <TouchableOpacity onPress={() => handleNavigate('Goals')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>{t('home.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(activeGoals || []).slice(0, 3).map((goal, index) => {
                const progress = (goal.targetAmount || goal.target || 0) > 0 ? ((goal.currentAmount || goal.current || 0) / (goal.targetAmount || goal.target || 0)) * 100 : 0;
                return (
                  <Animated.View
                    key={goal.id}
                    style={{
                      transform: [{ scale: scaleAnim }],
                      opacity: fadeAnim,
                    }}
                  >
                    <TouchableOpacity
                      style={[styles.goalCard, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}
                      onPress={() => handleNavigate('Goals')}
                    >
                      <View style={styles.goalCardHeader}>
                        <Ionicons name={goal.icon || "trophy-outline"} size={20} color={goal.color || colors.primary} />
                        {getSharedBadge(goal)}
                      </View>
                      <Text style={[styles.goalCardName, { color: colors.textPrimary }]} numberOfLines={1}>{goal.name}</Text>
                      <Text style={[styles.goalCardAmount, { color: colors.textMuted }]}>
                        {formatCurrency(goal.currentAmount || goal.current || 0)} / {formatCurrency(goal.targetAmount || goal.target || 0)}
                      </Text>
                      <View style={[styles.goalProgressBar, { backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                        <Animated.View style={[styles.goalProgressFill, {
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: goal.color || colors.primary
                        }]} />
                      </View>
                      <Text style={[styles.goalProgressText, { color: colors.textMuted }]}>
                        {Math.round(progress)}% {t('goals.complete')}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── SEÇÃO: ÚLTIMAS TRANSAÇÕES ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('home.recentTransactions')}
              {currentCircle && (
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  {' '}({(displayTransactions || []).length})
                </Text>
              )}
            </Text>
            <TouchableOpacity onPress={() => handleNavigate('History')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t('home.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {(recentTransactions || []).length > 0 ? (
            (recentTransactions || []).map((tx, index) => (
              <Animated.View
                key={tx.id}
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    showToast(`${tx.desc || tx.description} - ${formatCurrency(tx.amount)}`, 'info');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.txRow}>
                    <TransactionItem transaction={tx} />
                    <View style={styles.txBadgeContainer}>
                      {getSharedBadge(tx)}
                      {tx._sharedBy && (
                        <View style={[styles.sharedByBadge, { backgroundColor: colors.primary + '20' }]}>
                          <Ionicons name="person-outline" size={10} color={colors.primary} />
                          <Text style={[styles.sharedByText, { color: colors.primary }]}>
                            {tx._sharedByName || tx._sharedBy}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}>
              <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('home.noTransactions')}</Text>
            </View>
          )}
        </View>

        {/* ── SEÇÃO: BOLETOS PENDENTES ── */}
        {(pendingBoletos || []).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('add.pendingBoletos')}</Text>
            </View>
            {(pendingBoletos || []).slice(0, 3).map(boleto => (
              <View key={boleto.id} style={[styles.boletoRow, { backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary }]}>
                <View style={styles.boletoInfo}>
                  <Ionicons name="document-text-outline" size={18} color={colors.warning} />
                  <View style={styles.boletoTextBox}>
                    <Text style={[styles.boletoDesc, { color: colors.textPrimary }]} numberOfLines={1}>
                      {boleto.desc || boleto.description}
                    </Text>
                    <Text style={[styles.boletoDue, { color: colors.textMuted }]}>
                      {t('add.due')}: {boleto.dueDate || boleto.date}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.boletoAmount, { color: colors.danger }]}>
                  {formatCurrency(boleto.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── SEÇÃO: RESUMO DO CÍRCULO ── */}
        {currentCircle && (
          <Animated.View style={[styles.circleSummary, { 
            backgroundColor: darkMode ? colors.bgCard : colors.bgTertiary,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }]}>
            <View style={styles.circleSummaryHeader}>
              <Ionicons name="people" size={18} color={colors.primary} />
              <Text style={[styles.circleSummaryTitle, { color: colors.textPrimary }]}>
                {currentCircle.name}
              </Text>
              <View style={[styles.onlineIndicator, { backgroundColor: syncEnabled ? colors.success : colors.danger }]}>
                <Text style={styles.onlineText}>{syncEnabled ? t('common.active') : t('common.inactive')}</Text>
              </View>
            </View>
            <View style={styles.circleSummaryStats}>
              <View style={styles.circleStat}>
                <Text style={[styles.circleStatValue, { color: colors.primary }]}>{(displayCards || []).length}</Text>
                <Text style={[styles.circleStatLabel, { color: colors.textMuted }]}>{t('tab.cards')}</Text>
              </View>
              <View style={styles.circleStat}>
                <Text style={[styles.circleStatValue, { color: colors.primary }]}>{(displayTransactions || []).length}</Text>
                <Text style={[styles.circleStatLabel, { color: colors.textMuted }]}>{t('tab.history')}</Text>
              </View>
              <View style={styles.circleStat}>
                <Text style={[styles.circleStatValue, { color: colors.primary }]}>{(activeGoals || []).length}</Text>
                <Text style={[styles.circleStatLabel, { color: colors.textMuted }]}>{t('tab.goals')}</Text>
              </View>
              <View style={styles.circleStat}>
                <Text style={[styles.circleStatValue, { color: colors.primary }]}>
                  {(currentCircle.members?.length) || 1}
                </Text>
                <Text style={[styles.circleStatLabel, { color: colors.textMuted }]}>{t('common.members')}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.circleManageBtn, { borderColor: colors.primary }]}
              onPress={() => handleNavigate('Circles')}
            >
              <Text style={[styles.circleManageText, { color: colors.primary }]}>
                {t('common.manage')} {t('tab.groups')}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Shimmer
  glassContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  glassBlur: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    opacity: 0.3,
  },
  glassContent: {
    position: 'relative',
    zIndex: 1,
  },

  // Header
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    zIndex: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  circleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  // Seletor de Círculo
  circleSelector: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    borderRadius: 16,
    padding: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  circleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
  },
  circleOptionActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  circleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  // Nome do Círculo
  circleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  circleNameText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  activityBadge: {
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  activityBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },

  // Balance
  balanceBox: { marginBottom: 8 },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  quickStatValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  quickStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Alertas
  invoiceAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 10,
  },
  boletoAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 10,
  },
  invoiceAlertText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Saudação
  greetingBox: { marginTop: 4 },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
  },
  greetingSub: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },

  // Conteúdo
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 30,
  },

  // Seções
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionSubtitle: { fontSize: 13, fontWeight: '500' },
  seeAll: { fontSize: 13, fontWeight: '600' },

  // Cartões
  cardScroll: { paddingRight: 16 },
  cardItem: { marginRight: 12, position: 'relative' },
  emptyCard: {
    width: 220,
    height: 130,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyCardText: { fontSize: 12, fontWeight: '500', marginTop: 8 },

  // Shared Badge
  sharedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
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

  // Metas
  goalCard: {
    width: 160,
    padding: 14,
    borderRadius: 16,
    marginRight: 12,
    gap: 6,
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalCardName: {
    fontSize: 13,
    fontWeight: '700',
  },
  goalCardAmount: {
    fontSize: 11,
    fontWeight: '500',
  },
  goalProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalProgressText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Top Categorias Preview
  topCategoriesPreview: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  topCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  topCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topCategoryRank: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCategoryRankText: {
    fontSize: 12,
    fontWeight: '800',
  },
  topCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCategoryName: {
    fontSize: 14,
    fontWeight: '700',
  },
  topCategoryPercent: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  topCategoryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyTopCategories: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyTopCategoriesText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Transações
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txBadgeContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  sharedByBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sharedByText: {
    fontSize: 9,
    fontWeight: '600',
  },

  // Boletos
  boletoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  boletoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  boletoTextBox: { gap: 2 },
  boletoDesc: {
    fontSize: 13,
    fontWeight: '600',
  },
  boletoDue: {
    fontSize: 11,
    fontWeight: '500',
  },
  boletoAmount: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 16,
    marginTop: 8,
  },
  emptyText: { fontSize: 14, fontWeight: '500', marginTop: 8 },

  // Resumo do Círculo
  circleSummary: {
    borderRadius: 20,
    padding: 16,
    marginTop: 4,
    marginBottom: 20,
  },
  circleSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  circleSummaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  onlineIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  onlineText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  circleSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  circleStat: { alignItems: 'center', gap: 2 },
  circleStatValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  circleStatLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  circleManageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  circleManageText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default HomeScreen;