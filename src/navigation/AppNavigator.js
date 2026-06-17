import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import AddScreen from '../screens/AddScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CardsScreen from '../screens/CardsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Define a folga inferior com base no dispositivo para não sumir atrás do HUD
  const paddingBottomAmount = insets.bottom > 0 ? insets.bottom : 10;
  const tabBarHeight = 62 + paddingBottomAmount;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarButton: (props) => <TouchableOpacity {...props} activeOpacity={0.7} />,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: paddingBottomAmount,
          height: tabBarHeight,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Inicio':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Adicionar':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Historico':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Cartoes':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'Metas':
              iconName = focused ? 'pie-chart' : 'pie-chart-outline';
              break;
            default:
              iconName = 'checkbox-outline';
          }
          return <Ionicons name={iconName} size={size || 22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen name="Adicionar" component={AddScreen} options={{ tabBarLabel: 'Adicionar' }} />
      <Tab.Screen name="Historico" component={HistoryScreen} options={{ tabBarLabel: 'Histórico' }} />
      <Tab.Screen name="Cartoes" component={CardsScreen} options={{ tabBarLabel: 'Cartões' }} />
      <Tab.Screen name="Metas" component={GoalsScreen} options={{ tabBarLabel: 'Metas' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen 
        name="Configuracoes" 
        component={SettingsScreen}
        options={{ 
          headerShown: true,
          headerTitle: '',
        }}
      />
      <Stack.Screen 
        name="Notificacoes" 
        component={NotificationsScreen}
        options={{ 
          headerShown: true,
          headerTitle: '',
        }}
      />
    </Stack.Navigator>
  );
}