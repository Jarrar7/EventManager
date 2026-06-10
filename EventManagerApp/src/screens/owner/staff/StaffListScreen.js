import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, I18nManager, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import ScreenWrapper from '../../../components/ScreenWrapper';
import OfflineBanner from '../../../components/OfflineBanner';
import { t } from '../../../i18n/he';

const rtl = I18nManager.isRTL;

export default function StaffListScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchWorkers();
      return () => setSearch('');
    }, [])
  );

  async function fetchWorkers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, name, phone, role')
      .eq('role', 'worker')
      .order('name');
    if (error) Alert.alert(t.error, error.message);
    else setWorkers(data);
    setLoading(false);
  }

  async function deleteWorker(id, name) {
    Alert.alert(
      t.removeWorker,
      t.removeWorkerConfirm(name),
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.remove, style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('delete_worker_account', { user_id: id });
            if (error) Alert.alert(t.error, error.message);
            else fetchWorkers();
          },
        },
      ]
    );
  }

  const q = search.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, '');
  const filtered = q
    ? workers.filter(w =>
        w.name?.toLowerCase().includes(q) ||
        (qDigits && w.phone?.replace(/\D/g, '').includes(qDigits))
      )
    : workers;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B6EF5" />
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <OfflineBanner />

      <View style={styles.headerRow}>
        <Text style={styles.title}>{t.staff}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddWorker')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>{t.addWorker}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="חפש עובד..."
          placeholderTextColor="#9CA3AF"
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
              <Text style={styles.emptyText}>{t.noWorkersYet}</Text>
              <Text style={styles.emptySubtext}>{t.tapToAddWorker}</Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>לא נמצאו עובדים</Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardMain}
                onPress={() => navigation.navigate('EditWorker', { worker: item })}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.workerName}>{item.name}</Text>
                  <Text style={styles.workerPhone}>{item.phone || t.noPhone}</Text>
                </View>
              </TouchableOpacity>
              {item.phone ? (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL('tel:' + item.phone)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call-outline" size={20} color="#10B981" />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteWorker(item.id, item.name)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
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
    marginTop: 8,
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#1a1a2e' },
  addBtn: {
    backgroundColor: '#5B6EF5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

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
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#5B6EF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 14,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  workerName: { fontSize: 17, fontWeight: '600', color: '#1a1a2e' },
  workerPhone: { fontSize: 14, color: '#9CA3AF', marginTop: 2 },

  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 8,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 14, color: '#e74c3c', fontWeight: '700' },
});
