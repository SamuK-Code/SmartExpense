import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useExpenses } from '../context/ExpenseContext';
import { usePlanning } from '../context/PlanningContext';
import { useI18n } from '../context/I18nContext';

/**
 * Hook customizado para gerenciar operações de caixa.
 * Centraliza estados, validação e chamadas ao contexto.
 */
export function useCashManager() {
  const { addCashTransaction: ctxAddCashTransaction } = useExpenses();
  const {
    cashTransactions: planningCashTransactions,
    deleteCashTransaction: planningDeleteCashTransaction,
    updateCashTransaction: planningUpdateCashTransaction,
  } = usePlanning();
  const { t } = useI18n();

  // Estados do formulário de caixa
  const [cashAmount, setCashAmount] = useState('');
  const [cashAmountDisplay, setCashAmountDisplay] = useState('');
  const [cashDescription, setCashDescription] = useState('');
  const [cashDate, setCashDate] = useState(getTodayDate());

  // Estados de edição
  const [editingCashId, setEditingCashId] = useState(null);
  const [editCashAmount, setEditCashAmount] = useState('');
  const [editCashAmountDisplay, setEditCashAmountDisplay] = useState('');
  const [editCashDescription, setEditCashDescription] = useState('');
  const [editCashDate, setEditCashDate] = useState(getTodayDate());

  function getTodayDate() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  /**
   * Converte texto digitado (com máscara) para valor numérico em centavos
   */
  const parseCashInput = useCallback((text) => {
    const numeric = text.replace(/\D/g, '');
    const number = parseInt(numeric) / 100;
    const display = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(number || 0);
    return { numeric, display, number };
  }, []);

  /**
   * Valida se valor e descrição estão preenchidos corretamente
   */
  const validateCashInput = useCallback((amount, description) => {
    if (!amount || !description) {
      Alert.alert(t('error'), t('invalidAmount') + ' / ' + t('invalidDescription'));
      return false;
    }
    const numericValue = parseFloat(amount);
    if (isNaN(numericValue) || numericValue <= 0) {
      Alert.alert(t('error'), t('invalidAmount'));
      return false;
    }
    return true;
  }, [t]);

  /**
   * Adiciona nova entrada ao caixa
   */
  const submitCash = useCallback((onSuccess) => {
    if (!validateCashInput(cashAmount, cashDescription)) return false;

    const finalAmount = parseFloat(cashAmount) / 100;

    try {
      const result = ctxAddCashTransaction(finalAmount, cashDescription.trim());
      if (!result) {
        Alert.alert(t('error'), t('error'));
        return false;
      }
      Alert.alert(t('success'), t('cashAdded'), [
        { text: t('ok'), onPress: () => {
          resetCashForm();
          if (onSuccess) onSuccess();
        }}
      ]);
      return true;
    } catch (error) {
      console.error('Error in submitCash:', error);
      Alert.alert(t('error'), t('error'));
      return false;
    }
  }, [cashAmount, cashDescription, ctxAddCashTransaction, t, validateCashInput]);

  /**
   * Inicia modo de edição de uma entrada
   */
  const startEditing = useCallback((cashItem) => {
    setEditingCashId(cashItem.id);
    const amountInCents = Math.round(cashItem.amount * 100).toString();
    setEditCashAmount(amountInCents);
    setEditCashAmountDisplay(
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cashItem.amount)
    );
    setEditCashDescription(cashItem.description);
    setEditCashDate(cashItem.date || getTodayDate());
  }, []);

  /**
   * Cancela modo de edição
   */
  const cancelEditing = useCallback(() => {
    setEditingCashId(null);
    setEditCashAmount('');
    setEditCashAmountDisplay('');
    setEditCashDescription('');
    setEditCashDate(getTodayDate());
  }, []);

  /**
   * Atualiza uma entrada existente
   */
  const updateCash = useCallback((onSuccess) => {
    if (!validateCashInput(editCashAmount, editCashDescription)) return false;

    const finalAmount = parseFloat(editCashAmount) / 100;

    try {
      const result = planningUpdateCashTransaction(editingCashId, {
        amount: finalAmount,
        description: editCashDescription.trim(),
        date: editCashDate,
      });

      if (result) {
        Alert.alert(t('success'), t('cashUpdated'), [
          { text: t('ok'), onPress: () => {
            cancelEditing();
            if (onSuccess) onSuccess();
          }}
        ]);
        return true;
      } else {
        Alert.alert(t('error'), t('error'));
        return false;
      }
    } catch (error) {
      console.error('Error in updateCash:', error);
      Alert.alert(t('error'), t('error') + ': ' + error.message);
      return false;
    }
  }, [editingCashId, editCashAmount, editCashDescription, editCashDate, planningUpdateCashTransaction, t, validateCashInput, cancelEditing]);

  /**
   * Exclui uma entrada do caixa
   */
  const deleteCash = useCallback((cashItem, onSuccess) => {
    Alert.alert(
      t('confirm') + ' ' + t('delete'),
      t('wantToDelete') + ' "' + cashItem.description + '"?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => {
          if (typeof planningDeleteCashTransaction === 'function') {
            planningDeleteCashTransaction(cashItem.id);
          }
          if (onSuccess) onSuccess();
        }},
      ]
    );
  }, [planningDeleteCashTransaction, t]);

  /**
   * Reseta o formulário de adição
   */
  const resetCashForm = useCallback(() => {
    setCashAmount('');
    setCashAmountDisplay('');
    setCashDescription('');
    setCashDate(getTodayDate());
  }, []);

  /**
   * Manipula mudança no input de valor (novo)
   */
  const handleCashAmountChange = useCallback((text) => {
    const { numeric, display } = parseCashInput(text);
    setCashAmount(numeric);
    setCashAmountDisplay(display);
  }, [parseCashInput]);

  /**
   * Manipula mudança no input de valor (edição)
   */
  const handleEditCashAmountChange = useCallback((text) => {
    const { numeric, display } = parseCashInput(text);
    setEditCashAmount(numeric);
    setEditCashAmountDisplay(display);
  }, [parseCashInput]);

  return {
    // Estados do formulário
    cashAmount,
    cashAmountDisplay,
    cashDescription,
    cashDate,
    editingCashId,
    editCashAmount,
    editCashAmountDisplay,
    editCashDescription,
    editCashDate,

    // Setters
    setCashAmount,
    setCashAmountDisplay,
    setCashDescription,
    setCashDate,
    setEditCashDescription,
    setEditCashDate,

    // Ações
    submitCash,
    updateCash,
    deleteCash,
    startEditing,
    cancelEditing,
    resetCashForm,
    handleCashAmountChange,
    handleEditCashAmountChange,
  };
}
