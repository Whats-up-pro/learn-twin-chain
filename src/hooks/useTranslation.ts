import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    // Dispatch custom event for language change
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
  };
  
  return {
    t,
    changeLanguage,
    currentLanguage: i18n.language,
    isReady: i18n.isInitialized
  };
};