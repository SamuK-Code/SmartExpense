import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';

const SyncScreen = () => {
  const { user } = useAuth();
  const { activeGroup, syncStatus, lastSyncTime } = useGroup();
  const { syncWithGroup } = useExpenses();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const handleManualSync = useCallback(async () => {
    if (!activeGroup) {
      Alert.alert(t('warning'), 'Selecione um grupo primeiro');
      return;
    }

    if (!user) {
      Alert.alert(t('error'), 'Você precisa estar logado para sincronizar');
      return;
    }

    setIsSyncing(true);
    try {
      await syncWithGroup();
      Alert.alert(t('success'), 'Dados sincronizados com sucesso.');
    } catch (error) {
      console.error('[SyncScreen] Erro na sincronização:', error);
      Alert.alert(t('error'), 'Falha na sincronização. Tente novamente.');
    } finally {
      setIsSyncing(false);
    }
  }, [activeGroup, user, syncWithGroup, t]);

  const handleToggleAutoSync = useCallback((value) => {
    setAutoSync(value);
  }, []);

  const syncStatusConfig = {
    syncing: { text: 'Sincronizando...', color: colors.info, icon: 'sync' },
    synced: { text: 'Sincronizado', color: colors.success, icon: 'checkmark-circle' },
    error: { text: 'Erro', color: colors.danger, icon: 'alert-circle' },
    idle: { text: 'Inativo', color: colors.textLight, icon: 'pause-circle' },
  };

  const statusConfig = syncStatusConfig[syncStatus] || syncStatusConfig.idle;

  if (!activeGroup) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Sincronização</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Sincronize seus dados entre dispositivos
            </Text>
          </View>

          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.info + '15' }]}>
              <Ionicons name="wifi-outline" size={48} color={colors.info} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sem grupo ativo</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Entre ou crie um grupo primeiro para sincronizar seus dados.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Sincronização</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Grupo: {activeGroup.name}
          </Text>
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
              <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                {statusConfig.text}
              </Text>
            </View>
          </View>

          {lastSyncTime && (
            <View style={[styles.statusRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Última sync</Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>
                {new Date(lastSyncTime).toLocaleString('pt-BR')}
              </Text>
            </View>
          )}
        </View>

        {/* Settings Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>⚙️ Configurações</Text>

        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Auto-sync</Text>
            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
              Sincroniza automaticamente ao alterar dados
            </Text>
          </View>
          <Switch
            value={autoSync}
            onValueChange={handleToggleAutoSync}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={autoSync ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Actions Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🚀 Ações</Text>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={handleManualSync}
          disabled={isSyncing}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="sync" size={22} color={colors.primary} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
              Envia e recebe dados do grupo
            </Text>
          </View>
          {isSyncing && <ActivityIndicator size="small" color={colors.primary} />}
        </TouchableOpacity>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.info} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>Como funciona?</Text>
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {'Quando alguém do grupo adiciona uma despesa, ela aparece para todos automaticamente.'}
            Use o mesmo código de convite em todos os dispositivos.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: {
    padding: 20,
    paddingTop: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  statusCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusLabel: { fontSize: 14 },
  statusValue: { fontSize: 14, fontWeight: '600' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, marginTop: 8 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  settingDesc: { fontSize: 12 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600' },
  actionDesc: { fontSize: 12, marginTop: 2 },
  buttonDisabled: { opacity: 0.5 },
  infoBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: { fontSize: 15, fontWeight: 'bold' },
  infoText: { fontSize: 13, lineHeight: 20 },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 20 },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

export default SyncScreen;