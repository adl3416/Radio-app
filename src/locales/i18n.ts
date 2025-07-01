import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en';
import tr from './tr';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      // Fallback to device language
      const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'tr';
      callback(deviceLanguage);
    } catch (error) {
      console.log('Error reading language', error);
      callback('tr'); // Default to Turkish
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    fallbackLng: 'tr',
    debug: false,
    resources: {
      en: { translation: en },
      tr: { translation: tr },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
