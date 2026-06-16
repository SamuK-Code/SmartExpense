// /src/components/DataDisplay.js
// Consolidates: StatCard + ChartCard + SummaryRow + ProgressRing + TrendIndicator

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { formatCurrency, formatPercentage } from '../utils/ValidationUtils';
import { Badge } from './Indicators';
import Svg, { Circle } from 'react-native-svg';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;

// ═══════════════════════════════════════════════════════════
// SHARED STYLES & HELPERS
// ═══════════════════════════════════════════════════════════

const useDisplayStyles = () => {
  const { theme, isDark } = useTheme();

  return {
    theme,
    isDark,
    colors: theme.colors,
    styles: StyleSheet.create({
      // ─── Common Card ───
      card: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        ...theme.shadows.small,
      },
      cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      },
      cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
      cardAction: {
        fontSize: 13,
        color: theme.colors.primary,
        fontWeight: '600',
      },

      // ─── Typography ───
      bigNumber: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.colors.text,
      },
      mediumNumber: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.text,
      },
      label: {
        fontSize: 13,
        color: theme.colors.textSecondary,
      },
      positive: { color: theme.colors.success },
      negative: { color: theme.colors.danger },
      neutral: { color: theme.colors.text },
      warning: { color: theme.colors.warning },

      // ─── Stat Card ───
      statCard: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 16,
        minWidth: 140,
        flex: 1,
        marginHorizontal: 6,
        ...theme.shadows.small,
      },
      statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
      },
      statIconText: {
        fontSize: 20,
      },
      statValue: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
      },
      statLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '500',
      },
      statChange: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
      },
      statChangeText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
      },

      // ─── Summary Row ───
      summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        marginBottom: 16,
      },

      // ─── Progress Ring ───
      ringContainer: {
        alignItems: 'center',
        justifyContent: 'center',
      },
      ringSvg: {
        transform: [{ rotate: '-90deg' }],
      },
      ringCenter: {
        position: 'absolute',
        alignItems: 'center',
      },
      ringValue: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text,
      },
      ringLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
      },

      // ─── Trend ───
      trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
      },
      trendUp: {
        backgroundColor: theme.colors.success + '20',
      },
      trendDown: {
        backgroundColor: theme.colors.danger + '20',
      },
      trendText: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
      },

      // ─── Chart Card ───
      chartCard: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        ...theme.shadows.small,
      },
      chartLegend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 12,
        gap: 12,
      },
      legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
      },
      legendText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
      },

      // ─── Empty State ───
      emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
      },
      emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
      },
      emptyText: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        textAlign: 'center',
      },
      // ─── Budget Bar extras ───
      progressContainer: {
        height: 8,
        backgroundColor: isDark ? '#333' : '#E5E5EA',
        borderRadius: 4,
        overflow: 'hidden',
      },
      progressBar: {
        height: '100%',
        borderRadius: 4,
      },
      itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
    }),
  };
};

// ═══════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════

export const StatCard = ({
  title,
  value,
  icon,
  iconColor,
  iconBgColor,
  change,
  changeType = 'neutral', // 'positive' | 'negative' | 'neutral'
  onPress,
  style,
}) => {
  const { theme, colors, styles } = useDisplayStyles();

  const getChangeColor = () => {
    if (changeType === 'positive') return colors.success;
    if (changeType === 'negative') return colors.danger;
    return colors.textSecondary;
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return '▲';
    if (changeType === 'negative') return '▼';
    return '•';
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.statCard, style]}
    >
      <View
        style={[
          styles.statIconContainer,
          {
            backgroundColor: iconBgColor || colors.primary + '20',
          },
        ]}
      >
        <Text style={[styles.statIconText, { color: iconColor || colors.primary }]}>
          {icon}
        </Text>
      </View>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {title}
      </Text>
      {change !== undefined && (
        <View style={styles.statChange}>
          <Text style={{ color: getChangeColor(), fontSize: 12 }}>
            {getChangeIcon()}
          </Text>
          <Text style={[styles.statChangeText, { color: getChangeColor() }]}>
            {change}
          </Text>
        </View>
      )}
    </CardWrapper>
  );
};

// ═══════════════════════════════════════════════════════════
// SUMMARY ROW (multiple StatCards in a row)
// ═══════════════════════════════════════════════════════════

export const SummaryRow = ({ children, style }) => {
  const { styles } = useDisplayStyles();
  return <View style={[styles.summaryContainer, style]}>{children}</View>;
};

// ═══════════════════════════════════════════════════════════
// CHART CARD
// ═══════════════════════════════════════════════════════════

