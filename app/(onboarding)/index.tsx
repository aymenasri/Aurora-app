import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  Dimensions, KeyboardAvoidingView, TouchableWithoutFeedback, 
  Keyboard, Platform, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

// 1. On importe le Hook
import { useTranslation } from 'react-i18next';

const TOTAL_STEPS = 5; 

export default function OnboardingScreen() {
  // 2. On initialise le Hook
  const { t } = useTranslation();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const [form, setForm] = useState({
    name: '',
    mood: '',
    goal: '',
    category: '',
    reminderTime: ''
  });

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      await AsyncStorage.setItem('userProfile', JSON.stringify(form));
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
                  onChangeText={(txt) => setForm({...form, name: txt})}
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
                      setForm({...form, mood: item.val});
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
                <TextInput
                  style={styles.inputArea}
                  placeholder={t('onboarding.step3_placeholder')}
                  placeholderTextColor="#B2BEC3"
                  value={form.goal}
                  onChangeText={(txt) => setForm({...form, goal: txt})}
                  multiline
                />
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
                      setForm({...form, category: c.val});
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
                    style={[styles.optionCard, form.reminderTime === tOption.val && styles.selectedCard]}
                    onPress={() => {
                      setForm({...form, reminderTime: tOption.val});
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={[styles.optionText, form.reminderTime === tOption.val && styles.selectedText]}>
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
  nextButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' }
});