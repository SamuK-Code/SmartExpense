import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import Toast from '../components/Toast';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const SettingsScreen = () => {
  const { 
    soundEnabled, 
    setSoundEnabled, 
    exportData, 
    importData, 
    clearAllData, 
    notifications 
  } = useApp();
  const { colors, darkMode, toggleDarkMode } = useTheme();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const fileUri = FileSystem.documentDirectory + `financas_pro_backup_${new Date().toISOString().slice(0,10)}.json`;
      await FileSystem.writeAsStringAsync(fileUri, data);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
      showToast('Dados exportados!');
    } catch (e) {
      showToast('Erro ao exportar', 'error');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const success = await importData(fileContent);

      if (success) {
        showToast('Dados importados!');
      } else {
        showToast('Erro ao importar arquivo', 'error');
      }
    } catch (e) {
      showToast('Erro ao importar arquivo', 'error');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '⚠️ ATENÇÃO!',
      'Isso apagará TODOS os dados permanentemente. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar Tudo',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Tem certeza?',
              'Esta ação não pode ser desfeita.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Confirmar',
                  style: 'destructive',
                  onPress: () => {
                    clearAllData();
                    showToast('Todos os dados foram apagados', 'warning');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const toggleSound = (key) => {
    setSoundEnabled({ ...soundEnabled, [key]: !soundEnabled[key] });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          <Ionicons name="settings" size={20} color={colors.primary} />  Configurações
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={[styles.profileSection, { backgroundColor: colors.bgCard }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={32} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>Usuário</Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>usuario@email.com</Text>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Aparência</Text>
          <View style={[styles.settingsItem, { backgroundColor: colors.bgCard }]}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.bgTertiary }]}>
                <Ionicons name={darkMode ? 'sunny' : 'moon'} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.itemText, { color: colors.textPrimary }]}>Modo Escuro</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#E2E8F0', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Sounds */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Sons</Text>
          {[
            { key: 'add', label: 'Som ao adicionar', icon: 'musical-notes' },
            { key: 'delete', label: 'Som ao excluir', icon: 'trash' },
            { key: 'notif', label: 'Som de notificação', icon: 'notifications' },
            { key: 'achievement', label: 'Som de conquista', icon: 'trophy' },
          ].map(item => (
            <View key={item.key} style={[styles.settingsItem, { backgroundColor: colors.bgCard }]}>
              <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.bgTertiary }]}>
                  <Ionicons name={item.icon} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.itemText, { color: colors.textPrimary }]}>{item.label}</Text>
              </View>
              <Switch
                value={soundEnabled[item.key]}
                onValueChange={() => toggleSound(item.key)}
                trackColor={{ false: '#E2E8F0', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Dados</Text>

          <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.bgCard }]} onPress={handleExport}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.bgTertiary }]}>
                <Ionicons name="download" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.itemText, { color: colors.textPrimary }]}>Exportar Dados</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.bgCard }]} onPress={handleImport}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.bgTertiary }]}>
                <Ionicons name="upload" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.itemText, { color: colors.textPrimary }]}>Importar Dados</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.bgCard }]} onPress={handleClearData}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <Ionicons name="trash" size={18} color={colors.danger} />
              </View>
              <Text style={[styles.itemText, { color: colors.danger }]}>Limpar Todos os Dados</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Sobre</Text>
          <View style={[styles.settingsItem, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.itemText, { color: colors.textPrimary }]}>Finanças Pro</Text>
            <Text style={[styles.versionText, { color: colors.textMuted }]}>v3.0</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  profileSection: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  profileEmail: { fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingLeft: 4 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  itemText: { fontSize: 14, fontWeight: '500' },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  versionText: { fontSize: 14 },
});

export default SettingsScreen;
