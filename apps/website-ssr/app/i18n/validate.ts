// Compile-time validation: EN and PT must have identical key structures.
// Deleting a key from either side causes a TypeScript error here.
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

// EN must have all keys that PT has
const _common: typeof ptCommon = enCommon
const _landing: typeof ptLanding = enLanding
const _browse: typeof ptBrowse = enBrowse
const _course: typeof ptCourse = enCourse
const _feedback: typeof ptFeedback = enFeedback
const _legal: typeof ptLegal = enLegal

// PT must have all keys that EN has
const _ptCommon: typeof enCommon = ptCommon
const _ptLanding: typeof enLanding = ptLanding
const _ptBrowse: typeof enBrowse = ptBrowse
const _ptCourse: typeof enCourse = ptCourse
const _ptFeedback: typeof enFeedback = ptFeedback
const _ptLegal: typeof enLegal = ptLegal
