import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { FadeInView, SlideInView, ScaleInView, StaggeredList } from '../components/AnimatedComponents';
import BankSelectorModal from '../components/BankSelectorModal';
import { getBankById } from '../utils/BanksData';

export default function CardsScreen() {
  const { cards, addCard, updateCard, deleteCard, getCardUsage } = useExpenses();
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [bankSelectorVisible, setBankSelectorVisible] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [cardLimit, setCardLimit] = useState('');
  const [customName, setCustomName] = useState('');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const openAddModal = () => {
    setEditingCard(null);
    setSelectedBank(null);
    setCardLimit('');
    setCustomName('');
    setModalVisible(true);
  };

  const openEditModal = (card) => {
    setEditingCard(card);
    const bank = getBankById(card.bankId);
    setSelectedBank(bank);
    setCardLimit(card.limit.toString());
    setCustomName(card.customName || '');
    setModalVisible(true);
  };

  const handleSelectBank = (bank) => {
    setSelectedBank(bank);
    setBankSelectorVisible(false);
  };

  const handleSave = () => {
    if (!selectedBank) {
      Alert.alert('Erro', 'Selecione um banco');
      return;
    }
    if (!cardLimit) {
      Alert.alert('Erro', 'Preencha o limite');
      return;
    }
    const limit = parseFloat(cardLimit.replace(',', '.'));
    if (isNaN(limit) || limit <= 0) {
      Alert.alert('Erro', 'Digite um limite válido');
      return;
    }

    const cardData = {
      bankId: selectedBank.id,
      name: selectedBank.name,
      customName: customName.trim() || selectedBank.name,
      limit,
      color: selectedBank.color,
      icon: selectedBank.icon,
    };

    if (editingCard) {
      updateCard(editingCard.id, cardData);
    } else {
      addCard(cardData);
    }
    setModalVisible(false);
  };

  const handleDelete = (card) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir o cartão "${card.customName || card.name}"?

Os gastos associados não serão excluídos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteCard(card.id) },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Meus Cartões</Text>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={openAddModal}>
            <Ionicons name="add-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <StaggeredList staggerDelay={100}>
          {cards.map(card => {
            const usage = getCardUsage(card.id);
            const pct = card.limit > 0 ? (usage / card.limit) * 100 : 0;
            const remaining = card.limit - usage;
            return (
              <View key={card.id} style={[styles.cardItem, { backgroundColor: colors.card, borderLeftColor: card.color }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <View style={[styles.cardIcon, { backgroundColor: card.color + '20' }]}>
                      <Ionicons name={card.icon || 'card'} size={22} color={card.color} />
                    </View>
                    <View>
                      <Text style={[styles.cardName, { color: colors.text }]}>{card.customName || card.name}</Text>
                      <Text style={[styles.cardLimit, { color: colors.textSecondary }]}>
                        Limite: {formatCurrency(card.limit)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => openEditModal(card)}>
                      <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(card)}>
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.usageSection}>
                  <View style={styles.usageRow}>
                    <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Usado</Text>
                    <Text style={[styles.usageValue, { color: colors.text }]}>{formatCurrency(usage)}</Text>
                  </View>
                  <View style={styles.usageRow}>
                    <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Disponível</Text>
                    <Text style={[styles.usageValue, { color: remaining < 0 ? colors.danger : colors.primary }]}>
                      {formatCurrency(remaining)}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={[styles.progressBar, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]}>
                    <View style={[styles.progressFill, {
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: pct >= 100 ? colors.danger : pct >= 80 ? colors.warning : colors.primary,
                    }]} />
                  </View>
                  <Text style={[styles.progressText, {
                    color: pct >= 100 ? colors.danger : pct >= 80 ? colors.warning : colors.primary,
                  }]}>
                    {pct.toFixed(1)}% utilizado
                  </Text>
                </View>

                {pct >= 100 && (
                  <View style={[styles.alertBadge, { backgroundColor: colors.danger + '20' }]}>
                    <Ionicons name="warning" size={14} color={colors.danger} />
                    <Text style={[styles.alertText, { color: colors.danger }]}>Limite excedido!</Text>
                  </View>
                )}
                {pct >= 80 && pct < 100 && (
                  <View style={[styles.alertBadge, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
                    <Text style={[styles.alertText, { color: colors.warning }]}>Quase no limite</Text>
                  </View>
                )}
              </View>
            );
          })}
        </StaggeredList>

        {cards.length === 0 && (
          <FadeInView>
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum cartão cadastrado</Text>
              <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={openAddModal}>
                <Text style={styles.emptyButtonText}>Adicionar primeiro cartão</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScaleInView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
              </Text>

              {/* Bank Selector */}
              <TouchableOpacity
                style={[styles.bankSelector, { backgroundColor: colors.inputBg }]}
                onPress={() => setBankSelectorVisible(true)}
              >
                {selectedBank ? (
                  <View style={styles.selectedBankRow}>
                    <View style={[styles.selectedBankIcon, { backgroundColor: selectedBank.color + '20' }]}>
                      <Ionicons name={selectedBank.icon} size={24} color={selectedBank.color} />
                    </View>
                    <View>
                      <Text style={[styles.selectedBankName, { color: colors.text }]}>{selectedBank.name}</Text>
                      <Text style={[styles.selectedBankType, { color: colors.textSecondary }]}>
                        Toque para trocar
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.selectBankPlaceholder}>
                    <Ionicons name="card-outline" size={24} color={colors.textLight} />
                    <Text style={[styles.selectBankText, { color: colors.textLight }]}>Selecionar banco...</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward-outline" size={20} color={colors.textLight} />
              </TouchableOpacity>

              {/* Custom Name */}
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Apelido (opcional)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="Ex: Meu Nubank"
                value={customName}
                onChangeText={setCustomName}
                placeholderTextColor={colors.textLight}
              />

              {/* Limit */}
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Limite do cartão</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="R$ 5.000,00"
                keyboardType="decimal-pad"
                value={cardLimit}
                onChangeText={setCardLimit}
                placeholderTextColor={colors.textLight}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
                  <Text style={styles.modalButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScaleInView>
        </View>
      </Modal>

      {/* Bank Selector Modal */}
      <BankSelectorModal
        visible={bankSelectorVisible}
        onSelect={handleSelectBank}
        onClose={() => setBankSelectorVisible(false)}
        selectedBankId={selectedBank?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 50,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  addButton: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  cardItem: {
    marginHorizontal: 16, marginBottom: 12, padding: 16,
    borderRadius: 18, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  cardName: { fontSize: 16, fontWeight: 'bold' },
  cardLimit: { fontSize: 12, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 12 },
  usageSection: { marginBottom: 10 },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  usageLabel: { fontSize: 13 },
  usageValue: { fontSize: 13, fontWeight: '600' },
  progressSection: { marginTop: 4 },
  progressBar: {
    height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: '600', textAlign: 'right' },
  alertBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, marginTop: 10, alignSelf: 'flex-start',
  },
  alertText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, marginTop: 12 },
  emptyButton: {
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  emptyButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalContent: {
    width: '100%', maxWidth: 340, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  bankSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 14, marginBottom: 16,
  },
  selectedBankRow: { flexDirection: 'row', alignItems: 'center' },
  selectedBankIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  selectedBankName: { fontSize: 15, fontWeight: '600' },
  selectedBankType: { fontSize: 12, marginTop: 2 },
  selectBankPlaceholder: { flexDirection: 'row', alignItems: 'center' },
  selectBankText: { marginLeft: 10, fontSize: 15 },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalInput: {
    borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalButton: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
  },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
