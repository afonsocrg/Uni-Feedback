import type { DegreeType } from '@uni-feedback/db/schema'

/**
 * Which feature sub-pages a degree has (prds/content_rich_pages.md, decision
 * 22). Decided by the degree's type alone, so the tabs on the degree page, on
 * `/cadeiras` and on the sub-pages agree without loading any data: a type that
 * gets the page always gets it, showing "we don't have this yet" prompts where
 * the data is missing. Any other type answers 404.
 */

/**
 * Concurso Nacional (DGES) admission, or direct application with fees and,
 * where we have it, a guide and the application rounds (doutoramentos since
 * 2026-10-30)
 */
const ADMISSION_TYPES = new Set<DegreeType>([
  'bachelor',
  'integrated_master',
  'master',
  'postgraduate',
  'phd'
])

/** Types InfoCursos covers */
const CAREERS_TYPES = new Set<DegreeType>([
  'bachelor',
  'integrated_master',
  'master'
])

/** Types whose admission goes through the Concurso Nacional */
export const CNA_TYPES = new Set<DegreeType>(['bachelor', 'integrated_master'])

export function hasAdmissionPage(type: DegreeType): boolean {
  return ADMISSION_TYPES.has(type)
}

export function hasCareersPage(type: DegreeType): boolean {
  return CAREERS_TYPES.has(type)
}
