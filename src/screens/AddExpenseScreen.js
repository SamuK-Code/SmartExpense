import React, { useState } from 'react';
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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { FadeInView, SlideInView, ScaleInView } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';

export default function AddExpenseScreen({ navigation }) {
  const { addExpense, expenses, cards, CATEGORIES, deleteExpense } = useExpenses();
  const { colors, isDark } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('alimentacao');
  const [selectedCard, setSelectedCard] = useState(null);
  const [expenseType, setExpenseType] = useState('card'); // 'card' or 'standalone'
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[7];
  };

  const handleAmountChange = (text) => {
    const numeric = text.replace(/\D/g, '');
    setAmount(numeric);
    const number = parseInt(numeric) / 100;
    setAmountDisplay(
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(number || 0)
    );
  };

  const handleSubmit = () => {
    if (!amount || !description) {
      Alert.alert('Erro', 'Preencha o valor e a descrição');
      return;
    }

    const numericAmount = parseInt(amount) / 100;
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    // For card expenses, require card selection
    if (expenseType === 'card' && cards.length > 0 && !selectedCard) {
      Alert.alert('Erro', 'Selecione um cartão ou mude para "Sem Cartão"');
      return;
    }

    try {
      addExpense({
        amount: numericAmount,
        description,
        category: selectedCategory,
        cardId: expenseType === 'standalone' ? null : selectedCard,
        date,
      });

      Alert.alert('Sucesso', 'Gasto adicionado!', [
        { text: 'OK', onPress: () => {
          setShowForm(false);
          setAmount('');
          setAmountDisplay('');
          setDescription('');
          setSelectedCategory('alimentacao');
          setSelectedCard(null);
          setExpenseType('card');
          setDate(new Date().toISOString().split('T')[0]);
        }}
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar: ' + error.message);
    }
  };

  const handleDeleteExpense = (expense) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir "${expense.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteExpense(expense.id) },
      ]
    );
  };

  const renderExpenseItem = ({ item, index }) => {
    const category = getCategoryInfo(item.category);
    const card = cards.find(c => c.id === item.cardId);
    const isStandalone = !item.cardId;

    return (
      <SlideInView delay={index * 50}>
        <TouchableOpacity 
          style={[styles.expenseItem, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('EditExpense', { expenseId: item.id })}
          onLongPress={() => handleDeleteExpense(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.categoryIcon, { backgroundColor: category.color + (isDark ? '30' : '20') }]}>
            <Ionicons name={category.icon} size={20} color={category.color} />
          </View>
          <View style={styles.expenseInfo}>
            <Text style={[styles.expenseDescription, { color: colors.text }]}>{item.description}</Text>
            <View style={styles.expenseMeta}>
              <Text style={[styles.expenseCategory, { color: colors.textSecondary }]}>
                {category.name}
              </Text>
              {isStandalone ? (
                <View style={[styles.standaloneBadge, { backgroundColor: colors.info + (isDark ? '30' : '20') }]}>
                  <Ionicons name="receipt-outline" size={10} color={colors.info} />
                  <Text style={[styles.standaloneText, { color: colors.info }]}>Boleto/Avulso</Text>
                </View>
              ) : card ? (
                <View style={[styles.cardBadge, { backgroundColor: card.color + '20' }]}>
                  <Ionicons name="card-outline" size={10} color={card.color} />
                  <Text style={[styles.cardBadgeText, { color: card.color }]}>{card.name}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.expenseDate, { color: colors.textLight }]}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.expenseRight}>
            <Text style={[styles.expenseAmount, { color: colors.danger }]}>
              {formatCurrency(parseFloat(item.amount))}
            </Text>
          </View>
        </TouchableOpacity>
      </SlideInView>
    );
  };

  const renderForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Text style={[styles.title, { color: colors.header }]}>Novo Gasto</Text>
        </FadeInView>

        {/* Expense Type Toggle */}
        <SlideInView delay={50}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo de Gasto</Text>
            <View style={styles.typeToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.typeToggleButton,
                  expenseType === 'card' && { backgroundColor: colors.primary },
                  { backgroundColor: expenseType === 'card' ? colors.primary : colors.inputBg }
                ]}
                onPress={() => { setExpenseType('card'); setSelectedCard(null); }}
              >
                <Ionicons name="card" size={16} color={expenseType === 'card' ? '#fff' : colors.textSecondary} />
                <Text style={[styles.typeToggleText, { color: expenseType === 'card' ? '#fff' : colors.textSecondary }]}>Cartão</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeToggleButton,
                  expenseType === 'standalone' && { backgroundColor: colors.info },
                  { backgroundColor: expenseType === 'standalone' ? colors.info : colors.inputBg }
                ]}
                onPress={() => { setExpenseType('standalone'); setSelectedCard(null); }}
              >
                <Ionicons name="receipt" size={16} color={expenseType === 'standalone' ? '#fff' : colors.textSecondary} />
                <Text style={[styles.typeToggleText, { color: expenseType === 'standalone' ? '#fff' : colors.textSecondary }]}>Boleto/Avulso</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SlideInView>

        {/* Amount Input */}
        <SlideInView delay={100}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Valor (R$)</Text>
            <TextInput
              style={[styles.amountInput, { 
                backgroundColor: colors.inputBg, 
                color: colors.text,
                shadowColor: isDark ? '#000' : '#ccc',
              }]}
              placeholder="R$ 0,00"
              keyboardType="numeric"
              value={amountDisplay}
              onChangeText={handleAmountChange}
              placeholderTextColor={colors.textLight}
            />
          </View>
        </SlideInView>

        {/* Description Input */}
        <SlideInView delay={200}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Descrição</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.inputBg, 
                color: colors.text,
                shadowColor: isDark ? '#000' : '#ccc',
              }]}
              placeholder="Ex: Conta de luz, Boleto escola..."
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={colors.textLight}
            />
          </View>
        </SlideInView>

        {/* Date Input */}
        <SlideInView delay={300}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Data</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.inputBg, 
                color: colors.text,
                shadowColor: isDark ? '#000' : '#ccc',
              }]}
              placeholder="AAAA-MM-DD"
              value={date}
              onChangeText={setDate}
              placeholderTextColor={colors.textLight}
            />
          </View>
        </SlideInView>

        {/* Card Selection - Only show if type is card */}
        {expenseType === 'card' && cards.length > 0 && (
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
                    <Ionicons name="card-outline" size={18} color={card.color} />
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
        )}

        {/* Category Selection */}
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
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmit}>
            <Ionicons name="checkmark-outline" size={24} color="#fff" />
            <Text style={styles.submitText}>Salvar Gasto</Text>
          </TouchableOpacity>
        </ScaleInView>

        <ScaleInView delay={550}>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.border }]} 
            onPress={() => setShowForm(false)}
          >
            <Ionicons name="close-outline" size={24} color={colors.text} />
            <Text style={[styles.submitText, { color: colors.text }]}>Cancelar</Text>
          </TouchableOpacity>
        </ScaleInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderList = () => (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Gastos" />

      {expenses.length === 0 ? (
        <FadeInView>
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Nenhum gasto registrado</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>Adicione seu primeiro gasto</Text>
          </View>
        </FadeInView>
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowForm(true)}
      >
        <Ionicons name="add-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return showForm ? renderForm() : renderList();
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  // Type Toggle
  typeToggleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  typeToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Amount & inputs
  amountInput: {
    borderRadius: 16, padding: 18, fontSize: 32, fontWeight: 'bold',
    textAlign: 'center', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  input: {
    borderRadius: 14, padding: 16, fontSize: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  cardButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: 'transparent',
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
  cancelButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 18, borderRadius: 16, marginTop: 12,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  // List styles
  listContent: { padding: 16, paddingBottom: 80 },
  expenseItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  categoryIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseDescription: { fontSize: 15, fontWeight: '600' },
  expenseMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 6 },
  expenseCategory: { fontSize: 12 },
  expenseDate: { fontSize: 11, marginTop: 4 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 15, fontWeight: 'bold' },
  // Standalone badge
  standaloneBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, gap: 3,
  },
  standaloneText: { fontSize: 10, fontWeight: '600' },
  // Card badge
  cardBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, gap: 3,
  },
  cardBadgeText: { fontSize: 10, fontWeight: '600' },
  // Empty & FAB
  emptyContainer: { alignItems: 'center', padding: 40, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
});
