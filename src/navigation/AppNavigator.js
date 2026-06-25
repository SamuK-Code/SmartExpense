// AppNavigator.js — Navegação com Círculos Financeiros (Arquivo 9/10)
// Substitui GroupScreen por CircleHubScreen, adiciona stack para CircleHub

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, View, Text } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import AddScreen from '../screens/AddScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CardsScreen from '../screens/CardsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CircleHubScreen from '../screens/CircleHubScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ═══════════════════════════════════════════════════
// TAB NAVIGATOR (Bottom Tabs)
// ═══════════════════════════════════════════════════

function TabNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslate();

  const paddingBottomAmount = insets.bottom > 0 ? insets.bottom : 10;
  const tabBarHeight = 62 + paddingBottomAmount;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted || colors.muted,
        tabBarButton: (props) => <TouchableOpacity {...props} activeOpacity={0.7} />,
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
          return <Ionicons name={iconName} size={size || 22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t('tab.home') }}
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
    </Stack.Navigator>
  );
}