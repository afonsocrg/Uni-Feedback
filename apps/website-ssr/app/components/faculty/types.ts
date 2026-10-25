import type { DegreeType, EntityLinkKind } from '@uni-feedback/db/schema'
import type { Localized } from '~/utils/localizedContent'

/** Shapes of the faculty hub and type pages (loaded in lib/facultyPage.server.ts) */

/** Courses in the faculty's highlight lists need this much feedback */
export const FACULTY_HIGHLIGHT_MIN_FEEDBACK = 10

export interface FacultyDegree {
  id: number
  type: DegreeType
  name: string
  acronym: string
  slug: string | null
  courseCount: number
  /** Feedback on the degree's courses, shared courses counted in each degree */
  feedbackCount: number
  ects: number | null
  durationSemesters: number | null
  teachingLanguage: string | null
  campuses: string[]
}

export interface FacultyCampus {
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
  degreeCount: number
}

export interface FacultyCourseStat {
  id: number
  name: string
  rating: number
  workload: number
  feedbackCount: number
}

export interface FacultyHighlights {
  mostFeedback: FacultyCourseStat[]
  best: FacultyCourseStat[]
  heaviest: FacultyCourseStat[]
}

export interface DegreeAdmissionSummary {
  year: number
  vagas: number | null
  colocados: number | null
  lastGrade: number | null
  previousYear: number | null
  previousGrade: number | null
}

export interface DegreeFeeSummary {
  schoolYear: number
  studentType: string
  period: string
  amountEur: number
}

/** A row of a type page's comparison table */
export interface TypePageDegree extends FacultyDegree {
  admission: DegreeAdmissionSummary | null
  /** 100 minus the InfoCursos unemployment rate (registered at IEFP) */
  employability: number | null
  /** % finishing in the expected time (InfoCursos) */
  completion: number | null
  fee: DegreeFeeSummary | null
  hasDescription: boolean
}

export interface SharedFirstYearCourse {
  name: string
  courseId: number
  degreeCount: number
  rating: number | null
  workload: number | null
  feedbackCount: number
}

export interface DegreePathway {
  fromAcronym: string
  fromSlug: string
  toAcronym: string
  toSlug: string
  toFacultySlug: string
}

export interface FacultyUniversity {
  name: string
  shortName: string
  slug: string
}

export interface FacultyAdmissionSummary {
  year: number
  degreeCount: number
  vagas: number
  highest: { acronym: string; grade: number } | null
  lowest: { acronym: string; grade: number } | null
  /** The national fee, when every licenciatura has the same one */
  fee: DegreeFeeSummary | null
}

export interface FacultyHubData {
  /** In the page's language (falls back to Portuguese) */
  university: FacultyUniversity | null
  /** Our reviewed intro in the page's language, else the Portuguese one */
  intro: Localized<string> | null
  /** True on an EN page whose text is all Portuguese fallback: `noindex` */
  isMostlyFallback: boolean
  /** Reviewed official profiles (LinkedIn, Instagram, ...), header icons */
  links: { kind: EntityLinkKind; url: string }[]
  degrees: FacultyDegree[]
  campuses: FacultyCampus[]
  /** Approved feedback on the faculty's courses, each counted once */
  feedbackCount: number
  admissionSummary: FacultyAdmissionSummary | null
}

export interface FacultyTypePageData {
  university: FacultyUniversity | null
  degrees: TypePageDegree[]
  campuses: FacultyCampus[]
  highlights: FacultyHighlights
  firstYear: SharedFirstYearCourse[]
  pathways: DegreePathway[]
  /** The faculty's other degree types, for links to their pages */
  otherTypes: DegreeType[]
}
