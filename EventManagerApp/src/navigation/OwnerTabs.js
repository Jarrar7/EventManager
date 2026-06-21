import React, { useState } from 'react';
import {
  Text, View, TouchableOpacity, ScrollView, StyleSheet, I18nManager,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cardShadow } from '../theme/shadows';
import { t } from '../i18n/he';
import StaffStack from './StaffStack';
import EventsStack from './EventsStack';
import PaymentsScreen from '../screens/owner/PaymentsScreen';
import DashboardScreen from '../screens/owner/DashboardScreen';

const rtl = I18nManager.isRTL;

// ── Settings screen ──────────────────────────────────────────────────────────

function SettingsScreen() {
  const { profile, session, signOut } = useAuth();
  const { c, theme, toggleTheme } = useTheme();
  const shadow = theme === 'light' ? cardShadow : {};
  const [language, setLanguage] = useState('he');

  const initial = profile?.name?.charAt(0)?.toUpperCase() ?? '?';
  const email   = session?.user?.email ?? '—';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 32 }}>
        <Text style={[styles.pageTitle, { color: c.text }]}>{t.settings}</Text>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
          <View style={[styles.profileAvatar, { backgroundColor: c.heroCircle }]}>
            <Text style={[styles.profileAvatarText, { color: c.accentGlyph }]}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: c.text }]}>{profile?.name}</Text>
            <Text style={[styles.profileEmail, { color: c.textMuted }]}>{email}</Text>
          </View>
        </View>

        {/* Language section */}
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>שפה</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
          <TouchableOpacity
            style={styles.langRow}
            onPress={() => setLanguage('he')}
            activeOpacity={0.7}
          >
            <Text style={[styles.langText, { color: c.text }]}>🇮🇱 עברית</Text>
            {language === 'he' && (
              <Text style={[styles.checkmark, { color: c.primary }]}>✓</Text>
            )}
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <View style={styles.langRow}>
            <Text style={[styles.langText, { color: c.textMuted }]}>🇸🇦 العربية</Text>
            <View style={[styles.soonBadge, { backgroundColor: c.primarySoft }]}>
              <Text style={[styles.soonBadgeText, { color: c.accentGlyph }]}>בקרוב</Text>
            </View>
          </View>
        </View>

        {/* Appearance section */}
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>מראה</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
          <TouchableOpacity style={styles.langRow} onPress={toggleTheme} activeOpacity={0.7}>
            <Text style={[styles.langText, { color: c.text }]}>
              {theme === 'dark' ? '🌙 מצב כהה' : '☀️ מצב בהיר'}
            </Text>
            <Text style={[styles.langText, { color: c.textMuted }]}>
              {theme === 'dark' ? 'עבור לבהיר' : 'עבור לכהה'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App info */}
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>אפליקציה</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
          <View style={styles.langRow}>
            <Text style={[styles.langText, { color: c.text }]}>גרסה</Text>
            <Text style={[styles.langText, { color: c.textMuted }]}>1.0.0</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: c.redSoft }]}
          onPress={signOut}
          activeOpacity={0.8}
        >
          <Text style={[styles.signOutText, { color: c.red }]}>{t.signOut}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Custom tab bar ────────────────────────────────────────────────────────────

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

// ── Navigator ─────────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

function tabIcon(name) {
  return ({ color, size }) => <Ionicons name={name} size={size} color={color} />;
}

export default function OwnerTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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
  // Settings
  pageTitle: {
    fontSize: 25, fontWeight: '800', marginTop: 16, marginBottom: 20,
    textAlign: rtl ? 'right' : 'left',
  },
  profileCard: {
    borderRadius: 16, borderWidth: 1,
    padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 24,
  },
  profileAvatar: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', marginEnd: 14,
  },
  profileAvatarText: { fontSize: 22, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '800', textAlign: rtl ? 'right' : 'left' },
  profileEmail: { fontSize: 14, marginTop: 2, textAlign: 'left' },

  sectionLabel: {
    fontSize: 13, fontWeight: '800', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
    textAlign: rtl ? 'right' : 'left',
  },
  card: {
    borderRadius: 16, borderWidth: 1, marginBottom: 20, overflow: 'hidden',
  },
  langRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  langText: { fontSize: 16, fontWeight: '500' },
  checkmark: { fontSize: 18, fontWeight: '700' },
  divider: { height: 1, marginHorizontal: 16 },
  soonBadge: {
    borderRadius: 9, paddingHorizontal: 10, paddingVertical: 3,
  },
  soonBadgeText: { fontSize: 12, fontWeight: '700' },
  signOutBtn: {
    borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 28,
  },
  signOutText: { fontSize: 17, fontWeight: '700' },

  // Custom tab bar
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
    alignSelf: 'center',
    width: 134,
    height: 5,
    borderRadius: 3,
    left: '50%',
    marginLeft: -67,
  },
});
