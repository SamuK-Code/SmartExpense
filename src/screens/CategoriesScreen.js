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
import { FadeInView, ScaleInView } from '../components/AnimatedComponents';
import AppHeader from '../components/AppHeader';

export default function CategoriesScreen() {
  const { categories, addCategory, updateCategory, deleteCategory, CATEGORIES } = useExpenses();
  const { colors } = useTheme();
  const { t } = useI18n();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [selectedIcon, setSelectedIcon] = useState('pricetag');

  const colorsList = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#FFB6C1', '#87CEEB',
    '#DDA0DD', '#98FB98', '#F0E68C', '#FFA07A', '#20B2AA',
  ];

  const iconsList = [
    'pricetag', 'restaurant', 'car', 'game-controller', 'medical',
    'home', 'school', 'cart', 'ellipsis-horizontal', 'airplane',
    'book', 'fitness', 'gift', 'phone-portrait', 'wifi',
  ];

  const handleSave = () => {
    if (!categoryName.trim()) {
      Alert.alert(t('error'), t('requiredField'));
      return;
    }

    const data = {
      name: categoryName.trim(),
      color: selectedColor,
      icon: selectedIcon,
    };

    if (editingCategory) {
      updateCategory(editingCategory.id, data);
    } else {
      addCategory(data);
    }

    setModalVisible(false);
    resetForm();
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
    setCategoryName(category.name);
    setSelectedColor(category.color);
    setSelectedIcon(category.icon);
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

  const displayCategories = categories.length > 0 ? categories : CATEGORIES;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('categories')} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {displayCategories.map((category, index) => (
          <FadeInView key={category.id} delay={index * 50}>
            <TouchableOpacity
              style={[styles.categoryItem, { backgroundColor: colors.card }]}
              onPress={() => openEdit(category)}
              onLongPress={() => handleDelete(category)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
                <Ionicons name={category.icon} size={22} color={category.color} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                <View style={[styles.colorDot, { backgroundColor: category.color }]} />
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          </FadeInView>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={openAdd}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <ScaleInView style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingCategory ? t('editCategory') : t('newCategory')}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder={t('categoryName')}
              placeholderTextColor={colors.textLight}
            />

            <Text style={[styles.label, { color: colors.text }]}>{t('categoryColor')}</Text>
            <View style={styles.colorGrid}>
              {colorsList.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color, borderWidth: selectedColor === color ? 3 : 0, borderColor: '#fff' }]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>{t('categoryIcon')}</Text>
            <View style={styles.iconGrid}>
              {iconsList.map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, { backgroundColor: selectedIcon === icon ? colors.primary + '15' : colors.background, borderWidth: selectedIcon === icon ? 1 : 0, borderColor: colors.primary }]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Ionicons name={icon} size={20} color={selectedIcon === icon ? colors.primary : colors.textLight} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.danger }]} onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.modalButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
                <Text style={styles.modalButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </ScaleInView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  categoryInfo: { flex: 1, marginLeft: 12 },
  categoryName: { fontSize: 15, fontWeight: '600' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 340, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: { borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 10, marginTop: 8 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  colorOption: { width: 32, height: 32, borderRadius: 16 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  iconOption: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
