import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';

const { width } = Dimensions.get('window');

const Greeting = React.memo(function Greeting({ t, colors }) {
  const hour = new Date().getHours();
  let text = t('evening');
  if (hour < 12) text = t('morning');
  else if (hour < 18) text = t('afternoon');
  return (
    <View>
      <Text style={[styles.greeting, { color: colors.text }]}>{text}</Text>
      <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>{t('overview')}</Text>
    </View>
  );
});

const CashBanner = React.memo(function CashBanner({ value, colors, t }) {
  const fmt = useMemo(() =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
  [value]);
  return (
    <View style={[styles.cashCard, { backgroundColor: colors.primary }]}>
      <View style={styles.cashRow}>
        <View>
          <Text style={styles.cashLabel}>{t('availableCash')}</Text>
          <Text style={styles.cashValue}>{fmt}</Text>
        </View>
        <View style={styles.cashIcon}>
          <Ionicons name="wallet" size={24} color="#fff" />
        </View>
      </View>
    </View>
  );
});

const UnpaidBanner = React.memo(function UnpaidBanner({ count, total, colors, t }) {
  const fmt = useMemo(() =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total),
  [total]);
  return (
    <View style={[styles.unpaidCard, { backgroundColor: colors.danger + '15' }]}>
      <View style={styles.unpaidHeader}>
        <Ionicons name="warning" size={20} color={colors.danger} />
        <Text style={[styles.unpaidTitle, { color: colors.danger }]}>
          {count} {count === 1 ? t('unpaidExpense') : t('unpaidExpenses')}
        </Text>
      </View>
      <Text style={[styles.unpaidAmount, { color: colors.danger }]}>
        {t('total')}: {fmt}
      </Text>
    </View>
  );
});

