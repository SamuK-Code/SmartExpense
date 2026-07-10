import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamic import para expo-notifications (não funciona no Expo Go)
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.log('[Widget] expo-notifications não disponível');
}

// Dynamic import para expo-widgets (só disponível em iOS development builds)
let FinanceWidget = null;
try {
  FinanceWidget = require('../widgets/FinanceWidget').default;
} catch (e) {
  // Widget não disponível
}

const WIDGET_DATA_KEY = '@smartexpense_widget_data';
const NOTIFICATION_ID = 'smartexpense_summary';
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Serviço de Widget e Notificações do SmartExpense
 * 
 * Camadas:
 * 1. Quick Actions - cross-platform, funciona no Expo Go ✅
 * 2. Notificação Persistente - só development builds ❌ Expo Go
 * 3. Home Screen Widget - iOS development builds ❌ Expo Go
 */

class WidgetService {
  constructor() {
    this.isWidgetAvailable = !!FinanceWidget && !isExpoGo;
    this.isNotificationAvailable = !!Notifications && !isExpoGo;
  }

  /**
   * Atualiza os dados do widget e notificação
   */
  async updateWidgetData(data) {
    const widgetData = {
      balance: data.balance || '0,00',
      expenses: data.expenses || '0,00',
      income: data.income || '0,00',
      pendingBoletos: data.pendingBoletos || 0,
      nextInvoice: data.nextInvoice || '--',
      nextInvoiceValue: data.nextInvoiceValue || '0,00',
      currencySymbol: data.currencySymbol || 'R$',
      timestamp: Date.now(),
    };

    // Salva no AsyncStorage para persistência
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetData));

    // Atualiza widget iOS (se disponível e não for Expo Go)
    if (this.isWidgetAvailable && FinanceWidget) {
      try {
        FinanceWidget.updateSnapshot({
          balance: widgetData.balance,
          expenses: widgetData.expenses,
          income: widgetData.income,
          pendingBoletos: widgetData.pendingBoletos,
          nextInvoice: widgetData.nextInvoice,
          nextInvoiceValue: widgetData.nextInvoiceValue,
          currencySymbol: widgetData.currencySymbol,
        });
      } catch (e) {
        console.log('[Widget] Update error:', e.message);
      }
    }

    // Atualiza notificação persistente (se disponível e não for Expo Go)
    if (this.isNotificationAvailable && Notifications) {
      await this.updatePersistentNotification(widgetData);
    }
  }

  /**
   * Atualiza notificação persistente
   */
  async updatePersistentNotification(data) {
    try {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);

      const title = `${data.currencySymbol}${data.balance} — SmartExpense`;
      const body = `Despesas: ${data.currencySymbol}${data.expenses}  |  Receitas: ${data.currencySymbol}${data.income}`;

      let subtitle = '';
      if (data.pendingBoletos > 0) {
        subtitle = `${data.pendingBoletos} boleto${data.pendingBoletos > 1 ? 's' : ''} pendente${data.pendingBoletos > 1 ? 's' : ''}`;
      }

      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
          title,
          body,
          subtitle: subtitle || undefined,
          data: { type: 'summary', screen: 'Home' },
          sticky: Platform.OS === 'android',
          priority: Notifications.AndroidNotificationPriority?.DEFAULT,
        },
        trigger: null,
      });
    } catch (e) {
      console.log('[Widget] Notification error:', e.message);
    }
  }

  /**
   * Remove notificação persistente
   */
  async removePersistentNotification() {
    if (!this.isNotificationAvailable || !Notifications) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
    } catch (e) {
      console.log('[Widget] Remove notification error:', e.message);
    }
  }

  /**
   * Carrega dados salvos
   */
  async loadWidgetData() {
    try {
      const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }
}

export default new WidgetService();