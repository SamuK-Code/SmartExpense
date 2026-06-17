import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Dimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, getCardGradientColors, isCardTemplate, getCardTemplateImage, isCardSolid } from '../utils/helpers';
import CreditCard from '../components/CreditCard';
import TransactionItem from '../components/TransactionItem';
import Toast from '../components/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CardsScreen = () => {
  const { cards, transactions, cardGradients, addCard, deleteCard, editCard, getCardUsage } = useApp();
  const { colors } = useTheme();

  // Modal de adicionar cartão
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [limit, setLimit] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(cardGradients[0]?.class || 'card-gradient-purple');

  // Modal de detalhes do cartão
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // Modal de editar cartão
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [editCloseDate, setEditCloseDate] = useState('');
  const [editGradient, setEditGradient] = useState('');

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  // Filtrar transações do cartão selecionado
  const cardTransactions = useMemo(() => {
    if (!selectedCard) return [];
    return transactions
      .filter(t => t.cardId === selectedCard.id && t.type === 'expense')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedCard, transactions]);

  // Calcular uso e progresso
  const getCardProgress = (card) => {
    const used = getCardUsage(card.id);
    const available = card.limit - used;
    const percentage = (used / card.limit) * 100;
    const availablePercentage = (available / card.limit) * 100;
    return { used, available, percentage, availablePercentage };
  };

  // Cor da barra de progresso baseada no limite disponível
  const getProgressColor = (availablePercentage) => {
    if (availablePercentage <= 10) return '#EF4444'; // Vermelho - crítico
    if (availablePercentage <= 25) return '#F59E0B'; // Laranja - alerta
    return '#10B981'; // Verde - ok
  };

  const handleAddCard = () => {
    if (!name || !limit) {
      showToast('Preencha os campos obrigatórios', 'error');
      return;
    }

    const selectedGradientObj = cardGradients.find(g => g.class === selectedGradient) || cardGradients[0];
    const card = {
      name,
      number: number ? `**** ${number.padStart(4, '0')}` : '**** 0000',
      limit: parseFloat(limit),
      closeDate,
      dueDate: closeDate,
      gradientClass: selectedGradient,
      color: selectedGradientObj.color,
    };

    addCard(card);
    setModalVisible(false);
    resetForm();
    showToast('Cartão adicionado!');
  };

  const resetForm = () => {
    setName('');
    setNumber('');
    setLimit('');
    setCloseDate('');
    setSelectedGradient(cardGradients[0]?.class || 'card-gradient-purple');
  };

  const handleDeleteCard = (id) => {
    Alert.alert(
      'Confirmar exclusão',
      'Deseja excluir este cartão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            deleteCard(id);
            setDetailModalVisible(false);
            showToast('Cartão excluído', 'warning');
          }
        },
      ]
    );
  };

  // Abrir modal de detalhes
  const openCardDetail = (card) => {
    setSelectedCard(card);
    setDetailModalVisible(true);
  };

  // Abrir modal de edição
  const openEditModal = () => {
    if (!selectedCard) return;
    setEditName(selectedCard.name);
    setEditLimit(selectedCard.limit.toString());
    setEditCloseDate(selectedCard.closeDate || '');
    setEditGradient(selectedCard.gradientClass);
    setEditModalVisible(true);
  };

  const handleEditCard = () => {
    if (!editName || !editLimit) {
      showToast('Preencha os campos obrigatórios', 'error');
      return;
    }

    const selectedGradientObj = cardGradients.find(g => g.class === editGradient) || cardGradients[0];

    editCard(selectedCard.id, {
      name: editName,
      limit: parseFloat(editLimit),
      closeDate: editCloseDate,
      dueDate: editCloseDate,
      gradientClass: editGradient,
      color: selectedGradientObj.color,
    });

    // Atualizar o selectedCard para refletir as mudanças no modal de detalhes
    setSelectedCard(prev => ({
      ...prev,
      name: editName,
      limit: parseFloat(editLimit),
      closeDate: editCloseDate,
      dueDate: editCloseDate,
      gradientClass: editGradient,
      color: selectedGradientObj.color,
    }));

    setEditModalVisible(false);
    showToast('Cartão atualizado!');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          <Ionicons name="card" size={20} color={colors.primary} />  Meus Cartões
        </Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Cards List - Vertical */}
        <View style={styles.cardsList}>
          {cards.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.bgCard }]}>
              <Ionicons name="card" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhum cartão cadastrado</Text>
            </View>
          ) : (
            cards.map(card => (
              <TouchableOpacity 
                key={card.id} 
                onPress={() => openCardDetail(card)}
                onLongPress={() => handleDeleteCard(card.id)}
                style={styles.cardItem}
                activeOpacity={0.85}
              >
                <CreditCard card={card} used={getCardUsage(card.id)} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* FAB Add Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ========== MODAL DE DETALHES DO CARTÃO ========== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModalContent, { backgroundColor: colors.bgCard }]}>
            {/* Header */}
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>Detalhes</Text>
              <TouchableOpacity onPress={openEditModal}>
                <Ionicons name="create" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedCard && (
                <>
                  {/* Cartão Visual */}
                  <View style={styles.detailCardWrapper}>
                    <CreditCard card={selectedCard} used={getCardUsage(selectedCard.id)} />
                  </View>

                  {/* Barra de Progresso */}
                  {(() => {
                    const { used, available, percentage, availablePercentage } = getCardProgress(selectedCard);
                    const progressColor = getProgressColor(availablePercentage);

                    return (
                      <View style={[styles.progressSection, { backgroundColor: colors.bgTertiary }]}>
                        <View style={styles.progressHeader}>
                          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Limite Utilizado</Text>
                          <Text style={[styles.progressPercent, { color: progressColor }]}>
                            {percentage.toFixed(1)}%
                          </Text>
                        </View>

                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: `${Math.min(percentage, 100)}%`,
                                backgroundColor: progressColor 
                              }
                            ]} 
                          />
                        </View>

                        <View style={styles.progressValues}>
                          <View>
                            <Text style={[styles.progressValueLabel, { color: colors.textMuted }]}>Utilizado</Text>
                            <Text style={[styles.progressValue, { color: colors.danger }]}>{formatCurrency(used)}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.progressValueLabel, { color: colors.textMuted }]}>Disponível</Text>
                            <Text style={[styles.progressValue, { color: availablePercentage <= 10 ? colors.danger : colors.success }]}>
                              {formatCurrency(available)}
                            </Text>
                          </View>
                        </View>

                        {availablePercentage <= 10 && (
                          <View style={styles.alertBox}>
                            <Ionicons name="warning" size={16} color="#EF4444" />
                            <Text style={styles.alertText}>
                              Limite quase esgotado! Restam apenas {availablePercentage.toFixed(1)}%
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })()}

                  {/* Info do Cartão */}
                  <View style={[styles.infoSection, { backgroundColor: colors.bgTertiary }]}>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar" size={16} color={colors.textMuted} />
                      <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Fechamento: dia {selectedCard.closeDate || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="cash" size={16} color={colors.textMuted} />
                      <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Limite Total: {formatCurrency(selectedCard.limit)}
                      </Text>
                    </View>
                  </View>

                  {/* Histórico de Gastos */}
                  <View style={styles.historySection}>
                    <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
                      <Ionicons name="receipt" size={16} color={colors.primary} />  Histórico de Gastos
                    </Text>

                    {cardTransactions.length === 0 ? (
                      <View style={[styles.emptyHistory, { backgroundColor: colors.bgTertiary }]}>
                        <Ionicons name="receipt" size={32} color={colors.textMuted} />
                        <Text style={[styles.emptyHistoryText, { color: colors.textMuted }]}>
                          Nenhuma transação neste cartão
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.transactionsList}>
                        {cardTransactions.map(t => (
                          <View key={t.id} style={[styles.transactionRow, { backgroundColor: colors.bgTertiary }]}>
                            <View style={styles.transactionLeft}>
                              <View style={[styles.transactionIcon, { backgroundColor: (t.categoryColor || '#94A3B8') + '15' }]}>
                                <Ionicons name={t.categoryIcon || 'receipt'} size={16} color={t.categoryColor || '#94A3B8'} />
                              </View>
                              <View>
                                <Text style={[styles.transactionDesc, { color: colors.textPrimary }]} numberOfLines={1}>
                                  {t.desc}
                                </Text>
                                <Text style={[styles.transactionDate, { color: colors.textMuted }]}>
                                  {t.date ? t.date.split('-').reverse().join('/') : ''}
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.transactionAmount, { color: colors.danger }]}>
                              - {formatCurrency(t.amount)}
                            </Text>
                          </View>
                        ))}

                        {/* Total */}
                        <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Gasto</Text>
                          <Text style={[styles.totalValue, { color: colors.danger }]}>
                            {formatCurrency(cardTransactions.reduce((s, t) => s + t.amount, 0))}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Botões de Ação */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.editBtn, { backgroundColor: colors.primary }]}
                      onPress={openEditModal}
                    >
                      <Ionicons name="create" size={18} color="#FFFFFF" />
                      <Text style={styles.editBtnText}>Editar Cartão</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.deleteBtn, { backgroundColor: colors.danger + '15' }]}
                      onPress={() => handleDeleteCard(selectedCard.id)}
                    >
                      <Ionicons name="trash" size={18} color={colors.danger} />
                      <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========== MODAL DE EDITAR CARTÃO ========== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="create" size={20} color={colors.primary} />  Editar Cartão
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nome do Cartão</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="Ex: Nubank, Inter..."
                  placeholderTextColor={colors.textMuted}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Limite (R$)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    placeholder="0,00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={editLimit}
                    onChangeText={setEditLimit}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Dia de Fechamento</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    placeholder="DD"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={editCloseDate}
                    onChangeText={(text) => {
                      const numeric = text.replace(/[^0-9]/g, '');
                      const day = parseInt(numeric, 10);
                      if (numeric === '') {
                        setEditCloseDate('');
                      } else if (day >= 1 && day <= 31) {
                        setEditCloseDate(numeric);
                      } else if (numeric.length <= 2) {
                        setEditCloseDate(numeric);
                      }
                    }}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Cor do Cartão</Text>
                <View style={styles.colorPicker}>
                  {cardGradients.map((gradObj) => {
                    const isSelected = editGradient === gradObj.class;
                    const isTemplate = gradObj.type === 'template';
                    const isSolid = gradObj.type === 'solid';
                    const gradientColors = getCardGradientColors(gradObj.class);
                    const templateImage = isTemplate ? getCardTemplateImage(gradObj.class) : null;

                    return (
                      <TouchableOpacity
                        key={gradObj.class}
                        onPress={() => setEditGradient(gradObj.class)}
                        style={[
                          styles.colorOption,
                          isSelected && styles.colorSelected,
                          isTemplate && styles.templateOption
                        ]}
                        activeOpacity={0.8}
                      >
                        {isTemplate && templateImage ? (
                          <ImageBackground
                            source={templateImage}
                            style={styles.gradientPreview}
                            imageStyle={{ borderRadius: 20 }}
                          >
                            <View style={styles.templateOverlay}>
                              <Text style={styles.templateLabel}>IMG</Text>
                            </View>
                          </ImageBackground>
                        ) : isSolid ? (
                          <View style={[styles.gradientPreview, { backgroundColor: gradObj.color, borderRadius: 20 }]}>
                            <Text style={styles.solidLabel}>S</Text>
                          </View>
                        ) : (
                          <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientPreview}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleEditCard}
              >
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Salvar Alterações</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========== MODAL DE ADICIONAR CARTÃO (original) ========== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="card" size={20} color={colors.primary} />  Novo Cartão
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nome do Cartão</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="Ex: Nubank, Inter..."
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Número (últimos 4 dígitos)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="0000"
                  placeholderTextColor={colors.textMuted}
                  maxLength={4}
                  keyboardType="number-pad"
                  value={number}
                  onChangeText={setNumber}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Limite (R$)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    placeholder="0,00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={limit}
                    onChangeText={setLimit}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Dia de Fechamento</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                    placeholder="DD"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={closeDate}
                    onChangeText={(text) => {
                      const numeric = text.replace(/[^0-9]/g, '');
                      const day = parseInt(numeric, 10);
                      if (numeric === '') {
                        setCloseDate('');
                      } else if (day >= 1 && day <= 31) {
                        setCloseDate(numeric);
                      } else if (numeric.length <= 2) {
                        setCloseDate(numeric);
                      }
                    }}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Cor do Cartão</Text>
                <View style={styles.colorPicker}>
                  {cardGradients.map((gradObj) => {
                    const isSelected = selectedGradient === gradObj.class;
                    const isTemplate = gradObj.type === 'template';
                    const isSolid = gradObj.type === 'solid';
                    const gradientColors = getCardGradientColors(gradObj.class);
                    const templateImage = isTemplate ? getCardTemplateImage(gradObj.class) : null;

                    return (
                      <TouchableOpacity
                        key={gradObj.class}
                        onPress={() => setSelectedGradient(gradObj.class)}
                        style={[
                          styles.colorOption,
                          isSelected && styles.colorSelected,
                          isTemplate && styles.templateOption
                        ]}
                        activeOpacity={0.8}
                      >
                        {isTemplate && templateImage ? (
                          <ImageBackground
                            source={templateImage}
                            style={styles.gradientPreview}
                            imageStyle={{ borderRadius: 20 }}
                          >
                            <View style={styles.templateOverlay}>
                              <Text style={styles.templateLabel}>IMG</Text>
                            </View>
                          </ImageBackground>
                        ) : isSolid ? (
                          <View style={[styles.gradientPreview, { backgroundColor: gradObj.color, borderRadius: 20 }]}>
                            <Text style={styles.solidLabel}>S</Text>
                          </View>
                        ) : (
                          <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientPreview}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddCard}
              >
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Salvar Cartão</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { flex: 1, paddingTop: 16 },
  cardsList: { paddingHorizontal: 16, marginBottom: 20 },
  cardItem: { marginBottom: 12 },
  emptyCard: { width: 300, height: 180, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  emptyText: { fontSize: 14, marginTop: 8 },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 6, zIndex: 999 },

  // Modal Overlay
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },

  // Modal de Detalhes
  detailModalContent: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: '92%',
    flex: 1,
    marginTop: 40,
  },
  detailHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    paddingTop: 20,
  },
  detailTitle: { fontSize: 18, fontWeight: '700' },
  detailCardWrapper: { 
    paddingHorizontal: 16, 
    marginTop: 8,
    marginBottom: 20,
  },

  // Progresso
  progressSection: { 
    marginHorizontal: 16, 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 16 
  },
  progressHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  progressLabel: { fontSize: 14, fontWeight: '600' },
  progressPercent: { fontSize: 18, fontWeight: '700' },
  progressBar: { 
    height: 10, 
    borderRadius: 5, 
    overflow: 'hidden', 
    marginBottom: 12 
  },
  progressFill: { 
    height: '100%', 
    borderRadius: 5 
  },
  progressValues: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  progressValueLabel: { fontSize: 11, marginBottom: 2 },
  progressValue: { fontSize: 16, fontWeight: '700' },
  alertBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 12, 
    padding: 10, 
    backgroundColor: 'rgba(239,68,68,0.1)', 
    borderRadius: 8 
  },
  alertText: { 
    fontSize: 12, 
    color: '#EF4444', 
    fontWeight: '600' 
  },

  // Info Section
  infoSection: { 
    marginHorizontal: 16, 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 16,
    gap: 10,
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  infoText: { fontSize: 14 },

  // Histórico
  historySection: { 
    marginHorizontal: 16, 
    marginBottom: 16 
  },
  historyTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 12 
  },
  emptyHistory: { 
    padding: 32, 
    borderRadius: 16, 
    alignItems: 'center' 
  },
  emptyHistoryText: { 
    fontSize: 14, 
    marginTop: 8 
  },
  transactionsList: { gap: 8 },
  transactionRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 12, 
    borderRadius: 12 
  },
  transactionLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    flex: 1 
  },
  transactionIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  transactionDesc: { 
    fontSize: 14, 
    fontWeight: '600', 
    maxWidth: 180 
  },
  transactionDate: { 
    fontSize: 11, 
    marginTop: 2 
  },
  transactionAmount: { 
    fontSize: 14, 
    fontWeight: '700' 
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 12, 
    marginTop: 8, 
    borderTopWidth: 1 
  },
  totalLabel: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  totalValue: { 
    fontSize: 16, 
    fontWeight: '700' 
  },

  // Botões de Ação
  actionButtons: { 
    marginHorizontal: 16, 
    gap: 10, 
    marginBottom: 20 
  },
  editBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    padding: 16, 
    borderRadius: 12 
  },
  editBtnText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  deleteBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    padding: 14, 
    borderRadius: 12 
  },
  deleteBtnText: { 
    fontSize: 15, 
    fontWeight: '600' 
  },

  // Modal de Adicionar/Editar
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalBody: { padding: 20 },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 12, borderRadius: 12, fontSize: 15, borderWidth: 2, borderColor: 'transparent' },
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  colorOption: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  colorSelected: { borderColor: '#1E293B', transform: [{ scale: 1.1 }] },
  templateOption: { borderWidth: 2, borderColor: '#6366F1' },
  gradientPreview: { flex: 1, borderRadius: 20 },
  templateOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 20,
  },
  templateLabel: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  solidLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginTop: 8 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default CardsScreen;