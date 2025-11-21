import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './english.json';
import fr from './frensh.json';

const saved = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
const defaultLng = saved === 'fr' ? 'fr' : 'en';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: defaultLng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  // react-i18next 15 uses Suspense by default; keep it off for simplicity
  react: { useSuspense: false },
});

export default i18n;
