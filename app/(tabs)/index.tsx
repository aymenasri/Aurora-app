import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import PageTransition from '../../components/PageTransition';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [todayEntry, setTodayEntry] = useState('');
  const [loading, setLoading] = useState(true);

  // useFocusEffect permet de recharger les données à chaque fois qu'on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      // 1. Charger le profil
      const jsonValue = await AsyncStorage.getItem('userProfile');
      if (jsonValue != null) setUser(JSON.parse(jsonValue));

      // 2. Charger le journal du jour
      const todayKey = `journal_${new Date().toISOString().split('T')[0]}`;
      const entryRaw = await AsyncStorage.getItem(todayKey);

      if (entryRaw) {
        try {
          const parsed = JSON.parse(entryRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Prend la dernière pensée
            setTodayEntry(parsed[parsed.length - 1].content);
          } else if (typeof parsed === 'string') {
            setTodayEntry(parsed);
          } else {
            setTodayEntry('');
          }
        } catch {
          // Fallback legacy (si c'est une string simple non-JSON)
          setTodayEntry(entryRaw);
        }
      } else {
        setTodayEntry('');
      }

    } catch (e) {
      console.error("Erreur de chargement", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenOnboarding');
      await AsyncStorage.removeItem('userProfile');
      // Optionnel : supprimer d'autres clés si nécessaire

      // Redirection vers l'onboarding
      router.replace('/(onboarding)');
    } catch (e) {
      console.error("Erreur lors de la déconnexion", e);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    return hour > 17 ? 'dashboard.greeting_evening' : 'dashboard.greeting';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A29BFE" />
      </View>
    );
  }

  return (
    <PageTransition style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* HEADER AVEC DÉGRADÉ DOUX */}
        <LinearGradient colors={['#E3F2FD', '#FFFFFF']} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.date}>{new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
              <Text style={styles.greeting}>
                {t(getGreeting(), { name: user?.name || 'Toi' })}
              </Text>
            </View>
            <TouchableOpacity style={styles.profileIcon} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={30} color="#6C5CE7" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* CARTE CITATION */}
          <View style={styles.quoteCard}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#A29BFE" style={{ marginBottom: 10 }} />
            <Text style={styles.quoteText}>"{t('dashboard.quote_text')}"</Text>
            <Text style={styles.quoteLabel}>{t('dashboard.daily_quote')}</Text>
          </View>
          {/* CARTE OBJECTIF PRINCIPAL */}
          <View style={styles.focusCard}>
            <LinearGradient
              colors={['#A29BFE', '#6C5CE7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.focusBackground}
            >
              <View style={styles.focusHeader}>
                <Ionicons name="flag" size={24} color="#FFF" />
                <Text style={styles.focusLabel}>{t('dashboard.focus_title')}</Text>
              </View>
              <Text style={styles.focusText}>
                {user?.goal || "Prendre du temps pour moi"}
              </Text>
            </LinearGradient>
          </View>
          {/* --- NOUVEAU WIDGET JOURNAL --- */}
          <View>
            <TouchableOpacity
              style={styles.journalWidget}
              onPress={() => router.push('/(tabs)/journal')}
            >
              <View style={styles.journalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.journalIconBg}>
                    <Ionicons name="book" size={20} color="#0984E3" />
                  </View>
                  <Text style={styles.journalTitle}>{t('journal.dashboard_widget_title')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#B2BEC3" />
              </View>
              <Text style={styles.journalContent} numberOfLines={2}>
                {todayEntry
                  ? t('journal.dashboard_preview', { text: todayEntry.substring(0, 50) })
                  : t('journal.dashboard_cta')
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingTop: 70, paddingBottom: 30, paddingHorizontal: 20,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 14, color: '#636E72', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#2D3436' },
  profileIcon: { opacity: 0.8 },

  content: { padding: 20 },

  // Styles Citation
  quoteCard: {
    backgroundColor: '#F8F9FA', borderRadius: 20, padding: 25, marginBottom: 25,
    borderLeftWidth: 4, borderLeftColor: '#A29BFE',
  },
  quoteText: { fontSize: 18, fontStyle: 'italic', color: '#2D3436', lineHeight: 26, marginBottom: 15 },
  quoteLabel: { fontSize: 12, color: '#A29BFE', fontWeight: 'bold', textTransform: 'uppercase' },

  // Styles Objectif
  focusCard: {
    marginBottom: 25, borderRadius: 24,
    shadowColor: '#6C5CE7', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  focusBackground: { padding: 30, borderRadius: 24 },
  focusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, opacity: 0.9 },
  focusLabel: { color: '#FFF', fontSize: 14, fontWeight: '700', marginLeft: 10, textTransform: 'uppercase' },
  focusText: { color: '#FFF', fontSize: 22, fontWeight: 'bold', lineHeight: 30 },

  // Styles Mood
  moodSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F0F3F5', padding: 20, borderRadius: 18, marginBottom: 20
  },
  moodTitle: { fontSize: 16, color: '#636E72', fontWeight: '600', maxWidth: '60%' },
  checkInButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12 },
  checkInText: { color: '#6C5CE7', fontWeight: 'bold', marginRight: 5 },

  // Styles Journal Widget
  journalWidget: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  journalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  journalIconBg: { backgroundColor: '#E3F2FD', padding: 8, borderRadius: 10, marginRight: 10 },
  journalTitle: { fontSize: 16, fontWeight: '700', color: '#2D3436' },
  journalContent: { fontSize: 15, color: '#636E72', lineHeight: 22, fontStyle: 'italic' },
});