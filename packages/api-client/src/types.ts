export interface Faculty {
  id: number
  name: string
  shortName: string
  url: string
  emailSuffixes?: string[]
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

export interface Course {
  id: number
  name: string
  degreeId: number
  acronym: string
  url: string
  averageRating: number
  averageWorkload: number | null
  totalFeedbackCount: number
  terms: string[]
  hasMandatoryExam: boolean | null
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
