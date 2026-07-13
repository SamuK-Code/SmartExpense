import * as QuickActions from 'expo-quick-actions';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Configuração de Quick Actions (atalhos no ícone do app)
 * 
 * Funciona em iOS e Android
 * Requer expo-quick-actions v6.0.2 para SDK 56+
 * 
 * ✅ SEGURANÇA: Ícones Android válidos (não crasham em devices)
 */

// Navigation ref global para acesso fora do NavigationContainer
export const navigationRef = createNavigationContainerRef();

export const QUICK_ACTION_IDS = {
  ADD_EXPENSE: 'add_expense',
  ADD_INCOME: 'add_income',
  VIEW_CARDS: 'view_cards',
  VIEW_GOALS: 'view_goals',
};

// ✅ SEGURANÇA: Ícones Android válidos do sistema
// 'ic_menu_add' e 'ic_menu_view' não existem em todos os devices Android
// Usamos null (sem ícone) para Android, que é seguro
const getQuickActionIcon = (iosIcon, androidIcon = null) => {
  if (Platform.OS === 'ios') {
    return iosIcon;
  }
  // Android: retorna null se não houver ícone válido do sistema
  // Isso evita crash em devices que não têm o ícone específico
  return androidIcon;
};

export function useQuickActions() {
  useEffect(() => {
    QuickActions.setItems([
      {
        id: QUICK_ACTION_IDS.ADD_EXPENSE,
        title: 'Nova Despesa',
        subtitle: 'Registrar gasto',
        icon: getQuickActionIcon('symbol:minus.circle.fill'),
        params: { screen: 'Add', params: { type: 'expense' } },
      },
      {
        id: QUICK_ACTION_IDS.ADD_INCOME,
        title: 'Nova Receita',
        subtitle: 'Registrar entrada',
        icon: getQuickActionIcon('symbol:plus.circle.fill'),
        params: { screen: 'Add', params: { type: 'income' } },
      },
      {
        id: QUICK_ACTION_IDS.VIEW_CARDS,
        title: 'Cartões',
        subtitle: 'Ver faturas',
        icon: getQuickActionIcon('symbol:creditcard.fill'),
        params: { screen: 'Cards' },
      },
      {
        id: QUICK_ACTION_IDS.VIEW_GOALS,
        title: 'Metas',
        subtitle: 'Ver progresso',
        icon: getQuickActionIcon('symbol:flag.fill'),
        params: { screen: 'Goals' },
      },
    ]);
  }, []);

  useQuickActionCallback((action) => {
    handleQuickAction(action);
  });
}

function handleQuickAction(action) {
  if (!action?.params) return;

  const { screen, params } = action.params;

  if (!navigationRef.isReady()) {
    console.log('[QuickActions] Navigation not ready yet, retrying in 500ms...');
    setTimeout(() => handleQuickAction(action), 500);
    return;
  }

  if (screen) {
    if (params) {
      navigationRef.navigate(screen, params);
    } else {
      navigationRef.navigate(screen);
    }
  }
}

export function updateQuickActions(items) {
  QuickActions.setItems(items);
}

export function clearQuickActions() {
  QuickActions.setItems([]);
}