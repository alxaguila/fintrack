import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import esCommon from './locales/es/common.json'
import esAuth from './locales/es/auth.json'
import esDashboard from './locales/es/dashboard.json'
import esTransactions from './locales/es/transactions.json'
import esImport from './locales/es/import.json'
import esAccounts from './locales/es/accounts.json'
import esHistory from './locales/es/history.json'
import esSettings from './locales/es/settings.json'
import esCategories from './locales/es/categories.json'
import esHome from './locales/es/home.json'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enDashboard from './locales/en/dashboard.json'
import enTransactions from './locales/en/transactions.json'
import enImport from './locales/en/import.json'
import enAccounts from './locales/en/accounts.json'
import enHistory from './locales/en/history.json'
import enSettings from './locales/en/settings.json'
import enCategories from './locales/en/categories.json'
import enHome from './locales/en/home.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    defaultNS: 'common',
    resources: {
      es: {
        common: esCommon,
        auth: esAuth,
        dashboard: esDashboard,
        transactions: esTransactions,
        import: esImport,
        accounts: esAccounts,
        history: esHistory,
        settings: esSettings,
        categories: esCategories,
        home: esHome,
      },
      en: {
        common: enCommon,
        auth: enAuth,
        dashboard: enDashboard,
        transactions: enTransactions,
        import: enImport,
        accounts: enAccounts,
        history: enHistory,
        settings: enSettings,
        categories: enCategories,
        home: enHome,
      },
    },
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'fintrack_language',
    },
  })

export default i18n
