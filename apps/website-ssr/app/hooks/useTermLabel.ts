import type { AcademicTerm } from '@uni-feedback/api-client'
import { useTranslation } from 'react-i18next'

export type TermLabelForm = 'short' | 'long'

/**
 * Returns a mapper from an academic term to its label. Standard terms get the
 * site's own words in the reader's language, the same at every faculty: "S1" in
 * compact spots (row tags, "1º ano · S1" headings), "1º Semestre" / "1st
 * Semester" where the term stands alone. Any other term (P1, a trimester, Fall)
 * shows its stored name in both forms.
 */
export function useTermLabel(): (
  term: Pick<AcademicTerm, 'name' | 'standardTerm'>,
  form: TermLabelForm
) => string {
  const { t } = useTranslation('common')
  return (term, form) =>
    term.standardTerm
      ? t(`academic_terms.${term.standardTerm}.${form}`)
      : term.name
}
