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

---

## Changements Récents

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
