import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
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
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [scaleAnims] = useState(() => 
    CATEGORIES.map(() => new Animated.Value(1))
  );

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

  const handleSlicePress = (index, catId) => {
    // Animate scale
    scaleAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === index ? 1.15 : 0.85,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    setSelectedSlice(index);

    // Navigate after delay
    setTimeout(() => {
      const cat = CATEGORIES.find(c => c.id === catId);
      handleCategoryPress(catId, cat?.name || catId);
    }, 500);
  };

  const pieData = Object.entries(categoryTotals).map(([catId, amount]) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    const percentage = totalGeral > 0 ? ((amount / totalGeral) * 100).toFixed(1) : 0;
    return {
      name: `${cat?.name || catId} (${percentage}%)`,
      amount: amount,
      color: cat?.color || '#999',
      legendFontColor: colors.text,
      legendFontSize: 12,
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
    propsForLabels: { fontSize: 11, fontWeight: '600' },
    propsForBackgroundLines: { stroke: isDark ? '#333' : '#e0e0e0', strokeWidth: 1 },
  };

  // Custom Donut Chart Component
  const DonutChart = () => {
    const radius = 100;
    const innerRadius = 60;
    const centerX = screenWidth / 2 - 24;
    const centerY = 130;
    let currentAngle = 0;

    return (
      <View style={styles.donutContainer}>
        <View style={styles.donutChart}>
          {pieData.map((item, index) => {
            const percentage = totalGeral > 0 ? item.amount / totalGeral : 0;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            const endAngle = currentAngle;
            const isSelected = selectedSlice === index;

            // Calculate path for arc
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;

            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            const x3 = centerX + innerRadius * Math.cos(endRad);
            const y3 = centerY + innerRadius * Math.sin(endRad);
            const x4 = centerX + innerRadius * Math.cos(startRad);
            const y4 = centerY + innerRadius * Math.sin(startRad);

            const largeArc = angle > 180 ? 1 : 0;

            const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleSlicePress(index, Object.keys(categoryTotals)[index])}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={[
                    styles.donutSlice,
                    {
                      transform: [{ scale: scaleAnims[index] || new Animated.Value(1) }],
                      opacity: selectedSlice === null || selectedSlice === index ? 1 : 0.3,
                    },
                  ]}
                >
                  <View style={styles.donutSvg}>
                    <View style={[styles.donutArc, { 
                      backgroundColor: item.color,
                      width: radius * 2,
                      height: radius * 2,
                      borderRadius: radius,
                      borderWidth: radius - innerRadius,
                      borderColor: item.color,
                      transform: [
                        { rotate: `${startAngle}deg` },
                        { scale: isSelected ? 1.05 : 1 },
                      ],
                    }]} />
                  </View>
                </Animated.View>
              </TouchableOpacity>
            );
          })}

          {/* Center Text */}
          <View style={[styles.donutCenter, { top: centerY - 30, left: centerX - 60 }]}>
            <Text style={[styles.donutCenterLabel, { color: colors.textSecondary }]}>Total</Text>
            <Text style={[styles.donutCenterValue, { color: colors.text }]}>
              {formatCurrency(totalGeral)}
            </Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.donutLegend}>
          {pieData.map((item, index) => {
            const percentage = totalGeral > 0 ? ((item.amount / totalGeral) * 100).toFixed(1) : 0;
            const catId = Object.keys(categoryTotals)[index];
            const isSelected = selectedSlice === index;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.legendItem,
                  isSelected && { backgroundColor: item.color + '20', borderRadius: 10 },
                ]}
                onPress={() => handleSlicePress(index, catId)}
              >
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <View style={styles.legendInfo}>
                  <Text style={[styles.legendName, { color: colors.text }]}>
                    {item.name.split(' (')[0]}
                  </Text>
                  <Text style={[styles.legendPercent, { color: item.color, fontWeight: 'bold' }]}>
                    {percentage}%
                  </Text>
                </View>
                <Text style={[styles.legendAmount, { color: colors.text }]}>
                  {formatCurrency(item.amount)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
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

        {/* Chart Type Toggle */}
        <SlideInView delay={100}>
          <View style={[styles.toggleContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity 
              style={[styles.toggleButton, chartType === 'pie' && { backgroundColor: colors.primary }]} 
              onPress={() => setChartType('pie')}
            >
              <Ionicons name="pie-chart" size={14} color={chartType === 'pie' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.toggleText, chartType === 'pie' && { color: '#fff' }, { color: chartType === 'pie' ? '#fff' : colors.textSecondary }]}>Categoria</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, chartType === 'bar' && { backgroundColor: colors.primary }]} 
              onPress={() => setChartType('bar')}
            >
              <Ionicons name="bar-chart" size={14} color={chartType === 'bar' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.toggleText, chartType === 'bar' && { color: '#fff' }, { color: chartType === 'bar' ? '#fff' : colors.textSecondary }]}>Mês</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, chartType === 'card' && { backgroundColor: colors.primary }]} 
              onPress={() => setChartType('card')}
            >
              <Ionicons name="card" size={14} color={chartType === 'card' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.toggleText, chartType === 'card' && { color: '#fff' }, { color: chartType === 'card' ? '#fff' : colors.textSecondary }]}>Cartão</Text>
            </TouchableOpacity>
          </View>
        </SlideInView>

        {/* Chart Container */}
        <ScaleInView delay={200}>
          <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
            {chartType === 'pie' && pieData.length > 0 ? (
              <DonutChart />
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
                  const isStandalone = cardId === 'no-card';
                  const pct = totalGeral > 0 ? ((amount / totalGeral) * 100).toFixed(1) : 0;
                  const displayName = isStandalone ? 'Boleto/Avulso' : (card?.customName || card?.name || 'Sem cartão');
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
  barChart: { borderRadius: 16 },

  // Donut Chart Styles
  donutContainer: { alignItems: 'center', paddingVertical: 20 },
  donutChart: { 
    width: screenWidth - 48, 
    height: 260, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',
  },
  donutSlice: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutSvg: {
    position: 'absolute',
  },
  donutArc: {
    position: 'absolute',
  },
  donutCenter: {
    position: 'absolute',
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  donutCenterLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  donutCenterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  donutLegend: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendName: {
    fontSize: 14,
    fontWeight: '500',
  },
  legendPercent: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  legendAmount: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 10,
  },

  // Card Chart Styles
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
});
