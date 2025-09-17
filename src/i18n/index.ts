import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import en from '../locales/en/translation.json';
import vi from '../locales/vi/translation.json';
import es from '../locales/es/translation.json';
import fr from '../locales/fr/translation.json';
import de from '../locales/de/translation.json';
import zh from '../locales/zh/translation.json';
import ja from '../locales/ja/translation.json';
import ko from '../locales/ko/translation.json';

const resources = {
  en: { translation: en },
  vi: { translation: vi },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;