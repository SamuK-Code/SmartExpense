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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { FadeInView, SlideInView, ScaleInView } from '../components/AnimatedComponents';

export default function AddExpenseScreen({ navigation }) {
  const { addExpense, cards, CATEGORIES } = useExpenses();
  const { colors, isDark } = useTheme();
  const [amount, setAmount] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('alimentacao');
  const [selectedCard, setSelectedCard] = useState(cards[0]?.id || null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Formata o input de moeda enquanto digita
  const handleAmountChange = (text) => {
    // Remove tudo que não é número
    const numeric = text.replace(/\D/g, '');
    setAmount(numeric);

    // Formata para display
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

    // Converter o valor numérico (em centavos) para reais
    const numericAmount = parseInt(amount) / 100;
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    // Verificar se tem cartão selecionado quando há cartões
    if (cards.length > 0 && !selectedCard) {
      Alert.alert('Erro', 'Selecione um cartão');
      return;
    }

    try {
      addExpense({
        amount: numericAmount,
        description,
        category: selectedCategory,
        cardId: selectedCard,
        date,
      });

      Alert.alert('Sucesso', 'Gasto adicionado!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

      // Limpar estados
      setAmount('');
      setAmountDisplay('');
      setDescription('');
      setSelectedCategory('alimentacao');
      setSelectedCard(cards[0]?.id || null);
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar: ' + error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Text style={[styles.title, { color: colors.header }]}>Novo Gasto</Text>
        </FadeInView>

        {/* Amount Input - COM FORMATAÇÃO DE MOEDA */}
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
              placeholder="Ex: Supermercado Extra"
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

        {/* Card Selection */}
        {cards.length > 0 && (
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

        {/* Submit Button */}
        <ScaleInView delay={500}>
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmit}>
            <Ionicons name="checkmark-outline" size={24} color="#fff" />
            <Text style={styles.submitText}>Salvar Gasto</Text>
          </TouchableOpacity>
        </ScaleInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  amountInput: {
    borderRadius: 16,
    padding: 18,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardText: {
    marginLeft: 6,
    fontSize: 13,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 13,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
