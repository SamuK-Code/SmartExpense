// CircleHubScreen.js — Hub de Gerenciamento de Círculos Financeiros
// Substitui GroupScreen.js — Agora é APENAS o controlador de permissões e gestão
// Features: Múltiplos círculos, troca rápida, permissões por item, log de atividade

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useCircle } from '../context/CircleContext';
import ModalContent from '../components/ModalKeyboardSafe';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';

export default function CircleHubScreen() {
  const insets = useSafeAreaInsets();
  const { colors, darkMode } = useTheme();
  const { t } = useTranslate();

  const {
    cards,
    transactions,
    goals,
    categories,
  } = useApp();

  const {
    // Auth
    currentUser,
    isLoading,
    login,
    register,
    logout,

    // Circles
    currentCircle,
    myCircles,
    circleMembers,
    createCircle,
    joinCircle,
    leaveCircle,
    switchCircle,
    generateNewInviteCode,
    updateCircleName,
    fetchCircleMembers,

    // Sharing
    shareItem,
    unshareItem,
    shareAllItems,
    syncWithCircle,
    lastSync,
    isSyncing,

    // Shared data received
    sharedCards,
    sharedTransactions,
    sharedGoals,

    // Activity
    activityLog,
    unreadActivityCount,
    markActivityAsRead,
  } = useCircle();

  // ─── Local State ───
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [circleName, setCircleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [activeTab, setActiveTab] = useState('circles'); // circles | permissions | activity
  const [selectedCircleForPermissions, setSelectedCircleForPermissions] = useState(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareType, setShareType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activityModalVisible, setActivityModalVisible] = useState(false);

  // ─── NEW: Edit Circle Name State ───
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [editCircleName, setEditCircleName] = useState('');

  // ─── HELPERS ───

  const formatDate = (dateString) => {
    if (!dateString) return t('common.never');
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── AUTH HANDLERS ───

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('common.fillRequired'));
      return;
    }
    const result = await login(username.trim(), password);
    if (!result.success) {
      Alert.alert(t('common.error'), result.error || t('common.loginFailed'));
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('common.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('common.passwordMismatch'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('common.passwordMinLength'));
      return;
    }
    const result = await register(username.trim(), password);
    if (result.success) {
      Alert.alert(t('common.success'), t('common.accountCreated'));
      setAuthMode('login');
      setPassword('');
      setConfirmPassword('');
    } else {
      Alert.alert(t('common.error'), result.error || t('common.registerFailed'));
    }
  };

  // ─── CIRCLE HANDLERS ───

  const handleCreateCircle = async () => {
    if (!circleName.trim()) {
      Alert.alert(t('common.error'), t('common.enterGroupName'));
      return;
    }
    const result = await createCircle(circleName.trim());
    if (result.success) {
      Alert.alert(
        t('common.success'),
        `${t('groups.groupCreated') || 'Círculo criado!'}\n\n${t('groups.inviteCode') || 'Código'}: ${result.inviteCode}`
      );
      setCircleName('');
    } else {
      Alert.alert(t('common.error'), result.error || t('common.createGroupFailed'));
    }
  };

  const handleJoinCircle = async () => {
    if (!inviteCode.trim()) {
      Alert.alert(t('common.error'), t('common.fillRequired'));
      return;
    }
    const result = await joinCircle(inviteCode.trim().toUpperCase());
    if (result.success) {
      Alert.alert(t('common.success'), t('groups.joinedGroup') || 'Você entrou no círculo!');
      setInviteCode('');
    } else {
      Alert.alert(t('common.error'), result.error || t('common.invalidCode'));
    }
  };

  const handleLeaveCircle = (circleId) => {
    Alert.alert(
      t('common.leaveGroup') || 'Sair do Círculo',
      t('common.leaveGroupConfirm') || 'Tem certeza? Seus dados compartilhados serão removidos.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.logout') || 'Sair',
          style: 'destructive',
          onPress: async () => {
            const result = await leaveCircle(circleId);
            if (!result.success) {
              Alert.alert(t('common.error'), result.error || t('common.leaveFailed'));
            }
          },
        },
      ]
    );
  };

  const handleSwitchCircle = async (circleId) => {
    const result = await switchCircle(circleId);
    if (result.success) {
      // Sync automático ao trocar
      await syncWithCircle();
    }
  };

  const handleGenerateNewCode = async () => {
    const result = await generateNewInviteCode();
    if (result.success) {
      Alert.alert(
        t('common.newCodeGenerated') || 'Novo Código',
        `${t('groups.inviteCode')}: ${result.inviteCode}`
      );
    }
  };

  // ─── NEW: COPY INVITE CODE ───
  const handleCopyCode = async () => {
    if (!currentCircle?.inviteCode) return;
    try {
      await Clipboard.setStringAsync(currentCircle.inviteCode);
      Alert.alert(
        t('common.success') || 'Sucesso',
        'Código copiado para a área de transferência!'
      );
    } catch (e) {
      Alert.alert(t('common.error'), 'Não foi possível copiar o código');
    }
  };

  // ─── NEW: EDIT CIRCLE NAME ───
  const openEditNameModal = () => {
    if (!currentCircle) return;
    if (currentCircle.myRole !== 'admin') {
      Alert.alert(t('common.error'), 'Apenas administradores podem editar o nome');
      return;
    }
    setEditCircleName(currentCircle.name);
    setEditNameModalVisible(true);
  };

  const handleUpdateCircleName = async () => {
    if (!editCircleName.trim() || !currentCircle) return;
    const result = await updateCircleName(currentCircle.id, editCircleName.trim());
    if (result.success) {
      setEditNameModalVisible(false);
      setEditCircleName('');
      Alert.alert(t('common.success'), 'Nome do círculo atualizado!');
    } else {
      Alert.alert(t('common.error'), result.error);
    }
  };

  // ─── SHARING HANDLERS ───

  const openShareModal = (type, item) => {
    setShareType(type);
    setSelectedItem(item);
    setShareModalVisible(true);
  };

  const handleShare = async (permissions = { view: true, edit: false }) => {
    if (!shareType || !selectedItem) return;

    const result = await shareItem(shareType, selectedItem, permissions);
    setShareModalVisible(false);

    if (result.success) {
      Alert.alert(t('common.success'), t('groups.sharedSuccess') || 'Item compartilhado!');
    } else {
      Alert.alert(t('common.error'), result.error || t('groups.shareFailed'));
    }
  };

  const handleShareAll = async (itemType) => {
    let itemsList = [];
    let displayName = '';

    switch (itemType) {
      case 'card':
        itemsList = cards;
        displayName = `${cards.length} cartões`;
        break;
      case 'transaction':
        itemsList = transactions;
        displayName = `${transactions.length} transações`;
        break;
      case 'goal':
        itemsList = goals;
        displayName = `${goals.length} metas`;
        break;
    }

    if (itemsList.length === 0) {
      Alert.alert(t('common.info'), 'Nenhum item para compartilhar');
      return;
    }

    Alert.alert(
      t('groups.shareAll') || 'Compartilhar Todos',
      `Compartilhar ${displayName}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('groups.share') || 'Compartilhar',
          onPress: async () => {
            const result = await shareAllItems(itemType, itemsList, { view: true, edit: false });
            if (result.success) {
              Alert.alert(t('common.success'), `${result.count} itens compartilhados`);
            } else {
              Alert.alert(t('common.error'), result.error);
            }
          },
        },
      ]
    );
  };

  const handleUnshare = async (type, itemId) => {
    Alert.alert(
      t('groups.unshareTitle') || 'Remover Compartilhamento',
      t('groups.unshareMessage') || 'Os outros membros não verão mais este item.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove') || 'Remover',
          style: 'destructive',
          onPress: async () => {
            const result = await unshareItem(type, String(itemId));
            if (!result.success) {
              Alert.alert(t('common.error'), result.error || t('common.error'));
            }
          },
        },
      ]
    );
  };

  const handleManualSync = async () => {
    const result = await syncWithCircle();
    if (result.success) {
      Alert.alert(t('common.success'), t('groups.syncSuccess') || 'Sincronizado!');
    } else {
      Alert.alert(t('common.error'), result.error || t('common.error'));
    }
  };

  // ─── HELPERS ───

  const isItemShared = (type, id) => {
    const strId = String(id);
    switch (type) {
      case 'card': return sharedCards.some(c => String(c.id) === strId && c._sharedBy === currentUser?.id);
      case 'transaction': return sharedTransactions.some(t => String(t.id) === strId && t._sharedBy === currentUser?.id);
      case 'goal': return sharedGoals.some(g => String(g.id) === strId && g._sharedBy === currentUser?.id);
      default: return false;
    }
  };

  const getSharedItemPermissions = (type, id) => {
    const strId = String(id);
    let item = null;
    switch (type) {
      case 'card': item = sharedCards.find(c => String(c.id) === strId && c._sharedBy === currentUser?.id); break;
      case 'transaction': item = sharedTransactions.find(t => String(t.id) === strId && t._sharedBy === currentUser?.id); break;
      case 'goal': item = sharedGoals.find(g => String(g.id) === strId && g._sharedBy === currentUser?.id); break;
    }
    return item?._permissions || { view: true, edit: false };
  };

  // ─── RENDER: AUTH SCREEN ───

  if (!currentUser) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: colors.bgPrimary }]}
          contentContainerStyle={styles.authContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authHeader}>
            <Ionicons name="people-circle-outline" size={64} color={colors.primary} />
            <Text style={[styles.authTitle, { color: colors.textPrimary }]}>
              {t('groups.title') || 'Círculos'}
            </Text>
            <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
              {t('groups.subtitle') || 'Compartilhe dados financeiros com sua família ou equipe'}
            </Text>
          </View>

          <View style={styles.authToggle}>
            <TouchableOpacity
              style={[styles.authToggleBtn, authMode === 'login' && { backgroundColor: colors.primary }]}
              onPress={() => setAuthMode('login')}
            >
              <Text style={[styles.authToggleText, { color: authMode === 'login' ? '#fff' : colors.textPrimary }]}>
                {t('common.login')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authToggleBtn, authMode === 'register' && { backgroundColor: colors.primary }]}
              onPress={() => setAuthMode('register')}
            >
              <Text style={[styles.authToggleText, { color: authMode === 'register' ? '#fff' : colors.textPrimary }]}>
                {t('common.register')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputContainer, { backgroundColor: colors.bgCard }]}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder={t('common.username')}
                placeholderTextColor={colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.bgCard }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder={t('common.password')}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {authMode === 'register' && (
              <View style={[styles.inputContainer, { backgroundColor: colors.bgCard }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder={t('common.confirmPassword')}
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: colors.primary }]}
              onPress={authMode === 'login' ? handleLogin : handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.authButtonText}>
                  {authMode === 'login' ? t('common.login') : t('common.register')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── RENDER: NO CIRCLE ───

  if (myCircles.length === 0) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: colors.bgPrimary }]}
          contentContainerStyle={[styles.noGroupContainer, { paddingTop: insets.top + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.userHeader}>
            <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
              {t('common.welcome')}, {currentUser.username}!
            </Text>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={[styles.logoutText, { color: colors.danger }]}>
                {t('common.logout')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Criar Círculo */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <View style={styles.sectionIcon}>
              <Ionicons name="add-circle-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('groups.createGroup') || 'Criar um Círculo'}
            </Text>
            <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
              Crie um círculo e convide outras pessoas para compartilhar dados financeiros.
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.bgPrimary }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder={t('groups.groupName') || 'Nome do círculo'}
                placeholderTextColor={colors.textSecondary}
                value={circleName}
                onChangeText={setCircleName}
              />
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateCircle}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>{t('groups.createGroupBtn') || 'Criar Círculo'}</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.orText, { color: colors.textSecondary }]}>
            {t('groups.or') || '— ou —'}
          </Text>

          {/* Entrar em Círculo */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <View style={styles.sectionIcon}>
              <Ionicons name="enter-outline" size={40} color={colors.success} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('groups.joinGroup') || 'Entrar em um Círculo'}
            </Text>
            <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
              Digite o código de convite que você recebeu.
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.bgPrimary }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder={t('groups.inviteCode') || 'Código de convite'}
                placeholderTextColor={colors.textSecondary}
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={12}
              />
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={handleJoinCircle}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>{t('groups.joinGroupBtn') || 'Entrar'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── RENDER: CIRCLE HUB (com círculos) ───

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header com usuário e notificações */}
      <View style={[styles.hubHeader, { backgroundColor: colors.bgCard }]}>
        <View style={styles.hubHeaderTop}>
          <View>
            <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
              {t('common.welcome')}, {currentUser.username}
            </Text>
            <Text style={[styles.hubSubtitle, { color: colors.textSecondary }]}>
              {myCircles.length} {myCircles.length === 1 ? 'círculo' : 'círculos'}
            </Text>
          </View>
          <View style={styles.hubHeaderActions}>
            {/* Botão de atividade/notificações */}
            <TouchableOpacity
              style={[styles.activityBtn, { backgroundColor: colors.primary + '15' }]}
              onPress={() => setActivityModalVisible(true)}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              {unreadActivityCount > 0 && (
                <View style={[styles.activityBadge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.activityBadgeText}>
                    {unreadActivityCount > 99 ? '99+' : unreadActivityCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutBtnSmall}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Seletor de Círculo Ativo */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.circleSelector}
        contentContainerStyle={styles.circleSelectorContent}
      >
        {myCircles.map((circle) => (
          <TouchableOpacity
            key={circle.id}
            style={[
              styles.circleChip,
              {
                backgroundColor: currentCircle?.id === circle.id
                  ? colors.primary
                  : colors.bgCard,
                borderColor: currentCircle?.id === circle.id
                  ? colors.primary
                  : colors.border,
              },
            ]}
            onPress={() => handleSwitchCircle(circle.id)}
          >
            <Ionicons
              name={currentCircle?.id === circle.id ? 'radio-button-on' : 'radio-button-off'}
              size={16}
              color={currentCircle?.id === circle.id ? '#fff' : colors.textSecondary}
            />
            <Text
              style={[
                styles.circleChipText,
                {
                  color: currentCircle?.id === circle.id ? '#fff' : colors.textPrimary,
                },
              ]}
              numberOfLines={1}
            >
              {circle.name}
            </Text>
            {circle.myRole === 'admin' && (
              <Ionicons name="shield-checkmark" size={12} color={currentCircle?.id === circle.id ? '#fff' : colors.warning} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.bgCard }]}>
        {[
          { key: 'circles', icon: 'people-outline', label: 'Círculos' },
          { key: 'permissions', icon: 'shield-outline', label: 'Permissões' },
          { key: 'members', icon: 'person-outline', label: 'Membros' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: colors.primary },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? colors.primary : colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* ═══ TAB: CÍRCULOS ═══ */}
        {activeTab === 'circles' && (
          <View>
            {/* Círculo Ativo - Detalhes */}
            {currentCircle && (
              <View style={[styles.currentCircleCard, { backgroundColor: colors.bgCard }]}>
                <View style={styles.currentCircleHeader}>
                  <View style={styles.currentCircleIcon}>
                    <Ionicons name="people-circle" size={32} color={colors.primary} />
                  </View>
                  <View style={styles.currentCircleInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.currentCircleName, { color: colors.textPrimary }]}>
                        {currentCircle.name}
                      </Text>
                      {currentCircle.myRole === 'admin' && (
                        <TouchableOpacity onPress={openEditNameModal}>
                          <Ionicons name="pencil" size={18} color={colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={[styles.currentCircleRole, { color: colors.textSecondary }]}>
                      {currentCircle.myRole === 'admin' ? '👑 Administrador' : '👤 Membro'}
                    </Text>
                  </View>
                </View>

                {/* Código de Convite */}
                <View style={[styles.inviteCodeBox, { backgroundColor: colors.bgTertiary }]}>
                  <View style={styles.inviteCodeRow}>
                    <Ionicons name="key-outline" size={16} color={colors.primary} />
                    <Text style={[styles.inviteCodeLabel, { color: colors.textSecondary }]}>
                      Código de Convite
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.inviteCodeValueBox}
                    onPress={handleCopyCode}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.inviteCodeValue, { color: colors.primary }]}>
                      {currentCircle.inviteCode}
                    </Text>
                    <Ionicons name="copy-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.copyHint, { color: colors.textMuted }]}>
                    Toque para copiar
                  </Text>
                </View>

                {/* Ações do Círculo */}
                <View style={styles.circleActions}>
                  <TouchableOpacity
                    style={[styles.circleActionBtn, { backgroundColor: colors.primary + '15' }]}
                    onPress={handleGenerateNewCode}
                    disabled={currentCircle.myRole !== 'admin'}
                  >
                    <Ionicons name="refresh-outline" size={16} color={currentCircle.myRole === 'admin' ? colors.primary : colors.textMuted} />
                    <Text style={[styles.circleActionText, { color: currentCircle.myRole === 'admin' ? colors.primary : colors.textMuted }]}>
                      Novo Código
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.circleActionBtn, { backgroundColor: isSyncing ? colors.textSecondary + '15' : colors.success + '15' }]}
                    onPress={handleManualSync}
                    disabled={isSyncing}
                  >
                    <Ionicons
                      name={isSyncing ? 'sync' : 'cloud-download'}
                      size={16}
                      color={isSyncing ? colors.textSecondary : colors.success}
                    />
                    <Text style={[styles.circleActionText, { color: isSyncing ? colors.textSecondary : colors.success }]}>
                      {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.circleActionBtn, { backgroundColor: colors.danger + '15' }]}
                    onPress={() => handleLeaveCircle(currentCircle.id)}
                  >
                    <Ionicons name="exit-outline" size={16} color={colors.danger} />
                    <Text style={[styles.circleActionText, { color: colors.danger }]}>
                      Sair
                    </Text>
                  </TouchableOpacity>
                </View>

                {lastSync && (
                  <Text style={[styles.lastSyncText, { color: colors.textMuted }]}>
                    Última sincronização: {formatDate(lastSync)}
                  </Text>
                )}
              </View>
            )}

            {/* Criar / Entrar em mais círculos */}
            <View style={[styles.miniSection, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.miniSectionTitle, { color: colors.textPrimary }]}>
                <Ionicons name="add-circle" size={16} color={colors.primary} />  Mais Círculos
              </Text>

              <View style={[styles.inputContainer, { backgroundColor: colors.bgTertiary, marginBottom: 8 }]}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Nome do novo círculo"
                  placeholderTextColor={colors.textSecondary}
                  value={circleName}
                  onChangeText={setCircleName}
                />
              </View>
              <TouchableOpacity
                style={[styles.miniActionBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreateCircle}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.miniActionText}>Criar Círculo</Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={[styles.inputContainer, { backgroundColor: colors.bgTertiary, marginBottom: 8 }]}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Código de convite"
                  placeholderTextColor={colors.textSecondary}
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={12}
                />
              </View>
              <TouchableOpacity
                style={[styles.miniActionBtn, { backgroundColor: colors.success }]}
                onPress={handleJoinCircle}
              >
                <Ionicons name="enter" size={16} color="#fff" />
                <Text style={styles.miniActionText}>Entrar com Código</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ═══ TAB: PERMISSÕES ═══ */}
        {activeTab === 'permissions' && currentCircle && (
          <View>
            {/* Cards Section */}
            <View style={styles.dataSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.dataSectionTitle, { color: colors.textPrimary }]}>
                  <Ionicons name="card-outline" size={16} />  Cartões
                </Text>
                {cards.length > 0 && (
                  <TouchableOpacity
                    style={[styles.shareAllBtn, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => handleShareAll('card')}
                  >
                    <Ionicons name="share-social" size={14} color={colors.primary} />
                    <Text style={[styles.shareAllText, { color: colors.primary }]}>Todos</Text>
                  </TouchableOpacity>
                )}
              </View>
              {cards.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Nenhum cartão cadastrado
                </Text>
              ) : (
                cards.map((card) => {
                  const shared = isItemShared('card', card.id);
                  const perms = getSharedItemPermissions('card', card.id);
                  return (
                    <View key={card.id} style={[styles.itemRow, { backgroundColor: colors.bgCard }]}>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                          {card.name}
                        </Text>
                        <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                          {card.bank || 'Cartão'} • Limite: R$ {card.limit?.toFixed(2) || '0,00'}
                        </Text>
                        {shared && (
                          <View style={styles.sharedBadgeRow}>
                            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                            <Text style={[styles.sharedBadge, { color: colors.success }]}>
                              Compartilhado{perms?.edit && ' (edição)'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Switch
                        value={shared}
                        onValueChange={(value) => {
                          if (value) {
                            openShareModal('card', card);
                          } else {
                            handleUnshare('card', card.id);
                          }
                        }}
                        trackColor={{ false: colors.textSecondary + '40', true: colors.success }}
                        thumbColor={shared ? '#fff' : colors.textSecondary}
                      />
                    </View>
                  );
                })
              )}
            </View>

            {/* Transactions Section */}
            <View style={styles.dataSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.dataSectionTitle, { color: colors.textPrimary }]}>
                  <Ionicons name="list-outline" size={16} />  Transações
                </Text>
                {transactions.length > 0 && (
                  <TouchableOpacity
                    style={[styles.shareAllBtn, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => handleShareAll('transaction')}
                  >
                    <Ionicons name="share-social" size={14} color={colors.primary} />
                    <Text style={[styles.shareAllText, { color: colors.primary }]}>Todas</Text>
                  </TouchableOpacity>
                )}
              </View>
              {transactions.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Nenhuma transação
                </Text>
              ) : (
                transactions.slice(0, 30).map((tx) => {
                  const shared = isItemShared('transaction', tx.id);
                  const perms = getSharedItemPermissions('transaction', tx.id);
                  const category = categories.find((c) => c.id === tx.categoryId);
                  return (
                    <View key={tx.id} style={[styles.itemRow, { backgroundColor: colors.bgCard }]}>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                          {tx.description || tx.desc || 'Sem descrição'}
                        </Text>
                        <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                          R$ {tx.amount?.toFixed(2)} • {category?.name || 'Sem categoria'}
                        </Text>
                        {shared && (
                          <View style={styles.sharedBadgeRow}>
                            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                            <Text style={[styles.sharedBadge, { color: colors.success }]}>
                              Compartilhado{perms?.edit && ' (edição)'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Switch
                        value={shared}
                        onValueChange={(value) => {
                          if (value) {
                            openShareModal('transaction', tx);
                          } else {
                            handleUnshare('transaction', tx.id);
                          }
                        }}
                        trackColor={{ false: colors.textSecondary + '40', true: colors.success }}
                        thumbColor={shared ? '#fff' : colors.textSecondary}
                      />
                    </View>
                  );
                })
              )}
            </View>

            {/* Goals Section */}
            <View style={styles.dataSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.dataSectionTitle, { color: colors.textPrimary }]}>
                  <Ionicons name="flag-outline" size={16} />  Metas
                </Text>
                {goals.length > 0 && (
                  <TouchableOpacity
                    style={[styles.shareAllBtn, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => handleShareAll('goal')}
                  >
                    <Ionicons name="share-social" size={14} color={colors.primary} />
                    <Text style={[styles.shareAllText, { color: colors.primary }]}>Todas</Text>
                  </TouchableOpacity>
                )}
              </View>
              {goals.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Nenhuma meta
                </Text>
              ) : (
                goals.map((goal) => {
                  const shared = isItemShared('goal', goal.id);
                  const perms = getSharedItemPermissions('goal', goal.id);
                  return (
                    <View key={goal.id} style={[styles.itemRow, { backgroundColor: colors.bgCard }]}>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                          {goal.name}
                        </Text>
                        <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                          R$ {goal.current?.toFixed(2) || '0,00'} / R$ {goal.target?.toFixed(2) || '0,00'}
                        </Text>
                        {shared && (
                          <View style={styles.sharedBadgeRow}>
                            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                            <Text style={[styles.sharedBadge, { color: colors.success }]}>
                              Compartilhado{perms?.edit && ' (edição)'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Switch
                        value={shared}
                        onValueChange={(value) => {
                          if (value) {
                            openShareModal('goal', goal);
                          } else {
                            handleUnshare('goal', goal.id);
                          }
                        }}
                        trackColor={{ false: colors.textSecondary + '40', true: colors.success }}
                        thumbColor={shared ? '#fff' : colors.textSecondary}
                      />
                    </View>
                  );
                })
              )}
            </View>

            {/* Dados Recebidos do Círculo */}
            <View style={styles.dataSection}>
              <Text style={[styles.dataSectionTitle, { color: colors.textPrimary }]}>
                <Ionicons name="download-outline" size={16} />  Dados Recebidos do Círculo
              </Text>

              {/* Cartões recebidos */}
              {sharedCards.filter(c => c._sharedBy !== currentUser?.id).length > 0 && (
                <View style={[styles.receivedSection, { backgroundColor: colors.bgCard }]}>
                  <Text style={[styles.receivedTitle, { color: colors.textSecondary }]}>
                    <Ionicons name="card" size={14} />  Cartões ({sharedCards.filter(c => c._sharedBy !== currentUser?.id).length})
                  </Text>
                  {sharedCards
                    .filter(c => c._sharedBy !== currentUser?.id)
                    .map(card => (
                      <View key={card.id} style={styles.receivedItem}>
                        <Text style={[styles.receivedItemName, { color: colors.textPrimary }]}>
                          {card.name}
                        </Text>
                        <Text style={[styles.receivedItemMeta, { color: colors.textMuted }]}>
                          por {card._sharedByName || 'Membro'}
                          {card._permissions?.edit && ' • pode editar'}
                        </Text>
                      </View>
                    ))}
                </View>
              )}

              {/* Transações recebidas */}
              {sharedTransactions.filter(t => t._sharedBy !== currentUser?.id).length > 0 && (
                <View style={[styles.receivedSection, { backgroundColor: colors.bgCard }]}>
                  <Text style={[styles.receivedTitle, { color: colors.textSecondary }]}>
                    <Ionicons name="receipt" size={14} />  Transações ({sharedTransactions.filter(t => t._sharedBy !== currentUser?.id).length})
                  </Text>
                  {sharedTransactions
                    .filter(t => t._sharedBy !== currentUser?.id)
                    .slice(0, 5)
                    .map(tx => (
                      <View key={tx.id} style={styles.receivedItem}>
                        <Text style={[styles.receivedItemName, { color: colors.textPrimary }]}>
                          {tx.description || tx.desc || 'Transação'}
                        </Text>
                        <Text style={[styles.receivedItemMeta, { color: colors.textMuted }]}>
                          por {tx._sharedByName || 'Membro'} • R$ {tx.amount?.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                </View>
              )}

              {/* Metas recebidas */}
              {sharedGoals.filter(g => g._sharedBy !== currentUser?.id).length > 0 && (
                <View style={[styles.receivedSection, { backgroundColor: colors.bgCard }]}>
                  <Text style={[styles.receivedTitle, { color: colors.textSecondary }]}>
                    <Ionicons name="flag" size={14} />  Metas ({sharedGoals.filter(g => g._sharedBy !== currentUser?.id).length})
                  </Text>
                  {sharedGoals
                    .filter(g => g._sharedBy !== currentUser?.id)
                    .map(goal => (
                      <View key={goal.id} style={styles.receivedItem}>
                        <Text style={[styles.receivedItemName, { color: colors.textPrimary }]}>
                          {goal.name}
                        </Text>
                        <Text style={[styles.receivedItemMeta, { color: colors.textMuted }]}>
                          por {goal._sharedByName || 'Membro'}
                        </Text>
                      </View>
                    ))}
                </View>
              )}

              {sharedCards.filter(c => c._sharedBy !== currentUser?.id).length === 0 &&
               sharedTransactions.filter(t => t._sharedBy !== currentUser?.id).length === 0 &&
               sharedGoals.filter(g => g._sharedBy !== currentUser?.id).length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Nenhum dado recebido ainda
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ═══ TAB: MEMBROS ═══ */}
        {activeTab === 'members' && currentCircle && (
          <View>
            <Text style={[styles.dataSectionTitle, { color: colors.textPrimary }]}>
              <Ionicons name="people-outline" size={16} />  Membros do Círculo
            </Text>
            {circleMembers.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Carregando membros...
              </Text>
            ) : (
              circleMembers.map((member) => (
                <View
                  key={member.id}
                  style={[styles.memberRow, { backgroundColor: colors.bgCard }]}
                >
                  <View style={styles.memberAvatar}>
                    <Ionicons
                      name={member.isAdmin ? 'shield-checkmark' : 'person'}
                      size={24}
                      color={member.isAdmin ? colors.warning : colors.primary}
                    />
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                      {member.username}
                      {member.id === currentUser?.id && (
                        <Text style={{ color: colors.textMuted }}> (você)</Text>
                      )}
                    </Text>
                    <Text style={[styles.memberRole, { color: colors.textSecondary }]}>
                      {member.isAdmin ? 'Administrador' : 'Membro'}
                    </Text>
                  </View>
                  {member.isAdmin && (
                    <View style={[styles.adminBadge, { backgroundColor: colors.warning + '20' }]}>
                      <Text style={[styles.adminBadgeText, { color: colors.warning }]}>Admin</Text>
                    </View>
                  )}
                </View>
              ))
            )}

            {/* Convite */}
            <TouchableOpacity
              style={[styles.inviteBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                Alert.alert(
                  'Convidar Membro',
                  `Compartilhe este código:\n\n${currentCircle.inviteCode}`
                );
              }}
            >
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text style={styles.inviteBtnText}>Convidar Novo Membro</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ═══ MODAL: PERMISSÕES DE COMPARTILHAMENTO ═══ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Compartilhar {shareType === 'card' ? 'Cartão' : shareType === 'transaction' ? 'Transação' : 'Meta'}
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Escolha as permissões de acesso para os membros do círculo:
            </Text>

            <TouchableOpacity
              style={[styles.permissionOption, { backgroundColor: colors.bgTertiary }]}
              onPress={() => handleShare({ view: true, edit: false })}
            >
              <Ionicons name="eye-outline" size={24} color={colors.primary} />
              <View style={styles.permissionText}>
                <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
                  Apenas Visualizar
                </Text>
                <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
                  Membros podem ver, mas não editar
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.permissionOption, { backgroundColor: colors.bgTertiary }]}
              onPress={() => handleShare({ view: true, edit: true })}
            >
              <Ionicons name="create-outline" size={24} color={colors.success} />
              <View style={styles.permissionText}>
                <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
                  Visualizar e Editar
                </Text>
                <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
                  Membros podem ver e fazer alterações
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.danger + '15' }]}
              onPress={() => setShareModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.danger }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══ MODAL: EDITAR NOME DO CÍRCULO ═══ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editNameModalVisible}
        onRequestClose={() => setEditNameModalVisible(false)}
      >
        <ModalContent style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Editar Nome do Círculo
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Escolha um novo nome para o círculo:
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: colors.bgTertiary, marginBottom: 16 }]}>
              <Ionicons name="people-circle-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Nome do círculo"
                placeholderTextColor={colors.textSecondary}
                value={editCircleName}
                onChangeText={setEditCircleName}
                autoFocus
                maxLength={50}
              />
            </View>

            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdateCircleName}
              disabled={!editCircleName.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.authButtonText}>Salvar Nome</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.danger + '15', marginTop: 10 }]}
              onPress={() => setEditNameModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.danger }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </ModalContent>
      </Modal>

      {/* ═══ MODAL: LOG DE ATIVIDADE ═══ */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={activityModalVisible}
        onRequestClose={() => setActivityModalVisible(false)}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
          <View style={[styles.activityModalHeader, { backgroundColor: colors.bgCard }]}>
            <TouchableOpacity onPress={() => setActivityModalVisible(false)}>
              <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.activityModalTitle, { color: colors.textPrimary }]}>
              <Ionicons name="notifications" size={20} color={colors.primary} />  Atividade do Círculo
            </Text>
            <TouchableOpacity onPress={() => markActivityAsRead()}>
              <Text style={[styles.markAllRead, { color: colors.primary }]}>Ler tudo</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.activityList}>
            {activityLog.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyActivityText, { color: colors.textMuted }]}>
                  Nenhuma atividade recente
                </Text>
              </View>
            ) : (
              activityLog.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityItem,
                    { backgroundColor: colors.bgCard },
                    !activity.read && { borderLeftWidth: 3, borderLeftColor: colors.primary },
                  ]}
                  onPress={() => markActivityAsRead(activity.id)}
                >
                  <View style={styles.activityIcon}>
                    <Ionicons
                      name={
                        activity.action === 'share' ? 'share-outline' :
                        activity.action === 'share_all' ? 'share-social-outline' :
                        activity.action === 'join' ? 'person-add-outline' :
                        activity.action === 'leave' ? 'exit-outline' :
                        'notifications-outline'
                      }
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityMessage, { color: colors.textPrimary }]}>
                      <Text style={{ fontWeight: '700' }}>{activity.userName}</Text> {activity.message}
                    </Text>
                    {activity.itemName && (
                      <Text style={[styles.activityItemName, { color: colors.textSecondary }]}>
                        "{activity.itemName}"
                      </Text>
                    )}
                    <Text style={[styles.activityTime, { color: colors.textMuted }]}>
                      {formatDate(activity.createdAt)}
                    </Text>
                  </View>
                  {!activity.read && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                  )}
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Auth
  authContainer: { padding: 24, paddingTop: 60 },
  authHeader: { alignItems: 'center', marginBottom: 32 },
  authTitle: { fontSize: 24, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  authSubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  authToggle: { flexDirection: 'row', marginBottom: 24, borderRadius: 12, overflow: 'hidden' },
  authToggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  authToggleText: { fontSize: 14, fontWeight: '600' },
  form: { gap: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 12, height: 50 },
  input: { flex: 1, marginLeft: 12, fontSize: 16 },
  authButton: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  authButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // No Circle
  noGroupContainer: { padding: 24 },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  welcomeText: { fontSize: 20, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoutText: { fontSize: 14, fontWeight: '600' },

  section: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  sectionIcon: { marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 4, marginBottom: 4, textAlign: 'center' },
  sectionDesc: { fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  actionButton: { width: '100%', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  actionButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  orText: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginVertical: 8 },

  // Hub Header
  hubHeader: { padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  hubHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hubSubtitle: { fontSize: 13, marginTop: 2 },
  hubHeaderActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  activityBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  activityBadge: { position: 'absolute', top: -2, right: -2, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  activityBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  logoutBtnSmall: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  // Circle Selector
  circleSelector: { maxHeight: 70 },
  circleSelectorContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  circleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  circleChipText: { fontSize: 14, fontWeight: '600', maxWidth: 120 },

  // Tabs
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, borderRadius: 12 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '600', marginTop: 4 },

  tabContent: { flex: 1, padding: 16 },

  // Current Circle Card
  currentCircleCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
  currentCircleHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  currentCircleIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(99, 102, 241, 0.1)', justifyContent: 'center', alignItems: 'center' },
  currentCircleInfo: { flex: 1 },
  currentCircleName: { fontSize: 20, fontWeight: '700' },
  currentCircleRole: { fontSize: 13, marginTop: 2 },

  inviteCodeBox: { borderRadius: 14, padding: 14, marginBottom: 16 },
  inviteCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  inviteCodeLabel: { fontSize: 13, fontWeight: '600' },
  inviteCodeValueBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inviteCodeValue: { fontSize: 22, fontWeight: '700', letterSpacing: 2 },
  copyHint: { fontSize: 11, textAlign: 'center', marginTop: 6 },

  circleActions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  circleActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, flex: 1, justifyContent: 'center' },
  circleActionText: { fontSize: 12, fontWeight: '600' },
  lastSyncText: { fontSize: 11, textAlign: 'center' },

  // Mini Section
  miniSection: { borderRadius: 16, padding: 16, marginBottom: 16 },
  miniSectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  miniActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
  miniActionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginVertical: 16 },

  // Data Sections
  dataSection: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dataSectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },

  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, marginBottom: 8 },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemDetail: { fontSize: 12, marginTop: 2 },
  sharedBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  sharedBadge: { fontSize: 11, fontWeight: '600' },

  shareAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  shareAllText: { fontSize: 12, fontWeight: '600' },

  emptyText: { fontSize: 14, textAlign: 'center', padding: 20 },

  // Received Data
  receivedSection: { borderRadius: 12, padding: 14, marginBottom: 10 },
  receivedTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  receivedItem: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
  receivedItemName: { fontSize: 14, fontWeight: '500' },
  receivedItemMeta: { fontSize: 11, marginTop: 2 },

  // Members
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600' },
  memberRole: { fontSize: 12, marginTop: 2 },
  adminBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  adminBadgeText: { fontSize: 11, fontWeight: '700' },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, marginTop: 16 },
  inviteBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalDesc: { fontSize: 13, marginBottom: 20, lineHeight: 18 },

  permissionOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12 },
  permissionText: { marginLeft: 12, flex: 1 },
  permissionTitle: { fontSize: 15, fontWeight: '600' },
  permissionDesc: { fontSize: 12, marginTop: 2 },

  cancelButton: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { fontSize: 15, fontWeight: '600' },

  // Activity Modal
  activityModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1 },
  activityModalTitle: { fontSize: 18, fontWeight: '700', flex: 1, marginLeft: 12 },
  markAllRead: { fontSize: 13, fontWeight: '600' },
  activityList: { flex: 1, padding: 16 },
  emptyActivity: { alignItems: 'center', paddingVertical: 80 },
  emptyActivityText: { fontSize: 16, fontWeight: '500', marginTop: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 12, marginBottom: 8 },
  activityIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityContent: { flex: 1 },
  activityMessage: { fontSize: 14, lineHeight: 20 },
  activityItemName: { fontSize: 13, marginTop: 2, fontStyle: 'italic' },
  activityTime: { fontSize: 11, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8, marginTop: 4 },
});