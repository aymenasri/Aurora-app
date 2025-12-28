import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar.json';
import en from './en.json';
import fr from './fr.json';

// Récupère la langue du téléphone (ex: 'fr-FR' devient 'fr')
// getLocales() renvoie un tableau, on prend le premier
const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: deviceLanguage, // Langue détectée
    fallbackLng: 'en',   // Langue de secours
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;