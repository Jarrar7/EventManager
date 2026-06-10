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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WorkerPaymentsScreen() {
  const { profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => { loadPayments(); }, [])
  );

  async function loadPayments() {
    if (!profile?.id) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('event_workers')
      .select('id, pay_amount, is_paid, paid_at, events(id, title, date, status)')
      .eq('worker_id', profile.id)
      .order('is_paid', { ascending: true })
      .order('event_id');

    if (!error) setRows(data || []);
    setLoading(false);
  }

  const totalEarned  = rows.reduce((s, r) => s + (r.pay_amount || 0), 0);
  const totalPaid    = rows.filter(r => r.is_paid).reduce((s, r) => s + (r.pay_amount || 0), 0);
  const totalPending = totalEarned - totalPaid;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#27ae60" /></View>;
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={rows}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <>
            <Text style={styles.pageTitle}>{t.myPaymentsTitle}</Text>

            {rows.length > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryAmount}>₪{totalEarned.toFixed(0)}</Text>
                  <Text style={styles.summaryLabel}>{t.workerTotalEarned}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryAmount, styles.amountPaid]}>₪{totalPaid.toFixed(0)}</Text>
                  <Text style={styles.summaryLabel}>{t.workerTotalPaid}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryAmount, styles.amountPending]}>₪{totalPending.toFixed(0)}</Text>
                  <Text style={styles.summaryLabel}>{t.workerTotalPending}</Text>
                </View>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💵</Text>
            <Text style={styles.emptyText}>{t.noWorkerPayments}</Text>
            <Text style={styles.emptySubtext}>{t.noWorkerPaymentsSubtext}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.is_paid && styles.cardPaid]}>
            <View style={[styles.stripe, item.is_paid ? styles.stripePaid : styles.stripeUnpaid]} />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={styles.eventTitle} numberOfLines={1}>{item.events?.title}</Text>
                <Text style={[styles.statusBadge, item.is_paid ? styles.badgePaid : styles.badgeUnpaid]}>
                  {item.is_paid ? '✅ שולם' : '🔴 ממתין'}
                </Text>
              </View>
              <Text style={styles.eventDate}>📅 {formatDate(item.events?.date)}</Text>
              {item.is_paid && item.paid_at && (
                <Text style={styles.paidAt}>שולם ב־{formatDate(item.paid_at)}</Text>
              )}
            </View>
            <Text style={[styles.payAmount, item.is_paid ? styles.amountPaid : styles.amountPending]}>
              ₪{(item.pay_amount || 0).toFixed(0)}
            </Text>
          </View>
        )}
      />
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

  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginHorizontal: 20, marginBottom: 20,
    flexDirection: 'row', padding: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  summaryAmount: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  summaryLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: '600', textAlign: 'center' },
  amountPaid: { color: '#10B981' },
  amountPending: { color: '#e74c3c' },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    marginHorizontal: 20, marginBottom: 12, borderRadius: 16, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardPaid: { opacity: 0.8 },
  stripe: { width: 5 },
  stripePaid:   { backgroundColor: '#10B981', alignSelf: 'stretch' },
  stripeUnpaid: { backgroundColor: '#e74c3c', alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  eventTitle: {
    fontSize: 15, fontWeight: '700', color: '#1a1a2e',
    flex: 1, marginEnd: 8, textAlign: rtl ? 'right' : 'left',
  },
  statusBadge: { fontSize: 12, fontWeight: '700', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgePaid:   { color: '#10B981', backgroundColor: '#ECFDF5' },
  badgeUnpaid: { color: '#e74c3c', backgroundColor: '#FEE2E2' },
  eventDate: { fontSize: 13, color: '#9CA3AF', textAlign: rtl ? 'right' : 'left' },
  paidAt: { fontSize: 12, color: '#10B981', marginTop: 4, textAlign: rtl ? 'right' : 'left' },
  payAmount: { fontSize: 20, fontWeight: '700', marginHorizontal: 16 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151', textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
});
