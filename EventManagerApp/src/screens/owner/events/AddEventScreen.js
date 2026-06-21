import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  I18nManager,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { cardShadow } from '../../../theme/shadows';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Toast, { useToast } from '../../../components/Toast';
import { t } from '../../../i18n/he';

const rtl = I18nManager.isRTL;

function formatDisplayDate(date) {
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTimeDisplay(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function defaultTimeDate() {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  return d;
}

export default function AddEventScreen({ navigation }) {
  const { profile } = useAuth();
  const { c, theme } = useTheme();
  const shadow = theme === 'light' ? cardShadow : {};
  const queryClient = useQueryClient();

  const [title, setTitle]               = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(defaultTimeDate());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [venue, setVenue]               = useState('');
  const [notes, setNotes]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [fieldErrors, setFieldErrors]   = useState({});
  const { showToast, toastMessage, toastOpacity } = useToast();

  function onDateChange(event, date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setSelectedDate(date);
  }

  function onTimeChange(event, date) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (date) setSelectedTime(date);
  }

  async function handleCreate() {
    setErrorMsg('');
    const errors = {};
    if (!title.trim()) errors.title = 'שדה חובה';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      date: selectedDate.toISOString(),
      time: formatTimeDisplay(selectedTime),
      venue: venue.trim() || null,
      notes: notes.trim() || null,
      status: 'upcoming',
      created_by: profile?.id,
    });
    setLoading(false);

    if (error) { setErrorMsg(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    showToast('האירוע נוצר בהצלחה ✓');
    setTimeout(() => navigation.navigate('EventsList'), 800);
  }

  const inputBase = {
    backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 15, fontWeight: '700', color: c.text, textAlign: 'right',
    ...(theme === 'light' ? cardShadow : {}),
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Top row: back + title */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('EventsList')}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={rtl ? 'arrow-forward-outline' : 'arrow-back-outline'}
                size={24}
                color={c.primary}
              />
            </TouchableOpacity>
            <Text style={[styles.title, { color: c.text }]}>{t.newEvent}</Text>
            <View style={styles.backBtn} />
          </View>

          {errorMsg !== '' && (
            <View style={[styles.errorBox, { backgroundColor: c.redSoft }]}>
              <Text style={[styles.errorText, { color: c.red }]}>⚠️ {errorMsg}</Text>
            </View>
          )}

          {/* Title field */}
          <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{t.eventTitleLabel}</Text>
          <TextInput
            style={[inputBase, fieldErrors.title && { borderColor: c.red }, { marginBottom: 13 }]}
            placeholder={t.phEventTitle}
            placeholderTextColor={c.textMuted}
            value={title}
            onChangeText={v => { setTitle(v); setFieldErrors(p => ({ ...p, title: undefined })); }}
            textAlign={rtl ? 'right' : 'left'}
          />
          {fieldErrors.title && <Text style={[styles.fieldError, { color: c.red }]}>{fieldErrors.title}</Text>}

          {/* Date + Time row */}
          <View style={styles.dateTimeRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{t.eventDateLabel}</Text>
              <TouchableOpacity
                style={[inputBase, styles.pickerBtn, { marginBottom: 0 }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pickerBtnText, { color: c.text }]} numberOfLines={1}>
                  {formatDisplayDate(selectedDate)}
                </Text>
                <Ionicons name="calendar-outline" size={16} color={c.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{t.timeLabel}</Text>
              <TouchableOpacity
                style={[inputBase, styles.pickerBtn, { marginBottom: 0 }]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pickerBtnText, { color: c.text }]}>
                  {formatTimeDisplay(selectedTime)}
                </Text>
                <Ionicons name="time-outline" size={16} color={c.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <View style={[styles.iosPickerWrapper, { backgroundColor: c.card }]}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onDateChange}
                locale="he-IL"
                style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.pickerDoneBtn, { backgroundColor: c.primary }]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={[styles.pickerDoneText, { color: c.onPrimary }]}>{t.confirmDate}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {showTimePicker && (
            <View style={[styles.iosPickerWrapper, { backgroundColor: c.card }]}>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
                locale="he-IL"
                style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.pickerDoneBtn, { backgroundColor: c.primary }]}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={[styles.pickerDoneText, { color: c.onPrimary }]}>{t.confirmDate}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Venue */}
          <Text style={[styles.fieldLabel, { color: c.textMuted, marginTop: 13 }]}>{t.venueLabel}</Text>
          <TextInput
            style={[inputBase, { marginBottom: 13 }]}
            placeholder={t.phVenue}
            placeholderTextColor={c.textMuted}
            value={venue}
            onChangeText={setVenue}
            textAlign={rtl ? 'right' : 'left'}
          />

          {/* Notes */}
          <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{t.notesLabel}</Text>
          <TextInput
            style={[inputBase, { minHeight: 94, textAlignVertical: 'top', marginBottom: 24 }]}
            placeholder={t.phNotes}
            placeholderTextColor={c.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlign={rtl ? 'right' : 'left'}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: c.primary, opacity: loading ? 0.6 : 1 }]}
            onPress={handleCreate}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={c.onPrimary} />
              : <Text style={[styles.primaryBtnText, { color: c.onPrimary }]}>{t.createEvent}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.navigate('EventsList')}>
            <Text style={[styles.cancelText, { color: c.textMuted }]}>{t.cancel}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast message={toastMessage} opacity={toastOpacity} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 48 },

  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', flex: 1 },

  errorBox: { borderRadius: 10, padding: 14, marginBottom: 16 },
  errorText: { fontSize: 14, fontWeight: '600', textAlign: rtl ? 'right' : 'left' },

  fieldLabel: {
    fontSize: 13, fontWeight: '700', marginBottom: 6,
    textAlign: rtl ? 'right' : 'left',
  },
  fieldError: {
    fontSize: 12, fontWeight: '600', marginTop: -8, marginBottom: 10,
    textAlign: rtl ? 'right' : 'left',
  },

  dateTimeRow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerBtnText: { fontSize: 14, fontWeight: '700', flex: 1, marginEnd: 4 },

  iosPickerWrapper: {
    borderRadius: 16, marginTop: 8, marginBottom: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  iosPicker: { width: '100%' },
  pickerDoneBtn: { margin: 12, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  pickerDoneText: { fontWeight: '700', fontSize: 16 },

  primaryBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', marginTop: 14, padding: 10 },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
