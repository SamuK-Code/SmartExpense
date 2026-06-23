// GroupScreen.js — COM TRADUÇÕES COMPLETAS E CORREÇÕES APLICADAS
// CORREÇÕES: inviteCode copiável, maxLength 12, shareItem type coercion, KeyboardAvoidingView

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
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroup } from '../context/GroupContext';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';

export default function GroupScreen() {
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

    // Group
    currentGroup,
    groupMembers,
    createGroup,
    joinGroup,
    leaveGroup,
    generateInviteCode,

    // Sharing
    sharedItems,
    shareItem,
    unshareItem,
    syncWithGroup,
    lastSync,
    isSyncing,

    // Shared data received
    sharedCards,
    sharedTransactions,
    sharedGoals,
  } = useGroup();

  // Local state
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [activeTab, setActiveTab] = useState('myData');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareType, setShareType] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);

  // ─── HELPERS ───────────────────────────────────────────────────

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    // Toast nativo do expo-clipboard não precisa de ToastAndroid
  };

  // ─── AUTH HANDLERS ─────────────────────────────────────────────

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

  // ─── GROUP HANDLERS ────────────────────────────────────────────

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert(t('common.error'), t('common.enterGroupName'));
      return;
    }
    const result = await createGroup(groupName.trim());
    if (result.success) {
      Alert.alert(
        t('common.success'),
        t('groups.groupCreatedMessage', { code: result.inviteCode })
      );
      setGroupName('');
    } else {
      Alert.alert(t('common.error'), result.error || t('common.createGroupFailed'));
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert(t('common.error'), t('common.fillRequired'));
      return;
    }
    const result = await joinGroup(inviteCode.trim().toUpperCase());
    if (result.success) {
      Alert.alert(t('common.success'), t('groups.joinedGroup'));
      setInviteCode('');
    } else {
      Alert.alert(t('common.error'), result.error || t('common.invalidCode'));
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      t('common.leaveGroup'),
      t('common.leaveGroupConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.logout'),
          style: 'destructive',
          onPress: async () => {
            const result = await leaveGroup();
            if (!result.success) {
              Alert.alert(t('common.error'), result.error || t('common.leaveFailed'));
            }
          },
        },
      ]
    );
  };

  const handleGenerateNewCode = async () => {
    const result = await generateInviteCode();
    if (result.success) {
      Alert.alert(
        t('common.newCodeGenerated'),
        t('groups.newCodeMessage', { code: result.inviteCode })
      );
    }
  };

  // ─── SHARING HANDLERS ──────────────────────────────────────────

  // CORREÇÃO: Coerce itemId para string para evitar mismatch cardId number vs string
  const openShareModal = (type, itemId) => {
    setShareType(type);
    setSelectedItemId(String(itemId));
    setShareModalVisible(true);
  };

  const handleShare = async (permissions = { view: true, edit: false }) => {
    if (!shareType || !selectedItemId) return;

    // CORREÇÃO: Garante que itemId é sempre string
    const result = await shareItem(shareType, String(selectedItemId), permissions);
    setShareModalVisible(false);

    if (result.success) {
      Alert.alert(t('common.success'), t('groups.sharedSuccess'));
    } else {
      Alert.alert(t('common.error'), result.error || t('groups.shareFailed'));
    }
  };

  const handleUnshare = async (type, itemId) => {
    Alert.alert(
      t('groups.unshareTitle'),
      t('groups.unshareMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            // CORREÇÃO: Coerce para string
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
    const result = await syncWithGroup();
    if (result.success) {
      Alert.alert(t('common.success'), t('groups.syncSuccess'));
    } else {
      Alert.alert(t('common.error'), result.error || t('common.error'));
    }
  };

  // ─── HELPERS ───────────────────────────────────────────────────

  const isItemShared = (type, id) => {
    // CORREÇÃO: Compara ambos como string
    const strId = String(id);
    return sharedItems.some(
      (item) => item.itemType === type && String(item.itemId) === strId
    );
  };

  const getSharedItemMeta = (type, id) => {
    const strId = String(id);
    return sharedItems.find(
      (item) => item.itemType === type && String(item.itemId) === strId
    );
  };

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

  // ─── RENDER: AUTH SCREEN ───────────────────────────────────────

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
            <Ionicons
              name="people-circle-outline"
              size={64}
              color={colors.primary}
            />
            <Text style={[styles.authTitle, { color: colors.textPrimary }]}>
              {t('groups.title')}
            </Text>
            <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
              {t('groups.subtitle')}
            </Text>
          </View>

          <View style={styles.authToggle}>
            <TouchableOpacity
              style={[
                styles.authToggleBtn,
                authMode === 'login' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setAuthMode('login')}
            >
              <Text
                style={[
                  styles.authToggleText,
                  { color: authMode === 'login' ? '#fff' : colors.textPrimary },
                ]}
              >
                {t('common.login')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.authToggleBtn,
                authMode === 'register' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setAuthMode('register')}
            >
              <Text
                style={[
                  styles.authToggleText,
                  { color: authMode === 'register' ? '#fff' : colors.textPrimary },
                ]}
              >
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

  // ─── RENDER: NO GROUP ──────────────────────────────────────────

  if (!currentGroup) {
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

          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <Ionicons name="add-circle-outline" size={40} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('groups.createGroup')}
            </Text>
            <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
              {t('groups.createGroupDesc')}
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.bgPrimary }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder={t('groups.groupName')}
                placeholderTextColor={colors.textSecondary}
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateGroup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>{t('groups.createGroupBtn')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.orText, { color: colors.textSecondary }]}>
            {t('groups.or')}
          </Text>

          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <Ionicons name="enter-outline" size={40} color={colors.success} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('groups.joinGroup')}
            </Text>
            <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
              {t('groups.joinGroupDesc')}
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.bgPrimary }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder={t('groups.inviteCode')}
                placeholderTextColor={colors.textSecondary}
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={12}
              />
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={handleJoinGroup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>{t('groups.joinGroupBtn')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── RENDER: GROUP DASHBOARD ───────────────────────────────────

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
        {/* Header */}
        <View style={[styles.groupHeader, { backgroundColor: colors.bgCard }]}>
          <View style={styles.groupHeaderTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.groupName, { color: colors.textPrimary }]}>
                {currentGroup.name}
              </Text>
              {/* CORREÇÃO: Código copiável com TouchableOpacity */}
              <TouchableOpacity
                style={styles.codeContainer}
                onPress={() => copyToClipboard(currentGroup.inviteCode)}
                activeOpacity={0.7}
              >
                <Text style={[styles.groupCode, { color: colors.textSecondary }]}>
                  {t('groups.inviteCode')}: {currentGroup.inviteCode}
                </Text>
                <Ionicons name="copy-outline" size={14} color={colors.primary} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleLeaveGroup}>
              <Ionicons name="exit-outline" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>

          <View style={styles.groupActions}>
            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: colors.primary + '20' }]}
              onPress={handleGenerateNewCode}
            >
              <Ionicons name="refresh-outline" size={14} color={colors.primary} />
              <Text style={[styles.smallButtonText, { color: colors.primary }]}>
                {t('groups.newCode')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.smallButton,
                { backgroundColor: isSyncing ? colors.textSecondary + '20' : colors.success + '20' },
              ]}
              onPress={handleManualSync}
              disabled={isSyncing}
            >
              <Ionicons
                name={isSyncing ? 'sync-outline' : 'cloud-upload-outline'}
                size={14}
                color={isSyncing ? colors.textSecondary : colors.success}
              />
              <Text
                style={[
                  styles.smallButtonText,
                  { color: isSyncing ? colors.textSecondary : colors.success },
                ]}
              >
                {isSyncing ? t('common.syncing') : t('common.sync')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.lastSync, { color: colors.textSecondary }]}>
            {t('common.lastSync')}: {formatDate(lastSync)}
          </Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.bgCard }]}>
          {[
            { key: 'myData', icon: 'share-outline', label: t('groups.myData') },
            { key: 'shared', icon: 'download-outline', label: t('groups.received') },
            { key: 'members', icon: 'people-outline', label: t('groups.members') },
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
        <ScrollView style={styles.tabContent}>
          {/* ─── MY DATA TAB ─────────────────────────────────────── */}
          {activeTab === 'myData' && (
            <View>
              {/* Cards Section */}
              <View style={styles.dataSection}>
                <Text style={[styles.dataSectionTitle, { color: colors.textPrimary }]}>
                  <Ionicons name="card-outline" size={16} /> {t('groups.cards')}
                </Text>
                {cards.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('groups.noCards')}
                  </Text>
                ) : (
                  cards.map((card) => {
                    // CORREÇÃO: Coerce card.id para string
                    const shared = isItemShared('card', card.id);
                    const meta = getSharedItemMeta('card', card.id);
                    return (
                      <View
                        key={card.id}
                        style={[styles.itemRow, { backgroundColor: colors.bgCard }]}
                      >
                        <View style={styles.itemInfo}>
                          <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                            {card.name}
                          </Text>
                          <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                            {card.type === 'credit' ? t('common.credit') : t('common.debit')} • **** {card.lastFour}
                          </Text>
                          {shared && meta && (
                            <Text style={[styles.sharedBadge, { color: colors.success }]}>
                              <Ionicons name="checkmark-circle" size={12} /> {t('groups.shared')}
                              {meta.permissions?.edit && ` (${t('groups.editPermission')})`}
                            </Text>
                          )}
                        </View>
                        <Switch
                          value={shared}
                          onValueChange={(value) => {
                            if (value) {
                              openShareModal('card', card.id);
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
                <Text style={[styles.dataSectionTitle, { color: colors.textPrimary }]}>
                  <Ionicons name="list-outline" size={16} /> {t('groups.transactions')}
                </Text>
                {transactions.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('groups.noTransactions')}
                  </Text>
                ) : (
                  transactions.slice(0, 20).map((tx) => {
                    // CORREÇÃO: Coerce tx.id para string e usa tx.description || tx.desc
                    const shared = isItemShared('transaction', tx.id);
                    const meta = getSharedItemMeta('transaction', tx.id);
                    const category = categories.find((c) => c.id === tx.categoryId);
                    return (
                      <View
                        key={tx.id}
                        style={[styles.itemRow, { backgroundColor: colors.bgCard }]}
                      >
                        <View style={styles.itemInfo}>
                          <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                            {tx.description || tx.desc || t('groups.noDescription')}
                          </Text>
                          <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                            R$ {tx.amount?.toFixed(2)} • {category?.name || t('groups.noCategory')}
                          </Text>
                          {shared && meta && (
                            <Text style={[styles.sharedBadge, { color: colors.success }]}>
                              <Ionicons name="checkmark-circle" size={12} /> {t('groups.shared')}
                            </Text>
                          )}
                        </View>
                        <Switch
                          value={shared}
                          onValueChange={(value) => {
                            if (value) {
                              openShareModal('transaction', tx.id);
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
                <Text style={[styles.dataSectionTitle, { color: colors.textPrimary }]}>
                  <Ionicons name="flag-outline" size={16} /> {t('groups.goals')}
                </Text>
                {goals.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('groups.noGoals')}
                  </Text>
                ) : (
                  goals.map((goal) => {
                    const shared = isItemShared('goal', goal.id);
                    const meta = getSharedItemMeta('goal', goal.id);
                    return (
                      <View
                        key={goal.id}
                        style={[styles.itemRow, { backgroundColor: colors.bgCard }]}
                      >
                        <View style={styles.itemInfo}>
                          <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                            {goal.name}
                          </Text>
                          <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                            R$ {goal.current?.toFixed(2)} / R$ {goal.target?.toFixed(2)}
                          </Text>
                          {shared && meta && (
                            <Text style={[styles.sharedBadge, { color: colors.success }]}>
                              <Ionicons name="checkmark-circle" size={12} /> {t('groups.shared')}
                            </Text>
                          )}
                        </View>
                        <Switch
                          value={shared}
                          onValueChange={(value) => {
                            if (value) {
                              openShareModal('goal', goal.id);
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
            </View>
          )}

          {/* ─── SHARED DATA TAB ─────────────────────────────────── */}
          {activeTab === 'shared' && (
            <View>
              {/* Shared Cards */}
              <View style={styles.dataSection}>
                <Text style={[styles.dataSectionTitle, { color: colors.textPrimary }]}>
                  <Ionicons name="card-outline" size={16} /> {t('groups.sharedCards')}
                </Text>
                {sharedCards.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('groups.noSharedCards')}
                  </Text>
                ) : (
                  sharedCards.map((card) => (
                    <View
                      key={card.id}
                      style={[styles.itemRow, { backgroundColor: colors.bgCard }]}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                          {card.name}
                        </Text>
                        <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                          {card.type === 'credit' ? t('common.credit') : t('common.debit')} • **** {card.lastFour}
                        </Text>
                        {card.canEdit && (
                          <Text style={[styles.canEditBadge, { color: colors.primary }]}>
                            {t('groups.canEdit')}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Shared Transactions */}
              <View style={styles.dataSection}>
                <Text style={[styles.dataSectionTitle, { color: colors.textPrimary }]}>
                  <Ionicons name="list-outline" size={16} /> {t('groups.sharedTransactions')}
                </Text>
                {sharedTransactions.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('groups.noSharedTransactions')}
                  </Text>
                ) : (
                  sharedTransactions.map((tx) => (
                    <View
                      key={tx.id}
                      style={[styles.itemRow, { backgroundColor: colors.bgCard }]}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                          {tx.description || tx.desc || t('groups.noDescription')}
                        </Text>
                        <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                          R$ {tx.amount?.toFixed(2)} • {tx.categoryName || t('groups.noCategory')}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Shared Goals */}
              <View style={styles.dataSection}>
                <Text style={[styles.dataSectionTitle, { color: colors.textPrimary }]}>
                  <Ionicons name="flag-outline" size={16} /> {t('groups.sharedGoals')}
                </Text>
                {sharedGoals.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('groups.noSharedGoals')}
                  </Text>
                ) : (
                  sharedGoals.map((goal) => (
                    <View
                      key={goal.id}
                      style={[styles.itemRow, { backgroundColor: colors.bgCard }]}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                          {goal.name}
                        </Text>
                        <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                          R$ {goal.current?.toFixed(2)} / R$ {goal.target?.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* ─── MEMBERS TAB ─────────────────────────────────────── */}
          {activeTab === 'members' && (
            <View>
              <Text style={[styles.dataSectionTitle, { color: colors.textPrimary }]}>
                <Ionicons name="people-outline" size={16} /> {t('groups.groupMembers')}
              </Text>
              {groupMembers.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t('groups.loadingMembers')}
                </Text>
              ) : (
                groupMembers.map((member) => (
                  <View
                    key={member.id}
                    style={[styles.itemRow, { backgroundColor: colors.bgCard }]}
                  >
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                        {member.username} {member.isAdmin && `(${t('common.admin')})`}
                      </Text>
                      <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                        {member.isAdmin ? t('common.admin') : t('common.member')}
                        {member.id === currentUser?.id && ` • ${t('common.you')}`}
                      </Text>
                    </View>
                  </View>
                ))
              )}

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 16 }]}
                onPress={() => {
                  Alert.alert(
                    t('groups.inviteNew'),
                    `${t('groups.shareCodeHint')}

${t('groups.inviteCode')}: ${currentGroup.inviteCode}`
                  );
                }}
              >
                <Ionicons name="share-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>{t('groups.inviteNew')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Share Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t('groups.shareItem', { type: shareType === 'card' ? t('common.card') : shareType === 'transaction' ? t('common.transaction') : t('common.goal') })}
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              {t('groups.sharePermissions')}
            </Text>

            <TouchableOpacity
              style={[styles.permissionOption, { backgroundColor: colors.bgTertiary }]}
              onPress={() => handleShare({ view: true, edit: false })}
            >
              <Ionicons name="eye-outline" size={24} color={colors.primary} />
              <View style={styles.permissionText}>
                <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
                  {t('groups.viewOnly')}
                </Text>
                <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
                  {t('groups.viewOnlyDesc')}
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
                  {t('groups.viewAndEdit')}
                </Text>
                <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
                  {t('groups.viewAndEditDesc')}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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

  noGroupContainer: { padding: 24 },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  welcomeText: { fontSize: 20, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoutText: { fontSize: 14, fontWeight: '600' },

  section: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  sectionDesc: { fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  actionButton: { width: '100%', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  actionButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  orText: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginVertical: 8 },

  groupHeader: { padding: 20, borderRadius: 16, margin: 16, marginBottom: 0 },
  groupHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  groupName: { fontSize: 20, fontWeight: '700' },
  // CORREÇÃO: Container copiável para o código
  codeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, alignSelf: 'flex-start' },
  groupCode: { fontSize: 13 },
  groupActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  smallButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  smallButtonText: { fontSize: 12, fontWeight: '600' },
  lastSync: { fontSize: 11, marginTop: 8 },

  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, borderRadius: 12 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '600', marginTop: 4 },

  tabContent: { flex: 1, padding: 16 },

  dataSection: { marginBottom: 20 },
  dataSectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },

  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, marginBottom: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemDetail: { fontSize: 12, marginTop: 2 },
  sharedBadge: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  canEditBadge: { fontSize: 11, fontWeight: '600', marginTop: 4 },

  emptyText: { fontSize: 14, textAlign: 'center', padding: 20 },

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
});