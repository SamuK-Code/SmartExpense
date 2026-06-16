import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import AddScreen from '../screens/AddScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CardsScreen from '../screens/CardsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { colors, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Início':
              iconName = 'home';
              break;
            case 'Adicionar':
              iconName = 'plus-circle';
              break;
            case 'Histórico':
              iconName = 'history';
              break;
            case 'Cartões':
              iconName = 'credit-card';
              break;
            case 'Metas':
              iconName = 'bullseye';
              break;
          }
          return <FontAwesome5 name={iconName} size={focused ? 22 : 20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Adicionar" component={AddScreen} />
      <Tab.Screen name="Histórico" component={HistoryScreen} />
      <Tab.Screen name="Cartões" component={CardsScreen} />
      <Tab.Screen name="Metas" component={GoalsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
