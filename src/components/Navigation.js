import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useCash } from '../contexts/CashContext';

// ========== BACK BUTTON ==========
export function BackButton({ onPress, style }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[backStyles.container, style]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </TouchableOpacity>
  );
}

const backStyles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

// ========== APP HEADER ==========
export function AppHeader({ title, showStats = true }) {
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
    <SafeAreaView style={[headerStyles.safeArea, { backgroundColor: colors.header }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.header} />
      <View style={[headerStyles.container, { backgroundColor: colors.header }]}>
        <View style={headerStyles.titleRow}>
          <Text style={[headerStyles.title, { color: colors.headerText }]}>{title}</Text>
        </View>

        {showStats && (
          <View style={headerStyles.statsRow}>
            <View style={headerStyles.statItem}>
              <Ionicons name="wallet-outline" size={20} color={colors.headerText} />
              <Text style={[headerStyles.statLabel, { color: colors.headerText }]}>{t('balance')}</Text>
              <Text style={[headerStyles.statValue, { color: colors.headerText }]}>{formatCurrency(cashBalance)}</Text>
            </View>
            <View style={[headerStyles.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={headerStyles.statItem}>
              <Ionicons name="card-outline" size={20} color={colors.headerText} />
              <Text style={[headerStyles.statLabel, { color: colors.headerText }]}>{t('mostUsed')}</Text>
              <Text style={[headerStyles.statValue, { color: colors.headerText }]}>{mostUsedCard ? mostUsedCard.customName || mostUsedCard.name : t('none')}</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const headerStyles = StyleSheet.create({
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

// ========== SCREEN LAYOUT ==========
export default function ScreenLayout({
  children,
  title,
  showStats = false,
  showHeader = true,
  style,
  contentStyle,
  scrollable = false,
  scrollContentStyle,
}) {
  const { colors, isDark } = useTheme();

  const content = scrollable ? (
    <ScrollView
      style={[layoutStyles.content, contentStyle]}
      contentContainerStyle={[layoutStyles.scrollContent, scrollContentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[layoutStyles.content, contentStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[layoutStyles.container, { backgroundColor: colors.background }, style]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.header}
      />

      {showHeader && <AppHeader title={title} showStats={showStats} />}

      {content}
    </SafeAreaView>
  );
}

const layoutStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
});