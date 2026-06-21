import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, I18nManager, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../context/ThemeContext';
import { cardShadow } from '../../../theme/shadows';
import ScreenWrapper from '../../../components/ScreenWrapper';
import OfflineBanner from '../../../components/OfflineBanner';
import { t } from '../../../i18n/he';

const rtl = I18nManager.isRTL;

async function fetchStaff() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone, role')
    .eq('role', 'worker')
    .order('name');
  if (error) throw error;
  return data || [];
}

export default function StaffListScreen({ navigation }) {
  const { c, theme } = useTheme();
  const shadow = theme === 'light' ? cardShadow : {};
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: workers = [], isLoading, isFetching } = useQuery({
    queryKey: ['staff'],
    queryFn: fetchStaff,
  });

  const deleteMutation = useMutation({
    mutationFn: async (workerId) => {
      const { error } = await supabase.rpc('delete_worker_account', { user_id: workerId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => Alert.alert(t.error, error.message),
  });

  useFocusEffect(
    useCallback(() => {
      return () => setSearch('');
    }, [])
  );

  function deleteWorker(id, name) {
    Alert.alert(t.removeWorker, t.removeWorkerConfirm(name), [
      { text: t.cancel, style: 'cancel' },
      { text: t.remove, style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  }

  const q       = search.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, '');
  const filtered = q
    ? workers.filter(w =>
        w.name?.toLowerCase().includes(q) ||
        (qDigits && w.phone?.replace(/\D/g, '').includes(qDigits))
      )
    : workers;

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

      {/* Title + add button */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: c.text }]}>{t.staff}</Text>
          {isFetching && (
            <ActivityIndicator size="small" color={c.textMuted} style={{ marginStart: 8 }} />
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: c.primary }]}
          onPress={() => navigation.navigate('AddWorker')}
          activeOpacity={0.8}
        >
          <Text style={[styles.addBtnText, { color: c.onPrimary }]}>{t.addWorker}</Text>
        </TouchableOpacity>
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
          placeholder="חפש עובד..."
          placeholderTextColor={c.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
          textAlign={rtl ? 'right' : 'left'}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          {workers.length === 0 ? (
            <>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={[styles.emptyText, { color: c.text }]}>{t.noWorkersYet}</Text>
              <Text style={[styles.emptySubtext, { color: c.textMuted }]}>{t.tapToAddWorker}</Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={[styles.emptyText, { color: c.text }]}>לא נמצאו עובדים</Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
              <TouchableOpacity
                style={styles.cardMain}
                onPress={() => navigation.navigate('EditWorker', { worker: item })}
                activeOpacity={0.7}
              >
                <View style={[styles.avatar, { backgroundColor: c.primarySoft }]}>
                  <Text style={[styles.avatarText, { color: c.accentGlyph }]}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.workerName, { color: c.text }]}>{item.name}</Text>
                  <Text style={[styles.workerPhone, { color: c.textMuted }]}>
                    {item.phone || t.noPhone}
                  </Text>
                </View>
              </TouchableOpacity>

              {item.phone ? (
                <TouchableOpacity
                  style={[styles.callBtn, { backgroundColor: c.greenSoft }]}
                  onPress={() => Linking.openURL('tel:' + item.phone)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call-outline" size={20} color={c.green} />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: c.redSoft }]}
                onPress={() => deleteWorker(item.id, item.name)}
                activeOpacity={0.7}
              >
                <Text style={[styles.deleteBtnText, { color: c.red }]}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, marginTop: 8, marginBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 25, fontWeight: '800' },
  addBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { fontWeight: '700', fontSize: 15 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
    marginHorizontal: 22, marginBottom: 16,
    paddingHorizontal: 12, height: 44,
  },
  searchIcon: { marginEnd: 8 },
  searchInput: { flex: 1, fontSize: 15 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600' },
  emptySubtext: { fontSize: 14, marginTop: 4 },

  card: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12, marginHorizontal: 22,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center', marginEnd: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  workerName: { fontSize: 16, fontWeight: '700' },
  workerPhone: { fontSize: 14, marginTop: 2 },

  callBtn: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center', marginEnd: 8,
  },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '700' },
});
