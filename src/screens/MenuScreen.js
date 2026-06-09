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
import { useI18n } from '../context/I18nContext';
import { FadeInView, SlideInView, ScaleInView } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';

export default function MenuScreen({ navigation }) {
  const { expenses, cards, deleteExpense, deleteCard, CATEGORIES, categoryLimits, setCategoryLimit } = useExpenses();
  const { colors, isDark, toggleTheme } = useTheme();
  const { cashBalance, updateCashBalance } = usePlanning();
  const { t } = useI18n();

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
📊 ${t('appName')} - ${t('summary')}

💰 ${t('total')}: ${formatCurrency(totalAmount)}
💳 ${t('cards')}: ${totalCards}
📝 ${t('transactions')}: ${totalExpenses}
💵 ${t('availableCash')}: ${formatCurrency(cashBalance)}

📅 ${new Date().toLocaleDateString('pt-BR')}
      `.trim();

      await Share.share({ message: summary });
    } catch (error) {
      Alert.alert(t('error'), t('shareError'));
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '⚠️ ' + t('clearData'),
      t('clearDataWarning'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clearAll'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('confirm'),
              t('clearDataConfirm'),
              [
                { text: t('no'), style: 'cancel' },
                {
                  text: t('yes') + ', ' + t('clear'),
                  style: 'destructive',
                  onPress: () => {
                    const expenseIds = expenses.map(e => e.id);
                    const cardIds = cards.map(c => c.id);
                    expenseIds.forEach(id => deleteExpense(id));
                    cardIds.forEach(id => deleteCard(id));
                    updateCashBalance(0);
                    Alert.alert(t('done'), t('dataCleared'));
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
      title: t('sound'),
      subtitle: soundEnabled ? t('enabled') : t('disabled'),
      action: 'toggleSound',
      color: colors.secondary,
    },
    {
      id: 'alerts',
      icon: alertsEnabled ? 'notifications' : 'notifications-off',
      title: t('alerts'),
      subtitle: alertsEnabled ? t('enabled') : t('disabled'),
      action: 'toggleAlerts',
      color: colors.info,
    },
    {
      id: 'theme',
      icon: isDark ? 'moon' : 'sunny',
      title: t('theme'),
      subtitle: isDark ? t('darkMode') : t('lightMode'),
      action: 'toggle',
      color: colors.primary,
    },
    {
      id: 'language',
      icon: 'language',
      title: t('language'),
      subtitle: t('selectLanguage'),
      action: 'navigate',
      screen: 'Language',
      color: colors.success,
    },
    {
      id: 'stats',
      icon: 'stats-chart',
      title: t('statistics'),
      subtitle: t('viewFullSummary'),
      action: 'stats',
      color: colors.info,
    },
    {
      id: 'share',
      icon: 'share-social',
      title: t('share'),
      subtitle: t('sendSummary'),
      action: 'share',
      color: colors.secondary,
    },
    {
      id: 'limits',
      icon: 'wallet',
      title: t('limits'),
      subtitle: t('configureBudget'),
      action: 'navigate',
      screen: 'Settings',
      color: colors.warning,
    },
    {
      id: 'export',
      icon: 'download',
      title: t('exportCSV'),
      subtitle: t('expenseSpreadsheet'),
      action: 'navigate',
      screen: 'Settings',
      color: colors.success,
    },
    {
      id: 'clear',
      icon: 'trash',
      title: t('clearData'),
      subtitle: t('deleteAll'),
      action: 'clear',
      color: colors.danger,
    },
    {
      id: 'about',
      icon: 'information-circle',
      title: t('about'),
      subtitle: t('appName') + ' v2.0',
      action: 'about',
      color: colors.primary,
    },
  ];

  const handleMenuPress = (item) => {
    switch (item.action) {
      case 'toggleSound': toggleSoundSetting(); break;
      case 'toggleAlerts': toggleAlerts(); break;
      case 'toggle': toggleTheme(); break;
      case 'stats': setStatsModalVisible(true); break;
      case 'share': handleShare(); break;
      case 'navigate': navigation.navigate(item.screen); break;
      case 'clear': handleClearData(); break;
      case 'about': setAboutModalVisible(true); break;
    }
  };

  const renderMenuItem = (item, index) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, { backgroundColor: colors.card }]}
      onPress={() => handleMenuPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
      </View>
      <View style={styles.menuInfo}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.menuSubtitle, { color: colors.textLight }]}>{item.subtitle}</Text>
      </View>
      {item.action === 'toggle' ? (
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor={isDark ? '#fff' : '#f4f3f4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('menu')} />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={true}
      >
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <FadeInView delay={100} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.danger + '15' }]}>
              <Ionicons name="cash-outline" size={20} color={colors.danger} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(totalAmount)}</Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>{t('totalSpent')}</Text>
          </FadeInView>

          <FadeInView delay={200} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="card-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalCards}</Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>{t('cards')}</Text>
          </FadeInView>

          <FadeInView delay={300} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.secondary + '15' }]}>
              <Ionicons name="receipt-outline" size={20} color={colors.secondary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalExpenses}</Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>{t('transactions')}</Text>
          </FadeInView>

          <FadeInView delay={400} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="wallet-outline" size={20} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(cashBalance)}</Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>{t('availableCash')}</Text>
          </FadeInView>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.textLight }]}>{t('options').toUpperCase()}</Text>
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </View>
      </ScrollView>

      {/* About Modal */}
      <Modal visible={aboutModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <ScaleInView style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.aboutIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="card" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.aboutTitle, { color: colors.text }]}>{t('appName')}</Text>
            <Text style={[styles.aboutVersion, { color: colors.textLight }]}>v2.0.0</Text>
            <Text style={[styles.aboutText, { color: colors.textLight }]}>{t('appDescription')}</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => setAboutModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </ScaleInView>
        </View>
      </Modal>

      {/* Stats Modal */}
      <Modal visible={statsModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <SlideInView style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('statistics')}</Text>

            <View style={styles.statRow}>
              <Text style={[styles.statRowLabel, { color: colors.textLight }]}>{t('totalExpenses')}</Text>
              <Text style={[styles.statRowValue, { color: colors.text }]}>{totalExpenses}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statRowLabel, { color: colors.textLight }]}>{t('totalAmount')}</Text>
              <Text style={[styles.statRowValue, { color: colors.text }]}>{formatCurrency(totalAmount)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statRowLabel, { color: colors.textLight }]}>{t('avgExpense')}</Text>
              <Text style={[styles.statRowValue, { color: colors.text }]}>{formatCurrency(avgExpense)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statRowLabel, { color: colors.textLight }]}>{t('cards')}</Text>
              <Text style={[styles.statRowValue, { color: colors.text }]}>{totalCards}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statRowLabel, { color: colors.textLight }]}>{t('cardExpensesCount')}</Text>
              <Text style={[styles.statRowValue, { color: colors.text }]}>{cardExpensesCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statRowLabel, { color: colors.textLight }]}>{t('standaloneCount')}</Text>
              <Text style={[styles.statRowValue, { color: colors.text }]}>{standaloneCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statRowLabel, { color: colors.textLight }]}>{t('availableCash')}</Text>
              <Text style={[styles.statRowValue, { color: colors.text }]}>{formatCurrency(cashBalance)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary, marginTop: 16 }]}
              onPress={() => setStatsModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </SlideInView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { width: '47%', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 11 },
  menuSection: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600' },
  menuSubtitle: { fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 340, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  aboutIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  aboutTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  aboutVersion: { fontSize: 14, marginBottom: 16 },
  aboutText: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, alignSelf: 'flex-start' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  statRowLabel: { fontSize: 14 },
  statRowValue: { fontSize: 14, fontWeight: 'bold' },
  modalButton: { width: '100%', padding: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
