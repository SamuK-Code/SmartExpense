import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

export default function SettingsScreen() {
  const { 
    CATEGORIES, 
    DEFAULT_CATEGORIES, 
    AVAILABLE_ICONS, 
    AVAILABLE_COLORS,
    categoryLimits, 
    setCategoryLimit,
    addCategory,
    deleteCategory,
    updateCategory,
    expenses,
  } = useExpenses();
  const { colors, isDark } = useTheme();

  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [limitValue, setLimitValue] = useState('');

  // Category management modals
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // New category form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('star-outline');
  const [newCategoryColor, setNewCategoryColor] = useState('#FF6B6B');
  const [newCategoryLimit, setNewCategoryLimit] = useState('');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const openLimitModal = (category) => {
    if (!category) return;
    setSelectedCategory(category);
    const currentLimit = categoryLimits[category.id] !== undefined ? categoryLimits[category.id] : category.limit;
    setLimitValue(currentLimit.toString());
    setTimeout(() => {
      setLimitModalVisible(true);
    }, 50);
  };

  const saveLimit = () => {
    if (!limitValue || isNaN(parseFloat(limitValue))) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }
    const limit = parseFloat(limitValue.replace(',', '.'));
    setCategoryLimit(selectedCategory.id, limit);
    setLimitModalVisible(false);
    Alert.alert('Sucesso', `Limite de ${selectedCategory.name} atualizado!`);
  };

  const isDefaultCategory = (categoryId) => {
    return DEFAULT_CATEGORIES.some(c => c.id === categoryId);
  };

  const isCategoryUsed = (categoryId) => {
    return expenses.some(e => e.category === categoryId);
  };

  const handleDeleteCategory = (category) => {
    if (isDefaultCategory(category.id)) {
      Alert.alert('Não permitido', 'Categorias padrão não podem ser excluídas.');
      return;
    }
    if (isCategoryUsed(category.id)) {
      Alert.alert('Não permitido', `A categoria "${category.name}" está sendo usada em gastos. Exclua os gastos primeiro.`);
      return;
    }
    setCategoryToDelete(category);
    setDeleteConfirmVisible(true);
  };

  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      try {
        deleteCategory(categoryToDelete.id);
        setDeleteConfirmVisible(false);
        setCategoryToDelete(null);
        Alert.alert('Sucesso', 'Categoria excluída!');
      } catch (error) {
        Alert.alert('Erro', error.message);
      }
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Erro', 'Digite um nome para a categoria');
      return;
    }

    // Check if name already exists
    const nameExists = CATEGORIES.some(c => 
      c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (nameExists) {
      Alert.alert('Erro', 'Já existe uma categoria com este nome');
      return;
    }

    const limit = newCategoryLimit ? parseFloat(newCategoryLimit.replace(',', '.')) : 500;

    addCategory({
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
      color: newCategoryColor,
      limit: limit,
    });

    // Reset form
    setNewCategoryName('');
    setNewCategoryIcon('star-outline');
    setNewCategoryColor('#FF6B6B');
    setNewCategoryLimit('');
    setAddCategoryModalVisible(false);
    Alert.alert('Sucesso', `Categoria "${newCategoryName.trim()}" criada!`);
  };

  const renderCategoryItem = (cat, index) => {
    const currentLimit = categoryLimits[cat.id] !== undefined ? categoryLimits[cat.id] : cat.limit;
    const isDefault = isDefaultCategory(cat.id);

    return (
      <SlideInView key={cat.id} delay={index * 50}>
        <TouchableOpacity
          style={[styles.categoryCard, { backgroundColor: colors.card }]}
          onPress={() => openLimitModal(cat)}
        >
          <View style={styles.categoryLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
              <Ionicons name={cat.icon} size={22} color={cat.color} />
            </View>
            <View>
              <Text style={[styles.categoryName, { color: colors.text }]}>
                {cat.name} {!isDefault && '✨'}
              </Text>
              <Text style={[styles.categoryLimit, { color: colors.textSecondary }]}>
                Limite: {formatCurrency(currentLimit)}
              </Text>
            </View>
          </View>
          <View style={styles.categoryRight}>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary + '20' }]}
              onPress={() => openLimitModal(cat)}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            {!isDefault && (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.danger + '20' }]}
                onPress={() => handleDeleteCategory(cat)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </SlideInView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Configuracoes" />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Add Category Button */}
        <FadeInView>
          <TouchableOpacity
            style={[styles.addCategoryButton, { backgroundColor: colors.primary }]}
            onPress={() => setAddCategoryModalVisible(true)}
          >
            <Ionicons name="add-outline" size={24} color="#fff" />
            <Text style={styles.addCategoryText}>Nova Categoria</Text>
          </TouchableOpacity>
        </FadeInView>

        {/* Categories List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            CATEGORIAS ({CATEGORIES.length})
          </Text>
          {CATEGORIES.map((cat, index) => renderCategoryItem(cat, index))}
        </View>
      </ScrollView>

      {/* Limit Modal */}
      <Modal visible={limitModalVisible && selectedCategory !== null} transparent animationType="fade">
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

      {/* Add Category Modal */}
      <Modal visible={addCategoryModalVisible} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScaleInView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nova Categoria</Text>

              {/* Name Input */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nome</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="Ex: Academia 💪"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholderTextColor={colors.textLight}
              />

              {/* Icon Picker */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ícone</Text>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: colors.inputBg }]}
                onPress={() => setIconPickerVisible(true)}
              >
                <Ionicons name={newCategoryIcon} size={24} color={newCategoryColor} />
                <Text style={[styles.pickerText, { color: colors.text }]}>{newCategoryIcon}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
              </TouchableOpacity>

              {/* Color Picker */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Cor</Text>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: colors.inputBg }]}
                onPress={() => setColorPickerVisible(true)}
              >
                <View style={[styles.colorPreview, { backgroundColor: newCategoryColor }]} />
                <Text style={[styles.pickerText, { color: colors.text }]}>{newCategoryColor}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
              </TouchableOpacity>

              {/* Limit Input */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Limite (R$)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="500"
                keyboardType="decimal-pad"
                value={newCategoryLimit}
                onChangeText={setNewCategoryLimit}
                placeholderTextColor={colors.textLight}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.border }]} 
                  onPress={() => {
                    setAddCategoryModalVisible(false);
                    setNewCategoryName('');
                    setNewCategoryIcon('star-outline');
                    setNewCategoryColor('#FF6B6B');
                    setNewCategoryLimit('');
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.primary }]} 
                  onPress={handleAddCategory}
                >
                  <Text style={styles.modalButtonText}>Criar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScaleInView>
        </View>
      </Modal>

      {/* Icon Picker Modal */}
      <Modal visible={iconPickerVisible} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.pickerModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Escolher Ícone</Text>
              <TouchableOpacity onPress={() => setIconPickerVisible(false)}>
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.iconGrid}>
              {AVAILABLE_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconItem,
                    newCategoryIcon === icon && { 
                      backgroundColor: newCategoryColor + '30',
                      borderColor: newCategoryColor,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => {
                    setNewCategoryIcon(icon);
                    setIconPickerVisible(false);
                  }}
                >
                  <Ionicons name={icon} size={28} color={newCategoryColor} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Color Picker Modal */}
      <Modal visible={colorPickerVisible} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.pickerModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Escolher Cor</Text>
              <TouchableOpacity onPress={() => setColorPickerVisible(false)}>
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.colorGrid}>
              {AVAILABLE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorItem,
                    { backgroundColor: color },
                    newCategoryColor === color && { 
                      borderColor: colors.text,
                      borderWidth: 3,
                    },
                  ]}
                  onPress={() => {
                    setNewCategoryColor(color);
                    setColorPickerVisible(false);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteConfirmVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <ScaleInView>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Ionicons name="warning-outline" size={48} color={colors.danger} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Excluir Categoria?</Text>
              <Text style={[styles.confirmText, { color: colors.textSecondary }]}>
                A categoria "{categoryToDelete?.name}" será excluída permanentemente.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.border }]} 
                  onPress={() => {
                    setDeleteConfirmVisible(false);
                    setCategoryToDelete(null);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.danger }]} 
                  onPress={confirmDeleteCategory}
                >
                  <Text style={styles.modalButtonText}>Excluir</Text>
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
  content: { flex: 1 },

  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addCategoryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  section: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },

  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryLimit: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  pickerText: {
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 20,
  },

  // Picker modals
  pickerModalContent: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  iconItem: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  colorItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
  },
});
