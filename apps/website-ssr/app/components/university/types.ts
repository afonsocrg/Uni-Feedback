import type { DegreeType, EntityLinkKind } from '@uni-feedback/db/schema'
import type { Localized } from '~/utils/localizedContent'
import type { DegreeCampusInfo } from '../degree/pageTypes'

/**
 * The data behind the university pages (`/unis`, `/unis/:uniSlug` and its
 * sub-pages), as `app/lib/universityPage.server.ts` hands it over. Everything is
 * real data or null: a block with nothing to show is hidden, never filled in.
 *
 * Counts cover the degrees we list as taught today (at least one course without
 * `last_taught_year`), not every degree the university offers.
 */

export interface UniversityInfo {
  id: number
  slug: string
  /** In the page's language: `name_en` on EN pages when there is one */
  name: string
  shortName: string
  url: string | null
  logo: string | null
}

/** One row of `/unis` */
export interface UniversityListItem extends UniversityInfo {
  /** Cities of its faculties' campuses, most common first */
  cities: string[]
  faculties: { slug: string; shortName: string; name: string }[]
  degreeCount: number
  feedbackCount: number
}

/** Fee range for one kind of degree at a faculty, latest school year */
export interface FeeRange {
  /** 'year' | 'total' | 'semester' | 'ects' */
  period: string
  min: number
  max: number
}

/** A degree admitted through the Concurso Nacional, with its 1ª fase figures */
export interface UniversityBachelor {
  facultySlug: string
  facultyShortName: string
  slug: string
  acronym: string
  name: string
  type: DegreeType
  ects: number | null
  durationSemesters: number | null
  /** 1ª fase of `admissionYear`; null when the degree has no DGES pair or no row */
  vagas: number | null
  grade: number | null
  /** 1ª fase of the year before */
  previousGrade: number | null
}

/** A degree taught today, for the degree list pages (`/cursos`, `/mestrados`) */
export interface UniversityDegree {
  facultySlug: string
  facultyShortName: string
  slug: string
  acronym: string
  name: string
  type: DegreeType
  ects: number | null
  durationSemesters: number | null
  feedbackCount: number
}

export interface UniversityFaculty {
  id: number
  slug: string
  name: string
  shortName: string
  /** Square logo, a CDN path (null: initials) */
  logo: string | null
  campuses: DegreeCampusInfo[]
  degreeCounts: Partial<Record<DegreeType, number>>
  degreeCount: number
  feedbackCount: number
  /** Over its CNA degrees with data in `admissionYear` */
  admissions: {
    vagas: number
    minGrade: number
    maxGrade: number
    degrees: number
  } | null
  /** National (or all-students) fees, by degree type */
  fees: Partial<Record<DegreeType, FeeRange[]>>
  topDegree: {
    slug: string
    acronym: string
    name: string
    feedbackCount: number
  } | null
  topCourse: { id: number; name: string; feedbackCount: number } | null
}

export interface UniversityPageData {
  /** `name` is already in the page's language (falls back to Portuguese) */
  university: UniversityInfo
  /** Our reviewed intro in the page's language, else the Portuguese one */
  intro: Localized<string> | null
  /** True on an EN page whose text is all Portuguese fallback: `noindex` */
  isMostlyFallback: boolean
  /** Reviewed official profiles (LinkedIn, Instagram, ...), header icons */
  links: { kind: EntityLinkKind; url: string }[]
  faculties: UniversityFaculty[]
  degreeCounts: Partial<Record<DegreeType, number>>
  degreeCount: number
  feedbackCount: number
  /** Every degree taught today, by name */
  degrees: UniversityDegree[]
  /** Licenciaturas and mestrados integrados, best last-placed grade first */
  bachelors: UniversityBachelor[]
  /** The latest year with 1ª fase results among them; null without any */
  admissionYear: number | null
  /** School year of the fees shown (2026 = 2026/27) */
  feesSchoolYear: number | null
  /** Other universities, for "Relacionados" */
  others: { slug: string; name: string; shortName: string }[]
}
