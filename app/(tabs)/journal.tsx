import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  KeyboardAvoidingView, Platform, Dimensions, ScrollView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const { height } = Dimensions.get('window');

export default function JournalScreen() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [savedStatus, setSavedStatus] = useState('');

  // Clé de stockage unique par jour : "journal_2023-11-25"
  const getStorageKey = (d: Date) => `journal_${d.toISOString().split('T')[0]}`;

  // 1. Charger l'entrée quand la date change
  useEffect(() => {
    loadEntry();
  }, [date]);

  const loadEntry = async () => {
    try {
      const savedText = await AsyncStorage.getItem(getStorageKey(date));
      setText(savedText || '');
    } catch (e) { console.error(e); }
  };

  // 2. Sauvegarder l'entrée (Appelé quand on tape ou quitte)
  const saveEntry = async (content: string) => {
    setText(content);
    try {
      await AsyncStorage.setItem(getStorageKey(date), content);
      setSavedStatus(t('journal.save_success'));
      setTimeout(() => setSavedStatus(''), 2000); // Efface le message après 2s
    } catch (e) { console.error(e); }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <LinearGradient colors={['#FDFBF7', '#FFFFFF']} style={styles.background}>
        
        {/* HEADER : Date et Navigation */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateSelector}>
            <Text style={styles.dateText}>
              {date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#636E72" />
          </TouchableOpacity>
          
          {savedStatus !== '' && (
            <Text style={styles.saveStatus}>{savedStatus}</Text>
          )}
        </View>

        {/* INPUT : Zone d'écriture Zen */}
        <TextInput
          style={styles.input}
          multiline
          placeholder={t('journal.placeholder')}
          placeholderTextColor="#B2BEC3"
          value={text}
          onChangeText={saveEntry}
          textAlignVertical="top"
        />

        {/* DATE PICKER (Android/iOS Modal) */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
            maximumDate={new Date()} // On ne peut pas écrire dans le futur
          />
        )}

      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, padding: 20, paddingTop: 60 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 15
  },
  dateSelector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 20, fontWeight: '700', color: '#2D3436', textTransform: 'capitalize' },
  saveStatus: { fontSize: 12, color: '#00B894', fontWeight: '600' },
  input: { 
    flex: 1, 
    fontSize: 18, 
    lineHeight: 28, 
    color: '#2D3436', 
    padding: 10,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' // Police type "Livre"
  }
});