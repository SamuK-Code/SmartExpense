import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'InteractionManager has been deprecated',
]);
require('./src/utils/InteractionManagerPatch');

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// ========== NOVOS CONTEXTS ==========
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { GroupProvider } from './src/contexts/GroupContext';

// ========== CONTEXTS EXISTENTES ==========
import { ExpenseProvider } from './src/context/ExpenseContext';
import { PlanningProvider } from './src/context/PlanningContext';
import { CashProvider } from './src/context/CashContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { I18nProvider, useI18n } from './src/context/I18nContext';
import ErrorBoundary from './src/utils/ErrorBoundary';

// ========== SCREENS EXISTENTES ==========
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

// ========== NOVAS SCREENS ==========
import LoginScreen from './src/screens/LoginScreen';
import GroupScreen from './src/screens/GroupScreen';
import SyncScreen from './src/screens/SyncScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ========== STACKS EXISTENTES ==========
function HomeStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="HomeMain" component={DashboardScreen} />
      <Stack.Screen name="EditExpense" component={EditExpenseScreen} />
    </Stack.Navigator>
  );
}

function ChartStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="ChartMain" component={ChartScreen} />
      <Stack.Screen name="ChartDetail" component={ChartDetailScreen} />
    </Stack.Navigator>
  );
}

function MenuStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="MenuMain" component={MoreScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

// ========== TAB NAVIGATOR (LOGADO) ==========
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
      <Tab.Screen name="AddTab" component={AddExpenseScreen} options={{ tabBarLabel: t('addExpense') }} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} options={{ tabBarLabel: t('history') }} />
      <Tab.Screen name="ChartsTab" component={ChartStack} options={{ tabBarLabel: t('charts') }} />
      <Tab.Screen name="PlanningTab" component={PlanningScreen} options={{ tabBarLabel: t('planning') }} />
      <Tab.Screen name="CardsTab" component={CardsScreen} options={{ tabBarLabel: t('cards') }} />
      <Tab.Screen name="GroupTab" component={GroupScreen} options={{ tabBarLabel: 'Grupo' }} />
      <Tab.Screen name="SyncTab" component={SyncScreen} options={{ tabBarLabel: 'Sync' }} />
      <Tab.Screen name="MenuTab" component={MenuStack} options={{ tabBarLabel: t('settings') }} />
    </Tab.Navigator>
  );
}

// ========== APP ROOT COM AUTH ==========
function AppRoot() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d1117', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#58a6ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {isAuthenticated ? <TabNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}

// ========== EXPORT ==========
export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <GroupProvider>
              <CashProvider>
                <PlanningProvider>
                  <ExpenseProvider>
                    <AppRoot />
                  </ExpenseProvider>
                </PlanningProvider>
              </CashProvider>
            </GroupProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
