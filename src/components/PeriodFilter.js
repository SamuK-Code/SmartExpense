import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const PERIODS = [
  { id: 'all', label: 'Todos' },
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: '7 Dias' },
  { id: 'month', label: 'Mês' },
  { id: 'year', label: 'Ano' },
];

export default function PeriodFilter({ selected, onSelect }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {PERIODS.map(period => (
          <TouchableOpacity
            key={period.id}
            style={[
              styles.button,
              selected === period.id && { backgroundColor: colors.primary },
            ]}
            onPress={() => onSelect(period.id)}
          >
            <Text
              style={[
                styles.text,
                selected === period.id && { color: '#fff', fontWeight: 'bold' },
                { color: selected === period.id ? '#fff' : colors.textSecondary },
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scroll: {
    paddingHorizontal: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 13,
  },
});
