import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { ScaleInView } from '../components/AnimatedComponents';

export default function EditExpenseScreen({ navigation, route }) {
  const { expenseId } = route.params;
  const { expenses, updateExpense, deleteExpense, cards, CATEGORIES } = useExpenses();
  const { colors } = useTheme();
  const { t } = useI18n();

  const expense = expenses.find(e => e.id === expenseId);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]?.id || 'outros');
  const [selectedCard, setSelectedCard] = useState(null);
  const [date, setDate] = useState('');

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setDescription(expense.description);
      setSelectedCategory(expense.category);
      setSelectedCard(expense.cardId || null);
      setDate(expense.date);
    }
  }, [expense]);

  if (!expense) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle" size={48} color={colors.danger} />
        <Text style={{ color: colors.text, fontSize: 18, marginTop: 16 }}>{t('expenseNotFound')}</Text>
      </View>
    );
  }

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const getCategoryInfo = (categoryId) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[7];
  const category = getCategoryInfo(expense.category);
  const card = cards.find(c => c.id === expense.cardId);
  const isPaid = expense.paid === true;
  const hasValueChanged = expense.originalAmount && parseFloat(expense.originalAmount) !== parseFloat(expense.amount);

  // ─── TELA DE DETALHES (quando pago) ───
  if (isPaid) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <ScaleInView style={[styles.detailCard, { backgroundColor: colors.card }]}>
          <View style={[styles.paidIcon, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          </View>

          <Text style={[styles.detailTitle, { color: colors.text }]}>{expense.description}</Text>

          <View style={[styles.paidBadge, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="checkmark" size={14} color={colors.success} />
            <Text style={[styles.paidBadgeText, { color: colors.success }]}>{t('paid')}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>{t('amount')}</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatCurrency(parseFloat(expense.amount))}</Text>
          </View>

          {hasValueChanged && (
            <View style={[styles.valueChangedBox, { backgroundColor: colors.warning + '10' }]}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <View style={{ marginLeft: 8 }}>
                <Text style={[styles.valueChangedLabel, { color: colors.warning }]}>{t('valueChanged')}</Text>
                <Text style={[styles.valueChangedText, { color: colors.text }]}>
                  {t('previousValue')}: <Text style={{ textDecorationLine: 'line-through' }}>{formatCurrency(parseFloat(expense.originalAmount))}</Text>
                </Text>
                <Text style={[styles.valueChangedText, { color: colors.success, fontWeight: 'bold' }]}>
                  {t('newValue')}: {formatCurrency(parseFloat(expense.amount))}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>{t('category')}</Text>
            <View style={styles.detailCategoryRow}>
              <Ionicons name={category.icon} size={16} color={category.color} />
              <Text style={[styles.detailValue, { color: category.color, marginLeft: 6 }]}>{category.name}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textLight }]}>{t('date')}</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{new Date(expense.date).toLocaleDateString('pt-BR')}</Text>
          </View>

          {card && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textLight }]}>{t('card')}</Text>
              <Text style={[styles.detailValue, { color: colors.primary }]}>{card.name}</Text>
            </View>
          )}

          <Text style={[styles.detailHint, { color: colors.textLight }]}>
            {t('expensePaid')}
          </Text>

          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.modalButtonText}>{t('close')}</Text>
          </TouchableOpacity>
        </ScaleInView>
      </View>
    );
  }

  // ─── TELA DE EDIÇÃO (quando não pago) ───
  const handleUpdate = () => {
    if (!amount || !description) {
      Alert.alert(t('error'), t('fillValueAndDesc'));
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert(t('error'), t('enterValidValue'));
      return;
    }

    const originalAmount = expense.originalAmount || expense.amount;

    updateExpense(expenseId, {
      amount: numericAmount,
      description,
      category: selectedCategory,
      cardId: selectedCard,
      date,
      originalAmount,
    });

    Alert.alert(t('success'), t('expenseUpdated'), [
      { text: t('ok'), onPress: () => navigation.goBack() }
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      t('confirmDelete'),
      t('wantToDelete') + ' "' + expense.description + '"?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteExpense(expenseId);
            Alert.alert(t('deleted'), t('expenseRemoved'), [
              { text: t('ok'), onPress: () => navigation.goBack() }
            ]);
          }
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>{t('editExpense')}</Text>

        <Text style={[styles.label, { color: colors.text }]}>{t('amount')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={amount}
          onChangeText={setAmount}
          placeholder={t('amount')}
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: colors.text }]}>{t('description')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('description')}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[styles.label, { color: colors.text }]}>{t('date')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={date}
          onChangeText={setDate}
          placeholder={t('date')}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[styles.label, { color: colors.text }]}>{t('selectCard')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {cards.map(card => (
            <TouchableOpacity
              key={card.id}
              style={[styles.cardButton, { 
                backgroundColor: selectedCard === card.id ? colors.primary + '15' : colors.card,
                borderColor: selectedCard === card.id ? colors.primary : 'transparent'
              }]}
              onPress={() => setSelectedCard(card.id)}
            >
              <Ionicons name="card" size={16} color={selectedCard === card.id ? colors.primary : colors.textLight} />
              <Text style={[styles.cardText, { color: selectedCard === card.id ? colors.primary : colors.text }]}>{card.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.text }]}>{t('category')}</Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryButton, { 
                backgroundColor: selectedCategory === category.id ? category.color + '15' : colors.card,
                borderColor: selectedCategory === category.id ? category.color : 'transparent'
              }]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons name={category.icon} size={16} color={category.color} />
              <Text style={[styles.categoryText, { color: selectedCategory === category.id ? category.color : colors.text }]}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleUpdate}
        >
          <Ionicons name="save" size={22} color="#fff" />
          <Text style={styles.submitText}>{t('updateExpense')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.danger }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={22} color="#fff" />
          <Text style={styles.submitText}>{t('deleteExpenseBtn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { borderRadius: 14, padding: 16, fontSize: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cardButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  cardText: { marginLeft: 6, fontSize: 13 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  categoryText: { marginLeft: 6, fontSize: 13 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  // Detail view styles
  detailCard: { width: '100%', maxWidth: 340, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  paidIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  detailTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 16, gap: 6 },
  paidBadgeText: { fontSize: 14, fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 15, fontWeight: '600' },
  detailCategoryRow: { flexDirection: 'row', alignItems: 'center' },
  valueChangedBox: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', padding: 12, borderRadius: 12, marginVertical: 12 },
  valueChangedLabel: { fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  valueChangedText: { fontSize: 13, marginTop: 2 },
  detailHint: { fontSize: 12, textAlign: 'center', marginTop: 12, marginBottom: 16, fontStyle: 'italic' },
  modalButton: { width: '100%', padding: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
