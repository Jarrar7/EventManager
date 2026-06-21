import React from 'react';
import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, I18nManager,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
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

async function fetchPayments() {
  const { data, error } = await supabase
    .from('event_workers')
    .select('id, pay_amount, is_paid, paid_at, event_id, worker_id, users(id, name), events(id, title, date)')
    .order('is_paid', { ascending: true })
    .order('event_id');
  if (error) throw error;

  const byWorker = {};
  for (const row of data) {
    const wid = row.worker_id;
    if (!byWorker[wid]) {
      byWorker[wid] = { worker: row.users, totalOwed: 0, totalPaid: 0, data: [] };
    }
    byWorker[wid].totalOwed += row.pay_amount || 0;
    if (row.is_paid) byWorker[wid].totalPaid += row.pay_amount || 0;
    byWorker[wid].data.push(row);
  }

  return Object.values(byWorker).sort(
    (a, b) => (b.totalOwed - b.totalPaid) - (a.totalOwed - a.totalPaid)
  );
}

export default function PaymentsScreen() {
  const { c, theme } = useTheme();
  const shadow = theme === 'light' ? cardShadow : {};
  const queryClient = useQueryClient();

  const { data: sections = [], isLoading, isFetching } = useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ assignmentId, newPaid }) => {
      const { error } = await supabase
        .from('event_workers')
        .update({ is_paid: newPaid, paid_at: newPaid ? new Date().toISOString() : null })
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['worker-payments'] });
      queryClient.invalidateQueries({ queryKey: ['event-detail'] });
    },
    onError: (error) => Alert.alert(t.error, error.message),
  });

  const togglingId = toggleMutation.isLoading ? toggleMutation.variables?.assignmentId : null;

  function confirmToggle(assignment) {
    const workerName = assignment.users?.name;
    const eventTitle = assignment.events?.title;
    const message = assignment.is_paid
      ? t.confirmMarkUnpaid(workerName, eventTitle)
      : t.confirmMarkPaid(workerName, eventTitle);
    const action = assignment.is_paid ? t.markAsUnpaid : t.markAsPaid;

    Alert.alert(action, message, [
      { text: t.cancel, style: 'cancel' },
      {
        text: action,
        onPress: () => toggleMutation.mutate({
          assignmentId: assignment.id,
          newPaid: !assignment.is_paid,
        }),
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

  if (sections.length === 0) {
    return (
      <ScreenWrapper>
        <OfflineBanner />
        <Text style={[styles.pageTitle, { color: c.text }]}>{t.paymentsTitle}</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={[styles.emptyText, { color: c.text }]}>{t.noPayments}</Text>
          <Text style={[styles.emptySubtext, { color: c.textMuted }]}>{t.noPaymentsSubtext}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const grandOwed   = sections.reduce((s, sec) => s + sec.totalOwed, 0);
  const grandPaid   = sections.reduce((s, sec) => s + sec.totalPaid, 0);
  const grandUnpaid = grandOwed - grandPaid;

  return (
    <ScreenWrapper>
      <OfflineBanner />
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <>
            <View style={styles.titleRow}>
              <Text style={[styles.pageTitle, { color: c.text }]}>{t.paymentsTitle}</Text>
              {isFetching && (
                <ActivityIndicator size="small" color={c.textMuted} style={{ marginStart: 8 }} />
              )}
            </View>

            {/* Summary card — 3 cells with 1px dividers */}
            <View style={[
              styles.summaryCard,
              { backgroundColor: c.card, borderColor: c.border },
              shadow,
            ]}>
              <View style={styles.summaryCell}>
                <Text style={[styles.summaryAmount, { color: c.text }]}>₪{grandOwed.toFixed(0)}</Text>
                <Text style={[styles.summaryLabel, { color: c.textMuted }]}>{t.totalOwed}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
              <View style={styles.summaryCell}>
                <Text style={[styles.summaryAmount, { color: c.green }]}>₪{grandPaid.toFixed(0)}</Text>
                <Text style={[styles.summaryLabel, { color: c.textMuted }]}>{t.totalPaid}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
              <View style={styles.summaryCell}>
                <Text style={[styles.summaryAmount, { color: c.red }]}>₪{grandUnpaid.toFixed(0)}</Text>
                <Text style={[styles.summaryLabel, { color: c.textMuted }]}>{t.totalUnpaid}</Text>
              </View>
            </View>
          </>
        }
        renderSectionHeader={({ section }) => {
          const unpaid = section.totalOwed - section.totalPaid;
          const allPaid = unpaid <= 0;
          return (
            <View style={[styles.workerHeader]}>
              <View style={[styles.avatar, { backgroundColor: c.primarySoft }]}>
                <Text style={[styles.avatarText, { color: c.accentGlyph }]}>
                  {section.worker?.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.workerMeta}>
                <Text style={[styles.workerName, { color: c.text }]}>{section.worker?.name}</Text>
                <View style={styles.workerTotals}>
                  {!allPaid && (
                    <Text style={[styles.unpaidChip, { color: c.red, backgroundColor: c.redSoft }]}>
                      ₪{unpaid.toFixed(0)} {t.totalUnpaid}
                    </Text>
                  )}
                  {allPaid && (
                    <Text style={[styles.paidChip, { color: c.green, backgroundColor: c.greenSoft }]}>
                      ✓ שולם הכל
                    </Text>
                  )}
                  {section.totalPaid > 0 && !allPaid && (
                    <Text style={[styles.paidChip, { color: c.green, backgroundColor: c.greenSoft }]}>
                      ₪{section.totalPaid.toFixed(0)} {t.totalPaid}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <View style={[
            styles.paymentRow,
            { backgroundColor: c.card, borderColor: c.border, opacity: item.is_paid ? 0.8 : 1 },
            shadow,
          ]}>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentEventTitle, { color: c.text }]} numberOfLines={1}>
                {item.events?.title}
              </Text>
              <Text style={[styles.paymentDate, { color: c.textMuted }]}>
                {formatDate(item.events?.date)}
              </Text>
            </View>
            <View style={styles.paymentRight}>
              <Text style={[styles.paymentAmount, {
                color: item.is_paid ? c.green : c.red,
              }]}>
                ₪{(item.pay_amount || 0).toFixed(0)}
              </Text>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  { backgroundColor: item.is_paid ? c.border : c.green },
                ]}
                onPress={() => confirmToggle(item)}
                disabled={togglingId === item.id}
                activeOpacity={0.8}
              >
                {togglingId === item.id
                  ? <ActivityIndicator size="small" color={item.is_paid ? c.textMuted : '#fff'} />
                  : <Text style={[
                      styles.toggleBtnText,
                      { color: item.is_paid ? c.textMuted : '#fff' },
                    ]}>
                      {item.is_paid ? t.markAsUnpaid : t.markAsPaid}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
        SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
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
    marginHorizontal: 22, marginBottom: 24,
    flexDirection: 'row',
  },
  summaryCell: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  summaryDivider: { width: 1, marginVertical: 10 },
  summaryAmount: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },

  workerHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginEnd: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  workerMeta: { flex: 1 },
  workerName: { fontSize: 17, fontWeight: '700', textAlign: rtl ? 'right' : 'left' },
  workerTotals: { flexDirection: 'row', gap: 8, marginTop: 4 },
  unpaidChip: {
    fontSize: 12, fontWeight: '600',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  paidChip: {
    fontSize: 12, fontWeight: '600',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },

  paymentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 22, marginBottom: 8,
    borderRadius: 12, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  paymentInfo: { flex: 1, marginEnd: 12 },
  paymentEventTitle: { fontSize: 14, fontWeight: '600', textAlign: rtl ? 'right' : 'left' },
  paymentDate: { fontSize: 12, marginTop: 2, textAlign: rtl ? 'right' : 'left' },
  paymentRight: { alignItems: 'flex-end', gap: 8 },
  paymentAmount: { fontSize: 16, fontWeight: '800' },
  toggleBtn: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
    minWidth: 90, alignItems: 'center',
  },
  toggleBtnText: { fontSize: 13, fontWeight: '700' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  emptySubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
