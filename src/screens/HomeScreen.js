// HomeScreen.js — UI Moderna & Profissional (Revitalizada)
// Design: Glassmorphism + Neumorphism leve + Tipografia hierárquica
// Zero libs externas — 100% React Native puro e estável

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl, Animated, StatusBar, Platform
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

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.78;
const GOAL_CARD_WIDTH = width * 0.42;

// ── COMPONENTES AUXILIARES ──

const SkeletonPulse = ({ style }) => {
  const pulseAnim = useState(new Animated.Value(0.4))[0];
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={[style, { opacity: pulseAnim, backgroundColor: 'rgba(150,150,150,0.15)' }]} />
  );
};

const SectionHeader = ({ title, subtitle, actionText, onAction, colors }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleBox}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      )}
    </View>
    {actionText && onAction && (
      <TouchableOpacity onPress={onAction} style={styles.seeAllBtn} activeOpacity={0.7}>
        <Text style={[styles.seeAllText, { color: colors.primary }]}>{actionText}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </TouchableOpacity>
    )}
  </View>
);

const StatPill = ({ icon, label, value, color, bgColor }) => (
  <View style={[styles.statPill, { backgroundColor: bgColor }]}>
    <View style={[styles.statPillIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={14} color={color} />
    </View>
    <View>
      <Text style={[styles.statPillLabel, { color: 'rgba(255,255,255,0.55)' }]}>{label}</Text>
      <Text style={[styles.statPillValue, { color: '#FFF' }]}>{value}</Text>
    </View>
  </View>
);

const AlertBanner = ({ icon, text, color, onPress }) => (
  <TouchableOpacity
    style={[styles.alertBanner, { backgroundColor: color + '18', borderColor: color + '30' }]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[styles.alertIconBox, { backgroundColor: color + '25' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={[styles.alertText, { color: color }]} numberOfLines={1}>{text}</Text>
    <Ionicons name="chevron-forward" size={16} color={color} />
  </TouchableOpacity>
);

// ── HOME SCREEN PRINCIPAL ──

const HomeScreen = () => {
  const navigation = useNavigation();
  const {
    cards, transactions, getBalance, getCardUsage,
    notifications, cardInvoices,
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
  const [headerExpanded, setHeaderExpanded] = useState(true);

  // Animações seguras (nativas)
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideUpAnim = useState(new Animated.Value(40))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];
  const headerScrollY = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
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

  const unifiedBalance = useMemo(() => {
    const allTx = displayTransactions || [];
    const income = allTx
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const expense = allTx
      .filter(t => t.type === 'expense' && !(t.paymentMethod === 'card' && t.cardType === 'credit'))
      .reduce((s, t) => s + (t.amount || 0), 0);
    return { income, expense, balance: cashBalance };
  }, [displayTransactions, cashBalance]);

  const { income, expense, balance } = unifiedBalance;

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  const pendingInvoices = useMemo(() => {
    return (cardInvoices || []).filter(inv => inv.status === 'pending');
  }, [cardInvoices]);
  const totalPendingInvoices = pendingInvoices.length;
  const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  const pendingBoletos = useMemo(() => {
    return (displayTransactions || []).filter(
      t => t.type === 'expense' && t.paymentMethod === 'boleto' && !t.isPaid
    );
  }, [displayTransactions]);

  const activeGoals = useMemo(() => {
    return (displayGoals || []).filter(g => {
      const current = g.currentAmount || g.current || 0;
      const target = g.targetAmount || g.target || 0;
      return !g.completed && current < target;
    });
  }, [displayGoals]);

  const recentTransactions = useMemo(() => {
    return [...(displayTransactions || [])]
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 5);
  }, [displayTransactions]);

  const circleCards = useMemo(() => (displayCards || []).slice(0, 3), [displayCards]);

  // ── TOP CATEGORIAS ──
  const topCategories = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    const catTotals = {};
    (displayTransactions || [])
      .filter(t => t.type === 'expense' && t.date && t.date.startsWith(month))
      .forEach(t => {
        const key = t.categoryName || 'Outros';
        if (!catTotals[key]) {
          catTotals[key] = { amount: 0, icon: t.categoryIcon || 'pricetag', color: t.categoryColor || '#94A3B8' };
        }
        catTotals[key].amount += t.amount || 0;
      });
    return Object.entries(catTotals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [displayTransactions]);

  const topCategoriesTotal = topCategories.reduce((s, c) => s + c.amount, 0);

  // ── HELPERS ──
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSwitchCircle = (circleId) => {
    switchCircle(circleId);
    setShowCircleSelector(false);
  };

  const getSharedBadge = (item) => {
    if (!item || !getItemShareInfo) return null;
    const info = getItemShareInfo(item);
    if (!info || !info.isShared) return null;
    return (
      <View style={[styles.sharedBadge, { backgroundColor: info.canEdit ? colors.success + 'E6' : colors.primary + 'E6' }]}>
        <Ionicons name={info.canEdit ? 'create-outline' : 'eye-outline'} size={9} color="#FFF" />
        <Text style={styles.sharedBadgeText}>{info.canEdit ? t('common.editPermission') : t('common.view')}</Text>
      </View>
    );
  };

  // ── HEADER ANIMADO ──
  const headerOpacity = headerScrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const headerTranslateY = headerScrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  // ── RENDER ──
  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* ═══════════════════════════════════════
          HEADER MODERNO COM GLASSMORPHISM
          ═══════════════════════════════════════ */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        {/* Glass overlay */}
        <View style={styles.headerGlass}>
          {/* Top Bar */}
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => setShowCircleSelector(!showCircleSelector)}
              activeOpacity={0.8}
            >
              <View style={[styles.avatarRing, { borderColor: 'rgba(255,255,255,0.3)' }]}>
                <Ionicons name="people-circle-outline" size={24} color="#FFF" />
              </View>
              {currentCircle && (
                <View style={styles.statusDot}>
                  <View style={[styles.statusDotInner, { backgroundColor: syncEnabled ? '#34D399' : '#F87171' }]} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={20} color="#FFF" />
                {unreadCount > 0 && (
                  <View style={[styles.notifBadge, { backgroundColor: '#F87171' }]}>
                    <Text style={styles.notifBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={() => navigation.navigate('Settings')}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Circle Selector Dropdown */}
          {showCircleSelector && (myCircles || []).length > 0 && (
            <View style={[styles.circleDropdown, { backgroundColor: darkMode ? '#1E293B' : '#FFF' }]}>
              <TouchableOpacity
                style={[styles.circleOption, !currentCircle && styles.circleOptionActive]}
                onPress={() => handleSwitchCircle(null)}
              >
                <View style={[styles.circleOptionIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="person-outline" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.circleOptionText, { color: !currentCircle ? colors.primary : colors.textPrimary }]}>
                  {t('common.myData')}
                </Text>
                {!currentCircle && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
              </TouchableOpacity>

              {(myCircles || []).map(circle => (
                <TouchableOpacity
                  key={circle.id}
                  style={[styles.circleOption, currentCircle?.id === circle.id && styles.circleOptionActive]}
                  onPress={() => handleSwitchCircle(circle.id)}
                >
                  <View style={[styles.circleOptionIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="people-outline" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.circleOptionInfo}>
                    <Text style={[styles.circleOptionText, { color: currentCircle?.id === circle.id ? colors.primary : colors.textPrimary }]}>
                      {circle.name}
                    </Text>
                    <Text style={[styles.circleOptionMembers, { color: colors.textMuted }]}>
                      {(circle.members?.length) || 1} {t('common.members').toLowerCase()}
                    </Text>
                  </View>
                  {currentCircle?.id === circle.id && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Circle Name Pill */}
          {currentCircle && (
            <TouchableOpacity
              style={styles.circlePill}
              onPress={() => setShowCircleSelector(!showCircleSelector)}
              activeOpacity={0.8}
            >
              <Ionicons name="people" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.circlePillText}>{currentCircle.name}</Text>
              <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.5)" />
              {unreadActivityCount > 0 && (
                <View style={[styles.activityPill, { backgroundColor: '#FBBF24' }]}>
                  <Text style={styles.activityPillText}>{unreadActivityCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Balance Principal */}
          <Animated.View style={[styles.balanceSection, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
            <Text style={styles.balanceLabel}>{t('home.balance')}</Text>
            <Text style={[styles.balanceValue, { color: balance >= 0 ? '#FFF' : '#FCA5A5' }]}>
              {formatCurrency(balance)}
            </Text>
          </Animated.View>

          {/* Stats Pills */}
          <View style={styles.statsRow}>
            <StatPill
              icon="arrow-up-circle"
              label={t('common.income')}
              value={formatCurrency(income)}
              color="#34D399"
              bgColor="rgba(255,255,255,0.08)"
            />
            <View style={styles.statsDivider} />
            <StatPill
              icon="arrow-down-circle"
              label={t('common.expense')}
              value={formatCurrency(expense)}
              color="#F87171"
              bgColor="rgba(255,255,255,0.08)"
            />
          </View>

          {/* Alert Banners */}
          {totalPendingInvoices > 0 && (
            <AlertBanner
              icon="warning"
              text={`${totalPendingInvoices} ${t('cards.invoiceCount')}: ${formatCurrency(totalPendingAmount)}`}
              color="#F87171"
              onPress={() => navigation.navigate('Cards')}
            />
          )}
          {pendingBoletos.length > 0 && (
            <AlertBanner
              icon="document-text"
              text={`${pendingBoletos.length} ${t('add.pendingBoletos')?.toLowerCase()}`}
              color="#FBBF24"
              onPress={() => navigation.navigate('Add')}
            />
          )}

          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingMain}>{getGreeting()}</Text>
            <Text style={styles.greetingSub}>{t('greetingSub')}</Text>
          </View>
        </View>
      </Animated.View>

      {/* ═══════════════════════════════════════
          CONTEÚDO PRINCIPAL
          ═══════════════════════════════════════ */}
      <Animated.ScrollView
        style={[styles.content, { backgroundColor: colors.bgPrimary }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: headerScrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* ── TOP CATEGORIAS ── */}
        <View style={styles.section}>
          <SectionHeader
            title={t('add.topCategories') || 'Top Categorias'}
            actionText={t('home.seeAll')}
            onAction={() => navigation.navigate('Budget')}
            colors={colors}
          />

          {isLoading ? (
            <SkeletonPulse style={[styles.categoriesCard, { height: 180, borderRadius: 24 }]} />
          ) : topCategories.length === 0 ? (
            <View style={[styles.emptyCard, { borderColor: colors.border + '40' }]}>
              <Ionicons name="pie-chart-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhuma despesa este mês</Text>
            </View>
          ) : (
            <View style={[styles.categoriesCard, { backgroundColor: darkMode ? colors.bgCard : '#FFF' }]}>
              {topCategories.map((cat, index) => {
                const percent = topCategoriesTotal > 0 ? (cat.amount / topCategoriesTotal) * 100 : 0;
                const rankColors = ['#F59E0B', '#6B7280', '#92400E'];
                return (
                  <View key={cat.name} style={[styles.categoryRow, index < topCategories.length - 1 && styles.categoryRowBorder]}>
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryRank, { backgroundColor: rankColors[index] + '18' }]}>
                        <Text style={[styles.categoryRankText, { color: rankColors[index] }]}>{index + 1}</Text>
                      </View>
                      <View style={[styles.categoryIconBox, { backgroundColor: (cat.color || colors.primary) + '15' }]}>
                        <Ionicons name={cat.icon} size={16} color={cat.color || colors.primary} />
                      </View>
                      <View>
                        <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{cat.name}</Text>
                        <View style={styles.categoryBarTrack}>
                          <View style={[styles.categoryBarFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: cat.color || colors.primary }]} />
                        </View>
                      </View>
                    </View>
                    <Text style={[styles.categoryValue, { color: colors.danger }]}>{formatCurrency(cat.amount)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── CARTÕES ── */}
        <View style={styles.section}>
          <SectionHeader
            title={t('home.myCards')}
            subtitle={currentCircle ? `(${(displayCards || []).length})` : null}
            actionText={t('home.seeAll')}
            onAction={() => navigation.navigate('Cards')}
            colors={colors}
          />

          {isLoading ? (
            <SkeletonPulse style={{ width: CARD_WIDTH, height: 180, borderRadius: 20, marginLeft: 4 }} />
          ) : (circleCards || []).length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardScroll}>
              {(circleCards || []).map((card, index) => (
                <Animated.View
                  key={card.id}
                  style={[
                    styles.cardWrapper,
                    {
                      opacity: fadeAnim,
                      transform: [
                        { translateY: slideUpAnim },
                        { scale: scaleAnim }
                      ],
                      marginLeft: index === 0 ? 4 : 0,
                    },
                  ]}
                >
                  <CreditCard card={card} usage={getCardUsage(card.id)} />
                  {getSharedBadge(card)}
                </Animated.View>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.emptyCard, { borderColor: colors.border + '40' }]}>
              <Ionicons name="card-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('home.noCards')}</Text>
            </View>
          )}
        </View>

        {/* ── METAS ATIVAS ── */}
        {(activeGoals || []).length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={t('goals.title')}
              actionText={t('home.seeAll')}
              onAction={() => navigation.navigate('Goals')}
              colors={colors}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalScroll}>
              {(activeGoals || []).slice(0, 4).map((goal, index) => {
                const progress = (goal.targetAmount || goal.target || 0) > 0
                  ? ((goal.currentAmount || goal.current || 0) / (goal.targetAmount || goal.target || 0)) * 100
                  : 0;
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.goalCard,
                      {
                        backgroundColor: darkMode ? colors.bgCard : '#FFF',
                        marginLeft: index === 0 ? 4 : 0,
                      },
                    ]}
                    onPress={() => navigation.navigate('Goals')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.goalCardTop}>
                      <View style={[styles.goalIconBox, { backgroundColor: (goal.color || colors.primary) + '15' }]}>
                        <Ionicons name={goal.icon || 'trophy-outline'} size={20} color={goal.color || colors.primary} />
                      </View>
                      {getSharedBadge(goal)}
                    </View>

                    <Text style={[styles.goalName, { color: colors.textPrimary }]} numberOfLines={1}>{goal.name}</Text>
                    <Text style={[styles.goalAmount, { color: colors.textMuted }]}>
                      {formatCurrency(goal.currentAmount || goal.current || 0)}
                      <Text style={{ fontWeight: '400' }}> / {formatCurrency(goal.targetAmount || goal.target || 0)}</Text>
                    </Text>

                    <View style={styles.goalProgressTrack}>
                      <View
                        style={[
                          styles.goalProgressFill,
                          {
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: goal.color || colors.primary,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.goalProgressFooter}>
                      <Text style={[styles.goalProgressText, { color: colors.textMuted }]}>
                        {Math.round(progress)}% {t('goals.complete')}
                      </Text>
                      <Text style={[styles.goalProgressText, { color: colors.textMuted }]}>
                        {formatCurrency((goal.targetAmount || goal.target || 0) - (goal.currentAmount || goal.current || 0))} restante
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── ÚLTIMAS TRANSAÇÕES ── */}
        <View style={styles.section}>
          <SectionHeader
            title={t('home.recentTransactions')}
            subtitle={currentCircle ? `(${(displayTransactions || []).length})` : null}
            actionText={t('home.seeAll')}
            onAction={() => navigation.navigate('History')}
            colors={colors}
          />

          {isLoading ? (
            <View style={{ gap: 12 }}>
              {[1, 2, 3].map(i => (
                <SkeletonPulse key={i} style={{ height: 64, borderRadius: 16 }} />
              ))}
            </View>
          ) : (recentTransactions || []).length > 0 ? (
            <View style={[styles.transactionsCard, { backgroundColor: darkMode ? colors.bgCard : '#FFF' }]}>
              {(recentTransactions || []).map((tx, index) => (
                <TouchableOpacity
                  key={tx.id}
                  style={[styles.transactionRow, index < recentTransactions.length - 1 && styles.transactionRowBorder]}
                  onPress={() => showToast(`${tx.desc || tx.description} - ${formatCurrency(tx.amount)}`, 'info')}
                  activeOpacity={0.7}
                >
                  <View style={styles.transactionLeft}>
                    <TransactionItem transaction={tx} />
                  </View>
                  <View style={styles.transactionBadges}>
                    {getSharedBadge(tx)}
                    {tx._sharedBy && (
                      <View style={[styles.sharedByBadge, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="person-outline" size={10} color={colors.primary} />
                        <Text style={[styles.sharedByText, { color: colors.primary }]}>
                          {tx._sharedByName || tx._sharedBy}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyCard, { borderColor: colors.border + '40' }]}>
              <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('home.noTransactions')}</Text>
            </View>
          )}
        </View>

        {/* ── BOLETOS PENDENTES ── */}
        {(pendingBoletos || []).length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={t('add.pendingBoletos')}
              colors={colors}
            />
            <View style={[styles.boletosCard, { backgroundColor: darkMode ? colors.bgCard : '#FFF' }]}>
              {(pendingBoletos || []).slice(0, 3).map((boleto, index) => (
                <View
                  key={boleto.id}
                  style={[styles.boletoRow, index < pendingBoletos.slice(0, 3).length - 1 && styles.boletoRowBorder]}
                >
                  <View style={styles.boletoLeft}>
                    <View style={[styles.boletoIconBox, { backgroundColor: colors.warning + '15' }]}>
                      <Ionicons name="document-text-outline" size={18} color={colors.warning} />
                    </View>
                    <View>
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
          </View>
        )}

        {/* ── RESUMO DO CÍRCULO ── */}
        {currentCircle && (
          <View style={styles.section}>
            <SectionHeader
              title={currentCircle.name}
              colors={colors}
            />
            <View style={[styles.circleCard, { backgroundColor: darkMode ? colors.bgCard : '#FFF' }]}>
              <View style={styles.circleCardHeader}>
                <View style={[styles.circleStatusDot, { backgroundColor: syncEnabled ? '#34D399' : '#F87171' }]} />
                <Text style={[styles.circleStatusText, { color: syncEnabled ? '#34D399' : '#F87171' }]}>
                  {syncEnabled ? t('common.active') : t('common.inactive')}
                </Text>
              </View>

              <View style={styles.circleStatsGrid}>
                {[
                  { icon: 'card', label: t('tab.cards'), value: (displayCards || []).length },
                  { icon: 'time', label: t('tab.history'), value: (displayTransactions || []).length },
                  { icon: 'trophy', label: t('tab.goals'), value: (activeGoals || []).length },
                  { icon: 'people', label: t('common.members'), value: (currentCircle.members?.length) || 1 },
                ].map(stat => (
                  <View key={stat.label} style={styles.circleStatBox}>
                    <View style={[styles.circleStatIcon, { backgroundColor: colors.primary + '10' }]}>
                      <Ionicons name={stat.icon} size={18} color={colors.primary} />
                    </View>
                    <Text style={[styles.circleStatValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                    <Text style={[styles.circleStatLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.circleManageBtn, { borderColor: colors.primary + '40' }]}
                onPress={() => navigation.navigate('Circles')}
                activeOpacity={0.8}
              >
                <Text style={[styles.circleManageText, { color: colors.primary }]}>
                  {t('common.manage')} {t('tab.groups')}
                </Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>

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
// ESTILOS MODERNOS
// ═══════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── HEADER ──
  header: {
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerGlass: {
    // Efeito glassmorphism simulado com transparência e sombra
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    zIndex: 10,
  },

  // Avatar
  avatarBtn: {
    position: 'relative',
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Header Actions
  headerActions: { flexDirection: 'row', gap: 10 },
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifBadge: {
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
  notifBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // Circle Dropdown
  circleDropdown: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 20,
    gap: 4,
  },
  circleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 12,
  },
  circleOptionActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  circleOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleOptionInfo: { flex: 1 },
  circleOptionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  circleOptionMembers: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },

  // Circle Pill
  circlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  circlePillText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
  },
  activityPill: {
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  activityPillText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // Balance
  balanceSection: {
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.5,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statsDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Stat Pill
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
  },
  statPillIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statPillValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },

  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  alertIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  // Greeting
  greetingSection: {
    marginTop: 8,
  },
  greetingMain: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 3,
  },

  // ── CONTENT ──
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Section
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  sectionTitleBox: { flex: 1 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Cards
  cardScroll: { marginHorizontal: -4 },
  cardWrapper: {
    marginRight: 14,
    position: 'relative',
  },

  // Categories
  categoriesCard: {
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.08)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryRank: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryRankText: {
    fontSize: 12,
    fontWeight: '900',
  },
  categoryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  categoryBarTrack: {
    width: 120,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(150,150,150,0.1)',
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Goals
  goalScroll: { marginHorizontal: -4 },
  goalCard: {
    width: GOAL_CARD_WIDTH,
    padding: 16,
    borderRadius: 24,
    marginRight: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalName: {
    fontSize: 14,
    fontWeight: '800',
  },
  goalAmount: {
    fontSize: 12,
    fontWeight: '700',
  },
  goalProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(150,150,150,0.1)',
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalProgressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalProgressText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Transactions
  transactionsCard: {
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  transactionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.06)',
  },
  transactionLeft: { flex: 1 },
  transactionBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },

  // Shared Badge
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sharedBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
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
    fontWeight: '700',
  },

  // Boletos
  boletosCard: {
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  boletoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  boletoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.06)',
  },
  boletoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  boletoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boletoDesc: {
    fontSize: 14,
    fontWeight: '700',
  },
  boletoDue: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  boletoAmount: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Circle Card
  circleCard: {
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  circleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  circleStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  circleStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  circleStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  circleStatBox: {
    alignItems: 'center',
    gap: 6,
  },
  circleStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleStatValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  circleStatLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  circleManageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  circleManageText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

export default HomeScreen;