// /src/screens/SettingsScreen.js
// ATUALIZADO: Usa componentes consolidados do novo sistema

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Linking,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { AppHeader, BackButton } from '../components/Navigation';
import { Toggle } from '../components/Forms';
import { Screen, SectionHeader, Divider, InfoRow } from '../components/Layout';
import { FadeIn } from '../components/Animations';
import { AlertPopup, ConfirmDialog, ToastManager } from '../components/Overlays';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const { colors } = theme;

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  const handleExport = async () => {
    try {
      // Lógica de exportação (CSV, JSON, etc.)
      ToastManager.show(t('settings.exportSuccess'), 'success');
    } catch (error) {
      ToastManager.show(t('settings.exportError'), 'error');
    }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setShowResetConfirm(false);
    // Lógica de reset
    ToastManager.show(t('settings.resetSuccess'), 'success');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('settings.shareMessage'),
        title: t('settings.shareTitle'),
      });
    } catch (error) {
      // Usuário cancelou o share
    }
  };

  const handleRate = () => {
    Linking.openURL('https://play.google.com/store/apps/details?id=com.smartexpense');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://smartexpense.app/privacy');
  };

  const handleTerms = () => {
    Linking.openURL('https://smartexpense.app/terms');
  };

  const settingsSections = [
    {
      title: t('settings.appearance'),
      items: [
        {
          label: t('settings.darkMode'),
          type: 'toggle',
          value: isDark,
          onChange: toggleTheme,
          icon: isDark ? '🌙' : '☀️',
        },
        {
          label: t('settings.language'),
          type: 'navigate',
          value: locale === 'pt-BR' ? 'Português' : 'English',
          onPress: () => navigation.navigate('Language'),
          icon: '🌐',
        },
      ],
    },
    {
      title: t('settings.data'),
      items: [
        {
          label: t('settings.export'),
          type: 'action',
          onPress: () => setShowExportConfirm(true),
          icon: '📤',
        },
        {
          label: t('settings.share'),
          type: 'action',
          onPress: handleShare,
          icon: '🔗',
        },
        {
          label: t('settings.reset'),
          type: 'danger',
          onPress: handleReset,
          icon: '🗑️',
        },
      ],
    },
    {
      title: t('settings.about'),
      items: [
        {
          label: t('settings.rate'),
          type: 'action',
          onPress: handleRate,
          icon: '⭐',
        },
        {
          label: t('settings.privacy'),
          type: 'navigate',
          onPress: handlePrivacy,
          icon: '🔒',
        },
        {
          label: t('settings.terms'),
          type: 'navigate',
          onPress: handleTerms,
          icon: '📄',
        },
        {
          label: t('settings.version'),
          type: 'info',
          value: '3.0.0',
          icon: '📱',
        },
      ],
    },
  ];

  const renderSettingItem = (item, index) => {
    const isLast = index === settingsSections.length - 1;

    return (
      <TouchableOpacity
        key={item.label}
        style={[
          styles.settingItem,
          item.type === 'danger' && styles.dangerItem,
          { borderBottomColor: isDark ? '#333' : '#E5E5EA' },
          !isLast && styles.settingItemBorder,
        ]}
        onPress={item.onPress}
        disabled={item.type === 'toggle' || item.type === 'info'}
        activeOpacity={0.7}
      >
        <View style={styles.settingLeft}>
          <Text style={styles.settingIcon}>{item.icon}</Text>
          <Text
            style={[
              styles.settingTitle,
              { color: item.type === 'danger' ? colors.danger : colors.text },
            ]}
          >
            {item.label}
          </Text>
        </View>

        <View style={styles.settingRight}>
          {item.type === 'toggle' && (
            <Switch
              value={item.value}
              onValueChange={item.onChange}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={item.value ? '#FFF' : '#F4F3F4'}
            />
          )}
          {item.type === 'info' && (
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {item.value}
            </Text>
          )}
          {(item.type === 'navigate' || item.type === 'action' || item.type === 'danger') && (
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen scrollable>
      <AppHeader
        title={t('settings.title')}
        leftComponent={<BackButton onPress={() => navigation.goBack()} />}
      />

      <FadeIn>
        {settingsSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <SectionHeader title={section.title} />
            <View
              style={[
                styles.sectionContent,
                {
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  ...theme.shadows.small,
                },
              ]}
            >
              {section.items.map((item, itemIndex) => (
                <View key={item.label}>
                  {renderSettingItem(item, itemIndex)}
                  {itemIndex < section.items.length - 1 && (
                    <Divider style={{ marginHorizontal: 16 }} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </FadeIn>

      {/* Dialogs */}
      <ConfirmDialog
        visible={showExportConfirm}
        title={t('settings.exportConfirmTitle')}
        message={t('settings.exportConfirmMessage')}
        confirmText={t('common.export')}
        cancelText={t('common.cancel')}
        onConfirm={() => {
          setShowExportConfirm(false);
          handleExport();
        }}
        onCancel={() => setShowExportConfirm(false)}
      />

      <ConfirmDialog
        visible={showResetConfirm}
        title={t('settings.resetConfirmTitle')}
        message={t('settings.resetConfirmMessage')}
        confirmText={t('common.reset')}
        cancelText={t('common.cancel')}
        onConfirm={confirmReset}
        onCancel={() => setShowResetConfirm(false)}
        danger
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionContent: {
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  dangerItem: {
    // Estilo visual para ações perigosas
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
    textAlign: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 15,
    marginRight: 4,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
});

export default SettingsScreen;