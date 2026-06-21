import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, I18nManager,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../context/ThemeContext';
import { cardShadow } from '../../../theme/shadows';
import ScreenWrapper from '../../../components/ScreenWrapper';
import OfflineBanner from '../../../components/OfflineBanner';
import { t } from '../../../i18n/he';

const rtl = I18nManager.isRTL;

function getDateParts(dateStr) {
  if (!dateStr) return { dd: '—', mm: '—' };
  const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
  if (isNaN(d.getTime())) return { dd: '—', mm: '—' };
  return {
    dd: d.getDate().toString(),
    mm: d.toLocaleDateString('he-IL', { month: 'short' }),
  };
}

function formatMeta(dateStr, time, venue) {
  const parts = [];
  if (dateStr) {
    const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
    if (!isNaN(d.getTime())) {
      parts.push(d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }));
    }
  }
  if (time) parts.push(`🕐 ${time}`);
  if (venue) parts.push(`📍 ${venue}`);
  return parts.join('  ');
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
  const { c, theme } = useTheme();
  const shadow = theme === 'light' ? cardShadow : {};
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: events = [], isLoading, isFetching } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

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
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background }}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <OfflineBanner />

      {/* Title row */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: c.text }]}>{t.events}</Text>
          {isFetching && (
            <ActivityIndicator size="small" color={c.textMuted} style={{ marginStart: 8 }} />
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: c.primary }]}
          onPress={() => navigation.navigate('AddEvent')}
          activeOpacity={0.8}
        >
          <Text style={[styles.addBtnText, { color: c.onPrimary }]}>{t.addNew}</Text>
        </TouchableOpacity>
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
            <Text style={[
              styles.filterText,
              { color: filter === f.key ? c.onPrimary : c.textMuted },
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={[
        styles.searchRow,
        { backgroundColor: c.card, borderColor: c.border },
        shadow,
      ]}>
        <Ionicons name="search-outline" size={18} color={c.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          placeholder="חפש אירוע..."
          placeholderTextColor={c.textMuted}
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
              <Text style={[styles.emptyText, { color: c.text }]}>{t.noEventsYet}</Text>
              <Text style={[styles.emptySubtext, { color: c.textMuted }]}>{t.tapToCreateEvent}</Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={[styles.emptyText, { color: c.text }]}>לא נמצאו אירועים</Text>
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
            const done  = item.status === 'done';
            const { dd, mm } = getDateParts(item.date);
            return (
              <TouchableOpacity
                style={[
                  styles.card,
                  { backgroundColor: c.card, borderColor: today ? c.primary : c.border,
                    borderWidth: today ? 1.5 : 1 },
                  shadow,
                ]}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
                activeOpacity={0.75}
              >
                {/* Date chip */}
                <View style={[
                  styles.dateChip,
                  { backgroundColor: done ? c.border : c.primarySoft },
                ]}>
                  <Text style={[
                    styles.dateChipDd,
                    { color: done ? c.textMuted : (theme === 'dark' ? c.accentGlyph : c.primary) },
                  ]}>
                    {dd}
                  </Text>
                  <Text style={[
                    styles.dateChipMm,
                    { color: done ? c.textMuted : (theme === 'dark' ? c.accentGlyph : c.primary) },
                  ]}>
                    {mm}
                  </Text>
                </View>

                {/* Body */}
                <View style={styles.cardBody}>
                  <Text style={[styles.eventTitle, { color: c.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.eventMeta, { color: c.textMuted }]} numberOfLines={1}>
                    {formatMeta(item.date, item.time, item.venue)}
                  </Text>
                </View>

                {/* Today badge */}
                {today && (
                  <View style={[styles.todayBadge, { backgroundColor: c.primary }]}>
                    <Text style={styles.todayBadgeText}>היום! 🎉</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 16,
    marginTop: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 25, fontWeight: '800' },
  addBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { fontWeight: '700', fontSize: 15 },

  filters: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    marginBottom: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16, minHeight: 38,
    justifyContent: 'center', borderRadius: 10, borderWidth: 1,
  },
  filterText: { fontSize: 14, fontWeight: '600' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 22,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { marginEnd: 8 },
  searchInput: { flex: 1, fontSize: 15 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600' },
  emptySubtext: { fontSize: 14, marginTop: 4 },

  card: {
    borderRadius: 16,
    marginBottom: 13,
    marginHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
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
  cardBody: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: '800' },
  eventMeta: { fontSize: 12.5, fontWeight: '500', marginTop: 3 },
  todayBadge: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  todayBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
