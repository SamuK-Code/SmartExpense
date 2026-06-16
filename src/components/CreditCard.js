import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCardGradientColors, formatCurrency, formatDate } from '../utils/helpers';

const { width } = Dimensions.get('window');

const CreditCard = ({ card, used = 0, compact = false }) => {
  const colors = getCardGradientColors(card.gradientClass);
  const available = card.limit - used;

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <View style={styles.datesContainer}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>Fecha: {formatDate(card.closeDate)}</Text>
        </View>
        {!compact && (
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>Vence: {formatDate(card.dueDate)}</Text>
          </View>
        )}
      </View>

      <View style={styles.chip} />

      <Text style={styles.number}>{card.number}</Text>

      <View style={styles.footer}>
        <Text style={styles.holder}>{card.name.toUpperCase()}</Text>
        <View style={styles.balance}>
          <Text style={styles.balanceLabel}>{compact ? 'Disp' : 'Disponível'}</Text>
          <Text style={styles.balanceValue}>{formatCurrency(available)}</Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.logo}>
          <Text style={styles.logoText}>💳</Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width - 48,
    height: 180,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  cardCompact: {
    width: 280,
    height: 160,
    padding: 16,
  },
  datesContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'flex-end',
    gap: 4,
  },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  chip: {
    width: 44,
    height: 32,
    backgroundColor: '#FCD34D',
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  number: {
    fontSize: 20,
    letterSpacing: 3,
    color: '#FFFFFF',
    fontFamily: 'Courier',
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  holder: {
    fontSize: 13,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '500',
    opacity: 0.95,
  },
  balance: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  logo: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    opacity: 0.3,
  },
  logoText: {
    fontSize: 32,
  },
});

export default CreditCard;
