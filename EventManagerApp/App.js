import './src/lib/rtl'; // MUST be first — sets I18nManager.isRTL before any screen module evaluates
import React, { useEffect } from 'react';
import { ActivityIndicator, View, I18nManager, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import OwnerTabs from './src/navigation/OwnerTabs';
import WorkerTabs from './src/navigation/WorkerTabs';

// forceRTL is now handled in src/lib/rtl.js (imported first above).
// We still need to reload the native layout engine once on first launch.
const wasAlreadyRTL = I18nManager.isRTL;

function RootScreen() {
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    // On native: if the layout engine hadn't seen RTL yet, trigger a full reload.
    // This runs once on first ever launch; after that wasAlreadyRTL is true.
    if (!wasAlreadyRTL && Platform.OS !== 'web') {
      Updates.reloadAsync().catch(() => {
        // expo-updates throws in Expo Go dev mode — safe to ignore.
        // The JS-side RTL (textAlign, manual flexDirection) already works.
        // For the native layout engine flip, do a full app restart once.
      });
    }
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' }}>
        <ActivityIndicator size="large" color="#4f6ef7" />
      </View>
    );
  }

  if (!session) return <LoginScreen />;
  if (profile?.role === 'owner') return <OwnerTabs />;
  return <WorkerTabs />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootScreen />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
