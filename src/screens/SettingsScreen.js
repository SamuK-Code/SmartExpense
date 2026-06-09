import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { FadeInView, SlideInView } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, language, changeLanguage, availableLanguages } = useI18n();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('settings')} />

      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings')}</Text>
        </FadeInView>

        {/* Language */}
        <SlideInView delay={100}>
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Language')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
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
        </SlideInView>

        {/* Theme */}
        <SlideInView delay={200}>
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.warning + '15' }]}>
                <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={22} color={colors.warning} />
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
        </SlideInView>

        {/* Notifications */}
        <SlideInView delay={300}>
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="notifications-outline" size={22} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{t('notifications')}</Text>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>Em breve</Text>
              </View>
            </View>
            <Switch
              value={true}
              disabled={true}
              trackColor={{ false: '#767577', true: colors.success }}
              thumbColor={'#f4f3f4'}
            />
          </View>
        </SlideInView>

        {/* Export Data */}
        <SlideInView delay={400}>
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.info + '15' }]}>
                <Ionicons name="download-outline" size={22} color={colors.info} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{t('exportData')}</Text>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>Em breve</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </SlideInView>

        {/* Import Data */}
        <SlideInView delay={500}>
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.info + '15' }]}>
                <Ionicons name="upload-outline" size={22} color={colors.info} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{t('importData')}</Text>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>Em breve</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </SlideInView>

        {/* About */}
        <SlideInView delay={600}>
          <View style={[styles.aboutSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.aboutTitle, { color: colors.text }]}>{t('about')}</Text>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
              {t('appName')} v1.0.0
            </Text>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
              Desenvolvido com ❤️ no Brasil
            </Text>
          </View>
        </SlideInView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
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
});
