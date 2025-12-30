import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PageTransition from '../../components/PageTransition';

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const router = useRouter();

    const currentLanguage = i18n.language;

    const changeLanguage = async (lang: string) => {
        i18n.changeLanguage(lang);

        // Pour l'arabe, on doit activer RTL
        const isArabic = lang === 'ar';
        if (I18nManager.isRTL !== isArabic) {
            I18nManager.allowRTL(isArabic);
            I18nManager.forceRTL(isArabic);
            // Un redémarrage est nécessaire pour appliquer RTL globalement sur Android/iOS
            // Updates.reloadAsync(); 
            // Note: Updates.reloadAsync() ne marche qu'en prod ou Expo Go, en dev client ça peut crash.
            // Pour l'instant on change juste la langue des textes.
        }
    };

    const LanguageOption = ({ lang, label, icon }: { lang: string, label: string, icon: string }) => (
        <TouchableOpacity
            style={[
                styles.option,
                currentLanguage === lang && styles.optionSelected
            ]}
            onPress={() => changeLanguage(lang)}
        >
            <Text style={[
                styles.optionText,
                currentLanguage === lang && styles.optionTextSelected
            ]}>{icon} {label}</Text>
            {currentLanguage === lang && (
                <Ionicons name="checkmark-circle" size={24} color="#6C5CE7" />
            )}
        </TouchableOpacity>
    );



    return (
        <PageTransition style={styles.container}>
            <ScrollView style={{ flex: 1 }}>
                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('settings.title')}</Text>
                </View>

                {/* SECTION LANGUE */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.language_select')}</Text>
                    <View style={styles.optionsContainer}>
                        <LanguageOption lang="fr" label="Français" icon="🇫🇷" />
                        <LanguageOption lang="en" label="English" icon="🇬🇧" />
                        <LanguageOption lang="ar" label="العربية" icon="🇸🇦" />
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#FF7675' }]}>{t('settings.danger_zone', 'Zone de Danger')}</Text>
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={styles.dangerButton}
                            onPress={() => {
                                if (Platform.OS === 'web') {
                                    if (window.confirm(t('settings.confirm_reset', "Êtes-vous sûr de vouloir tout effacer ? Cette action est irréversible."))) {
                                        AsyncStorage.clear().then(() => {
                                            alert(t('settings.reset_done', "Données effacées. Veuillez redémarrer l'application."));
                                        });
                                    }
                                } else {
                                    Alert.alert(
                                        t('settings.reset_title', "Réinitialiser"),
                                        t('settings.confirm_reset', "Êtes-vous sûr de vouloir tout effacer ? Cette action est irréversible."),
                                        [
                                            { text: t('common.cancel', "Annuler"), style: "cancel" },
                                            {
                                                text: t('common.delete', "Tout effacer"),
                                                style: "destructive",
                                                onPress: async () => {
                                                    await AsyncStorage.clear();
                                                    Alert.alert("Succès", "Données effacées. Veuillez redémarrer l'application.");
                                                }
                                            }
                                        ]
                                    );
                                }
                            }}
                        >
                            <Ionicons name="trash-bin-outline" size={24} color="#FFF" />
                            <Text style={styles.dangerButtonText}>{t('settings.clear_data', 'Effacer toutes les données')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </PageTransition>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFBF7' },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2D3436'
    },
    content: {
        padding: 20
    },
    section: {
        marginBottom: 30,
        paddingHorizontal: 20
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#B2BEC3',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    optionsContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 12,
    },
    optionSelected: {
        backgroundColor: '#F0F3FF',
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    optionText: {
        fontSize: 16,
        color: '#2D3436',
        fontWeight: '500'
    },
    optionTextSelected: { color: '#6C5CE7', fontWeight: 'bold' },
    featuresList: {
        padding: 15
    },
    featureItem: {
        fontSize: 14,
        color: '#636E72',
        marginBottom: 8,
        lineHeight: 20
    },
    version: {
        textAlign: 'center',
        color: '#B2BEC3',
        fontSize: 12,
        marginTop: 20,
        marginBottom: 40
    },
    dangerButton: {
        backgroundColor: '#FF7675',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        gap: 10
    },
    dangerButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    }
});
