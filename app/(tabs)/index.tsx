import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import PageTransition from '../../components/PageTransition';
import { QUOTES } from '../../constants/quotes';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [todayEntry, setTodayEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const [smartGoal, setSmartGoalState] = useState<any>(null);
  const [goalStats, setGoalStats] = useState<any>({ percentage: 0, daysRemaining: 0, currentCheckins: 0 });
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

      // 2. Charger et Mettre à jour le Smart Goal
      const { registerDailyCheckin, calculateGoalProgress, getPrincipalGoal } = require('../../utils/goals');

      // Enregistrer le checkin quotidien (pour tous les objectifs actifs)
      await registerDailyCheckin();

      // Récupérer l'objectif principal pour l'affichage
      const currentGoal = await getPrincipalGoal();

      if (currentGoal) {
        setSmartGoalState(currentGoal);
        setGoalStats(calculateGoalProgress(currentGoal));
      }

      // 3. Charger le journal du jour
      const todayKey = `journal_${new Date().toISOString().split('T')[0]}`;
      const entryRaw = await AsyncStorage.getItem(todayKey);

      if (entryRaw) {
        try {
          // ... (rest of logic same)
          const parsed = JSON.parse(entryRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTodayEntry(parsed[parsed.length - 1].content);
          } else if (typeof parsed === 'string') {
            setTodayEntry(parsed);
          } else {
            setTodayEntry('');
          }
        } catch {
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

  const currentQuote = QUOTES[quoteIndex];
  const quoteText = i18n.language.startsWith('en') ? currentQuote.en : (i18n.language === 'ar' ? currentQuote.ar : currentQuote.fr);

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
          {/* CARTE CITATION ANIMÉE */}
          <View style={styles.quoteCard}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#A29BFE" style={{ marginBottom: 10 }} />
            <Animated.View
              key={quoteIndex}
              entering={FadeIn.duration(800)}
              exiting={FadeOut.duration(800)}
            >
              <Text style={styles.quoteText}>"{quoteText}"</Text>
              <Text style={styles.quoteLabel}>- {currentQuote.author}</Text>
            </Animated.View>
          </View>
          {/* WIDGET SMART GOAL */}
          {smartGoal && (
            <TouchableOpacity
              style={styles.goalCard}
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/goals')}
            >
              <LinearGradient
                colors={['#6C5CE7', '#a29bfe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.goalBackground}
              >
                <View style={styles.goalHeader}>
                  <View>
                    <Text style={styles.goalLabel}>{t('dashboard.goal_title', 'Mon Objectif Principal')}</Text>
                    <Text style={styles.goalTitle}>{smartGoal.title}</Text>
                  </View>
                  <View style={styles.goalBadge}>
                    <Ionicons name="calendar-outline" size={14} color="#6C5CE7" />
                    <Text style={styles.goalBadgeText}>
                      {goalStats.daysRemaining} {t('goals.days_remaining_suffix', 'j restants')}
                    </Text>
                  </View>
                </View>

                <View style={styles.goalProgressContainer}>
                  <View style={styles.goalProgressBar}>
                    <View style={[styles.goalProgressFill, { width: `${goalStats.percentage}%` }]} />
                  </View>
                  <Text style={styles.goalProgressText}>{goalStats.percentage}%</Text>
                </View>

                <View style={styles.goalStatsRow}>
                  <Text style={styles.goalStatDetail}>
                    <Ionicons name="checkmark-circle" size={14} color="#FFF" /> {goalStats.currentCheckins} {t('goals.days_validated_suffix')}
                  </Text>
                  <Text style={styles.goalStatDetail}>
                    {t('goals.target_prefix')} {smartGoal.frequency}{t('goals.days_per_week_suffix')}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}


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

  // Styles Smart Goal
  goalCard: {
    borderRadius: 24, marginBottom: 25,
    shadowColor: '#6C5CE7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8,
  },
  goalBackground: { padding: 25, borderRadius: 24 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  goalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5 },
  goalTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', maxWidth: 200 },
  goalBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  goalBadgeText: { color: '#6C5CE7', fontWeight: '700', fontSize: 12, marginLeft: 5 },
  goalProgressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  goalProgressBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginRight: 15 },
  goalProgressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 4 },
  goalProgressText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  goalStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalStatDetail: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
});