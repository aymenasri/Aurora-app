import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuration du gestionnaire de notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const requestNotificationPermissions = async () => {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
};

export const scheduleDailyReminder = async (timeId: string) => {
    if (Platform.OS === 'web') return;

    // 1. Annuler les anciennes notifications pour éviter les doublons
    await cancelAllNotifications();

    // 2. Déterminer l'heure en fonction de l'ID
    let hour = 20; // Default: Soir
    let minute = 0;

    switch (timeId) {
        case 'morning':
            hour = 8; // 08:00
            break;
        case 'noon':
            hour = 12; // 12:00
            break;
        case 'evening':
            hour = 20; // 20:00
            break;
        default:
            return; // Si "none" ou invalide
    }

    // 3. Programmer la notification récurrente
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "C'est l'heure de votre journal ✍️",
                body: "Prenez un moment pour noter vos pensées de la journée.",
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
        });
        console.log(`Notification programmée pour ${hour}h${minute}`);
    } catch (e) {
        console.error("Erreur de programmation:", e);
    }
};

export const cancelAllNotifications = async () => {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
};

export const sendTestNotification = async () => {
    if (Platform.OS === 'web') {
        alert("Les notifications ne fonctionnent pas sur le web.");
        return;
    }

    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Test de Notification 🔔",
                body: "Si vous voyez ceci, les notifications fonctionnent !",
                sound: true,
            },
            trigger: null, // Immédiat
        });
    } catch (e) {
        console.error("Erreur test notification:", e);
    }
};
