import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import InventoryScreen from '../screens/InventoryScreen';
import InputOutputScreen from '../screens/InputOutputScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  console.log('🧭 AppNavigator rendering');
  
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            
            if (route.name === 'Dashboard') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Inventory') {
              iconName = focused ? 'medical' : 'medical-outline';
            } else if (route.name === 'InOut') {
              iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
            } else if (route.name === 'Alerts') {
              iconName = focused ? 'notifications' : 'notifications-outline';
            } else if (route.name === 'History') {
              iconName = focused ? 'time' : 'time-outline';
            }
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerShown: true,
        })}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ title: 'Dashboard' }}
        />
        <Tab.Screen 
          name="Inventory" 
          component={InventoryScreen} 
          options={{ title: 'Inventory' }}
        />
        <Tab.Screen 
          name="InOut" 
          component={InputOutputScreen} 
          options={{ title: 'In/Out' }}
        />
        <Tab.Screen 
          name="Alerts" 
          component={NotificationsScreen} 
          options={{ title: 'Alerts' }}
        />
        <Tab.Screen 
          name="History" 
          component={HistoryScreen} 
          options={{ title: 'History' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}