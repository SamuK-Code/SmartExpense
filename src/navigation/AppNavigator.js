import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import { useAuth } from '../contexts/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import GroupScreen from '../screens/GroupScreen';
import SyncScreen from '../screens/SyncScreen';

// Placeholder para screens existentes do seu app
// Substitua por suas telas reais
const HomePlaceholder = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>🏠 Home (sua tela principal)</Text>
  </View>
);

const ExpensesPlaceholder = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>💸 Despesas (sua tela)</Text>
  </View>
);

const StatsPlaceholder = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>📊 Estatísticas (sua tela)</Text>
  </View>
);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Ícones simples para tabs
const TabIcon = ({ icon, focused }) => (
  <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
    {icon}
  </Text>
);

// Tab Navigator principal (logado)
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomePlaceholder}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ExpensesTab"
        component={ExpensesPlaceholder}
        options={{
          tabBarLabel: 'Despesas',
          tabBarIcon: ({ focused }) => <TabIcon icon="💸" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="GroupTab"
        component={GroupScreen}
        options={{
          tabBarLabel: 'Grupo',
          tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SyncTab"
        component={SyncScreen}
        options={{
          tabBarLabel: 'Sync',
          tabBarIcon: ({ focused }) => <TabIcon icon="🔄" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="StatsTab"
        component={StatsPlaceholder}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator raiz
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  placeholderText: {
    color: '#888',
    fontSize: 18,
  },
  tabBar: {
    backgroundColor: '#16213e',
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    paddingBottom: 8,
    paddingTop: 8,
    height: 64,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
});

export default AppNavigator;
