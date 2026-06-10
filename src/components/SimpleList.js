import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { SlideInView, FadeInView } from './AnimatedComponents';

export default function SimpleList({
  data,
  renderItem,
  keyExtractor,
  emptyTitle,
  emptySubtitle,
  emptyIcon = 'add-circle-outline',
  onAddPress,
  addButtonText,
  showAddButton = true,
  contentContainerStyle,
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const _emptyTitle = emptyTitle || t('noItem');
  const _emptySubtitle = emptySubtitle || t('addFirstItem');
  const _addButtonText = addButtonText || t('add');

  if (data.length === 0) {
    return (
      <FadeInView>
        <View style={styles.emptyContainer}>
          <Ionicons name={emptyIcon} size={64} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            {_emptyTitle}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
            {_emptySubtitle}
          </Text>
          {showAddButton && onAddPress && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={onAddPress}
            >
              <Ionicons name="add-outline" size={20} color="#fff" />
              <Text style={styles.addButtonText}>{_addButtonText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </FadeInView>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={({ item, index }) => (
        <SlideInView delay={index * 50}>
          {renderItem(item, index)}
        </SlideInView>
      )}
      keyExtractor={keyExtractor}
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={showAddButton && onAddPress ? (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={onAddPress}
        >
          <Ionicons name="add-outline" size={20} color="#fff" />
          <Text style={styles.addButtonText}>{_addButtonText}</Text>
        </TouchableOpacity>
      ) : null}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
  },
});
