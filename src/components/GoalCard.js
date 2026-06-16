import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTheme } from '../context/ThemeContext';

export default function GoalCard({ goal, onContribute }) {
  const { colors } = useTheme();

  const progress = (goal.current / goal.target) * 100;
  const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.bgCard,
      borderLeftColor: goal.color,
      shadowColor: colors.shadow,
    }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: goal.color }]}>
          <Ionicons name={goal.icon} size={20} color="white" />
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{goal.name}</Text>
          <View style={styles.deadline}>
            <Ionicons name="clock" size={10} color={colors.textMuted} />
            <Text style={[styles.deadlineText, { color: colors.textMuted }]}>
              {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo encerrado'}
            </Text>
          </View>
        </View>

        <View style={styles.amount}>
          <Text style={[styles.current, { color: goal.color }]}>
            {formatCurrency(goal.current)}
          </Text>
          <Text style={[styles.target, { color: colors.textMuted }]}>
            de {formatCurrency(goal.target)}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.bgTertiary }]}>
          <View style={[styles.progressFill, { 
            width: `${Math.min(progress, 100)}%`, 
            backgroundColor: goal.color 
          }]} />
        </View>
        <View style={styles.progressText}>
          <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
            {progress.toFixed(1)}% completo
          </Text>
          <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
            {formatCurrency(goal.target - goal.current)} restantes
          </Text>
        </View>
      </View>

      {!goal.completed && (
        <TouchableOpacity 
          style={styles.contributeButton}
          onPress={() => onContribute(goal)}
        >
          <Ionicons name="plus" size={12} color={colors.primary} />
          <Text style={[styles.contributeText, { color: colors.primary }]}>
            Contribuir
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  deadline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontSize: 12,
  },
  amount: {
    alignItems: 'flex-end',
  },
  current: {
    fontSize: 18,
    fontWeight: '700',
  },
  target: {
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 12,
  },
  contributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
  },
  contributeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
