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
} from 'react-native';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import SupabaseService from '../services/SupabaseService';

const SyncScreen = () => {
  const { user } = useAuth();
  const { activeGroup, syncStatus, lastSyncTime } = useGroup();
  const { expenses, cards, categories, cashTransactions, syncWithGroup } = useExpenses();
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const handleManualSync = useCallback(async () => {
    if (!activeGroup) {
      Alert.alert('Atenção', 'Selecione um grupo primeiro');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para sincronizar');
      return;
    }

    setIsSyncing(true);
    try {
      // ✅ CORREÇÃO: Chama o sync real do ExpenseContext
      await syncWithGroup();
      Alert.alert('Sincronizado!', 'Dados sincronizados com sucesso.');
    } catch (error) {
      console.error('[SyncScreen] Erro na sincronização:', error);
      Alert.alert('Erro', 'Falha na sincronização. Tente novamente.');
    } finally {
      setIsSyncing(false);
    }
  }, [activeGroup, user, syncWithGroup]);

  const handleToggleAutoSync = useCallback((value) => {
    setAutoSync(value);
    // Aqui você pode salvar a preferência no AsyncStorage
  }, []);

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing': return '🔄 Sincronizando...';
      case 'synced': return '✅ Sincronizado';
      case 'error': return '❌ Erro';
      default: return '⏸️ Inativo';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'syncing': return '#58a6ff';
      case 'synced': return '#23c55e';
      case 'error': return '#f85149';
      default: return '#8b949e';
    }
  };

  if (!activeGroup) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sincronização</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📡</Text>
          <Text style={styles.emptyTitle}>Sem grupo ativo</Text>
          <Text style={styles.emptyText}>Entre ou crie um grupo primeiro</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sincronização</Text>
        <Text style={styles.headerSubtitle}>Grupo: {activeGroup.name}</Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor() }]}>
              {getSyncStatusText()}
            </Text>
          </View>
        </View>
        {lastSyncTime && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Última sync</Text>
            <Text style={styles.statusValue}>
              {new Date(lastSyncTime).toLocaleString('pt-BR')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Configurações</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-sync</Text>
            <Text style={styles.settingDesc}>Sincroniza automaticamente ao alterar dados</Text>
          </View>
          <Switch
            value={autoSync}
            onValueChange={handleToggleAutoSync}
            trackColor={{ false: '#30363d', true: '#58a6ff' }}
            thumbColor={autoSync ? '#fff' : '#8b949e'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Ações</Text>
        <TouchableOpacity
          style={[styles.actionButton, isSyncing && styles.buttonDisabled]}
          onPress={handleManualSync}
          disabled={isSyncing}
        >
          <Text style={styles.actionIcon}>🔄</Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Text>
            <Text style={styles.actionDesc}>Envia e recebe dados do grupo</Text>
          </View>
          {isSyncing && <ActivityIndicator color="#58a6ff" />}
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Como funciona?</Text>
        <Text style={styles.infoText}>
          Quando alguém do grupo adiciona uma despesa, ela aparece para todos automaticamente.{'\n\n'}
          Use o mesmo código de convite em todos os dispositivos.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#161b22', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#8b949e', marginTop: 4 },
  statusCard: { backgroundColor: '#161b22', margin: 16, padding: 16, borderRadius: 16 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  statusLabel: { color: '#8b949e', fontSize: 14 },
  statusValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161b22', padding: 16, borderRadius: 12, marginBottom: 16 },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: { fontSize: 16, color: '#fff', fontWeight: '600', marginBottom: 4 },
  settingDesc: { fontSize: 12, color: '#8b949e' },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161b22', padding: 16, borderRadius: 12, marginBottom: 8 },
  actionIcon: { fontSize: 24, marginRight: 12 },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, color: '#fff', fontWeight: '600' },
  actionDesc: { fontSize: 12, color: '#8b949e', marginTop: 2 },
  buttonDisabled: { opacity: 0.5 },
  infoBox: { backgroundColor: '#21262d', margin: 16, padding: 16, borderRadius: 12, marginBottom: 40 },
  infoTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  infoText: { color: '#8b949e', fontSize: 13, lineHeight: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#8b949e', textAlign: 'center' },
});

export default SyncScreen;
