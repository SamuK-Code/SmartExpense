import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

export const GOAL_ICONS = [
  'airplane', 'alarm', 'american-football', 'aperture', 'archive', 'barbell',
  'basket', 'basketball', 'bed', 'beer', 'bicycle', 'boat', 'book', 'briefcase',
  'brush', 'bug', 'build', 'bus', 'cafe', 'camera', 'car', 'card', 'cart',
  'cash', 'cellular', 'chatbubble', 'checkmark-circle', 'clipboard', 'clock',
  'cloud', 'code', 'color-palette', 'compass', 'construct', 'cube', 'desktop',
  'diamond', 'document', 'earth', 'egg', 'extension-puzzle', 'eye', 'female',
  'film', 'filter', 'finger-print', 'fish', 'fitness', 'flag', 'flame',
  'flash', 'flashlight', 'flower', 'football', 'game-controller', 'gift',
  'glasses', 'globe', 'golf', 'grid', 'hammer', 'happy', 'headset', 'heart',
  'home', 'ice-cream', 'image', 'key', 'laptop', 'leaf', 'library', 'link',
  'list', 'location', 'lock-closed', 'log-in', 'logo-apple', 'logo-bitcoin',
  'logo-css3', 'logo-docker', 'logo-figma', 'logo-firebase', 'logo-github',
  'logo-google', 'logo-html5', 'logo-javascript', 'logo-nodejs', 'logo-npm',
  'logo-python', 'logo-react', 'logo-stackoverflow', 'logo-tux', 'logo-vue',
  'logo-youtube', 'magnet', 'mail', 'male', 'map', 'medal', 'medical', 'megaphone',
  'mic', 'moon', 'musical-note', 'navigate', 'notifications', 'nuclear',
  'nutrition', 'paper-plane', 'partly-sunny', 'paw', 'pencil', 'people',
  'person', 'phone-portrait', 'pie-chart', 'pin', 'pizza', 'planet', 'pricetag',
  'print', 'pulse', 'push', 'radio', 'rainy', 'receipt', 'restaurant', 'ribbon',
  'rocket', 'rose', 'school', 'search', 'send', 'settings', 'shield-checkmark',
  'shirt', 'snow', 'sparkles', 'speedometer', 'star', 'stopwatch', 'storefront',
  'subway', 'sunny', 'sync', 'tennisball', 'terminal', 'thermometer', 'thumbs-up',
  'thunderstorm', 'ticket', 'time', 'timer', 'today', 'trail-sign', 'train',
  'transgender', 'trash', 'trending-up', 'trophy', 'tv', 'umbrella', 'videocam',
  'volume-high', 'walk', 'wallet', 'warning', 'watch', 'water', 'wifi', 'wine',
];

const GoalCard = ({ goal, onInvest, onWithdraw, onComplete, onDelete, canEdit, colors }) => {
  const progress = (goal.targetAmount || goal.target) > 0
    ? ((goal.currentAmount || goal.current || 0) / (goal.targetAmount || goal.target)) * 100
    : 0;
  const isCompleted = progress >= 100;

  const runnerPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(runnerPosition, {
      toValue: Math.min(progress, 100),
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const interpolatedPosition = runnerPosition.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '92%'],
  });

  const daysSince = goal.createdAt
    ? Math.floor((Date.now() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const cardColor = goal.color || colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: '#000' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: cardColor + '20' }]}>
            <Ionicons name={goal.icon || 'flag'} size={28} color={cardColor} />
          </View>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{goal.name}</Text>
            <Text style={[styles.targetValue, { color: colors.muted }]}>
              {formatCurrency(goal.currentAmount || goal.current || 0)} / {formatCurrency(goal.targetAmount || goal.target || 0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <Text style={[styles.percentText, { color: colors.muted }]}>{progress.toFixed(0)}%</Text>
          <View style={styles.runnerTrack}>
            <Animated.View style={[styles.runner, { left: interpolatedPosition }]}>
              <Ionicons name="trophy" size={18} color={cardColor} />
            </Animated.View>
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
          <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: cardColor }]} />
        </View>
      </View>

      {/* Info */}
      <Text style={[styles.daysText, { color: colors.muted }]}>
        {daysSince} {daysSince === 1 ? 'dia' : 'dias'} desde o início
      </Text>

      {/* Actions */}
      {canEdit && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.investButton, { borderColor: cardColor }]}
            onPress={() => onInvest && onInvest(goal, 'deposit')}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={16} color={cardColor} />
            <Text style={[styles.buttonText, { color: cardColor }]}>Investir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.withdrawButton, { borderColor: '#F59E0B' }]}
            onPress={() => onWithdraw && onWithdraw(goal, 'withdraw')}
            activeOpacity={0.7}
          >
            <Ionicons name="remove-circle" size={16} color="#F59E0B" />
            <Text style={[styles.buttonText, { color: '#F59E0B' }]}>Retirar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.completeButton, {
              borderColor: isCompleted ? '#10B981' : colors.muted,
              backgroundColor: isCompleted ? '#10B981' + '15' : 'transparent'
            }]}
            onPress={() => isCompleted && onComplete && onComplete(goal)}
            activeOpacity={isCompleted ? 0.7 : 1}
            disabled={!isCompleted}
          >
            <Ionicons name={isCompleted ? "checkmark-circle" : "ellipse-outline"} size={16} color={isCompleted ? '#10B981' : colors.muted} />
            <Text style={[styles.buttonText, { color: isCompleted ? '#10B981' : colors.muted }]}>
              {isCompleted ? 'Concluir' : `${(100 - progress).toFixed(0)}% restante`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const formatCurrency = (value) => {
  return 'R$ ' + (value || 0).toFixed(2).replace('.', ',');
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  titleSection: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  targetValue: { fontSize: 13, fontWeight: '500' },
  progressSection: { marginBottom: 10 },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    height: 24,
  },
  percentText: { fontSize: 14, fontWeight: '600', minWidth: 40 },
  runnerTrack: { flex: 1, height: 24, position: 'relative', marginHorizontal: 8 },
  runner: { position: 'absolute', top: 0, transform: [{ translateX: -10 }] },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  daysText: { fontSize: 11, marginBottom: 14 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'center',
  },
  investButton: { backgroundColor: 'transparent' },
  withdrawButton: { backgroundColor: 'transparent' },
  completeButton: { backgroundColor: 'transparent' },
  buttonText: { fontSize: 13, fontWeight: '600' },
});

export default GoalCard;