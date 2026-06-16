// /src/components/UtilsComponents.js
// Consolidates: PeriodFilter + SimpleList + GoalMapItem

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { triggerHaptic } from '../utils/InteractionManagerPatch';
import { formatDateShort, formatPercentage } from '../utils/ValidationUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════
// SHARED STYLES & HELPERS
// ═══════════════════════════════════════════════════════════

const useUtilsStyles = () => {
  const { theme, isDark } = useTheme();

  return {
    theme,
    isDark,
    colors: theme.colors,
    styles: StyleSheet.create({
      // ─── Period Filter ───
      periodContainer: {
        flexDirection: 'row',
        backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
        borderRadius: 12,
        padding: 4,
        marginHorizontal: 16,
        marginBottom: 16,
      },
      periodButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
      },
      periodButtonActive: {
        backgroundColor: theme.colors.card,
        ...theme.shadows.small,
      },
      periodButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textSecondary,
      },
      periodButtonTextActive: {
        color: theme.colors.text,
      },

      // ─── Simple List ───
      listContainer: {
        flex: 1,
      },
      listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
      },
      listTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
      },
      listAction: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '600',
      },
      listItem: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        ...theme.shadows.small,
      },
      listItemIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
      },
      listItemIconText: {
        fontSize: 20,
      },
      listItemContent: {
        flex: 1,
      },
      listItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
      },
      listItemSubtitle: {
        fontSize: 13,
        color: theme.colors.textSecondary,
      },
      listItemRight: {
        alignItems: 'flex-end',
      },
      listItemValue: {
        fontSize: 16,
        fontWeight: '700',
      },
      listItemValuePositive: {
        color: theme.colors.success,
      },
      listItemValueNegative: {
        color: theme.colors.danger,
      },
      listItemChevron: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginLeft: 8,
      },
      listEmpty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
      },
      listEmptyIcon: {
        fontSize: 48,
        marginBottom: 16,
      },
      listEmptyText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
      },
      listEmptySubtext: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        opacity: 0.7,
        textAlign: 'center',
      },
      listFooter: {
        paddingVertical: 20,
      },

      // ─── Goal Map Item ───
      goalContainer: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        ...theme.shadows.small,
      },
      goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
      },
      goalIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
      },
      goalIconText: {
        fontSize: 24,
      },
      goalInfo: {
        flex: 1,
      },
      goalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 2,
      },
      goalDeadline: {
        fontSize: 12,
        color: theme.colors.textSecondary,
      },
      goalAmounts: {
        alignItems: 'flex-end',
      },
      goalCurrent: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
      },
      goalTarget: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
      },
      goalProgressContainer: {
        height: 8,
        backgroundColor: isDark ? '#333' : '#E5E5EA',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
      },
      goalProgressBar: {
        height: '100%',
        borderRadius: 4,
      },
      goalProgressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      goalProgressText: {
        fontSize: 13,
        fontWeight: '600',
      },
      goalStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
      },
      goalStatusText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
      },
      goalActions: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
      },
      goalActionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
      },
      goalActionButtonPrimary: {
        backgroundColor: theme.colors.primary,
      },
      goalActionButtonSecondary: {
        backgroundColor: isDark ? '#333' : '#F2F2F7',
      },
      goalActionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
      },
      goalActionButtonTextSecondary: {
        color: theme.colors.text,
      },
    }),
  };
};

// ═══════════════════════════════════════════════════════════
// PERIOD FILTER
// ═══════════════════════════════════════════════════════════

