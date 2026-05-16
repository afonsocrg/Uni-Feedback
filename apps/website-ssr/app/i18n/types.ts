import type ptBrowse from '../locales/pt/browse.json'
import type ptCommon from '../locales/pt/common.json'
import type ptCourse from '../locales/pt/course.json'
import type ptFeedback from '../locales/pt/feedback.json'
import type ptLanding from '../locales/pt/landing.json'
import type ptLegal from '../locales/pt/legal.json'

// PT is the source of truth. These types make t() auto-complete and
// flag unknown keys at compile time.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof ptCommon
      landing: typeof ptLanding
      browse: typeof ptBrowse
      course: typeof ptCourse
      feedback: typeof ptFeedback
      legal: typeof ptLegal
    }
  }
}
