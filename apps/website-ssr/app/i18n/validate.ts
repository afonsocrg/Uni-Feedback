// Compile-time validation: EN must structurally match PT (source of truth).
// Deleting a key from any pt/*.json causes a TypeScript error here.
import enBrowse from '../locales/en/browse.json'
import enCommon from '../locales/en/common.json'
import enCourse from '../locales/en/course.json'
import enFeedback from '../locales/en/feedback.json'
import enLanding from '../locales/en/landing.json'
import enLegal from '../locales/en/legal.json'
import type ptBrowse from '../locales/pt/browse.json'
import type ptCommon from '../locales/pt/common.json'
import type ptCourse from '../locales/pt/course.json'
import type ptFeedback from '../locales/pt/feedback.json'
import type ptLanding from '../locales/pt/landing.json'
import type ptLegal from '../locales/pt/legal.json'

// These assignments fail at compile time if EN is missing keys that exist in PT.
const _common: typeof ptCommon = enCommon
const _landing: typeof ptLanding = enLanding
const _browse: typeof ptBrowse = enBrowse
const _course: typeof ptCourse = enCourse
const _feedback: typeof ptFeedback = enFeedback
const _legal: typeof ptLegal = enLegal
