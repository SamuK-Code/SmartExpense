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
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { FadeInView, SlideInView } from '../components/AnimatedComponents';

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
  const { colors, isDark } = useTheme();
  const { t } = useI18n();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGroup = useCallback(async () => {
    if (!groupName.trim()) {
      Alert.alert(t('error'), 'Digite um nome para o grupo');
      return;
    }

    if (!user) {
      Alert.alert(t('error'), 'Você precisa estar logado para criar um grupo');
      return;
    }

    setIsLoading(true);

    try {
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
          `Código: ${result.group.invite_code}

Compartilhe com quem quiser adicionar.`,
          [
            {
              text: 'Copiar',
              onPress: async () => {
                await Clipboard.setStringAsync(result.group.invite_code);
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
        setShowCreateModal(false);
        setGroupName('');
        setGroupDescription('');
      } else {
        Alert.alert(t('error'), result.error || 'Erro ao criar grupo');
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert(t('error'), 'Erro inesperado ao criar grupo');
      console.error(error);
    }
  }, [groupName, groupDescription, createGroup, user, t]);

  const handleJoinGroup = useCallback(async () => {
    if (!inviteCode.trim()) {
      Alert.alert(t('error'), 'Digite o código de convite');
      return;
    }

    if (!user) {
      Alert.alert(t('error'), 'Você precisa estar logado para entrar em um grupo');
      return;
    }

    setIsLoading(true);

    try {
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
        Alert.alert(t('error'), result.error || 'Erro ao entrar no grupo');
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert(t('error'), 'Erro inesperado ao entrar no grupo');
      console.error(error);
    }
  }, [inviteCode, joinGroup, user, t]);

  const handleShareCode = useCallback(async (code, groupName) => {
    try {
      await Share.share({
        message: `Entre no grupo "${groupName}" no Check Finances!

Código: ${code}

Baixe o app e sincronize as finanças juntos.`,
      });
    } catch {
      await Clipboard.setStringAsync(code);
      Alert.alert('Copiado!', 'Código copiado para área de transferência.');
    }
  }, []);

  const handleLeaveGroup = useCallback((group) => {
    Alert.alert(
      'Sair do Grupo',
      `Deseja sair de "${group.name}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            const result = await leaveGroup(group.id);
            setIsLoading(false);
            if (!result.success) Alert.alert(t('error'), result.error);
          },
        },
      ]
    );
  }, [leaveGroup, t]);

  const renderGroupItem = useCallback(({ item }) => {
    const isActive = activeGroup?.id === item.id;
    const isAdmin = item.created_by === user?.id;
    const memberCount = item.members_count || 1;

    return (
      <TouchableOpacity
        style={[
          styles.groupCard,
          { backgroundColor: colors.card, borderColor: isActive ? colors.primary : colors.border }
        ]}
        onPress={() => selectActiveGroup(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.groupHeader}>
          <View style={[styles.groupIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="people" size={24} color={colors.primary} />
          </View>
          <View style={styles.groupInfo}>
            <Text style={[styles.groupName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.groupMeta, { color: colors.textSecondary }]}>
              {memberCount} {memberCount === 1 ? 'membro' : 'membros'} • {isAdmin ? 'Admin' : 'Membro'}
            </Text>
          </View>
          {isActive && (
            <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.activeBadgeText}>ATIVO</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          {isAdmin && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
              onPress={() => handleShareCode(item.invite_code, item.name)}
            >
              <Ionicons name="share-outline" size={16} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>Convite</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.danger + '15' }]}
            onPress={() => handleLeaveGroup(item)}
          >
            <Ionicons name="exit-outline" size={16} color={colors.danger} />
            <Text style={[styles.actionButtonText, { color: colors.danger }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [activeGroup, user, colors, selectActiveGroup, handleShareCode, handleLeaveGroup]);

  const syncStatusConfig = {
    syncing: { text: '🔄 Sincronizando...', color: colors.info },
    synced: { text: '✅ Sincronizado', color: colors.success },
    error: { text: '❌ Erro', color: colors.danger },
    idle: { text: '⏸️ Inativo', color: colors.textLight },
  };
  const statusConfig = syncStatusConfig[syncStatus] || syncStatusConfig.idle;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Grupos</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Conta Casal & Sincronização
          </Text>
        </View>

        {/* Sync Status */}
        {activeGroup && (
          <View style={[styles.syncStatusBar, { backgroundColor: colors.card }]}>
            <View style={styles.syncStatusLeft}>
              <Ionicons name="sync" size={16} color={statusConfig.color} />
              <Text style={[styles.syncStatusText, { color: statusConfig.color }]}>
                {statusConfig.text}
              </Text>
            </View>
            {lastSyncTime && (
              <Text style={[styles.syncTimeText, { color: colors.textLight }]}>
                {new Date(lastSyncTime).toLocaleTimeString()}
              </Text>
            )}
          </View>
        )}

        {/* Groups List */}
        {groupLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando...</Text>
          </View>
        ) : groups.length > 0 ? (
          <View style={styles.listContainer}>
            {groups.map(item => (
              <View key={item.id}>
                {renderGroupItem({ item })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="people-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum grupo</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {'Crie um grupo para sincronizar finanças com alguém.Perfeito para casais! 💑'}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={[styles.fabSecondary, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowJoinModal(true)}
          >
            <Ionicons name="link-outline" size={20} color={colors.text} />
            <Text style={[styles.fabText, { color: colors.text }]}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={[styles.fabText, { color: '#fff' }]}>Criar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Criar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCreateModal}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Criar Grupo</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Crie um grupo para sincronizar finanças
            </Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Nome do grupo"
              placeholderTextColor={colors.textLight}
              value={groupName}
              onChangeText={setGroupName}
            />
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Descrição (opcional)"
              placeholderTextColor={colors.textLight}
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={2}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: colors.textLight }]}
                onPress={() => { setShowCreateModal(false); setGroupName(''); setGroupDescription(''); }}
              >
                <Text style={[styles.modalButtonTextSecondary, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
                onPress={handleCreateGroup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
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
        animationType="slide"
        transparent={true}
        visible={showJoinModal}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Entrar no Grupo</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Peça o código de convite
            </Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Código de convite"
              placeholderTextColor={colors.textLight}
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={8}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { backgroundColor: colors.textLight }]}
                onPress={() => { setShowJoinModal(false); setInviteCode(''); }}
              >
                <Text style={[styles.modalButtonTextSecondary, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
                onPress={handleJoinGroup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Entrar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  syncStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  syncStatusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncStatusText: { fontSize: 13, fontWeight: '600' },
  syncTimeText: { fontSize: 11 },
  listContainer: { gap: 12 },
  groupCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 18, fontWeight: 'bold' },
  groupMeta: { fontSize: 13, marginTop: 2 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonText: { fontSize: 13, fontWeight: '600' },
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 14, marginTop: 12 },
  fabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1,
    gap: 8,
  },
  fabText: { fontSize: 14, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, marginBottom: 20 },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  modalInputMultiline: { height: 70, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondary: {},
  modalButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  modalButtonTextSecondary: { fontSize: 15, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
});

export default GroupScreen;