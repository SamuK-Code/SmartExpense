import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.header }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.header} />
      <View style={[styles.container, { backgroundColor: colors.header }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.headerText }]}>{title}</Text>
        </View>

        {showStats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="wallet-outline" size={20} color={colors.headerText} />
              <Text style={[styles.statLabel, { color: colors.headerText }]}>{t('balance')}</Text>
              <Text style={[styles.statValue, { color: colors.headerText }]}>{formatCurrency(cashBalance)}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={styles.statItem}>
              <Ionicons name="card-outline" size={20} color={colors.headerText} />
              <Text style={[styles.statLabel, { color: colors.headerText }]}>{t('mostUsed')}</Text>
              <Text style={[styles.statValue, { color: colors.headerText }]}>{mostUsedCard ? mostUsedCard.customName || mostUsedCard.name : t('none')}</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  container: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
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