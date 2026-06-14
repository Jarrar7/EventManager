import React from 'react';
import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, I18nManager,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
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
  const queryClient = useQueryClient();

  const { data: sections = [], isLoading, isFetching } = useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ assignmentId, newPaid }) => {
      const { error } = await supabase
        .from('event_workers')
        .update({
          is_paid: newPaid,
          paid_at: newPaid ? new Date().toISOString() : null,
        })
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['worker-payments'] });
      // Invalidate all cached event detail screens since payment status changed
      queryClient.invalidateQueries({ queryKey: ['event-detail'] });
    },
    onError: (error) => Alert.alert(t.error, error.message),
  });

  // Which assignment row is currently being toggled
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
    return <View style={styles.center}><ActivityIndicator size="large" color="#5B6EF5" /></View>;
  }

  if (sections.length === 0) {
    return (
      <ScreenWrapper>
        <OfflineBanner />
        <Text style={styles.pageTitle}>{t.paymentsTitle}</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyText}>{t.noPayments}</Text>
          <Text style={styles.emptySubtext}>{t.noPaymentsSubtext}</Text>
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
              <Text style={styles.pageTitle}>{t.paymentsTitle}</Text>
              {isFetching && <ActivityIndicator size="small" color="#9CA3AF" style={{ marginStart: 8 }} />}
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryAmount}>₪{grandOwed.toFixed(0)}</Text>
                <Text style={styles.summaryLabel}>{t.totalOwed}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryAmount, styles.amountPaid]}>₪{grandPaid.toFixed(0)}</Text>
                <Text style={styles.summaryLabel}>{t.totalPaid}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryAmount, styles.amountUnpaid]}>₪{grandUnpaid.toFixed(0)}</Text>
                <Text style={styles.summaryLabel}>{t.totalUnpaid}</Text>
              </View>
            </View>
          </>
        }
        renderSectionHeader={({ section }) => {
          const unpaid = section.totalOwed - section.totalPaid;
          return (
            <View style={styles.workerHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{section.worker?.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.workerMeta}>
                <Text style={styles.workerName}>{section.worker?.name}</Text>
                <View style={styles.workerTotals}>
                  {unpaid > 0 && (
                    <Text style={styles.unpaidChip}>₪{unpaid.toFixed(0)} {t.totalUnpaid}</Text>
                  )}
                  {section.totalPaid > 0 && (
                    <Text style={styles.paidChip}>₪{section.totalPaid.toFixed(0)} {t.totalPaid}</Text>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <View style={[styles.assignmentRow, item.is_paid && styles.assignmentRowPaid]}>
            <View style={styles.assignmentInfo}>
              <Text style={styles.eventTitle} numberOfLines={1}>{item.events?.title}</Text>
              <Text style={styles.eventDate}>{formatDate(item.events?.date)}</Text>
            </View>
            <View style={styles.assignmentRight}>
              <Text style={[styles.payAmount, item.is_paid ? styles.amountPaid : styles.amountUnpaid]}>
                ₪{(item.pay_amount || 0).toFixed(0)}
              </Text>
              <TouchableOpacity
                style={[styles.toggleBtn, item.is_paid ? styles.toggleBtnPaid : styles.toggleBtnUnpaid]}
                onPress={() => confirmToggle(item)}
                disabled={togglingId === item.id}
                activeOpacity={0.8}
              >
                {togglingId === item.id
                  ? <ActivityIndicator size="small" color={item.is_paid ? '#6B7280' : '#fff'} />
                  : <Text style={[styles.toggleBtnText, item.is_paid && styles.toggleBtnTextPaid]}>
                      {item.is_paid ? t.markAsUnpaid : t.markAsPaid}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
        SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 26, fontWeight: '700', color: '#1a1a2e',
    textAlign: rtl ? 'right' : 'left',
  },

  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginHorizontal: 20, marginBottom: 24,
    flexDirection: 'row', padding: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  summaryAmount: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  summaryLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },

  workerHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#5B6EF5',
    justifyContent: 'center', alignItems: 'center', marginEnd: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  workerMeta: { flex: 1 },
  workerName: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', textAlign: rtl ? 'right' : 'left' },
  workerTotals: { flexDirection: 'row', gap: 8, marginTop: 4 },
  unpaidChip: {
    fontSize: 12, fontWeight: '600', color: '#e74c3c',
    backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  paidChip: {
    fontSize: 12, fontWeight: '600', color: '#10B981',
    backgroundColor: '#ECFDF5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },

  assignmentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 8,
    borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  assignmentRowPaid: { opacity: 0.75 },
  assignmentInfo: { flex: 1, marginEnd: 12 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', textAlign: rtl ? 'right' : 'left' },
  eventDate: { fontSize: 13, color: '#9CA3AF', marginTop: 2, textAlign: rtl ? 'right' : 'left' },
  assignmentRight: { alignItems: 'flex-end', gap: 8 },
  payAmount: { fontSize: 18, fontWeight: '700' },
  amountPaid: { color: '#10B981' },
  amountUnpaid: { color: '#e74c3c' },

  toggleBtn: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, minWidth: 90, alignItems: 'center',
  },
  toggleBtnUnpaid: { backgroundColor: '#10B981' },
  toggleBtnPaid:   { backgroundColor: '#F3F4F6' },
  toggleBtnText:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  toggleBtnTextPaid: { color: '#6B7280' },

  sectionSeparator: { height: 8 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151', textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
});
