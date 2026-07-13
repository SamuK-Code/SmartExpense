// AppNavigator.js — Navegação com Círculos Financeiros + UI Refinada
// ✨ REFINAMENTOS: Scale animation nos tabs, Haptic feedback, badge animado

import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, View, Text, Animated, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { useApp } from '../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import HomeScreen from '../screens/HomeScreen';
import AddScreen from '../screens/AddScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CardsScreen from '../screens/CardsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CircleHubScreen from '../screens/CircleHubScreen';
import BudgetScreen from '../screens/BudgetScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ═══════════════════════════════════════════════════
// TAB BUTTON COM SCALE ANIMATION + HAPTIC
// ═══════════════════════════════════════════════════
const AnimatedTabButton = ({ children, onPress, accessibilityState }) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const focused = accessibilityState?.selected;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => onPress?.());
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.tabButton}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════
// ANIMATED BADGE
// ═══════════════════════════════════════════════════
const AnimatedBadge = ({ count, colors }) => {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (count > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [count]);

  return (
    <Animated.View style={[
      styles.badgeContainer,
      { backgroundColor: colors.danger, transform: [{ scale: pulseAnim }] }
    ]}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════
// TAB NAVIGATOR (Bottom Tabs)
// ═══════════════════════════════════════════════════

function TabNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslate();
  const { unreadNotificationsCount } = useApp();

  const paddingBottomAmount = insets.bottom > 0 ? insets.bottom : 10;
  const tabBarHeight = 62 + paddingBottomAmount;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted || colors.muted,
        tabBarButton: (props) => <AnimatedTabButton {...props} />,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.card || colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: paddingBottomAmount,
          height: tabBarHeight,
          shadowColor: colors.shadow || '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Expenses':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'History':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Cards':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'Goals':
              iconName = focused ? 'flag' : 'flag-outline';
              break;
            case 'Circles':
              iconName = focused ? 'people-circle' : 'people-circle-outline';
              break;
            default:
              iconName = 'checkbox-outline';
          }
          return (
            <View>
              <Ionicons name={iconName} size={size || 22} color={color} />
              {route.name === 'Home' && unreadNotificationsCount > 0 && (
                <AnimatedBadge count={unreadNotificationsCount} colors={colors} />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ 
          tabBarLabel: t('tab.home'),
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={AddScreen}
        options={{ tabBarLabel: t('tab.add') }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: t('tab.history') }}
      />
      <Tab.Screen
        name="Cards"
        component={CardsScreen}
        options={{ tabBarLabel: t('tab.cards') }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{ tabBarLabel: t('tab.goals') }}
      />
      <Tab.Screen
        name="Circles"
        component={CircleHubScreen}
        options={{ tabBarLabel: t('tab.groups') }}
      />
    </Tab.Navigator>
  );
}

// ═══════════════════════════════════════════════════
// STACK NAVIGATOR (Root)
// ═══════════════════════════════════════════════════

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Budget" component={BudgetScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -6,
    right: -10,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});