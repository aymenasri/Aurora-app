import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../i18n'; // Ton import de traduction

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const router = useRouter();

  // 1. Vérifier si l'utilisateur est déjà venu
  useEffect(() => {
    async function checkOnboarding() {
      try {
        const value = await AsyncStorage.getItem('hasSeenOnboarding');
        if (value === 'true') {
          setHasSeenOnboarding(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    checkOnboarding();
  }, []);

  // 2. Rediriger une fois le chargement fini
  useEffect(() => {
    if (!isLoading) {
      if (hasSeenOnboarding) {
        // Si déjà venu -> Go Dashboard
        router.replace('/(tabs)');
      } else {
        // Si nouveau -> Go Onboarding
        router.replace('/(onboarding)');
      }
    }
  }, [isLoading, hasSeenOnboarding]);

  // Écran de chargement (Splash screen maison)
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#A29BFE" />
      </View>
    );
  }

  // 3. Définition des écrans
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* C'est ici que tu avais l'erreur : il faut préciser "/index" */}
        <Stack.Screen name="(onboarding)/index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}