import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function WorkerHome() {
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {profile?.name} 👋</Text>
      <Text style={styles.role}>Role: Worker</Text>
      <Text style={styles.note}>Your shifts and payments will appear here.</Text>
      <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8', padding: 28, justifyContent: 'center' },
  welcome: { fontSize: 26, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  role: { fontSize: 16, color: '#27ae60', fontWeight: '600', marginBottom: 12 },
  note: { fontSize: 15, color: '#888', marginBottom: 40 },
  signOutBtn: { backgroundColor: '#e74c3c', borderRadius: 12, padding: 16, alignItems: 'center' },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
