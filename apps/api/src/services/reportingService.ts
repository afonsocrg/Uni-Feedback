import { database } from '@uni-feedback/db'
import { courses, degrees, feedback, reports } from '@uni-feedback/db/schema'
import { getWorkloadLabel } from '@uni-feedback/utils'
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm'
import ejs from 'ejs'
import { marked } from 'marked'
import * as path from 'path'
import puppeteer, { type Browser } from 'puppeteer'
import QRCode from 'qrcode'
import { AIService } from './aiService'
import { NotFoundError } from './errors'
import { R2Service } from './r2Service'
import {
  sendDegreeReportGenerationAlert,
  sendReportGenerationAlert
} from './telegram'

// ===== Data Interfaces =====

interface CourseReportData {
  schoolYear: number
  courseName: string
  courseCode: string
  courseId: number
  ects: number
  degree: string
  avgRating: string
  distribution: { [key: number]: number }
  totalResponses: number
  avgWorkloadText: string
  workloadDistribution: { [key: number]: number }
  totalWorkloadResponses: number
  aiSummary: string
  emotions: string[]
  persona: string
  pros: string[]
  cons: string[]
  websiteUrl: string
  generatedDate: string
  qrCodeDataUrl: string
  submissions: Array<{
    id: number
    rating: number
    workload: string
    date: string | null
    comment: string | null
  }>
}

export interface ReportFilters {
  curriculumYear?: number
  terms?: string[]
}

interface CourseSummary {
  courseId: number
  courseCode: string
  courseName: string
  ects: number
  avgRating: number | null
  avgWorkload: number | null
  totalResponses: number
  ratingDistribution: { [key: number]: number }
  workloadDistribution: { [key: number]: number }
  comments: string[]
  feedbacks: Array<{
    rating: number
    workload: number | null
    comment: string | null
  }>
}

export interface SemesterReportData {
  degree: string
  degreeId: number
  schoolYear: number
  filters: ReportFilters

  // Section 1 - Overview
  totalFeedbackCount: number
  totalFeedbackWithComments: number
  systemicTrends: string[]
  courses: Array<{
    courseId: number
    courseCode: string
    courseName: string
    avgRating: number | null
    avgWorkload: number | null
    quadrant:
      | 'gold_standard'
      | 'optimal_efficiency'
      | 'critical_friction'
      | 'under_engaged'
      | null
  }>
  matrixByQuadrant: {
    gold_standard: Array<{ courseCode: string; courseId: number }>
    optimal_efficiency: Array<{ courseCode: string; courseId: number }>
    critical_friction: Array<{ courseCode: string; courseId: number }>
    under_engaged: Array<{ courseCode: string; courseId: number }>
  }

  // Section 2 - Champions & Priority
  champions: Array<{
    courseId: number
    courseCode: string
    courseName: string
    diagnostic: string
  }>
  priorityForReview: Array<{
    courseId: number
    courseCode: string
    courseName: string
    diagnostic: string
  }>
  comparativeIndex: Array<{
    courseId: number
    courseCode: string
    courseName: string
    ects: number
    participation: number
    avgRating: number | null
    avgWorkloadText: string
    classification: string
  }>

  // Section 3 - Course deep dives
  courseDeepDives: Array<{
    courseId: number
    courseName: string
    courseCode: string
    ects: number
    avgRating: number | null
    avgWorkload: number | null
    avgWorkloadText: string
    ratingDistribution: { [key: number]: number }
    workloadDistribution: { [key: number]: number }
    executiveSummary: string
    strengths: string[]
    improvements: string[]
    persona: string
    coordinatorNote: string
  }>

  websiteUrl: string
  generatedDate: string
}

// ===== Helper: Calculate Stats =====

function calculateStats(
  items: Array<{ rating: number; workloadRating: number | null }>
) {
  let sumRating = 0
  let sumWorkload = 0
  let workloadCount = 0
  const distribution: { [key: number]: number } = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  }
  const workloadDistribution: { [key: number]: number } = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  }

  for (const item of items) {
    sumRating += item.rating
    distribution[item.rating] = (distribution[item.rating] || 0) + 1

    if (item.workloadRating !== null) {
      sumWorkload += item.workloadRating
      workloadCount++
      workloadDistribution[item.workloadRating] =
        (workloadDistribution[item.workloadRating] || 0) + 1
    }
  }

  const count = items.length
  const avgRating = count > 0 ? sumRating / count : 0
  const avgWorkload =
    workloadCount > 0 ? Math.round(sumWorkload / workloadCount) : null

  return {
    avgRating,
    avgWorkload,
    workloadCount,
    distribution,
    workloadDistribution
  }
}

