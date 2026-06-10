import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, I18nManager,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ScreenWrapper from '../../components/ScreenWrapper';
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
  const today = todayMidnight();
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
  return diff >= 1 && diff <= 6;
}

function formatShortDate(dateStr) {
  const d = parseDate(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
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

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EventRow({ event, onPress }) {
  return (
    <TouchableOpacity style={styles.eventRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.eventRowAccent, { backgroundColor: event.status === 'done' ? '#27ae60' : '#5B6EF5' }]} />
      <View style={styles.eventRowBody}>
        <Text style={styles.eventRowTitle} numberOfLines={1}>{event.title}</Text>
        {event.venue ? <Text style={styles.eventRowVenue} numberOfLines={1}>📍 {event.venue}</Text> : null}
      </View>
      <Text style={styles.eventRowArrow}>{rtl ? '←' : '→'}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [unpaidTotal, setUnpaidTotal] = useState(0);

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  async function loadData() {
    setLoading(true);

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

    setEvents(eventsRes.data || []);

    const unpaidRows = unpaidRes.data || [];
    setUnpaidCount(unpaidRows.length);
    setUnpaidTotal(unpaidRows.reduce((s, r) => s + (r.pay_amount || 0), 0));

    setLoading(false);
  }

  function openEvent(event) {
    navigation.navigate('Events', {
      screen: 'EventDetail',
      params: { eventId: event.id },
    });
  }

  const todayEvents = events.filter(e => isToday(e.date));
  const weekEvents  = events.filter(e => isThisWeek(e.date));
  const upcomingCount = events.length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B6EF5" />
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{hebrewGreeting()}, {profile?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.todayDate}>{todayHebrewDate()}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard icon="📅" label={t.dashUpcomingEvents} value={upcomingCount} color="#5B6EF5" />
          <StatCard icon="👥" label={t.dashUnpaidWorkers}  value={unpaidCount}   color="#e67e22" />
          <StatCard icon="💰" label={t.dashUnpaidTotal}    value={`₪${unpaidTotal.toFixed(0)}`} color="#e74c3c" />
        </View>

        {/* Today section */}
        <SectionHeader title={t.dashToday} count={todayEvents.length} />
        {todayEvents.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>{t.dashNoEventsToday}</Text>
          </View>
        ) : (
          todayEvents.map(ev => (
            <EventRow key={ev.id} event={ev} onPress={() => openEvent(ev)} />
          ))
        )}

        {/* This week section */}
        <SectionHeader title={t.dashThisWeek} count={weekEvents.length} />
        {weekEvents.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>{t.dashNoEventsWeek}</Text>
          </View>
        ) : (
          weekEvents.map(ev => (
            <View key={ev.id}>
              <Text style={styles.weekDateLabel}>{formatShortDate(ev.date)}</Text>
              <EventRow event={ev} onPress={() => openEvent(ev)} />
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function SectionHeader({ title, count }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count > 0 && (
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 16 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    alignSelf: 'stretch',
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: rtl ? 'right' : 'left',
  },
  todayDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: rtl ? 'right' : 'left',
  },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 10,
    alignSelf: 'stretch',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 4, textAlign: 'center' },

  sectionHeader: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  sectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5B6EF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  eventRowAccent: { width: 5, alignSelf: 'stretch' },
  eventRowBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  eventRowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: rtl ? 'right' : 'left',
  },
  eventRowVenue: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: rtl ? 'right' : 'left',
  },
  eventRowArrow: { fontSize: 16, color: '#D1D5DB', marginHorizontal: 12 },

  weekDateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B6EF5',
    marginHorizontal: 20,
    marginBottom: 4,
    marginTop: 4,
    textAlign: rtl ? 'right' : 'left',
  },

  emptySection: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  emptySectionText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
