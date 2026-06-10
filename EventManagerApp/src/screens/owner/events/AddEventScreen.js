import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  I18nManager,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
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
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(defaultTimeDate());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
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
    showToast('האירוע נוצר בהצלחה ✓');
    setTimeout(() => navigation.navigate('EventsList'), 800);
  }

  return (
    <ScreenWrapper>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

        {/* Top row: back button + title */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.navigate('EventsList')} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons
              name={rtl ? 'arrow-forward-outline' : 'arrow-back-outline'}
              size={24}
              color="#5B6EF5"
            />
          </TouchableOpacity>
          <Text style={styles.title}>{t.newEvent}</Text>
          <View style={styles.backBtn} />
        </View>

        {errorMsg !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        <Text style={styles.label}>{t.eventTitleLabel}</Text>
        <TextInput
          style={[styles.input, fieldErrors.title && styles.inputError]}
          placeholder={t.phEventTitle}
          placeholderTextColor="#9CA3AF"
          value={title}
          onChangeText={v => { setTitle(v); setFieldErrors(p => ({ ...p, title: undefined })); }}
          textAlign={rtl ? 'right' : 'left'}
        />
        {fieldErrors.title && <Text style={styles.fieldError}>{fieldErrors.title}</Text>}

        <Text style={styles.label}>{t.eventDateLabel}</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
          <Text style={styles.dateButtonText}>📅 {formatDisplayDate(selectedDate)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
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
              <TouchableOpacity style={styles.pickerDoneBtn} onPress={() => setShowDatePicker(false)}>
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
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{t.createEvent}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.navigate('EventsList')}>
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

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 22, fontWeight: '700', color: '#1a1a2e',
    textAlign: 'center', flex: 1,
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
    marginBottom: 4,
  },
  inputError: { borderColor: '#e74c3c' },
  fieldError: {
    color: '#e74c3c', fontSize: 12, fontWeight: '600',
    marginBottom: 14, textAlign: rtl ? 'right' : 'left',
  },
  textArea: { height: 100, marginBottom: 18 },
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
