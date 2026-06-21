import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert, ScrollView,
  I18nManager,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../context/ThemeContext';
import { cardShadow } from '../../../theme/shadows';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Toast, { useToast } from '../../../components/Toast';
import { t } from '../../../i18n/he';

const rtl = I18nManager.isRTL;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

async function fetchEventDetail(eventId) {
  const [eventRes, assignRes, workersRes] = await Promise.all([
    supabase.from('events').select('*').eq('id', eventId).single(),
    supabase.from('event_workers').select('*, users(id, name, phone)').eq('event_id', eventId),
    supabase.from('users').select('id, name, phone').eq('role', 'worker').order('name'),
  ]);
  if (eventRes.error) throw eventRes.error;
  return {
    event:       eventRes.data,
    assignments: assignRes.data || [],
    allWorkers:  workersRes.data || [],
  };
}

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { c, theme } = useTheme();
  const shadow = theme === 'light' ? cardShadow : {};
  const queryClient = useQueryClient();
  const { showToast, toastMessage, toastOpacity } = useToast();

  const [showAddWorker, setShowAddWorker] = useState(false);
  const [payInputs, setPayInputs]         = useState({});
  const [payKeys, setPayKeys]             = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['event-detail', eventId],
    queryFn: () => fetchEventDetail(eventId),
  });

  const event       = data?.event       ?? null;
  const assignments = data?.assignments ?? [];
  const allWorkers  = data?.allWorkers  ?? [];

  const assignedIds       = assignments.map(a => a.worker_id);
  const unassignedWorkers = allWorkers.filter(w => !assignedIds.includes(w.id));

  function invalidateDetail() {
    queryClient.invalidateQueries({ queryKey: ['event-detail', eventId] });
  }
  function invalidateListsAndDash() {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }
  function invalidatePayments() {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['worker-payments'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }

  async function assignWorker(worker) {
    const pay = parseFloat(payInputs[worker.id] || '0') || 0;
    const { error } = await supabase.from('event_workers').insert({
      event_id: eventId, worker_id: worker.id, pay_amount: pay, is_paid: false,
    });
    if (error) { Alert.alert(t.error, error.message); return; }
    setPayInputs(prev => { const n = { ...prev }; delete n[worker.id]; return n; });
    invalidateDetail();
    queryClient.invalidateQueries({ queryKey: ['payments'] });
  }

  async function removeAssignment(assignmentId, workerName) {
    Alert.alert(t.removeFromEvent, t.removeFromEventConfirm(workerName), [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.remove, style: 'destructive',
        onPress: async () => {
          await supabase.from('event_workers').delete().eq('id', assignmentId);
          invalidateDetail();
          queryClient.invalidateQueries({ queryKey: ['payments'] });
        },
      },
    ]);
  }

  async function toggleStatus() {
    const newStatus = event.status === 'upcoming' ? 'done' : 'upcoming';
    const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', eventId);
    if (!error) { invalidateDetail(); invalidateListsAndDash(); }
  }

  async function markAsPaid(assignment) {
    Alert.alert('סימון תשלום', `לסמן את ${assignment.users?.name} כשלום עבור ${event?.title}?`, [
      { text: t.cancel, style: 'cancel' },
      {
        text: 'אישור',
        onPress: async () => {
          const now = new Date().toISOString();
          const { error } = await supabase
            .from('event_workers')
            .update({ is_paid: true, paid_at: now })
            .eq('id', assignment.id);
          if (error) { Alert.alert(t.error, error.message); return; }
          invalidateDetail(); invalidatePayments();
          showToast('סומן כשלום ✓');
        },
      },
    ]);
  }

  async function updatePay(assignmentId, newPay) {
    const pay = parseFloat(newPay);
    if (!pay || pay <= 0) {
      setPayKeys(prev => ({ ...prev, [assignmentId]: (prev[assignmentId] || 0) + 1 }));
      return;
    }
    await supabase.from('event_workers').update({ pay_amount: pay }).eq('id', assignmentId);
    invalidateDetail();
    queryClient.invalidateQueries({ queryKey: ['payments'] });
  }

  async function markAllPaid() {
    const unpaid = assignments.filter(a => !a.is_paid);
    Alert.alert('סימון תשלום קבוצתי', `לסמן את כל העובדים באירוע זה כשלום? (${unpaid.length} עובדים)`, [
      { text: t.cancel, style: 'cancel' },
      {
        text: 'אישור',
        onPress: async () => {
          const now = new Date().toISOString();
          const { error } = await supabase
            .from('event_workers')
            .update({ is_paid: true, paid_at: now })
            .eq('event_id', eventId)
            .eq('is_paid', false);
          if (error) { Alert.alert(t.error, error.message); return; }
          invalidateDetail(); invalidatePayments();
          showToast('כל העובדים סומנו כשלום ✓');
        },
      },
    ]);
  }

  async function duplicateEvent() {
    Alert.alert('שכפול אירוע', `לשכפל את האירוע "${event?.title}"?`, [
      { text: t.cancel, style: 'cancel' },
      {
        text: 'שכפל',
        onPress: async () => {
          const { data: newEvent, error } = await supabase
            .from('events')
            .insert({
              title: event.title, date: new Date().toISOString(),
              time: event.time || null, venue: event.venue || null,
              notes: event.notes || null, status: 'upcoming',
              created_by: event.created_by,
            })
            .select().single();
          if (error) { Alert.alert(t.error, error.message); return; }
          invalidateListsAndDash();
          showToast('האירוע שוכפל בהצלחה ✓');
          setTimeout(() => navigation.replace('EventDetail', { eventId: newEvent.id }), 800);
        },
      },
    ]);
  }

  async function deleteEvent() {
    Alert.alert(t.deleteEvent, t.deleteEventConfirm(event?.title), [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.remove, style: 'destructive',
        onPress: async () => {
          await supabase.from('events').delete().eq('id', eventId);
          invalidateListsAndDash();
          navigation.navigate('EventsList');
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background }}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  const isDone = event?.status === 'done';

  // Payment summary across all workers
  const totalPay  = assignments.reduce((s, a) => s + (a.pay_amount || 0), 0);
  const paidPay   = assignments.filter(a => a.is_paid).reduce((s, a) => s + (a.pay_amount || 0), 0);
  const remaining = totalPay - paidPay;

  const unpaidCount = assignments.filter(a => !a.is_paid).length;

  return (
    <ScreenWrapper>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingBottom: 48 }]}
      >
        {/* Back link */}
        <TouchableOpacity onPress={() => navigation.navigate('EventsList')} style={styles.backLink}>
          <Text style={[styles.backLinkText, { color: c.primary }]}>
            {rtl ? `${t.back} →` : `← ${t.back}`}
          </Text>
        </TouchableOpacity>

        {/* Detail card */}
        <View style={[styles.detailCard, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
          {/* Top row: emoji disc + action buttons */}
          <View style={styles.detailCardTop}>
            <View style={[styles.emojiDisc, { backgroundColor: c.emojiBg }]}>
              <Text style={{ fontSize: 28 }}>🎪</Text>
            </View>
            <View style={styles.detailCardActions}>
              <TouchableOpacity
                onPress={duplicateEvent}
                style={[styles.actionBtn, { backgroundColor: c.greenSoft }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionBtnText, { color: c.green }]}>⎘ שכפל</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('EditEvent', { event })}
                style={[styles.actionBtn, { backgroundColor: c.primarySoft }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionBtnText, { color: c.accentGlyph }]}>✏️ {t.editEvent}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.detailTitle, { color: c.text }]}>{event?.title}</Text>

          <View style={styles.metaRow}>
            <Text style={[styles.metaIcon, { color: c.primary }]}>📅</Text>
            <Text style={[styles.metaText, { color: c.text }]}>
              {formatDate(event?.date)}{event?.time ? `  🕐 ${event.time}` : ''}
            </Text>
          </View>
          {event?.venue ? (
            <View style={styles.metaRow}>
              <Text style={[styles.metaIcon, { color: c.primary }]}>📍</Text>
              <Text style={[styles.metaText, { color: c.text }]}>{event.venue}</Text>
            </View>
          ) : null}
          {event?.notes ? (
            <Text style={[styles.notesText, { color: c.textMuted }]}>{event.notes}</Text>
          ) : null}
        </View>

        {/* Status toggle */}
        <TouchableOpacity
          style={[
            styles.statusBtn,
            isDone
              ? { backgroundColor: c.green }
              : { backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border },
          ]}
          onPress={toggleStatus}
          activeOpacity={0.8}
        >
          <Text style={[styles.statusBtnText, { color: isDone ? '#fff' : c.textMuted }]}>
            {isDone ? t.statusDone : t.statusUpcoming}
          </Text>
        </TouchableOpacity>

        {/* 3-up payment summary */}
        {assignments.length > 0 && (
          <View style={[styles.paymentSummary, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
            <View style={styles.paymentSummaryCell}>
              <Text style={[styles.paymentSummaryValue, { color: c.text }]}>₪{totalPay.toFixed(0)}</Text>
              <Text style={[styles.paymentSummaryLabel, { color: c.textMuted }]}>סה״כ</Text>
            </View>
            <View style={[styles.paymentSummaryDivider, { backgroundColor: c.border }]} />
            <View style={styles.paymentSummaryCell}>
              <Text style={[styles.paymentSummaryValue, { color: c.green }]}>₪{paidPay.toFixed(0)}</Text>
              <Text style={[styles.paymentSummaryLabel, { color: c.textMuted }]}>שולם</Text>
            </View>
            <View style={[styles.paymentSummaryDivider, { backgroundColor: c.border }]} />
            <View style={styles.paymentSummaryCell}>
              <Text style={[styles.paymentSummaryValue, { color: c.red }]}>₪{remaining.toFixed(0)}</Text>
              <Text style={[styles.paymentSummaryLabel, { color: c.textMuted }]}>נותר</Text>
            </View>
          </View>
        )}

        {/* Workers section header */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>{t.workersCount(assignments.length)}</Text>

        {assignments.length === 0 ? (
          <Text style={[styles.emptyNote, { color: c.textMuted }]}>{t.noWorkersAssigned}</Text>
        ) : (
          assignments.map(a => (
            <View key={a.id} style={[styles.workerCard, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
              <View style={[styles.workerAvatar, { backgroundColor: c.primarySoft }]}>
                <Text style={[styles.workerAvatarText, { color: c.accentGlyph }]}>
                  {a.users?.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.workerName, { color: c.text }]}>{a.users?.name}</Text>
                <Text style={[styles.workerStatus, { color: a.is_paid ? c.green : c.red }]}>
                  {a.is_paid ? '✓ שולם' : '● ממתין'}
                </Text>
              </View>
              <View style={styles.workerTrailing}>
                <View style={styles.payRow}>
                  <Text style={[styles.payLabel, { color: c.text }]}>₪</Text>
                  <TextInput
                    key={`${a.id}-${payKeys[a.id] || 0}`}
                    style={[styles.payInput, { backgroundColor: c.background, color: c.text }]}
                    defaultValue={String(a.pay_amount)}
                    keyboardType="numeric"
                    onEndEditing={e => updatePay(a.id, e.nativeEvent.text)}
                    selectTextOnFocus
                    textAlign="center"
                  />
                </View>
                {a.is_paid ? (
                  <View style={[styles.paidPill, { backgroundColor: c.greenSoft }]}>
                    <Text style={[styles.paidPillText, { color: c.green }]}>שולם ✓</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.markPaidBtn, { backgroundColor: c.green }]}
                    onPress={() => markAsPaid(a)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.markPaidBtnText}>סמן כשלום ✓</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.removeBtn, { backgroundColor: c.redSoft }]}
                  onPress={() => removeAssignment(a.id, a.users?.name)}
                >
                  <Text style={[styles.removeBtnText, { color: c.red }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Bulk pay */}
        {unpaidCount >= 2 && (
          <TouchableOpacity
            style={[styles.bulkPayBtn, { backgroundColor: c.green }]}
            onPress={markAllPaid}
            activeOpacity={0.8}
          >
            <Text style={styles.bulkPayBtnText}>סמן את כולם כשולם ✓</Text>
          </TouchableOpacity>
        )}

        {/* Assign worker */}
        {unassignedWorkers.length > 0 && (
          <>
            <TouchableOpacity
              style={[styles.ghostBtn, { borderColor: c.primary }]}
              onPress={() => setShowAddWorker(prev => !prev)}
              activeOpacity={0.8}
            >
              <Text style={[styles.ghostBtnText, { color: c.primary }]}>
                {showAddWorker ? t.hideWorkerList : t.assignWorker}
              </Text>
            </TouchableOpacity>

            {showAddWorker && unassignedWorkers.map(w => (
              <View key={w.id} style={[styles.unassignedCard, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
                <Text style={[styles.unassignedName, { color: c.text }]}>{w.name}</Text>
                <View style={styles.assignRow}>
                  <View style={styles.payRow}>
                    <Text style={[styles.payLabel, { color: c.text }]}>₪</Text>
                    <TextInput
                      style={[styles.payInput, { backgroundColor: c.background, color: c.text }]}
                      placeholder="0"
                      placeholderTextColor={c.textMuted}
                      keyboardType="numeric"
                      value={payInputs[w.id] || ''}
                      onChangeText={val => setPayInputs(prev => ({ ...prev, [w.id]: val }))}
                      textAlign="center"
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.assignBtn, { backgroundColor: c.green }]}
                    onPress={() => assignWorker(w)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.assignBtnText}>{t.assign}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Delete */}
        <TouchableOpacity
          style={[styles.deleteBtn, { borderColor: c.red }]}
          onPress={deleteEvent}
          activeOpacity={0.8}
        >
          <Text style={[styles.deleteBtnText, { color: c.red }]}>{t.deleteEvent}</Text>
        </TouchableOpacity>
      </ScrollView>
      <Toast message={toastMessage} opacity={toastOpacity} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 22, paddingTop: 8 },

  backLink: { marginBottom: 14 },
  backLinkText: { fontSize: 15, fontWeight: '600' },

  detailCard: {
    borderRadius: 16, borderWidth: 1,
    padding: 18, marginBottom: 14,
  },
  detailCardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 14,
  },
  emojiDisc: {
    width: 56, height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  detailCardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  detailTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: rtl ? 'right' : 'left' },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 6 },
  metaIcon: { fontSize: 14, marginTop: 1 },
  metaText: { fontSize: 14, fontWeight: '600', flex: 1, textAlign: rtl ? 'right' : 'left' },
  notesText: { fontSize: 14, fontStyle: 'italic', marginTop: 6, textAlign: rtl ? 'right' : 'left' },

  statusBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 16,
  },
  statusBtnText: { fontSize: 15, fontWeight: '700' },

  paymentSummary: {
    borderRadius: 16, borderWidth: 1,
    flexDirection: 'row', marginBottom: 20, overflow: 'hidden',
  },
  paymentSummaryCell: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  paymentSummaryDivider: { width: 1, marginVertical: 10 },
  paymentSummaryValue: { fontSize: 18, fontWeight: '800' },
  paymentSummaryLabel: { fontSize: 12, fontWeight: '600', marginTop: 3 },

  sectionTitle: {
    fontSize: 18, fontWeight: '800', marginBottom: 12,
    textAlign: rtl ? 'right' : 'left',
  },
  emptyNote: { fontSize: 14, marginBottom: 16, textAlign: rtl ? 'right' : 'left' },

  workerCard: {
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  workerAvatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  workerAvatarText: { fontSize: 17, fontWeight: '800' },
  workerName: { fontSize: 15, fontWeight: '700' },
  workerStatus: { fontSize: 12.5, fontWeight: '700', marginTop: 2 },
  workerTrailing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payRow: { flexDirection: 'row', alignItems: 'center' },
  payLabel: { fontSize: 16, marginEnd: 2 },
  payInput: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
    fontSize: 16, width: 66, textAlign: 'center',
  },
  paidPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  paidPillText: { fontWeight: '700', fontSize: 13 },
  markPaidBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  markPaidBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  removeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { fontSize: 14, fontWeight: '700' },

  bulkPayBtn: {
    borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 12,
  },
  bulkPayBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  ghostBtn: {
    borderRadius: 14, borderWidth: 1.5, padding: 14,
    alignItems: 'center', marginVertical: 12,
  },
  ghostBtnText: { fontWeight: '700', fontSize: 15 },

  unassignedCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12,
  },
  unassignedName: {
    fontSize: 16, fontWeight: '600', marginBottom: 10,
    textAlign: rtl ? 'right' : 'left',
  },
  assignRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  assignBtn: { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  assignBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  deleteBtn: {
    borderWidth: 1.5, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 24,
  },
  deleteBtnText: { fontWeight: '700', fontSize: 15 },
});
