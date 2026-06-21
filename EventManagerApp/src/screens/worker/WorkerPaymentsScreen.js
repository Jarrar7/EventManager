import React from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, I18nManager,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cardShadow } from '../../theme/shadows';
import ScreenWrapper from '../../components/ScreenWrapper';
import OfflineBanner from '../../components/OfflineBanner';
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
  const { c, theme } = useTheme();
  const shadow = theme === 'light' ? cardShadow : {};

  const { data: rows = [], isLoading, isFetching } = useQuery({
    queryKey: ['worker-payments', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_workers')
        .select('id, pay_amount, is_paid, paid_at, events(id, title, date, status)')
        .eq('worker_id', profile.id)
        .order('is_paid', { ascending: true })
        .order('event_id');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const totalEarned  = rows.reduce((s, r) => s + (r.pay_amount || 0), 0);
  const totalPaid    = rows.filter(r => r.is_paid).reduce((s, r) => s + (r.pay_amount || 0), 0);
  const totalPending = totalEarned - totalPaid;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background }}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <OfflineBanner />
      <FlatList
        data={rows}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <>
            {/* Title */}
            <View style={styles.titleRow}>
              <Text style={[styles.pageTitle, { color: c.text }]}>{t.myPaymentsTitle}</Text>
              {isFetching && <ActivityIndicator size="small" color={c.textMuted} style={{ marginStart: 8 }} />}
            </View>

            {/* 3-cell summary card */}
            {rows.length > 0 && (
              <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
                <View style={styles.summaryCell}>
                  <Text style={[styles.summaryAmount, { color: c.text }]}>₪{totalEarned.toFixed(0)}</Text>
                  <Text style={[styles.summaryLabel, { color: c.textMuted }]}>{t.workerTotalEarned}</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
                <View style={styles.summaryCell}>
                  <Text style={[styles.summaryAmount, { color: c.green }]}>₪{totalPaid.toFixed(0)}</Text>
                  <Text style={[styles.summaryLabel, { color: c.textMuted }]}>{t.workerTotalPaid}</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
                <View style={styles.summaryCell}>
                  <Text style={[styles.summaryAmount, { color: c.red }]}>₪{totalPending.toFixed(0)}</Text>
                  <Text style={[styles.summaryLabel, { color: c.textMuted }]}>{t.workerTotalPending}</Text>
                </View>
              </View>
            )}

            {/* Section label */}
            {rows.length > 0 && (
              <Text style={[styles.sectionLabel, { color: c.textMuted }]}>אירועים</Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💵</Text>
            <Text style={[styles.emptyText, { color: c.text }]}>{t.noWorkerPayments}</Text>
            <Text style={[styles.emptySubtext, { color: c.textMuted }]}>{t.noWorkerPaymentsSubtext}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.historyRow, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
            <View style={styles.historyInfo}>
              <Text style={[styles.historyEventTitle, { color: c.text }]} numberOfLines={1}>
                {item.events?.title}
              </Text>
              <Text style={[styles.historyDate, { color: c.textMuted }]}>
                {formatDate(item.events?.date)}
              </Text>
            </View>
            <View style={styles.historyRight}>
              <Text style={[styles.historyAmount, { color: c.text }]}>
                ₪{(item.pay_amount || 0).toFixed(0)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: item.is_paid ? c.greenSoft : c.redSoft }]}>
                <Text style={[styles.statusBadgeText, { color: item.is_paid ? c.green : c.red }]}>
                  {item.is_paid ? 'שולם' : 'ממתין'}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, marginTop: 16, marginBottom: 16,
  },
  pageTitle: { fontSize: 25, fontWeight: '800', textAlign: rtl ? 'right' : 'left' },

  summaryCard: {
    borderRadius: 16, borderWidth: 1,
    marginHorizontal: 22, marginBottom: 20,
    flexDirection: 'row',
  },
  summaryCell: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  summaryDivider: { width: 1, marginVertical: 10 },
  summaryAmount: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 4, textAlign: 'center' },

  sectionLabel: {
    fontSize: 13, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 22, marginBottom: 10,
    textAlign: rtl ? 'right' : 'left',
  },

  historyRow: {
    borderRadius: 14, borderWidth: 1, marginBottom: 10,
    marginHorizontal: 22,
    paddingVertical: 13, paddingHorizontal: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  historyInfo: { flex: 1, marginEnd: 12 },
  historyEventTitle: { fontSize: 14, fontWeight: '700', textAlign: rtl ? 'right' : 'left' },
  historyDate: { fontSize: 12, marginTop: 2, textAlign: rtl ? 'right' : 'left' },
  historyRight: { alignItems: 'flex-end', gap: 6 },
  historyAmount: { fontSize: 15, fontWeight: '800' },
  statusBadge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  emptySubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
