import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';

const GroupScreen = () => {
  const { user } = useAuth();
  const {
    groups,
    activeGroup,
    createGroup,
    joinGroup,
    leaveGroup,
    selectActiveGroup,
    syncStatus,
    lastSyncTime,
    isLoading: groupLoading,
  } = useGroup();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGroup = useCallback(async () => {
    if (!groupName.trim()) {
      Alert.alert('Atenção', 'Digite um nome para o grupo');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para criar um grupo');
      return;
    }

    setIsLoading(true);
    
    // ✅ CORREÇÃO: Passa os parâmetros na ordem correta
    const result = await createGroup(
      groupName.trim(),
      groupDescription.trim(),
      user.id,
      user.username,
      user.displayName || user.username
    );
    
    setIsLoading(false);

    if (result.success) {
      Alert.alert(
        'Grupo Criado!',
        `Código: ${result.group.invite_code}\n\nCompartilhe com quem quiser adicionar.`,
        [
          {
            text: 'Copiar',
            onPress: () => {
              Clipboard.setString(result.group.invite_code);
            },
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
      setShowCreateModal(false);
      setGroupName('');
      setGroupDescription('');
    } else {
      Alert.alert('Erro', result.error);
    }
  }, [groupName, groupDescription, createGroup, user]);

  const handleJoinGroup = useCallback(async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Atenção', 'Digite o código de convite');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para entrar em um grupo');
      return;
    }

    setIsLoading(true);
    
    // ✅ CORREÇÃO: Passa os parâmetros na ordem correta
    const result = await joinGroup(
      inviteCode.trim().toUpperCase(),
      user.id,
      user.username,
      user.displayName || user.username
    );
    
    setIsLoading(false);

    if (result.success) {
      Alert.alert('Sucesso!', `Você entrou no grupo "${result.group.name}"`);
      setShowJoinModal(false);
      setInviteCode('');
    } else {
      Alert.alert('Erro', result.error);
    }
  }, [inviteCode, joinGroup, user]);

  const handleShareCode = useCallback(async (code, groupName) => {
    try {
      await Share.share({
        message: `Entre no grupo "${groupName}" no Check Finances!\n\nCódigo: ${code}\n\nBaixe o app e sincronize as finanças juntos.`,
      });
    } catch {
      Clipboard.setString(code);
      Alert.alert('Copiado!', 'Código copiado para área de transferência.');
    }
  }, []);

  const handleLeaveGroup = useCallback((group) => {
    Alert.alert(
      'Sair do Grupo',
      `Deseja sair de "${group.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            const result = await leaveGroup(group.id);
            setIsLoading(false);
            if (!result.success) Alert.alert('Erro', result.error);
          },
        },
      ]
    );
  }, [leaveGroup]);

  const renderGroupItem = useCallback(({ item }) => {
    const isActive = activeGroup?.id === item.id;
    const isAdmin = item.created_by === user?.id;
    const memberCount = item.members_count || 1;

    return (
      <TouchableOpacity
        style={[
          styles.groupCard,
          isActive && styles.groupCardActive,
        ]}
        onPress={() => selectActiveGroup(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.groupHeader}>
          <View style={styles.groupIcon}>
            <Text style={styles.groupIconText}>👥</Text>
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupMeta}>
              {memberCount} {memberCount === 1 ? 'membro' : 'membros'} • {isAdmin ? 'Admin' : 'Membro'}
            </Text>
          </View>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ATIVO</Text>
            </View>
          )}
        </View>

        {isAdmin && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShareCode(item.invite_code, item.name)}
          >
            <Text style={styles.actionButtonText}>📋 Convite</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.leaveButton]}
          onPress={() => handleLeaveGroup(item)}
        >
          <Text style={[styles.actionButtonText, styles.leaveText]}>🚪 Sair</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [activeGroup, user, selectActiveGroup, handleShareCode, handleLeaveGroup]);

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing': return '🔄 Sincronizando...';
      case 'synced': return '✅ Sincronizado';
      case 'error': return '❌ Erro';
      default: return '⏸️ Inativo';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grupos</Text>
        <Text style={styles.headerSubtitle}>Conta Casal & Sincronização</Text>
      </View>

      {activeGroup && (
        <View style={styles.syncStatusBar}>
          <Text style={styles.syncStatusText}>{getSyncStatusText()}</Text>
          {lastSyncTime && (
            <Text style={styles.syncTimeText}>
              {new Date(lastSyncTime).toLocaleTimeString()}
            </Text>
          )}
        </View>
      )}

      {groupLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#58a6ff" />
        </View>
      ) : groups.length > 0 ? (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>Nenhum grupo</Text>
          <Text style={styles.emptyText}>
            Crie um grupo para sincronizar finanças com alguém.{'\n'}Perfeito para casais! 💑
          </Text>
        </View>
      )}

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => setShowJoinModal(true)}
        >
          <Text style={styles.fabText}>🔗 Entrar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.fabText}>➕ Criar</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Criar */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Grupo</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome do grupo"
              placeholderTextColor="#8b949e"
              value={groupName}
              onChangeText={setGroupName}
            />
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              placeholder="Descrição (opcional)"
              placeholderTextColor="#8b949e"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, isLoading && styles.buttonDisabled]}
                onPress={handleCreateGroup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Criar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Entrar */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Entrar no Grupo</Text>
            <Text style={styles.modalSubtitle}>Peça o código de convite</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="CÓDIGO"
              placeholderTextColor="#8b949e"
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={8}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, isLoading && styles.buttonDisabled]}
                onPress={handleJoinGroup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Entrar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#161b22', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#8b949e', marginTop: 4 },
  syncStatusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#21262d' },
  syncStatusText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  syncTimeText: { color: '#484f58', fontSize: 11 },
  listContent: { padding: 16 },
  groupCard: { backgroundColor: '#161b22', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  groupCardActive: { borderColor: '#58a6ff' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  groupIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#21262d', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupIconText: { fontSize: 24 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  groupMeta: { fontSize: 13, color: '#8b949e', marginTop: 2 },
  activeBadge: { backgroundColor: '#58a6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, backgroundColor: '#21262d', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  actionButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  leaveButton: { backgroundColor: 'rgba(248, 81, 73, 0.15)' },
  leaveText: { color: '#f85149' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#8b949e', textAlign: 'center', lineHeight: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fabContainer: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, gap: 12 },
  fab: { backgroundColor: '#58a6ff', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 28 },
  fabSecondary: { backgroundColor: '#21262d' },
  fabText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#161b22', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#8b949e', marginBottom: 20 },
  modalInput: { backgroundColor: '#0d1117', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#fff', marginBottom: 12, borderWidth: 1, borderColor: '#30363d' },
  modalInputMultiline: { height: 70, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: { flex: 1, backgroundColor: '#58a6ff', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonSecondary: { backgroundColor: '#21262d' },
  modalButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  modalButtonTextSecondary: { color: '#c9d1d9', fontSize: 15, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
});

export default GroupScreen;
