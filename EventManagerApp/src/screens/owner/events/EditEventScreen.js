import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  I18nManager,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Toast, { useToast } from '../../../components/Toast';
import { t } from '../../../i18n/he';

const rtl = I18nManager.isRTL;

function formatDisplayDate(date) {
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function parseSupabaseDate(dateStr) {
  if (!dateStr) return new Date();
  return new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
}

function parseTimeString(timeStr) {
  const d = new Date();
  if (timeStr && /^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(20, 0, 0, 0);
  }
  return d;
}

function formatTimeDisplay(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function EditEventScreen({ route, navigation }) {
  const { event } = route.params;
  const queryClient = useQueryClient();

  const [title, setTitle]               = useState(event.title ?? '');
  const [selectedDate, setSelectedDate] = useState(parseSupabaseDate(event.date));
  const [showPicker, setShowPicker]     = useState(false);
  const [selectedTime, setSelectedTime] = useState(parseTimeString(event.time));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [venue, setVenue]               = useState(event.venue ?? '');
  const [notes, setNotes]               = useState(event.notes ?? '');
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const { showToast, toastMessage, toastOpacity } = useToast();

  function onDateChange(e, date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) setSelectedDate(date);
  }

  function onTimeChange(e, date) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (date) setSelectedTime(date);
  }

  async function handleSave() {
    setErrorMsg('');
    if (!title.trim()) { setErrorMsg(t.titleRequired); return; }

    setLoading(true);
    const { error } = await supabase
      .from('events')
      .update({
        title:  title.trim(),
        date:   selectedDate.toISOString(),
        time:   formatTimeDisplay(selectedTime),
        venue:  venue.trim() || null,
        notes:  notes.trim() || null,
      })
      .eq('id', event.id);
    setLoading(false);

    if (error) { setErrorMsg(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['event-detail', event.id] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    showToast('האירוע עודכן בהצלחה ✓');
    setTimeout(() => navigation.navigate('EventDetail', { eventId: event.id }), 800);
  }

  return (
    <ScreenWrapper>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{rtl ? `${t.back} →` : `← ${t.back}`}</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>{t.editEvent}</Text>

        {errorMsg !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        <Text style={styles.label}>{t.eventTitleLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.phEventTitle}
          placeholderTextColor="#9CA3AF"
          value={title}
          onChangeText={setTitle}
          textAlign={rtl ? 'right' : 'left'}
        />

        <Text style={styles.label}>{t.eventDateLabel}</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
          <Text style={styles.dateButtonText}>📅 {formatDisplayDate(selectedDate)}</Text>
        </TouchableOpacity>

        {showPicker && (
          <View style={Platform.OS === 'ios' ? styles.iosPickerWrapper : null}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onDateChange}
              locale="he-IL"
              style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.pickerDoneBtn} onPress={() => setShowPicker(false)}>
                <Text style={styles.pickerDoneText}>{t.confirmDate}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.label}>{t.timeLabel}</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)} activeOpacity={0.8}>
          <Text style={styles.dateButtonText}>🕐 {formatTimeDisplay(selectedTime)}</Text>
        </TouchableOpacity>

        {showTimePicker && (
          <View style={Platform.OS === 'ios' ? styles.iosPickerWrapper : null}>
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
              locale="he-IL"
              style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.pickerDoneBtn} onPress={() => setShowTimePicker(false)}>
                <Text style={styles.pickerDoneText}>{t.confirmDate}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.label}>{t.venueLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.phVenue}
          placeholderTextColor="#9CA3AF"
          value={venue}
          onChangeText={setVenue}
          textAlign={rtl ? 'right' : 'left'}
        />

        <Text style={styles.label}>{t.notesLabel}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t.phNotes}
          placeholderTextColor="#9CA3AF"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlign={rtl ? 'right' : 'left'}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{t.saveChanges}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>{t.cancel}</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
    <Toast message={toastMessage} opacity={toastOpacity} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  backBtn:  { marginBottom: 16 },
  backText: { fontSize: 16, color: '#5B6EF5', fontWeight: '600', textAlign: rtl ? 'right' : 'left' },

  pageTitle: {
    fontSize: 26, fontWeight: '700', color: '#1a1a2e',
    marginBottom: 20, textAlign: rtl ? 'right' : 'left',
  },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 14, marginBottom: 16 },
  errorText: { color: '#c0392b', fontSize: 14, fontWeight: '600', textAlign: rtl ? 'right' : 'left' },

  label: {
    fontSize: 14, fontWeight: '600', color: '#374151',
    marginBottom: 6, textAlign: rtl ? 'right' : 'left',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a2e',
    marginBottom: 18,
  },
  textArea: { height: 100 },

  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
    alignItems: rtl ? 'flex-end' : 'flex-start',
  },
  dateButtonText: { fontSize: 15, color: '#1a1a2e', fontWeight: '500' },

  iosPickerWrapper: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  iosPicker: { width: '100%' },
  pickerDoneBtn: {
    backgroundColor: '#5B6EF5', margin: 12, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  pickerDoneText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  button: {
    backgroundColor: '#5B6EF5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  cancelBtn: { alignItems: 'center', marginTop: 16, padding: 12 },
  cancelText: { fontSize: 16, color: '#9CA3AF' },
});
