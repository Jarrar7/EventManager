import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../i18n/he';
import ShiftsScreen from '../screens/worker/ShiftsScreen';
import WorkerPaymentsScreen from '../screens/worker/WorkerPaymentsScreen';
import ProfileScreen from '../screens/worker/ProfileScreen';

const Tab = createBottomTabNavigator();

function tabIcon(name) {
  return ({ color }) => <Ionicons name={name} size={24} color={color} />;
}

export default function WorkerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#27ae60',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="MyShifts"   component={ShiftsScreen}         options={{ tabBarLabel: t.myShifts,   tabBarIcon: tabIcon('list-outline') }} />
      <Tab.Screen name="MyPayments" component={WorkerPaymentsScreen}  options={{ tabBarLabel: t.myPayments, tabBarIcon: tabIcon('wallet-outline') }} />
      <Tab.Screen name="Profile"    component={ProfileScreen}         options={{ tabBarLabel: t.profile,    tabBarIcon: tabIcon('person-outline') }} />
    </Tab.Navigator>
  );
}
