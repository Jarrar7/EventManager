import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, I18nManager,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../context/ThemeContext';
import { cardShadow } from '../../../theme/shadows';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Toast, { useToast } from '../../../components/Toast';
import { t } from '../../../i18n/he';

const rtl = I18nManager.isRTL;

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 10;
}

export default function AddWorkerScreen({ navigation }) {
  const { c, theme } = useTheme();
  const shadow = theme === 'light' ? cardShadow : {};
  const queryClient = useQueryClient();

  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { showToast, toastMessage, toastOpacity } = useToast();

  function validateFields() {
    const errors = {};
    if (!name.trim())     errors.name     = 'שדה חובה';
    if (!email.trim())    errors.email    = 'שדה חובה';
    if (!password.trim()) errors.password = 'שדה חובה';
    if (phone.trim() && !isValidPhone(phone)) errors.phone = 'מספר טלפון לא תקין';
    return errors;
  }

  async function handleAdd() {
    setErrorMsg('');
    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (password.length < 6) { setErrorMsg(t.passwordMinLength); return; }

    setLoading(true);
    try {
      const { data: { session: ownerSession } } = await supabase.auth.getSession();
      if (!ownerSession) throw new Error('Owner session not found. Please log in again.');

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
      if (signUpError) throw new Error(signUpError.message);

      const userId = signUpData.user?.id;
      if (!userId) throw new Error('Could not get worker ID after signup.');

      const { error: profileError } = await supabase.from('users').insert({
        id: userId, name: name.trim(), phone: phone.trim() || null,
        role: 'worker', language_preference: 'he',
      });
      if (profileError) throw new Error('Profile save failed: ' + profileError.message);

      await supabase.auth.setSession({
        access_token:  ownerSession.access_token,
        refresh_token: ownerSession.refresh_token,
      });

      setLoading(false);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      showToast('העובד נוסף בהצלחה ✓');
      setTimeout(() => navigation.navigate('StaffList'), 800);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message);
    }
  }

  const inputBase = {
    backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 15, fontWeight: '700', color: c.text, textAlign: 'right',
    ...(theme === 'light' ? cardShadow : {}),
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
          <Text style={[styles.title, { color: c.text }]}>{t.addWorker}</Text>

          {errorMsg !== '' && (
            <View style={[styles.errorBox, { backgroundColor: c.redSoft }]}>
              <Text style={[styles.errorText, { color: c.red }]}>⚠️ {errorMsg}</Text>
            </View>
          )}

          {/* Name */}
          <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{t.fullName}</Text>
          <TextInput
            style={[inputBase, fieldErrors.name && { borderColor: c.red }, { marginBottom: 13 }]}
            placeholder={t.phName}
            placeholderTextColor={c.textMuted}
            value={name}
            onChangeText={v => { setName(v); setFieldErrors(p => ({ ...p, name: undefined })); }}
            textAlign={rtl ? 'right' : 'left'}
          />
          {fieldErrors.name && <Text style={[styles.fieldError, { color: c.red }]}>{fieldErrors.name}</Text>}

          {/* Phone */}
          <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{t.phone}</Text>
          <TextInput
            style={[inputBase, fieldErrors.phone && { borderColor: c.red }, { marginBottom: 13, textAlign: 'right', writingDirection: 'ltr' }]}
            placeholder={t.phPhone}
            placeholderTextColor={c.textMuted}
            value={phone}
            onChangeText={v => { setPhone(v); setFieldErrors(p => ({ ...p, phone: undefined })); }}
            keyboardType="phone-pad"
            textAlign="right"
            writingDirection="ltr"
          />
          {fieldErrors.phone && <Text style={[styles.fieldError, { color: c.red }]}>{fieldErrors.phone}</Text>}

          {/* Email */}
          <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{t.emailRequired}</Text>
          <TextInput
            style={[inputBase, fieldErrors.email && { borderColor: c.red }, { marginBottom: 13, textAlign: 'right', writingDirection: 'ltr' }]}
            placeholder={t.phWorkerEmail}
            placeholderTextColor={c.textMuted}
            value={email}
            onChangeText={v => { setEmail(v); setFieldErrors(p => ({ ...p, email: undefined })); }}
            autoCapitalize="none"
            keyboardType="email-address"
            textAlign="right"
            writingDirection="ltr"
          />
          {fieldErrors.email && <Text style={[styles.fieldError, { color: c.red }]}>{fieldErrors.email}</Text>}

          {/* Password */}
          <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{t.passwordRequired}</Text>
          <TextInput
            style={[inputBase, fieldErrors.password && { borderColor: c.red }, { marginBottom: 13, textAlign: 'right', writingDirection: 'ltr' }]}
            placeholder={t.phPassword}
            placeholderTextColor={c.textMuted}
            value={password}
            onChangeText={v => { setPassword(v); setFieldErrors(p => ({ ...p, password: undefined })); }}
            secureTextEntry
            textAlign="right"
            writingDirection="ltr"
          />
          {fieldErrors.password && <Text style={[styles.fieldError, { color: c.red }]}>{fieldErrors.password}</Text>}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: c.primary, opacity: loading ? 0.6 : 1 }]}
            onPress={handleAdd}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={c.onPrimary} />
              : <Text style={[styles.primaryBtnText, { color: c.onPrimary }]}>{t.addWorker}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.navigate('StaffList')}>
            <Text style={[styles.cancelText, { color: c.textMuted }]}>{t.cancel}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast message={toastMessage} opacity={toastOpacity} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 48 },
  title: { fontSize: 25, fontWeight: '800', marginBottom: 24, textAlign: rtl ? 'right' : 'left' },
  errorBox: { borderRadius: 10, padding: 14, marginBottom: 16 },
  errorText: { fontSize: 14, fontWeight: '600', textAlign: rtl ? 'right' : 'left' },
  fieldLabel: {
    fontSize: 13, fontWeight: '700', marginBottom: 6,
    textAlign: rtl ? 'right' : 'left',
  },
  fieldError: {
    fontSize: 12, fontWeight: '600', marginTop: -8, marginBottom: 10,
    textAlign: rtl ? 'right' : 'left',
  },
  primaryBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', marginTop: 14, padding: 10 },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
