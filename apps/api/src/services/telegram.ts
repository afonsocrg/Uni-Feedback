import { Course, Degree } from '@uni-feedback/db/schema'
import { formatSchoolYearString } from '@uni-feedback/utils'

// Telegram
async function sendToTelegram(env: Env, message: string) {
  // Escape special characters for MarkdownV2 format
  message = message.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\$1')

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
    text: message.slice(0, 4096)
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
  return `${rating} - ${'⭐️'.repeat(rating)}`
  // return '⭐️'.repeat(rating) + ` (${rating})`
}

interface SendCourseReviewReceivedArgs {
  id: number
  email: string
  schoolYear: number
  course: Course
  degree: Degree
  rating: number
  workloadRating: number
  comment: string | null
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
    email,
    rating,
    workloadRating,
    comment
  } = args

  const ratingStars = getStarsString(rating)
  const workloadRatingStars = getStarsString(workloadRating)

  const manageFeedbackUrl = `https://admin.uni-feedback.com/feedback/${id}`
  const viewCourseUrl = `https://uni-feedback.com/courses/${course.id}`

  const message = `
🎉 NEW REVIEW ALERT! 🎉

A fresh review just landed on Uni Feedback!!

✉️ Submitted by: ${email}
🎓 School Year: ${formatSchoolYearString(schoolYear, { yearFormat: 'long' })}
🎓 Degree: ${degree.acronym} - ${degree.name}
📚 Course: ${course.acronym} - ${course.name}
⭐ Overall Rating: ${ratingStars}
📊 Workload Rating: ${workloadRatingStars}

💬 Comment: ${comment || 'N/A'}

🔗 Manage Feedback: ${manageFeedbackUrl}
📖 View Course Page: ${viewCourseUrl}

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
