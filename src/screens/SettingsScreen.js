import React, { useState, useEffect } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal, TextInput } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import Toast from '../components/Toast';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const SettingsScreen = () => {
  const navigation = useNavigation();
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
    notifications 
  } = useApp();
  const { colors, darkMode, toggleDarkMode } = useTheme();

  // ✅ CORREÇÃO: useState do toast MOVIDO para antes do useEffect
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Modal de categorias
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('pricetag');
  const [newCatColor, setNewCatColor] = useState('#8B5CF6');

  // Configurar header dinamicamente baseado no tema
  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.bgCard,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
      },
      headerTintColor: colors.primary,
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="settings" size={20} color={colors.primary} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>Configurações</Text>
        </View>
      ),
    });
  }, [colors, navigation]);

  const iconOptions = [
    'pricetag', 'car', 'home', 'heart', 'school', 'game-controller', 'airplane', 'gift',
    'restaurant', 'bag', 'fitness', 'bus', 'phone-portrait', 'wifi', 'water', 'flame'
  ];

  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E'
  ];

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

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      showToast('Digite um nome para a categoria', 'error');
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
    showToast('Categoria adicionada!');
  };

  // ✅ CORREÇÃO: handleResetCategories agora só limpa categorias customizadas
  const handleResetCategories = () => {
    Alert.alert(
      'Resetar Categorias',
      'Isso removerá todas as categorias personalizadas e voltará para as padrões. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetar',
          style: 'destructive',
          onPress: () => {
            setCustomCategories([]);  // ✅ Só limpa categorias customizadas
            showToast('Categorias resetadas para padrão', 'warning');
          }
        }
      ]
    );
  };

  const toggleSound = (key) => {
    setSoundEnabled({ ...soundEnabled, [key]: !soundEnabled[key] });
  };

  const SettingRow = ({ icon, iconColor, iconBg, label, value, onPress, isSwitch, switchValue, onSwitchChange, danger }) => (
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
      {isSwitch ? (
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16 }}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Usuário</Text>
            <Text style={styles.profileEmail}>usuario@email.com</Text>
          </View>
          <TouchableOpacity style={styles.profileEdit}>
            <Ionicons name="create-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Aparência */}
        <Section title="Aparência">
          <SettingRow
            icon={darkMode ? 'sunny' : 'moon'}
            iconColor={colors.primary}
            label="Modo Escuro"
            isSwitch
            switchValue={darkMode}
            onSwitchChange={toggleDarkMode}
          />
        </Section>

        {/* Sons */}
        <Section title="Sons e Notificações">
          <SettingRow
            icon="musical-notes"
            iconColor="#10B981"
            label="Som ao adicionar"
            isSwitch
            switchValue={soundEnabled.add}
            onSwitchChange={() => toggleSound('add')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="trash"
            iconColor="#EF4444"
            label="Som ao excluir"
            isSwitch
            switchValue={soundEnabled.delete}
            onSwitchChange={() => toggleSound('delete')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="notifications"
            iconColor="#F59E0B"
            label="Som de notificação"
            isSwitch
            switchValue={soundEnabled.notif}
            onSwitchChange={() => toggleSound('notif')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="trophy"
            iconColor="#8B5CF6"
            label="Som de conquista"
            isSwitch
            switchValue={soundEnabled.achievement}
            onSwitchChange={() => toggleSound('achievement')}
          />
        </Section>

        {/* Categorias */}
        <Section title="Categorias">
          <SettingRow
            icon="add-circle"
            iconColor="#10B981"
            label="Adicionar Categoria"
            onPress={() => setCatModalVisible(true)}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="refresh"
            iconColor={colors.danger}
            iconBg="rgba(239,68,68,0.1)"
            label="Resetar Categorias"
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
                Categorias Atuais
              </Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>
              {categories.length}
            </Text>
          </View>
        </Section>

        {/* Dados */}
        <Section title="Dados e Backup">
          <SettingRow
            icon="download"
            iconColor="#3B82F6"
            label="Exportar Dados"
            onPress={handleExport}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="upload"
            iconColor="#10B981"
            label="Importar Dados"
            onPress={handleImport}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="trash"
            iconColor={colors.danger}
            iconBg="rgba(239,68,68,0.1)"
            label="Limpar Todos os Dados"
            danger
            onPress={handleClearData}
          />
        </Section>

        {/* Sobre */}
        <Section title="Sobre">
          <SettingRow
            icon="information-circle"
            iconColor={colors.textMuted}
            label="Finanças Pro"
            value="v3.0"
          />
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Adicionar Categoria */}
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
                <Ionicons name="add-circle" size={20} color="#10B981" />  Nova Categoria
              </Text>
              <TouchableOpacity onPress={() => setCatModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nome</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
                  placeholder="Ex: Viagem"
                  placeholderTextColor={colors.textMuted}
                  value={newCatName}
                  onChangeText={setNewCatName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Ícone</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScroll}>
                  {iconOptions.map(icon => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconChip,
                        { backgroundColor: newCatIcon === icon ? newCatColor + '20' : colors.bgTertiary },
                        newCatIcon === icon && { borderColor: newCatColor }
                      ]}
                      onPress={() => setNewCatIcon(icon)}
                    >
                      <Ionicons name={icon} size={20} color={newCatIcon === icon ? newCatColor : colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Cor</Text>
                <View style={styles.colorGrid}>
                  {colorOptions.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        newCatColor === color && styles.colorSelected
                      ]}
                      onPress={() => setNewCatColor(color)}
                    />
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#10B981' }]}
                onPress={handleAddCategory}
              >
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Salvar Categoria</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast {...toast} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  profileCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  profileAvatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  profileEdit: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingLeft: 4 },
  sectionCard: { borderRadius: 16, overflow: 'hidden' },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginLeft: 64 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalBody: { padding: 20 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { padding: 12, borderRadius: 12, fontSize: 15, borderWidth: 2, borderColor: 'transparent' },
  iconScroll: { paddingVertical: 4, gap: 8 },
  iconChip: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: 'transparent',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 8 
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  colorCircle: { width: 40, height: 40, borderRadius: 20 },
  colorSelected: { borderWidth: 3, borderColor: '#1E293B', transform: [{ scale: 1.1 }] },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginTop: 8 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default SettingsScreen;