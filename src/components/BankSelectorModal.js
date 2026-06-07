import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BANKS, BANK_TYPES, getPopularBanks } from '../utils/BanksData';
import { SlideInView, ScaleInView } from './AnimatedComponents';

export default function BankSelectorModal({ visible, onSelect, onClose, selectedBankId }) {
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredBanks = useMemo(() => {
    let banks = filterType === 'all' ? BANKS : BANKS.filter(b => b.type === filterType);
    if (search.trim()) {
      const query = search.toLowerCase();
      banks = banks.filter(b => b.name.toLowerCase().includes(query));
    }
    return banks;
  }, [search, filterType]);

  const popularBanks = getPopularBanks();

  if (!BANKS || BANKS.length === 0) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.header }]}>
              <Text style={[styles.headerTitle, { color: colors.headerText }]}>Escolher Banco</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close-outline" size={24} color={colors.headerText} />
              </TouchableOpacity>
            </View>
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Erro ao carregar bancos</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.header }]}>
            <Text style={[styles.headerTitle, { color: colors.headerText }]}>Escolher Banco</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-outline" size={24} color={colors.headerText} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar banco..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={colors.textLight}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Type Filter - Compact height, white text on selected */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeFilter}>
            {BANK_TYPES.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  filterType === type.id && { backgroundColor: colors.primary },
                ]}
                onPress={() => setFilterType(type.id)}
              >
                <Text
                  style={[
                    styles.typeText,
                    filterType === type.id && { color: '#fff', fontWeight: 'bold' },
                    { color: filterType === type.id ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Content ScrollView */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.contentScroll}>
            {/* Popular Banks (when no search and all filter) */}
            {!search && filterType === 'all' && popularBanks.length > 0 && (
              <View style={styles.popularSection}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MAIS USADOS</Text>
                <View style={styles.popularGrid}>
                  {popularBanks.map(bank => (
                    <TouchableOpacity
                      key={bank.id}
                      style={[
                        styles.popularCard,
                        selectedBankId === bank.id && {
                          borderColor: bank.color,
                          borderWidth: 2,
                          backgroundColor: bank.color + (isDark ? '20' : '15'),
                        },
                        { backgroundColor: colors.card },
                      ]}
                      onPress={() => onSelect(bank)}
                    >
                      <View style={[styles.bankIconLarge, { backgroundColor: bank.color + '20' }]}>
                        <Ionicons name={bank.icon} size={24} color={bank.color} />
                      </View>
                      <Text style={[styles.popularName, { color: colors.text }]}>{bank.name}</Text>
                      {selectedBankId === bank.id && (
                        <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                          <Ionicons name="checkmark-outline" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* All Banks List */}
            <View style={styles.allBanksSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {search ? 'RESULTADOS' : 'TODOS OS BANCOS'}
              </Text>

              {filteredBanks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={32} color={colors.textLight} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum banco encontrado</Text>
                </View>
              ) : (
                filteredBanks.map((bank, index) => (
                  <SlideInView key={bank.id} delay={index * 30}>
                    <TouchableOpacity
                      style={[
                        styles.bankItem,
                        selectedBankId === bank.id && {
                          backgroundColor: bank.color + (isDark ? '20' : '15'),
                          borderColor: bank.color,
                          borderWidth: 1,
                        },
                        { backgroundColor: colors.card },
                      ]}
                      onPress={() => onSelect(bank)}
                    >
                      <View style={[styles.bankIcon, { backgroundColor: bank.color + '15' }]}>
                        <Ionicons name={bank.icon} size={20} color={bank.color} />
                      </View>
                      <View style={styles.bankInfo}>
                        <Text style={[styles.bankName, { color: colors.text }]}>{bank.name}</Text>
                        <Text style={[styles.bankType, { color: colors.textSecondary }]}>
                          {BANK_TYPES.find(t => t.id === bank.type)?.name || bank.type}
                        </Text>
                      </View>
                      {selectedBankId === bank.id && (
                        <Ionicons name="checkmark-circle-outline" size={22} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  </SlideInView>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  typeFilter: {
    paddingHorizontal: 12,
    marginBottom: 8,
    maxHeight: 42,
    minHeight: 42,
  },
  typeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    alignSelf: 'center',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contentScroll: {
    flex: 1,
  },
  popularSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  popularCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bankIconLarge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  popularName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allBanksSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '600',
  },
  bankType: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
});
