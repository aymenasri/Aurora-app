import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AnimatableTabIcon from '../../components/AnimatableTabIcon';

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
          title: t('dashboard.tab_title') || 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <AnimatableTabIcon focused={focused} name={focused ? "home" : "home-outline"} size={24} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: t('goals.tab_title', 'Objectif'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatableTabIcon focused={focused} name={focused ? "trophy" : "trophy-outline"} size={24} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: t('journal.tab_title'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatableTabIcon focused={focused} name={focused ? "book" : "book-outline"} size={24} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.title') || 'Paramètres',
          tabBarIcon: ({ color, focused }) => (
            <AnimatableTabIcon focused={focused} name={focused ? "settings" : "settings-outline"} size={24} color={color} />
          )
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}