import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { usePlanning } from '../context/PlanningContext';
import { useTheme } from '../context/ThemeContext';

export default function AppHeader({ title, showStats = true }) {
  const { expenses, cards, getCardUsage } = useExpenses();
  const { cashBalance } = usePlanning();
  const { colors } = useTheme();

  // Encontra o cartão mais utilizado (maior gasto)
  const getMostUsedCard = () => {
    if (cards.length === 0) return null;

    let maxUsage = 0;
    let mostUsedCard = null;

    cards.forEach(card => {
      const usage = getCardUsage(card.id);
      if (usage > maxUsage) {
        maxUsage = usage;
        mostUsedCard = card;
      }
    });

    return mostUsedCard;
  };

  const mostUsedCard = getMostUsedCard();
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.header }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.headerText }]}>{title}</Text>
      </View>

      {showStats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="wallet-outline" size={16} color={colors.headerText} />
            <Text style={[styles.statLabel, { color: colors.headerText }]}>Saldo</Text>
            <Text style={[styles.statValue, { color: colors.headerText }]}>
              {formatCurrency(cashBalance)}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="card-outline" size={16} color={colors.headerText} />
            <Text style={[styles.statLabel, { color: colors.headerText }]}>Mais usado</Text>
            <Text style={[styles.statValue, { color: colors.headerText }]} numberOfLines={1}>
              {mostUsedCard ? mostUsedCard.customName || mostUsedCard.name : 'Nenhum'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  titleRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
