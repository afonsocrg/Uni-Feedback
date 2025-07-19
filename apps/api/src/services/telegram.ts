import { Course, Degree } from '@db/schema'
import { formatSchoolYearString } from '@uni-feedback/utils'

// Telegram
async function sendToTelegram(env: Env, message: string) {
  // Escape special characters for MarkdownV2 format
  message = message.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\$1')

  var url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`
  var payload = {
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

  let message = `
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
