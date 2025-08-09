import { Course, Degree } from '@db/schema'
import { formatSchoolYearString } from '@uni-feedback/utils'

// Telegram
async function sendToTelegram(env: Env, message: string) {
  // Escape special characters for MarkdownV2 format
  message = message.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\$1')

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

  if (env.DEV_MODE === 'true') {
    console.log('Skipping telegram request in dev mode')
    console.log('Message:')
    console.log(payload.text)
    return null
  } else {
    // console.log('Sending telegram request', options)
    const response = await fetch(url, options)
    // console.log('Got telegram response', response)

    return response
  }
}

function getStarsString(rating: number) {
  return `${rating} - ${'⭐️'.repeat(rating)}`
  // return '⭐️'.repeat(rating) + ` (${rating})`
}

interface SendCourseReviewReceivedArgs {
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
  const { schoolYear, course, degree, email, rating, workloadRating, comment } =
    args

  const ratingStars = getStarsString(rating)
  const workloadRatingStars = getStarsString(workloadRating)

  const viewReviewUrl = `https://istfeedback.com/courses/${course.id}`

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

🔗 Review: ${viewReviewUrl}

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
