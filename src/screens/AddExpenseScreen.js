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
} from 'react-native';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';

export default function AddExpenseScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  const { addExpense, CATEGORIES } = useExpenses();
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

    setIsLoading(true);
    
    const result = addExpense({
      amount: numAmount,
      description,
      category,
      date,
    });

    setIsLoading(false);

    if (result.success) {
      Alert.alert(t('success'), t('expenseAdded'));
      navigation.goBack();
    } else {
      Alert.alert(t('error'), result.error || t('error'));
    }
  }, [amount, description, category, date, addExpense, t, navigation]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>{t('newExpense')}</Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('amount')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder="0,00"
            placeholderTextColor={colors.textLight}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('description')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder={t('description')}
            placeholderTextColor={colors.textLight}
            value={description}
            onChangeText={setDescription}
          />
        </View>

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
                  },
                ]}
                onPress={() => setCategory(cat.id)}
              >
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

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{t('addExpenseBtn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 6, fontWeight: '600' },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1 },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  categoryText: { fontSize: 14, fontWeight: '600' },
  button: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});