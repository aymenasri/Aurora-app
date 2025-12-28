import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Keyboard, KeyboardAvoidingView, Platform,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity, TouchableWithoutFeedback,
  View
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configuration des locales pour react-native-calendars
LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui"
};
LocaleConfig.locales['en'] = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  monthNamesShort: ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'],
  today: "Today"
};
LocaleConfig.locales['ar'] = {
  monthNames: [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ],
  monthNamesShort: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  dayNames: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  dayNamesShort: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  today: "اليوم"
};
// Définir la locale par défaut au chargement (sera écrasée par i18n)
LocaleConfig.defaultLocale = 'fr';

const { height } = Dimensions.get('window');

export default function JournalScreen() {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [savedStatus, setSavedStatus] = useState('');

  // Met à jour la locale du calendrier quand la langue de l'app change
  useEffect(() => {
    // Mapping basic : les clés i18n sont 'en', 'fr', 'ar'. 
    // react-native-calendars attend les mêmes clés que celles définies dans LocaleConfig.locales
    if (i18n.language) {
      LocaleConfig.defaultLocale = i18n.language;
    }
  }, [i18n.language]);

  // ... (reste du code)

  // Clé de stockage unique par jour : "journal_2023-11-25"
  const getStorageKey = (d: Date) => `journal_${d.toISOString().split('T')[0]}`;
  const getFormattedDate = (d: Date) => d.toISOString().split('T')[0];

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

  const onDayPress = (day: any) => {
    const newDate = new Date(day.timestamp);
    // Ajustement pour timezone si nécessaire, mais timestamp est UTC minuit
    // Astuce simple : On crée une date locale à partir des composants YMD
    const selectedDate = new Date(day.year, day.month - 1, day.day);
    setDate(selectedDate);
    setShowCalendar(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <LinearGradient colors={['#FDFBF7', '#FFFFFF']} style={styles.background}>

            {/* HEADER : Date et Navigation */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setShowCalendar(!showCalendar)} style={styles.dateSelector}>
                <Text style={styles.dateText}>
                  {date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                <Ionicons name={showCalendar ? "chevron-up" : "chevron-down"} size={20} color="#636E72" />
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {savedStatus !== '' && (
                  <Text style={styles.saveStatus}>{savedStatus}</Text>
                )}
                {/* BOUTON SAUVEGARDE */}
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); saveEntry(text); }}>
                  <Ionicons name="checkmark-circle" size={28} color="#6C5CE7" />
                </TouchableOpacity>
              </View>
            </View>

            {/* CALENDAR (Expandable) */}
            {showCalendar && (
              <View style={styles.calendarContainer}>
                <Calendar
                  key={i18n.language} // Force le re-render quand la langue change
                  current={getFormattedDate(date)}
                  onDayPress={onDayPress}
                  markedDates={{
                    [getFormattedDate(date)]: { selected: true, selectedColor: '#A29BFE' }
                  }}
                  theme={{
                    todayTextColor: '#6C5CE7',
                    arrowColor: '#6C5CE7',
                    selectedDayBackgroundColor: '#A29BFE',
                    selectedDayTextColor: '#ffffff',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '600'
                  }}
                />
              </View>
            )}

            {/* INPUT : Zone d'écriture Zen */}
            <TextInput
              style={styles.input}
              multiline
              placeholder={t('journal.placeholder')}
              placeholderTextColor="#B2BEC3"
              value={text}
              onChangeText={saveEntry}
              textAlignVertical="top"
              secureTextEntry={false}
            />

          </LinearGradient>
        </View>
      </TouchableWithoutFeedback>
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
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  }
});