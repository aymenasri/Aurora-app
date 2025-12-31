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



    const [expandedSection, setExpandedSection] = React.useState<string | null>(null);

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
        // Animation simple pour la fluidité
        // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); 
    };

    const SectionHeader = ({ title, section, icon }: { title: string, section: string, icon: string }) => (
        <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection(section)}
            activeOpacity={0.7}
        >
            <View style={styles.sectionHeaderLeft}>
                <View style={[styles.iconContainer, {
                    backgroundColor: '#6C5CE7'
                }]}>
                    <Ionicons name={icon as any} size={20} color="#FFF" />
                </View>
                <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
            <Ionicons
                name={expandedSection === section ? "chevron-up" : "chevron-down"}
                size={20}
                color="#B2BEC3"
            />
        </TouchableOpacity>
    );

    return (
        <PageTransition style={styles.container}>
            <ScrollView style={{ flex: 1 }}>
                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('settings.title')}</Text>
                </View>

                {/* GROUPE: LANGUE */}
                <View style={styles.sectionContainer}>
                    <SectionHeader title={t('settings.language_select', 'Langue')} section="language" icon="globe-outline" />
                    {expandedSection === 'language' && (
                        <View style={styles.optionsContainer}>
                            <LanguageOption lang="fr" label="Français" icon="🇫🇷" />
                            <LanguageOption lang="en" label="English" icon="🇬🇧" />
                            <LanguageOption lang="ar" label="العربية" icon="🇸🇦" />
                        </View>
                    )}
                </View>

                {/* GROUPE: NOTIFICATIONS */}
                <View style={styles.sectionContainer}>
                    <SectionHeader title={t('settings.notifications', 'Notifications')} section="notifications" icon="notifications" />
                    {expandedSection === 'notifications' && (
                        <View style={styles.optionsContainer}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={async () => {
                                    const { sendTestNotification } = require('../../utils/notifications');
                                    await sendTestNotification();
                                    if (Platform.OS !== 'web') Alert.alert("Envoyé", "Vous devriez recevoir une notification dans quelques secondes.");
                                }}
                            >
                                <View style={styles.menuItemLeft}>
                                    <Text style={styles.menuItemText}>{t('settings.test_notification', 'Tester les notifications')}</Text>
                                </View>
                                <Ionicons name="paper-plane-outline" size={20} color="#6C5CE7" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* GROUPE: DANGER ZONE */}
                <View style={styles.sectionContainer}>
                    <SectionHeader title={t('settings.danger_zone', 'Zone de Danger')} section="danger" icon="alert-circle-outline" />
                    {expandedSection === 'danger' && (
                        <View style={styles.optionsContainer}>
                            <TouchableOpacity
                                style={styles.menuItem}
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
                                <View style={styles.menuItemLeft}>
                                    <Text style={[styles.menuItemText, { color: '#FF7675' }]}>{t('settings.clear_data', 'Effacer toutes les données')}</Text>
                                </View>
                                <Ionicons name="trash-outline" size={20} color="#FF7675" />
                            </TouchableOpacity>
                        </View>
                    )}
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
        // backgroundColor: '#FFFFFF', // Removed
        // borderRadius: 16, // Removed
        padding: 5,
        // shadowColor: '#000', // Removed
        // shadowOffset: { width: 0, height: 2 }, // Removed
        // shadowOpacity: 0.05, // Removed
        // shadowRadius: 5, // Removed
        // elevation: 2, // Removed
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0'
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
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 12,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center'
    },
    menuItemText: {
        fontSize: 16,
        color: '#2D3436',
        fontWeight: '500'
    },
    // New Styles
    sectionContainer: {
        marginBottom: 15,
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#FFF'
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    sectionHeaderText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3436'
    }
});
