import {
  Course,
  Degree,
  Faculty,
  REPORT_CATEGORY_LABELS,
  type ReportCategory
} from '@uni-feedback/db/schema'
import {
  formatSchoolYearString,
  getFeedbackPermalinkUrl,
  getWorkloadLabel
} from '@uni-feedback/utils'

// Telegram
async function sendToTelegram(env: Env, message: string) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.warn(
      'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set. Skipping telegram notification.'
    )
    console.log('Message:')
    console.log(message)
    return null
  }

  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`
  const payload = {
    chat_id: env.TELEGRAM_CHAT_ID,
    text: message.slice(0, 4096),
    parse_mode: 'Markdown'
  }

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }

  // console.log('Sending telegram request', options)
  const response = await fetch(url, options)
  // console.log('Got telegram response', response)

  return response
}

function getStarsString(rating: number) {
  // return `${rating} - ${'⭐️'.repeat(rating)}`
  // return '⭐️'.repeat(rating) + ` (${rating})`
  return '⭐️'.repeat(rating)
}

interface SendCourseReviewReceivedArgs {
  id: number
  email: string
  schoolYear: number
  course: Course
  degree: Degree
  faculty: Faculty
  rating: number
  workloadRating: number
  comment: string | null
  pointsEarned: number
}

export async function sendCourseReviewReceived(
  env: Env,
  args: SendCourseReviewReceivedArgs
) {
  const {
    id,
    schoolYear,
    course,
    degree,
    faculty,
    email,
    rating,
    workloadRating,
    comment,
    pointsEarned
  } = args

  const ratingStars = getStarsString(rating)
  const workloadLabel = getWorkloadLabel(workloadRating)

  const manageFeedbackUrl = `https://admin.uni-feedback.com/feedback/${id}`
  const viewFeedbackUrl = getFeedbackPermalinkUrl(
    'https://uni-feedback.com',
    course.id,
    id
  )

  const message = `
🎉 New Feedback!!

🎓: ${faculty.shortName} > ${degree.name} > ${course.name} > ${formatSchoolYearString(schoolYear, { yearFormat: 'long' })}

${ratingStars} - ${workloadLabel}${comment ? '\n' + comment : ''}

---
👤: ${email}
💰: +${pointsEarned} pts
[👀 View Feedback](${viewFeedbackUrl})
[📝 Manage Feedback](${manageFeedbackUrl})

Keep up the amazing work! Your platform is helping students make better course decisions! 🚀
`.trim()
  return sendToTelegram(env, message)
}

interface AdminChangeNotificationArgs {
  adminEmail: string
  adminUsername: string
  resourceType: string
  resourceId: string | number
  resourceName: string
  resourceShortName?: string
  action: 'updated' | 'created' | 'deleted' | 'added' | 'removed'
  changes?: Array<{
    field: string
    oldValue: any
    newValue: any
  }>
  addedItem?: string
  removedItem?: string
}

export async function sendAdminChangeNotification(
  env: Env,
  args: AdminChangeNotificationArgs
) {
  const {
    adminEmail,
    adminUsername,
    resourceType,
    resourceId,
    resourceName,
    resourceShortName,
    action,
    changes,
    addedItem,
    removedItem
  } = args

  let resourceDisplay = resourceName
  if (resourceShortName) {
    resourceDisplay = `${resourceShortName} - ${resourceName}`
  }

  let changesText = ''
  if (changes && changes.length > 0) {
    changesText =
      '\n\n📝 Changes:\n' +
      changes
        .map((change) => {
          const oldVal =
            change.oldValue === null ? 'null' : change.oldValue || 'empty'
          const newVal =
            change.newValue === null ? 'null' : change.newValue || 'empty'
          return `• ${change.field}: "${oldVal}" → "${newVal}"`
        })
        .join('\n')
  } else if (addedItem) {
    changesText = `\n\n➕ Added: ${addedItem}`
  } else if (removedItem) {
    changesText = `\n\n➖ Removed: ${removedItem}`
  }

  const actionEmoji =
    {
      updated: '✏️',
      created: '➕',
      deleted: '🗑️',
      added: '➕',
      removed: '➖'
    }[action] || '🔧'

  const message = `
${actionEmoji} ADMIN CHANGE ALERT! ${actionEmoji}

An admin just ${action} a ${resourceType} in the system.

👤 Admin: ${adminUsername} (${adminEmail})
📋 Resource: ${resourceType} #${resourceId}
🏷️ Name: ${resourceDisplay}
🔧 Action: ${action.toUpperCase()}${changesText}

🕒 Timestamp: ${new Date().toISOString()}
`.trim()

  return sendToTelegram(env, message)
}

