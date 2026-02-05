import { database } from '@uni-feedback/db'
import { courses, degrees, feedback } from '@uni-feedback/db/schema'
import { getWorkloadLabel } from '@uni-feedback/utils'
import { and, eq, isNotNull } from 'drizzle-orm'
import ejs from 'ejs'
import { marked } from 'marked'
import * as path from 'path'
import puppeteer, { type Browser } from 'puppeteer'
import { AIService } from './aiService'
import { NotFoundError } from './errors'

interface ReportData {
  schoolYear: number
  courseName: string
  courseCode: string
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
  submissions: Array<{
    rating: number
    workload: string
    date: string
    comment: string | null
  }>
}

export class CourseReportService {
  private env: Env
  private aiService: AIService

  constructor(env: Env) {
    this.env = env
    this.aiService = new AIService(env)
  }

  /**
   * Generate a PDF report for a course and academic year.
   *
   * @param courseId - The course ID to generate the report for
   * @param schoolYear - The academic year (e.g., 2024)
   * @returns PDF Buffer
   * @throws NotFoundError if course doesn't exist
   */
  async generateReport(courseId: number, schoolYear: number): Promise<Buffer> {
    // Fetch all report data
    const reportData = await this.fetchReportData(courseId, schoolYear)

    // Extract comments for AI analysis
    const comments = reportData.submissions
      .map((sub) => sub.comment)
      .filter(
        (comment): comment is string =>
          comment !== null && comment.trim() !== ''
      )

    // Generate AI summary
    const aiSummary = await this.aiService.generateCourseReportSummary(
      comments,
      {
        name: reportData.courseName,
        acronym: reportData.courseCode,
        avgRating: parseFloat(reportData.avgRating)
      }
    )

    // Merge AI results into report data
    const finalData: ReportData = {
      ...reportData,
      aiSummary: aiSummary.aiSummary,
      emotions: aiSummary.emotions.map(
        // Convert first letter to upper case
        (e) => e.charAt(0).toUpperCase() + e.slice(1)
      ),
      persona: aiSummary.persona,
      pros: aiSummary.pros,
      cons: aiSummary.cons
    }

    // Render EJS template to HTML
    const templatePath = path.join(
      __dirname,
      '../../templates/course_report.ejs'
    )
    const html = await ejs.renderFile(templatePath, { data: finalData })

    // Generate PDF with Puppeteer
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
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
      })

      return Buffer.from(pdfBuffer)
    } catch (error) {
      console.error(
        `PDF generation failed for course ${courseId}, year ${schoolYear}:`,
        error
      )
      throw error
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  /**
   * Fetch all data needed for the report from the database.
   *
   * @param courseId - The course ID
   * @param schoolYear - The academic year
   * @returns Aggregated report data
   * @throws NotFoundError if course doesn't exist
   */
  private async fetchReportData(
    courseId: number,
    schoolYear: number
  ): Promise<ReportData> {
    // Fetch course details with degree info
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

    // Fetch all approved feedback for this course and academic year
    const feedbackResults = await database()
      .select({
        id: feedback.id,
        rating: feedback.rating,
        workloadRating: feedback.workloadRating,
        comment: feedback.comment,
        approvedAt: feedback.approvedAt
      })
      .from(feedback)
      .where(
        and(
          eq(feedback.courseId, courseId),
          eq(feedback.schoolYear, schoolYear),
          isNotNull(feedback.approvedAt)
        )
      )

    const totalResponses = feedbackResults.length

    // Calculate statistics
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

    feedbackResults.forEach((fb) => {
      sumRating += fb.rating
      distribution[fb.rating] = (distribution[fb.rating] || 0) + 1

      if (fb.workloadRating !== null) {
        sumWorkload += fb.workloadRating
        workloadCount++
        workloadDistribution[fb.workloadRating] =
          (workloadDistribution[fb.workloadRating] || 0) + 1
      }
    })

    const avgRating =
      totalResponses > 0 ? (sumRating / totalResponses).toFixed(1) : '0.0'
    const avgWorkload =
      workloadCount > 0 ? Math.round(sumWorkload / workloadCount) : 3
    const avgWorkloadText = getWorkloadLabel(avgWorkload)

    // Format submissions with date formatting and markdown conversion
    const submissions = feedbackResults.map((fb) => ({
      rating: fb.rating,
      workload: fb.workloadRating
        ? getWorkloadLabel(fb.workloadRating)
        : 'Not specified',
      date: fb.approvedAt
        ? new Date(fb.approvedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : 'Unknown',
      comment: fb.comment ? (marked(fb.comment) as string) : null
    }))

    return {
      schoolYear: schoolYear,
      courseName: course.courseName,
      courseCode: course.courseCode,
      ects: course.ects ?? 0,
      degree: course.degreeName ?? 'Unknown Degree',
      avgRating,
      distribution,
      totalResponses,
      avgWorkloadText,
      workloadDistribution,
      totalWorkloadResponses: workloadCount,
      aiSummary: '', // Will be filled by AI service
      emotions: [], // Will be filled by AI service
      persona: '', // Will be filled by AI service
      pros: [], // Will be filled by AI service
      cons: [], // Will be filled by AI service
      submissions
    }
  }
}
