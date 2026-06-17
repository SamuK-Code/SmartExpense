import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, getGreeting } from '../utils/helpers';
import CreditCard from '../components/CreditCard';
import TransactionItem from '../components/TransactionItem';
import Toast from '../components/Toast';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { cards, transactions, getBalance, getCardUsage, notifications } = useApp();
  const { colors, darkMode, toggleDarkMode } = useTheme();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const { income, expense, balance } = getBalance();
  const unreadCount = notifications.filter(n => !n.read).length;

  const recentTransactions = [...transactions].slice(-5).reverse();

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Configuracoes')}>
            <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleDarkMode}>
              <Ionicons name={darkMode ? 'sunny' : 'moon'} size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notificacoes')}>
              <Ionicons name="notifications" size={20} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance destacado */}
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Saldo em Caixa</Text>
          <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
        </View>

        {/* Greeting */}
        <View style={styles.greetingBox}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.greetingSub}>Aqui está seu resumo financeiro</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cards Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              <Ionicons name="card" size={18} color={colors.primary} />  Meus Cartões
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cartoes')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsScroll}>
            {cards.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.bgCard }]}>
                <Ionicons name="card" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhum cartão</Text>
              </View>
            ) : (
              cards.slice(0, 3).map(card => (
                <View key={card.id} style={{ marginRight: 12 }}>
                  <CreditCard card={card} used={getCardUsage(card.id)} compact />
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              <Ionicons name="time" size={18} color={colors.primary} />  Últimas Movimentações
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Historico')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsList}>
            {recentTransactions.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.bgCard }]}>
                <Ionicons name="receipt" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhuma movimentação</Text>
              </View>
            ) : (
              recentTransactions.map(t => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  colors={colors}
                  onPress={() => showToast('Toque longo para excluir', 'info')}
                />
              ))
            )}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <Toast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badge: { position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  balanceBox: { alignItems: 'center', marginTop: 8, marginBottom: 4 },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  balanceValue: { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
  greetingBox: { alignItems: 'center', marginTop: 12 },
  greetingText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  greetingSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  cardsScroll: { marginHorizontal: -4 },
  emptyCard: { width: 280, height: 160, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  transactionsList: { gap: 8 },
  emptyState: { padding: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, marginTop: 8 },
});

export default HomeScreen;