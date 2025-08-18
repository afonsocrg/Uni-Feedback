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
  totalFeedbackCount: number
  terms: string[]
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
  email: string
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
