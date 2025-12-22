import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import fr from './fr.json';
import en from './en.json';

// Récupère la langue du téléphone (ex: 'fr-FR' devient 'fr')
// getLocales() renvoie un tableau, on prend le premier
const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: deviceLanguage, // Langue détectée
    fallbackLng: 'en',   // Langue de secours
    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;