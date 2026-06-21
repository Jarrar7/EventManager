import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, I18nManager,
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

function parseDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  return new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
}

function getDateParts(dateStr) {
  const d = parseDate(dateStr);
  if (isNaN(d.getTime())) return { dd: '—', mm: '—' };
  return {
    dd: d.getDate().toString(),
    mm: d.toLocaleDateString('he-IL', { month: 'short' }),
  };
}

function formatMeta(dateStr, venue) {
  const parts = [];
  const d = parseDate(dateStr);
  if (!isNaN(d.getTime())) {
    parts.push(d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }));
  }
  if (venue) parts.push(`📍 ${venue}`);
  return parts.join('  ');
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = parseDate(dateStr);
  if (isNaN(eventDate.getTime())) return 0;
  eventDate.setHours(0, 0, 0, 0);
  return Math.round((eventDate - today) / (1000 * 60 * 60 * 24));
}

export default function ShiftsScreen() {
  const { profile } = useAuth();
  const { c, theme } = useTheme();
  const shadow = theme === 'light' ? cardShadow : {};
  const [filter, setFilter] = useState('upcoming');

  const { data: allShifts = [], isLoading, isFetching } = useQuery({
    queryKey: ['shifts', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_workers')
        .select('*, events(*)')
        .eq('worker_id', profile.id);
      if (error) throw error;
      return (data || []).sort((a, b) => parseDate(a.events?.date) - parseDate(b.events?.date));
    },
    enabled: !!profile?.id,
  });

  const shifts = allShifts.filter(r => {
    if (filter === 'all') return true;
    return r.events?.status === filter;
  });

  const filters = [
    { key: 'all',      label: t.filterAll },
    { key: 'upcoming', label: t.filterUpcoming },
    { key: 'done',     label: t.filterDone },
  ];

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

      {/* Title + fetching indicator */}
      <View style={styles.titleRow}>
        <Text style={[styles.pageTitle, { color: c.text }]}>{t.myShiftsTitle}</Text>
        {isFetching && <ActivityIndicator size="small" color={c.textMuted} style={{ marginStart: 8 }} />}
      </View>

      {/* Filter pills */}
      <View style={styles.filters}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterBtn,
              { backgroundColor: filter === f.key ? c.primary : c.card, borderColor: c.border },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, { color: filter === f.key ? c.onPrimary : c.textMuted }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {shifts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={[styles.emptyText, { color: c.text }]}>{t.noShifts}</Text>
          <Text style={[styles.emptySubtext, { color: c.textMuted }]}>{t.noShiftsSubtext}</Text>
        </View>
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={item => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => {
            const ev   = item.events;
            const done = ev?.status === 'done';
            const { dd, mm } = getDateParts(ev?.date);
            const days = daysUntil(ev?.date);

            return (
              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
                {/* Date chip */}
                <View style={[styles.dateChip, { backgroundColor: done ? c.border : c.primarySoft }]}>
                  <Text style={[styles.dateChipDd, { color: done ? c.textMuted : (theme === 'dark' ? c.accentGlyph : c.primary) }]}>
                    {dd}
                  </Text>
                  <Text style={[styles.dateChipMm, { color: done ? c.textMuted : (theme === 'dark' ? c.accentGlyph : c.primary) }]}>
                    {mm}
                  </Text>
                </View>

                {/* Body */}
                <View style={styles.cardBody}>
                  <Text style={[styles.eventTitle, { color: c.text }]} numberOfLines={1}>
                    {ev?.title}
                  </Text>
                  <Text style={[styles.eventMeta, { color: c.textMuted }]} numberOfLines={1}>
                    {formatMeta(ev?.date, ev?.venue)}
                  </Text>
                </View>

                {/* Trailing: pay + status */}
                <View style={styles.trailing}>
                  <Text style={[styles.payAmount, { color: c.text }]}>
                    ₪{(item.pay_amount || 0).toFixed(0)}
                  </Text>
                  {!done && days >= 0 && (
                    <DaysChip days={days} c={c} />
                  )}
                  {done && (
                    <View style={[styles.doneChip, { backgroundColor: c.greenSoft }]}>
                      <Text style={[styles.doneChipText, { color: c.green }]}>
                        {item.is_paid ? 'שולם' : 'הסתיים'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </ScreenWrapper>
  );
}

function DaysChip({ days, c }) {
  if (days === 0) {
    return (
      <View style={[styles.chipBase, { backgroundColor: c.red }]}>
        <Text style={styles.chipText}>היום!</Text>
      </View>
    );
  }
  if (days <= 7) {
    return (
      <View style={[styles.chipBase, { backgroundColor: c.statPeachBg }]}>
        <Text style={[styles.chipText, { color: c.statPeachFg }]}>
          {days === 1 ? 'מחר' : `${days} ימים`}
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.chipBase, { backgroundColor: c.primarySoft }]}>
      <Text style={[styles.chipText, { color: c.accentGlyph }]}>{days} ימים</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, marginTop: 16, marginBottom: 12,
  },
  pageTitle: { fontSize: 25, fontWeight: '800', textAlign: rtl ? 'right' : 'left' },

  filters: {
    flexDirection: 'row', paddingHorizontal: 22, marginBottom: 14, gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16, minHeight: 36,
    justifyContent: 'center', borderRadius: 10, borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: '600' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  emptySubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1,
    marginHorizontal: 22, marginBottom: 13, padding: 15, gap: 14,
  },
  dateChip: {
    width: 54, borderRadius: 12, paddingVertical: 9, alignItems: 'center',
  },
  dateChipDd: { fontSize: 20, fontWeight: '800' },
  dateChipMm: { fontSize: 10, fontWeight: '700' },
  cardBody: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: '800' },
  eventMeta: { fontSize: 12.5, fontWeight: '500', marginTop: 3 },
  trailing: { alignItems: 'flex-end', gap: 7 },
  payAmount: { fontSize: 16, fontWeight: '800' },
  chipBase: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  chipText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  doneChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  doneChipText: { fontSize: 11, fontWeight: '700' },
});
