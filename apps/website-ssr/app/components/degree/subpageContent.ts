import type { TFunction } from 'i18next'
import type { Lang } from '~/i18n/config'
import {
  buildFaq,
  formatAcademicYear,
  formatGrade,
  formatInt,
  formatNumber,
  formatPct,
  type FaqItem
} from './content'
import type {
  DegreeAdmissionPageData,
  DegreeCareersPageData,
  DegreePageExtras
} from './pageTypes'

/**
 * The questions of the degree sub-pages, shared by the page and its FAQPage
 * markup (like `buildFaq` for the degree page). Answered only from data the
 * page shows; a question with no data is not asked.
 */

export function buildAdmissionFaq(
  t: TFunction<'browse'>,
  lang: Lang,
  acronym: string,
  extras: DegreePageExtras,
  data: DegreeAdmissionPageData
): FaqItem[] {
  const items = buildFaq(t, lang, {
    acronym,
    admissions: extras.admissions,
    fees: extras.fees,
    outcomes: null,
    highlights: null,
    workloadLabel: () => ''
  })

  const next = extras.admissions?.guide?.nextYearVagas
  if (next) {
    items.push({
      topic: 'vagas',
      isMarkdown: false,
      question: t('degree_subpages.admission.faq.vagas_q', { acronym }),
      answer: t('degree_subpages.admission.faq.vagas_a', {
        vagas: formatInt(next.vagas, lang),
        year: formatAcademicYear(next.academicYear)
      })
    })
  }

  // The latest year with a 2ª fase that opened places
  const withFase2 = data.years.find((y) =>
    y.fases.some((f) => f.fase === 2 && (f.vagas ?? 0) > 0)
  )
  const fase2 = withFase2?.fases.find((f) => f.fase === 2)
  if (withFase2 && fase2?.vagas) {
    items.push({
      topic: 'fase2',
      isMarkdown: false,
      question: t('degree_subpages.admission.faq.fase2_q', { acronym }),
      answer:
        fase2.lastGrade !== null
          ? t('degree_subpages.admission.faq.fase2_a', {
              year: withFase2.year,
              count: fase2.vagas,
              vagas: formatInt(fase2.vagas, lang),
              grade: formatGrade(fase2.lastGrade, lang)
            })
          : t('degree_subpages.admission.faq.fase2_a_nograde', {
              year: withFase2.year,
              count: fase2.vagas,
              vagas: formatInt(fase2.vagas, lang)
            })
    })
  }

  return items
}

export function buildCareersFaq(
  t: TFunction<'browse'>,
  lang: Lang,
  acronym: string,
  extras: DegreePageExtras,
  data: DegreeCareersPageData
): FaqItem[] {
  const items = buildFaq(t, lang, {
    acronym,
    admissions: null,
    fees: null,
    outcomes: extras.outcomes,
    highlights: null,
    workloadLabel: () => ''
  })

  const c = data.completion
  if (c?.expectedTime != null && c.cohortYear) {
    items.push({
      topic: 'completion',
      isMarkdown: false,
      question: t('degree_subpages.careers.faq.completion_q', { acronym }),
      answer:
        c.plus3Years != null
          ? t('degree_subpages.careers.faq.completion_a_plus3', {
              pct: formatPct(c.expectedTime, lang),
              cohort: c.cohortYear,
              plus3: formatPct(c.plus3Years, lang)
            })
          : t('degree_subpages.careers.faq.completion_a', {
              pct: formatPct(c.expectedTime, lang),
              cohort: c.cohortYear
            })
    })
  }

  const g = data.finalGrades
  if (g?.average != null && g.schoolYears.length > 0) {
    items.push({
      topic: 'final_grade',
      isMarkdown: false,
      question: t('degree_subpages.careers.faq.grade_q', { acronym }),
      answer: t('degree_subpages.careers.faq.grade_a', {
        average: formatNumber(g.average, lang),
        years: g.schoolYears.join(t('degree_subpages.and'))
      })
    })
  }

  return items
}
