import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

// Mapeamento de ícones padrões conhecidos para fallback quando categoria é removida
const DEFAULT_ICON_MAP = {
  'cat-food': { icon: 'restaurant', color: '#FF6B6B', name: 'Alimentação' },
  'cat-transport': { icon: 'car', color: '#4ECDC4', name: 'Transporte' },
  'cat-leisure': { icon: 'game-controller', color: '#45B7D1', name: 'Lazer' },
  'cat-health': { icon: 'medical', color: '#96CEB4', name: 'Saúde' },
  'cat-housing': { icon: 'home', color: '#FFEAA7', name: 'Moradia' },
  'cat-education': { icon: 'school', color: '#DDA0DD', name: 'Educação' },
  'cat-shopping': { icon: 'cart', color: '#98D8C8', name: 'Compras' },
  'cat-others': { icon: 'ellipsis-horizontal', color: '#F7DC6F', name: 'Outros' },
  'food': { icon: 'restaurant', color: '#FF6B6B', name: 'Alimentação' },
  'transport': { icon: 'car', color: '#4ECDC4', name: 'Transporte' },
  'leisure': { icon: 'game-controller', color: '#45B7D1', name: 'Lazer' },
  'health': { icon: 'medical', color: '#96CEB4', name: 'Saúde' },
  'housing': { icon: 'home', color: '#FFEAA7', name: 'Moradia' },
  'education': { icon: 'school', color: '#DDA0DD', name: 'Educação' },
  'shopping': { icon: 'cart', color: '#98D8C8', name: 'Compras' },
  'others': { icon: 'ellipsis-horizontal', color: '#F7DC6F', name: 'Outros' },
};

const getFallbackIcon = (item, category) => {
  // 1. Se o gasto tem icon/color salvos (novos gastos), usa eles
  if (item.categoryIcon && item.categoryColor) {
    return { 
      icon: item.categoryIcon, 
      color: item.categoryColor,
      name: category?.name || item.categoryName || 'Outros'
    };
  }
  // 2. Se a categoria ainda existe, usa ela
  if (category?.icon && category?.color) {
    return { 
      icon: category.icon, 
      color: category.color,
      name: category.name
    };
  }
  // 3. Tenta encontrar no mapa padrão pelo ID da categoria
  const mapped = DEFAULT_ICON_MAP[item.category];
  if (mapped) {
    return { 
      icon: mapped.icon, 
      color: mapped.color,
      name: mapped.name
    };
  }
  // 4. Fallback final: placeholder para ícones customizados
  return { 
    icon: 'help-circle-outline', 
    color: '#999',
    name: category?.name || 'Outros'
  };
};

const ExpenseListItem = memo(function ExpenseListItem({
  item, card, category, colors, t, onPress, onLongPress, onPay,
}) {
  const isPaid = item.paid === true;
  const isBill = item.isBill === true;
  const canPay = !isPaid && (isBill || !item.cardId);

  const fallback = getFallbackIcon(item, category);
  const iconName = fallback.icon;
  const iconColor = fallback.color;
  const categoryName = fallback.name;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={() => onPress(item.id)}
      onLongPress={() => onLongPress && onLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: (iconColor || '#999') + '15' }]}>
        <Ionicons name={iconName} size={20} color={iconColor || '#999'} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.desc, {
          color: colors.text,
          textDecorationLine: isPaid ? 'line-through' : 'none',
          opacity: isPaid ? 0.6 : 1,
        }]}>
          {item.description}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.cat, { color: iconColor || '#999' }]}>{categoryName}</Text>
          {isBill ? (
            <View style={[styles.badge, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="document-text-outline" size={10} color={colors.warning} />
              <Text style={[styles.badgeText, { color: colors.warning }]}>{t('bill')}</Text>
            </View>
          ) : card ? (
            <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="card-outline" size={10} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>{card?.customName || card?.name || ''}</Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="receipt-outline" size={10} color={colors.warning} />
              <Text style={[styles.badgeText, { color: colors.warning }]}>{t('standalone')}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.date, { color: colors.textLight }]}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, {
          color: isPaid ? colors.textLight : colors.danger,
          textDecorationLine: isPaid ? 'line-through' : 'none',
        }]}>
          {formatCurrency(parseFloat(item.amount))}
        </Text>
        {canPay && onPay && (
          <TouchableOpacity style={[styles.payBtn, { backgroundColor: colors.success }]} onPress={() => onPay(item)}>
            <Text style={styles.payText}>{t('pay')}</Text>
          </TouchableOpacity>
        )}
        {isPaid && (
          <View style={[styles.paidBadge, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="checkmark-circle" size={10} color={colors.success} />
            <Text style={[styles.paidText, { color: colors.success }]}>{t('paid')}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 12 },
  desc: { fontSize: 15, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 6 },
  cat: { fontSize: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 3 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  date: { fontSize: 11, marginTop: 4 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: 'bold' },
  payBtn: { marginTop: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  payText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, gap: 3 },
  paidText: { fontSize: 10, fontWeight: '600' },
});

export default ExpenseListItem;