import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { t } from '../../i18n/he';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  async function handleForgotPassword() {
    const trimmed = resetEmail.trim();
    if (!trimmed) {
      Alert.alert('שגיאה', 'יש להזין כתובת אימייל');
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: 'eventmanager://reset-password',
    });
    setResetLoading(false);
    if (error) {
      Alert.alert('שגיאה', 'האימייל לא נמצא במערכת');
    } else {
      Alert.alert('נשלח!', 'קישור לאיפוס סיסמה נשלח לאימייל שלך');
      setForgotMode(false);
      setResetEmail('');
    }
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t.missingFields, t.enterEmailPassword);
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) Alert.alert(t.loginFailed, error.message);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>

        {/* App icon — colored circle with Hebrew initials */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>מא</Text>
        </View>

        <Text style={styles.title}>{t.appName}</Text>
        <Text style={styles.subtitle}>{t.signInToAccount}</Text>

        {forgotMode ? (
          <>
            <Text style={styles.label}>אימייל לאיפוס סיסמה</Text>
            <TextInput
              style={styles.input}
              placeholder={t.phEmail}
              placeholderTextColor="#9CA3AF"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="done"
              onSubmitEditing={handleForgotPassword}
              textContentType="username"
              autoComplete="off"
            />
            <TouchableOpacity
              style={[styles.button, resetLoading && styles.buttonDisabled]}
              onPress={handleForgotPassword}
              disabled={resetLoading}
              activeOpacity={0.8}
            >
              {resetLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>שלח קישור לאיפוס</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.forgotBtn} onPress={() => { setForgotMode(false); setResetEmail(''); }}>
              <Text style={styles.forgotText}>חזרה להתחברות</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>{t.email}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.phEmail}
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              textContentType="username"
              autoComplete="off"
            />

            <Text style={styles.label}>{t.password}</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="oneTimeCode"
              autoComplete="off"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>{t.signIn}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn} onPress={() => setForgotMode(true)}>
              <Text style={styles.forgotText}>שכחתי סיסמה?</Text>
            </TouchableOpacity>
          </>
        )}

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    justifyContent: 'flex-start',
    paddingTop: SCREEN_HEIGHT * 0.18,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#5B6EF5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  iconText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a2e',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#5B6EF5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  forgotBtn: { alignItems: 'center', marginTop: 16, padding: 12 },
  forgotText: { fontSize: 15, color: '#5B6EF5', fontWeight: '600' },
});
