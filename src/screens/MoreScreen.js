import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';

const MenuItem = ({ icon, title, subtitle, onPress, colors }) => (
  <TouchableOpacity 
    style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
      <Ionicons name={icon} size={22} color={colors.primary} />
    </View>
    <View style={styles.textContainer}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
  </TouchableOpacity>
);

const SectionTitle = ({ title, colors }) => (
  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
);

export default function MoreScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header com usuário */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.displayName || 'Usuário'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              @{user?.username || 'username'}
            </Text>
          </View>
        </View>

        {/* Seção: Finanças */}
        <SectionTitle title="FINANÇAS" colors={colors} />
        <MenuItem 
          icon="card-outline" 
          title={t('cards')} 
          subtitle="Gerenciar cartões e limites"
          onPress={() => navigation.navigate('Cards')}
          colors={colors}
        />
        <MenuItem 
          icon="calendar-outline" 
          title={t('planning')} 
          subtitle="Metas e planejamento"
          onPress={() => navigation.navigate('Planning')}
          colors={colors}
        />

        {/* Seção: Grupo */}
        <SectionTitle title="GRUPO" colors={colors} />
        <MenuItem 
          icon="people-outline" 
          title={t('group')} 
          subtitle="Sincronizar com parceiro"
          onPress={() => navigation.navigate('Group')}
          colors={colors}
        />
        <MenuItem 
          icon="sync-outline" 
          title={t('sync')} 
          subtitle="Sincronização manual"
          onPress={() => navigation.navigate('Sync')}
          colors={colors}
        />

        {/* Seção: Configurações */}
        <SectionTitle title="CONFIGURAÇÕES" colors={colors} />
        <MenuItem 
          icon="settings-outline" 
          title={t('settings')} 
          subtitle="Preferências do app"
          onPress={() => navigation.navigate('Settings')}
          colors={colors}
        />
        <MenuItem 
          icon="language-outline" 
          title={t('language')} 
          subtitle="PT-BR / English"
          onPress={() => navigation.navigate('Language')}
          colors={colors}
        />
        <MenuItem 
          icon="grid-outline" 
          title={t('categories')} 
          subtitle="Gerenciar categorias"
          onPress={() => navigation.navigate('Categories')}
          colors={colors}
        />

        {/* Logout */}
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: colors.danger }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sair da Conta</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          Check Finances v2.1
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
  },
});
