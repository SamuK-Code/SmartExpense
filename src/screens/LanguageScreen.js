import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n, availableLanguages } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { FadeInView, SlideInView } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';
import BackButton from '../components/BackButton';

export default function LanguageScreen({ navigation }) {
  const { language, changeLanguage, t } = useI18n();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('language')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('selectLanguage')}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Escolha o idioma de exibição do aplicativo
          </Text>
        </FadeInView>

        {availableLanguages.map((lang, index) => (
          <SlideInView key={lang.code} delay={index * 100}>
            <TouchableOpacity
              style={[
                styles.languageItem,
                { backgroundColor: colors.card },
                language === lang.code && { 
                  borderColor: colors.primary,
                  borderWidth: 2,
                }
              ]}
              onPress={() => changeLanguage(lang.code)}
            >
              <View style={styles.languageLeft}>
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={styles.languageInfo}>
                  <Text style={[
                    styles.languageName,
                    { color: colors.text },
                    language === lang.code && { fontWeight: 'bold' }
                  ]}>
                    {lang.name}
                  </Text>
                  <Text style={[styles.languageCode, { color: colors.textSecondary }]}>
                    {lang.code}
                  </Text>
                </View>
              </View>

              {language === lang.code && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </SlideInView>
        ))}

        <FadeInView delay={300}>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              O idioma selecionado será aplicado em todo o aplicativo, incluindo menus, botões e mensagens.
            </Text>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },

  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    opacity: 0.7,
  },

  languageItem: {
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
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 32,
    marginRight: 14,
  },
  languageInfo: {
    justifyContent: 'center',
  },
  languageName: {
    fontSize: 16,
  },
  languageCode: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.6,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.8,
  },
});
