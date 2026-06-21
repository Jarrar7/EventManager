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
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cardShadow } from '../../theme/shadows';
import { supabase } from '../../lib/supabase';
import { t } from '../../i18n/he';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const rtl = I18nManager.isRTL;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { c, theme, toggleTheme } = useTheme();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  async function handleForgotPassword() {
    const trimmed = resetEmail.trim();
    if (!trimmed) { Alert.alert('שגיאה', 'יש להזין כתובת אימייל'); return; }
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

  const shadow = theme === 'light' ? cardShadow : {};

  const inputStyle = {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: '700',
    color: c.text,
    marginBottom: 16,
    textAlign: rtl ? 'right' : 'left',
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Theme toggle — top-right in RTL */}
      <TouchableOpacity
        style={[styles.themeToggle, { backgroundColor: c.card, borderColor: c.border }]}
        onPress={toggleTheme}
        activeOpacity={0.8}
      >
        <Ionicons
          name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
          size={20}
          color={c.accentGlyph}
        />
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, shadow]}>

        {/* App icon */}
        <View style={[styles.iconCircle, { backgroundColor: c.primarySoft }]}>
          <Text style={[styles.iconText, { color: theme === 'dark' ? c.accentGlyph : c.primary }]}>
            מא
          </Text>
        </View>

        <Text style={[styles.title, { color: c.text }]}>{t.appName}</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>{t.signInToAccount}</Text>

        {forgotMode ? (
          <>
            <Text style={[styles.label, { color: c.textMuted }]}>אימייל לאיפוס סיסמה</Text>
            <TextInput
              style={inputStyle}
              placeholder={t.phEmail}
              placeholderTextColor={c.textMuted}
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="done"
              onSubmitEditing={handleForgotPassword}
              textContentType="username"
              autoComplete="off"
              writingDirection="ltr"
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: c.primary }, resetLoading && styles.buttonDisabled]}
              onPress={handleForgotPassword}
              disabled={resetLoading}
              activeOpacity={0.8}
            >
              {resetLoading
                ? <ActivityIndicator color={c.onPrimary} />
                : <Text style={[styles.buttonText, { color: c.onPrimary }]}>שלח קישור לאיפוס</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => { setForgotMode(false); setResetEmail(''); }}
            >
              <Text style={[styles.forgotText, { color: c.primary }]}>חזרה להתחברות</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: c.textMuted }]}>{t.email}</Text>
            <TextInput
              style={inputStyle}
              placeholder={t.phEmail}
              placeholderTextColor={c.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              textContentType="username"
              autoComplete="off"
              writingDirection="ltr"
            />

            <Text style={[styles.label, { color: c.textMuted }]}>{t.password}</Text>
            <TextInput
              style={inputStyle}
              placeholder="••••••••"
              placeholderTextColor={c.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="oneTimeCode"
              autoComplete="off"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              writingDirection="ltr"
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: c.primary }, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={c.onPrimary} />
                : <Text style={[styles.buttonText, { color: c.onPrimary }]}>{t.signIn}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn} onPress={() => setForgotMode(true)}>
              <Text style={[styles.forgotText, { color: c.primary }]}>שכחתי סיסמה?</Text>
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
    justifyContent: 'flex-start',
    paddingTop: SCREEN_HEIGHT * 0.18,
    paddingHorizontal: 20,
  },

  themeToggle: {
    position: 'absolute',
    top: 56,
    // RTL: right side of screen is physical left, but 'end' respects RTL
    end: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    width: '100%',
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 26,
    fontWeight: '800',
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 28,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: rtl ? 'right' : 'left',
  },

  button: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '800' },

  forgotBtn: { alignItems: 'center', marginTop: 16, padding: 12 },
  forgotText: { fontSize: 13, fontWeight: '700' },
});
