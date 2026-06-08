LogBox.ignoreLogs([
  'InteractionManager has been deprecated',
]);
import './src/utils/InteractionManagerPatch';

import { LogBox } from 'react-native';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { ExpenseProvider } from './src/context/ExpenseContext';
import { PlanningProvider } from './src/context/PlanningContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import ErrorBoundary from './src/utils/ErrorBoundary';

import HomeScreen from './src/screens/HomeScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import EditExpenseScreen from './src/screens/EditExpenseScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ChartScreen from './src/screens/ChartScreen';
import ChartDetailScreen from './src/screens/ChartDetailScreen';
import CardsScreen from './src/screens/CardsScreen';
import PlanningScreen from './src/screens/PlanningScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MenuScreen from './src/screens/MenuScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.header },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: 'bold' },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Novo Gasto' }} />
      <Stack.Screen name="EditExpense" component={EditExpenseScreen} options={{ title: 'Editar Gasto' }} />
      <Stack.Screen name="Cartoes" component={CardsScreen} options={{ title: 'Meus Cartoes' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configuracoes' }} />
    </Stack.Navigator>
  );
}

function ChartStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.header },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: 'bold' },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="ChartMain" component={ChartScreen} options={{ title: 'Graficos' }} />
      <Stack.Screen name="ChartDetail" component={ChartDetailScreen} options={{ title: 'Detalhes' }} />
    </Stack.Navigator>
  );
}

function MenuStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.header },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: 'bold' },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MenuMain" component={MenuScreen} options={{ title: 'Menu' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configuracoes' }} />
      <Stack.Screen name="EditExpense" component={EditExpenseScreen} options={{ title: 'Editar Gasto' }} />
      <Stack.Screen name="ChartDetail" component={ChartDetailScreen} options={{ title: 'Detalhes' }} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Inicio') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Adicionar') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'Historico') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Graficos') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'Planejar') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Cartoes') iconName = focused ? 'card' : 'card-outline';
          else if (route.name === 'Menu') iconName = focused ? 'menu' : 'menu-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: isDark ? '#000' : '#ccc',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Inicio" component={HomeStack} />
      <Tab.Screen name="Adicionar" component={AddExpenseScreen} />
      <Tab.Screen name="Historico" component={HistoryScreen} />
      <Tab.Screen name="Graficos" component={ChartStack} />
      <Tab.Screen name="Planejar" component={PlanningScreen} />
      <Tab.Screen name="Cartoes" component={CardsScreen} />
      <Tab.Screen name="Menu" component={MenuStack} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        {/* ORDEM CORRETA: PlanningProvider DEVE envolver ExpenseProvider */}
        <PlanningProvider>
          <ExpenseProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <TabNavigator />
            </NavigationContainer>
          </ExpenseProvider>
        </PlanningProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