const CardCarousel = React.memo(function CardCarousel({ cards, colors, t, onNavigate }) {
  if (!cards || cards.length === 0) return null;
  
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('myCards')}</Text>
        <TouchableOpacity onPress={() => onNavigate('Cards')}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>{t('seeAll')}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={cards}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c.id}
        renderItem={({ item: card }) => {
          const usage = card.usage || 0;
          const limit = card.limit || 0;
          const percentage = limit > 0 ? (usage / limit) * 100 : 0;
          
          return (
            <View style={[styles.cardItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="card" size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{card.customName || card.name}</Text>
                  <Text style={[styles.cardLimit, { color: colors.textSecondary }]}>
                    {t('limit')}: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(limit)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardUsageSection}>
                <View style={styles.cardUsageRow}>
                  <Text style={[styles.cardUsageLabel, { color: colors.textSecondary }]}>{t('used')}</Text>
                  <Text style={[styles.cardUsageValue, { color: colors.text }]}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(usage)}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: percentage >= 100 ? colors.danger : percentage >= 80 ? colors.warning : colors.primary,
                    }
                  ]} />
                </View>
                <Text style={[
                  styles.progressText,
                  { color: percentage >= 100 ? colors.danger : percentage >= 80 ? colors.warning : colors.primary }
                ]}>
                  {percentage.toFixed(1)}% {t('used')}
                </Text>
                {percentage >= 100 && (
                  <View style={[styles.cardAlert, { backgroundColor: colors.danger + '15' }]}>
                    <Ionicons name="alert-circle" size={14} color={colors.danger} />
                    <Text style={[styles.cardAlertText, { color: colors.danger }]}>{t('limitExceeded')}</Text>
                  </View>
                )}
                {percentage >= 80 && percentage < 100 && (
                  <View style={[styles.cardAlert, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="alert-circle" size={14} color={colors.warning} />
                    <Text style={[styles.cardAlertText, { color: colors.warning }]}>{t('nearLimit')}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
});

const TopCategories = React.memo(function TopCategories({ categories, monthTotal, colors, t, getCategoryInfo, onNavigate }) {
  if (!categories || categories.length === 0) return null;
  
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('topCategories')}</Text>
        <TouchableOpacity onPress={() => onNavigate('Charts')}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>{t('seeAll')}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.categoriesList}>
        {categories.map(([catId, amount]) => {
          const cat = getCategoryInfo(catId);
          const percentage = monthTotal > 0 ? (amount / monthTotal) * 100 : 0;
          return (
            <View key={catId} style={[styles.categoryItem, { backgroundColor: colors.card }]}>
              <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                <Ionicons name={cat.icon} size={20} color={cat.color} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
                </Text>
              </View>
              <View style={styles.categoryBar}>
                <View style={[styles.categoryBarFill, { width: `${percentage}%`, backgroundColor: cat.color }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const SimpleExpenseItem = React.memo(({ item, colors, t, onPress }) => {
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount);
  return (
    <TouchableOpacity 
      style={[styles.expenseItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress(item.id)}
    >
      <View style={styles.expenseIcon}>
        <Ionicons name="receipt" size={20} color={colors.primary} />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={[styles.expenseDesc, { color: colors.text }]} numberOfLines={1}>{item.description}</Text>
        <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>{item.date}</Text>
      </View>
      <Text style={[styles.expenseAmount, { color: colors.text }]}>{fmt}</Text>
    </TouchableOpacity>
  );
});

export default function DashboardScreen({ navigation }) {
  const { expenses, cards, CATEGORIES, toggleExpensePaid, payBill } = useExpenses();
  const { colors } = useTheme();
  const { t } = useI18n();

  const [showAll, setShowAll] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    
    const total = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const unpaid = expenses.filter(e => !e.paid);
    const unpaidTotal = unpaid.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    const categoryTotals = monthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
      return acc;
    }, {});
    
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const getCategoryInfo = (catId) => {
      return CATEGORIES.find(c => c.id === catId) || { name: catId, color: '#999', icon: 'help-circle' };
    };
    
    return {
      monthTotal: total,
      unpaidCount: unpaid.length,
      unpaidTotal,
      topCategories,
      getCategoryInfo,
    };
  }, [expenses, CATEGORIES]);

  const recentExpenses = useMemo(() => expenses.slice(0, showAll ? expenses.length : 5), [expenses, showAll]);

  const handlePay = useCallback((expense) => {
    if (expense.isBill) {
      payBill(expense.id);
    } else if (!expense.cardId) {
      toggleExpensePaid(expense.id);
    }
  }, [payBill, toggleExpensePaid]);

  const handleNavigate = useCallback((screen) => navigation.navigate(screen), [navigation]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.scrollContent}>
        <Greeting t={t} colors={colors} />
        
        <View style={styles.summaryCards}>
          <CashBanner value={0} colors={colors} t={t} />
        </View>

        {stats.unpaidCount > 0 && (
          <UnpaidBanner count={stats.unpaidCount} total={stats.unpaidTotal} colors={colors} t={t} />
        )}

        {cards.length > 0 && (
          <CardCarousel cards={cards} colors={colors} t={t} onNavigate={handleNavigate} />
        )}

        {stats.topCategories.length > 0 && (
          <TopCategories 
            categories={stats.topCategories} 
            monthTotal={stats.monthTotal} 
            colors={colors} 
            t={t} 
            getCategoryInfo={stats.getCategoryInfo} 
            onNavigate={handleNavigate} 
          />
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recentExpenses')}</Text>
            <TouchableOpacity onPress={() => handleNavigate('History')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>
          
          {recentExpenses.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noExpenses')}</Text>
          ) : (
            <>
              {recentExpenses.map(item => (
                <SimpleExpenseItem 
                  key={item.id}
                  item={item}
                  colors={colors}
                  t={t}
                  onPress={(id) => navigation.navigate('EditExpense', { expenseId: id })}
                />
              ))}
              {expenses.length > 5 && (
                <TouchableOpacity 
                  style={[styles.showAllButton, { backgroundColor: colors.card }]}
                  onPress={() => setShowAll(!showAll)}
                >
                  <Text style={[styles.showAllText, { color: colors.primary }]}>
                    {showAll ? t('showLess') : t('seeAll')}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  greeting: { fontSize: 24, fontWeight: 'bold' },
  greetingSub: { fontSize: 14, marginTop: 4 },
  summaryCards: { marginBottom: 20 },
  cashCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  cashRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cashLabel: { color: '#fff', fontSize: 14, opacity: 0.8 },
  cashValue: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  cashIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  unpaidCard: { borderRadius: 16, padding: 16, marginBottom: 20 },
  unpaidHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unpaidTitle: { fontSize: 14, fontWeight: '600' },
  unpaidAmount: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  cardItem: { width: width * 0.75, padding: 16, borderRadius: 18, marginRight: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: 'bold' },
  cardLimit: { fontSize: 12, marginTop: 2 },
  cardUsageSection: { marginBottom: 8 },
  cardUsageRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardUsageLabel: { fontSize: 12 },
  cardUsageValue: { fontSize: 12, fontWeight: '600' },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: '#e0e0e0', overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: '600', textAlign: 'right' },
  cardAlert: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8, gap: 4 },
  cardAlertText: { fontSize: 11, fontWeight: '600' },
  categoriesList: { gap: 8 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14 },
  categoryIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: '600' },
  categoryAmount: { fontSize: 12, marginTop: 2 },
  categoryBar: { width: 60, height: 6, borderRadius: 3, backgroundColor: '#e0e0e0', overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 3 },
  showAllButton: { padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  showAllText: { fontSize: 14, fontWeight: '600' },
  expenseItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 8,
    borderWidth: 1,
  },
  expenseIcon: { marginRight: 12 },
  expenseInfo: { flex: 1 },
  expenseDesc: { fontSize: 14, fontWeight: '600' },
  expenseDate: { fontSize: 12, marginTop: 2 },
  expenseAmount: { fontSize: 14, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', padding: 20, fontSize: 14 },
});