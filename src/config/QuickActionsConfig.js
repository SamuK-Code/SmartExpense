import * as QuickActions from 'expo-quick-actions';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Configuração de Quick Actions (atalhos no ícone do app)
 * 
 * Funciona em iOS e Android
 * Requer expo-quick-actions v6.0.2 para SDK 56
 * 
 * Instalação: npx expo install expo-quick-actions@6.0.2
 */

// 🆕 Navigation ref global para acesso fora do NavigationContainer
export const navigationRef = createNavigationContainerRef();

export const QUICK_ACTION_IDS = {
  ADD_EXPENSE: 'add_expense',
  ADD_INCOME: 'add_income',
  VIEW_CARDS: 'view_cards',
  VIEW_GOALS: 'view_goals',
};

export function useQuickActions() {
  // 🆕 Configura os atalhos ao montar o componente
  useEffect(() => {
    QuickActions.setItems([
      {
        id: QUICK_ACTION_IDS.ADD_EXPENSE,
        title: 'Nova Despesa',
        subtitle: 'Registrar gasto',
        icon: Platform.OS === 'ios' ? 'symbol:minus.circle.fill' : 'ic_menu_add',
        params: { screen: 'Add', params: { type: 'expense' } },
      },
      {
        id: QUICK_ACTION_IDS.ADD_INCOME,
        title: 'Nova Receita',
        subtitle: 'Registrar entrada',
        icon: Platform.OS === 'ios' ? 'symbol:plus.circle.fill' : 'ic_menu_add',
        params: { screen: 'Add', params: { type: 'income' } },
      },
      {
        id: QUICK_ACTION_IDS.VIEW_CARDS,
        title: 'Cartões',
        subtitle: 'Ver faturas',
        icon: Platform.OS === 'ios' ? 'symbol:creditcard.fill' : 'ic_menu_view',
        params: { screen: 'Cards' },
      },
      {
        id: QUICK_ACTION_IDS.VIEW_GOALS,
        title: 'Metas',
        subtitle: 'Ver progresso',
        icon: Platform.OS === 'ios' ? 'symbol:flag.fill' : 'ic_menu_view',
        params: { screen: 'Goals' },
      },
    ]);
  }, []);

  // 🆕 Hook correto do expo-quick-actions SDK 56
  useQuickActionCallback((action) => {
    handleQuickAction(action);
  });
}

function handleQuickAction(action) {
  if (!action?.params) return;

  const { screen, params } = action.params;

  // 🆕 Só navega se o navigationRef estiver pronto
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

/**
 * Hook para atualizar os quick actions dinamicamente
 * Ex: mudar ícone ou título baseado no contexto
 */
export function updateQuickActions(items) {
  QuickActions.setItems(items);
}

/**
 * Limpa todos os quick actions
 */
export function clearQuickActions() {
  QuickActions.setItems([]);
}