interface SendEmailStatusNotificationArgs {
  email: string
  emailType: string
  success: boolean
  error?: string
}

export async function sendEmailStatusNotification(
  env: Env,
  args: SendEmailStatusNotificationArgs
) {
  const { email, emailType, success, error } = args

  const statusEmoji = success ? '✅' : '❌'
  const statusText = success ? 'SUCCESS' : 'FAILED'

  let message = `
${statusEmoji} EMAIL ${statusText} ${statusEmoji}

📧 Email Type: ${emailType}
📬 Recipient: ${email}
🕒 Timestamp: ${new Date().toISOString()}`

  if (!success && error) {
    message += `\n\n❌ Error: ${error}`
  }

  message = message.trim()

  return sendToTelegram(env, message)
}

export async function sendNewSignupNotification(env: Env, email: string) {
  const message = `
🎉 NEW SIGNUP! 🎉}

A new user has signed up on Uni Feedback!

📧 Email: ${email}
🕒 Timestamp: ${new Date().toISOString()}

Welcome aboard! 🚀
`.trim()

  return sendToTelegram(env, message)
}

interface SendAnalysisUpdateNotificationArgs {
  env: Env
  adminEmail: string
  feedbackId: number
  oldAnalysis: {
    hasTeaching: boolean
    hasAssessment: boolean
    hasMaterials: boolean
    hasTips: boolean
    wordCount: number
  } | null
  newAnalysis: {
    hasTeaching: boolean
    hasAssessment: boolean
    hasMaterials: boolean
    hasTips: boolean
    wordCount: number
  }
  oldPoints: number | null
  newPoints: number | null
  dashboardLink: string
}

interface SendReportNotificationArgs {
  reportId: number
  feedbackId: number
  category: ReportCategory
  details: string
  reporterId: number
  feedbackComment: string | null
}

export async function sendReportNotification(
  env: Env,
  args: SendReportNotificationArgs
) {
  const {
    reportId,
    feedbackId,
    category,
    details,
    reporterId,
    feedbackComment
  } = args

  const categoryLabel = REPORT_CATEGORY_LABELS[category] || category
  const truncatedDetails =
    details.length > 200 ? details.slice(0, 200) + '...' : details
  const manageFeedbackUrl = `https://admin.uni-feedback.com/feedback/${feedbackId}`

  const message = `
🚨 FEEDBACK REPORT!

A user has reported feedback for moderation.

📋 Report ID: #${reportId}
📋 Feedback ID: #${feedbackId}
👤 Reporter ID: #${reporterId}
🏷️ Category: ${categoryLabel}

💬 Details: ${truncatedDetails}

🕒 Timestamp: ${new Date().toISOString()}

🔗 Review Feedback: ${manageFeedbackUrl}

📝 Feedback Comment: ${feedbackComment}
`.trim()

  return sendToTelegram(env, message)
}

