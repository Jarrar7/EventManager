import './src/lib/rtl'; // MUST be first — sets I18nManager.isRTL before any screen module evaluates
import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, View, I18nManager, Platform, Linking } from 'react-native';
import * as Updates from 'expo-updates';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/auth/LoginScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import OwnerTabs from './src/navigation/OwnerTabs';
import WorkerTabs from './src/navigation/WorkerTabs';

// forceRTL is now handled in src/lib/rtl.js (imported first above).
// We still need to reload the native layout engine once on first launch.
const wasAlreadyRTL = I18nManager.isRTL;

function parseHashParams(url) {
  const hash = url.split('#')[1];
  if (!hash) return {};
  return Object.fromEntries(
    hash.split('&').map(pair => {
      const [key, ...rest] = pair.split('=');
      return [key, rest.join('=')];
    })
  );
}

function RootScreen({ passwordResetPending, setPasswordResetPending }) {
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (!wasAlreadyRTL && Platform.OS !== 'web') {
      Updates.reloadAsync().catch(() => {});
    }
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' }}>
        <ActivityIndicator size="large" color="#4f6ef7" />
      </View>
    );
  }

  if (passwordResetPending) {
    return (
      <ResetPasswordScreen
        onComplete={async () => {
          await supabase.auth.signOut();
          setPasswordResetPending(false);
        }}
      />
    );
  }

  if (!session) return <LoginScreen />;
  if (profile?.role === 'owner') return <OwnerTabs />;
  return <WorkerTabs />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // data is fresh for 2 minutes
      cacheTime: 1000 * 60 * 10,  // keep unused cache for 10 minutes
      retry: 1,
    },
  },
});

export default function App() {
  const [passwordResetPending, setPasswordResetPending] = useState(false);

  useEffect(() => {
    function handleUrl(url) {
      if (!url) return;
      const params = parseHashParams(url);
      if (params.type === 'recovery' && params.access_token) {
        supabase.auth
          .setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          })
          .then(() => setPasswordResetPending(true));
      }
    }

    // Cold start: app opened via deep link while not running
    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });

    // Warm start: app already open in background
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootScreen
            passwordResetPending={passwordResetPending}
            setPasswordResetPending={setPasswordResetPending}
          />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
    </QueryClientProvider>
  );
}
