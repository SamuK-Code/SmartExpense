import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useCash } from '../context/CashContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';

export default function AppHeader({ title, showStats = true }) {
  const { expenses, cards, getCardUsage } = useExpenses();
  const { cashBalance } = useCash();
  const { colors } = useTheme();
  const { t } = useI18n();

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
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: '#fff' }]}>{title}</Text>
      </View>

      {showStats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="wallet-outline" size={18} color="#fff" />
            <Text style={[styles.statLabel, { color: '#fff' }]}>{t('balance')}</Text>
            <Text style={[styles.statValue, { color: '#fff' }]}>{formatCurrency(cashBalance)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="card-outline" size={18} color="#fff" />
            <Text style={[styles.statLabel, { color: '#fff' }]}>{t('mostUsed')}</Text>
            <Text style={[styles.statValue, { color: '#fff' }]}>{mostUsedCard ? mostUsedCard.customName || mostUsedCard.name : t('none')}</Text>
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