export async function sendAnalysisUpdateNotification(
  args: SendAnalysisUpdateNotificationArgs
) {
  const {
    env,
    adminEmail,
    feedbackId,
    oldAnalysis,
    newAnalysis,
    oldPoints,
    newPoints,
    dashboardLink
  } = args

  const isNewAnalysis = oldAnalysis === null

  // Build analysis changes text
  let analysisChanges = ''
  if (isNewAnalysis) {
    analysisChanges = `
📊 Analysis Created:
• Teaching: ${newAnalysis.hasTeaching ? '✅' : '❌'}
• Assessment: ${newAnalysis.hasAssessment ? '✅' : '❌'}
• Materials: ${newAnalysis.hasMaterials ? '✅' : '❌'}
• Tips: ${newAnalysis.hasTips ? '✅' : '❌'}
• Word Count: ${newAnalysis.wordCount}`
  } else {
    const changes = []
    if (oldAnalysis.hasTeaching !== newAnalysis.hasTeaching) {
      changes.push(
        `• Teaching: ${oldAnalysis.hasTeaching ? '✅' : '❌'} → ${newAnalysis.hasTeaching ? '✅' : '❌'}`
      )
    }
    if (oldAnalysis.hasAssessment !== newAnalysis.hasAssessment) {
      changes.push(
        `• Assessment: ${oldAnalysis.hasAssessment ? '✅' : '❌'} → ${newAnalysis.hasAssessment ? '✅' : '❌'}`
      )
    }
    if (oldAnalysis.hasMaterials !== newAnalysis.hasMaterials) {
      changes.push(
        `• Materials: ${oldAnalysis.hasMaterials ? '✅' : '❌'} → ${newAnalysis.hasMaterials ? '✅' : '❌'}`
      )
    }
    if (oldAnalysis.hasTips !== newAnalysis.hasTips) {
      changes.push(
        `• Tips: ${oldAnalysis.hasTips ? '✅' : '❌'} → ${newAnalysis.hasTips ? '✅' : '❌'}`
      )
    }

    if (changes.length > 0) {
      analysisChanges = '\n\n📝 Analysis Changes:\n' + changes.join('\n')
    }
  }

  // Build points changes text
  let pointsText = ''
  if (newPoints !== null) {
    if (oldPoints === null) {
      pointsText = `\n\n💰 Points Awarded: ${newPoints} points`
    } else if (oldPoints !== newPoints) {
      pointsText = `\n\n💰 Points Updated: ${oldPoints} → ${newPoints} points (${newPoints > oldPoints ? '+' : ''}${newPoints - oldPoints})`
    }
  }

  const message = `
🔍 FEEDBACK ANALYSIS ${isNewAnalysis ? 'CREATED' : 'UPDATED'}! 🔍

An admin just ${isNewAnalysis ? 'created' : 'updated'} feedback analysis.

👤 Admin: ${adminEmail}
📋 Feedback ID: #${feedbackId}${analysisChanges}${pointsText}

🔗 View Feedback: ${dashboardLink}

🕒 Timestamp: ${new Date().toISOString()}
`.trim()

  return sendToTelegram(env, message)
}

interface SendReportGenerationAlertArgs {
  courseId: number
  schoolYear: number
  success: boolean
  error?: string
}

export async function sendReportGenerationAlert(
  env: Env,
  args: SendReportGenerationAlertArgs
) {
  const { courseId, schoolYear, success, error } = args

  const statusEmoji = success ? '✅' : '❌'
  const statusText = success ? 'SUCCESS' : 'FAILED'

  let message = `
${statusEmoji} COURSE REPORT GENERATION ${statusText} ${statusEmoji}

📋 Course ID: ${courseId}
📅 School Year: ${schoolYear}
🕒 Timestamp: ${new Date().toISOString()}`

  if (!success && error) {
    message += `\n\n❌ Error: ${error}`
  }

  message = message.trim()

  return sendToTelegram(env, message)
}

interface SendDegreeReportGenerationAlertArgs {
  degreeId: number
  schoolYear: number
  success: boolean
  error?: string
}

export async function sendDegreeReportGenerationAlert(
  env: Env,
  args: SendDegreeReportGenerationAlertArgs
) {
  const { degreeId, schoolYear, success, error } = args

  const statusEmoji = success ? '✅' : '❌'
  const statusText = success ? 'SUCCESS' : 'FAILED'

  let message = `
${statusEmoji} SEMESTER REPORT GENERATION ${statusText} ${statusEmoji}

🎓 Degree ID: ${degreeId}
📅 School Year: ${schoolYear}
🕒 Timestamp: ${new Date().toISOString()}`

  if (!success && error) {
    message += `\n\n❌ Error: ${error}`
  }

  message = message.trim()

  return sendToTelegram(env, message)
}

