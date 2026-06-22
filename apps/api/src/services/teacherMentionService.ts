import { database } from '@uni-feedback/db'
import {
  coursesTeachers,
  feedbackFull,
  feedbackTeachers,
  teachers
} from '@uni-feedback/db/schema'
import { eq } from 'drizzle-orm'

const TEACHING_STAFF_TERMS = [
  'corpo docente',
  'pessoal docente',
  'equipa docente',
  'docentes',
  'professores',
  'professoras',
  'teachers',
  'teaching staff',
  'teaching assistants',
  "ta's",
  'lecturers',
  'instructors'
]

const GENERAL_SINGULAR_TEACHING_STAFF_PATTERNS = [
  '(nenhum|nenhuma|qualquer|todo|toda|cada|sem) (docente|professor|professora)',
  '(no|any|every|each|without) (teacher|instructor|lecturer|teaching assistant|ta)'
]

interface TeacherMentionCandidate {
  id: number
  name: string
  email: string | null
}

export class TeacherMentionService {
  async processFeedbackMentions(args: {
    feedbackId: number
    courseId: number
    originalComment: string | null
  }) {
    const normalizedComment = normalizeText(args.originalComment ?? '')
    const mentionsTeachingStaff =
      mentionsTeachingStaffGenerally(normalizedComment)

    const mentionedTeacherIds = normalizedComment
      ? await this.findMentionedTeacherIds(args.courseId, normalizedComment)
      : []

    await database().transaction(async (tx) => {
      await tx
        .update(feedbackFull)
        .set({ mentionsTeachingStaff })
        .where(eq(feedbackFull.id, args.feedbackId))

      await tx
        .delete(feedbackTeachers)
        .where(eq(feedbackTeachers.feedbackId, args.feedbackId))

      if (mentionedTeacherIds.length === 0) {
        return
      }

      await tx.insert(feedbackTeachers).values(
        mentionedTeacherIds.map((teacherId) => ({
          feedbackId: args.feedbackId,
          teacherId
        }))
      )
    })

    return {
      mentionsTeachingStaff,
      mentionedTeacherIds
    }
  }

  private async findMentionedTeacherIds(
    courseId: number,
    normalizedComment: string
  ) {
    const candidates = await database()
      .select({
        id: teachers.id,
        name: teachers.name,
        email: teachers.email
      })
      .from(coursesTeachers)
      .innerJoin(teachers, eq(coursesTeachers.teacherId, teachers.id))
      .where(eq(coursesTeachers.courseId, courseId))

    return candidates
      .filter((teacher) => mentionsTeacher(normalizedComment, teacher))
      .map((teacher) => teacher.id)
  }
}

function mentionsAnyTerm(normalizedText: string, terms: string[]) {
  return terms.some((term) =>
    containsPhrase(normalizedText, normalizeText(term))
  )
}

function mentionsTeachingStaffGenerally(normalizedText: string) {
  return (
    mentionsAnyTerm(normalizedText, TEACHING_STAFF_TERMS) ||
    mentionsAnyPattern(normalizedText, GENERAL_SINGULAR_TEACHING_STAFF_PATTERNS)
  )
}

function mentionsAnyPattern(normalizedText: string, patterns: string[]) {
  return patterns.some((pattern) =>
    new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`).test(normalizedText)
  )
}

function mentionsTeacher(
  normalizedText: string,
  teacher: TeacherMentionCandidate
) {
  return getTeacherAliases(teacher).some((alias) =>
    containsPhrase(normalizedText, alias)
  )
}

function getTeacherAliases(teacher: TeacherMentionCandidate) {
  const normalizedName = normalizeText(teacher.name)
  const nameParts = normalizedName.split(' ').filter(Boolean)
  const aliases = new Set<string>()

  if (normalizedName.length >= 5) {
    aliases.add(normalizedName)
  }

  if (nameParts.length >= 2) {
    const firstAndLast = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
    if (firstAndLast.length >= 5) {
      aliases.add(firstAndLast)
    }
  }

  if (teacher.email) {
    const emailLocalPart = normalizeText(teacher.email.split('@')[0])
    if (emailLocalPart.length >= 5) {
      aliases.add(emailLocalPart)
    }
  }

  return Array.from(aliases)
}

function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function containsPhrase(normalizedText: string, normalizedPhrase: string) {
  if (!normalizedText || !normalizedPhrase) {
    return false
  }

  const escapedPhrase = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${escapedPhrase}([^a-z0-9]|$)`).test(
    normalizedText
  )
}
