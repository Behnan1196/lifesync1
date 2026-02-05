import { tr } from './tr';
import { en } from './en';

export type Language = 'tr' | 'en';
export type TranslationKey = keyof typeof tr;

const translations = { tr, en };

export function getTranslations(lang: Language) {
  return translations[lang] || translations.tr;
}
