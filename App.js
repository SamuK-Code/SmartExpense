import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@react-native-vector-icons/ionicons';

import { AppProvider } from './src/context/AppContext';
import { ThemeProvider } from './src/context/ThemeContext';

import HomeScreen from './src/screens/HomeScreen';
import AddScreen from './src/screens/AddScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import CardsScreen from './src/screens/CardsScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SplashScreen from './src/components/SplashScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Início':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Adicionar':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Histórico':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Cartões':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'Metas':
              iconName = focused ? 'flag' : 'flag-outline';
              break;
            default:
              iconName = 'help-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        headerShown: false,
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

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen 
                name="Configurações" 
                component={SettingsScreen}
                options={{ 
                  headerShown: true,
                  headerTitle: 'Configurações',
                  headerTintColor: '#8B5CF6',
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="auto" />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
