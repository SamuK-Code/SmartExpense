import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { FadeInView, SlideInView, ScaleInView } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';
import SimpleList from '../components/SimpleList';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function SettingsScreen() {
  const { CATEGORIES, categoryLimits, setCategoryLimit, expenses, cards } = useExpenses();
  const { colors, isDark, toggleTheme } = useTheme();
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [limitValue, setLimitValue] = useState('');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleExport = async () => {
    try {
      const csvContent = [
        ['Data', 'Descrição', 'Categoria', 'Cartão', 'Valor'].join(','),
        ...expenses.map(e => [
          e.date,
          `"${e.description}"`,
          CATEGORIES.find(c => c.id === e.category)?.name || e.category,
          e.cardId || 'N/A',
          e.amount,
        ].join(','))
      ].join('\n');

      const fileUri = FileSystem.documentDirectory + 'gastos.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      await Sharing.shareAsync(fileUri);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível exportar os dados');
    }
  };

  const openLimitModal = (category) => {
    setSelectedCategory(category);
    const currentLimit = categoryLimits[category.id] !== undefined ? categoryLimits[category.id] : category.limit;
    setLimitValue(currentLimit.toString());
    setLimitModalVisible(true);
  };

  const saveLimit = () => {
    const limit = parseFloat(limitValue.replace(',', '.'));
    if (isNaN(limit) || limit < 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }
    setCategoryLimit(selectedCategory.id, limit);
    setLimitModalVisible(false);
    Alert.alert('Sucesso', `Limite de ${selectedCategory.name} atualizado!`);
  };

  const settingsItems = [
    {
      id: 'darkMode',
      icon: isDark ? 'moon-outline' : 'sunny-outline',
      title: 'Modo Escuro',
      subtitle: isDark ? 'Ativado' : 'Desativado',
      action: 'toggle',
      value: isDark,
    },
    {
      id: 'export',
      icon: 'download-outline',
      title: 'Exportar Dados',
      subtitle: 'CSV para planilha',
      action: 'export',
    },
  ];

  const renderSettingItem = (item, index) => (
    <SlideInView key={item.id} delay={index * 100}>
      <TouchableOpacity
        style={[styles.settingItem, { backgroundColor: colors.card }]}
        onPress={() => {
          if (item.action === 'toggle') toggleTheme();
          if (item.action === 'export') handleExport();
        }}
      >
        <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name={item.icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
        </View>
        {item.action === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={item.value ? colors.primary : '#f4f3f4'}
          />
        ) : (
          <Ionicons name="chevron-forward-outline" size={20} color={colors.textLight} />
        )}
      </TouchableOpacity>
    </SlideInView>
  );

  const renderCategoryItem = (cat, index) => {
    const currentLimit = categoryLimits[cat.id] !== undefined ? categoryLimits[cat.id] : cat.limit;
    return (
      <SlideInView key={cat.id} delay={index * 60}>
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.card }]}
          onPress={() => openLimitModal(cat)}
        >
          <View style={[styles.settingIcon, { backgroundColor: cat.color + '15' }]}>
            <Ionicons name={cat.icon} size={20} color={cat.color} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>{cat.name}</Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              Limite: {formatCurrency(currentLimit)}
            </Text>
          </View>
          <Ionicons name="create-outline" size={18} color={colors.textLight} />
        </TouchableOpacity>
      </SlideInView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Configurações" showStats={false} />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* General Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GERAL</Text>
          {settingsItems.map((item, index) => renderSettingItem(item, index))}
        </View>

        {/* Category Limits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ORÇAMENTO POR CATEGORIA</Text>
          {CATEGORIES.map((cat, index) => renderCategoryItem(cat, index))}
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ESTATÍSTICAS</Text>
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total de gastos</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{expenses.length}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Cartões cadastrados</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{cards?.length || 0}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Limit Modal */}
      <Modal visible={limitModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScaleInView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Limite: {selectedCategory?.name}
              </Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="Valor do limite"
                keyboardType="decimal-pad"
                value={limitValue}
                onChangeText={setLimitValue}
                placeholderTextColor={colors.textLight}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setLimitModalVisible(false)}>
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={saveLimit}>
                  <Text style={styles.modalButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScaleInView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
  },
  section: { paddingHorizontal: 16, marginBottom: 24, paddingTop: 16 },
  sectionTitle: {
    fontSize: 12, fontWeight: 'bold', marginBottom: 8,
    marginLeft: 4, letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  settingIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  statsCard: {
    padding: 16, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
  },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalContent: {
    width: '100%', maxWidth: 320, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalInput: {
    borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalButton: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
  },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
