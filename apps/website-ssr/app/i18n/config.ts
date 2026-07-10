import {
  formatSchoolYearString,
  getGiveawaySchoolYear
} from '@uni-feedback/utils'
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

const resources = {
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
}

i18n.use(initReactI18next).init({
  lng: defaultLang,
  fallbackLng: defaultLang,
  ns: ['common', 'landing', 'browse', 'course', 'feedback', 'legal'],
  defaultNS: 'common',
  resources,
  interpolation: {
    escapeValue: false,
    // `{{schoolYear}}` resolves in every string without the call site passing
    // it, so the giveaway's "only 25/26 courses count" rule can be stated
    // wherever we mention points. A getter, not a value: i18next spreads
    // defaultVariables on each interpolation, so this stays correct across a
    // September rollover on a long-running server.
    defaultVariables: {
      get schoolYear() {
        return formatSchoolYearString(getGiveawaySchoolYear())
      }
    }
  }
})

export { i18n }

// HMR: when a locale JSON changes, push the new bundles into the running
// i18next instance and force a re-render — no full page refresh needed.
if (import.meta.hot) {
  // Order MUST match the `deps` array below: [lng, ns] per entry.
  const hmrBundles: [Lang, string][] = [
    ['en', 'browse'],
    ['en', 'common'],
    ['en', 'course'],
    ['en', 'feedback'],
    ['en', 'landing'],
    ['en', 'legal'],
    ['pt', 'browse'],
    ['pt', 'common'],
    ['pt', 'course'],
    ['pt', 'feedback'],
    ['pt', 'landing'],
    ['pt', 'legal']
  ]
  import.meta.hot.accept(
    [
      '../locales/en/browse.json',
      '../locales/en/common.json',
      '../locales/en/course.json',
      '../locales/en/feedback.json',
      '../locales/en/landing.json',
      '../locales/en/legal.json',
      '../locales/pt/browse.json',
      '../locales/pt/common.json',
      '../locales/pt/course.json',
      '../locales/pt/feedback.json',
      '../locales/pt/landing.json',
      '../locales/pt/legal.json'
    ],
    (modules) => {
      // `modules` arrives in the same order as the deps array above; an entry
      // is undefined when that specific file didn't change in this update.
      modules.forEach((mod, i) => {
        if (!mod) return
        const [lng, ns] = hmrBundles[i]
        i18n.addResourceBundle(lng, ns, mod.default, true, true)
      })
      // Re-emit to make react-i18next re-render mounted components.
      i18n.changeLanguage(i18n.language)
    }
  )
}
