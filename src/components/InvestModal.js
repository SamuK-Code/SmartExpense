import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ModalContent from '../components/ModalKeyboardSafe';

const InvestModal = ({ visible, onClose, goal, type, balance, onConfirm, colors }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const isDeposit = type === 'deposit';
  const title = isDeposit ? 'Investir na Meta' : 'Retirar da Meta';
  const subtitle = isDeposit
    ? `Saldo disponível: ${formatCurrency(balance || 0)}`
    : `Disponível na meta: ${formatCurrency((goal?.currentAmount || goal?.current || 0))}`;
  const buttonColor = isDeposit ? (colors?.primary || '#6366F1') : '#F59E0B';
  const icon = isDeposit ? 'add-circle' : 'remove-circle';

  const handleConfirm = () => {
    const value = parseFloat(amount);

    if (!amount || isNaN(value) || value <= 0) {
      setError('Digite um valor válido');
      return;
    }

    if (isDeposit && value > (balance || 0)) {
      setError('Saldo insuficiente no caixa');
      return;
    }

    if (!isDeposit && value > (goal?.currentAmount || goal?.current || 0)) {
      setError('Valor maior que o disponível na meta');
      return;
    }

    if (onConfirm && goal) {
      onConfirm(goal.id, value, type);
    }
    setAmount('');
    setError('');
    onClose && onClose();
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    onClose && onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <ModalContent>
        <View style={styles.overlay}>
          <View style={[styles.content, { backgroundColor: colors?.background || '#FFF' }]}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: colors?.text || '#000' }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: colors?.muted || '#666' }]}>{goal?.name || 'Meta'}</Text>
              </View>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors?.text || '#000'} />
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={[styles.infoBox, { backgroundColor: (colors?.primary || '#6366F1') + '10' }]}>
              <Text style={[styles.infoText, { color: colors?.text || '#000' }]}>{subtitle}</Text>
            </View>

            {/* Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors?.text || '#000' }]}>Valor (R$)</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors?.background || '#F1F5F9',
                  color: colors?.text || '#000',
                  borderColor: error ? '#EF4444' : 'transparent',
                }]}
                value={amount}
                onChangeText={(text) => { setAmount(text); setError(''); }}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor={colors?.muted || '#94A3B8'}
                autoFocus
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>

            {/* Quick amounts */}
            <View style={styles.quickAmounts}>
              {[10, 50, 100, 500].map((quick) => (
                <TouchableOpacity
                  key={quick}
                  style={[styles.quickBtn, { backgroundColor: (colors?.primary || '#6366F1') + '15' }]}
                  onPress={() => { setAmount(quick.toString()); setError(''); }}
                >
                  <Text style={{ color: colors?.primary || '#6366F1', fontWeight: '600' }}>
                    R$ {quick}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Confirm */}
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: buttonColor }]}
              onPress={handleConfirm}
            >
              <Ionicons name={icon} size={18} color="#FFF" />
              <Text style={styles.confirmText}>
                {isDeposit ? 'Depositar' : 'Retirar'} {formatCurrency(parseFloat(amount) || 0)}
              </Text>
            </TouchableOpacity>

            {/* Warning */}
            <Text style={[styles.warning, { color: colors?.muted || '#94A3B8' }]}>
              {isDeposit
                ? ' Este valor será descontado do seu saldo em caixa.'
                : ' Este valor será adicionado ao seu saldo em caixa.'}
            </Text>
          </View>
        </View>
      </ModalContent>
    </Modal>
  );
};

const formatCurrency = (value) => {
  return 'R$ ' + (value || 0).toFixed(2).replace('.', ',');
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4 },
  infoBox: { padding: 12, borderRadius: 12, marginBottom: 20 },
  infoText: { fontSize: 13, textAlign: 'center' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 14, borderRadius: 12, fontSize: 18, fontWeight: '600', textAlign: 'center', borderWidth: 2 },
  error: { fontSize: 12, marginTop: 6, textAlign: 'center', color: '#EF4444' },
  quickAmounts: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  quickBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14 },
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  warning: { fontSize: 11, textAlign: 'center', marginTop: 14, lineHeight: 16 },
});

export default InvestModal;