import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, I18nManager,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import ScreenWrapper from '../../components/ScreenWrapper';
import { t } from '../../i18n/he';

const rtl = I18nManager.isRTL;

export default function ProfileScreen() {
  const { profile, session, signOut } = useAuth();

  const initial = profile?.name?.charAt(0)?.toUpperCase() ?? '?';
  const email = session?.user?.email ?? '—';

  return (
    <ScreenWrapper>
      <View style={styles.container}>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.role}>{t.workerRole}</Text>
        </View>

        {/* Info rows */}
        <View style={styles.infoCard}>
          <InfoRow label={t.email} value={email} ltrValue />
          <View style={styles.divider} />
          <InfoRow label={t.phone} value={profile?.phone ?? t.noPhone} ltrValue={!!profile?.phone} />
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>{t.signOut}</Text>
        </TouchableOpacity>

      </View>
    </ScreenWrapper>
  );
}

function InfoRow({ label, value, ltrValue }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, ltrValue && styles.infoValueLTR]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },

  avatarWrap: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#27ae60',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  role: { fontSize: 15, color: '#27ae60', fontWeight: '600' },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  infoValue: { fontSize: 15, fontWeight: '500', color: '#1a1a2e', textAlign: rtl ? 'right' : 'left' },
  infoValueLTR: { textAlign: 'left' },
  divider: { height: 1, backgroundColor: '#F4F6F9', marginHorizontal: 20 },

  signOutBtn: {
    backgroundColor: '#e74c3c',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  signOutText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
