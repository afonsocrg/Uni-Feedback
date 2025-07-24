import {
  courses,
  degrees,
  faculties,
  feedback,
  users,
  getDb
} from '@db'
import { count, desc, like, and, gte, lte, sql, eq } from 'drizzle-orm'

export class DatabaseService {
  private env: Env
  private db: ReturnType<typeof getDb>

  constructor(env: Env) {
    this.env = env
    this.db = getDb(env)
  }

  // Stats methods
  async getUserCount(): Promise<number> {
    const result = await this.db.select({ count: count() }).from(users)
    return result[0]?.count || 0
  }

  async getCourseCount(): Promise<number> {
    const result = await this.db.select({ count: count() }).from(courses)
    return result[0]?.count || 0
  }

  async getFeedbackCount(): Promise<number> {
    const result = await this.db.select({ count: count() }).from(feedback)
    return result[0]?.count || 0
  }

  async getDegreeCount(): Promise<number> {
    const result = await this.db.select({ count: count() }).from(degrees)
    return result[0]?.count || 0
  }

  async getFacultyCount(): Promise<number> {
    const result = await this.db.select({ count: count() }).from(faculties)
    return result[0]?.count || 0
  }

  async getRecentFeedbackCount(days: number): Promise<number> {
    const date = new Date()
    date.setDate(date.getDate() - days)
    
    const result = await this.db
      .select({ count: count() })
      .from(feedback)
      .where(gte(feedback.createdAt, date.toISOString()))
    
    return result[0]?.count || 0
  }

  // Users methods
  async getUsers(options: {
    limit: number
    offset: number
    search?: string
  }) {
    const { limit, offset, search } = options
    
    let query = this.db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        superuser: users.superuser,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)

    if (search) {
      query = query.where(
        like(users.email, `%${search}%`)
      )
    }

    const [userResults, totalResult] = await Promise.all([
      query.orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      this.db
        .select({ count: count() })
        .from(users)
        .where(search ? like(users.email, `%${search}%`) : undefined)
    ])