interface SendFeedbackExportNotificationArgs {
  userEmail: string
  filters: {
    faculty_id?: number
    faculty_name?: string | null
    degree_id?: number
    degree_name?: string | null
    course_id?: number
    course_name?: string | null
    terms?: string[]
    school_year?: number
    from_school_year?: number
    to_school_year?: number
    rating?: number
    from_rating?: number
    to_rating?: number
    workload_rating?: number
    from_workload_rating?: number
    to_workload_rating?: number
    has_comment?: boolean
    is_approved?: boolean | null
    created_after?: string
    created_before?: string
  }
}

export async function sendFeedbackExportNotification(
  env: Env,
  args: SendFeedbackExportNotificationArgs
) {
  const { userEmail, filters } = args

  // Build resource hierarchy header if available
  const hierarchyParts: string[] = []
  if (filters.faculty_name) hierarchyParts.push(filters.faculty_name)
  if (filters.degree_name) hierarchyParts.push(filters.degree_name)
  if (filters.course_name) hierarchyParts.push(filters.course_name)

  let resourceHeader = ''
  if (hierarchyParts.length > 0) {
    resourceHeader = `\n🎓 ${hierarchyParts.join(' > ')}\n`
  }

  // Format filters for the message
  const filterDetails: string[] = []

  // Show names instead of IDs when available
  if (filters.faculty_id !== undefined && !filters.faculty_name)
    filterDetails.push(`Faculty ID: ${filters.faculty_id}`)
  if (filters.degree_id !== undefined && !filters.degree_name)
    filterDetails.push(`Degree ID: ${filters.degree_id}`)
  if (filters.course_id !== undefined && !filters.course_name)
    filterDetails.push(`Course ID: ${filters.course_id}`)

  if (filters.school_year !== undefined)
    filterDetails.push(`School Year: ${filters.school_year}`)
  if (filters.from_school_year !== undefined)
    filterDetails.push(`From School Year: ${filters.from_school_year}`)
  if (filters.to_school_year !== undefined)
    filterDetails.push(`To School Year: ${filters.to_school_year}`)
  if (filters.rating !== undefined)
    filterDetails.push(`Rating: ${filters.rating}`)
  if (filters.from_rating !== undefined)
    filterDetails.push(`From Rating: ${filters.from_rating}`)
  if (filters.to_rating !== undefined)
    filterDetails.push(`To Rating: ${filters.to_rating}`)
  if (filters.workload_rating !== undefined)
    filterDetails.push(`Workload: ${getWorkloadLabel(filters.workload_rating)}`)
  if (filters.from_workload_rating !== undefined)
    filterDetails.push(
      `From Workload: ${getWorkloadLabel(filters.from_workload_rating)}`
    )
  if (filters.to_workload_rating !== undefined)
    filterDetails.push(
      `To Workload: ${getWorkloadLabel(filters.to_workload_rating)}`
    )
  if (filters.has_comment !== undefined)
    filterDetails.push(`Has Comment: ${filters.has_comment}`)
  if (filters.is_approved !== undefined)
    filterDetails.push(
      `Approved: ${filters.is_approved === null ? 'all' : filters.is_approved}`
    )
  if (filters.created_after !== undefined)
    filterDetails.push(`Created After: ${filters.created_after}`)
  if (filters.created_before !== undefined)
    filterDetails.push(`Created Before: ${filters.created_before}`)
  if (filters.terms && filters.terms.length > 0)
    filterDetails.push(`Terms: ${filters.terms.join(', ')}`)

  const message = `
📊 FEEDBACK EXPORT

A user has exported feedback data.${resourceHeader}
👤 User: ${userEmail}
🕒 Timestamp: ${new Date().toISOString()}

🔍 Filters:
${filterDetails.length > 0 ? filterDetails.map((f) => `• ${f}`).join('\n') : '• No filters applied'}
`.trim()

  return sendToTelegram(env, message)
}
