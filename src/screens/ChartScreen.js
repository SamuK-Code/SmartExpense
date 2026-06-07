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
      legendFontColor: colors.text,
      legendFontSize: 11,
      onPress: () => handleCategoryPress(catId, cat?.name || catId),
    };
  }).sort((a, b) => b.amount - a.amount);

  const sortedMonths = Object.keys(monthlyTotals).sort();
  const barData = {
    labels: sortedMonths.slice(-6).map(m => { const [year, month] = m.split('-'); return `${month}/${year.slice(2)}`; }),
    datasets: [{ data: sortedMonths.slice(-6).map(m => monthlyTotals[m]) }],
  };

  const chartConfig = {
    backgroundColor: colors.chartBg,
    backgroundGradientFrom: colors.chartBg,
    backgroundGradientTo: colors.chartBg,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForLabels: { fontSize: 10, fontWeight: '500' },
    propsForBackgroundLines: { stroke: isDark ? '#333' : '#e0e0e0', strokeWidth: 1 },
  };

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
            <Text style={[styles.summaryLabel, { color: colors.headerText }]}>Total do Período</Text>
            <Text style={[styles.summaryAmount, { color: colors.headerText }]}>{formatCurrency(totalGeral)}</Text>
            <Text style={[styles.summaryCount, { color: colors.headerText }]}>{filteredExpenses.length} transações</Text>
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

        {/* Chart Type Toggle - Improved styling */}
        <SlideInView delay={100}>
          <View style={[styles.toggleContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity 
              style={[styles.toggleButton, chartType === 'pie' && { backgroundColor: colors.primary }]} 
              onPress={() => setChartType('pie')}
            >
              <Ionicons name="pie-chart" size={14} color={chartType === 'pie' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.toggleText, chartType === 'pie' && { color: '#fff' }, { color: colors.textSecondary }]}>Categoria</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, chartType === 'bar' && { backgroundColor: colors.primary }]} 
              onPress={() => setChartType('bar')}
            >
              <Ionicons name="bar-chart" size={14} color={chartType === 'bar' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.toggleText, chartType === 'bar' && { color: '#fff' }, { color: colors.textSecondary }]}>Mês</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, chartType === 'card' && { backgroundColor: colors.primary }]} 
              onPress={() => setChartType('card')}
            >
              <Ionicons name="card" size={14} color={chartType === 'card' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.toggleText, chartType === 'card' && { color: '#fff' }, { color: colors.textSecondary }]}>Cartão</Text>
            </TouchableOpacity>
          </View>
        </SlideInView>

        {/* Chart Container - Improved styling */}
        <ScaleInView delay={200}>
          <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
            {chartType === 'pie' && pieData.length > 0 ? (
              <PieChart 
                data={pieData} 
                width={screenWidth - 48} 
                height={220} 
                chartConfig={chartConfig} 
                accessor="amount" 
                backgroundColor="transparent" 
                paddingLeft="15" 
                absolute 
                hasOnPress={true} 
              />
            ) : chartType === 'bar' && barData.labels.length > 0 ? (
              <BarChart 
                data={barData} 
                width={screenWidth - 48} 
                height={220} 
                chartConfig={chartConfig} 
                verticalLabelRotation={0} 
                fromZero 
                showValuesOnTopOfBars 
                style={styles.barChart} 
              />
            ) : chartType === 'card' ? (
              <View style={styles.cardChartContainer}>
                {Object.entries(cardTotals).map(([cardId, amount]) => {
                  const card = cards.find(c => c.id === cardId);
                  const bank = card ? getBankById(card.bankId) : null;
                  const pct = totalGeral > 0 ? ((amount / totalGeral) * 100).toFixed(1) : 0;
                  return (
                    <TouchableOpacity 
                      key={cardId} 
                      style={styles.cardChartItem} 
                      onPress={() => handleCardPress(cardId, card?.customName || card?.name || 'Sem cartão')}
                    >
                      <View style={styles.cardChartHeader}>
                        <View style={[styles.cardDot, { backgroundColor: bank?.color || card?.color || '#999' }]} />
                        <Text style={[styles.cardChartName, { color: colors.text }]}>{card?.customName || card?.name || 'Sem cartão'}</Text>
                      </View>
                      <View style={styles.cardChartBarContainer}>
                        <View style={[styles.cardChartBar, { width: `${pct}%`, backgroundColor: bank?.color || card?.color || '#999' }]} />
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

        {/* Breakdown Section - Improved styling */}
        <View style={styles.breakdownSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Detalhamento</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Toque para ver mais detalhes</Text>
          <StaggeredList staggerDelay={60}>
            {pieData.map((item, index) => {
              const percentage = totalGeral > 0 ? ((item.amount / totalGeral) * 100).toFixed(1) : 0;
              const catId = Object.keys(categoryTotals)[index];
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.breakdownItem, { backgroundColor: colors.card }]} 
                  onPress={() => handleCategoryPress(catId, item.name)}
                >
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    <View>
                      <Text style={[styles.breakdownName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.breakdownPercent, { color: colors.textSecondary }]}>{percentage}% do total</Text>
                    </View>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={[styles.breakdownAmount, { color: colors.text }]}>{formatCurrency(item.amount)}</Text>
                    <View style={styles.miniBarContainer}>
                      <View style={[styles.miniBar, { width: `${percentage}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textLight} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              );
            })}
          </StaggeredList>
        </View>
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
    margin: 16, 
    padding: 24, 
    borderRadius: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 8, 
    elevation: 5 
  },
  summaryLabel: { fontSize: 14, opacity: 0.8 },
  summaryAmount: { fontSize: 32, fontWeight: 'bold', marginVertical: 8 },
  summaryCount: { fontSize: 14, opacity: 0.7 },
  cashAlert: {
    flexDirection: 'row', 
    alignItems: 'center',
    marginHorizontal: 16, 
    marginBottom: 12, 
    padding: 12, 
    borderRadius: 12,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    elevation: 2,
  },
  cashAlertTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  cashAlertText: { fontSize: 11 },
  toggleContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 14, 
    padding: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  toggleButton: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10, 
    borderRadius: 10,
    gap: 4,
  },
  toggleText: { 
    fontSize: 12, 
    fontWeight: '600',
  },
  chartContainer: { 
    marginHorizontal: 16, 
    borderRadius: 20, 
    padding: 16, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  barChart: { borderRadius: 16 },
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
  breakdownSection: { margin: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  sectionSubtitle: { fontSize: 12, marginTop: 2, marginBottom: 16 },
  breakdownItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 14, 
    marginBottom: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 3, 
    elevation: 1 
  },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  breakdownName: { fontSize: 14, fontWeight: '500' },
  breakdownPercent: { fontSize: 11, marginTop: 2 },
  breakdownRight: { alignItems: 'flex-end', minWidth: 100 },
  breakdownAmount: { fontSize: 14, fontWeight: 'bold' },
  miniBarContainer: { width: 80, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  miniBar: { height: '100%', borderRadius: 2 },
});
