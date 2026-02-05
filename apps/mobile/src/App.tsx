import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { validateEnv } from './core/env';
import { getLanguage, setLanguage as persistLanguage } from './storage/kv';
import { Language } from './i18n/i18n';
import { I18nContext, createI18nValue } from './i18n/useI18n';
import { RootNavigator } from './navigation/RootNavigator';
import { EnvMissingScreen } from './auth/EnvMissingScreen';

export default function App() {
  const [language, setLanguageState] = useState<Language>('tr');
  const [envValid, setEnvValid] = useState(true);
  const [missingEnv, setMissingEnv] = useState<string[]>([]);

  useEffect(() => {
    const { valid, missing } = validateEnv();
    setEnvValid(valid);
    setMissingEnv(missing);

    if (valid) {
      getLanguage().then((lang) => setLanguageState(lang as Language));
    }
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    persistLanguage(lang);
  }

  const i18nValue = createI18nValue(language, setLanguage);

  if (!envValid) {
    return (
      <I18nContext.Provider value={i18nValue}>
        <EnvMissingScreen missing={missingEnv} />
        <StatusBar style="auto" />
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={i18nValue}>
      <RootNavigator />
      <StatusBar style="auto" />
    </I18nContext.Provider>
  );
}
