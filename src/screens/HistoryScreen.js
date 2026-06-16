import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, getCurrentMonth, getMonthYear } from '../utils/helpers';
import TransactionItem from '../components/TransactionItem';
import Toast from '../components/Toast';

const { width } = Dimensions.get('window');

const HistoryScreen = () => {
  const { transactions, categories, deleteTransaction } = useApp();
  const { colors, darkMode } = useTheme();
  const [chartType, setChartType] = useState('pie');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const month = getCurrentMonth();
  const monthTransactions = transactions.filter(t => t.date.startsWith(month));

  const monthTotal = monthTransactions.reduce((sum, t) => {
    return sum + (t.type === 'income' ? -t.amount : t.amount);
  }, 0);

  const categoryTotals = {};
  monthTransactions.filter(t => t.type === 'expense').forEach(t => {
    categoryTotals[t.categoryName] = (categoryTotals[t.categoryName] || 0) + t.amount;
  });

  const chartColors = Object.keys(categoryTotals).map(name => {
    const cat = categories.find(c => c.name === name);
    return cat ? cat.color : '#94A3B8';
  });

  const filteredTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter(t => {
      if (categoryFilter) return t.categoryName === categoryFilter;
      if (filter === 'all') return true;
      return t.type === filter;
    });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Confirmar exclusão',
      'Deseja excluir esta transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            deleteTransaction(id);
            showToast('Transação excluída', 'warning');
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          <Ionicons name="time" size={20} color={colors.primary} />  Histórico
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Chart */}
        <View style={[styles.chartSection, { backgroundColor: colors.bgCard }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
              <Ionicons name="pie-chart" size={16} color={colors.primary} />  Gastos por Categoria
            </Text>
            <View style={styles.chartTabs}>
              <TouchableOpacity 
                style={[styles.chartTab, chartType === 'pie' && { backgroundColor: colors.primary }]}
                onPress={() => setChartType('pie')}
              >
                <Text style={chartType === 'pie' ? { color: '#FFFFFF' } : { color: colors.textSecondary }}>Pizza</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.chartTab, chartType === 'bar' && { backgroundColor: colors.primary }]}
                onPress={() => setChartType('bar')}
              >
                <Text style={chartType === 'bar' ? { color: '#FFFFFF' } : { color: colors.textSecondary }}>Barras</Text>
              </TouchableOpacity>
            </View>
          </View>

          {Object.keys(categoryTotals).length > 0 ? (
            chartType === 'pie' ? (
              <PieChart
                data={Object.keys(categoryTotals).map((name, i) => ({
                  name,
                  amount: categoryTotals[name],
                  color: chartColors[i],
                  legendFontColor: darkMode ? '#CBD5E1' : '#64748B',
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
                  labels: Object.keys(categoryTotals),
                  datasets: [{ data: Object.values(categoryTotals) }],
                }}
                width={width - 48}
                height={200}
                chartConfig={{
                  backgroundColor: colors.bgCard,
                  backgroundGradientFrom: colors.bgCard,
                  backgroundGradientTo: colors.bgCard,
                  color: (opacity = 1) => darkMode ? `rgba(203, 213, 225, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
                  labelColor: () => darkMode ? '#CBD5E1' : '#64748B',
                  barPercentage: 0.7,
                }}
                style={{ borderRadius: 16 }}
                showValuesOnTopOfBars
              />
            )
          ) : (
            <View style={styles.emptyChart}>
              <Text style={{ color: colors.textMuted }}>Sem dados para o período</Text>
            </View>
          )}

          <Text style={[styles.chartHint, { color: colors.textMuted }]}>
            <Ionicons name="information-circle" size={12} /> Toque em uma fatia para filtrar
          </Text>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {[
            { key: 'all', label: 'Todas' },
            { key: 'expense', label: 'Despesas' },
            { key: 'income', label: 'Receitas' },
            { key: 'boleto', label: 'Boletos' },
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterBtn,
                filter === f.key && !categoryFilter && { backgroundColor: colors.primary },
                categoryFilter && f.key === 'all' && { backgroundColor: colors.warning }
              ]}
              onPress={() => {
                setFilter(f.key);
                setCategoryFilter(null);
              }}
            >
              <Text style={filter === f.key && !categoryFilter ? { color: '#FFFFFF' } : { color: colors.textSecondary }}>
                {categoryFilter && f.key === 'all' ? `Filtro: ${categoryFilter}` : f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Period Summary */}
        <View style={styles.periodSummary}>
          <View style={[styles.periodCard, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.periodLabel, { color: colors.textMuted }]}>Período</Text>
            <Text style={[styles.periodValue, { color: colors.textPrimary }]}>{getMonthYear()}</Text>
          </View>
          <View style={[styles.periodCard, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.periodLabel, { color: colors.textMuted }]}>Total</Text>
            <Text style={[styles.periodValue, { color: colors.textPrimary }]}>{formatCurrency(monthTotal)}</Text>
          </View>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsList}>
          {filteredTransactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.bgCard }]}>
              <Ionicons name="receipt" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {categoryFilter ? 'Nenhuma transação nesta categoria' : 'Nenhuma transação encontrada'}
              </Text>
            </View>
          ) : (
            filteredTransactions.map(t => (
              <TransactionItem
                key={t.id}
                transaction={t}
                colors={colors}
                onPress={() => handleDelete(t.id)}
              />
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <Toast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  chartSection: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartTitle: { fontSize: 16, fontWeight: '600' },
  chartTabs: { flexDirection: 'row', gap: 8 },
  chartTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center' },
  chartHint: { textAlign: 'center', fontSize: 12, marginTop: 8 },
  filterBar: { marginBottom: 16 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 8 },
  periodSummary: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  periodCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  periodLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  periodValue: { fontSize: 16, fontWeight: '700' },
  transactionsList: { gap: 8 },
  emptyState: { padding: 32, borderRadius: 16, alignItems: 'center' },
  emptyText: { fontSize: 14, marginTop: 8 },
});

export default HistoryScreen;
