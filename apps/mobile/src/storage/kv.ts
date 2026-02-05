import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  LANGUAGE: '@lifesync:language',
  LAST_EMAIL: '@lifesync:last_email',
};

export async function getLanguage(): Promise<string> {
  try {
    const lang = await AsyncStorage.getItem(KEYS.LANGUAGE);
    return lang || 'tr';
  } catch {
    return 'tr';
  }
}

export async function setLanguage(lang: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
}

export async function getLastEmail(): Promise<string> {
  try {
    const email = await AsyncStorage.getItem(KEYS.LAST_EMAIL);
    return email || '';
  } catch {
    return '';
  }
}

export async function setLastEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_EMAIL, email);
}
