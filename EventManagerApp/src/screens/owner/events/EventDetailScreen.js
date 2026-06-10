import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert, ScrollView,
  I18nManager,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
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

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [allWorkers, setAllWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [payInputs, setPayInputs] = useState({});
  // payKeys forces TextInput remount to revert invalid entries
  const [payKeys, setPayKeys] = useState({});
  const { showToast, toastMessage, toastOpacity } = useToast();

  useFocusEffect(
    useCallback(() => { loadAll(); }, [])
  );

  async function loadAll() {
    setLoading(true);
    const [eventRes, assignRes, workersRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single(),
      supabase.from('event_workers').select('*, users(id, name, phone)').eq('event_id', eventId),
      supabase.from('users').select('id, name, phone').eq('role', 'worker').order('name'),
    ]);
    if (eventRes.data) setEvent(eventRes.data);
    if (assignRes.data) setAssignments(assignRes.data);
    if (workersRes.data) setAllWorkers(workersRes.data);
    setLoading(false);
  }

  const assignedIds = assignments.map(a => a.worker_id);
  const unassignedWorkers = allWorkers.filter(w => !assignedIds.includes(w.id));

  async function assignWorker(worker) {
    const pay = parseFloat(payInputs[worker.id] || '0') || 0;
    const { error } = await supabase.from('event_workers').insert({
      event_id: eventId,
      worker_id: worker.id,
      pay_amount: pay,
      is_paid: false,
    });
    if (error) { Alert.alert(t.error, error.message); return; }
    setPayInputs(prev => { const n = { ...prev }; delete n[worker.id]; return n; });
    loadAll();
  }

  async function removeAssignment(assignmentId, workerName) {
    Alert.alert(
      t.removeFromEvent,
      t.removeFromEventConfirm(workerName),
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.remove, style: 'destructive',
          onPress: async () => {
            await supabase.from('event_workers').delete().eq('id', assignmentId);
            loadAll();
          },
        },
      ]
    );
  }

  async function toggleStatus() {
    const newStatus = event.status === 'upcoming' ? 'done' : 'upcoming';
    const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', eventId);
    if (!error) setEvent(prev => ({ ...prev, status: newStatus }));
  }

  async function markAsPaid(assignment) {
    Alert.alert(
      'סימון תשלום',
      `לסמן את ${assignment.users?.name} כשלום עבור ${event?.title}?`,
      [
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
            setAssignments(prev =>
              prev.map(a => a.id === assignment.id ? { ...a, is_paid: true, paid_at: now } : a)
            );
            showToast('סומן כשלום ✓');
          },
        },
      ]
    );
  }

  async function updatePay(assignmentId, newPay) {
    const pay = parseFloat(newPay);
    if (!pay || pay <= 0) {
      // Revert the TextInput by bumping its key — forces remount with original defaultValue
      setPayKeys(prev => ({ ...prev, [assignmentId]: (prev[assignmentId] || 0) + 1 }));
      return;
    }
    await supabase.from('event_workers').update({ pay_amount: pay }).eq('id', assignmentId);
    loadAll();
  }

  async function duplicateEvent() {
    Alert.alert(
      'שכפול אירוע',
      `לשכפל את האירוע "${event?.title}"?`,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: 'שכפל',
          onPress: async () => {
            const { data, error } = await supabase
              .from('events')
              .insert({
                title: event.title,
                date: new Date().toISOString(),
                time: event.time || null,
                venue: event.venue || null,
                notes: event.notes || null,
                status: 'upcoming',
                created_by: event.created_by,
              })
              .select()
              .single();
            if (error) { Alert.alert(t.error, error.message); return; }
            showToast('האירוע שוכפל בהצלחה ✓');
            setTimeout(() => navigation.replace('EventDetail', { eventId: data.id }), 800);
          },
        },
      ]
    );
  }

  async function deleteEvent() {
    Alert.alert(
      t.deleteEvent,
      t.deleteEventConfirm(event?.title),
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.remove, style: 'destructive',
          onPress: async () => {
            await supabase.from('events').delete().eq('id', eventId);
            navigation.navigate('EventsList');
          },
        },
      ]
    );
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#5B6EF5" /></View>;
  }

  const isDone = event?.status === 'done';

  return (
    <ScreenWrapper>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

      {/* Top row: back button + action buttons */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.navigate('EventsList')} style={styles.backBtn}>
          <Text style={styles.backText}>{rtl ? `${t.back} →` : `← ${t.back}`}</Text>
        </TouchableOpacity>
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={duplicateEvent}
            style={styles.duplicateBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.duplicateBtnText}>⎘ שכפל</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditEvent', { event })}
            style={styles.editBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.editBtnText}>✏️ {t.editEvent}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.eventTitle}>{event?.title}</Text>

      <Text style={styles.eventDate}>
        📅 {formatDate(event?.date)}{event?.time ? `  🕐 ${event.time}` : ''}
      </Text>

      {event?.venue ? <Text style={styles.eventVenue}>📍 {event.venue}</Text> : null}
      {event?.notes ? <Text style={styles.eventNotes}>{event.notes}</Text> : null}

      {/* Status toggle */}
      <TouchableOpacity
        style={[styles.statusBtn, isDone ? styles.statusDone : styles.statusUpcoming]}
        onPress={toggleStatus}
        activeOpacity={0.8}
      >
        <Text style={[styles.statusBtnText, isDone ? styles.statusBtnTextDone : styles.statusBtnTextUpcoming]}>
          {isDone ? t.statusDone : t.statusUpcoming}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>{t.workersCount(assignments.length)}</Text>

      {assignments.length === 0 ? (
        <Text style={styles.emptyNote}>{t.noWorkersAssigned}</Text>
      ) : (
        assignments.map(a => (
          <View key={a.id} style={styles.workerCard}>
            <View style={styles.workerInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{a.users?.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.workerName}>{a.users?.name}</Text>
                <Text style={[styles.paidBadge, a.is_paid ? styles.paid : styles.unpaid]}>
                  {a.is_paid ? t.paid : t.unpaid}
                </Text>
              </View>
            </View>
            <View style={styles.workerActions}>
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>₪</Text>
                <TextInput
                  key={`${a.id}-${payKeys[a.id] || 0}`}
                  style={styles.payInput}
                  defaultValue={String(a.pay_amount)}
                  keyboardType="numeric"
                  onEndEditing={e => updatePay(a.id, e.nativeEvent.text)}
                  selectTextOnFocus
                  textAlign="center"
                />
              </View>
              {a.is_paid ? (
                <View style={styles.paidLabel}>
                  <Text style={styles.paidLabelText}>שולם ✓</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.markPaidBtn}
                  onPress={() => markAsPaid(a)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.markPaidBtnText}>סמן כשלום ✓</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeAssignment(a.id, a.users?.name)}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {unassignedWorkers.length > 0 && (
        <>
          <TouchableOpacity
            style={styles.addWorkerToggle}
            onPress={() => setShowAddWorker(prev => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.addWorkerToggleText}>
              {showAddWorker ? t.hideWorkerList : t.assignWorker}
            </Text>
          </TouchableOpacity>

          {showAddWorker && unassignedWorkers.map(w => (
            <View key={w.id} style={styles.unassignedCard}>
              <Text style={styles.unassignedName}>{w.name}</Text>
              <View style={styles.assignRow}>
                <View style={styles.payRow}>
                  <Text style={styles.payLabel}>₪</Text>
                  <TextInput
                    style={styles.payInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={payInputs[w.id] || ''}
                    onChangeText={val => setPayInputs(prev => ({ ...prev, [w.id]: val }))}
                    textAlign="center"
                  />
                </View>
                <TouchableOpacity
                  style={styles.assignBtn}
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

      <TouchableOpacity style={styles.deleteBtn} onPress={deleteEvent} activeOpacity={0.8}>
        <Text style={styles.deleteBtnText}>{t.deleteEvent}</Text>
      </TouchableOpacity>

    </ScrollView>
    <Toast message={toastMessage} opacity={toastOpacity} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {},
  backText: { fontSize: 16, color: '#5B6EF5', fontWeight: '600' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  duplicateBtn: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  duplicateBtnText: { fontSize: 14, color: '#10B981', fontWeight: '700' },
  editBtn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editBtnText: { fontSize: 14, color: '#5B6EF5', fontWeight: '700' },

  eventTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: rtl ? 'right' : 'left',
  },
  eventDate: { fontSize: 15, color: '#6B7280', marginBottom: 4, textAlign: rtl ? 'right' : 'left' },
  eventVenue: { fontSize: 15, color: '#6B7280', marginBottom: 4, textAlign: rtl ? 'right' : 'left' },
  eventNotes: {
    fontSize: 14, color: '#9CA3AF', marginTop: 4, marginBottom: 8,
    fontStyle: 'italic', textAlign: rtl ? 'right' : 'left',
  },

  statusBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 16,
  },
  statusUpcoming: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  statusDone: {
    backgroundColor: '#10B981',
  },
  statusBtnText: { fontSize: 15, fontWeight: '700' },
  statusBtnTextUpcoming: { color: '#6B7280' },
  statusBtnTextDone: { color: '#fff' },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
    textAlign: rtl ? 'right' : 'left',
  },
  emptyNote: { fontSize: 14, color: '#9CA3AF', marginBottom: 16, textAlign: rtl ? 'right' : 'left' },

  workerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  workerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#5B6EF5',
    justifyContent: 'center', alignItems: 'center', marginEnd: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  workerName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  paidBadge: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  paid: { color: '#10B981' },
  unpaid: { color: '#e74c3c' },
  workerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payRow: { flexDirection: 'row', alignItems: 'center' },
  payLabel: { fontSize: 16, color: '#374151', marginEnd: 4 },
  payInput: {
    backgroundColor: '#F4F6F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 16,
    width: 70,
    textAlign: 'center',
    color: '#1a1a2e',
  },
  markPaidBtn: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markPaidBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  paidLabel: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  paidLabelText: { color: '#9CA3AF', fontWeight: '700', fontSize: 13 },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: { fontSize: 14, color: '#e74c3c', fontWeight: '700' },

  addWorkerToggle: {
    backgroundColor: '#5B6EF5',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginVertical: 12,
  },
  addWorkerToggleText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  unassignedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  unassignedName: {
    fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 10,
    textAlign: rtl ? 'right' : 'left',
  },
  assignRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  assignBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  assignBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  deleteBtn: {
    borderWidth: 1.5,
    borderColor: '#e74c3c',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  deleteBtnText: { color: '#e74c3c', fontWeight: '700', fontSize: 15 },
});
