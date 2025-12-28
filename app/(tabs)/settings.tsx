import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
        <View style={styles.container}>
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

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2D3436' },
    section: { padding: 20 },
    sectionTitle: { fontSize: 16, color: '#636E72', marginBottom: 15, fontWeight: '600' },
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
    optionText: { fontSize: 16, color: '#2D3436' },
    optionTextSelected: { color: '#6C5CE7', fontWeight: 'bold' },
});
