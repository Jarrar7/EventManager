import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return unsubscribe;
  }, []);

  if (!offline) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="wifi-outline" size={18} color="#92400E" style={styles.icon} />
      <Text style={styles.text}>אין חיבור לאינטרנט — הנתונים עשויים להיות לא מעודכנים</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  icon: { marginEnd: 8 },
  text: { flex: 1, fontSize: 13, color: '#92400E', fontWeight: '600', textAlign: 'right' },
});
