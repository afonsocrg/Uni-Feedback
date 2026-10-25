/**
 * The data behind the degree page's content sections (v2), as the loader hands
 * it over. Built in `app/lib/degreePage.server.ts`; every block is null (or an
 * empty list) when we have nothing for it, and the page then hides the block or
 * shows a fallback line. Never a placeholder value.
 *
 * Where each piece comes from: `docs/data-model/degree_content_data.md` in the
 * workspace.
 */

export interface DegreeCampusInfo {
  id: number
  name: string
  address: string | null
  postalCode: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  email: string | null
  url: string | null
}

/** The 1ª fase "nota do último colocado" of one year, 0-200 scale. */
export interface AdmissionGradePoint {
  year: number
  grade: number
  vagas: number | null
}

/**
 * One Concurso Nacional track of a degree: a DGES course code, across the unit
 * codes it ran under (IST's pre-2014 0807 and today's 1518 are one track).
 * Degrees with a pós-laboral regime have a second track with its own code.
 */
export interface AdmissionTrack {
  courseCode: string
  isAfterWork: boolean
  /** 1ª fase, every year with a grade, oldest first. */
  series: AdmissionGradePoint[]
}

export interface AdmissionGuide {
  /** Guide edition (the year of the snapshot) */
  year: number
  /** Next year's vagas and the academic year they are for ("2026-2027") */
  nextYearVagas: { vagas: number; academicYear: string } | null
  /** Alternatives: each inner list is one combination of exams */
  provas: string[][]
  formula: { secondaryPct: number; examsPct: number } | null
  minimumGrades: { application: number | null; entryExams: number | null }
  /** 1ª fase of the latest year the guide reports */
  latestFase1: {
    year: number
    candidatos: number | null
    candidatosFirstOption: number | null
    mediaColocados: number | null
  } | null
  sourceUrl: string
}

export interface DegreeAdmissions {
  /** The daytime (or only) track: drives the stats and the chart */
  main: AdmissionTrack
  /** Pós-laboral tracks, summarised in one line each */
  afterWork: AdmissionTrack[]
  guide: AdmissionGuide | null
  /** The DGES guide page for the main track's current (unit, course) pair */
  dgesUrl: string
}

export interface DegreeFeeRow {
  /** 'national' | 'international' | 'all' */
  studentType: string
  /** 'year' | 'total' | 'semester' | 'ects' */
  period: string
  amountEur: number
}

export interface DegreeFees {
  /** 2026 = 2026/2027 */
  schoolYear: number
  rows: DegreeFeeRow[]
  sourceUrls: string[]
}

export interface DegreeOutcomes {
  /** The latest InfoCursos edition among the figures shown */
  edition: number
  unemployment: {
    rate: number
    national: number | null
    area: number | null
  } | null
  completion: {
    expectedTime: number | null
    plus3Years: number | null
  } | null
  /** % still in the same course one year after entering */
  stillInCourse: number | null
  sourceUrl: string
  /**
   * Set when the figures belong to a broader programme than this degree: one
   * InfoCursos programme mapped to several of our degrees (Nova IMS
   * specializations). Name as InfoCursos gives it; level is its degree_level.
   */
  broaderProgramme: { name: string; level: string | null } | null
}

export type DegreeRelationshipType =
  | 'campus_sibling'
  | 'continues_to'
  | 'continues_from'
  | 'equivalent'
  | 'similar'

export interface RelatedDegree {
  relationship: DegreeRelationshipType
  facultySlug: string
  facultyShortName: string
  slug: string
  acronym: string
  name: string
}

export interface DegreePageExtras {
  universityName: string | null
  campuses: DegreeCampusInfo[]
  admissions: DegreeAdmissions | null
  fees: DegreeFees | null
  outcomes: DegreeOutcomes | null
  related: RelatedDegree[]
}

/* ------------------------------------------------------------------ */
/* Sub-pages: /ingresso and /saidas-profissionais                      */
/* ------------------------------------------------------------------ */

/** One fase of one year of the Concurso Nacional (DGES results files). */
export interface AdmissionFaseResult {
  fase: number
  vagas: number | null
  colocados: number | null
  lastGrade: number | null
}

/** Every fase of one year, main track only. */
export interface AdmissionYear {
  year: number
  fases: AdmissionFaseResult[]
}

/** One year/fase of the candidate statistics on the DGES guide page. */
export interface AdmissionGuideStat {
  year: number
  fase: number
  candidatos: number | null
  candidatosFirstOption: number | null
  colocados: number | null
  colocadosFirstOption: number | null
  colocadosWomen: number | null
  mediaCandidatura: number | null
  mediaProvas: number | null
  mediaSecundario: number | null
}

/** How first-year students got in, percentages (InfoCursos entry_forms). */
export interface EntryForms {
  students: number | null
  schoolYears: string[]
  cnaFirstOption: number | null
  cnaOtherOption: number | null
  otherRegimes: number | null
  otherGeneralRegime: number | null
  courseChange: number | null
  over23: number | null
  localOrInstitutional: number | null
}

/** Who studies the degree (InfoCursos nationality / age). */
export interface DegreeIntake {
  schoolYear: string | null
  enrolled: number | null
  foreign: number | null
  /** National share of foreign students, for comparison */
  nationalForeignPct: number | null
  /** The most common age band and its share */
  topAgeBand: { label: string; pct: number } | null
}

export interface DegreeFeeHistoryRow extends DegreeFeeRow {
  schoolYear: number
  sourceUrl: string
}

export interface DegreeAdmissionPageData {
  /** Every year we have, newest first */
  years: AdmissionYear[]
  /** Candidate statistics from the latest guide snapshot, newest first */
  guideStats: AdmissionGuideStat[]
  entryForms: EntryForms | null
  intake: DegreeIntake | null
  /** Every fee row we hold, newest school year first */
  feeHistory: DegreeFeeHistoryRow[]
  infocursos: { url: string; edition: number } | null
}

/** One InfoCursos edition of the registered-unemployment figure. */
export interface UnemploymentWindow {
  edition: number
  /** Graduation years the figure covers ("2020/21" to "2023/24") */
  from: string | null
  to: string | null
  graduates: number | null
  unemployed: number | null
  rate: number
}

export interface DegreeCareersPageData {
  /** One row per graduation window (editions repeating a window are merged), newest first */
  unemploymentHistory: UnemploymentWindow[]
  completion: {
    cohortYear: string | null
    firstYearStudents: number | null
    durationYears: number | null
    expectedTime: number | null
    plus1Year: number | null
    plus3Years: number | null
  } | null
  statusAfter1Year: {
    students: number | null
    sameCourse: number | null
    otherCourseSameInstitution: number | null
    otherInstitution: number | null
    graduated: number | null
    notFound: number | null
  } | null
  finalGrades: {
    average: number | null
    graduates: number | null
    schoolYears: string[]
    distribution: { grade: number; percent: number }[]
  } | null
  infocursos: { url: string; edition: number } | null
}
