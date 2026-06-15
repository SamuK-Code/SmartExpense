import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, BORDER_RADIUS, SHADOWS, OPACITY, ICON_SIZES } from '../constants/DesignSystem';
import Badge from './Badge';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Progress bar component
const ProgressBar = ({ progress = 0, color = '#4CAF50' }) => (
  <View style={[styles.progressBarContainer, { backgroundColor: color + '20' }]}>
    <View
      style={[
        styles.progressBarFill,
        {
          width: `${Math.min(progress, 100)}%`,
          backgroundColor: color,
        }
      ]}
    />
  </View>
);

const GoalMapItem = React.memo(function GoalMapItem({
  goal,
  colors,
  category,
  feasibility,
  onToggle,
  onEdit,
  onDelete,
  t,
}) {
  // Determine feasibility color
  const feasibilityColorMap = {
    feasible: colors.success,
    risky: colors.warning,
    impossible: colors.danger,
  };

  const feasibilityColor = feasibility.feasible
    ? (feasibility.warning ? colors.warning : colors.success)
    : colors.danger;

  const cardBgColor = feasibilityColor + OPACITY.light.toString(16);

  // Calculate progress (not really applicable for goals, but for visual indication)
  const progress = goal.completed ? 100 : 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderLeftColor: category.color,
          borderBottomColor: colors.border,
        }
      ]}
    >
      {/* Header with icon and title */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: category.color + '15' }]}>
          <Ionicons name={category.icon} size={ICON_SIZES.lg} color={category.color} />
        </View>
        <View style={styles.titleSection}>
          <Text style={[styles.goalName, { color: colors.text }]} numberOfLines={1}>
            {goal.name}
          </Text>
          <Text style={[styles.goalAmount, { color: category.color, fontWeight: '600' }]}>
            {formatCurrency(goal.amount)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <ProgressBar progress={progress} color={category.color} />
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {progress}%
        </Text>
      </View>

      {/* Feasibility badge */}
      <View style={styles.badgeSection}>
        <Badge
          icon={goal.completed ? 'checkmark-done' : (feasibility.feasible ? 'checkmark-circle' : 'warning')}
          text={goal.completed ? t('purchased') : feasibility.reason}
          color={feasibilityColor}
          size="sm"
        />
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.border }]}
          onPress={() => onToggle(goal.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={goal.completed ? 'checkbox' : 'square-outline'}
            size={ICON_SIZES.md}
            color={goal.completed ? colors.success : colors.textLight}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.border }]}
          onPress={() => onEdit(goal)}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={ICON_SIZES.md} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.danger }]}
          onPress={() => onDelete(goal)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={ICON_SIZES.md} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  goalName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  goalAmount: {
    fontSize: 13,
  },
  progressSection: {
    gap: SPACING.xs,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  badgeSection: {
    alignItems: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GoalMapItem;
