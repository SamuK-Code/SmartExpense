import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { FadeInView, SlideInView } from '../components/AnimatedComponents';

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, language, changeLanguage, availableLanguages } = useI18n();
  const { clearAllData } = useExpenses();
  const { logout } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleClearData = () => {
    Alert.alert(
      t('clearDataConfirm'),
      t('clearDataWarning'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clearAll'),
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Alert.alert(t('success'), t('dataCleared'));
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Deseja sair da sua conta?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings')}</Text>

        {/* Language */}
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Language')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="language-outline" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t('language')}</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {availableLanguages.find(l => l.code === language)?.name || language}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>

        {/* Theme */}
        <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={22} color={colors.secondary} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t('theme')}</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {isDark ? t('darkMode') : t('lightMode')}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={isDark ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Sound */}
        <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.info + '20' }]}>
              <Ionicons name="volume-high-outline" size={22} color={colors.info} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t('sound')}</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {soundEnabled ? t('enabled') : t('disabled')}
              </Text>
            </View>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={soundEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Notifications */}
        <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="notifications-outline" size={22} color={colors.warning} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t('notifications')}</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t('soon')}</Text>
            </View>
          </View>
        </View>

        {/* Export Data */}
        <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="download-outline" size={22} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t('exportData')}</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t('soon')}</Text>
            </View>
          </View>
        </View>

        {/* Import Data */}
        <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="upload-outline" size={22} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t('importData')}</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t('soon')}</Text>
            </View>
          </View>
        </View>

        {/* Delete Data */}
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.card }]}
          onPress={handleClearData}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.danger + '20' }]}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.danger }]}>{t('clearData')}</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {t('clearDataWarning')}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.danger} />
        </TouchableOpacity>

        {/* About */}
        <View style={[styles.aboutSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.aboutTitle, { color: colors.text }]}>{t('about')}</Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            {t('appName')} v2.1
          </Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            {t('developedIn')}
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  settingValue: { fontSize: 13, marginTop: 2, opacity: 0.7 },
  aboutSection: {
    padding: 20,
    borderRadius: 14,
    marginTop: 20,
    alignItems: 'center',
  },
  aboutTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  aboutText: { fontSize: 13, marginBottom: 4, opacity: 0.7 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});