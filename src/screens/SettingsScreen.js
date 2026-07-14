// SettingsScreen.js — COM PERFIL, TRADUÇÕES, SELETOR DE TEMA E ÍCONES HORIZONTAIS

import React, { useState, useEffect } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Alert, 
  Modal, 
  TextInput,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { useTheme, THEMES } from '../context/ThemeContext';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { useCircle } from '../context/CircleContext';
import { useTranslate } from '../hooks/useTranslate';
import Toast from '../components/Toast';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as LocalAuthentication from 'expo-local-authentication';
import { GOAL_ICONS } from '../utils/helpers';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslate();
  const { language, changeLanguage } = useLanguage();
  const { userProfile, updateName, updateAvatar, clearAvatar } = useUser();
  const { currentUser, leaveGroup } = useCircle();
  const { 
    soundEnabled, 
    setSoundEnabled, 
    setCustomCategories,
    exportData, 
    importData, 
    clearAllData, 
    categories,
    customCategories,
    addCustomCategory,
    securitySettings,
    enablePin,
    disablePin,
    verifyPin,
    changePin,
    toggleBiometric,
    toggleLockOnBackground,
    lockApp,
    devMode,
    toggleDevMode,
  } = useApp();
  const { colors, darkMode, toggleDarkMode, themeKey, changeTheme } = useTheme();

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Modal de categorias
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('pricetag');
  const [newCatColor, setNewCatColor] = useState('#8B5CF6');

  // Modal de idioma
  const [langModalVisible, setLangModalVisible] = useState(false);

  // Modal de perfil
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);

  // Modal de tema
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  // Segurança
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [changePinModalVisible, setChangePinModalVisible] = useState(false);
  const [pinStep, setPinStep] = useState('create'); // 'create' | 'confirm' | 'verify' | 'new' | 'confirmNew'
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);

  // Cores em linha horizontal (12 cores)
  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E'
  ];

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  // Verificar disponibilidade de biometria
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) return;
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!enrolled) return;
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setBiometricAvailable(true);
        if (types.includes(2)) setBiometricType('face');
        else if (types.includes(1)) setBiometricType('fingerprint');
        else setBiometricType('biometric');
      } catch (e) {
        console.warn('[Settings] Erro biometria:', e);
      }
    };
    checkBiometric();
  }, []);

  const getBiometricLabel = () => {
    if (biometricType === 'face') return t('settings.faceId');
    if (biometricType === 'fingerprint') return t('settings.fingerprint');
    return t('settings.biometric');
  };

  // PICKER DE FOTO
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast(t('settings.photoError'), 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0].uri) {
        updateAvatar(result.assets[0].uri);
        showToast(t('settings.photoUpdated'));
      }
    } catch (e) {
      showToast(t('settings.photoError'), 'error');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast(t('settings.cameraError'), 'error');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0].uri) {
        updateAvatar(result.assets[0].uri);
        showToast(t('settings.photoUpdated'));
      }
    } catch (e) {
      showToast(t('settings.cameraError'), 'error');
    }
  };

  const handlePhotoOptions = () => {
    Alert.alert(
      t('settings.profilePhoto'),
      t('settings.choosePhotoOption'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.gallery'), onPress: pickImage },
        { text: t('settings.camera'), onPress: takePhoto },
        userProfile.avatar && { 
          text: t('settings.removePhoto'), 
          style: 'destructive',
          onPress: () => {
            clearAvatar();
            showToast(t('settings.photoRemoved'), 'warning');
          }
        },
      ].filter(Boolean)
    );
  };

  const handleSaveName = () => {
    if (!editName.trim()) {
      showToast(t('settings.invalidName'), 'error');
      return;
    }
    updateName(editName.trim());
    setProfileModalVisible(false);
    showToast(t('settings.nameUpdated'));
  };

  // ═══════════════════════════════════════════════════════════
  // 📤 EXPORTAR DADOS
  // ═══════════════════════════════════════════════════════════
  const handleExport = async () => {
    try {
      const data = await exportData();
      const fileName = `smartexpense_backup_${new Date().toISOString().slice(0,10)}.json`;
      const file = new File(Paths.document, fileName);
      file.create({ overwrite: true });
      file.write(data);
      const fileUri = file.uri;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'SmartExpense - Backup',
          UTI: 'public.json',
        });
      }
      showToast(t('settings.dataExported'));
    } catch (e) {
      console.warn('Erro ao exportar:', e);
      showToast(t('settings.errorExport'), 'error');
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 📥 IMPORTAR DADOS
  // ═══════════════════════════════════════════════════════════
  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const file = new File(fileUri);
      const fileContent = await file.text();

      let parsed;
      try {
        parsed = JSON.parse(fileContent);
      } catch (parseErr) {
        showToast(t('settings.errorImport') + ' — JSON inválido', 'error');
        return;
      }

      if (!parsed || typeof parsed !== 'object') {
        showToast(t('settings.errorImport') + ' — Arquivo inválido', 'error');
        return;
      }

      const success = await importData(fileContent);

      if (success) {
        showToast(t('settings.dataImported'));
      } else {
        showToast(t('settings.errorImport'), 'error');
      }
    } catch (e) {
      console.warn('Erro ao importar:', e);
      showToast(t('settings.errorImport'), 'error');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '⚠️ ' + t('settings.clearConfirm'),
      '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('settings.clearSure'),
              t('settings.clearUndone'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('common.confirm'),
                  style: 'destructive',
                  onPress: async () => {
                    if (currentUser && leaveGroup) {
                      await leaveGroup();
                    }
                    clearAllData();
                    showToast(t('settings.dataCleared'), 'warning');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      showToast(t('settings.enterCategoryName'), 'error');
      return;
    }

    addCustomCategory({
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
    });

    setNewCatName('');
    setNewCatIcon('pricetag');
    setNewCatColor('#8B5CF6');
    setCatModalVisible(false);
    showToast(t('settings.categoryAdded'));
  };

  const handleResetCategories = () => {
    Alert.alert(
      t('settings.resetCategories'),
      t('settings.resetConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.reset'),
          style: 'destructive',
          onPress: () => {
            setCustomCategories([]);
            showToast(t('settings.categoryReset'), 'warning');
          }
        }
      ]
    );
  };

  const toggleSound = (key) => {
    setSoundEnabled({ ...soundEnabled, [key]: !soundEnabled[key] });
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    setLangModalVisible(false);
    showToast(`${t('settings.languageChanged')}: ${LANGUAGES.find(l => l.code === lang)?.name}`);
  };

  const handleThemeChange = (key) => {
    changeTheme(key);
    setThemeModalVisible(false);
    const themeNames = { pt: 'name', en: 'nameEn', es: 'nameEs' };
    const nameKey = themeNames[language] || 'name';
    showToast(`${t('settings.themeChanged')}: ${THEMES[key][nameKey]}`);
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE SEGURANÇA
  // ═══════════════════════════════════════════════════════════

  const handleTogglePin = async (value) => {
    if (value) {
      // Ativar PIN
      setPinStep('create');
      setPinValue('');
      setPinConfirm('');
      setPinError('');
      setPinModalVisible(true);
    } else {
      // Desativar PIN — requer verificação
      setPinStep('verify');
      setPinValue('');
      setPinError('');
      setPinModalVisible(true);
    }
  };

  const handlePinDigit = (digit) => {
    if (pinError) setPinError('');
    const current = pinStep === 'confirm' || pinStep === 'confirmNew' ? pinConfirm : pinValue;
    if (current.length < 4) {
      const updated = current + digit;
      if (pinStep === 'confirm' || pinStep === 'confirmNew') {
        setPinConfirm(updated);
        if (updated.length === 4) {
          setTimeout(() => handlePinConfirm(updated), 150);
        }
      } else {
        setPinValue(updated);
        if (updated.length === 4) {
          setTimeout(() => handlePinComplete(updated), 150);
        }
      }
    }
  };

  const handlePinComplete = (value) => {
    if (pinStep === 'create') {
      setPinStep('confirm');
      setPinConfirm('');
    } else if (pinStep === 'verify') {
      verifyPin(value).then(valid => {
        if (valid) {
          disablePin().then(() => {
            showToast(t('settings.pinDisabled'));
            setPinModalVisible(false);
            setPinValue('');
          });
        } else {
          setPinValue('');
          setPinError(t('lock.wrongPin'));
          setTimeout(() => setPinError(''), 2000);
        }
      });
    } else if (pinStep === 'new') {
      setPinStep('confirmNew');
      setPinConfirm('');
    }
  };

  const handlePinConfirm = async (value) => {
    if (pinStep === 'confirm') {
      if (pinValue === value) {
        const success = await enablePin(value);
        if (success) {
          showToast(t('settings.pinEnabled'));
          setPinModalVisible(false);
          setPinValue('');
          setPinConfirm('');
        } else {
          setPinConfirm('');
          setPinError(t('settings.pinError'));
        }
      } else {
        setPinConfirm('');
        setPinError(t('settings.pinMismatch'));
        setTimeout(() => setPinError(''), 2000);
      }
    } else if (pinStep === 'confirmNew') {
      if (pinValue === value) {
        const success = await enablePin(value);
        if (success) {
          showToast(t('settings.pinChanged'));
          setPinModalVisible(false);
          setPinValue('');
          setPinConfirm('');
        } else {
          setPinConfirm('');
          setPinError(t('settings.pinError'));
        }
      } else {
        setPinConfirm('');
        setPinError(t('settings.pinMismatch'));
        setTimeout(() => setPinError(''), 2000);
      }
    }
  };

  const handlePinDelete = () => {
    if (pinStep === 'confirm' || pinStep === 'confirmNew') {
      setPinConfirm(prev => prev.slice(0, -1));
    } else {
      setPinValue(prev => prev.slice(0, -1));
    }
  };

  const handleChangePin = () => {
    setPinStep('verify');
    setPinValue('');
    setPinConfirm('');
    setPinError('');
    setChangePinModalVisible(true);
  };

  const handleVerifyForChange = (value) => {
    verifyPin(value).then(valid => {
      if (valid) {
        setChangePinModalVisible(false);
        setPinStep('new');
        setPinValue('');
        setPinConfirm('');
        setPinError('');
        setPinModalVisible(true);
      } else {
        setPinValue('');
        setPinError(t('lock.wrongPin'));
        setTimeout(() => setPinError(''), 2000);
      }
    });
  };

  const handleToggleBiometric = async (value) => {
    if (value && !securitySettings.pinEnabled) {
      showToast(t('settings.enablePinFirst'), 'warning');
      return;
    }
    await toggleBiometric(value);
    showToast(value ? t('settings.biometricEnabled') : t('settings.biometricDisabled'));
  };

  const handleToggleLockOnBackground = async (value) => {
    await toggleLockOnBackground(value);
    showToast(value ? t('settings.lockBackgroundOn') : t('settings.lockBackgroundOff'));
  };

  const currentLang = LANGUAGES.find(l => l.code === language);
  const currentTheme = THEMES[themeKey];

  const themeNames = { pt: 'name', en: 'nameEn', es: 'nameEs' };
  const currentThemeName = currentTheme[themeNames[language] || 'name'];

  const SettingRow = ({ icon, iconColor, iconBg, label, value, onPress, isSwitch, switchValue, onSwitchChange, danger, rightContent }) => (
    <TouchableOpacity 
      style={[styles.row, { backgroundColor: colors.bgCard }]}
      onPress={onPress}
      activeOpacity={isSwitch ? 1 : 0.7}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, { backgroundColor: iconBg || colors.bgTertiary }]}>
          <Ionicons name={icon} size={20} color={iconColor || colors.primary} />
        </View>
        <Text style={[styles.rowLabel, { color: danger ? colors.danger : colors.textPrimary }]}>
          {label}
        </Text>
      </View>
      {rightContent ? (
        rightContent
      ) : isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#E2E8F0', true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      ) : value ? (
        <Text style={[styles.rowValue, { color: colors.textMuted }]}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={danger ? colors.danger : colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.bgCard }]}>
        {children}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          <Ionicons name="settings" size={20} color={colors.primary} />  {t('settings.title')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingTop: 16 }}
      >
        {/* PROFILE CARD */}
        <TouchableOpacity 
          style={[styles.profileCard, { backgroundColor: colors.primary }]}
          onPress={() => {
            setEditName(userProfile.name);
            setProfileModalVisible(true);
          }}
          activeOpacity={0.9}
        >
          <View style={styles.profileAvatarContainer}>
            {userProfile.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={styles.profileAvatarImage} />
            ) : (
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={32} color="#FFFFFF" />
              </View>
            )}
            <TouchableOpacity 
              style={styles.cameraBtn}
              onPress={handlePhotoOptions}
            >
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile.name}</Text>
            <Text style={styles.profileEmail}>@{currentUser?.username || t('common.guest')}</Text>
            <View style={styles.editHint}>
              <Ionicons name="create-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.editHintText}>{t('settings.tapToEdit')}</Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* Aparência */}
        <Section title={t('settings.appearance')}>
          <SettingRow
            icon={darkMode ? 'sunny' : 'moon'}
            iconColor={colors.primary}
            label={t('settings.darkMode')}
            isSwitch
            switchValue={darkMode}
            onSwitchChange={toggleDarkMode}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {/* 🎨 SELETOR DE TEMA */}
          <SettingRow
            icon="color-palette"
            iconColor={colors.primary}
            label={t('settings.appTheme')}
            value={currentThemeName}
            onPress={() => setThemeModalVisible(true)}
          />
        </Section>

        {/* Idioma */}
        <Section title={t('settings.language')}>
          <SettingRow
            icon="language"
            iconColor={colors.primary}
            label={t('settings.selectLanguage')}
            value={`${currentLang?.flag} ${currentLang?.name}`}
            onPress={() => setLangModalVisible(true)}
          />
        </Section>

        {/* Segurança */}
        <Section title={t('settings.security')}>
          <SettingRow
            icon="lock-closed"
            iconColor={colors.danger}
            label={t('settings.pinLock')}
            isSwitch
            switchValue={securitySettings.pinEnabled}
            onSwitchChange={handleTogglePin}
          />
          {securitySettings.pinEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SettingRow
                icon="key"
                iconColor={colors.primary}
                label={t('settings.changePin')}
                onPress={handleChangePin}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SettingRow
                icon={biometricType === 'face' ? 'scan-outline' : 'finger-print'}
                iconColor={colors.primary}
                label={getBiometricLabel()}
                isSwitch
                switchValue={securitySettings.biometricEnabled}
                onSwitchChange={handleToggleBiometric}
                rightContent={!biometricAvailable ? (
                  <Text style={[styles.rowValue, { color: colors.textMuted }]}>{t('settings.notAvailable')}</Text>
                ) : null}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SettingRow
                icon="time"
                iconColor={colors.primary}
                label={t('settings.lockOnBackground')}
                isSwitch
                switchValue={securitySettings.lockOnBackground}
                onSwitchChange={handleToggleLockOnBackground}
              />
            </>
          )}
        </Section>

        {/* Sons */}
        <Section title={t('settings.sounds')}>
          <SettingRow
            icon="musical-notes"
            iconColor="#10B981"
            label={t('settings.soundAdd')}
            isSwitch
            switchValue={soundEnabled.add}
            onSwitchChange={() => toggleSound('add')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="trash"
            iconColor="#EF4444"
            label={t('settings.soundDelete')}
            isSwitch
            switchValue={soundEnabled.delete}
            onSwitchChange={() => toggleSound('delete')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="notifications"
            iconColor="#F59E0B"
            label={t('settings.soundNotif')}
            isSwitch
            switchValue={soundEnabled.notif}
            onSwitchChange={() => toggleSound('notif')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="trophy"
            iconColor="#8B5CF6"
            label={t('settings.soundAchievement')}
            isSwitch
            switchValue={soundEnabled.achievement}
            onSwitchChange={() => toggleSound('achievement')}
          />
        </Section>

        {/* Categorias */}
        <Section title={t('settings.categories')}>
          <SettingRow
            icon="add-circle"
            iconColor="#10B981"
            label={t('settings.addCategory')}
            onPress={() => setCatModalVisible(true)}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="refresh"
            iconColor={colors.danger}
            iconBg="rgba(239,68,68,0.1)"
            label={t('settings.resetCategories')}
            danger
            onPress={handleResetCategories}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={[styles.row, { backgroundColor: colors.bgCard }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: colors.bgTertiary }]}>
                <Ionicons name="list" size={20} color={colors.textMuted} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                {t('settings.currentCategories')}
              </Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>
              {categories.length}
            </Text>
          </View>
        </Section>

        {/* Dados */}
        <Section title={t('settings.data')}>
          <SettingRow
            icon="download"
            iconColor="#3B82F6"
            label={t('settings.export')}
            onPress={handleExport}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="upload"
            iconColor="#10B981"
            label={t('settings.import')}
            onPress={handleImport}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="trash"
            iconColor={colors.danger}
            iconBg="rgba(239,68,68,0.1)"
            label={t('settings.clearAll')}
            danger
            onPress={handleClearData}
          />
        </Section>

        {/* Desenvolvedor */}
        {devMode && (
          <Section title={t('settings.developer')}>
            <SettingRow
              icon="lock-closed"
              iconColor={colors.danger}
              label={t('settings.testLock')}
              onPress={() => {
                if (securitySettings.pinEnabled) {
                  lockApp();
                  showToast(t('settings.locked'), 'success');
                } else {
                  showToast(t('settings.enablePinFirst'), 'warning');
                }
              }}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingRow
              icon="code"
              iconColor={colors.primary}
              label={t('settings.devMode')}
              isSwitch
              switchValue={devMode}
              onSwitchChange={toggleDevMode}
            />
          </Section>
        )}

        {/* Sobre */}
        <Section title={t('settings.about')}>
          <SettingRow
            icon="information-circle"
            iconColor={colors.textMuted}
            label={t('appName')}
            value={t('version')}
          />
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ═══════════════════════════════════════════
          MODAL DE PERFIL
      ═══════════════════════════════════════════ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="person" size={20} color={colors.primary} />  {t('settings.editProfile')}
              </Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.avatarPreviewContainer}>
                {userProfile.avatar ? (
                  <Image source={{ uri: userProfile.avatar }} style={styles.avatarPreview} />
                ) : (
                  <View style={[styles.avatarPreview, { backgroundColor: colors.primary }]}>
                    <Ionicons name="person" size={40} color="#FFFFFF" />
                  </View>
                )}
                <TouchableOpacity 
                  style={[styles.changePhotoBtn, { backgroundColor: colors.primary }]}
                  onPress={handlePhotoOptions}
                >
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                  <Text style={styles.changePhotoText}>{t('settings.changePhoto')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('settings.accountUser')}</Text>
                <View style={[styles.input, { backgroundColor: colors.bgTertiary + '80' }]}>
                  <Text style={{ color: colors.textMuted, fontSize: 15, paddingVertical: 12 }}>
                    @{currentUser?.username || t('settings.notLinked')}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                  {currentUser ? t('settings.linked') : t('settings.linkPrompt')}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder={t('settings.displayName')}
                  placeholderTextColor={colors.textMuted}
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveName}
              >
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>{t('settings.saveProfile')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════
          MODAL SELECIONAR IDIOMA
      ═══════════════════════════════════════════ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={langModalVisible}
        onRequestClose={() => setLangModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="language" size={20} color={colors.primary} />  {t('settings.selectLanguage')}
              </Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langOption,
                    { backgroundColor: language === lang.code ? colors.primary + '15' : colors.bgTertiary },
                    language === lang.code && { borderColor: colors.primary }
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{lang.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
                      {lang.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      {lang.code.toUpperCase()}
                    </Text>
                  </View>
                  {language === lang.code && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════
          🎨 MODAL SELECIONAR TEMA
      ═══════════════════════════════════════════ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={themeModalVisible}
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="color-palette" size={20} color={colors.primary} />  {t('settings.selectTheme')}
              </Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {Object.values(THEMES).map((theme) => {
                const nameKey = themeNames[language] || 'name';
                const isSelected = themeKey === theme.key;
                return (
                  <TouchableOpacity
                    key={theme.key}
                    style={[
                      styles.themeOption,
                      { 
                        backgroundColor: isSelected ? theme.primary + '15' : colors.bgTertiary,
                        borderColor: isSelected ? theme.primary : 'transparent',
                      }
                    ]}
                    onPress={() => handleThemeChange(theme.key)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.themePreview, { backgroundColor: theme.primary }]}>
                      <View style={[styles.themePreviewInner, { 
                        backgroundColor: theme.gradientEnd,
                        opacity: 0.6,
                        borderRadius: 8,
                      }]} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                        {theme[nameKey]}
                      </Text>
                      <View style={{ flexDirection: 'row', marginTop: 6, gap: 6 }}>
                        <View style={[styles.colorDot, { backgroundColor: theme.primary }]} />
                        <View style={[styles.colorDot, { backgroundColor: theme.gradientStart }]} />
                        <View style={[styles.colorDot, { backgroundColor: theme.gradientEnd }]} />
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={26} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════
          🎯 MODAL ADICIONAR CATEGORIA — ÍCONES HORIZONTAIS
      ═══════════════════════════════════════════ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={catModalVisible}
        onRequestClose={() => setCatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="add-circle" size={20} color={colors.primary} />  {t('settings.addCategory')}
              </Text>
              <TouchableOpacity onPress={() => setCatModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Nome */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('settings.categoryName')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder={t('settings.enterCategoryName')}
                  placeholderTextColor={colors.textMuted}
                  value={newCatName}
                  onChangeText={setNewCatName}
                />
              </View>

              {/* 🎨 Cores em linha horizontal */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('settings.categoryColor')}</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.colorRow}
                >
                  {colorOptions.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircleRow,
                        { backgroundColor: color },
                        newCatColor === color && styles.colorSelectedRow
                      ]}
                      onPress={() => setNewCatColor(color)}
                      activeOpacity={0.8}
                    >
                      {newCatColor === color && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* 🎯 Ícones em lista horizontal */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('settings.categoryIcon')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.iconRowSettings}
                >
                  {GOAL_ICONS.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconOptionSettings,
                        { 
                          backgroundColor: newCatIcon === icon ? newCatColor + '20' : colors.bgTertiary,
                          borderColor: newCatIcon === icon ? newCatColor : 'transparent',
                        }
                      ]}
                      onPress={() => setNewCatIcon(icon)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={icon} 
                        size={22} 
                        color={newCatIcon === icon ? newCatColor : colors.textMuted} 
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddCategory}
              >
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>{t('settings.saveCategory')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════
          🔒 MODAL DE PIN (Ativar/Desativar)
      ═══════════════════════════════════════════ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pinModalVisible}
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="lock-closed" size={20} color={colors.primary} />  {
                  pinStep === 'create' ? t('settings.createPin') :
                  pinStep === 'confirm' ? t('settings.confirmPin') :
                  pinStep === 'new' ? t('settings.newPin') :
                  pinStep === 'confirmNew' ? t('settings.confirmNewPin') :
                  t('settings.verifyPin')
                }
              </Text>
              <TouchableOpacity onPress={() => { setPinModalVisible(false); setPinValue(''); setPinConfirm(''); setPinError(''); }}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.pinModalBody}>
              <Text style={[styles.pinLabel, { color: colors.textSecondary }]}>
                {pinStep === 'create' ? t('settings.enterNewPin') :
                 pinStep === 'confirm' ? t('settings.reenterPin') :
                 pinStep === 'new' ? t('settings.enterNewPin') :
                 pinStep === 'confirmNew' ? t('settings.reenterPin') :
                 t('settings.enterCurrentPin')}
              </Text>

              {/* PIN Dots */}
              <View style={styles.pinDotsRow}>
                {[0,1,2,3].map(i => {
                  const currentVal = pinStep === 'confirm' || pinStep === 'confirmNew' ? pinConfirm : pinValue;
                  const isFilled = i < currentVal.length;
                  return (
                    <View key={i} style={[
                      styles.pinDot,
                      {
                        borderColor: pinError ? colors.danger : isFilled ? colors.primary : colors.border,
                        backgroundColor: isFilled ? (pinError ? colors.danger : colors.primary) : 'transparent',
                      }
                    ]} />
                  );
                })}
              </View>

              {pinError ? (
                <Text style={[styles.pinError, { color: colors.danger }]}>{pinError}</Text>
              ) : null}

              {/* Keypad */}
              <View style={styles.pinKeypad}>
                {[1,2,3,4,5,6,7,8,9].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.pinKey, { backgroundColor: colors.bgTertiary }]}
                    onPress={() => handlePinDigit(num.toString())}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.pinKeyText, { color: colors.textPrimary }]}>{num}</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.pinKey} />
                <TouchableOpacity
                  style={[styles.pinKey, { backgroundColor: colors.bgTertiary }]}
                  onPress={() => handlePinDigit('0')}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.pinKeyText, { color: colors.textPrimary }]}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pinKey}
                  onPress={handlePinDelete}
                  activeOpacity={0.6}
                >
                  <Ionicons name="backspace-outline" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════
          🔒 MODAL DE PIN (Alterar PIN — verificação)
      ═══════════════════════════════════════════ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={changePinModalVisible}
        onRequestClose={() => setChangePinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                <Ionicons name="key" size={20} color={colors.primary} />  {t('settings.verifyCurrentPin')}
              </Text>
              <TouchableOpacity onPress={() => { setChangePinModalVisible(false); setPinValue(''); setPinError(''); }}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.pinModalBody}>
              <Text style={[styles.pinLabel, { color: colors.textSecondary }]}>
                {t('settings.enterCurrentPin')}
              </Text>

              <View style={styles.pinDotsRow}>
                {[0,1,2,3].map(i => {
                  const isFilled = i < pinValue.length;
                  return (
                    <View key={i} style={[
                      styles.pinDot,
                      {
                        borderColor: pinError ? colors.danger : isFilled ? colors.primary : colors.border,
                        backgroundColor: isFilled ? (pinError ? colors.danger : colors.primary) : 'transparent',
                      }
                    ]} />
                  );
                })}
              </View>

              {pinError ? (
                <Text style={[styles.pinError, { color: colors.danger }]}>{pinError}</Text>
              ) : null}

              <View style={styles.pinKeypad}>
                {[1,2,3,4,5,6,7,8,9].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.pinKey, { backgroundColor: colors.bgTertiary }]}
                    onPress={() => {
                      if (pinError) setPinError('');
                      const updated = pinValue + num;
                      setPinValue(updated);
                      if (updated.length === 4) {
                        setTimeout(() => handleVerifyForChange(updated), 150);
                      }
                    }}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.pinKeyText, { color: colors.textPrimary }]}>{num}</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.pinKey} />
                <TouchableOpacity
                  style={[styles.pinKey, { backgroundColor: colors.bgTertiary }]}
                  onPress={() => {
                    if (pinError) setPinError('');
                    const updated = pinValue + '0';
                    setPinValue(updated);
                    if (updated.length === 4) {
                      setTimeout(() => handleVerifyForChange(updated), 150);
                    }
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.pinKeyText, { color: colors.textPrimary }]}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pinKey}
                  onPress={() => setPinValue(prev => prev.slice(0, -1))}
                  activeOpacity={0.6}
                >
                  <Ionicons name="backspace-outline" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Toast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingTop: 50, 
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  content: { flex: 1, paddingHorizontal: 16 },

  profileCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 20 
  },
  profileAvatarContainer: { position: 'relative', marginRight: 16 },
  profileAvatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileAvatarImage: { width: 56, height: 56, borderRadius: 28 },
  cameraBtn: { 
    position: 'absolute', 
    bottom: -4, 
    right: -4, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileInfo: { flex: 1 },
  profileName: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  profileEmail: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  editHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  editHintText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 16, overflow: 'hidden' },

  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16 
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowValue: { fontSize: 14, marginRight: 4 },

  divider: { height: 1, marginLeft: 64 },

  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    paddingBottom: 40, 
    maxHeight: '90%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { maxHeight: 520 },

  avatarPreviewContainer: { alignItems: 'center', marginBottom: 20 },
  avatarPreview: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  changePhotoBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginTop: 10 
  },
  changePhotoText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 14, borderRadius: 12, fontSize: 16 },

  // 🎨 Cores em linha horizontal
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  colorCircleRow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  colorSelectedRow: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    transform: [{ scale: 1.1 }],
  },

  // 🎯 Ícones em lista horizontal
  iconRowSettings: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  iconOptionSettings: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  // Manter estilos antigos para compatibilidade
  iconGridLarge: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6, 
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconOptionLarge: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: 'transparent',
  },

  submitBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    padding: 16, 
    borderRadius: 14, 
    marginTop: 8 
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  langOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 8, 
    borderWidth: 2, 
    borderColor: 'transparent' 
  },

  // 🎨 Estilos do seletor de tema
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  themePreview: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  themePreviewInner: {
    width: 36,
    height: 36,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },

  // 🔒 Estilos do PIN — Layout corrigido com 3 colunas fixas
  pinModalBody: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 24,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  pinError: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    minHeight: 20,
  },
  pinKeypad: {
    width: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    rowGap: 16,
  },
  pinKey: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinKeyText: {
    fontSize: 28,
    fontWeight: '400',
  },
});

export default SettingsScreen;