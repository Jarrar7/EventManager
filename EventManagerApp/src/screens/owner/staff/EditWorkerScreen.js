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

export default function EditWorkerScreen({ route, navigation }) {
  const { worker } = route.params;
  const [name, setName] = useState(worker.name);
  const [phone, setPhone] = useState(worker.phone || '');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { showToast, toastMessage, toastOpacity } = useToast();

  async function handleSave() {
    const errors = {};
    if (!name.trim()) errors.name = 'שדה חובה';
    if (phone.trim() && !isValidPhone(phone)) errors.phone = 'מספר טלפון לא תקין';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ name: name.trim(), phone: phone.trim() || null })
      .eq('id', worker.id);
    setLoading(false);

    if (error) {
      setFieldErrors({ name: error.message });
      return;
    }
    showToast('הפרטים עודכנו בהצלחה ✓');
    setTimeout(() => navigation.goBack(), 800);
  }

  return (
    <ScreenWrapper>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t.editWorker}</Text>

        <Text style={styles.label}>{t.fullName}</Text>
        <TextInput
          style={[styles.input, fieldErrors.name && styles.inputError]}
          value={name}
          onChangeText={v => { setName(v); setFieldErrors(p => ({ ...p, name: undefined })); }}
          placeholderTextColor="#9CA3AF"
          textAlign={rtl ? 'right' : 'left'}
        />
        {fieldErrors.name && <Text style={styles.fieldError}>{fieldErrors.name}</Text>}

        <Text style={styles.label}>{t.phone}</Text>
        <TextInput
          style={[styles.input, fieldErrors.phone && styles.inputError]}
          value={phone}
          onChangeText={v => { setPhone(v); setFieldErrors(p => ({ ...p, phone: undefined })); }}
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          textAlign="left"
        />
        {fieldErrors.phone && <Text style={styles.fieldError}>{fieldErrors.phone}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{t.saveChanges}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
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
    marginBottom: 28, textAlign: 'right', alignSelf: 'stretch',
  },
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
