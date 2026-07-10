// SplitExpenseItem.js — Badge e resumo de despesa dividida

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { formatCurrency } from '../utils/helpers';

const SplitExpenseItem = ({ split, onPress, compact = false }) => {
  const { colors } = useTheme();
  const { t } = useTranslate();

  if (!split || !split.participants) return null;

  const participants = split.participants || [];
  const totalPaid = participants.filter(p => p.paid).reduce((s, p) => s + (p.share || 0), 0);
  const totalPending = participants.filter(p => !p.paid).reduce((s, p) => s + (p.share || 0), 0);
  const allPaid = totalPending <= 0.01;

  if (compact) {
    // Versão compacta (badge inline)
    return (
      <View style={[styles.compactBadge, { backgroundColor: allPaid ? colors.success + '15' : colors.warning + '15' }]}>
        <Ionicons name="people" size={12} color={allPaid ? colors.success : colors.warning} />
        <Text style={{ fontSize: 10, fontWeight: '700', color: allPaid ? colors.success : colors.warning, marginLeft: 4 }}>
          {allPaid ? t('split.allPaid') : `${participants.filter(p => !p.paid).length} ${t('split.owing')}`}
        </Text>
      </View>
    );
  }

  // Versão expandida (detalhes da divisão)
  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: colors.bgTertiary }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={[styles.splitIcon, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="git-merge" size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
            {t('split.dividedWith')} {participants.length} {participants.length === 1 ? t('split.person') : t('split.people')}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
            {split.type === 'equal' ? t('split.equalSplit') : t('split.customSplit')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: allPaid ? colors.success + '15' : colors.warning + '15' }]}>
          <Ionicons name={allPaid ? 'checkmark-circle' : 'time'} size={14} color={allPaid ? colors.success : colors.warning} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: allPaid ? colors.success : colors.warning, marginLeft: 4 }}>
            {allPaid ? t('split.settled') : t('split.pending')}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {participants.map(p => (
        <View key={p.id} style={styles.participantRow}>
          <View style={styles.participantLeft}>
            <Ionicons
              name={p.type === 'me' ? 'person' : p.type === 'external' ? 'person-outline' : 'people'}
              size={14}
              color={colors.textMuted}
            />
            <Text style={{ fontSize: 12, color: colors.textPrimary, marginLeft: 6 }}>
              {p.name}
            </Text>
          </View>
          <View style={styles.participantRight}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary }}>
              {formatCurrency(p.share)}
            </Text>
            <Ionicons
              name={p.paid ? 'checkmark-circle' : 'time'}
              size={14}
              color={p.paid ? colors.success : colors.danger}
              style={{ marginLeft: 6 }}
            />
          </View>
        </View>
      ))}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>
          {t('split.received')}: <Text style={{ color: colors.success, fontWeight: '700' }}>{formatCurrency(totalPaid)}</Text>
        </Text>
        {totalPending > 0.01 && (
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            {t('split.toReceive')}: <Text style={{ color: colors.danger, fontWeight: '700' }}>{formatCurrency(totalPending)}</Text>
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  splitIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Compact
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
});

export default SplitExpenseItem;