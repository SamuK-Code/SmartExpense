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
import { usePlanning } from '../context/PlanningContext';
import { useTheme } from '../context/ThemeContext';
import { FadeInView, SlideInView, ScaleInView } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';

export default function AddExpenseScreen({ navigation }) {
  const { 
    addExpense, 
    expenses, 
    cards, 
    CATEGORIES, 
    deleteExpense, 
    cashTransactions: ctxCashTransactions, 
    addCashTransaction: ctxAddCashTransaction 
  } = useExpenses();

  const { 
    cashBalance, 
    cashTransactions: planningCashTransactions,
    deleteCashTransaction: planningDeleteCashTransaction,
    updateCashTransaction: planningUpdateCashTransaction,
  } = usePlanning();

  

  const [localCashTransactions, setLocalCashTransactions] = useState([]);
  const { colors, isDark } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]?.id || 'outros');
  const [selectedCard, setSelectedCard] = useState(null);
  const [expenseType, setExpenseType] = useState('card');
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [filterDate, setFilterDate] = useState('all');
  const [filterCard, setFilterCard] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('expenses');

  const getTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const cashTransactions = ctxCashTransactions || localCashTransactions;
  const addCashTransaction = (amount, description) => {
    if (ctxAddCashTransaction) {
      return ctxAddCashTransaction(amount, description);
    } else {
      const newEntry = {
        id: Date.now().toString(),
        amount: amount,
        description: description,
        date: cashDate || getTodayDate(),
        createdAt: new Date().toISOString(),
      };
      setLocalCashTransactions(prev => [newEntry, ...prev]);
      return newEntry;
    }
  };

  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [showCashForm, setShowCashForm] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cashAmountDisplay, setCashAmountDisplay] = useState('');
  const [cashDate, setCashDate] = useState(getTodayDate());
  const [cashDescription, setCashDescription] = useState('');
  const [date, setDate] = useState(getTodayDate());

  // Estados para edição de caixa
  const [editingCashId, setEditingCashId] = useState(null);
  const [editCashAmount, setEditCashAmount] = useState('');
  const [editCashAmountDisplay, setEditCashAmountDisplay] = useState('');
  const [editCashDescription, setEditCashDescription] = useState('');
  const [editCashDate, setEditCashDate] = useState(getTodayDate());

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[7];
  };

  const handleCashAmountChange = (text) => {
    const numeric = text.replace(/\D/g, '');
    setCashAmount(numeric);
    const number = parseInt(numeric) / 100;
    setCashAmountDisplay(
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(number || 0)
    );
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

  const handleCashSubmit = () => {
    console.log('handleCashSubmit called');
    console.log('cashAmount:', cashAmount, 'type:', typeof cashAmount);
    console.log('cashDescription:', cashDescription);

    if (!cashAmount || !cashDescription) {
      Alert.alert('Erro', 'Preencha o valor e a descrição');
      return;
    }

    const numericValue = parseFloat(cashAmount);
    console.log('numericValue:', numericValue);

    if (isNaN(numericValue) || numericValue <= 0) {
      Alert.alert('Erro', 'Valor inválido: ' + cashAmount);
      return;
    }

    const finalAmount = numericValue / 100;
    console.log('finalAmount:', finalAmount);

    try {
      const result = addCashTransaction(finalAmount, cashDescription.trim());
      console.log('addCashTransaction result:', result);

      if (result === null || result === undefined) {
        Alert.alert('Erro', 'Não foi possível adicionar ao caixa (retornou null)');
        return;
      }

      Alert.alert('Sucesso', 'Dinheiro adicionado ao caixa!', [
        { text: 'OK', onPress: () => {
          setShowCashForm(false);
          setCashAmount('');
          setCashAmountDisplay('');
          setCashDate(getTodayDate());
          setCashDescription('');
        }}
      ]);
    } catch (error) {
      console.error('Error in handleCashSubmit:', error);
      Alert.alert('Erro', 'Não foi possível adicionar: ' + error.message);
    }
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
        paymentMethod: expenseType === 'card' ? paymentMethod : null,
      });

      Alert.alert('Sucesso', 'Gasto adicionado!', [
        { text: 'OK', onPress: () => {
          setShowForm(false);
          setAmount('');
          setAmountDisplay('');
          setDescription('');
          setSelectedCategory(CATEGORIES[0]?.id || 'outros');
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

  const handleEditCash = (cashItem) => {
    console.log('handleEditCash:', cashItem);
    setEditingCashId(cashItem.id);

    const amountInCents = Math.round(cashItem.amount * 100).toString();
    setEditCashAmount(amountInCents);
    setEditCashAmountDisplay(
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(cashItem.amount)
    );
    setEditCashDescription(cashItem.description);
    setEditCashDate(cashItem.date || getTodayDate());
  };

  const handleUpdateCash = () => {
    console.log('handleUpdateCash called');

    if (!editCashAmount || !editCashDescription) {
      Alert.alert('Erro', 'Preencha o valor e a descricao');
      return;
    }

    const numericValue = parseFloat(editCashAmount);
    if (isNaN(numericValue) || numericValue <= 0) {
      Alert.alert('Erro', 'Valor invalido');
      return;
    }

    const finalAmount = numericValue / 100;

    try {
      const result = updateCashTransaction(editingCashId, {
        amount: finalAmount,
        description: editCashDescription.trim(),
        date: editCashDate,
      });

      if (result) {
        Alert.alert('Sucesso', 'Entrada do caixa atualizada!', [
          { text: 'OK', onPress: () => {
            setEditingCashId(null);
            setEditCashAmount('');
            setEditCashAmountDisplay('');
            setEditCashDescription('');
            setEditCashDate(getTodayDate());
          }}
        ]);
      } else {
        Alert.alert('Erro', 'Nao foi possivel atualizar');
      }
    } catch (error) {
      console.error('Error in handleUpdateCash:', error);
      Alert.alert('Erro', 'Nao foi possivel atualizar: ' + error.message);
    }
  };

  const handleDeleteCash = (cashItem) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir "${cashItem.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => {
          if (ctxAddCashTransaction && typeof deleteCashTransaction === 'function') {
            deleteCashTransaction(cashItem.id);
          } else {
            setLocalCashTransactions(prev => prev.filter(item => item.id !== cashItem.id));
          }
        }},
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

  const renderCashItem = ({ item, index }) => {
    const isEditing = editingCashId === item.id;

    if (isEditing) {
      return (
        <SlideInView delay={index * 50}>
          <View style={[styles.editCashForm, { backgroundColor: colors.card }]}>
            <Text style={[styles.editTitle, { color: colors.text }]}>Editar Entrada</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Valor (R$)</Text>
              <TextInput
                style={[styles.amountInput, { 
                  backgroundColor: colors.inputBg, 
                  color: colors.text,
                }]}
                placeholder="R$ 0,00"
                keyboardType="numeric"
                value={editCashAmountDisplay}
                onChangeText={(text) => {
                  const numeric = text.replace(/\D/g, '');
                  setEditCashAmount(numeric);
                  const number = parseInt(numeric) / 100;
                  setEditCashAmountDisplay(
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(number || 0)
                  );
                }}
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Descricao</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBg, 
                  color: colors.text,
                }]}
                value={editCashDescription}
                onChangeText={setEditCashDescription}
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Data</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBg, 
                  color: colors.text,
                }]}
                value={editCashDate}
                onChangeText={setEditCashDate}
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.editButtonsRow}>
              <TouchableOpacity 
                style={[styles.editButton, { backgroundColor: colors.success }]} 
                onPress={handleUpdateCash}
              >
                <Ionicons name="checkmark-outline" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.editButton, { backgroundColor: colors.border }]} 
                onPress={() => {
                  setEditingCashId(null);
                  setEditCashAmount('');
                  setEditCashAmountDisplay('');
                  setEditCashDescription('');
                  setEditCashDate(getTodayDate());
                }}
              >
                <Ionicons name="close-outline" size={20} color={colors.text} />
                <Text style={[styles.editButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SlideInView>
      );
    }

    return (
      <SlideInView delay={index * 50}>
        <TouchableOpacity 
          style={[styles.expenseItem, { backgroundColor: colors.card }]}
          onPress={() => handleEditCash(item)}
          onLongPress={() => handleDeleteCash(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.categoryIcon, { backgroundColor: colors.success + (isDark ? '30' : '20') }]}>
            <Ionicons name="cash-outline" size={20} color={colors.success} />
          </View>
          <View style={styles.expenseInfo}>
            <Text style={[styles.expenseDescription, { color: colors.text }]}>{item.description}</Text>
            <View style={styles.expenseMeta}>
              <View style={[styles.cashBadge, { backgroundColor: colors.success + (isDark ? '30' : '20') }]}>
                <Ionicons name="arrow-up-outline" size={10} color={colors.success} />
                <Text style={[styles.cashBadgeText, { color: colors.success }]}>Entrada</Text>
              </View>
            </View>
            <Text style={[styles.expenseDate, { color: colors.textLight }]}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.expenseRight}>
            <Text style={[styles.cashAmount, { color: colors.success }]}>
              + {formatCurrency(parseFloat(item.amount))}
            </Text>
          </View>
        </TouchableOpacity>
      </SlideInView>
    );
  };

  const renderCashForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <View style={styles.topSpacer} />
          <Text style={[styles.title, { color: colors.header }]}>Adicionar ao Caixa</Text>
        </FadeInView>

        <SlideInView delay={50}>
          <View style={[styles.balanceCard, { backgroundColor: colors.success + (isDark ? '25' : '15') }]}>
            <Text style={[styles.balanceLabel, { color: colors.success }]}>Saldo Atual do Caixa</Text>
            <Text style={[styles.balanceValue, { color: colors.success }]}>
              {formatCurrency(cashBalance)}
            </Text>
          </View>
        </SlideInView>

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
              value={cashAmountDisplay}
              onChangeText={handleCashAmountChange}
              placeholderTextColor={colors.textLight}
            />
          </View>
        </SlideInView>

        <SlideInView delay={200}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Descrição</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.inputBg, 
                color: colors.text,
                shadowColor: isDark ? '#000' : '#ccc',
              }]}
              placeholder="Ex: Salário, Pix recebido..."
              value={cashDescription}
              onChangeText={setCashDescription}
              placeholderTextColor={colors.textLight}
            />
          </View>
        </SlideInView>

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
              value={cashDate}
              onChangeText={setCashDate}
              placeholderTextColor={colors.textLight}
            />
          </View>
        </SlideInView>

        <ScaleInView delay={400}>
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.success }]} onPress={handleCashSubmit}>
            <Ionicons name="checkmark-outline" size={24} color="#fff" />
            <Text style={styles.submitText}>Adicionar ao Caixa</Text>
          </TouchableOpacity>
        </ScaleInView>

        <ScaleInView delay={450}>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.border }]} 
            onPress={() => {
              setShowCashForm(false);
              setCashAmount('');
              setCashAmountDisplay('');
              setCashDate(getTodayDate());
              setCashDescription('');
            }}
          >
            <Ionicons name="close-outline" size={24} color={colors.text} />
            <Text style={[styles.submitText, { color: colors.text }]}>Cancelar</Text>
          </TouchableOpacity>
        </ScaleInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <View style={styles.topSpacer} />
          <Text style={[styles.title, { color: colors.header }]}>Novo Gasto</Text>
        </FadeInView>

        <SlideInView delay={25}>
          <View style={[styles.balanceCard, { backgroundColor: colors.primary + (isDark ? '25' : '15') }]}>
            <Text style={[styles.balanceLabel, { color: colors.primary }]}>Saldo Atual do Caixa</Text>
            <Text style={[styles.balanceValue, { color: colors.primary }]}>
              {formatCurrency(cashBalance)}
            </Text>
          </View>
        </SlideInView>

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

        {expenseType === 'card' && (
          <SlideInView delay={75}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Forma de Pagamento</Text>
              <View style={styles.typeToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeToggleButton,
                    paymentMethod === 'credit' && { backgroundColor: colors.warning },
                    { backgroundColor: paymentMethod === 'credit' ? colors.warning : colors.inputBg }
                  ]}
                  onPress={() => setPaymentMethod('credit')}
                >
                  <Ionicons name="timer-outline" size={16} color={paymentMethod === 'credit' ? '#fff' : colors.textSecondary} />
                  <Text style={[styles.typeToggleText, { color: paymentMethod === 'credit' ? '#fff' : colors.textSecondary }]}>Crédito</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeToggleButton,
                    paymentMethod === 'debit' && { backgroundColor: colors.primary },
                    { backgroundColor: paymentMethod === 'debit' ? colors.primary : colors.inputBg }
                  ]}
                  onPress={() => setPaymentMethod('debit')}
                >
                  <Ionicons name="cash-outline" size={16} color={paymentMethod === 'debit' ? '#fff' : colors.textSecondary} />
                  <Text style={[styles.typeToggleText, { color: paymentMethod === 'debit' ? '#fff' : colors.textSecondary }]}>Débito</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SlideInView>
        )}

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

  const getFilteredExpensesList = () => {
    let filtered = expenses;

    if (filterDate !== 'all') {
      const now = new Date();
      filtered = filtered.filter(e => {
        const d = new Date(e.date);
        if (filterDate === 'today') {
          return d.toDateString() === now.toDateString();
        } else if (filterDate === 'week') {
          const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
          return d >= weekAgo;
        } else if (filterDate === 'month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    if (filterCard !== 'all') {
      filtered = filtered.filter(e => e.cardId === filterCard);
    }

    if (filterType !== 'all') {
      if (filterType === 'card') {
        filtered = filtered.filter(e => e.cardId);
      } else if (filterType === 'standalone') {
        filtered = filtered.filter(e => !e.cardId);
      }
    }

    return filtered;
  };

  const getFilteredCashList = () => {
    let filtered = cashTransactions || [];

    if (filterDate !== 'all') {
      const now = new Date();
      filtered = filtered.filter(e => {
        const d = new Date(e.date);
        if (filterDate === 'today') {
          return d.toDateString() === now.toDateString();
        } else if (filterDate === 'week') {
          const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
          return d >= weekAgo;
        } else if (filterDate === 'month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    return filtered;
  };

  const renderList = () => (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={viewMode === 'expenses' ? 'Gastos' : 'Caixa'} />

      <View style={[styles.viewModeContainer, { backgroundColor: colors.card }]}>
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'expenses' && { backgroundColor: colors.danger },
              { backgroundColor: viewMode === 'expenses' ? colors.danger : colors.inputBg }
            ]}
            onPress={() => setViewMode('expenses')}
          >
            <Ionicons name="receipt-outline" size={16} color={viewMode === 'expenses' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.viewModeText, { color: viewMode === 'expenses' ? '#fff' : colors.textSecondary }]}>Despesas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'cash' && { backgroundColor: colors.success },
              { backgroundColor: viewMode === 'cash' ? colors.success : colors.inputBg }
            ]}
            onPress={() => setViewMode('cash')}
          >
            <Ionicons name="cash-outline" size={16} color={viewMode === 'cash' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.viewModeText, { color: viewMode === 'cash' ? '#fff' : colors.textSecondary }]}>Caixa</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'expenses' && (
        <View style={[styles.filtersContainer, { backgroundColor: colors.card }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Data</Text>
              <View style={styles.filterButtons}>
                {['all', 'today', 'week', 'month'].map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterBtn, filterDate === f && { backgroundColor: colors.primary }]}
                    onPress={() => setFilterDate(f)}
                  >
                    <Text style={[styles.filterBtnText, { color: filterDate === f ? '#fff' : colors.textSecondary }]}>
                      {f === 'all' ? 'Todas' : f === 'today' ? 'Hoje' : f === 'week' ? '7 Dias' : 'Mês'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Tipo</Text>
              <View style={styles.filterButtons}>
                {['all', 'card', 'standalone'].map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterBtn, filterType === f && { backgroundColor: colors.primary }]}
                    onPress={() => setFilterType(f)}
                  >
                    <Text style={[styles.filterBtnText, { color: filterType === f ? '#fff' : colors.textSecondary }]}>
                      {f === 'all' ? 'Todos' : f === 'card' ? 'Cartão' : 'Avulso'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Cartão</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterBtn, filterCard === 'all' && { backgroundColor: colors.primary }]}
                  onPress={() => setFilterCard('all')}
                >
                  <Text style={[styles.filterBtnText, { color: filterCard === 'all' ? '#fff' : colors.textSecondary }]}>Todos</Text>
                </TouchableOpacity>
                {cards.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.filterBtn, filterCard === c.id && { backgroundColor: c.color }]}
                    onPress={() => setFilterCard(c.id)}
                  >
                    <Text style={[styles.filterBtnText, { color: filterCard === c.id ? '#fff' : colors.textSecondary }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {viewMode === 'expenses' && expenses.length === 0 ? (
        <FadeInView>
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Nenhum gasto registrado</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>Adicione seu primeiro gasto</Text>
          </View>
        </FadeInView>
      ) : viewMode === 'cash' && (cashTransactions || []).length === 0 ? (
        <FadeInView>
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={64} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Nenhuma entrada no caixa</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>Adicione sua primeira entrada</Text>
          </View>
        </FadeInView>
      ) : (
        <FlatList
          data={viewMode === 'expenses' ? getFilteredExpensesList() : getFilteredCashList()}
          renderItem={viewMode === 'expenses' ? renderExpenseItem : renderCashItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {fabMenuOpen && (
        <View style={styles.fabMenuOverlay}>
          <TouchableOpacity style={styles.fabMenuOverlayTouchable} onPress={() => setFabMenuOpen(false)} />
          <View style={[styles.fabMenu, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: colors.primary + '15' }]}
              onPress={() => {
                setFabMenuOpen(false);
                setShowForm(true);
              }}
            >
              <View style={[styles.fabMenuIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="receipt-outline" size={20} color="#fff" />
              </View>
              <View>
                <Text style={[styles.fabMenuTitle, { color: colors.text }]}>Novo Gasto</Text>
                <Text style={[styles.fabMenuSubtitle, { color: colors.textSecondary }]}>Adicionar despesa</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: colors.success + '15' }]}
              onPress={() => {
                setFabMenuOpen(false);
                setShowCashForm(true);
              }}
            >
              <View style={[styles.fabMenuIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="cash-outline" size={20} color="#fff" />
              </View>
              <View>
                <Text style={[styles.fabMenuTitle, { color: colors.text }]}>Adicionar Caixa</Text>
                <Text style={[styles.fabMenuSubtitle, { color: colors.textSecondary }]}>Entrada de dinheiro</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setFabMenuOpen(!fabMenuOpen)}
      >
        <Ionicons name={fabMenuOpen ? "close-outline" : "add-outline"} size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  if (showCashForm) return renderCashForm();
  return showForm ? renderForm() : renderList();
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 40 },
  topSpacer: { height: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  balanceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  viewModeContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  viewModeToggle: {
    flexDirection: 'row',
    gap: 10,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  viewModeText: {
    fontSize: 13,
    fontWeight: '600',
  },
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

  // Edit Cash Form
  editCashForm: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
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
  cashAmount: { fontSize: 15, fontWeight: 'bold' },
  standaloneBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, gap: 3,
  },
  standaloneText: { fontSize: 10, fontWeight: '600' },
  cardBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, gap: 3,
  },
  cardBadgeText: { fontSize: 10, fontWeight: '600' },
  cashBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, gap: 3,
  },
  cashBadgeText: { fontSize: 10, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', padding: 40, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersScroll: {
    paddingHorizontal: 12,
    gap: 16,
  },
  filterGroup: {
    marginRight: 16,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fabMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  fabMenuOverlayTouchable: {
    flex: 1,
  },
  fabMenu: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 220,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 999,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  fabMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fabMenuTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  fabMenuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
});
