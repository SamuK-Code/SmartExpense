import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { ScaleInView } from '../components/AnimatedComponents';

export default function CategoriesScreen({ navigation }) {
  const { categories, addCategory, updateCategory, deleteCategory, CATEGORIES } = useExpenses();
  const { colors } = useTheme();
  const { t } = useI18n();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [selectedIcon, setSelectedIcon] = useState('pricetag');

  // Categorias padrões do app (hardcoded para garantir que sempre existam)
  const defaultCategories = [
    { id: 'food', name: 'Alimentação', color: '#FF6B6B', icon: 'restaurant' },
    { id: 'transport', name: 'Transporte', color: '#4ECDC4', icon: 'car' },
    { id: 'leisure', name: 'Lazer', color: '#45B7D1', icon: 'game-controller' },
    { id: 'health', name: 'Saúde', color: '#96CEB4', icon: 'medical' },
    { id: 'housing', name: 'Moradia', color: '#FFEAA7', icon: 'home' },
    { id: 'education', name: 'Educação', color: '#DDA0DD', icon: 'school' },
    { id: 'shopping', name: 'Compras', color: '#98D8C8', icon: 'cart' },
    { id: 'others', name: 'Outros', color: '#F7DC6F', icon: 'ellipsis-horizontal' },
  ];

  // Usar CATEGORIES do contexto (que inclui padrões se state.categories estiver vazio)
  const displayCategories = (CATEGORIES && CATEGORIES.length > 0) ? CATEGORIES : defaultCategories;

  // Cores para escolher
  const colorsList = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#FFB6C1', '#87CEEB',
    '#FFA07A', '#20B2AA', '#778899', '#B0C4DE', '#D2B48C',
    '#CD853F', '#D8BFD8', '#BC8F8F', '#F4A460', '#2E8B57',
    '#4682B4', '#5F9EA0', '#6495ED', '#DC143C', '#00CED1',
  ];

  // Ícones para escolher
  const iconsList = [
    'pricetag', 'restaurant', 'car', 'game-controller', 'medical',
    'home', 'school', 'cart', 'airplane', 'book',
    'fitness', 'gift', 'phone-portrait', 'wifi', 'water',
    'flame', 'flash', 'moon', 'sunny', 'cloud',
    'musical-note', 'film', 'camera', 'heart', 'star',
    'trophy', 'diamond', 'hammer', 'construct', 'bus',
    'bicycle', 'boat', 'train', 'paw', 'leaf',
  ];

  const handleSave = () => {
    if (!categoryName || !categoryName.trim()) {
      Alert.alert(t('error'), t('requiredField'));
      return;
    }

    const data = {
      name: categoryName.trim(),
      color: selectedColor,
      icon: selectedIcon,
    };

    try {
      if (editingCategory) {
        updateCategory(editingCategory.id, data);
      } else {
        addCategory(data);
      }
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert(t('error'), t('error'));
    }
  };

  const handleDelete = (category) => {
    Alert.alert(
      t('confirm') + ' ' + t('delete'),
      t('wantToDelete') + ' "' + category.name + '"?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteCategory(category.id) },
      ]
    );
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name || '');
    setSelectedColor(category.color || '#FF6B6B');
    setSelectedIcon(category.icon || 'pricetag');
    setModalVisible(true);
  };

  const openAdd = () => {
    setEditingCategory(null);
    setCategoryName('');
    setSelectedColor('#FF6B6B');
    setSelectedIcon('pricetag');
    setModalVisible(true);
  };

  const resetForm = () => {
    setCategoryName('');
    setSelectedColor('#FF6B6B');
    setSelectedIcon('pricetag');
    setEditingCategory(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('categories')}</Text>

        {displayCategories.map((category, index) => (
          <TouchableOpacity
            key={category.id || index}
            style={[styles.categoryItem, { backgroundColor: colors.card }]}
            onPress={() => openEdit(category)}
            onLongPress={() => handleDelete(category)}
          >
            <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
              <Ionicons name={category.icon || 'pricetag'} size={22} color={category.color} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryName, { color: colors.text }]}>{category.name || 'Sem nome'}</Text>
              <View style={[styles.colorDot, { backgroundColor: category.color }]} />
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: colors.danger + '15' }]}
          onPress={() => {
            Alert.alert(
              t('resetCategories'),
              t('resetCategoriesDesc'),
              [
                { text: t('cancel'), style: 'cancel' },
                { text: t('reset'), style: 'destructive', onPress: () => {
                  // 1. Deletar TODAS as categorias existentes
                  const allCats = [...(categories || [])];
                  allCats.forEach(cat => {
                    try { deleteCategory(cat.id); } catch(e) {}
                  });
                  // 2. Adicionar as padrões com IDs únicos baseados no timestamp
                  const now = Date.now();
                  defaultCategories.forEach((cat, idx) => {
                    addCategory({
                      ...cat,
                      id: 'default_' + cat.id + '_' + (now + idx),
                    });
                  });
                }},
              ]
            );
          }}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.danger} />
          <Text style={{ color: colors.danger, marginLeft: 8, fontWeight: '600' }}>Resetar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={openAdd}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => { setModalVisible(false); resetForm(); }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingCategory ? t('editCategory') : t('newCategory')}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Nome da categoria"
              placeholderTextColor={colors.textLight}
              value={categoryName}
              onChangeText={setCategoryName}
            />

            <Text style={[styles.label, { color: colors.text }]}>{t('categoryColor')}</Text>
            <View style={styles.colorRow}>
              {colorsList.map((color, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>{t('categoryIcon')}</Text>
            <View style={styles.iconRow}>
              {iconsList.map((icon, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.iconOption,
                    { backgroundColor: selectedIcon === icon ? colors.primary + '20' : colors.inputBg, borderColor: selectedIcon === icon ? colors.primary : colors.border }
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Ionicons name={icon} size={20} color={selectedIcon === icon ? colors.primary : colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.textLight }]}
                onPress={() => { setModalVisible(false); resetForm(); }}
              >
                <Text style={styles.modalButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.modalButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600'
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4
  },
  resetButton: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 8
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingRight: 16
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingRight: 16
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
});