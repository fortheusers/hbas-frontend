import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import ruTranslation from './locales/ru.json';
import esTranslation from './locales/es.json';

const SUPPORTED = ['en', 'ru', 'es'];
const detectedLang = (navigator.languages?.length ? navigator.languages : [navigator.language])
  .map(l => l.split('-')[0])
  .find(l => SUPPORTED.includes(l)) ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      ru: {
        translation: ruTranslation
      },
      es: {
        translation: esTranslation
      }
    },
    lng: detectedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;