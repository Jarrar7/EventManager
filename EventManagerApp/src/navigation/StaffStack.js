import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StaffListScreen from '../screens/owner/staff/StaffListScreen';
import AddWorkerScreen from '../screens/owner/staff/AddWorkerScreen';
import EditWorkerScreen from '../screens/owner/staff/EditWorkerScreen';

const Stack = createNativeStackNavigator();

export default function StaffStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StaffList" component={StaffListScreen} />
      <Stack.Screen name="AddWorker" component={AddWorkerScreen} />
      <Stack.Screen name="EditWorker" component={EditWorkerScreen} />
    </Stack.Navigator>
  );
}
