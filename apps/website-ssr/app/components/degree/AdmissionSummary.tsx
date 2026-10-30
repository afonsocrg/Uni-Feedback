import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { ContributeNote } from '../common/ContributeNote'
import { admissionProvasPhrase, formatEur, formatSchoolYear } from './content'
import {
  Stat,
  StatGrid,
  useAdmissionStats,
  type DegreeTrack
} from './DegreeSections'
import type {
  AdmissionRouteView,
  DegreeAdmissions,
  DegreeFees
} from './pageTypes'

/**
 * The top of the Ingresso page and of the degree page's Ingresso section: what
 * students ask first as cards (the last admitted grade and the tuition, plus
 * the application fee on `/ingresso`), then how one gets in, in a few
 * sentences. Static on purpose: nothing here depends on today's date (the rounds and their status
 * live in "Como candidatar-se"). The sentences are built from the data (the
 * route, the provas, the number of rounds), plus the requirements sentence
 * from our reviewed guide, so they stay right when the data is refreshed.
 */
/**
 * What the grade card says when there is no last admitted grade: mestrados
 * have none published anywhere (`unpublished`), a licenciatura / MI should and
 * we lack it (`missing`). Null: no card (pós-graduações, retired degrees).
 * Either way the card asks for it (prds/entry_grades.md); never left out
 * silently.
 */
export type MissingGrade = 'unpublished' | 'missing' | null

export function AdmissionSummary({
  admissions,
  fees,
  applyRoutes,
  detailed,
  missingGrade,
  track
}: {
  admissions: DegreeAdmissions | null
  fees: DegreeFees | null
  applyRoutes: AdmissionRouteView[]
  /** Adds the application fee card: on `/ingresso` only. The degree page
   *  keeps to what students ask first: the grade they need and the tuition */
  detailed: boolean
  missingGrade: MissingGrade
  track: DegreeTrack
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const stats = useAdmissionStats(admissions)

  // The route most students take: the national contest, else the faculty's
  // own application for everyone, else whatever there is
  const main =
    applyRoutes.find((r) => r.audience !== 'international') ?? applyRoutes[0]
  const inCna = admissions !== null || main?.route === 'cna'
  const hasInternational = applyRoutes.some(
    (r) => r.audience === 'international' && r !== main
  )

  const sentences: string[] = []
  if (inCna) {
    const provas = admissionProvasPhrase(
      admissions?.guide?.provas ?? [],
      t,
      lang
    )
    sentences.push(
      provas
        ? t('degree_page.admission_summary.cna_provas', { provas })
        : t('degree_page.admission_summary.cna')
    )
  } else if (main && main.rounds.length > 0) {
    const rondas = main.rounds.some((r) => /ronda|round/i.test(r.label))
    sentences.push(
      t('degree_page.admission_summary.direct_rounds', {
        count: main.rounds.length,
        noun: t(
          rondas
            ? 'degree_page.admission_summary.noun_rondas'
            : 'degree_page.admission_summary.noun_fases'
        )
      })
    )
  } else if (main && !main.guide?.summary) {
    sentences.push(t('degree_page.admission_summary.direct'))
  }
  if (main?.route !== 'cna' && main?.guide?.summary) {
    sentences.push(main.guide.summary)
  }
  if (hasInternational) {
    sentences.push(t('degree_page.admission_summary.international'))
  }

  const cards: ReactNode[] = [...stats]
  // A degree with its own guide and no Concurso Nacional data is a special
  // case outside the contest (BIPB): there is no grade to be missing
  const outsideCna =
    missingGrade === 'missing' &&
    applyRoutes.some((r) => r.guide?.scope === 'degree')
  if (stats.length === 0 && missingGrade && !outsideCna) {
    const unpublished = missingGrade === 'unpublished'
    cards.push(
      <Stat
        key="grade"
        muted
        value={t(
          unpublished
            ? 'degree_page.admission_summary.grade_unpublished'
            : 'degree_page.admission_summary.grade_missing'
        )}
        label={t('degree_page.admission.last_grade')}
        note={
          <ContributeNote
            field="entry_grade"
            className="text-xs"
            text={
              unpublished
                ? t('degree_page.admission_summary.grade_unpublished_note')
                : undefined
            }
            linkText={
              unpublished
                ? t('degree_page.admission_summary.grade_share')
                : undefined
            }
            pageName={track.pageName}
            facultySlug={track.facultySlug}
            degreeSlug={track.degreeSlug}
          />
        }
      />
    )
  }
  if (fees && hasTuition(fees)) {
    cards.push(<TuitionStat key="tuition" fees={fees} />)
  }

  const fee =
    detailed && main?.route !== 'cna' ? main?.guide?.applicationFee : null
  if (fee) {
    cards.push(
      <Stat
        key="fee"
        value={formatEur(fee.amountEur, lang)}
        label={t('degree_page.admission_summary.fee_label')}
        note={fee.note}
      />
    )
  }
  if (sentences.length === 0 && cards.length === 0) return null
  // The cards first: the grade and the cost are what students look for; the
  // sentences under them say how one gets in
  return (
    <>
      {cards.length > 0 && <StatGrid>{cards}</StatGrid>}
      {sentences.length > 0 && (
        <p className={cards.length > 0 ? 'mt-4 max-w-prose' : 'max-w-prose'}>
          {sentences.join(' ')}
        </p>
      )}
    </>
  )
}

const localRow = (fees: DegreeFees) =>
  fees.rows.find((r) => r.studentType === 'national') ??
  fees.rows.find((r) => r.studentType === 'all')

const hasTuition = (fees: DegreeFees) => localRow(fees) !== undefined

/**
 * The tuition as one card: the national fee (or the one for everyone), its
 * period next to the amount, and the international fee as a note. In the
 * Ingresso summary and the Propinas section of `/ingresso`.
 */
export function TuitionStat({ fees }: { fees: DegreeFees }) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const local = localRow(fees)
  if (!local) return null
  const international = fees.rows.find((r) => r.studentType === 'international')
  const unit = (p: string) =>
    t(`degree_page.admission_summary.tuition_unit.${p}`, { defaultValue: p })
  return (
    <Stat
      value={formatEur(local.amountEur, lang)}
      unit={unit(local.period)}
      label={t('degree_page.admission_summary.tuition_label', {
        year: formatSchoolYear(fees.schoolYear)
      })}
      note={
        international
          ? t('degree_page.admission_summary.tuition_international', {
              amount: `${formatEur(international.amountEur, lang)} ${unit(international.period)}`
            })
          : null
      }
    />
  )
}
