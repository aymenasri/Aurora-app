import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#6C5CE7',
      tabBarInactiveTintColor: '#B2BEC3',
      tabBarStyle: { 
        borderTopWidth: 0, 
        elevation: 0, 
        shadowOpacity: 0,
        height: 60,
        paddingBottom: 10
      },
      headerShown: false,
      tabBarLabelStyle: { fontWeight: '600' }
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="journal" 
        options={{ 
          title: t('journal.tab_title'), // Utilise la traduction
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={24} color={color} />
          )
        }} 
      />
    </Tabs>
  );
}