import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import ExpenseListItem from '../components/ExpenseListItem';
import { StaggeredList } from '../components/AnimatedComponents';
import { SPACING, BORDER_RADIUS } from '../constants/DesignSystem';

const PaymentTypeButton = ({ selected, onPress, icon, title, subtitle, colors }) => (
  <TouchableOpacity
    style={[
      styles.paymentTypeButton,
      {
        backgroundColor: selected ? colors.primary + '15' : colors.card,
        borderColor: selected ? colors.primary : colors.border,
        borderWidth: 2,
      }
    ]}
    onPress={onPress}
  >
    <Ionicons name={icon} size={28} color={selected ? colors.primary : colors.textSecondary} />
    <View style={styles.paymentTypeText}>
      <Text style={[styles.paymentTypeTitle, { color: selected ? colors.primary : colors.text }]}>{title}</Text>
      <Text style={[styles.paymentTypeSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
    </View>
    {selected && (
      <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
        <Ionicons name="checkmark" size={16} color="#fff" />
      </View>
    )}
  </TouchableOpacity>
);

export default function AddExpenseScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState('credit'); // credit, debit, cash, standalone
  const [selectedCard, setSelectedCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { addExpense, cards, CATEGORIES } = useExpenses();
  const { colors } = useTheme();
  const { t } = useI18n();

  const handleSubmit = useCallback(() => {
    if (!amount || !description || !category) {
      Alert.alert(t('error'), t('fillValueAndDesc'));
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert(t('error'), t('enterValidValue'));
      return;
    }

    if ((paymentType === 'credit' || paymentType === 'debit') && !selectedCard) {
      Alert.alert(t('error'), 'Selecione um cartão');
      return;
    }

    setIsLoading(true);

    const expenseData = {
      amount: numAmount,
      description,
      category,
      date,
      paymentType,
      cardId: (paymentType === 'credit' || paymentType === 'debit') ? selectedCard : null,
      isBill: paymentType === 'standalone',
    };

    const result = addExpense(expenseData);

    setIsLoading(false);

    if (result.success) {
      Alert.alert(t('success'), t('expenseAdded'));
      navigation.goBack();
    } else {
      Alert.alert(t('error'), result.error || t('error'));
    }
  }, [amount, description, category, date, paymentType, selectedCard, addExpense, t, navigation]);

  const showCardSelector = paymentType === 'credit' || paymentType === 'debit';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: colors.text }]}>{t('newExpense')}</Text>

          {/* Valor */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('amount')}</Text>
            <View style={[styles.amountInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={[styles.currency, { color: colors.textSecondary }]}>R$</Text>
              <TextInput
                style={[styles.amountText, { color: colors.text }]}
                placeholder="0,00"
                placeholderTextColor={colors.textLight}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Descrição */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('description')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Ex: Mercado, Uber, Netflix..."
              placeholderTextColor={colors.textLight}
              value={description}
              onChangeText={setDescription}
              maxLength={100}
            />
          </View>

          {/* Tipo de Pagamento */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo de Pagamento</Text>
            <View style={styles.paymentTypesContainer}>
              <PaymentTypeButton
                selected={paymentType === 'credit'}
                onPress={() => setPaymentType('credit')}
                icon="card-outline"
                title="Crédito"
                subtitle="Cartão de crédito"
                colors={colors}
              />
              <PaymentTypeButton
                selected={paymentType === 'debit'}
                onPress={() => setPaymentType('debit')}
                icon="card-outline"
                title="Débito"
                subtitle="Cartão de débito"
                colors={colors}
              />
              <PaymentTypeButton
                selected={paymentType === 'cash'}
                onPress={() => setPaymentType('cash')}
                icon="cash-outline"
                title="Dinheiro"
                subtitle="Pagamento em espécie"
                colors={colors}
              />
              <PaymentTypeButton
                selected={paymentType === 'standalone'}
                onPress={() => setPaymentType('standalone')}
                icon="receipt-outline"
                title="Boleto/Avulso"
                subtitle="Pagamento único"
                colors={colors}
              />
            </View>
          </View>

          {/* Seletor de Cartão (se crédito ou débito) */}
          {showCardSelector && (
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('selectCard')}</Text>
              <View style={styles.cardsContainer}>
                {cards.length === 0 ? (
                  <Text style={[styles.noCards, { color: colors.textSecondary }]}>
                    Nenhum cartão cadastrado. Adicione um cartão primeiro.
                  </Text>
                ) : (
                  cards.map((card) => (
                    <TouchableOpacity
                      key={card.id}
                      style={[
                        styles.cardButton,
                        {
                          backgroundColor: selectedCard === card.id ? card.color || colors.primary + '15' : colors.card,
                          borderColor: selectedCard === card.id ? card.color || colors.primary : colors.border,
                          borderWidth: 2,
                        }
                      ]}
                      onPress={() => setSelectedCard(card.id)}
                    >
                      <Ionicons name="card" size={24} color={card.color || colors.primary} />
                      <View style={styles.cardInfo}>
                        <Text style={[styles.cardName, { color: colors.text }]}>{card.customName || card.name}</Text>
                        <Text style={[styles.cardLimit, { color: colors.textSecondary }]}>
                          Limite: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limit || 0)}
                        </Text>
                      </View>
                      {selectedCard === card.id && (
                        <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          )}

          {/* Categoria */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('category')}</Text>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: category === cat.id ? cat.color : colors.card,
                      borderColor: cat.color,
                      borderWidth: 2,
                    }
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Ionicons name={cat.icon} size={20} color={category === cat.id ? '#fff' : cat.color} />
                  <Text style={[
                    styles.categoryText,
                    { color: category === cat.id ? '#fff' : colors.text }
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Data */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('date')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textLight}
              value={date}
              onChangeText={setDate}
            />
          </View>

          {/* Recent Expenses Section */}
          {expenses.length > 0 && (
            <View style={[styles.recentSection, { marginTop: SPACING.xl, marginBottom: SPACING.lg }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Gastos Recentes</Text>
              <StaggeredList staggerDelay={50}>
                {expenses.slice(0, 5).map((expense) => (
                  <View key={expense.id} style={{ marginBottom: SPACING.sm }}>
                    <ExpenseListItem
                      expense={expense}
                      onPay={() => {}}
                      onDelete={() => {}}
                      compact
                    />
                  </View>
                ))}
              </StaggeredList>
            </View>
          )}

          {/* Botão Salvar */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.buttonText}>Salvando...</Text>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>{t('addExpenseBtn')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.md },
  recentSection: { borderTopWidth: 1, paddingTop: SPACING.lg },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1 },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  currency: { fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  amountText: { flex: 1, fontSize: 24, fontWeight: 'bold' },
  paymentTypesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paymentTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    width: '48%',
    gap: 10,
  },
  paymentTypeText: { flex: 1 },
  paymentTypeTitle: { fontSize: 14, fontWeight: '600' },
  paymentTypeSubtitle: { fontSize: 11, marginTop: 2 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsContainer: { gap: 10 },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600' },
  cardLimit: { fontSize: 12, marginTop: 2 },
  noCards: { fontSize: 14, textAlign: 'center', padding: 20 },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: { fontSize: 14, fontWeight: '600' },
  button: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
