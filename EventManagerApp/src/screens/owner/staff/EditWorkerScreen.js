import React, { useState, useEffect } from 'react';
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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function EditWorkerScreen({ route, navigation }) {
  const { worker } = route.params;
  const [name, setName] = useState(worker.name);
  const [phone, setPhone] = useState(worker.phone || '');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { showToast, toastMessage, toastOpacity } = useToast();

  const [historyLoading, setHistoryLoading] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from('event_workers')
      .select('worker_id, pay_amount, is_paid, events(id, title, date)')
      .eq('worker_id', worker.id);

    if (error) {
      setFieldErrors({ name: error.message });
      setHistoryLoading(false);
      return;
    }

    if (data) {
      setTotalEvents(data.length);
      setTotalEarned(data.reduce((s, r) => s + (r.pay_amount || 0), 0));
      setTotalPaid(data.filter(r => r.is_paid).reduce((s, r) => s + (r.pay_amount || 0), 0));
      const sorted = [...data].sort((a, b) => {
        const da = a.events?.date ? new Date(a.events.date) : new Date(0);
        const db = b.events?.date ? new Date(b.events.date) : new Date(0);
        return db - da;
      });
      setRecentEvents(sorted.slice(0, 5));
    }
    setHistoryLoading(false);
  }

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

  const totalOwed = totalEarned - totalPaid;

  return (
    <ScreenWrapper>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t.editWorker}</Text>

        {/* Stats summary */}
        {historyLoading ? (
          <ActivityIndicator size="small" color="#5B6EF5" style={{ marginBottom: 20 }} />
        ) : (
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalEvents}</Text>
              <Text style={styles.summaryLabel}>אירועים</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.colorEarned]}>₪{totalEarned.toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>סה״כ</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.colorPaid]}>₪{totalPaid.toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>שולם</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.colorOwed]}>₪{totalOwed.toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>חייב</Text>
            </View>
          </View>
        )}

        {/* Recent events history */}
        {!historyLoading && recentEvents.length > 0 && (
          <>
            <Text style={styles.historyTitle}>היסטוריית אירועים</Text>
            {recentEvents.map((row, idx) => (
              <View key={idx} style={styles.historyRow}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyEventTitle} numberOfLines={1}>
                    {row.events?.title || '—'}
                  </Text>
                  <Text style={styles.historyDate}>{formatDate(row.events?.date)}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyPay}>₪{(row.pay_amount || 0).toFixed(0)}</Text>
                  <Text style={[styles.historyBadge, row.is_paid ? styles.badgePaid : styles.badgeUnpaid]}>
                    {row.is_paid ? 'שולם' : 'ממתין'}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Edit form */}
        <Text style={styles.sectionDivider}>{t.editWorker}</Text>

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
    marginBottom: 20, textAlign: 'right', alignSelf: 'stretch',
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  summaryLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  colorEarned: { color: '#1a1a2e' },
  colorPaid: { color: '#10B981' },
  colorOwed: { color: '#EF4444' },

  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: rtl ? 'right' : 'left',
    marginBottom: 10,
  },
  historyRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  historyInfo: { flex: 1, marginEnd: 12 },
  historyEventTitle: {
    fontSize: 14, fontWeight: '600', color: '#1a1a2e',
    textAlign: rtl ? 'right' : 'left',
  },
  historyDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2, textAlign: rtl ? 'right' : 'left' },
  historyRight: { alignItems: 'flex-end', gap: 4 },
  historyPay: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  historyBadge: {
    fontSize: 11, fontWeight: '700',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  badgePaid: { color: '#10B981', backgroundColor: '#ECFDF5' },
  badgeUnpaid: { color: '#e74c3c', backgroundColor: '#FEE2E2' },

  sectionDivider: {
    fontSize: 16, fontWeight: '700', color: '#374151',
    textAlign: rtl ? 'right' : 'left',
    marginTop: 8, marginBottom: 16,
    borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16,
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
