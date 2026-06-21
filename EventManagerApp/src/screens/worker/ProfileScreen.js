import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, I18nManager,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cardShadow } from '../../theme/shadows';
import ScreenWrapper from '../../components/ScreenWrapper';
import { t } from '../../i18n/he';
import { Ionicons } from '@expo/vector-icons';

const rtl = I18nManager.isRTL;

export default function ProfileScreen() {
  const { profile, session, signOut } = useAuth();
  const { c, theme } = useTheme();
  const shadow = theme === 'light' ? cardShadow : {};

  const initial = profile?.name?.charAt(0)?.toUpperCase() ?? '?';
  const email   = session?.user?.email ?? '—';

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Centered avatar block */}
        <View style={styles.heroBlock}>
          <View style={[styles.avatar, { backgroundColor: c.primarySoft }]}>
            <Text style={[styles.avatarText, { color: c.accentGlyph }]}>{initial}</Text>
          </View>
          <Text style={[styles.name, { color: c.text }]}>{profile?.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: c.primarySoft }]}>
            <Text style={[styles.roleBadgeText, { color: c.accentGlyph }]}>{t.workerRole}</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
          <InfoRow
            icon="mail-outline"
            label={t.email}
            value={email}
            ltr
            c={c}
          />
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <InfoRow
            icon="call-outline"
            label={t.phone}
            value={profile?.phone ?? t.noPhone}
            ltr={!!profile?.phone}
            c={c}
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: c.redSoft }]}
          onPress={signOut}
          activeOpacity={0.8}
        >
          <Text style={[styles.signOutText, { color: c.red }]}>{t.signOut}</Text>
        </TouchableOpacity>

      </ScrollView>
    </ScreenWrapper>
  );
}

function InfoRow({ icon, label, value, ltr, c }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.iconDisc, { backgroundColor: c.primarySoft }]}>
        <Ionicons name={icon} size={18} color={c.accentGlyph} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: c.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: c.text }, ltr && styles.ltr]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 22, paddingBottom: 48 },

  heroBlock: { alignItems: 'center', marginTop: 32, marginBottom: 28 },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatarText: { fontSize: 34, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  roleBadge: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5 },
  roleBadgeText: { fontSize: 13, fontWeight: '700' },

  infoCard: {
    borderRadius: 16, borderWidth: 1, marginBottom: 32, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  iconDisc: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: '600' },
  infoValue: { fontSize: 15, fontWeight: '700', marginTop: 1 },
  ltr: { textAlign: 'left', writingDirection: 'ltr' },
  divider: { height: 1, marginHorizontal: 16 },

  signOutBtn: {
    borderRadius: 12, paddingVertical: 15, alignItems: 'center',
  },
  signOutText: { fontSize: 17, fontWeight: '700' },
});