export const ChartCard = ({
  title,
  type = 'line', // 'line' | 'bar' | 'pie'
  data,
  labels,
  colors: customColors,
  showLegend = true,
  onPress,
  height = 220,
  emptyMessage,
}) => {
  const { theme, colors, styles, isDark } = useDisplayStyles();
  const { t } = useI18n();

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${isDark ? '255,255,255' : '0,0,0'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDark ? '255,255,255' : '0,0,0'}, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
    propsForLabels: {
      fontSize: 11,
    },
  };

  const defaultColors = [
    colors.primary,
    colors.success,
    colors.warning,
    colors.danger,
    '#8E8E93',
    '#5856D6',
    '#FF9500',
    '#FF2D55',
  ];

  const pieData = data?.map((value, index) => ({
    name: labels?.[index] || '',
    population: Math.abs(value),
    color: customColors?.[index] || defaultColors[index % defaultColors.length],
    legendFontColor: theme.colors.textSecondary,
    legendFontSize: 12,
  }));

  const hasData = data && data.length > 0 && data.some(v => v !== 0);

  if (!hasData) {
    return (
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>
            {emptyMessage || t('chart.noData')}
          </Text>
        </View>
      </View>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart
            data={{
              labels: labels || [],
              datasets: [{ data }],
            }}
            width={CHART_WIDTH}
            height={height}
            chartConfig={chartConfig}
            style={{ borderRadius: 16 }}
            showValuesOnTopOfBars
            fromZero
          />
        );
      case 'pie':
        return (
          <PieChart
            data={pieData}
            width={CHART_WIDTH}
            height={height}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        );
      case 'line':
      default:
        return (
          <LineChart
            data={{
              labels: labels || [],
              datasets: [{ data }],
            }}
            width={CHART_WIDTH}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 16 }}
            fromZero
          />
        );
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.chartCard}
      disabled={!onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {onPress && <Text style={styles.cardAction}>{t('common.seeMore')} →</Text>}
      </View>
      {renderChart()}
      {showLegend && type === 'pie' && pieData && (
        <View style={styles.chartLegend}>
          {pieData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.name}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════
// PROGRESS RING
// ═══════════════════════════════════════════════════════════

export const ProgressRing = ({
  progress, // 0 to 1
  size = 120,
  strokeWidth = 10,
  color,
  bgColor,
  label,
  value,
  style,
}) => {
  const { theme, colors, styles } = useDisplayStyles();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  const ringColor = color || colors.primary;
  const ringBgColor = bgColor || (theme.isDark ? '#333' : '#E5E5EA');

  return (
    <View style={[styles.ringContainer, { width: size, height: size }, style]}>
      <Svg width={size} height={size} style={styles.ringSvg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringBgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringValue}>{value || formatPercentage(progress * 100)}</Text>
        {label && <Text style={styles.ringLabel}>{label}</Text>}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// TREND INDICATOR
// ═══════════════════════════════════════════════════════════

export const TrendIndicator = ({
  value,
  label,
  type = 'neutral', // 'up' | 'down' | 'neutral'
  size = 'normal', // 'small' | 'normal'
  style,
}) => {
  const { theme, colors, styles } = useDisplayStyles();

  const isUp = type === 'up' || (typeof value === 'number' && value > 0);
  const isDown = type === 'down' || (typeof value === 'number' && value < 0);
  const trendType = isUp ? 'up' : isDown ? 'down' : 'neutral';

  const getIcon = () => {
    if (trendType === 'up') return '▲';
    if (trendType === 'down') return '▼';
    return '—';
  };

  const getColor = () => {
    if (trendType === 'up') return colors.success;
    if (trendType === 'down') return colors.danger;
    return colors.textSecondary;
  };

  return (
    <View
      style={[
        styles.trendContainer,
        trendType === 'up' && styles.trendUp,
        trendType === 'down' && styles.trendDown,
        size === 'small' && { paddingHorizontal: 6, paddingVertical: 2 },
        style,
      ]}
    >
      <Text style={{ color: getColor(), fontSize: size === 'small' ? 10 : 12 }}>
        {getIcon()}
      </Text>
      <Text
        style={[
          styles.trendText,
          { color: getColor() },
          size === 'small' && { fontSize: 11 },
        ]}
      >
        {typeof value === 'number' ? `${Math.abs(value)}%` : value}
        {label && ` ${label}`}
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// BUDGET BAR
// ═══════════════════════════════════════════════════════════

export const BudgetBar = ({
  spent,
  budget,
  label,
  warningThreshold = 0.8,
  dangerThreshold = 1.0,
  style,
}) => {
  const { theme, colors, styles } = useDisplayStyles();

  const progress = budget > 0 ? spent / budget : 0;
  const percentage = Math.min(progress * 100, 100);

  const getBarColor = () => {
    if (progress >= dangerThreshold) return colors.danger;
    if (progress >= warningThreshold) return colors.warning;
    return colors.primary;
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.itemRow}>
        <Text style={styles.label}>{label}</Text>
        <Text
          style={[
            styles.mediumNumber,
            progress >= dangerThreshold ? styles.negative : styles.neutral,
          ]}
        >
          {formatCurrency(spent)} / {formatCurrency(budget)}
        </Text>
      </View>
      <View style={[styles.progressContainer, { marginTop: 8, height: 8, borderRadius: 4 }]}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${percentage}%`,
              backgroundColor: getBarColor(),
              height: '100%',
              borderRadius: 4,
            },
          ]}
        />
      </View>
      <View style={[styles.itemRow, { marginTop: 4 }]}>
        <Text style={styles.label}>{formatPercentage(percentage)}</Text>
        <TrendIndicator
          value={percentage}
          type={progress >= dangerThreshold ? 'down' : progress >= warningThreshold ? 'down' : 'up'}
          size="small"
        />
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  StatCard,
  SummaryRow,
  ChartCard,
  ProgressRing,
  TrendIndicator,
  BudgetBar,
};