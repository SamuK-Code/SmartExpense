import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { usePlanning } from '../context/PlanningContext';
import { useTheme } from '../context/ThemeContext';
import { FadeInView, SlideInView, ScaleInView, StaggeredList } from '../components/AnimatedComponents';
import PeriodFilter from '../components/PeriodFilter';
import { getBankById } from '../utils/BanksData';

const screenWidth = Dimensions.get('window').width;

export default function ChartScreen({ navigation }) {
  const { expenses, cards, getFilteredExpenses, getTotalByCategory, getTotalByCard, getExpensesByMonth, CATEGORIES } = useExpenses();
  const { cashBalance } = usePlanning();
  const { colors, isDark } = useTheme();
  const [chartType, setChartType] = useState('pie');
  const [period, setPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const filteredExpenses = getFilteredExpenses(period);
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const categoryTotals = getTotalByCategory(filteredExpenses);
  const cardTotals = getTotalByCard(filteredExpenses);
  const monthlyTotals = getExpensesByMonth();
  const totalGeral = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const isCashInsufficient = cashBalance > 0 && cashBalance < totalGeral;
  const cashDeficit = totalGeral - cashBalance;

  const handleCategoryPress = (categoryId, categoryName) => {
    navigation.navigate('ChartDetail', { type: 'category', id: categoryId, name: categoryName, period: period });
  };

  const handleCardPress = (cardId, cardName) => {
    navigation.navigate('ChartDetail', { type: 'card', id: cardId, name: cardName, period: period });
  };

  const pieData = Object.entries(categoryTotals).map(([catId, amount]) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    return {
      name: cat?.name || catId,
      amount: amount,
      color: cat?.color || '#999',
      legendFontColor: 'transparent',
      legendFontSize: 1,
    };
  }).sort((a, b) => b.amount - a.amount);

  const sortedMonths = Object.keys(monthlyTotals).sort();
  const last6Months = sortedMonths.slice(-6);

  const barData = {
    labels: last6Months.map(m => { 
      const [year, month] = m.split('-'); 
      return `${month}/${year.slice(2)}`; 
    }),
    datasets: [{ 
      data: last6Months.map(m => monthlyTotals[m]) 
    }],
  };

  const chartConfig = {
    backgroundColor: colors.chartBg,
    backgroundGradientFrom: colors.chartBg,
    backgroundGradientTo: colors.chartBg,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForLabels: { fontSize: 10, fontWeight: '600' },
    propsForBackgroundLines: { stroke: isDark ? '#333' : '#e0e0e0', strokeWidth: 1 },
    formatYLabel: (value) => {
      const num = parseFloat(value);
      if (num >= 1000) return `R$${(num/1000).toFixed(1)}k`;
      return `R$${num.toFixed(0)}`;
    },
  };

  const handlePiePress = (index) => {
    if (selectedCategory === index) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(index);
    }
  };

  const displayData = selectedCategory !== null 
    ? [pieData[selectedCategory]] 
    : pieData;

  if (expenses.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="pie-chart-outline" size={64} color={colors.textLight} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Sem dados para analisar</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Adicione gastos primeiro</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PeriodFilter selected={period} onSelect={setPeriod} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <FadeInView>
          <View style={[styles.summaryCard, { backgroundColor: colors.header }]}>
            <Text style={[styles.summaryLabel, { color: colors.headerText }]}>Total do Periodo</Text>
            <Text style={[styles.summaryAmount, { color: colors.headerText }]}>{formatCurrency(totalGeral)}</Text>
            <Text style={[styles.summaryCount, { color: colors.headerText }]}>{filteredExpenses.length} transacoes</Text>
          </View>
        </FadeInView>

        {/* Cash vs Expenses Alert */}
        {isCashInsufficient && (
          <SlideInView delay={50}>
            <View style={[styles.cashAlert, { backgroundColor: colors.danger + '20' }]}>
              <Ionicons name="warning" size={18} color={colors.danger} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.cashAlertTitle, { color: colors.danger }]}>Caixa Insuficiente!</Text>
                <Text style={[styles.cashAlertText, { color: colors.danger }]}>
                  Gastos {formatCurrency(totalGeral)} > Caixa {formatCurrency(cashBalance)}. Faltam {formatCurrency(cashDeficit)}.
                </Text>
              </View>
            </View>
          </SlideInView>
        )}

        {/* Chart Type Toggle */}
        <SlideInView delay={100}>
          <View style={[styles.toggleContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity 
              style={[styles.toggleButton, chartType === 'pie' && { backgroundColor: colors.primary }]} 
              onPress={() => { setChartType('pie'); setSelectedCategory(null); }}
            >
              <Ionicons name="pie-chart" size={14} color={chartType === 'pie' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.toggleText, { color: chartType === 'pie' ? '#fff' : colors.textSecondary }]}>Categoria</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, chartType === 'bar' && { backgroundColor: colors.primary }]} 
              onPress={() => { setChartType('bar'); setSelectedCategory(null); }}
            >
              <Ionicons name="bar-chart" size={14} color={chartType === 'bar' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.toggleText, { color: chartType === 'bar' ? '#fff' : colors.textSecondary }]}>Mes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, chartType === 'card' && { backgroundColor: colors.primary }]} 
              onPress={() => { setChartType('card'); setSelectedCategory(null); }}
            >
              <Ionicons name="card" size={14} color={chartType === 'card' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.toggleText, { color: chartType === 'card' ? '#fff' : colors.textSecondary }]}>Cartao</Text>
            </TouchableOpacity>
          </View>
        </SlideInView>

        {/* Chart Container */}
        <ScaleInView delay={200}>
          <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
            {chartType === 'pie' && pieData.length > 0 ? (
              <View style={styles.pieChartWrapper}>
                <PieChart 
                  data={pieData} 
                  width={screenWidth - 60} 
                  height={260} 
                  chartConfig={chartConfig} 
                  accessor="amount" 
                  backgroundColor="transparent" 
                  paddingLeft="0"
                  hasOnPress={true}
                  avoidFalseZero
                  style={styles.pieChart}
                  onPress={(index) => handlePiePress(index)}
                />
                <View style={styles.pieCenterOverlay} pointerEvents="none">
                  <Text style={[styles.pieCenterLabel, { color: colors.textSecondary }]}>Total</Text>
                  <Text style={[styles.pieCenterValue, { color: colors.text }]}>
                    {formatCurrency(totalGeral)}
                  </Text>
                </View>
              </View>
            ) : chartType === 'bar' && barData.labels.length > 0 ? (
              <View style={styles.barChartWrapper}>
                <BarChart 
                  data={barData} 
                  width={screenWidth - 48} 
                  height={220} 
                  chartConfig={chartConfig} 
                  verticalLabelRotation={0} 
                  fromZero 
                  showValuesOnTopOfBars 
                  style={styles.barChart}
                  yAxisLabel=""
                  yAxisSuffix=""
                  segments={4}
                />
              </View>
            ) : chartType === 'card' ? (
              <View style={styles.cardChartContainer}>
                {Object.entries(cardTotals).map(([cardId, amount]) => {
                  const card = cards.find(c => c.id === cardId);
                  const bank = card ? getBankById(card.bankId) : null;
                  const isStandalone = cardId === 'no-card';
                  const pct = totalGeral > 0 ? ((amount / totalGeral) * 100).toFixed(1) : 0;
                  const displayName = isStandalone ? 'Boleto/Avulso' : (card?.customName || card?.name || 'Sem cartao');
                  const displayColor = isStandalone ? colors.info : (bank?.color || card?.color || '#999');

                  return (
                    <TouchableOpacity 
                      key={cardId} 
                      style={styles.cardChartItem} 
                      onPress={() => handleCardPress(cardId, displayName)}
                    >
                      <View style={styles.cardChartHeader}>
                        <View style={[styles.cardDot, { backgroundColor: displayColor }]} />
                        <Text style={[styles.cardChartName, { color: colors.text }]}>{displayName}</Text>
                        {isStandalone && (
                          <Ionicons name="receipt-outline" size={12} color={colors.info} style={{ marginLeft: 4 }} />
                        )}
                      </View>
                      <View style={styles.cardChartBarContainer}>
                        <View style={[styles.cardChartBar, { width: `${pct}%`, backgroundColor: displayColor }]} />
                      </View>
                      <View style={styles.cardChartValues}>
                        <Text style={[styles.cardChartAmount, { color: colors.text }]}>{formatCurrency(amount)}</Text>
                        <Text style={[styles.cardChartPct, { color: colors.textSecondary }]}>{pct}%</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
        </ScaleInView>

        {/* Lista de categorias abaixo do grafico */}
        {(chartType === 'pie' || chartType === 'card') && displayData.length > 0 && (
          <View style={styles.legendSection}>
            <View style={styles.legendHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {selectedCategory !== null ? 'Categoria Selecionada' : 'Detalhamento por Categoria'}
              </Text>
              {selectedCategory !== null && (
                <TouchableOpacity 
                  style={styles.clearFilterButton}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={[styles.clearFilterText, { color: colors.primary }]}>Limpar filtro</Text>
                  <Ionicons name="close-circle" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {selectedCategory !== null ? 'Toque na cor do grafico para ver todas' : 'Toque na cor do grafico para filtrar'}
            </Text>
            <StaggeredList staggerDelay={60}>
              {displayData.map((item, index) => {
                const percentage = totalGeral > 0 ? ((item.amount / totalGeral) * 100).toFixed(1) : 0;
                const catId = Object.keys(categoryTotals)[index];
                const isSelected = selectedCategory === index;

                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.legendItem, 
                      { backgroundColor: colors.card },
                      isSelected && { 
                        borderLeftColor: item.color, 
                        borderLeftWidth: 4,
                        backgroundColor: item.color + (isDark ? '20' : '10'),
                      }
                    ]} 
                    onPress={() => {
                      setSelectedCategory(isSelected ? null : index);
                      handleCategoryPress(catId, item.name);
                    }}
                  >
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <View style={styles.legendInfo}>
                        <Text style={[styles.legendName, { color: colors.text }]}>{item.name}</Text>
                        <View style={styles.legendPercentRow}>
                          <Text style={[styles.legendPercent, { color: item.color }]}>
                            {percentage}%
                          </Text>
                          <View style={[styles.legendMiniBar, { backgroundColor: item.color + '30', width: `${percentage}%` }]} />
                        </View>
                      </View>
                    </View>
                    <View style={styles.legendRight}>
                      <Text style={[styles.legendAmount, { color: colors.text }]}>{formatCurrency(item.amount)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textLight} style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                );
              })}
            </StaggeredList>
          </View>
        )}

        {/* Resumo mensal */}
        {chartType === 'bar' && last6Months.length > 0 && (
          <View style={styles.monthlySummarySection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumo por Mes</Text>
            <View style={[styles.monthlyTable, { backgroundColor: colors.card }]}>
              <View style={styles.monthlyTableHeader}>
                <Text style={[styles.monthlyHeaderText, { color: colors.textSecondary, flex: 1 }]}>Mes</Text>
                <Text style={[styles.monthlyHeaderText, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]}>Total</Text>
                <Text style={[styles.monthlyHeaderText, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]}>% do Ano</Text>
              </View>
              {last6Months.map((monthKey, index) => {
                const amount = monthlyTotals[monthKey];
                const yearTotal = last6Months.reduce((sum, m) => sum + monthlyTotals[m], 0);
                const pct = yearTotal > 0 ? ((amount / yearTotal) * 100).toFixed(1) : 0;
                const [year, month] = monthKey.split('-');
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'short' });

                return (
                  <View key={monthKey} style={[
                    styles.monthlyRow,
                    index < last6Months.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border || '#e0e0e0' }
                  ]}>
                    <Text style={[styles.monthlyMonthText, { color: colors.text, flex: 1 }]}>
                      {monthName}/{year.slice(2)}
                    </Text>
                    <Text style={[styles.monthlyAmountText, { color: colors.text, flex: 1, textAlign: 'right' }]}>
                      {formatCurrency(amount)}
                    </Text>
                    <Text style={[styles.monthlyPctText, { color: colors.primary, flex: 1, textAlign: 'right' }]}>
                      {pct}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },

  summaryCard: { 
    margin: 16, padding: 24, borderRadius: 20, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 
  },
  summaryLabel: { fontSize: 14, opacity: 0.8 },
  summaryAmount: { fontSize: 32, fontWeight: 'bold', marginVertical: 8 },
  summaryCount: { fontSize: 14, opacity: 0.7 },

  cashAlert: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  cashAlertTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  cashAlertText: { fontSize: 11 },

  toggleContainer: { 
    flexDirection: 'row', justifyContent: 'center', 
    marginHorizontal: 16, marginBottom: 16, borderRadius: 14, padding: 4, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 
  },
  toggleButton: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 4,
  },
  toggleText: { fontSize: 12, fontWeight: '600' },

  chartContainer: { 
    marginHorizontal: 16, borderRadius: 20, padding: 16, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 
  },

  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 280,
    width: '100%',
    marginVertical: 10,
  },
  pieChart: {
    borderRadius: 130,
  },
  pieCenterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pieCenterLabel: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 4,
    fontWeight: '500',
  },
  pieCenterValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  barChartWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  barChart: { 
    borderRadius: 16,
    marginVertical: 8,
  },

  cardChartContainer: { width: '100%', paddingVertical: 10 },
  cardChartItem: { marginBottom: 16 },
  cardChartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  cardChartName: { fontSize: 14, fontWeight: '600' },
  cardChartBarContainer: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 6, overflow: 'hidden' },
  cardChartBar: { height: '100%', borderRadius: 4 },
  cardChartValues: { flexDirection: 'row', justifyContent: 'space-between' },
  cardChartAmount: { fontSize: 13, fontWeight: '600' },
  cardChartPct: { fontSize: 12 },

  legendSection: { margin: 16, marginTop: 24 },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  sectionSubtitle: { fontSize: 12, marginTop: 2, marginBottom: 16 },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },

  legendItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 14, borderRadius: 14, marginBottom: 8, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 
  },
  legendLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  legendInfo: { flex: 1 },
  legendName: { fontSize: 14, fontWeight: '500' },
  legendPercentRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 4,
    gap: 8,
  },
  legendPercent: { fontSize: 12, fontWeight: 'bold' },
  legendMiniBar: {
    height: 4,
    borderRadius: 2,
    flex: 1,
    maxWidth: 80,
  },
  legendRight: { alignItems: 'flex-end', minWidth: 100 },
  legendAmount: { fontSize: 14, fontWeight: 'bold' },

  monthlySummarySection: { margin: 16, marginTop: 24 },
  monthlyTable: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  monthlyTableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  monthlyHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  monthlyRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
  },
  monthlyMonthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  monthlyAmountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  monthlyPctText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});
