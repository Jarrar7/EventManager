import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StyleSheet, I18nManager } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n/he';
import StaffStack from './StaffStack';
import EventsStack from './EventsStack';
import PaymentsScreen from '../screens/owner/PaymentsScreen';
import DashboardScreen from '../screens/owner/DashboardScreen';

const rtl = I18nManager.isRTL;

function SettingsScreen() {
  const { profile, session, signOut } = useAuth();
  const [language, setLanguage] = useState('he');

  const initial = profile?.name?.charAt(0)?.toUpperCase() ?? '?';
  const email = session?.user?.email ?? '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>{t.settings}</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.name}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
        </View>

        {/* Language section */}
        <Text style={styles.sectionLabel}>שפה</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.langRow} onPress={() => setLanguage('he')} activeOpacity={0.7}>
            <Text style={styles.langText}>🇮🇱 עברית</Text>
            {language === 'he' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.langRow}>
            <Text style={[styles.langText, { color: '#9CA3AF' }]}>🇸🇦 ערבית — בקרוב</Text>
          </View>
        </View>

        {/* App info */}
        <Text style={styles.sectionLabel}>אפליקציה</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>גרסה</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>{t.signOut}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();

function tabIcon(name) {
  return ({ color }) => <Ionicons name={name} size={24} color={color} />;
}

export default function OwnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5B6EF5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: t.dashboard, tabBarIcon: tabIcon('grid-outline') }} />
      <Tab.Screen name="Events"    component={EventsStack}     options={{ tabBarLabel: t.events,    tabBarIcon: tabIcon('calendar-outline') }} />
      <Tab.Screen name="Staff"     component={StaffStack}      options={{ tabBarLabel: t.staff,     tabBarIcon: tabIcon('people-outline') }} />
      <Tab.Screen name="Payments"  component={PaymentsScreen}  options={{ tabBarLabel: t.payments,  tabBarIcon: tabIcon('cash-outline') }} />
      <Tab.Screen name="Settings"  component={SettingsScreen}  options={{ tabBarLabel: t.settings,  tabBarIcon: tabIcon('settings-outline') }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6F9' },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  pageTitle: {
    fontSize: 26, fontWeight: '700', color: '#1a1a2e',
    marginTop: 16, marginBottom: 20,
    textAlign: rtl ? 'right' : 'left',
  },

  profileCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 24,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#5B6EF5',
    justifyContent: 'center', alignItems: 'center', marginEnd: 14,
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', textAlign: rtl ? 'right' : 'left' },
  profileEmail: { fontSize: 14, color: '#9CA3AF', marginTop: 2, textAlign: 'left' },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#9CA3AF',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
    textAlign: rtl ? 'right' : 'left',
  },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },

  langRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  langText: { fontSize: 16, color: '#1a1a2e', fontWeight: '500' },
  checkmark: { fontSize: 18, color: '#5B6EF5', fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#F4F6F9', marginHorizontal: 16 },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  infoLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
  infoValue: { fontSize: 15, color: '#9CA3AF' },

  signOutBtn: {
    backgroundColor: '#e74c3c', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  signOutText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