    return {
      users: userResults.map(user => ({
        ...user,
        lastLoginAt: null // Since this field doesn't exist yet
      })),
      total: totalResult[0]?.count || 0
    }
  }

  // Courses methods
  async getCoursesForAdmin(options: {
    limit: number
    offset: number
    search?: string
    facultyId?: number
    degreeId?: number
  }) {
    const { limit, offset, search, facultyId, degreeId } = options

    let query = this.db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.acronym,
        credits: courses.ects,
        degreeId: courses.degreeId,
        degreeName: degrees.name,
        facultyName: faculties.name,
        feedbackCount: sql<number>`count(distinct ${feedback.id})`,
        averageRating: sql<number>`avg(${feedback.rating})`
      })
      .from(courses)
      .leftJoin(degrees, eq(courses.degreeId, degrees.id))
      .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
      .leftJoin(feedback, eq(courses.id, feedback.courseId))

    const conditions = []
    if (search) {
      conditions.push(like(courses.name, `%${search}%`))
    }
    if (facultyId) {
      conditions.push(eq(faculties.id, facultyId))
    }
    if (degreeId) {
      conditions.push(eq(degrees.id, degreeId))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const [courseResults, totalResult] = await Promise.all([
      query
        .groupBy(courses.id, degrees.name, faculties.name)
        .orderBy(desc(courses.id))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(courses)
        .leftJoin(degrees, eq(courses.degreeId, degrees.id))
        .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
    ])

    return {
      courses: courseResults.map(course => ({
        ...course,
        semester: '', // Not available in schema
        schoolYear: '', // Not available in schema
        feedbackCount: course.feedbackCount || 0,
        averageRating: course.averageRating ? Number(course.averageRating.toFixed(1)) : null
      })),
      total: totalResult[0]?.count || 0
    }
  }

  // Degrees methods
  async getDegreesForAdmin(options: {
    limit: number
    offset: number
    search?: string
    facultyId?: number
  }) {
    const { limit, offset, search, facultyId } = options

    let query = this.db
      .select({
        id: degrees.id,
        name: degrees.name,
        code: degrees.acronym,
        type: degrees.type,
        facultyId: degrees.facultyId,
        facultyName: faculties.name,
        courseCount: sql<number>`count(distinct ${courses.id})`,
        feedbackCount: sql<number>`count(distinct ${feedback.id})`,
        createdAt: degrees.createdAt
      })
      .from(degrees)
      .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
      .leftJoin(courses, eq(degrees.id, courses.degreeId))
      .leftJoin(feedback, eq(courses.id, feedback.courseId))

    const conditions = []
    if (search) {
      conditions.push(like(degrees.name, `%${search}%`))
    }
    if (facultyId) {
      conditions.push(eq(faculties.id, facultyId))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const [degreeResults, totalResult] = await Promise.all([
      query
        .groupBy(degrees.id, faculties.name)
        .orderBy(desc(degrees.id))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(degrees)
        .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
    ])

    return {
      degrees: degreeResults.map(degree => ({
        ...degree,
        courseCount: degree.courseCount || 0,
        feedbackCount: degree.feedbackCount || 0
      })),
      total: totalResult[0]?.count || 0
    }
  }

  // Faculties methods
  async getFacultiesForAdmin(options: {
    limit: number
    offset: number
    search?: string
  }) {
    const { limit, offset, search } = options

    let query = this.db
      .select({
        id: faculties.id,
        name: faculties.name,
        code: faculties.shortName,
        description: sql<string>`null`, // Not available in schema
        degreeCount: sql<number>`count(distinct ${degrees.id})`,
        courseCount: sql<number>`count(distinct ${courses.id})`,
        feedbackCount: sql<number>`count(distinct ${feedback.id})`,
        createdAt: faculties.createdAt
      })
      .from(faculties)
      .leftJoin(degrees, eq(faculties.id, degrees.facultyId))
      .leftJoin(courses, eq(degrees.id, courses.degreeId))
      .leftJoin(feedback, eq(courses.id, feedback.courseId))

    if (search) {
      query = query.where(like(faculties.name, `%${search}%`))
    }

    const [facultyResults, totalResult] = await Promise.all([
      query
        .groupBy(faculties.id)
        .orderBy(desc(faculties.id))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(faculties)
        .where(search ? like(faculties.name, `%${search}%`) : undefined)
    ])

    return {
      faculties: facultyResults.map(faculty => ({
        ...faculty,
        description: null, // Set as null since not in schema
        degreeCount: faculty.degreeCount || 0,
        courseCount: faculty.courseCount || 0,
        feedbackCount: faculty.feedbackCount || 0
      })),
      total: totalResult[0]?.count || 0
    }
  }

  // Feedback methods
  async getFeedbackForAdmin(options: {
    limit: number
    offset: number
    search?: string
    courseId?: number
    startDate?: string
    endDate?: string
  }) {
    const { limit, offset, search, courseId, startDate, endDate } = options

    let query = this.db
      .select({
        id: feedback.id,
        courseId: feedback.courseId,
        courseName: courses.name,
        courseCode: courses.acronym,
        degreeName: degrees.name,
        facultyName: faculties.name,
        overallRating: feedback.rating,
        difficultyRating: sql<number>`null`, // Not available in schema
        workloadRating: feedback.workloadRating,
        comment: feedback.comment,
        schoolYear: feedback.schoolYear,
        semester: sql<string>`''`, // Not available in schema
        createdAt: feedback.createdAt
      })
      .from(feedback)
      .leftJoin(courses, eq(feedback.courseId, courses.id))
      .leftJoin(degrees, eq(courses.degreeId, degrees.id))
      .leftJoin(faculties, eq(degrees.facultyId, faculties.id))

    const conditions = []
    if (search) {
      conditions.push(like(courses.name, `%${search}%`))
    }
    if (courseId) {
      conditions.push(eq(feedback.courseId, courseId))
    }
    if (startDate) {
      conditions.push(gte(feedback.createdAt, startDate))
    }
    if (endDate) {
      conditions.push(lte(feedback.createdAt, endDate))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const [feedbackResults, totalResult] = await Promise.all([
      query.orderBy(desc(feedback.createdAt)).limit(limit).offset(offset),
      this.db
        .select({ count: count() })
        .from(feedback)
        .leftJoin(courses, eq(feedback.courseId, courses.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
    ])

    return {
      feedback: feedbackResults.map(f => ({
        ...f,
        difficultyRating: 0, // Default since not in schema
        semester: '', // Default since not in schema
        schoolYear: f.schoolYear?.toString() || ''
      })),
      total: totalResult[0]?.count || 0
    }
  }
}