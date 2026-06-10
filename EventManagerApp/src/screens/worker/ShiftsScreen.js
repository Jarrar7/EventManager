import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, I18nManager,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ScreenWrapper from '../../components/ScreenWrapper';
import { t } from '../../i18n/he';

const rtl = I18nManager.isRTL;

function parseDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  return new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
}

function formatDate(dateStr) {
  const d = parseDate(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = parseDate(dateStr);
  if (isNaN(eventDate.getTime())) return 0;
  eventDate.setHours(0, 0, 0, 0);
  return Math.round((eventDate - today) / (1000 * 60 * 60 * 24));
}

function DaysChip({ dateStr }) {
  const days = daysUntil(dateStr);
  if (days < 0) return null;
  if (days === 0) return <Text style={styles.chipToday}>היום!</Text>;
  if (days === 1) return <Text style={styles.chipSoon}>מחר</Text>;
  if (days <= 7) return <Text style={styles.chipSoon}>בעוד {days} ימים</Text>;
  return <Text style={styles.chipFuture}>בעוד {days} ימים</Text>;
}

export default function ShiftsScreen() {
  const { profile } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  // profile?.id in deps so the callback re-creates (and re-fires) when auth loads
  useFocusEffect(
    useCallback(() => { loadShifts(); }, [profile?.id])
  );

  async function loadShifts() {
    if (!profile?.id) { setLoading(false); return; }
    setLoading(true);

    const { data, error } = await supabase
      .from('event_workers')
      .select('*, events(*)')
      .eq('worker_id', profile.id);

    if (error) { setLoading(false); return; }

    const sorted = (data || [])
      .filter(r => r.events?.status === 'upcoming')
      .sort((a, b) => parseDate(a.events.date) - parseDate(b.events.date));

    setShifts(sorted);
    setLoading(false);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#27ae60" /></View>;
  }

  return (
    <ScreenWrapper>
      <Text style={styles.pageTitle}>{t.myShiftsTitle}</Text>

      {shifts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>{t.noShifts}</Text>
          <Text style={styles.emptySubtext}>{t.noShiftsSubtext}</Text>
        </View>
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={item => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardAccent} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{item.events.title}</Text>
                  <DaysChip dateStr={item.events.date} />
                </View>
                <Text style={styles.eventDate}>📅 {formatDate(item.events.date)}</Text>
                {item.events.venue ? (
                  <Text style={styles.eventVenue}>📍 {item.events.venue}</Text>
                ) : null}
                <View style={styles.payRow}>
                  <Text style={styles.payLabel}>שכר: </Text>
                  <Text style={styles.payAmount}>₪{(item.pay_amount || 0).toFixed(0)}</Text>
                  <Text style={[styles.paidBadge, item.is_paid ? styles.paid : styles.unpaid]}>
                    {item.is_paid ? t.paid : t.unpaid}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: {
    fontSize: 26, fontWeight: '700', color: '#1a1a2e',
    paddingHorizontal: 20, marginTop: 16, marginBottom: 16,
    textAlign: rtl ? 'right' : 'left',
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151', textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },

  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardAccent: { width: 6, backgroundColor: '#27ae60' },
  cardBody: { flex: 1, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventTitle: {
    fontSize: 17, fontWeight: '700', color: '#1a1a2e',
    flex: 1, marginEnd: 8, textAlign: rtl ? 'right' : 'left',
  },
  eventDate: { fontSize: 14, color: '#6B7280', marginBottom: 4, textAlign: rtl ? 'right' : 'left' },
  eventVenue: { fontSize: 14, color: '#9CA3AF', marginBottom: 8, textAlign: rtl ? 'right' : 'left' },
  payRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  payLabel: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  payAmount: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginEnd: 10 },
  paidBadge: { fontSize: 13, fontWeight: '600' },
  paid: { color: '#10B981' },
  unpaid: { color: '#e74c3c' },

  chipToday: {
    fontSize: 12, fontWeight: '700', color: '#fff',
    backgroundColor: '#e74c3c', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  chipSoon: {
    fontSize: 12, fontWeight: '700', color: '#fff',
    backgroundColor: '#f39c12', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  chipFuture: {
    fontSize: 12, fontWeight: '600', color: '#5B6EF5',
    backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
});
