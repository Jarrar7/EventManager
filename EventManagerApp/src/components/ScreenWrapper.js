import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function ScreenWrapper({ children, style }) {
  const { c } = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: c.background }, style]} edges={['top']}>
      {children}
    </SafeAreaView>
  );
}
