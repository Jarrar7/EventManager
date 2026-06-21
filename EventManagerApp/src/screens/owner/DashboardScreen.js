import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, I18nManager,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isToday(dateStr) {
  const d = parseDate(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = todayMidnight();
  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
}

function isThisWeek(dateStr) {
  const d = parseDate(dateStr);
  if (isNaN(d.getTime())) return false;
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - todayMidnight()) / (1000 * 60 * 60 * 24));
  return diff >= 1 && diff <= 6;
}

function formatShortDate(dateStr) {
  const d = parseDate(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getDateParts(dateStr) {
  const d = parseDate(dateStr);
  if (isNaN(d.getTime())) return { dd: '—', mm: '—' };
  return {
    dd: d.getDate().toString(),
    mm: d.toLocaleDateString('he-IL', { month: 'short' }),
  };
}

function hebrewGreeting() {
  const h = new Date().getHours();
  if (h < 12) return t.dashGreetingMorning;
  if (h < 17) return t.dashGreetingAfternoon;
  return t.dashGreetingEvening;
}

function todayHebrewDate() {
  return new Date().toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

async function fetchDashboard() {
  const [eventsRes, unpaidRes] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, date, venue, status')
      .eq('status', 'upcoming')
      .order('date', { ascending: true }),
    supabase
      .from('event_workers')
      .select('pay_amount')
      .eq('is_paid', false),
  ]);
  if (eventsRes.error) throw eventsRes.error;
  const events = eventsRes.data || [];
  const unpaidRows = unpaidRes.data || [];
  return {
    events,
    unpaidCount: unpaidRows.length,
    unpaidTotal: unpaidRows.reduce((s, r) => s + (r.pay_amount || 0), 0),
  };
}

export default function DashboardScreen() {
  const { profile } = useAuth();
  const { c, theme } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const shadow = theme === 'light' ? cardShadow : {};

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['dashboard', profile?.id],
    queryFn: fetchDashboard,
    enabled: !!profile?.id,
  });

  useFocusEffect(
    useCallback(() => {
      if (profile?.id) {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    }, [queryClient, profile?.id])
  );

  const events      = data?.events      || [];
  const unpaidCount = data?.unpaidCount || 0;
  const unpaidTotal = data?.unpaidTotal || 0;

  const todayEvents   = events.filter(e => isToday(e.date));
  const weekEvents    = events.filter(e => isThisWeek(e.date));
  const upcomingCount = events.length;

  function openEvent(event) {
    navigation.navigate('Events', {
      screen: 'EventDetail',
      params: { eventId: event.id },
    });
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background }}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  const firstName = profile?.name?.split(' ')[0];

  return (
    <ScreenWrapper>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={[styles.headerAvatar, { backgroundColor: c.heroCircle }]}>
            <Text style={[styles.headerAvatarText, { color: c.accentGlyph }]}>
              {firstName?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerGreeting, { color: c.textMuted }]}>
              {hebrewGreeting()} 👋
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.headerName, { color: c.text }]}>{firstName}</Text>
              {isFetching && (
                <ActivityIndicator size="small" color={c.textMuted} style={{ marginStart: 8 }} />
              )}
            </View>
          </View>
        </View>

        {/* ── Hero stat card ── */}
        <View style={[
          styles.heroCard,
          { backgroundColor: c.heroFill, borderColor: c.border },
          shadow,
        ]}>
          {/* Decorative circle */}
          <View style={[styles.heroCircle, { backgroundColor: c.heroCircle }]} />

          <Text style={[styles.heroLabel, { color: c.textMuted }]}>{t.dashUnpaidTotal}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 18 }}>
            <Text style={[styles.heroSign, { color: c.accentGlyph }]}>₪</Text>
            <Text style={[styles.heroValue, { color: c.text }]}>{unpaidTotal.toFixed(0)}</Text>
          </View>

          {/* Two foot tiles */}
          <View style={styles.heroTiles}>
            <View style={[styles.heroTile, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.heroTileValue, { color: c.text }]}>{upcomingCount}</Text>
              <Text style={[styles.heroTileLabel, { color: c.textMuted }]}>{t.dashUpcomingEvents}</Text>
            </View>
            <View style={[styles.heroTile, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.heroTileValue, { color: c.text }]}>{unpaidCount}</Text>
              <Text style={[styles.heroTileLabel, { color: c.textMuted }]}>{t.dashUnpaidWorkers}</Text>
            </View>
          </View>
        </View>

        {/* ── Quick-stat trio ── */}
        <View style={styles.statTrio}>
          <QuickStat
            value={todayEvents.length}
            label="היום"
            discBg={c.statPeachBg}
            discFg={c.statPeachFg}
            icon="📅"
            c={c}
            shadow={shadow}
          />
          <QuickStat
            value={weekEvents.length}
            label="השבוע"
            discBg={c.statGreenBg}
            discFg={c.statGreenFg}
            icon="📆"
            c={c}
            shadow={shadow}
          />
          <QuickStat
            value={upcomingCount}
            label="קרובים"
            discBg={c.statIndigoBg}
            discFg={c.statIndigoFg}
            icon="🗓"
            c={c}
            shadow={shadow}
          />
        </View>

        {/* ── Today section ── */}
        <SectionHeader title={t.dashToday} count={todayEvents.length} c={c} />
        {todayEvents.length === 0 ? (
          <EmptySection text={t.dashNoEventsToday} c={c} shadow={shadow} />
        ) : (
          todayEvents.map(ev => (
            <EventCard key={ev.id} event={ev} onPress={() => openEvent(ev)} c={c} theme={theme} shadow={shadow} />
          ))
        )}

        {/* ── This week section ── */}
        <SectionHeader title={t.dashThisWeek} count={weekEvents.length} c={c} />
        {weekEvents.length === 0 ? (
          <EmptySection text={t.dashNoEventsWeek} c={c} shadow={shadow} />
        ) : (
          weekEvents.map(ev => (
            <View key={ev.id}>
              <Text style={[styles.weekDateLabel, { color: c.primary }]}>
                {formatShortDate(ev.date)}
              </Text>
              <EventCard event={ev} onPress={() => openEvent(ev)} c={c} theme={theme} shadow={shadow} />
            </View>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

function QuickStat({ value, label, discBg, discFg, icon, c, shadow }) {
  return (
    <View style={[
      styles.quickStat,
      { backgroundColor: c.card, borderColor: c.border },
      shadow,
    ]}>
      <View style={[styles.quickStatDisc, { backgroundColor: discBg }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={[styles.quickStatValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.quickStatLabel, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, count, c }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
      {count > 0 && (
        <View style={[styles.sectionBadge, { backgroundColor: c.primary }]}>
          <Text style={styles.sectionBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

function EmptySection({ text, c, shadow }) {
  return (
    <View style={[
      styles.emptySection,
      { backgroundColor: c.card, borderColor: c.border },
      shadow,
    ]}>
      <Text style={[styles.emptySectionText, { color: c.textMuted }]}>{text}</Text>
    </View>
  );
}

function EventCard({ event, onPress, c, theme, shadow }) {
  const { dd, mm } = getDateParts(event.date);
  const done = event.status === 'done';
  return (
    <TouchableOpacity
      style={[
        styles.eventCard,
        { backgroundColor: c.card, borderColor: c.border },
        shadow,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[
        styles.dateChip,
        { backgroundColor: done ? c.border : c.primarySoft },
      ]}>
        <Text style={[styles.dateChipDd, { color: done ? c.textMuted : (theme === 'dark' ? c.accentGlyph : c.primary) }]}>
          {dd}
        </Text>
        <Text style={[styles.dateChipMm, { color: done ? c.textMuted : (theme === 'dark' ? c.accentGlyph : c.primary) }]}>
          {mm}
        </Text>
      </View>
      <View style={styles.eventCardBody}>
        <Text style={[styles.eventCardTitle, { color: c.text }]} numberOfLines={1}>
          {event.title}
        </Text>
        {event.venue ? (
          <Text style={[styles.eventCardMeta, { color: c.textMuted }]} numberOfLines={1}>
            📍 {event.venue}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.eventCardArrow, { color: c.textMuted }]}>{rtl ? '←' : '→'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 14,
  },
  headerAvatar: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { fontSize: 20, fontWeight: '800' },
  headerText: { flex: 1 },
  headerGreeting: { fontSize: 13, fontWeight: '700' },
  headerName: { fontSize: 23, fontWeight: '800' },

  heroCard: {
    marginHorizontal: 22,
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
    overflow: 'hidden',
    marginBottom: 14,
  },
  heroCircle: {
    position: 'absolute',
    top: -26, right: -24,
    width: 92, height: 92, borderRadius: 46,
  },
  heroLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  heroSign: { fontSize: 23, fontWeight: '800', marginBottom: 6, marginEnd: 2 },
  heroValue: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  heroTiles: { flexDirection: 'row', gap: 10 },
  heroTile: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  heroTileValue: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  heroTileLabel: { fontSize: 11, fontWeight: '600' },

  statTrio: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginBottom: 26,
    gap: 10,
  },
  quickStat: {
    flex: 1, borderRadius: 16, borderWidth: 1,
    padding: 15, alignItems: 'center',
  },
  quickStatDisc: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  quickStatValue: { fontSize: 21, fontWeight: '800' },
  quickStatLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 26,
    marginBottom: 14,
    marginHorizontal: 22,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionBadge: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  emptySection: {
    marginHorizontal: 22,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  emptySectionText: { fontSize: 14 },

  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 22,
    marginBottom: 13,
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
    gap: 14,
  },
  dateChip: {
    width: 54, borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  dateChipDd: { fontSize: 20, fontWeight: '800' },
  dateChipMm: { fontSize: 10, fontWeight: '700' },
  eventCardBody: { flex: 1 },
  eventCardTitle: { fontSize: 16, fontWeight: '800' },
  eventCardMeta: { fontSize: 12.5, fontWeight: '500', marginTop: 3 },
  eventCardArrow: { fontSize: 16, marginStart: 4 },

  weekDateLabel: {
    fontSize: 13, fontWeight: '600',
    marginHorizontal: 22, marginBottom: 4, marginTop: 4,
    textAlign: rtl ? 'right' : 'left',
  },
});
