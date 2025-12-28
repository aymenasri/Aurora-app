# Architecture et Changements

Ce document résume l'architecture de l'application Aurora et les changements récents effectués.

## Architecture de l'Application

L'application est construite avec **React Native** et **Expo**, en utilisant **Expo Router** pour la navigation.

### Structure des Dossiers

- **`app/`**: Contient les écrans et la logique de navigation (Structure basée sur les fichiers).
  - **`_layout.tsx`**: Le point d'entrée principal. Il gère :
    - La persistance de l'état "Onboarding vu" (`AsyncStorage`).
    - La redirection conditionnelle vers `(onboarding)` ou `(tabs)` (Dashboard).
  - **`(onboarding)/`**: Dossier contenant les écrans d'onboarding.
  - **`(tabs)/`**: Dossier contenant les écrans principaux de l'application (Dashboard, Journal, Explore) accessibles via une barre d'onglets.
    - **`index.tsx`**: Le Dashboard principal.

### Gestion des Données

- **AsyncStorage**: Utilisé pour stocker les données localement sur le téléphone.
  - `hasSeenOnboarding`: Booléen ('true'/'false') pour savoir si l'utilisateur a fini l'intro.
  - `userProfile`: Stocke le nom, l'humeur, etc.
  - `journal_YYYY-MM-DD`: Stocke les entrées de journal par date.

### Gestion du Journal

- **Librairie de Calendrier**: `react-native-calendars` est utilisé pour la sélection de la date.
- **Stockage**: Chaque jour est une clé unique dans AsyncStorage.

---

## Changements Récents

### Intégration du Calendrier Journal

**Date**: 28/12/2025
**Fichiers Modifiés**: `app/(tabs)/journal.tsx`, `package.json`

**Description**:
Remplacement du sélecteur de date natif par un calendrier visuel interactif.

**Fonctionnement**:
- Utilisation de `<Calendar />` de `react-native-calendars`.
- Configuration locale en Français.
- Le calendrier s'ouvre/se ferme en appuyant sur la date en haut.

```typescript
// Exemple de configuration et rendu du calendrier
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier', ...],
  today: "Aujourd'hui"
};

// ...
{showCalendar && (
  <View style={styles.calendarContainer}>
    <Calendar
      current={getFormattedDate(date)}
      onDayPress={onDayPress}
      markedDates={{
        [getFormattedDate(date)]: { selected: true, selectedColor: '#A29BFE' }
      }}
      // ...
    />
  </View>
)}
```

### Correction Clavier Journal

**Date**: 28/12/2025
**Fichiers Modifiés**: `app/(tabs)/journal.tsx`

**Description**:
Ajout d'une fonctionnalité pour masquer le clavier en touchant n'importe où en dehors de la zone de texte.

**Fonctionnement**:
- Enveloppement de l'interface dans `TouchableWithoutFeedback`.
- Appel de `Keyboard.dismiss()` lors de l'événement `onPress`.

```typescript
<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  <View style={{ flex: 1 }}>
     {/* Contenu Gradient et Input */}
  </View>
</TouchableWithoutFeedback>
```

</TouchableWithoutFeedback>
```

### Ajout du Bouton de Sauvegarde

**Date**: 28/12/2025
**Fichiers Modifiés**: `app/(tabs)/journal.tsx`

**Description**:
Ajout d'une icône de validation ("checkmark-circle") dans l'en-tête pour déclencher une sauvegarde manuelle et fermer le clavier.

**Fonctionnement**:
- Bouton tactile avec icône.
- Sur le clic : Ferme le clavier et appelle `saveEntry`.

```typescript
<TouchableOpacity onPress={() => { Keyboard.dismiss(); saveEntry(text); }}>
  <Ionicons name="checkmark-circle" size={28} color="#6C5CE7" />
</TouchableOpacity>
```

</TouchableOpacity>
```

### Remplacement Explore par Paramètres & Support Arabe

**Date**: 28/12/2025
**Fichiers Modifiés**: `app/(tabs)/settings.tsx`, `app/(tabs)/_layout.tsx`, `i18n/ar.json`, `i18n/index.ts`

**Description**:
- Suppression de l'onglet "Explore".
- Ajout de l'onglet "Paramètres" (`SettingsScreen`).
- Ajout du support de la langue Arabe.

**Fonctionnement**:
- Nouvelle page `settings.tsx` avec sélection de langue.
- `i18n.changeLanguage()` met à jour la langue de l'app.
- `I18nManager` est configuré pour le support RTL (Right-to-Left) si Arabe sélectionné.

```typescript
  const changeLanguage = async (lang: string) => {
    i18n.changeLanguage(lang);
    const isArabic = lang === 'ar';
    if (I18nManager.isRTL !== isArabic) {
        // Force RTL for Arabic
        I18nManager.allowRTL(isArabic);
        I18nManager.forceRTL(isArabic);
    }
  };
```

  };
```

### Corrections de Bugs et Améliorations

**Date**: 28/12/2025
**Fichiers Modifiés**: `i18n/en.json`, `app/(tabs)/journal.tsx`

**Description**:
- Ajout des traductions manquantes pour les Paramètres en Anglais.
- Correction du Calendrier pour qu'il change de langue dynamiquement (Français, Anglais, Arabe).

**Fonctionnement**:
- **Traductions**: Ajout des clés `settings` dans `en.json`.
- **Calendrier**: Ajout des configurations `LocaleConfig` pour 'en' et 'ar'. Utilisation de `useEffect` pour mettre à jour `LocaleConfig.defaultLocale` et de la prop `key={i18n.language}` pour forcer le rafraîchissement du composant.

```typescript
  // Synchronisation Calendrier / App Language
  useEffect(() => {
    if (i18n.language) {
      LocaleConfig.defaultLocale = i18n.language;
    }
  }, [i18n.language]);

  <Calendar key={i18n.language} ... />
```

### Ajout du Bouton de Déconnexion

**Date**: 27/12/2025
**Fichiers Modifiés**: `app/(tabs)/index.tsx`

**Description**:
Ajout d'un bouton de déconnexion dans l'en-tête du Dashboard (icône "log-out-outline").

**Fonctionnement**:
1. L'utilisateur appuie sur l'icône de déconnexion.
2. La fonction `handleLogout` est appelée.
3. Elle supprime les clés `hasSeenOnboarding` et `userProfile` du stockage local (`AsyncStorage`).
4. L'utilisateur est redirigé immédiatement vers l'écran d'introduction (`/(onboarding)`).

```typescript
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenOnboarding');
      await AsyncStorage.removeItem('userProfile');
      router.replace('/(onboarding)');
    } catch (e) {
      console.error("Erreur lors de la déconnexion", e);
    }
  };
```
