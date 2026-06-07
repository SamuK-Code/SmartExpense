import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { FadeInView, SlideInView, ScaleInView } from '../components/AnimatedComponents';

export default function EditExpenseScreen({ navigation, route }) {
  const { expenseId } = route.params;
  const { expenses, updateExpense, deleteExpense, cards, CATEGORIES } = useExpenses();
  const { colors, isDark } = useTheme();

  const expense = expenses.find(e => e.id === expenseId);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('alimentacao');
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
        <Text style={{ color: colors.text }}>Gasto não encontrado</Text>
      </View>
    );
  }

  const handleUpdate = () => {
    if (!amount || !description) {
      Alert.alert('Erro', 'Preencha o valor e a descrição');
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    updateExpense(expenseId, {
      amount: numericAmount,
      description,
      category: selectedCategory,
      cardId: selectedCard,
      date,
    });

    Alert.alert('Sucesso', 'Gasto atualizado!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir "${expense.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            deleteExpense(expenseId);
            Alert.alert('Excluído', 'Gasto removido com sucesso', [
              { text: 'OK', onPress: () => navigation.goBack() }
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Text style={[styles.title, { color: colors.header }]}>Editar Gasto</Text>
        </FadeInView>

        <SlideInView delay={100}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Valor (R$)</Text>
            <TextInput
              style={[styles.amountInput, { backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="0,00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={colors.textLight}
            />
          </View>
        </SlideInView>

        <SlideInView delay={200}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Descrição</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Ex: Supermercado Extra"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={colors.textLight}
            />
          </View>
        </SlideInView>

        <SlideInView delay={300}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Data</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="AAAA-MM-DD"
              value={date}
              onChangeText={setDate}
              placeholderTextColor={colors.textLight}
            />
          </View>
        </SlideInView>

        <SlideInView delay={350}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Cartão</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cards.map(card => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.cardButton,
                    selectedCard === card.id && { 
                      backgroundColor: card.color + '25',
                      borderColor: card.color,
                      borderWidth: 2,
                    },
                    { backgroundColor: colors.inputBg },
                  ]}
                  onPress={() => setSelectedCard(card.id)}
                >
                  <Ionicons name="card" size={18} color={card.color} />
                  <Text style={[
                    styles.cardText,
                    { color: selectedCard === card.id ? card.color : colors.textSecondary },
                  ]}>
                    {card.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SlideInView>

        <SlideInView delay={400}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Categoria</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && {
                      backgroundColor: category.color + (isDark ? '35' : '25'),
                      borderColor: category.color,
                      borderWidth: 2,
                    },
                    { backgroundColor: colors.inputBg },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Ionicons name={category.icon} size={20} color={category.color} />
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.id && { color: category.color, fontWeight: 'bold' },
                      { color: colors.textSecondary },
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SlideInView>

        <ScaleInView delay={500}>
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleUpdate}>
            <Ionicons name="checkmark" size={24} color="#fff" />
            <Text style={styles.submitText}>Atualizar Gasto</Text>
          </TouchableOpacity>
        </ScaleInView>

        <ScaleInView delay={600}>
          <TouchableOpacity style={[styles.deleteButton, { backgroundColor: colors.danger }]} onPress={handleDelete}>
            <Ionicons name="trash" size={24} color="#fff" />
            <Text style={styles.submitText}>Excluir Gasto</Text>
          </TouchableOpacity>
        </ScaleInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  amountInput: {
    borderRadius: 16, padding: 18, fontSize: 32, fontWeight: 'bold',
    textAlign: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  input: {
    borderRadius: 14, padding: 16, fontSize: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  cardButton: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 10, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: 'transparent',
  },
  cardText: { marginLeft: 6, fontSize: 13 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryButton: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingVertical: 10, borderRadius: 12, marginRight: 8, marginBottom: 8,
    borderWidth: 1, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  categoryText: { marginLeft: 6, fontSize: 13 },
  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 18, borderRadius: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 18, borderRadius: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
