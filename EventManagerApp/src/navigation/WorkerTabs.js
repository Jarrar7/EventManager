import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { t } from '../i18n/he';
import ShiftsScreen from '../screens/worker/ShiftsScreen';
import WorkerPaymentsScreen from '../screens/worker/WorkerPaymentsScreen';
import ProfileScreen from '../screens/worker/ProfileScreen';

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }) {
  const { c } = useTheme();
  return (
    <View style={[styles.tabBar, { backgroundColor: c.tabBarBg, borderTopColor: c.tabBarBorder }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const color = isFocused ? c.primary : c.tabInactive;

        function onPress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <TouchableOpacity key={route.key} style={styles.tab} onPress={onPress} activeOpacity={0.7}>
            {options.tabBarIcon && options.tabBarIcon({ color, size: 24 })}
            <Text style={[styles.tabLabel, { color }]}>{options.tabBarLabel}</Text>
          </TouchableOpacity>
        );
      })}
      <View style={[styles.homeIndicator, { backgroundColor: c.homeIndicator }]} />
    </View>
  );
}

function tabIcon(name) {
  return ({ color, size }) => <Ionicons name={name} size={size} color={color} />;
}

export default function WorkerTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="MyShifts"   component={ShiftsScreen}        options={{ tabBarLabel: t.myShifts,   tabBarIcon: tabIcon('list-outline') }} />
      <Tab.Screen name="MyPayments" component={WorkerPaymentsScreen} options={{ tabBarLabel: t.myPayments, tabBarIcon: tabIcon('wallet-outline') }} />
      <Tab.Screen name="Profile"    component={ProfileScreen}        options={{ tabBarLabel: t.profile,    tabBarIcon: tabIcon('person-outline') }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 78,
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  tab: { flex: 1, alignItems: 'center', gap: 5 },
  tabLabel: { fontSize: 10.5, fontWeight: '600' },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 134,
    height: 5,
    borderRadius: 3,
    left: '50%',
    marginLeft: -67,
  },
});
