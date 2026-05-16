import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import enBrowse from '../locales/en/browse.json'
import enCommon from '../locales/en/common.json'
import enCourse from '../locales/en/course.json'
import enFeedback from '../locales/en/feedback.json'
import enLanding from '../locales/en/landing.json'
import enLegal from '../locales/en/legal.json'
import ptBrowse from '../locales/pt/browse.json'
import ptCommon from '../locales/pt/common.json'
import ptCourse from '../locales/pt/course.json'
import ptFeedback from '../locales/pt/feedback.json'
import ptLanding from '../locales/pt/landing.json'
import ptLegal from '../locales/pt/legal.json'

export type Lang = 'pt' | 'en'
export const defaultLang: Lang = 'pt'
export const supportedLangs: Lang[] = ['pt', 'en']

// Single shared instance — safe for SSR because changeLanguage() is synchronous
// when all resources are pre-loaded (no async backend).
// Node.js is single-threaded: the loader sets the lang before renderToString runs.
const i18n = i18next.createInstance()

i18n.use(initReactI18next).init({
  lng: defaultLang,
  fallbackLng: defaultLang,
  ns: ['common', 'landing', 'browse', 'course', 'feedback', 'legal'],
  defaultNS: 'common',
  resources: {
    pt: {
      common: ptCommon,
      landing: ptLanding,
      browse: ptBrowse,
      course: ptCourse,
      feedback: ptFeedback,
      legal: ptLegal
    },
    en: {
      common: enCommon,
      landing: enLanding,
      browse: enBrowse,
      course: enCourse,
      feedback: enFeedback,
      legal: enLegal
    }
  },
  interpolation: { escapeValue: false }
})

export { i18n }
