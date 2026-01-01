import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

// 1. On importe le Hook
import { useTranslation } from 'react-i18next';
import { setSmartGoal } from '../../utils/goals';
import { requestNotificationPermissions, scheduleDailyReminder } from '../../utils/notifications';

const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  // 2. On initialise le Hook
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    mood: '',
    goal: '',
    category: '',
    reminderTime: '',
    deadline: new Date(new Date().setDate(new Date().getDate() + 30)), // Default +30 days
    frequency: 5
  });

  // ... (inside component)

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      await AsyncStorage.setItem('userProfile', JSON.stringify({
        name: form.name,
        mood: form.mood,
        goal: form.goal, // We keep simple goal for legacy consistency if needed
        category: form.category,
        reminderTime: form.reminderTime
      }));

      // Save Smart Goal
      if (form.goal) {
        await setSmartGoal({
          title: form.goal,
          deadline: form.deadline.toISOString().split('T')[0],
          frequency: form.frequency,
          startDate: new Date().toISOString().split('T')[0],
          checkins: [new Date().toISOString().split('T')[0]] // Auto check-in first day
        });
      }

      // Demander la permission et programmer la notification
      const granted = await requestNotificationPermissions();
      if (granted && form.reminderTime) {
        await scheduleDailyReminder(form.reminderTime);
      }

      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
    }
  };

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      setLoading(true);
      setTimeout(() => {
        finishOnboarding();
      }, 2500);
    }
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) setStep(step - 1);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A29BFE" />
        {/* Utilisation de t() avec une variable dynamique (le prénom) */}
        <Text style={styles.loadingText}>
          {t('onboarding.loading_title', { name: form.name })}
        </Text>
        <Text style={styles.subLoadingText}>
          {t('onboarding.loading_subtitle')}
        </Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          {step > 1 ? (
            <TouchableOpacity onPress={prevStep} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#2D3436" />
            </TouchableOpacity>
          ) : <View style={{ width: 40 }} />}

          <View style={styles.progressBase}>
            <Animated.View
              style={[styles.progressBar, { width: `${(step / TOTAL_STEPS) * 100}%` }]}
            />
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Animated.View
            key={step}
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(300)}
            style={{ width: '100%' }}
          >

            {/* STEP 1: NAME */}
            {step === 1 && (
              <View>
                <Text style={styles.title}>{t('onboarding.step1_title')}</Text>
                <Text style={styles.subtitle}>{t('onboarding.step1_subtitle')}</Text>
                <TextInput
                  style={styles.inputSingle}
                  placeholder={t('onboarding.step1_placeholder')}
                  placeholderTextColor="#B2BEC3"
                  value={form.name}
                  onChangeText={(txt) => setForm({ ...form, name: txt })}
                  autoFocus
                />
              </View>
            )}

            {/* STEP 2: MOOD */}
            {step === 2 && (
              <View>
                <Text style={styles.title}>
                  {t('onboarding.step2_title', { name: form.name })}
                </Text>
                {[
                  { key: 'demotivated', val: t('onboarding.mood_demotivated') },
                  { key: 'anxious', val: t('onboarding.mood_anxious') },
                  { key: 'tired', val: t('onboarding.mood_tired') },
                  { key: 'ready', val: t('onboarding.mood_ready') }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.optionCard, form.mood === item.val && styles.selectedCard]}
                    onPress={() => {
                      setForm({ ...form, mood: item.val });
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={[styles.optionText, form.mood === item.val && styles.selectedText]}>
                      {item.val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* STEP 3: GOAL */}
            {step === 3 && (
              <View>
                <Text style={styles.title}>{t('onboarding.step3_title')}</Text>

                <Text style={styles.label}>{t('onboarding.goal_label', "Mon objectif")}</Text>
                <TextInput
                  style={styles.inputArea}
                  placeholder={t('onboarding.step3_placeholder')}
                  placeholderTextColor="#B2BEC3"
                  value={form.goal}
                  onChangeText={(txt) => setForm({ ...form, goal: txt })}
                  multiline
                />

                <Text style={[styles.label, { marginTop: 20 }]}>{t('onboarding.deadline_label', "Je veux l'atteindre pour le...")}</Text>
                {Platform.OS === 'ios' ? (
                  <DateTimePicker
                    value={form.deadline}
                    mode="date"
                    display="default"
                    onChange={(event, date) => date && setForm({ ...form, deadline: date })}
                    minimumDate={new Date()}
                    accentColor="#6C5CE7"
                    style={{ alignSelf: 'flex-start', marginTop: 10 }}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={styles.dateButton}
                  >
                    <Text style={styles.dateButtonText}>
                      {form.deadline.toLocaleDateString()}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#6C5CE7" />
                  </TouchableOpacity>
                )}
                {showDatePicker && Platform.OS !== 'ios' && (
                  <DateTimePicker
                    value={form.deadline}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setForm({ ...form, deadline: date });
                    }}
                    minimumDate={new Date()}
                  />
                )}

                <Text style={[styles.label, { marginTop: 20 }]}>
                  {t('onboarding.frequency_label', "Je m'engage : {{days}} jours / semaine", { days: form.frequency })}
                </Text>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={1}
                    maximumValue={7}
                    step={1}
                    value={form.frequency}
                    onValueChange={(val) => setForm({ ...form, frequency: val })}
                    minimumTrackTintColor="#6C5CE7"
                    maximumTrackTintColor="#dfe6e9"
                    thumbTintColor="#6C5CE7"
                  />
                  <View style={styles.frequencyLabels}>
                    <Text style={styles.freqLabel}>1j</Text>
                    <Text style={styles.freqLabel}>7j</Text>
                  </View>
                </View>

              </View>
            )}

            {/* STEP 4: CATEGORY */}
            {step === 4 && (
              <View>
                <Text style={styles.title}>{t('onboarding.step4_title')}</Text>
                {[
                  { key: 'mental', val: t('onboarding.cat_mental') },
                  { key: 'productivity', val: t('onboarding.cat_productivity') },
                  { key: 'physical', val: t('onboarding.cat_physical') },
                  { key: 'career', val: t('onboarding.cat_career') }
                ].map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.optionCard, form.category === c.val && styles.selectedCard]}
                    onPress={() => {
                      setForm({ ...form, category: c.val });
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={[styles.optionText, form.category === c.val && styles.selectedText]}>
                      {c.val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* STEP 5: REMINDER */}
            {step === 5 && (
              <View>
                <Text style={styles.title}>{t('onboarding.step5_title')}</Text>
                <Text style={styles.subtitle}>{t('onboarding.step5_subtitle')}</Text>
                {[
                  { val: t('onboarding.time_morning'), id: 'morning' },
                  { val: t('onboarding.time_noon'), id: 'noon' },
                  { val: t('onboarding.time_evening'), id: 'evening' }
                ].map((tOption) => (
                  <TouchableOpacity
                    key={tOption.id}
                    style={[styles.optionCard, form.reminderTime === tOption.id && styles.selectedCard]}
                    onPress={() => {
                      setForm({ ...form, reminderTime: tOption.id });
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={[styles.optionText, form.reminderTime === tOption.id && styles.selectedText]}>
                      {tOption.val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

          </Animated.View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              (step === 1 && !form.name) ||
                (step === 2 && !form.mood) ||
                (step === 3 && !form.goal) ||
                (step === 4 && !form.category) ||
                (step === 5 && !form.reminderTime)
                ? styles.disabledButton
                : null
            ]}
            onPress={nextStep}
            disabled={/* ...same logic... */ (step === 1 && !form.name) || (step === 2 && !form.mood) || (step === 3 && !form.goal) || (step === 4 && !form.category) || (step === 5 && !form.reminderTime)}
          >
            <Text style={styles.nextButtonText}>
              {step === TOTAL_STEPS ? t('onboarding.btn_finish') : t('onboarding.btn_continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

// Les styles restent identiques à la version précédente !
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 20, fontSize: 18, fontWeight: '600', color: '#2D3436' },
  subLoadingText: { marginTop: 8, fontSize: 14, color: '#B2BEC3' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20 },
  backButton: { padding: 8 },
  progressBase: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginHorizontal: 10 },
  progressBar: { height: 6, backgroundColor: '#A29BFE', borderRadius: 3 },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#2D3436', marginBottom: 10, lineHeight: 34 },
  subtitle: { fontSize: 16, color: '#B2BEC3', marginBottom: 30 },
  inputSingle: { backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20, fontSize: 18, borderWidth: 1.5, borderColor: '#F1F2F6', color: '#2D3436' },
  inputArea: { backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20, fontSize: 18, minHeight: 120, textAlignVertical: 'top', borderWidth: 1.5, borderColor: '#F1F2F6', color: '#2D3436' },
  optionCard: { padding: 20, borderRadius: 16, backgroundColor: '#F8F9FA', marginBottom: 12, borderWidth: 1.5, borderColor: '#F1F2F6' },
  selectedCard: { borderColor: '#A29BFE', backgroundColor: '#F4F3FF' },
  optionText: { fontSize: 16, fontWeight: '600', color: '#636E72' },
  selectedText: { color: '#6C5CE7' },
  footer: { padding: 30, paddingBottom: Platform.OS === 'ios' ? 40 : 30 },
  nextButton: { backgroundColor: '#A29BFE', padding: 20, borderRadius: 18, alignItems: 'center', shadowColor: '#A29BFE', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  disabledButton: { backgroundColor: '#E0E0E0', shadowOpacity: 0, elevation: 0 },
  nextButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  // New Styles
  label: { fontSize: 16, fontWeight: '600', color: '#636E72', marginBottom: 10 },
  dateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#F1F2F6', marginTop: 5 },
  dateButtonText: { fontSize: 16, color: '#2D3436' },
  sliderContainer: { marginTop: 10, backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12 },
  frequencyLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 5 },
  freqLabel: { fontSize: 12, color: '#B2BEC3' }
});