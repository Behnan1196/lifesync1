import { createContext, useContext } from 'react';
import { Language, TranslationKey, getTranslations } from './i18n';

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
};

export const I18nContext = createContext<I18nContextType | null>(null);

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function createI18nValue(
  language: Language,
  setLanguage: (lang: Language) => void
): I18nContextType {
  const translations = getTranslations(language);
  
  return {
    language,
    setLanguage,
    t: (key: TranslationKey) => translations[key] || key,
  };
}
