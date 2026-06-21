import React, { useState, useEffect } from 'react';
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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatJoinDate(createdAt) {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function EditWorkerScreen({ route, navigation }) {
  const { worker } = route.params;
  const { c, theme } = useTheme();
  const shadow = theme === 'light' ? cardShadow : {};
  const queryClient = useQueryClient();

  const [name, setName]           = useState(worker.name);
  const [phone, setPhone]         = useState(worker.phone || '');
  const [loading, setLoading]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { showToast, toastMessage, toastOpacity } = useToast();

  const [historyLoading, setHistoryLoading] = useState(true);
  const [totalEvents, setTotalEvents]       = useState(0);
  const [totalEarned, setTotalEarned]       = useState(0);
  const [totalPaid, setTotalPaid]           = useState(0);
  const [recentEvents, setRecentEvents]     = useState([]);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    const { data } = await supabase
      .from('event_workers')
      .select('worker_id, pay_amount, is_paid, events(id, title, date)')
      .eq('worker_id', worker.id);

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

    if (error) { setFieldErrors({ name: error.message }); return; }
    queryClient.invalidateQueries({ queryKey: ['staff'] });
    showToast('הפרטים עודכנו בהצלחה ✓');
    setTimeout(() => navigation.goBack(), 800);
  }

  const inputStyle = [styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.text }, shadow];

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.container, { paddingBottom: 48 }]}>

          {/* Back link */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={[styles.backLinkText, { color: c.primary }]}>
              {rtl ? `${t.back} →` : `← ${t.back}`}
            </Text>
          </TouchableOpacity>

          {/* Worker header */}
          <View style={styles.workerHeader}>
            <View style={[styles.headerAvatar, { backgroundColor: c.primarySoft }]}>
              <Text style={[styles.headerAvatarText, { color: c.accentGlyph }]}>
                {worker.name?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerName, { color: c.text }]}>{worker.name}</Text>
              {worker.created_at ? (
                <Text style={[styles.headerSub, { color: c.textMuted }]}>
                  עובד מאז {formatJoinDate(worker.created_at)}
                </Text>
              ) : null}
            </View>
          </View>

          {/* 3-tile stat row */}
          {historyLoading ? (
            <ActivityIndicator size="small" color={c.primary} style={{ marginBottom: 20 }} />
          ) : (
            <View style={styles.statRow}>
              <StatTile value={totalEvents} label="אירועים" discBg={c.statIndigoBg} discFg={c.statIndigoFg} icon="📅" c={c} shadow={shadow} />
              <StatTile value={`₪${totalEarned.toFixed(0)}`} label="סה״כ שכר" discBg={c.statPeachBg} discFg={c.statPeachFg} icon="💰" c={c} shadow={shadow} />
              <StatTile value={`₪${totalPaid.toFixed(0)}`} label="שולם" discBg={c.statGreenBg} discFg={c.statGreenFg} icon="✓" c={c} shadow={shadow} />
            </View>
          )}

          {/* Edit form */}
          <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{t.fullName}</Text>
          <TextInput
            style={[inputStyle, fieldErrors.name && { borderColor: c.red }]}
            value={name}
            onChangeText={v => { setName(v); setFieldErrors(p => ({ ...p, name: undefined })); }}
            placeholderTextColor={c.textMuted}
            textAlign={rtl ? 'right' : 'left'}
          />
          {fieldErrors.name && (
            <Text style={[styles.fieldError, { color: c.red }]}>{fieldErrors.name}</Text>
          )}

          <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{t.phone}</Text>
          <TextInput
            style={[inputStyle, { marginBottom: 0 }, fieldErrors.phone && { borderColor: c.red }]}
            value={phone}
            onChangeText={v => { setPhone(v); setFieldErrors(p => ({ ...p, phone: undefined })); }}
            placeholderTextColor={c.textMuted}
            keyboardType="phone-pad"
            textAlign="right"
            writingDirection="ltr"
          />
          {fieldErrors.phone && (
            <Text style={[styles.fieldError, { color: c.red }]}>{fieldErrors.phone}</Text>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: c.primary, opacity: loading ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={c.onPrimary} />
              : <Text style={[styles.primaryBtnText, { color: c.onPrimary }]}>{t.saveChanges}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={[styles.cancelText, { color: c.textMuted }]}>{t.cancel}</Text>
          </TouchableOpacity>

          {/* History section */}
          {!historyLoading && recentEvents.length > 0 && (
            <>
              <Text style={[styles.historyTitle, { color: c.text }]}>היסטוריית אירועים</Text>
              {recentEvents.map((row, idx) => (
                <View key={idx} style={[styles.historyRow, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyEventTitle, { color: c.text }]} numberOfLines={1}>
                      {row.events?.title || '—'}
                    </Text>
                    <Text style={[styles.historyDate, { color: c.textMuted }]}>
                      {formatDate(row.events?.date)}
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyPay, { color: c.text }]}>
                      ₪{(row.pay_amount || 0).toFixed(0)}
                    </Text>
                    <View style={[styles.historyBadge, { backgroundColor: row.is_paid ? c.greenSoft : c.redSoft }]}>
                      <Text style={[styles.historyBadgeText, { color: row.is_paid ? c.green : c.red }]}>
                        {row.is_paid ? 'שולם' : 'ממתין'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast message={toastMessage} opacity={toastOpacity} />
    </ScreenWrapper>
  );
}

function StatTile({ value, label, discBg, discFg, icon, c, shadow }) {
  return (
    <View style={[styles.statTile, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
      <View style={[styles.statDisc, { backgroundColor: discBg }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 22, paddingTop: 8 },

  backLink: { marginBottom: 16 },
  backLinkText: { fontSize: 15, fontWeight: '600' },

  workerHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20,
  },
  headerAvatar: {
    width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { fontSize: 24, fontWeight: '800' },
  headerName: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 13, fontWeight: '500', marginTop: 2 },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statTile: {
    flex: 1, borderRadius: 16, borderWidth: 1,
    padding: 14, alignItems: 'center',
  },
  statDisc: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10.5, fontWeight: '600', marginTop: 2, textAlign: 'center' },

  fieldLabel: {
    fontSize: 13, fontWeight: '700', marginBottom: 6,
    textAlign: rtl ? 'right' : 'left',
  },
  input: {
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 15, fontWeight: '700',
    marginBottom: 13,
  },
  fieldError: {
    fontSize: 12, fontWeight: '600',
    marginTop: -8, marginBottom: 10,
    textAlign: rtl ? 'right' : 'left',
  },

  primaryBtn: {
    borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 4,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', marginTop: 12, padding: 10 },
  cancelText: { fontSize: 15, fontWeight: '600' },

  historyTitle: {
    fontSize: 18, fontWeight: '800', marginTop: 28, marginBottom: 12,
    textAlign: rtl ? 'right' : 'left',
  },
  historyRow: {
    borderRadius: 14, borderWidth: 1, marginBottom: 10,
    paddingVertical: 13, paddingHorizontal: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  historyInfo: { flex: 1, marginEnd: 12 },
  historyEventTitle: { fontSize: 14, fontWeight: '700', textAlign: rtl ? 'right' : 'left' },
  historyDate: { fontSize: 12, marginTop: 2, textAlign: rtl ? 'right' : 'left' },
  historyRight: { alignItems: 'flex-end', gap: 6 },
  historyPay: { fontSize: 15, fontWeight: '800' },
  historyBadge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  historyBadgeText: { fontSize: 11, fontWeight: '700' },
});