function classifyCourse(
  avgRating: number | null,
  avgWorkload: number | null
):
  | 'gold_standard'
  | 'optimal_efficiency'
  | 'critical_friction'
  | 'under_engaged'
  | null {
  if (avgRating === null || avgWorkload === null) return null

  const highRating = avgRating >= 3.8
  const highWorkload = avgWorkload < 2.5

  if (highRating && highWorkload) return 'gold_standard'
  if (highRating && !highWorkload) return 'optimal_efficiency'
  if (!highRating && highWorkload) return 'critical_friction'
  return 'under_engaged'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// ===== ReportingService =====

export class ReportingService {
  private env: Env
  private aiService: AIService
  private r2Service: R2Service

  constructor(env: Env) {
    this.env = env
    this.aiService = new AIService(env)
    this.r2Service = new R2Service(env)
  }

  // ===== Data Primitives =====

  /**
   * Fetch approved feedback for a course and school year.
   */
  private async getFeedbackForCourse(courseId: number, schoolYear: number) {
    return await database()
      .select({
        id: feedback.id,
        rating: feedback.rating,
        workloadRating: feedback.workloadRating,
        comment: feedback.comment,
        createdAt: feedback.createdAt
      })
      .from(feedback)
      .where(
        and(
          eq(feedback.courseId, courseId),
          eq(feedback.schoolYear, schoolYear),
          isNotNull(feedback.approvedAt)
        )
      )
      .orderBy(desc(feedback.createdAt))
  }

  /**
   * Fetch approved feedback for all courses in a degree.
   * Optionally filter by curriculum year and/or terms.
   */
  private async getFeedbackForDegree(
    degreeId: number,
    schoolYear: number,
    filters?: ReportFilters
  ) {
    // Get courses for this degree
    const degreeCoursesQuery = database()
      .select({
        courseId: courses.id,
        courseCode: courses.acronym,
        courseName: courses.name,
        ects: courses.ects,
        curriculumYear: courses.curriculumYear,
        terms: courses.terms
      })
      .from(courses)
      .where(eq(courses.degreeId, degreeId))

    const degreeCourses = await degreeCoursesQuery

    let filteredCourses = degreeCourses

    // Apply curriculum year filter
    if (filters?.curriculumYear !== undefined) {
      filteredCourses = filteredCourses.filter(
        (c) => c.curriculumYear === filters.curriculumYear
      )
    }

    // Apply terms filter
    if (filters?.terms !== undefined && filters.terms.length > 0) {
      filteredCourses = filteredCourses.filter(
        (c) =>
          c.terms !== null && c.terms.some((t) => filters.terms!.includes(t))
      )
    }

    type FeedbackRow = {
      id: number
      courseId: number
      rating: number
      workloadRating: number | null
      comment: string | null
      createdAt: Date | null
    }
    if (filteredCourses.length === 0) {
      return {
        courses: [] as typeof filteredCourses,
        feedbackByCourse: new Map<number, FeedbackRow[]>()
      }
    }

    const courseIds = filteredCourses.map((c) => c.courseId)

    // Fetch all feedback for these courses in one query
    const allFeedback = await database()
      .select({
        id: feedback.id,
        courseId: feedback.courseId,
        rating: feedback.rating,
        workloadRating: feedback.workloadRating,
        comment: feedback.comment,
        createdAt: feedback.createdAt
      })
      .from(feedback)
      .where(
        and(
          inArray(feedback.courseId, courseIds),
          eq(feedback.schoolYear, schoolYear),
          isNotNull(feedback.approvedAt)
        )
      )
      .orderBy(desc(feedback.createdAt))

    // Group by course
    const feedbackByCourse = new Map<number, typeof allFeedback>()
    for (const fb of allFeedback) {
      if (!feedbackByCourse.has(fb.courseId)) {
        feedbackByCourse.set(fb.courseId, [])
      }
      feedbackByCourse.get(fb.courseId)!.push(fb)
    }

    return { courses: filteredCourses, feedbackByCourse }
  }

  // ===== PDF Utilities =====

  /**
   * Render an EJS template with data.
   */
  private async renderTemplate(
    templateName: string,
    data: any
  ): Promise<string> {
    const templatePath = path.join(process.cwd(), `templates/${templateName}`)
    return await ejs.renderFile(templatePath, { data })
  }

  /**
   * Generate PDF from HTML using Puppeteer.
   */
  private async generatePDF(html: string, footerHtml: string): Promise<Buffer> {
    let browser: Browser | null = null
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: footerHtml
      })

      return Buffer.from(pdfBuffer)
    } catch (error) {
      console.error('PDF generation failed:', error)
      throw error
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  // ===== Report Aggregators =====

  /**
   * Build a course report: fetch data, generate AI insights, render PDF.
   */
  async buildCourseReport(
    courseId: number,
    schoolYear: number
  ): Promise<{ pdfBuffer: Buffer; aiSummaryJson: any }> {
    // Fetch course details
    const courseResult = await database()
      .select({
        courseName: courses.name,
        courseCode: courses.acronym,
        ects: courses.ects,
        degreeName: degrees.name
      })
      .from(courses)
      .leftJoin(degrees, eq(courses.degreeId, degrees.id))
      .where(eq(courses.id, courseId))
      .limit(1)

    if (courseResult.length === 0) {
      throw new NotFoundError(`Course with ID ${courseId} not found`)
    }

    const course = courseResult[0]
    const feedbackResults = await this.getFeedbackForCourse(
      courseId,
      schoolYear
    )
    const totalResponses = feedbackResults.length

    // Calculate stats
    const {
      avgRating,
      avgWorkload,
      workloadCount,
      distribution,
      workloadDistribution
    } = calculateStats(feedbackResults)

    const avgRatingStr = totalResponses > 0 ? avgRating.toFixed(1) : '0.0'
    const avgWorkloadText = getWorkloadLabel(avgWorkload)

    // Format submissions
    const submissions = feedbackResults.map((fb) => {
      let formattedDate = null
      if (fb.createdAt) {
        const date = new Date(fb.createdAt)
        const timestamp = date.getTime()
        if (timestamp > 0 && !isNaN(timestamp)) {
          formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        }
      }

      return {
        id: fb.id,
        rating: fb.rating,
        workload: fb.workloadRating
          ? getWorkloadLabel(fb.workloadRating)
          : 'Not specified',
        date: formattedDate,
        comment: fb.comment ? (marked(fb.comment) as string) : null
      }
    })

    // Generate QR code
    const courseUrl = `${this.env.WEBSITE_URL}/courses/${courseId}`
    const qrCodeDataUrl = await QRCode.toDataURL(courseUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 200
    })

    // Extract raw comments for AI
    const rawComments = feedbackResults
      .map((fb) => fb.comment)
      .filter((c): c is string => c !== null && c.trim() !== '')

    // Generate AI insights
    const aiSummary = await this.aiService.generateCourseInsights(rawComments, {
      name: course.courseName,
      acronym: course.courseCode,
      avgRating: avgRating
    })

    const reportData: CourseReportData = {
      schoolYear,
      courseName: course.courseName,
      courseCode: course.courseCode,
      courseId,
      ects: course.ects ?? 0,
      degree: course.degreeName ?? 'Unknown Degree',
      avgRating: avgRatingStr,
      distribution,
      totalResponses,
      avgWorkloadText,
      workloadDistribution,
      totalWorkloadResponses: workloadCount,
      aiSummary: aiSummary.aiSummary,
      emotions: aiSummary.emotions.map(
        (e) => e.charAt(0).toUpperCase() + e.slice(1)
      ),
      persona: aiSummary.persona,
      pros: aiSummary.pros,
      cons: aiSummary.cons,
      websiteUrl: this.env.WEBSITE_URL,
      generatedDate: formatDate(),
      qrCodeDataUrl,
      submissions
    }

    const html = await this.renderTemplate('course_report.ejs', reportData)
    const footerHtml = `<div style="width:100%;font-size:9px;color:#94a3b8;font-family:Arial,sans-serif;display:flex;justify-content:space-between;padding:0 15mm;box-sizing:border-box;"><span>Created by <a href="${reportData.websiteUrl}" target="_blank" style="color:inherit;">Uni Feedback</a> &middot; Empowering students with honest, anonymous insights.</span><span>${reportData.generatedDate}</span></div>`
    const pdfBuffer = await this.generatePDF(html, footerHtml)

    return { pdfBuffer, aiSummaryJson: aiSummary }
  }

  /**
   * Build a semester report: aggregate data for all courses in a degree,
   * generate AI insights per course and at the degree level.
   */
  async buildSemesterReport(
    degreeId: number,
    schoolYear: number,
    filters?: ReportFilters
  ): Promise<{ pdfBuffer: Buffer; aiSummaryJson: any }> {
    // Fetch degree info
    const degreeResult = await database()
      .select({ name: degrees.name })
      .from(degrees)
      .where(eq(degrees.id, degreeId))
      .limit(1)

    if (degreeResult.length === 0) {
      throw new NotFoundError(`Degree with ID ${degreeId} not found`)
    }

    const { courses: degreeCourses, feedbackByCourse } =
      await this.getFeedbackForDegree(degreeId, schoolYear, filters)

    // Build per-course summaries
    const courseSummaries: CourseSummary[] = []
    let totalFeedbackCount = 0
    let totalFeedbackWithComments = 0

    for (const course of degreeCourses) {
      const courseFeedback = feedbackByCourse.get(course.courseId) || []

      totalFeedbackCount += courseFeedback.length

      const rawComments = courseFeedback
        .map((fb) => fb.comment)
        .filter((c): c is string => c !== null && c.trim() !== '')

      totalFeedbackWithComments += rawComments.length

      const {
        avgRating: computedAvgRating,
        avgWorkload: computedAvgWorkload,
        distribution,
        workloadDistribution
      } = calculateStats(courseFeedback)

      const avgRating = courseFeedback.length > 0 ? computedAvgRating : null
      const avgWorkload = courseFeedback.length > 0 ? computedAvgWorkload : null

      courseSummaries.push({
        courseId: course.courseId,
        courseCode: course.courseCode,
        courseName: course.courseName,
        ects: course.ects ?? 0,
        avgRating,
        avgWorkload,
        totalResponses: courseFeedback.length,
        ratingDistribution: distribution,
        workloadDistribution,
        comments: rawComments,
        feedbacks: courseFeedback.map((fb) => ({
          rating: fb.rating,
          workload: fb.workloadRating,
          comment: fb.comment
        }))
      })
    }

    // Generate AI semester insights
    const aiResult = await this.aiService.generateDegreeInsights(
      courseSummaries.map((cs) => ({
        courseName: cs.courseName,
        courseCode: cs.courseCode,
        ects: cs.ects,
        avgRating: cs.avgRating,
        avgWorkload: cs.avgWorkload,
        ratingDistribution: cs.ratingDistribution,
        workloadDistribution: cs.workloadDistribution,
        feedbacks: cs.feedbacks
      }))
    )

    // Build friction matrix courses
    const matrixCourses = courseSummaries.map((cs) => ({
      courseId: cs.courseId,
      courseCode: cs.courseCode,
      courseName: cs.courseName,
      avgRating: cs.avgRating,
      avgWorkload: cs.avgWorkload,
      quadrant: classifyCourse(cs.avgRating, cs.avgWorkload)
    }))

    // Group courses by quadrant
    const matrixByQuadrant: SemesterReportData['matrixByQuadrant'] = {
      gold_standard: [],
      optimal_efficiency: [],
      critical_friction: [],
      under_engaged: []
    }
    for (const course of matrixCourses) {
      if (course.quadrant !== null) {
        matrixByQuadrant[course.quadrant].push({
          courseCode: course.courseCode,
          courseId: course.courseId
        })
      }
    }

    // Build champions and priority lists from AI reasoning
    const champions = (aiResult.championsReasoning || []).map((c) => {
      const course = courseSummaries.find((cs) => cs.courseCode === c.code)
      return {
        courseId: course?.courseId ?? 0,
        courseCode: c.code,
        courseName: course?.courseName ?? c.code,
        diagnostic: c.reason
      }
    })

    const priorityForReview = (aiResult.priorityReasoning || []).map((c) => {
      const course = courseSummaries.find((cs) => cs.courseCode === c.code)
      return {
        courseId: course?.courseId ?? 0,
        courseCode: c.code,
        courseName: course?.courseName ?? c.code,
        diagnostic: c.reason
      }
    })

    // Build comparative index
    const comparativeIndex = courseSummaries.map((cs) => ({
      courseId: cs.courseId,
      courseCode: cs.courseCode,
      courseName: cs.courseName,
      ects: cs.ects,
      participation: cs.totalResponses,
      avgRating: cs.avgRating,
      avgWorkloadText:
        cs.avgWorkload !== null ? getWorkloadLabel(cs.avgWorkload) : null,
      classification:
        classifyCourse(cs.avgRating, cs.avgWorkload)?.replace(/_/g, ' ') ?? '--'
    }))

    // Build deep dives with per-course AI insights
    const courseDeepDives = courseSummaries.map((cs) => {
      const perCourse = (aiResult.perCourse || []).find(
        (pc) => pc.code === cs.courseCode
      )
      return {
        courseId: cs.courseId,
        courseName: cs.courseName,
        courseCode: cs.courseCode,
        ects: cs.ects,
        avgRating: cs.avgRating,
        avgWorkload: cs.avgWorkload,
        avgWorkloadText:
          cs.avgWorkload !== null ? getWorkloadLabel(cs.avgWorkload) : null,
        ratingDistribution: cs.ratingDistribution,
        workloadDistribution: cs.workloadDistribution,
        executiveSummary:
          perCourse?.executiveSummary ?? 'No AI analysis available.',
        strengths: perCourse?.strengths ?? [],
        improvements: perCourse?.improvements ?? [],
        persona: perCourse?.persona ?? '',
        coordinatorNote: perCourse?.coordinatorNote ?? ''
      }
    })

    const reportData: SemesterReportData = {
      degree: degreeResult[0].name,
      degreeId,
      schoolYear,
      filters: filters ?? {},
      totalFeedbackCount,
      totalFeedbackWithComments,
      systemicTrends: aiResult.systemicTrends ?? [],
      courses: matrixCourses,
      matrixByQuadrant,
      champions,
      priorityForReview,
      comparativeIndex,
      courseDeepDives,
      websiteUrl: this.env.WEBSITE_URL,
      generatedDate: formatDate()
    }

    const html = await this.renderTemplate('degree_report.ejs', reportData)
    const footerHtml = `<div style="width:100%;font-size:9px;color:#94a3b8;font-family:Arial,sans-serif;display:flex;justify-content:space-between;padding:0 15mm;box-sizing:border-box;"><span>Created by <a href="${reportData.websiteUrl}" target="_blank" style="color:inherit;">Uni Feedback</a> &middot; Empowering students with honest, anonymous insights.</span><span>${reportData.generatedDate}</span></div>`
    const pdfBuffer = await this.generatePDF(html, footerHtml)

    return { pdfBuffer, aiSummaryJson: aiResult }
  }

  // ===== Storage Helpers =====

  /**
   * Generate, upload, record in DB and return presigned URL for a course report.
   */
  async generateAndStoreCourseReport(
    courseId: number,
    schoolYear: number,
    createdBy?: number
  ): Promise<string> {
    const { pdfBuffer, aiSummaryJson } = await this.buildCourseReport(
      courseId,
      schoolYear
    )

    const r2Key = this.r2Service.generateCourseReportKey(courseId, schoolYear)
    await this.r2Service.uploadPDF(r2Key, pdfBuffer)

    await database()
      .insert(reports)
      .values({
        reportType: 'course',
        resourceType: 'course',
        resourceId: courseId,
        parameters: { schoolYear },
        r2Key,
        aiSummaryJson,
        createdBy: createdBy ?? null
      })

    try {
      await sendReportGenerationAlert(this.env, {
        courseId,
        schoolYear,
        success: true
      })
    } catch (e) {
      console.error('Failed to send report generation alert:', e)
    }

    return this.r2Service.getPresignedUrl(r2Key)
  }

  /**
   * Generate, upload, record in DB and return presigned URL for a semester report.
   */
  async generateAndStoreDegreeReport(
    degreeId: number,
    schoolYear: number,
    filters?: ReportFilters,
    createdBy?: number
  ): Promise<string> {
    const { pdfBuffer, aiSummaryJson } = await this.buildSemesterReport(
      degreeId,
      schoolYear,
      filters
    )

    const r2Key = this.r2Service.generateDegreeReportKey(degreeId, schoolYear)
    await this.r2Service.uploadPDF(r2Key, pdfBuffer)

    await database()
      .insert(reports)
      .values({
        reportType: 'semester',
        resourceType: 'degree',
        resourceId: degreeId,
        parameters: { schoolYear, ...filters },
        r2Key,
        aiSummaryJson,
        createdBy: createdBy ?? null
      })

    try {
      await sendDegreeReportGenerationAlert(this.env, {
        degreeId,
        schoolYear,
        success: true
      })
    } catch (e) {
      console.error('Failed to send semester report generation alert:', e)
    }

    return this.r2Service.getPresignedUrl(r2Key)
  }
}
