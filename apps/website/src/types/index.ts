export interface Course {
  id: string
  name: string
  acronym: string
  description: string
  url: string
}

export interface Feedback {
  id: string
  courseId: string
  rating: number
  comment: string
  createdAt: Date
}
