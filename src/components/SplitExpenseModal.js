// SplitExpenseModal.js — Modal de Divisão de Despesas
// Suporta: divisão igualitária, personalizada, membros do círculo e contatos externos

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Alert
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { useCircle } from '../context/CircleContext';
import { formatCurrency } from '../utils/helpers';
import ModalContent from '../components/ModalKeyboardSafe';

const SplitExpenseModal = ({ visible, onClose, transaction, onSplit }) => {
  const { colors } = useTheme();
  const { t } = useTranslate();
  const { currentCircle, myCircles } = useCircle();

  const [splitType, setSplitType] = useState('equal'); // 'equal' | 'custom'
  const [participants, setParticipants] = useState([]);
  const [externalName, setExternalName] = useState('');
  const [showAddExternal, setShowAddExternal] = useState(false);

  // Membros disponíveis: círculo atual + opção de adicionar externos
  const circleMembers = useMemo(() => {
    if (!currentCircle) return [];
    return (currentCircle.members || []).map(m => ({
      id: m.id || m.user_id,
      name: m.name || m.username || m.display_name || 'Membro',
      avatar: m.avatar,
      type: 'circle',
    }));
  }, [currentCircle]);

  // Inicializar participantes quando o modal abre
  useMemo(() => {
    if (visible && transaction) {
      // Se já tem split existente, carregar
      if (transaction.split) {
        setSplitType(transaction.split.type || 'equal');
        setParticipants(transaction.split.participants || []);
      } else {
        // Padrão: você + membros do círculo
        const defaultParticipants = [
          { id: 'me', name: t('split.you'), type: 'me', share: 0, paid: true },
          ...circleMembers.map(m => ({
            ...m,
            share: 0,
            paid: false,
          })),
        ];
        setParticipants(defaultParticipants);
        setSplitType('equal');
      }
    }
  }, [visible, transaction, circleMembers, t]);

  const totalAmount = transaction?.amount || 0;

  // Calcular shares
  const calculatedParticipants = useMemo(() => {
    if (splitType === 'equal') {
      const activeCount = participants.filter(p => p.selected !== false).length || 1;
      const share = totalAmount / activeCount;
      return participants.map(p => ({
        ...p,
        share: p.selected !== false ? share : 0,
      }));
    }
    // custom: usar o valor definido pelo usuário
    return participants;
  }, [participants, splitType, totalAmount]);

  const totalShared = calculatedParticipants.reduce((s, p) => s + (p.share || 0), 0);
  const remaining = totalAmount - totalShared;

  const toggleParticipant = (id) => {
    setParticipants(prev => prev.map(p =>
      p.id === id ? { ...p, selected: p.selected === false ? true : false } : p
    ));
  };

  const updateShare = (id, value) => {
    const num = parseFloat(value.replace(',', '.')) || 0;
    setParticipants(prev => prev.map(p =>
      p.id === id ? { ...p, share: num } : p
    ));
  };

  const togglePaid = (id) => {
    setParticipants(prev => prev.map(p =>
      p.id === id ? { ...p, paid: !p.paid } : p
    ));
  };

  const addExternalParticipant = () => {
    if (!externalName.trim()) return;
    const newParticipant = {
      id: `ext_${Date.now()}`,
      name: externalName.trim(),
      type: 'external',
      share: 0,
      paid: false,
      selected: true,
    };
    setParticipants(prev => [...prev, newParticipant]);
    setExternalName('');
    setShowAddExternal(false);
  };

  const removeParticipant = (id) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = () => {
    const activeParticipants = calculatedParticipants.filter(p => p.selected !== false && p.share > 0);
    if (activeParticipants.length < 2) {
      Alert.alert(t('split.minParticipants'), t('split.minParticipantsDesc'));
      return;
    }

    const splitData = {
      type: splitType,
      participants: activeParticipants.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        share: p.share,
        paid: p.paid,
      })),
      totalAmount,
      createdAt: new Date().toISOString(),
    };

    onSplit(splitData);
    onClose();
  };

  const getParticipantIcon = (type) => {
    if (type === 'me') return 'person';
    if (type === 'external') return 'person-outline';
    return 'people';
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <ModalContent scroll={true}>
        <View style={[styles.container, { backgroundColor: colors.bgCard }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                <Ionicons name="people" size={20} color={colors.primary} />  {t('split.title')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {transaction?.desc} — {formatCurrency(totalAmount)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Tipo de divisão */}
            <View style={styles.splitTypeRow}>
              <TouchableOpacity
                style={[styles.splitTypeBtn, {
                  backgroundColor: splitType === 'equal' ? colors.primary + '15' : colors.bgTertiary,
                  borderColor: splitType === 'equal' ? colors.primary : 'transparent',
                }]}
                onPress={() => setSplitType('equal')}
              >
                <Ionicons name="git-merge" size={18} color={splitType === 'equal' ? colors.primary : colors.textMuted} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: splitType === 'equal' ? colors.primary : colors.textPrimary, marginTop: 4 }}>
                  {t('split.equal')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.splitTypeBtn, {
                  backgroundColor: splitType === 'custom' ? colors.primary + '15' : colors.bgTertiary,
                  borderColor: splitType === 'custom' ? colors.primary : 'transparent',
                }]}
                onPress={() => setSplitType('custom')}
              >
                <Ionicons name="options" size={18} color={splitType === 'custom' ? colors.primary : colors.textMuted} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: splitType === 'custom' ? colors.primary : colors.textPrimary, marginTop: 4 }}>
                  {t('split.custom')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Resumo */}
            <View style={[styles.summaryBox, { backgroundColor: colors.bgTertiary }]}>
              <View style={styles.summaryRow}>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>{t('split.total')}</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{formatCurrency(totalAmount)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>{t('split.shared')}</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>{formatCurrency(totalShared)}</Text>
              </View>
              {Math.abs(remaining) > 0.01 && (
                <View style={styles.summaryRow}>
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>{t('split.remaining')}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: remaining > 0 ? colors.danger : colors.success }}>
                    {formatCurrency(Math.abs(remaining))}
                  </Text>
                </View>
              )}
            </View>

            {/* Lista de participantes */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('split.participants')}</Text>

            {calculatedParticipants.map((p, index) => (
              <View key={p.id} style={[styles.participantRow, { backgroundColor: colors.bgTertiary }]}>
                <TouchableOpacity
                  style={styles.participantLeft}
                  onPress={() => p.type !== 'me' && toggleParticipant(p.id)}
                  disabled={p.type === 'me'}
                >
                  <View style={[styles.participantIcon, { backgroundColor: p.type === 'me' ? colors.primary + '20' : colors.bgCard }]}>
                    <Ionicons name={getParticipantIcon(p.type)} size={18} color={p.type === 'me' ? colors.primary : colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
                      {p.name}
                      {p.type === 'me' && <Text style={{ color: colors.primary }}> ({t('split.you')})</Text>}
                    </Text>
                    {splitType === 'equal' && p.selected !== false && (
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>
                        {formatCurrency(p.share)}
                      </Text>
                    )}
                  </View>
                  {p.type !== 'me' && (
                    <Ionicons
                      name={p.selected !== false ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={p.selected !== false ? colors.primary : colors.textMuted}
                    />
                  )}
                </TouchableOpacity>

                {/* Valor personalizado */}
                {splitType === 'custom' && p.selected !== false && (
                  <View style={styles.customRow}>
                    <TextInput
                      style={[styles.shareInput, { backgroundColor: colors.bgCard, color: colors.textPrimary }]}
                      placeholder="0,00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      value={p.share > 0 ? p.share.toString().replace('.', ',') : ''}
                      onChangeText={(v) => updateShare(p.id, v)}
                    />
                    <TouchableOpacity
                      style={[styles.paidBtn, { backgroundColor: p.paid ? colors.success + '20' : colors.danger + '20' }]}
                      onPress={() => togglePaid(p.id)}
                    >
                      <Ionicons name={p.paid ? 'checkmark-circle' : 'time'} size={16} color={p.paid ? colors.success : colors.danger} />
                      <Text style={{ fontSize: 11, fontWeight: '600', color: p.paid ? colors.success : colors.danger, marginLeft: 4 }}>
                        {p.paid ? t('split.paid') : t('split.pending')}
                      </Text>
                    </TouchableOpacity>
                    {p.type === 'external' && (
                      <TouchableOpacity onPress={() => removeParticipant(p.id)} style={styles.removeBtn}>
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Status de pagamento no modo igualitário */}
                {splitType === 'equal' && p.selected !== false && p.type !== 'me' && (
                  <TouchableOpacity
                    style={[styles.paidBtnInline, { backgroundColor: p.paid ? colors.success + '15' : colors.warning + '15' }]}
                    onPress={() => togglePaid(p.id)}
                  >
                    <Ionicons name={p.paid ? 'checkmark-circle' : 'time'} size={14} color={p.paid ? colors.success : colors.warning} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: p.paid ? colors.success : colors.warning, marginLeft: 4 }}>
                      {p.paid ? t('split.paid') : t('split.pending')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Adicionar participante externo */}
            {!showAddExternal ? (
              <TouchableOpacity
                style={[styles.addExternalBtn, { borderColor: colors.border }]}
                onPress={() => setShowAddExternal(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary, marginLeft: 8 }}>
                  {t('split.addExternal')}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.addExternalBox, { backgroundColor: colors.bgTertiary }]}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                  {t('split.externalName')}
                </Text>
                <TextInput
                  style={[styles.externalInput, { backgroundColor: colors.bgCard, color: colors.textPrimary }]}
                  placeholder={t('split.externalPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={externalName}
                  onChangeText={setExternalName}
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <TouchableOpacity
                    style={[styles.externalActionBtn, { backgroundColor: colors.primary }]}
                    onPress={addExternalParticipant}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '700' }}>{t('common.add')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.externalActionBtn, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }]}
                    onPress={() => { setShowAddExternal(false); setExternalName(''); }}
                  >
                    <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Botão Salvar */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Ionicons name="save" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>{t('split.save')}</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </ModalContent>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  closeBtn: { padding: 4 },

  splitTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  splitTypeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
  },

  summaryBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  participantRow: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  participantIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingLeft: 52,
  },
  shareInput: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  paidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  paidBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 52,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  removeBtn: {
    padding: 8,
  },

  addExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 8,
    marginBottom: 10,
  },
  addExternalBox: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  externalInput: {
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
  },
  externalActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SplitExpenseModal;