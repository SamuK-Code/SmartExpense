import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'InteractionManager has been deprecated',
]);
require('./src/utils/InteractionManagerPatch');

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { GroupProvider } from './src/context/GroupContext';
import { ExpenseProvider } from './src/context/ExpenseContext';
import { PlanningProvider } from './src/context/PlanningContext';
import { CashProvider } from './src/context/CashContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { I18nProvider, useI18n } from './src/context/I18nContext';
import ErrorBoundary from './src/utils/ErrorBoundary';

import DashboardScreen from './src/screens/DashboardScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import EditExpenseScreen from './src/screens/EditExpenseScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ChartScreen from './src/screens/ChartScreen';
import ChartDetailScreen from './src/screens/ChartDetailScreen';
import CardsScreen from './src/screens/CardsScreen';
import PlanningScreen from './src/screens/PlanningScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LanguageScreen from './src/screens/LanguageScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import MoreScreen from './src/screens/MoreScreen';
import LoginScreen from './src/screens/LoginScreen';
import GroupScreen from './src/screens/GroupScreen';
import SyncScreen from './src/screens/SyncScreen';

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
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EditExpense" 
        component={EditExpenseScreen} 
        options={{ title: 'Editar Gasto' }}
      />
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
      }}
    >
      <Stack.Screen 
        name="Charts" 
        component={ChartScreen} 
        options={{ title: 'Gráficos' }}
      />
      <Stack.Screen 
        name="ChartDetail" 
        component={ChartDetailScreen} 
        options={{ title: 'Detalhes' }}
      />
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
      }}
    >
      <Stack.Screen 
        name="More" 
        component={MoreScreen} 
        options={{ title: 'Mais' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Configurações' }}
      />
      <Stack.Screen 
        name="Language" 
        component={LanguageScreen} 
        options={{ title: 'Idioma' }}
      />
      <Stack.Screen 
        name="Categories" 
        component={CategoriesScreen} 
        options={{ title: 'Categorias' }}
      />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'AddTab') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'HistoryTab') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'ChartsTab') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'PlanningTab') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'CardsTab') iconName = focused ? 'card' : 'card-outline';
          else if (route.name === 'GroupTab') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'SyncTab') iconName = focused ? 'sync' : 'sync-outline';
          else if (route.name === 'MenuTab') iconName = focused ? 'menu' : 'menu-outline';
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
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: t('home') }} />
      <Tab.Screen name="AddTab" component={AddExpenseScreen} options={{ tabBarLabel: t('add') }} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} options={{ tabBarLabel: t('history') }} />
      <Tab.Screen name="ChartsTab" component={ChartStack} options={{ tabBarLabel: t('charts') }} />
      <Tab.Screen name="PlanningTab" component={PlanningScreen} options={{ tabBarLabel: t('planning') }} />
      <Tab.Screen name="CardsTab" component={CardsScreen} options={{ tabBarLabel: t('cards') }} />
      <Tab.Screen name="GroupTab" component={GroupScreen} options={{ tabBarLabel: t('group') || 'Grupo' }} />
      <Tab.Screen name="SyncTab" component={SyncScreen} options={{ tabBarLabel: t('sync') || 'Sync' }} />
      <Tab.Screen name="MenuTab" component={MenuStack} options={{ tabBarLabel: t('menu') }} />
    </Tab.Navigator>
  );
}

function AppRoot() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1117' }}>
        <ActivityIndicator size="large" color="#58a6ff" />
        <Text style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <TabNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <GroupProvider>
              <ExpenseProvider>
                <CashProvider>
                  <PlanningProvider>
                    <StatusBar style="auto" />
                    <AppRoot />
                  </PlanningProvider>
                </CashProvider>
              </ExpenseProvider>
            </GroupProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}