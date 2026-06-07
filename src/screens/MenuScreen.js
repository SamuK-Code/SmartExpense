import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Switch,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { safeGetItem, safeSetItem, STORAGE_KEYS } from '../utils/SafeStorage';
import { playClick, toggleSound, isSoundEnabled } from '../utils/SoundManager';
import { useTheme } from '../context/ThemeContext';
import { usePlanning } from '../context/PlanningContext';
import { FadeInView, SlideInView, ScaleInView } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';

export default function MenuScreen({ navigation }) {
  const { expenses, cards, deleteExpense, deleteCard, CATEGORIES, categoryLimits, setCategoryLimit } = useExpenses();
  const { colors, isDark, toggleTheme } = useTheme();
  const { cashBalance, updateCashBalance } = usePlanning();
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const alerts = await safeGetItem(STORAGE_KEYS.ALERTS_ENABLED, true);
      const sound = await safeGetItem(STORAGE_KEYS.SOUND_ENABLED, true);
      setAlertsEnabled(alerts);
      setSoundEnabled(sound);
      toggleSound(sound);
    };
    loadSettings();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Calculate stats
  const totalExpenses = expenses.length;
  const totalCards = cards.length;
  const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const avgExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;
  const standaloneCount = expenses.filter(e => !e.cardId).length;
  const cardExpensesCount = expenses.filter(e => e.cardId).length;

  const toggleSoundSetting = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    toggleSound(newValue);
    await safeSetItem(STORAGE_KEYS.SOUND_ENABLED, newValue);
    if (newValue) playClick();
  };

  const toggleAlerts = async () => {
    const newValue = !alertsEnabled;
    setAlertsEnabled(newValue);
    await safeSetItem(STORAGE_KEYS.ALERTS_ENABLED, newValue);
  };

  const handleShare = async () => {
    try {
      const summary = `
📊 Resumo - Controle de Gastos

💰 Total em gastos: ${formatCurrency(totalAmount)}
💳 Cartões cadastrados: ${totalCards}
📝 Total de transações: ${totalExpenses}
💵 Valor em caixa: ${formatCurrency(cashBalance)}

📅 Gerado em: ${new Date().toLocaleDateString('pt-BR')}
      `.trim();

      await Share.share({ message: summary });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '⚠️ Limpar todos os dados',
      'Tem certeza? Esta ação não pode ser desfeita!',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar Tudo',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmação',
              'Todos os gastos, cartões e metas serão apagados. Continuar?',
              [
                { text: 'Não', style: 'cancel' },
                {
                  text: 'Sim, limpar',
                  style: 'destructive',
                  onPress: () => {
                    // Clear all data
                    const expenseIds = expenses.map(e => e.id);
                    const cardIds = cards.map(c => c.id);
                    expenseIds.forEach(id => deleteExpense(id));
                    cardIds.forEach(id => deleteCard(id));
                    updateCashBalance(0);
                    Alert.alert('Concluído', 'Todos os dados foram removidos');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      id: 'sound',
      icon: soundEnabled ? 'volume-high' : 'volume-mute',
      title: 'Sons',
      subtitle: soundEnabled ? 'Ativados' : 'Desativados',
      action: 'toggleSound',
      color: colors.secondary,
    },
    {
      id: 'alerts',
      icon: alertsEnabled ? 'notifications' : 'notifications-off',
      title: 'Alertas',
      subtitle: alertsEnabled ? 'Ativados' : 'Desativados',
      action: 'toggleAlerts',
      color: colors.info,
    },
    {
      id: 'theme',
      icon: isDark ? 'moon' : 'sunny',
      title: 'Tema',
      subtitle: isDark ? 'Modo Escuro' : 'Modo Claro',
      action: 'toggle',
      color: colors.primary,
    },
    {
      id: 'stats',
      icon: 'stats-chart',
      title: 'Estatísticas',
      subtitle: 'Ver resumo completo',
      action: 'stats',
      color: colors.info,
    },
    {
      id: 'share',
      icon: 'share-social',
      title: 'Compartilhar',
      subtitle: 'Enviar resumo',
      action: 'share',
      color: colors.secondary,
    },
    {
      id: 'limits',
      icon: 'wallet',
      title: 'Limites',
      subtitle: 'Configurar orçamento',
      action: 'navigate',
      screen: 'Settings',
      color: colors.warning,
    },
    {
      id: 'export',
      icon: 'download',
      title: 'Exportar CSV',
      subtitle: 'Planilha de gastos',
      action: 'navigate',
      screen: 'Settings',
      color: colors.success,
    },
    {
      id: 'clear',
      icon: 'trash',
      title: 'Limpar Dados',
      subtitle: 'Apagar tudo',
      action: 'clear',
      color: colors.danger,
    },
    {
      id: 'about',
      icon: 'information-circle',
      title: 'Sobre',
      subtitle: 'Controle de Gastos v2.0',
      action: 'about',
      color: colors.primary,
    },
  ];

  const handleMenuPress = (item) => {
    switch (item.action) {
      case 'toggleSound':
        toggleSoundSetting();
        break;
      case 'toggleAlerts':
        toggleAlerts();
        break;
      case 'toggle':
        toggleTheme();
        break;
      case 'stats':
        setStatsModalVisible(true);
        break;
      case 'share':
        handleShare();
        break;
      case 'navigate':
        navigation.navigate(item.screen);
        break;
      case 'clear':
        handleClearData();
        break;
      case 'about':
        setAboutModalVisible(true);
        break;
    }
  };

  const renderMenuItem = (item, index) => (
    <SlideInView key={item.id} delay={index * 80}>
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.card }]}
        onPress={() => handleMenuPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.color + (isDark ? '25' : '20') }]}>
          <Ionicons name={item.icon} size={22} color={item.color} />
        </View>
        <View style={styles.menuInfo}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
        </View>
        {item.action === 'toggle' ? (
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={isDark ? colors.primary : '#f4f3f4'}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        )}
      </TouchableOpacity>
    </SlideInView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Menu" />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Quick Stats Cards */}
        <FadeInView>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.danger + '20' }]}>
                <Ionicons name="cash-outline" size={20} color={colors.danger} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(totalAmount)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Gasto</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="card-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{totalCards}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Cartões</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.info + '20' }]}>
                <Ionicons name="receipt-outline" size={20} color={colors.info} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{totalExpenses}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gastos</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
                <Ionicons name="wallet-outline" size={20} color={colors.warning} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(cashBalance)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Caixa</Text>
            </View>
          </View>
        </FadeInView>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>OPÇÕES</Text>
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </View>
      </ScrollView>

      {/* About Modal */}
      <Modal visible={aboutModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScaleInView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.aboutIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="wallet" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.aboutTitle, { color: colors.text }]}>Controle de Gastos</Text>
              <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>Versão 2.0.0</Text>
              <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
                {`Aplicativo para controle financeiro pessoal.
                Gerencie cartões, boletos e acompanhe seus gastos de forma simples.`}
              </Text>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setAboutModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </ScaleInView>
        </View>
      </Modal>

      {/* Stats Modal */}
      <Modal visible={statsModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScaleInView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Estatísticas</Text>

              <View style={styles.statRow}>
                <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>Total de Gastos</Text>
                <Text style={[styles.statRowValue, { color: colors.text }]}>{totalExpenses}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>Valor Total</Text>
                <Text style={[styles.statRowValue, { color: colors.danger }]}>{formatCurrency(totalAmount)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>Média por Gasto</Text>
                <Text style={[styles.statRowValue, { color: colors.text }]}>{formatCurrency(avgExpense)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>Cartões</Text>
                <Text style={[styles.statRowValue, { color: colors.text }]}>{totalCards}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>Gastos no Cartão</Text>
                <Text style={[styles.statRowValue, { color: colors.text }]}>{cardExpensesCount}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>Boletos/Avulsos</Text>
                <Text style={[styles.statRowValue, { color: colors.info }]}>{standaloneCount}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>Caixa Atual</Text>
                <Text style={[styles.statRowValue, { color: colors.primary }]}>{formatCurrency(cashBalance)}</Text>
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary, marginTop: 16 }]}
                onPress={() => setStatsModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </ScaleInView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
  },

  // Menu Section
  menuSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  aboutIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statRowLabel: {
    fontSize: 14,
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalButton: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
