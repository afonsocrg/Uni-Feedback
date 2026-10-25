import { database, schema } from '@uni-feedback/db'
import { eq } from 'drizzle-orm'
import type { Lang } from '~/i18n/config'
import type { CrumbUniversity } from '~/utils/breadcrumbs'
import { pickName } from '~/utils/localizedContent'

/** A faculty's university, for its pages' breadcrumbs and JSON-LD */
export async function loadCrumbUniversity(
  universityId: number | null,
  lang: Lang
): Promise<CrumbUniversity | null> {
  if (universityId === null) return null
  const [row] = await database()
    .select({
      slug: schema.universities.slug,
      name: schema.universities.name,
      nameEn: schema.universities.nameEn,
      shortName: schema.universities.shortName
    })
    .from(schema.universities)
    .where(eq(schema.universities.id, universityId))
  return row
    ? {
        slug: row.slug,
        name: pickName(lang, row.name, row.nameEn).value,
        shortName: row.shortName
      }
    : null
}
