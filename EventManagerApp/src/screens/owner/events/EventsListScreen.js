import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, I18nManager,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import ScreenWrapper from '../../../components/ScreenWrapper';
import OfflineBanner from '../../../components/OfflineBanner';
import { t } from '../../../i18n/he';

const rtl = I18nManager.isRTL;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
  return d.toDateString() === new Date().toDateString();
}

async function fetchEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export default function EventsListScreen({ navigation }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: events = [], isLoading, isFetching } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  // Clear search when leaving the screen — no data refetch needed here
  useFocusEffect(
    useCallback(() => {
      return () => setSearch('');
    }, [])
  );

  const q = search.trim().toLowerCase();

  const filtered = events.filter(e => {
    const matchesFilter = filter === 'all' || e.status === filter;
    const matchesSearch = !q ||
      e.title?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  // Today's events always float to the top; original order preserved otherwise
  const sorted = [...filtered].sort((a, b) => {
    const aToday = isToday(a.date) ? 0 : 1;
    const bToday = isToday(b.date) ? 0 : 1;
    return aToday - bToday;
  });

  const filters = [
    { key: 'all',      label: t.filterAll },
    { key: 'upcoming', label: t.filterUpcoming },
    { key: 'done',     label: t.filterDone },
  ];

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#5B6EF5" /></View>;
  }

  return (
    <ScreenWrapper>
      <OfflineBanner />

      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t.events}</Text>
          {isFetching && <ActivityIndicator size="small" color="#9CA3AF" style={{ marginStart: 8 }} />}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddEvent')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>{t.addNew}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="חפש אירוע..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
          textAlign={rtl ? 'right' : 'left'}
        />
      </View>

      {sorted.length === 0 ? (
        <View style={styles.empty}>
          {events.length === 0 ? (
            <>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>{t.noEventsYet}</Text>
              <Text style={styles.emptySubtext}>{t.tapToCreateEvent}</Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>לא נמצאו אירועים</Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const today = isToday(item.date);
            return (
              <TouchableOpacity
                style={[styles.card, today && styles.cardToday]}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
                activeOpacity={0.75}
              >
                <View style={[styles.statusBar, item.status === 'upcoming' ? styles.upcoming : styles.done]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                    {today ? (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>היום! 🎉</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, item.status === 'upcoming' ? styles.badgeUpcoming : styles.badgeDone]}>
                        <Text style={styles.badgeText}>
                          {item.status === 'upcoming' ? `🔵 ${t.filterUpcoming}` : `✅ ${t.filterDone}`}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.eventDate}>
                    📅 {formatDate(item.date)}{item.time ? `  🕐 ${item.time}` : ''}
                  </Text>
                  {item.venue ? <Text style={styles.eventVenue}>📍 {item.venue}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#1a1a2e' },
  addBtn: {
    backgroundColor: '#5B6EF5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterBtnActive: { backgroundColor: '#5B6EF5' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#fff' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 44,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  searchIcon: { marginEnd: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1a1a2e' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardToday: {
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    elevation: 4,
    shadowOpacity: 0.12,
  },
  statusBar: { width: 6 },
  upcoming: { backgroundColor: '#5B6EF5' },
  done: { backgroundColor: '#27ae60' },
  cardBody: { flex: 1, paddingHorizontal: 16, paddingVertical: 14 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
    flex: 1,
    marginEnd: 8,
    textAlign: rtl ? 'right' : 'left',
  },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeUpcoming: { backgroundColor: '#EEF2FF' },
  badgeDone: { backgroundColor: '#ECFDF5' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  todayBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  todayBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  eventDate: { fontSize: 14, color: '#6B7280', marginBottom: 4, textAlign: rtl ? 'right' : 'left' },
  eventVenue: { fontSize: 14, color: '#9CA3AF', textAlign: rtl ? 'right' : 'left' },
});