export const PeriodFilter = ({
  periods = [],
  selectedPeriod,
  onSelect,
  style,
}) => {
  const { colors, styles } = useUtilsStyles();
  const { t } = useI18n();

  const defaultPeriods = periods.length > 0 ? periods : [
    { id: 'week', label: t('period.week') },
    { id: 'month', label: t('period.month') },
    { id: 'quarter', label: t('period.quarter') },
    { id: 'year', label: t('period.year') },
    { id: 'all', label: t('period.all') },
  ];

  const handlePress = (periodId) => {
    if (periodId !== selectedPeriod) {
      triggerHaptic('light');
      onSelect?.(periodId);
    }
  };

  return (
    <View style={[styles.periodContainer, style]}>
      {defaultPeriods.map((period) => {
        const isActive = selectedPeriod === period.id;
        return (
          <TouchableOpacity
            key={period.id}
            style={[
              styles.periodButton,
              isActive && styles.periodButtonActive,
            ]}
            onPress={() => handlePress(period.id)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.periodButtonText,
                isActive && styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// SIMPLE LIST
// ═══════════════════════════════════════════════════════════

export const SimpleList = ({
  data = [],
  title,
  onSeeAll,
  onItemPress,
  renderItem: customRenderItem,
  keyExtractor,
  emptyIcon = '📋',
  emptyTitle,
  emptySubtitle,
  showChevron = true,
  style,
  contentContainerStyle,
  ListHeaderComponent,
  ListFooterComponent,
  refreshing,
  onRefresh,
  onEndReached,
}) => {
  const { colors, styles } = useUtilsStyles();
  const { t } = useI18n();

  const defaultKeyExtractor = useCallback((item, index) => {
    return item.id?.toString() || item.key?.toString() || String(index);
  }, []);

  const defaultRenderItem = useCallback(({ item, index }) => {
    const isPositive = item.value > 0;
    const isNegative = item.value < 0;

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => onItemPress?.(item, index)}
        activeOpacity={0.8}
      >
        {item.icon && (
          <View style={[styles.listItemIcon, { backgroundColor: item.iconColor || colors.primary + '20' }]}>
            <Text style={styles.listItemIconText}>{item.icon}</Text>
          </View>
        )}
        <View style={styles.listItemContent}>
          <Text style={styles.listItemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.listItemSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}
        </View>
        <View style={styles.listItemRight}>
          {item.value !== undefined && (
            <Text
              style={[
                styles.listItemValue,
                isPositive && styles.listItemValuePositive,
                isNegative && styles.listItemValueNegative,
              ]}
            >
              {isPositive ? '+' : ''}{item.formattedValue || item.value}
            </Text>
          )}
          {showChevron && (
            <Text style={styles.listItemChevron}>›</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [colors, styles, onItemPress, showChevron]);

  const renderEmpty = () => (
    <View style={styles.listEmpty}>
      <Text style={styles.listEmptyIcon}>{emptyIcon}</Text>
      <Text style={styles.listEmptyText}>
        {emptyTitle || t('list.emptyTitle')}
      </Text>
      {emptySubtitle && (
        <Text style={styles.listEmptySubtext}>{emptySubtitle}</Text>
      )}
    </View>
  );

  return (
    <View style={[styles.listContainer, style]}>
      {title && (
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{title}</Text>
          {onSeeAll && (
            <TouchableOpacity onPress={onSeeAll}>
              <Text style={styles.listAction}>{t('common.seeAll')} →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {ListHeaderComponent}
      <FlatList
        data={data}
        renderItem={customRenderItem || defaultRenderItem}
        keyExtractor={keyExtractor || defaultKeyExtractor}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={ListFooterComponent || <View style={styles.listFooter} />}
        contentContainerStyle={[
          data.length === 0 && { flex: 1 },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// GOAL MAP ITEM
// ═══════════════════════════════════════════════════════════

export const GoalMapItem = ({
  goal,
  onPress,
  onContribute,
  onEdit,
  onDelete,
  showActions = true,
  style,
}) => {
  const { colors, styles } = useUtilsStyles();
  const { t } = useI18n();
  const [scaleAnim] = useState(new Animated.Value(1));

  const progress = goal.target > 0 ? (goal.current / goal.target) : 0;
  const percentage = Math.min(progress * 100, 100);
  const isCompleted = progress >= 1;
  const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !isCompleted;

  const getStatusConfig = () => {
    if (isCompleted) return {
      label: t('goal.completed'),
      color: colors.success,
      bgColor: colors.success + '20',
    };
    if (isOverdue) return {
      label: t('goal.overdue'),
      color: colors.danger,
      bgColor: colors.danger + '20',
    };
    if (percentage >= 75) return {
      label: t('goal.almostThere'),
      color: colors.warning,
      bgColor: colors.warning + '20',
    };
    return {
      label: t('goal.inProgress'),
      color: colors.primary,
      bgColor: colors.primary + '20',
    };
  };

  const status = getStatusConfig();

  const getProgressColor = () => {
    if (isCompleted) return colors.success;
    if (percentage >= 75) return colors.warning;
    if (percentage >= 50) return colors.primary;
    return colors.info || colors.primary;
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.goalContainer}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalIcon}>
            <Text style={styles.goalIconText}>{goal.icon || '🎯'}</Text>
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle} numberOfLines={1}>
              {goal.title}
            </Text>
            {goal.deadline && (
              <Text style={styles.goalDeadline}>
                {isCompleted
                  ? t('goal.completedOn', { date: formatDateShort(goal.completedAt) })
                  : daysLeft > 0
                  ? t('goal.daysLeft', { days: daysLeft })
                  : t('goal.overdueBy', { days: Math.abs(daysLeft) })}
              </Text>
            )}
          </View>
          <View style={styles.goalAmounts}>
            <Text style={styles.goalCurrent}>
              {goal.formattedCurrent || goal.current}
            </Text>
            <Text style={styles.goalTarget}>
              {t('goal.of')} {goal.formattedTarget || goal.target}
            </Text>
          </View>
        </View>

        <View style={styles.goalProgressContainer}>
          <View
            style={[
              styles.goalProgressBar,
              {
                width: `${percentage}%`,
                backgroundColor: getProgressColor(),
              },
            ]}
          />
        </View>

        <View style={styles.goalProgressInfo}>
          <Text style={[styles.goalProgressText, { color: getProgressColor() }]}>
            {formatPercentage(percentage)}
          </Text>
          <View style={[styles.goalStatusBadge, { backgroundColor: status.bgColor }]}>
            <Text style={[styles.goalStatusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {showActions && !isCompleted && (
          <View style={styles.goalActions}>
            <TouchableOpacity
              style={[styles.goalActionButton, styles.goalActionButtonPrimary]}
              onPress={onContribute}
            >
              <Text style={styles.goalActionButtonText}>
                {t('goal.contribute')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.goalActionButton, styles.goalActionButtonSecondary]}
              onPress={onEdit}
            >
              <Text style={[styles.goalActionButtonText, styles.goalActionButtonTextSecondary]}>
                {t('common.edit')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  PeriodFilter,
  SimpleList,
  GoalMapItem,
};
