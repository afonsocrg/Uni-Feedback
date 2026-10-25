export interface Faculty {
  id: number
  name: string
  shortName: string
  url: string
  emailSuffixes?: string[]
  /** Path relative to the asset root; render with getAssetUrl. */
  logo?: string | null
}

export interface FacultyDetails extends Faculty {
  degrees: Degree[]
}

export interface Degree {
  id: number
  name: string
  acronym: string
  type: string
  facultyId: number
  courseCount?: number
  feedbackCount?: number
}

export interface CourseGroup {
  id: number
  name: string
  courseIds: number[]
}

export type StandardTerm = 'semester_1' | 'semester_2' | 'annual'

export interface AcademicTerm {
  name: string
  /** Set for the terms the site labels itself; null keeps `name` */
  standardTerm: StandardTerm | null
  startTick: number
  endTick: number
}

export interface CourseOffering {
  curriculumYear: number | null
  academicTerm: AcademicTerm
}

export interface Course {
  id: number
  name: string
  degreeId: number
  acronym: string
  url: string
  averageRating: number
  averageWorkload: number | null
  totalFeedbackCount: number
  offerings: CourseOffering[]
  hasMandatoryExam: boolean | null
  /** Last school year taught (2025 = 2025/2026); null = still taught */
  lastTaughtYear: number | null
}

export interface CourseDetail extends Course {
  description: string | null
  assessment: string | null
  degree: Degree | null
  averageWorkload: number | null
  ects: number | null
  hasMandatoryExam: boolean | null
}

export interface Feedback {
  id: number
  courseId: number
  email?: string
  schoolYear: number
  rating: number
  workloadRating: number
  comment?: string
  createdAt: string
  course: {
    id: number
    name: string
    acronym: string
  }
  degree: {
    id: number
    name: string
    acronym: string
  }
  isFromDifferentCourse: boolean
}

export interface DuplicateFeedbackDetail {
  id: number
  courseId: number
  rating: number
  workloadRating: number
  comment: string | null
  schoolYear: number
  createdAt: string
  approvedAt: string | null
  updatedAt: string
  course: {
    id: number
    name: string
    acronym: string
  }
  degree: {
    id: number
    name: string
    acronym: string
  }
}

export interface CourseSearchResult {
  id: number
  name: string
  /** Official English name, when there is one */
  nameEn?: string | null
  acronym: string
  degree: {
    id: number
    name: string
    acronym: string
  }
  faculty: {
    id: number
    name: string
    shortName: string
  }
  hasUserFeedback: boolean
  userRating: number | null
  avgRating: number | null
  reviewCount: number
  /** Last school year taught (2025 = 2025/2026); null = still taught */
  lastTaughtYear: number | null
}

export interface DegreeSearchResult {
  id: number
  name: string
  acronym: string
  slug: string | null
  faculty: {
    id: number
    name: string
    shortName: string
    slug: string | null
  }
  reviewCount: number
}

export interface DegreeSearchResponse {
  degrees: DegreeSearchResult[]
  total: number
}

export interface FacultySearchResult {
  id: number
  name: string
  shortName: string
  slug: string | null
  reviewCount: number
}

export interface FacultySearchResponse {
  faculties: FacultySearchResult[]
  total: number
}

export interface SearchFacultiesParams {
  q?: string
  limit?: number
}

export interface SearchDegreesParams {
  q?: string
  limit?: number
}

export interface CourseSearchResponse {
  courses: CourseSearchResult[]
  total: number
  limit: number
  offset: number
}

export interface SearchCoursesParams {
  q?: string
  faculty_id?: number
  degree_id?: number
  sort?: 'name' | 'review_count_asc'
  limit?: number
  offset?: number
}

export interface FeedbackRecommendation {
  id: number
  acronym: string
  name: string
}

export interface FeedbackRecommendationsResponse {
  recommendations: FeedbackRecommendation[]
}
