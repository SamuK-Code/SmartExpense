import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { formatDateFull } from '../utils/helpers';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { notifications, markNotificationAsRead, clearAllNotifications } = useApp();
  const { colors } = useTheme();

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
          <Ionicons name="notifications" size={20} color={colors.primary} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>Notificações</Text>
        </View>
      ),
    });
  }, [colors, navigation]);

  const getIconByType = (type) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  const getColorByType = (type) => {
    switch (type) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#3B82F6';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16 }}>
        {notifications.length > 0 && (
          <TouchableOpacity 
            style={[styles.clearBar, { backgroundColor: colors.bgCard }]}
            onPress={clearAllNotifications}
          >
            <Ionicons name="trash" size={18} color={colors.danger} />
            <Text style={[styles.clearText, { color: colors.danger }]}>Limpar Todas</Text>
          </TouchableOpacity>
        )}

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>Nenhuma notificação</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              As notificações aparecerão aqui quando houver atualizações importantes
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notificationCard,
                  { backgroundColor: colors.bgCard },
                  !notif.read && { borderLeftColor: getColorByType(notif.type), borderLeftWidth: 4 }
                ]}
                onPress={() => markNotificationAsRead(notif.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: getColorByType(notif.type) + '15' }]}>
                  <Ionicons name={getIconByType(notif.type)} size={22} color={getColorByType(notif.type)} />
                </View>

                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={[styles.notificationTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    {!notif.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                  </View>

                  <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                    {notif.message}
                  </Text>

                  <Text style={[styles.notificationDate, { color: colors.textMuted }]}>
                    {formatDateFull(notif.date)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  clearBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8,
    padding: 12, 
    borderRadius: 12,
    marginBottom: 16,
  },
  clearText: { fontSize: 14, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 80,
    paddingHorizontal: 32
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  notificationsList: { gap: 12 },
  notificationCard: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    padding: 16, 
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12 
  },
  notificationContent: { flex: 1 },
  notificationHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  notificationTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  notificationMessage: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  notificationDate: { fontSize: 11 },
});

export default NotificationsScreen;