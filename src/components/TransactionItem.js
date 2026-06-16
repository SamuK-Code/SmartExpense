import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTheme } from '../context/ThemeContext';

export default function TransactionItem({ transaction, onPress }) {
  const { colors } = useTheme();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  };

  const getIconColor = () => {
    switch (transaction.type) {
      case 'income': return colors.success;
      case 'expense': return colors.danger;
      case 'boleto': return colors.warning;
      default: return colors.textMuted;
    }
  };

  const getIconBg = () => {
    switch (transaction.type) {
      case 'income': return 'rgba(16, 185, 129, 0.1)';
      case 'expense': return 'rgba(239, 68, 68, 0.1)';
      case 'boleto': return 'rgba(245, 158, 11, 0.1)';
      default: return colors.bgTertiary;
    }
  };

  const getAmountColor = () => {
    switch (transaction.type) {
      case 'income': return colors.success;
      case 'expense': return colors.danger;
      case 'boleto': return colors.warning;
      default: return colors.textPrimary;
    }
  };

  const getAmountPrefix = () => {
    return transaction.type === 'income' ? '+' : '-';
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.bgCard }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getIconBg() }]}>
        <Ionicons 
          name={transaction.categoryIcon || 'receipt'} 
          size={18} 
          color={getIconColor()} 
        />
      </View>

      <View style={styles.details}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {transaction.desc}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {transaction.categoryName}
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>•</Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {formatDate(transaction.date)}
          </Text>
        </View>
      </View>

      <Text style={[styles.amount, { color: getAmountColor() }]}>
        {getAmountPrefix()} {formatCurrency(transaction.amount)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
