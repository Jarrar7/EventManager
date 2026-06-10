import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, I18nManager,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Toast, { useToast } from '../../../components/Toast';
import { t } from '../../../i18n/he';

const rtl = I18nManager.isRTL;

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 10;
}

export default function AddWorkerScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { showToast, toastMessage, toastOpacity } = useToast();

  function validateFields() {
    const errors = {};
    if (!name.trim()) errors.name = 'שדה חובה';
    if (!email.trim()) errors.email = 'שדה חובה';
    if (!password.trim()) errors.password = 'שדה חובה';
    if (phone.trim() && !isValidPhone(phone)) errors.phone = 'מספר טלפון לא תקין';
    return errors;
  }

  async function handleAdd() {
    setErrorMsg('');

    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (password.length < 6) {
      setErrorMsg(t.passwordMinLength);
      return;
    }

    setLoading(true);

    try {
      const { data: { session: ownerSession } } = await supabase.auth.getSession();
      if (!ownerSession) throw new Error('Owner session not found. Please log in again.');

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) throw new Error(signUpError.message);

      const userId = signUpData.user?.id;
      if (!userId) throw new Error('Could not get worker ID after signup.');

      const { error: profileError } = await supabase.from('users').insert({
        id: userId,
        name: name.trim(),
        phone: phone.trim() || null,
        role: 'worker',
        language_preference: 'he',
      });
      if (profileError) throw new Error('Profile save failed: ' + profileError.message);

      await supabase.auth.setSession({
        access_token: ownerSession.access_token,
        refresh_token: ownerSession.refresh_token,
      });

      setLoading(false);
      showToast('העובד נוסף בהצלחה ✓');
      setTimeout(() => navigation.navigate('StaffList'), 800);

    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message);
    }
  }

  return (
    <ScreenWrapper>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t.addWorker}</Text>

        {errorMsg !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        <Text style={styles.label}>{t.fullName}</Text>
        <TextInput
          style={[styles.input, fieldErrors.name && styles.inputError]}
          placeholder={t.phName}
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={v => { setName(v); setFieldErrors(p => ({ ...p, name: undefined })); }}
          textAlign={rtl ? 'right' : 'left'}
        />
        {fieldErrors.name && <Text style={styles.fieldError}>{fieldErrors.name}</Text>}

        <Text style={styles.label}>{t.phone}</Text>
        <TextInput
          style={[styles.input, fieldErrors.phone && styles.inputError]}
          placeholder={t.phPhone}
          placeholderTextColor="#9CA3AF"
          value={phone}
          onChangeText={v => { setPhone(v); setFieldErrors(p => ({ ...p, phone: undefined })); }}
          keyboardType="phone-pad"
          textAlign="left"
        />
        {fieldErrors.phone && <Text style={styles.fieldError}>{fieldErrors.phone}</Text>}

        <Text style={styles.label}>{t.emailRequired}</Text>
        <TextInput
          style={[styles.input, fieldErrors.email && styles.inputError]}
          placeholder={t.phWorkerEmail}
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={v => { setEmail(v); setFieldErrors(p => ({ ...p, email: undefined })); }}
          autoCapitalize="none"
          keyboardType="email-address"
          textAlign="left"
        />
        {fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}

        <Text style={styles.label}>{t.passwordRequired}</Text>
        <TextInput
          style={[styles.input, fieldErrors.password && styles.inputError]}
          placeholder={t.phPassword}
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={v => { setPassword(v); setFieldErrors(p => ({ ...p, password: undefined })); }}
          secureTextEntry
          textAlign="left"
        />
        {fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAdd}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{t.addWorker}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.navigate('StaffList')}
        >
          <Text style={styles.cancelText}>{t.cancel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    <Toast message={toastMessage} opacity={toastOpacity} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  title: {
    fontSize: 26, fontWeight: '700', color: '#1a1a2e',
    marginBottom: 20, textAlign: 'right', alignSelf: 'stretch',
  },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 14, marginBottom: 16 },
  errorText: { color: '#c0392b', fontSize: 14, fontWeight: '600', textAlign: rtl ? 'right' : 'left' },
  label: {
    fontSize: 14, fontWeight: '600', color: '#374151',
    marginBottom: 6, textAlign: rtl ? 'right' : 'left',
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
    marginBottom: 4,
  },
  inputError: { borderColor: '#e74c3c' },
  fieldError: {
    color: '#e74c3c', fontSize: 12, fontWeight: '600',
    marginBottom: 14, textAlign: rtl ? 'right' : 'left',
  },
  button: {
    backgroundColor: '#5B6EF5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 16, padding: 12 },
  cancelText: { fontSize: 16, color: '#9CA3AF' },
});
