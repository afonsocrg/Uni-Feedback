import { database } from '@uni-feedback/db'
import { emailPreferences, users } from '@uni-feedback/db/schema'
import { randomBytes } from 'crypto'
import { eq, inArray } from 'drizzle-orm'
import { Resend } from 'resend'
import { sendEmailStatusNotification } from './telegram'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/**
 * Convert plain text email body to HTML body content.
 * - Converts URLs to clickable anchor tags
 * - Converts double newlines to paragraph breaks
 * - Converts single newlines to <br>
 * - Escapes HTML entities
 *
 * Note: Returns just the body content, not a full HTML document.
 */
export function textToHtml(text: string): string {
  // Escape HTML entities first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Convert URLs to anchor tags
  // Match URLs that start with http:// or https://
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  html = html.replace(urlRegex, (url) => {
    // Create readable link text from URL
    const linkText = url
      .replace(/^https?:\/\//, '') // Remove protocol
      .replace(/\?.*$/, '') // Remove query params for display
    return `<a href="${url}" style="color: #23729f;">${linkText}</a>`
  })

  // Convert paragraphs (double newlines) and line breaks
  const paragraphs = html.split(/\n\n+/)
  html = paragraphs
    .map((p) => `<p style="margin: 0 0 16px 0;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n')

  return html
}

/**
 * Wrap HTML body content in a full email document template.
 */
export function wrapHtmlEmail(bodyContent: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
${bodyContent}
</body>
</html>`
}

/**
 * Add unsubscribe footer to HTML body content.
 */
export function addUnsubscribeFooter(
  bodyContent: string,
  unsubscribeLink: string
): string {
  return `${bodyContent}
<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
<p style="color: #999; font-size: 12px;">
  Don't want to receive these emails?
  <a href="${unsubscribeLink}" style="color: #999;">Unsubscribe here</a>
</p>`
}

/**
 * Prepare HTML for a campaign email: adds unsubscribe footer and wraps in document.
 */
export function prepareCampaignHtml(
  bodyContent: string,
  unsubscribeLink: string
): string {
  const withFooter = addUnsubscribeFooter(bodyContent, unsubscribeLink)
  return wrapHtmlEmail(withFooter)
}

export interface CampaignEmailContent {
  subject: string
  html?: string
  text: string
}

export interface CampaignResult {
  sent: number
  failed: number
  skipped: number
  errors: Array<{ userId: number; email: string; error: string }>
}

export class EmailService {
  private env: Env
  private resend: Resend | null

  constructor(env: Env) {
    this.env = env
    this.resend = this.env.RESEND_API_KEY
      ? new Resend(this.env.RESEND_API_KEY)
      : null
  }

  private async sendEmail(params: {
    from: string
    to: string
    subject: string
    html?: string
    text: string
    headers?: Record<string, string>
  }): Promise<void> {
    if (!this.resend) {
      console.log('📧 EMAIL MOCK (Development Mode)')
      console.log('From:', params.from)
      console.log('To:', params.to)
      console.log('Subject:', params.subject)
      console.log('Headers:', params.headers)
      console.log('HTML length:', params.html?.length ?? 0)
      console.log('Text length:', params.text.length)
      console.log('--- Email Content Start ---')
      console.log(params.text)
      console.log('--- Email Content End ---')
      console.log('---')
      return
    }

    try {
      await this.resend.emails.send(params)
      console.log(`✅ Email sent successfully to ${params.to}`)
    } catch (error) {
      console.error('❌ Failed to send email:', error)

      // Send telegram notification for failed email
      await sendEmailStatusNotification(this.env, {
        email: params.to,
        emailType: params.subject,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })

      throw new Error(`Failed to send email to ${params.to}`)
    }
  }

  /**
   * Generate a random unsubscribe token
   */
  private generateUnsubscribeToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Get or create email preferences for a user
   * Returns the unsubscribe token
   */
  async getOrCreateEmailPreferences(userId: number): Promise<string> {
    // Check if preferences exist
    const [existing] = await database()
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, userId))
      .limit(1)

    if (existing) {
      return existing.unsubscribeToken
    }

    // Create new preferences
    const token = this.generateUnsubscribeToken()
    await database().insert(emailPreferences).values({
      userId,
      unsubscribeToken: token,
      subscribedReminders: true
    })

    return token
  }

  /**
   * Send campaign emails to a list of users
   * Automatically skips unsubscribed users!
   * Automatically adds unsubscribe link and headers to each email
   *
   * @param userIds - List of user IDs to send emails to
   * @param content - Email content (subject, html, text)
   * @param options - Optional settings
   * @returns Campaign result with counts and errors
   */
  async sendCampaignEmails(
    userIds: number[],
    content: CampaignEmailContent,
    options: {
      from?: string
      delayMs?: number
    } = {}
  ): Promise<CampaignResult> {
    const { from = 'Uni Feedback <afonso@uni-feedback.com>', delayMs = 100 } =
      options

    const result: CampaignResult = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: []
    }

    // Fetch users with their email preferences
    const usersWithPrefs = await database()
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        emailPreferencesId: emailPreferences.id,
        subscribedReminders: emailPreferences.subscribedReminders,
        unsubscribeToken: emailPreferences.unsubscribeToken
      })
      .from(users)
      .leftJoin(emailPreferences, eq(users.id, emailPreferences.userId))
      .where(inArray(users.id, userIds))

    for (const user of usersWithPrefs) {
      // Skip unsubscribed users
      if (user.subscribedReminders === false) {
        console.log(`⏭️  Skipping ${user.email} (unsubscribed)`)
        result.skipped++
        continue
      }

      // Get or create unsubscribe token
      let unsubscribeToken = user.unsubscribeToken
      if (!unsubscribeToken) {
        unsubscribeToken = await this.getOrCreateEmailPreferences(user.id)
      }

      // API endpoint for one-click unsubscribe (used in List-Unsubscribe header)
      const apiUnsubscribeLink = `${this.env.API_URL}/email/unsubscribe?token=${unsubscribeToken}`
      // Website page for user-friendly unsubscribe (used in email body)
      const unsubscribeLink = `${this.env.WEBSITE_URL}/unsubscribe?token=${unsubscribeToken}`

      // Build email with unsubscribe footer, wrapped in full HTML document
      const htmlWithFooter = content.html
        ? prepareCampaignHtml(content.html, unsubscribeLink)
        : undefined

      const textWithFooter = `${content.text}

---
Don't want to receive these emails? Unsubscribe here: ${unsubscribeLink}`

      try {
        await this.sendEmail({
          from,
          to: user.email,
          subject: content.subject,
          html: htmlWithFooter,
          text: textWithFooter,
          headers: {
            'List-Unsubscribe': `<${apiUnsubscribeLink}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
          }
        })
        result.sent++
      } catch (error) {
        result.failed++
        result.errors.push({
          userId: user.id,
          email: user.email,
          error: error instanceof Error ? error.message : String(error)
        })
      }

      // Add delay between sends to avoid rate limiting
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    return result
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    username: string,
    resetToken: string,
    dashboardUrl: string
  ): Promise<void> {
    const resetLink = `${dashboardUrl}/reset-password?token=${resetToken}`

    const template: EmailTemplate = {
      subject: 'Uni Feedback - Reset Your Password',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #23729f;">Reset Your Password</h2>
              
              <p>Hi ${username},</p>
              
              <p>Click the link below to reset your password:</p>
              
              <p style="margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background-color: #23729f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Reset Password
                </a>
              </p>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetLink}</p>
              
              <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
              
              <p>If you didn't request a password, you can safely ignore this email.</p>
              
              <p>Cheers,<br>Afonso</p>
            </div>
          </body>
        </html>
      `,
      text: `Hi ${username},

Click the link below to reset your password:
${resetLink}

This link expires in 24 hours.

If you didn't request a password, you can safely ignore this email.

Cheers,
Afonso`
    }

    await this.sendEmail({
      from: 'Uni Feedback <noreply@uni-feedback.com>',
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  /**
   * Send user invitation email
   */
  async sendInvitationEmail(
    email: string,
    inviteToken: string,
    dashboardUrl: string
  ): Promise<void> {
    const inviteLink = `${dashboardUrl}/create-account?token=${inviteToken}`

    const template: EmailTemplate = {
      subject: 'Welcome to Uni Feedback!!',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #23729f;">You're Invited!</h2>
              
              <p>Hi there,</p>
              
              <p>You've been invited to join the Uni Feedback Admin Dashboard.</p>
              
              <p>Click the button below to create your account:</p>
              
              <p style="margin: 30px 0;">
                <a href="${inviteLink}" 
                   style="background-color: #23729f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Create Account
                </a>
              </p>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${inviteLink}</p>
              
              <p style="color: #666; font-size: 14px;">This link expires in 7 days.</p>
              
              <p>Cheers,<br>Afonso</p>
            </div>
          </body>
        </html>
      `,
      text: `Hi there,

You've been invited to join the Uni Feedback Admin Dashboard.

Click the link below to create your account:
${inviteLink}

This link expires in 7 days.

Cheers,
Afonso`
    }

    await this.sendEmail({
      from: 'Uni Feedback <noreply@uni-feedback.com>',
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  /**
   * Send OTP verification code email
   */
  async sendOtpEmail(email: string, otp: string): Promise<void> {
    // Format OTP with space in middle for readability: "123 456"
    const formattedOtp = `${otp.slice(0, 3)} ${otp.slice(3)}`

    const text = `Your login code is: ${formattedOtp}
This code expires in 20 minutes.

If you have a sec, replying 'Got it!' to this email helps future logins reach your inbox instantly.
It also helps other students receive their codes without delays!

Have a great day!
Afonso`

    await this.sendEmail({
      from: 'Uni Feedback <afonso@uni-feedback.com>',
      to: email,
      subject: 'Login Code for Uni Feedback',
      text: text
    })
  }

  /**
   * Send magic link email for passwordless sign in
   *
   * @deprecated Use sendOtpEmail instead. Magic links are being replaced by OTP authentication.
   */
  async sendMagicLinkEmail(
    email: string,
    magicToken: string,
    websiteUrl: string
  ): Promise<void> {
    const magicLink = `${websiteUrl}/login/${magicToken}`

    const template: EmailTemplate = {
      subject: 'Uni Feedback - Your Sign In Link',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #23729f;">Sign in to Uni Feedback</h2>

              <p>Click the button below to sign in to your account:</p>

              <p style="margin: 30px 0;">
                <a href="${magicLink}"
                   style="background-color: #23729f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Sign In
                </a>
              </p>

              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${magicLink}</p>

              <p style="color: #666; font-size: 14px;">This link expires in 15 minutes.</p>

              <p>If you didn't request this link, you can safely ignore this email.</p>

              <p>Happy reviewing!<br>The Uni Feedback Team</p>
            </div>
          </body>
        </html>
      `,
      text: `Sign in to Uni Feedback

Click the link below to sign in to your account:
${magicLink}

This link expires in 15 minutes.

If you didn't request this link, you can safely ignore this email.

Have a great day!
Afonso`
    }

    await this.sendEmail({
      from: 'Uni Feedback <noreply@uni-feedback.com>',
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  /**
   * Send feedback unapproval email
   */
  async sendFeedbackUnapprovalEmail(
    email: string,
    message: string
  ): Promise<void> {
    // Use the message as-is
    const subject = 'Uni Feedback: Please Update Your Feedback 📝'
    const messageBody = message

    // Convert markdown-style formatting to HTML
    const htmlBody = messageBody
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.+?)\]/g, '<strong>$1</strong>')

    const template: EmailTemplate = {
      subject,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <p>${htmlBody}</p>
            </div>
          </body>
        </html>
      `,
      text: `${messageBody}`
    }

    await this.sendEmail({
      from: 'Uni Feedback <afonso@uni-feedback.com>',
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }
}
