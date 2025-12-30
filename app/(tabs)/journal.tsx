import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dimensions,
  Keyboard, KeyboardAvoidingView,
  Modal,
  Platform,
  SectionList,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import PageTransition from '../../components/PageTransition';

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

interface JournalEntry {
  id: string;
  content: string;
  createdAt: number;
}

export default function JournalScreen() {
  const { t, i18n } = useTranslation();
  const [sections, setSections] = useState<{ title: string; data: JournalEntry[] }[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  // Date Selection State
  const [targetDate, setTargetDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Edit State
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editContent, setEditContent] = useState('');

  // Met à jour les locales si nécessaire (pour formatage date)
  useEffect(() => {
    if (i18n.language) {
      LocaleConfig.defaultLocale = i18n.language;
    }
  }, [i18n.language]);

  const openEditModal = (entry: JournalEntry) => {
    // console.log("Opening edit modal for:", entry.id);
    setEditingEntry(entry);
    setEditContent(entry.content);
  };

  const saveEdit = async () => {
    // console.log("Saving edit...");
    if (!editingEntry) return;

    if (!editContent.trim()) {
      alert("Le texte ne peut pas être vide.");
      return;
    }

    const dateOfEntry = new Date(editingEntry.createdAt);
    const key = getStorageKey(dateOfEntry);

    try {
      const stored = await AsyncStorage.getItem(key);
      // alert("Debug: Found stored data");

      if (stored) {
        let currentEntries: JournalEntry[] = [];
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            currentEntries = parsed;
          } else {
            // Legacy Migration (Unique Stable ID)
            currentEntries = [{
              id: `legacy_${key}`,
              content: stored,
              createdAt: dateOfEntry.getTime()
            }];
          }
        } catch {
          // Not JSON (Legacy)
          currentEntries = [{
            id: `legacy_${key}`,
            content: stored,
            createdAt: dateOfEntry.getTime()
          }];
        }

        // IMPORTANT: If we are editing a legacy entry, ensuring IDs match
        const isLegacy = editingEntry.id.startsWith('legacy_') || !currentEntries.find(e => e.id === editingEntry.id);

        const updatedEntries = currentEntries.map(e => {
          if (e.id === editingEntry.id || (isLegacy && currentEntries.length === 1)) {
            return { ...e, content: editContent };
          }
          return e;
        });

        await AsyncStorage.setItem(key, JSON.stringify(updatedEntries));
        // alert("Debug: Saved successfully");

        await loadAllEntries();
        setEditingEntry(null);
        setEditContent('');
      } else {
        alert("Erreur: Entrée introuvable dans le stockage.");
      }
    } catch (e: any) {
      alert("Erreur sauvegarde: " + e.message);
      console.error(e);
    }
  };

  const deleteEntry = async (entryToDelete: JournalEntry) => {
    console.log("Delete requested for:", entryToDelete.id);
    const doDelete = async () => {
      const dateOfEntry = new Date(entryToDelete.createdAt);
      const key = getStorageKey(dateOfEntry);

      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          let currentEntries: JournalEntry[] = [];
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              currentEntries = parsed;
            } else {
              currentEntries = [{ id: `legacy_${key}`, content: stored, createdAt: dateOfEntry.getTime() }];
            }
          } catch {
            currentEntries = [{ id: `legacy_${key}`, content: stored, createdAt: dateOfEntry.getTime() }];
          }

          const isLegacy = entryToDelete.id.startsWith('legacy_') || !currentEntries.find(e => e.id === entryToDelete.id);

          const updated = currentEntries.filter(e => {
            if (isLegacy && currentEntries.length === 1) return false; // Delete the only legacy item
            return e.id !== entryToDelete.id;
          });

          if (updated.length === 0) {
            await AsyncStorage.removeItem(key);
          } else {
            await AsyncStorage.setItem(key, JSON.stringify(updated));
          }
          loadAllEntries();
        }
      } catch (e: any) { alert("Erreur suppression: " + e.message); }
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Supprimer cette pensée ?")) doDelete();
    } else {
      Alert.alert("Supprimer", "Supprimer cette pensée ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: doDelete }
      ]);
    }
  };

  const getStorageKey = (d: Date) => `journal_${d.toISOString().split('T')[0]}`;

  useFocusEffect(
    useCallback(() => {
      loadAllEntries();
    }, [])
  );

  const loadAllEntries = async () => {
    setLoading(true);
    try {
      // 1. Récupérer toutes les clés
      const keys = await AsyncStorage.getAllKeys();
      const journalKeys = keys.filter(k => k.startsWith('journal_')).sort().reverse(); // Plus récent en premier

      // 2. Récupérer toutes les valeurs
      const stores = await AsyncStorage.multiGet(journalKeys);

      const newSections: { title: string; data: JournalEntry[] }[] = [];

      stores.forEach(([key, value]) => {
        if (!value) return;

        // Extraire la date de la clé "journal_YYYY-MM-DD"
        const dateStr = key.replace('journal_', '');
        const dateObj = new Date(dateStr);
        // Formater le titre de la section (ex: "Lundi 30 Décembre")
        const sectionTitle = dateObj.toLocaleDateString(i18n.language, {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });

        let dayEntries: JournalEntry[] = [];
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            dayEntries = parsed;
          } else {
            // Migration legacy
            dayEntries = [{ id: `legacy_${key}`, content: value, createdAt: dateObj.getTime() }];
          }
        } catch {
          dayEntries = [{ id: `legacy_${key}`, content: value, createdAt: dateObj.getTime() }];
        }

        // Trier les entrées du jour (plus récentes en bas ou en haut ? Standard journal : chronologique dans la journée)
        // Ici on garde l'ordre d'ajout (chronologique)
        if (dayEntries.length > 0) {
          newSections.push({ title: sectionTitle, data: dayEntries.reverse() }); // On inverse pour avoir les plus récents en haut de la section aussi ? Ou on garde l'ordre ? 
          // Choix: Plus récent en haut partout pour "Timeline"
        }
      });

      setSections(newSections);

    } catch (e) {
      console.error("Erreur chargement journal:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveEntriesForDate = async (date: Date, newEntries: JournalEntry[]) => {
    try {
      await AsyncStorage.setItem(getStorageKey(date), JSON.stringify(newEntries));
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
    }
  };

  const addEntry = async () => {
    if (!inputText.trim()) return;

    // Use targetDate instead of always 'new Date()'
    const selectedDate = targetDate;
    const isToday = selectedDate.toDateString() === new Date().toDateString();

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      content: inputText,
      createdAt: selectedDate.getTime() // Use selected date time
    };

    // Obtenir les entrées existantes pour la date cible
    const key = getStorageKey(selectedDate);
    let currentEntries: JournalEntry[] = [];
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          currentEntries = parsed;
        } else {
          currentEntries = [{ id: `legacy_${key}`, content: stored, createdAt: selectedDate.getTime() }];
        }
      }
    } catch { }

    const updatedEntries = [...currentEntries, newEntry];

    // Sauvegarder
    await saveEntriesForDate(selectedDate, updatedEntries);

    // Recharger la liste
    await loadAllEntries();

    setInputText('');
    setTargetDate(new Date()); // Reset to today after adding
    Keyboard.dismiss();
  };



  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderEntryObj = ({ item }: { item: JournalEntry }) => (
    <View style={styles.entryCard}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => openEditModal(item)}
      >
        <Text style={styles.entryText}>{item.content}</Text>
        <Text style={styles.entryTime}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteEntry(item)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={18} color="#FF7675" />
      </TouchableOpacity>
    </View>
  );

  const isTargetToday = targetDate.toDateString() === new Date().toDateString();

  return (
    <PageTransition style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <LinearGradient colors={['#FDFBF7', '#FFFFFF']} style={styles.background}>

          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>{t('journal.tab_title')}</Text>
            <TouchableOpacity
              style={styles.headerCalendarButton}
              onPress={() => setShowCalendar(true)}
            >
              <Ionicons name={isTargetToday ? "calendar-outline" : "calendar"} size={28} color="#2D3436" />
            </TouchableOpacity>
          </View>

          {/* TIMELINE LIST */}
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderEntryObj}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={{ paddingBottom: 100 }}
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('journal.empty_state')}</Text>
              </View>
            }
          />


          {/* EDIT MODAL */}
          <Modal
            visible={!!editingEntry}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setEditingEntry(null)}
          >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
              <View style={styles.editModal}>
                <Text style={styles.editTitle}>{t('journal.edit_title', 'Modifier')}</Text>
                <TextInput
                  style={styles.editInput}
                  value={editContent}
                  onChangeText={setEditContent}
                  multiline
                  autoFocus
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity onPress={() => setEditingEntry(null)} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>{t('common.cancel', 'Annuler')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveEdit} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>{t('common.save', 'Sauvegarder')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          {/* CALENDAR MODAL */}
          <Modal
            visible={showCalendar}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCalendar(false)}
          >
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCalendar(false)}>
              <View style={styles.calendarModal}>
                <Calendar
                  onDayPress={(day: any) => {
                    setTargetDate(new Date(day.timestamp));
                    setShowCalendar(false);
                  }}
                  markedDates={{
                    [targetDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#6C5CE7' }
                  }}
                  theme={{
                    arrowColor: '#6C5CE7',
                    todayTextColor: '#6C5CE7',
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* INPUT AREA (Toujours visible pour ajouter "Aujourd'hui") */}
          <View style={styles.inputContainer}>
            {!isTargetToday && (
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeText}>
                  Pour : {targetDate.toLocaleDateString(i18n.language)}
                </Text>
                <TouchableOpacity onPress={() => setTargetDate(new Date())}>
                  <Ionicons name="close-circle" size={16} color="#FFF" style={{ marginLeft: 5 }} />
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={t('journal.placeholder')}
              placeholderTextColor="#B2BEC3"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              onPress={addEntry}
              style={[styles.addButton, { opacity: inputText.trim() ? 1 : 0.5 }]}
              disabled={!inputText.trim()}
            >
              <Ionicons name="arrow-up" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

        </LinearGradient>
      </KeyboardAvoidingView>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, paddingTop: 60 },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerCalendarButton: {
    padding: 5
  },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#2D3436' },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(253, 251, 247, 0.95)', // Semi-transparent matching background
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6C5CE7',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  entryCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  entryText: {
    flex: 1,
    fontSize: 16,
    color: '#2D3436',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif'
  },
  entryTime: {
    fontSize: 12,
    color: '#B2BEC3',
    marginTop: 4,
    fontWeight: '500'
  },
  deleteButton: {
    padding: 10,
    marginLeft: 10
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFF',
    margin: 20,
    padding: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative' // For date badge positioning
  },
  calendarButton: {
    padding: 10,
    marginRight: 5
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 16,
    color: '#2D3436',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif'
  },
  addButton: {
    backgroundColor: '#6C5CE7',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10
  },
  dateBadge: {
    position: 'absolute',
    top: -30,
    left: 10,
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  dateBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
    opacity: 0.5
  },
  emptyText: {
    fontSize: 16,
    color: '#636E72',
    fontStyle: 'italic'
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  calendarModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 10,
    width: Dimensions.get('window').width - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10
  },

  // Edit Modal Styles
  editModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: Dimensions.get('window').width - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10
  },
  editTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#2D3436' },
  editInput: {
    fontSize: 16,
    color: '#2D3436',
    minHeight: 100,
    maxHeight: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    textAlignVertical: 'top'
  },
  editButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { padding: 10 },
  cancelButtonText: { color: '#B2BEC3', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#6C5CE7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold' },
});